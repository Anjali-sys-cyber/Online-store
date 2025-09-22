<?php
ini_set('display_errors','1'); ini_set('display_startup_errors','1'); error_reporting(E_ALL);
header('Content-Type: application/json');

session_start();
if (empty($_SESSION['user_id'])) { http_response_code(401); echo json_encode(['ok'=>false,'error'=>'Not logged in']); exit; }
$uid = (int)$_SESSION['user_id'];

if (empty($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
  http_response_code(400); echo json_encode(['ok'=>false,'error'=>'No file']); exit;
}
$f = $_FILES['avatar'];
if ($f['size'] > 2*1024*1024) { http_response_code(413); echo json_encode(['ok'=>false,'error'=>'Max 2MB']); exit; }

$info = getimagesize($f['tmp_name']); if ($info === false) { http_response_code(415); echo json_encode(['ok'=>false,'error'=>'Not an image']); exit; }
$ext = match ($info['mime']) { 'image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp','image/gif'=>'gif', default=>null };
if (!$ext) { http_response_code(415); echo json_encode(['ok'=>false,'error'=>'Unsupported format']); exit; }

$root = realpath(__DIR__ . '/..');
$dir = $root . '/uploads/avatars';
if (!is_dir($dir)) { mkdir($dir, 0775, true); }
foreach (glob($dir . "/{$uid}.*") as $old) { @unlink($old); }

$target = $dir . "/{$uid}.{$ext}";
if (!move_uploaded_file($f['tmp_name'], $target)) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'Upload failed']); exit; }

echo json_encode(['ok'=>true,'message'=>'Avatar uploaded','url'=>"/Online-store/uploads/avatars/{$uid}.{$ext}"]);
