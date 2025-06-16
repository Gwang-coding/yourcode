<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();

// 디버깅: 요청 정보 로깅
error_log("Request Method: " . $_SERVER['REQUEST_METHOD']);
error_log("FILES: " . print_r($_FILES, true));
error_log("POST: " . print_r($_POST, true));

$userId = authenticate();
if(!$userId) {
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit();
}

// 업로드 디렉토리 생성
$uploadDir = __DIR__ . '/../../uploads/';
if (!file_exists($uploadDir)) {
    if (!mkdir($uploadDir, 0777, true)) {
        http_response_code(500);
        echo json_encode(['message' => 'Failed to create upload directory']);
        exit();
    }
}

// 파일 업로드 처리
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    $error = isset($_FILES['image']) ? $_FILES['image']['error'] : 'No file';
    http_response_code(400);
    echo json_encode(['message' => 'No image file provided or upload error: ' . $error]);
    exit();
}

$file = $_FILES['image'];
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// 파일 유효성 검사
if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed']);
    exit();
}

// 파일 크기 제한 (5MB)
if ($file['size'] > 5 * 1024 * 1024) {
    http_response_code(400);
    echo json_encode(['message' => 'File size must be less than 5MB']);
    exit();
}

// 고유한 파일명 생성
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = uniqid('code_' . $userId . '_') . '.' . $extension;
$filepath = $uploadDir . $filename;

// 파일 이동
if (move_uploaded_file($file['tmp_name'], $filepath)) {
    // 웹에서 접근 가능한 URL 생성
    $imageUrl = '/uploads/' . $filename;
    
    echo json_encode([
        'success' => true,
        'url' => $imageUrl,
        'filename' => $filename
    ]);
} else {
    http_response_code(500);
    echo json_encode(['message' => 'Failed to upload file']);
}
?>