<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

session_start();

// Quick GET probe
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  echo json_encode(['ok'=>true, 'message'=>'Upload endpoint alive']);
  exit;
}

// Validate file
if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
  http_response_code(400);
  echo json_encode(['ok'=>false,'where'=>'files','error'=>'No file uploaded']);
  exit;
}

$f = $_FILES['file'];

// Limit size (4 MB)
$maxBytes = 4*1024*1024;
if ($f['size'] > $maxBytes) {
  http_response_code(413);
  echo json_encode(['ok'=>false,'where'=>'size','error'=>'File too large (max 4MB)']);
  exit;
}

// Ensure it’s an image
$info = @getimagesize($f['tmp_name']);
if ($info === false) {
  http_response_code(415);
  echo json_encode(['ok'=>false,'where'=>'type','error'=>'Not an image']);
  exit;
}

$ext = match ($info['mime']) {
  'image/jpeg' => 'jpg',
  'image/png'  => 'png',
  'image/webp' => 'webp',
  'image/gif'  => 'gif',
  default      => null,
};
if (!$ext) {
  http_response_code(415);
  echo json_encode(['ok'=>false,'where'=>'mime','error'=>'Unsupported format']);
  exit;
}

// Save into assets/images/products
$root = realpath(__DIR__ . '/..'); 
$dir  = $root . '/assets/images/products';

if (!is_dir($dir)) {
    if (!mkdir($dir, 0775, true)) {
        http_response_code(500);
        echo json_encode(['ok'=>false,'where'=>'dir','error'=>'Failed to create directory: '.$dir]);
        exit;
    }
}

if (!is_writable($dir)) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'where'=>'perm','error'=>'Directory not writable: '.$dir]);
    exit;
}


$basename = bin2hex(random_bytes(8)) . '.' . $ext;
$targetFs = $dir . '/' . $basename;

if (!@move_uploaded_file($f['tmp_name'], $targetFs)) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'where'=>'move','error'=>'Move failed']);
  exit;
}

// Public URL relative to web root
$publicUrl = "/Online-store/assets/images/products/" . $basename;

echo json_encode(['ok'=>true, 'message'=>'Uploaded', 'url'=>$publicUrl]);
