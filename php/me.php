<?php
// /Online-store/php/me.php — return fresh user data from DB (includes phone)
header('Content-Type: application/json');
session_start();

if (empty($_SESSION['user_id'])) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'Not authenticated']);
  exit;
}

$config = require __DIR__ . '/config.php';

try {
  $pdo = new PDO($config['dsn'], $config['user'], $config['pass'], $config['pdo_options']);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'DB connection failed']);
  exit;
}

$stm = $pdo->prepare("
  SELECT user_id, username, email, role, first_name, last_name, phone
  FROM users
  WHERE user_id = ?
  LIMIT 1
");
$stm->execute([ (int)$_SESSION['user_id'] ]);
$row = $stm->fetch(PDO::FETCH_ASSOC);

if (!$row) {
  session_unset(); session_destroy();
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'User not found']);
  exit;
}

// refresh session snapshot (optional but keeps things in sync)
$_SESSION['username']   = $row['username'];
$_SESSION['email']      = $row['email'];
$_SESSION['role']       = $row['role'];
$_SESSION['first_name'] = $row['first_name'];
$_SESSION['last_name']  = $row['last_name'];
$_SESSION['phone']      = $row['phone'];

echo json_encode([
  'ok'         => true,
  'user_id'    => (int)$row['user_id'],
  'username'   => $row['username'],
  'email'      => $row['email'],
  'role'       => $row['role'],
  'first_name' => $row['first_name'],
  'last_name'  => $row['last_name'],
  'phone'      => $row['phone'],
]);
