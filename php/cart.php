<?php
session_start();
require_once "db.php";

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// ✅ Must be logged in
if (!isset($_SESSION['user_id'])) {
  echo json_encode(['ok' => false, 'error' => 'Not logged in']);
  exit;
}

$userId = (int)$_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

try {
  if ($method === 'GET') {
    // 👀 Test query first
    $sql = "
      SELECT 
        uc.product_id,
        uc.quantity,
        p.id   AS product_id,
        p.name,
        p.price,
        p.image
      FROM user_cart uc
      INNER JOIN products p ON uc.product_id = p.id
      WHERE uc.user_id = ?
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['ok' => true, 'cart' => $rows]);
  }

  elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data || !isset($data['product_id'])) {
      echo json_encode(['ok' => false, 'error' => 'Invalid input']);
      exit;
    }

    $pid = (int)$data['product_id'];
    $qty = max(1, (int)($data['quantity'] ?? 1));

    $stmt = $pdo->prepare("
      INSERT INTO user_cart (user_id, product_id, quantity)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)
    ");
    $stmt->execute([$userId, $pid, $qty]);

    echo json_encode(['ok' => true]);
  }

  elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data || !isset($data['product_id'])) {
      echo json_encode(['ok' => false, 'error' => 'Invalid input']);
      exit;
    }
    $pid = (int)$data['product_id'];

    $stmt = $pdo->prepare("DELETE FROM user_cart WHERE user_id=? AND product_id=?");
    $stmt->execute([$userId, $pid]);

    echo json_encode(['ok' => true]);
  }

  else {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
  }
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode([
    'ok'    => false,
    'error' => $e->getMessage(),
    'trace' => $e->getTraceAsString()
  ]);
}
