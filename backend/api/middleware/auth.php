<?php
require_once __DIR__ . '/../../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

function authenticate() {
    $headers = getallheaders();
    $token = $headers['Authorization'] ?? '';
    
    if(empty($token)) {
        http_response_code(401);
        echo json_encode(['message' => 'No token provided']);
        return false;
    }
    
    $token = str_replace('Bearer ', '', $token);
    
    try {
        // 하드코딩된 키 사용 (개발 환경)
        $key = 'your_very_secret_key_here_change_this';
        $decoded = JWT::decode($token, new Key($key, 'HS256'));
        
        return $decoded->data->id;
    } catch(Exception $e) {
        http_response_code(401);
        echo json_encode(['message' => 'Invalid token']);
        return false;
    }
}
?>