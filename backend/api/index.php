<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once 'config/cors.php';

// CORS 설정
setCorsHeaders();

// 라우팅
$request = $_GET['request'] ?? '';
$routes = explode('/', $request);

$resource = $routes[0] ?? '';

switch($resource) {
    case 'auth':
        require_once 'routes/auth.php';
        break;
    case 'posts':
        require_once 'routes/posts.php';
        break;
    case 'users':
        require_once 'routes/users.php';
        break;
    case 'upload':
        require_once 'routes/upload.php';
        break;
    case '':
        echo json_encode([
            'status' => 'success',
            'message' => 'YourCode API is running',
            'version' => '1.0.0'
        ]);
        break;
    default:
        http_response_code(404);
        echo json_encode(['message' => 'Route not found']);
}
?>