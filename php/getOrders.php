<?php
// /Online-store/php/getOrders.php
header('Content-Type: application/json');
session_start();

if (empty($_SESSION['user_id'])) {
  echo json_encode([
    'ok' => false,
    'reason' => 'no-session',
    'session_dump' => $_SESSION, // 👀 debug: see session values
  ]);
  exit;
}

$config = require __DIR__ . '/config.php';

try {
  $pdo = new PDO($config['dsn'], $config['user'], $config['pass'], $config['pdo_options']);
} catch (Throwable $e) {
  echo json_encode(['ok' => false, 'reason' => 'db-fail', 'error' => $e->getMessage()]);
  exit;
}

$userId = (int)$_SESSION['user_id'];

$stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC");
$stmt->execute([$userId]);
$orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($orders as &$order) {
  $stmtItems = $pdo->prepare("SELECT * FROM order_items WHERE order_id = ?");
  $stmtItems->execute([$order['order_id']]);
  $order['items'] = $stmtItems->fetchAll(PDO::FETCH_ASSOC);
}

echo json_encode(['ok' => true, 'user_id' => $userId, 'orders' => $orders]);
