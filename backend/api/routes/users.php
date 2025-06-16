<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();

$database = new Database();
$db = $database->getConnection();

$userId = authenticate();
if(!$userId) {
    exit();
}

$action = $_GET['action'] ?? '';

switch($action) {
    case 'search':
        searchUsers($db, $_GET['q'] ?? '');
        break;
    case 'profile':
        getUserProfile($db, $_GET['id'] ?? $userId);
        break;
    case 'update':
        updateProfile($db, $userId);
        break;
    default:
        http_response_code(404);
        echo json_encode(['message' => 'Action not found']);
}

function searchUsers($db, $query) {
    if(strlen($query) < 2) {
        echo json_encode([]);
        return;
    }
    
    $searchQuery = "%$query%";
    $sql = "SELECT id, username, email, profile_image, bio 
            FROM users 
            WHERE username LIKE :query OR email LIKE :query
            LIMIT 20";
    
    $stmt = $db->prepare($sql);
    $stmt->bindParam(':query', $searchQuery);
    $stmt->execute();
    
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($users);
}

function getUserProfile($db, $profileId) {
    $query = "SELECT u.id, u.username, u.email, u.profile_image, u.bio, u.github_url, u.created_at,
              (SELECT COUNT(*) FROM code_posts WHERE user_id = u.id AND is_active = true) as post_count,
              (SELECT COUNT(*) FROM likes l JOIN code_posts cp ON l.code_post_id = cp.id WHERE cp.user_id = u.id) as likes_received
              FROM users u
              WHERE u.id = :userId";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':userId', $profileId);
    $stmt->execute();
    
    if($stmt->rowCount() == 0) {
        http_response_code(404);
        echo json_encode(['message' => 'User not found']);
        return;
    }
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode($user);
}

function updateProfile($db, $userId) {
    $data = json_decode(file_get_contents("php://input"));
    
    $updates = [];
    $params = ['id' => $userId];
    
    if(isset($data->bio)) {
        $updates[] = "bio = :bio";
        $params['bio'] = $data->bio;
    }
    
    if(isset($data->profile_image)) {
        $updates[] = "profile_image = :profile_image";
        $params['profile_image'] = $data->profile_image;
    }
    
    if(isset($data->github_url)) {
        $updates[] = "github_url = :github_url";
        $params['github_url'] = $data->github_url;
    }
    
    if(empty($updates)) {
        http_response_code(400);
        echo json_encode(['message' => 'No fields to update']);
        return;
    }
    
    $query = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = :id";
    $stmt = $db->prepare($query);
    
    foreach($params as $key => $value) {
        $stmt->bindValue(":$key", $value);
    }
    
    if($stmt->execute()) {
        echo json_encode(['message' => 'Profile updated successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['message' => 'Failed to update profile']);
    }
}
?>