<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

setCorsHeaders();

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));
$action = $_GET['action'] ?? '';

switch($action) {
    case 'register':
        register($db, $data);
        break;
    case 'login':
        login($db, $data);
        break;
    case 'verify':
        verifyToken();
        break;
    default:
        http_response_code(404);
        echo json_encode(['message' => 'Action not found']);
}

function register($db, $data) {
    if(empty($data->username) || empty($data->email) || empty($data->password)) {
        http_response_code(400);
        echo json_encode(['message' => 'Missing required fields']);
        return;
    }
    
    // Check if user exists
    $query = "SELECT id FROM users WHERE email = :email OR username = :username";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $data->email);
    $stmt->bindParam(':username', $data->username);
    $stmt->execute();
    
    if($stmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(['message' => 'User already exists']);
        return;
    }
    
    // Create user
    $query = "INSERT INTO users (username, email, password) VALUES (:username, :email, :password)";
    $stmt = $db->prepare($query);
    
    $hashedPassword = password_hash($data->password, PASSWORD_DEFAULT);
    
    $stmt->bindParam(':username', $data->username);
    $stmt->bindParam(':email', $data->email);
    $stmt->bindParam(':password', $hashedPassword);
    
    if($stmt->execute()) {
        $userId = $db->lastInsertId();
        $token = generateJWT($userId, $data->username, $data->email);
        
        echo json_encode([
            'message' => 'User created successfully',
            'token' => $token,
            'user' => [
                'id' => $userId,
                'username' => $data->username,
                'email' => $data->email
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['message' => 'Failed to create user']);
    }
}

function login($db, $data) {
    if(empty($data->username) || empty($data->password)) {
        http_response_code(400);
        echo json_encode(['message' => 'Missing username or password']);
        return;
    }
    
    $query = "SELECT id, username, email, password, profile_image, bio FROM users WHERE username = :username OR email = :username";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':username', $data->username);
    $stmt->execute();
    
    if($stmt->rowCount() == 0) {
        http_response_code(401);
        echo json_encode(['message' => 'Invalid credentials']);
        return;
    }
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if(password_verify($data->password, $user['password'])) {
        $token = generateJWT($user['id'], $user['username'], $user['email']);
        
        unset($user['password']);
        
        echo json_encode([
            'message' => 'Login successful',
            'token' => $token,
            'user' => $user
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['message' => 'Invalid credentials']);
    }
}

function generateJWT($userId, $username, $email) {
    $key = $_ENV['JWT_SECRET'];
    $payload = [
        'iss' => 'yourcode',
        'aud' => 'yourcode',
        'iat' => time(),
        'exp' => time() + (60 * 60 * 24), // 24 hours
        'data' => [
            'id' => $userId,
            'username' => $username,
            'email' => $email
        ]
    ];
    
    return JWT::encode($payload, $key, 'HS256');
}

function verifyToken() {
    $headers = getallheaders();
    $token = $headers['Authorization'] ?? '';
    
    if(empty($token)) {
        http_response_code(401);
        echo json_encode(['message' => 'No token provided']);
        return;
    }
    
    $token = str_replace('Bearer ', '', $token);
    
    try {
        $key = $_ENV['JWT_SECRET'];
        $decoded = JWT::decode($token, new Key($key, 'HS256'));
        
        echo json_encode([
            'valid' => true,
            'user' => $decoded->data
        ]);
    } catch(Exception $e) {
        http_response_code(401);
        echo json_encode([
            'valid' => false,
            'message' => 'Invalid token'
        ]);
    }
}
?>