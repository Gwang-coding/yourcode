<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();

$database = new Database();
$db = $database->getConnection();

// 인증 확인
$userId = authenticate();
if(!$userId) {
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch($method) {
    case 'GET':
        if($action == 'swipe') {
            getSwipeablePosts($db, $userId);
        } elseif($action == 'user') {
            getUserPosts($db, $userId, $_GET['userId'] ?? $userId);
        } elseif($action == 'detail') {
            getPostDetail($db, $_GET['id'] ?? 0);
        } else {
            getAllPosts($db);
        }
        break;
    case 'POST':
        if($action == 'like') {
            likePost($db, $userId);
        } elseif($action == 'pass') {
            passPost($db, $userId);
        } else {
            createPost($db, $userId);
        }
        break;
    case 'DELETE':
        deletePost($db, $userId, $_GET['id'] ?? 0);
        break;
    default:
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
}

function getSwipeablePosts($db, $userId) {
    // 이미 좋아요하거나 패스한 게시물 제외
    $query = "SELECT cp.*, u.username, u.profile_image 
              FROM code_posts cp
              JOIN users u ON cp.user_id = u.id
              WHERE cp.user_id != :userId
              AND cp.id NOT IN (
                  SELECT code_post_id FROM likes WHERE user_id = :userId
                  UNION
                  SELECT code_post_id FROM passes WHERE user_id = :userId
              )
              AND cp.is_active = true
              ORDER BY cp.created_at DESC
              LIMIT 10";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':userId', $userId);
    $stmt->execute();
    
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($posts);
}

function getUserPosts($db, $currentUserId, $targetUserId) {
    $query = "SELECT cp.*, u.username, u.profile_image,
              (SELECT COUNT(*) FROM likes WHERE code_post_id = cp.id) as like_count,
              EXISTS(SELECT 1 FROM likes WHERE code_post_id = cp.id AND user_id = :currentUserId) as is_liked
              FROM code_posts cp
              JOIN users u ON cp.user_id = u.id
              WHERE cp.user_id = :targetUserId
              AND cp.is_active = true
              ORDER BY cp.created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':currentUserId', $currentUserId);
    $stmt->bindParam(':targetUserId', $targetUserId);
    $stmt->execute();
    
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($posts);
}

function createPost($db, $userId) {
    $data = json_decode(file_get_contents("php://input"));
    
    if(empty($data->code_image) || empty($data->title)) {
        http_response_code(400);
        echo json_encode(['message' => 'Missing required fields']);
        return;
    }
    
    $query = "INSERT INTO code_posts (user_id, title, code_image, language, description) 
              VALUES (:userId, :title, :code_image, :language, :description)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':userId', $userId);
    $stmt->bindParam(':title', $data->title);
    $stmt->bindParam(':code_image', $data->code_image);
    $stmt->bindParam(':language', $data->language);
    $stmt->bindParam(':description', $data->description);
    
    if($stmt->execute()) {
        echo json_encode([
            'message' => 'Post created successfully',
            'id' => $db->lastInsertId()
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['message' => 'Failed to create post']);
    }
}

function likePost($db, $userId) {
    $data = json_decode(file_get_contents("php://input"));
    $postId = $data->postId ?? 0;
    
    // 좋아요 추가
    $query = "INSERT INTO likes (user_id, code_post_id) VALUES (:userId, :postId)
              ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':userId', $userId);
    $stmt->bindParam(':postId', $postId);
    
    if($stmt->execute()) {
        // 상호 좋아요 확인
        checkMatch($db, $userId, $postId);
        
        echo json_encode(['message' => 'Post liked successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['message' => 'Failed to like post']);
    }
}

function passPost($db, $userId) {
    $data = json_decode(file_get_contents("php://input"));
    $postId = $data->postId ?? 0;
    
    $query = "INSERT INTO passes (user_id, code_post_id) VALUES (:userId, :postId)
              ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':userId', $userId);
    $stmt->bindParam(':postId', $postId);
    
    if($stmt->execute()) {
        echo json_encode(['message' => 'Post passed successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['message' => 'Failed to pass post']);
    }
}

function checkMatch($db, $userId, $postId) {
    // 게시물 작성자 찾기
    $query = "SELECT user_id FROM code_posts WHERE id = :postId";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':postId', $postId);
    $stmt->execute();
    
    $postOwnerId = $stmt->fetchColumn();
    
    // 상호 좋아요 확인
    $query = "SELECT COUNT(*) FROM likes l
              JOIN code_posts cp ON l.code_post_id = cp.id
              WHERE l.user_id = :postOwnerId AND cp.user_id = :userId";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':postOwnerId', $postOwnerId);
    $stmt->bindParam(':userId', $userId);
    $stmt->execute();
    
    if($stmt->fetchColumn() > 0) {
        // 매치 생성
        $user1 = min($userId, $postOwnerId);
        $user2 = max($userId, $postOwnerId);
        
        $query = "INSERT INTO matches (user1_id, user2_id) VALUES (:user1, :user2)
                  ON DUPLICATE KEY UPDATE is_active = true";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user1', $user1);
        $stmt->bindParam(':user2', $user2);
        $stmt->execute();
    }
}

function deletePost($db, $userId, $postId) {
    $query = "UPDATE code_posts SET is_active = false 
              WHERE id = :postId AND user_id = :userId";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':postId', $postId);
    $stmt->bindParam(':userId', $userId);
    
    if($stmt->execute() && $stmt->rowCount() > 0) {
        echo json_encode(['message' => 'Post deleted successfully']);
    } else {
        http_response_code(404);
        echo json_encode(['message' => 'Post not found or unauthorized']);
    }
}

function getAllPosts($db) {
    $query = "SELECT cp.*, u.username, u.profile_image,
              (SELECT COUNT(*) FROM likes WHERE code_post_id = cp.id) as like_count
              FROM code_posts cp
              JOIN users u ON cp.user_id = u.id
              WHERE cp.is_active = true
              ORDER BY cp.created_at DESC
              LIMIT 50";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($posts);
}

function getPostDetail($db, $postId) {
    $query = "SELECT cp.*, u.username, u.profile_image, u.bio,
              (SELECT COUNT(*) FROM likes WHERE code_post_id = cp.id) as like_count,
              cp.created_at, cp.view_count
              FROM code_posts cp
              JOIN users u ON cp.user_id = u.id
              WHERE cp.id = :postId AND cp.is_active = true";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':postId', $postId);
    $stmt->execute();
    
    if($stmt->rowCount() == 0) {
        http_response_code(404);
        echo json_encode(['message' => 'Post not found']);
        return;
    }
    
    $post = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // 조회수 증가
    $updateQuery = "UPDATE code_posts SET view_count = view_count + 1 WHERE id = :postId";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':postId', $postId);
    $updateStmt->execute();
    
    $post['view_count']++;
    
    echo json_encode($post);
}
?>