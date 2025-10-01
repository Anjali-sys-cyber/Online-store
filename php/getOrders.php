<?php
declare(strict_types=1);
header('Content-Type: application/json');
session_start();

$config = require __DIR__ . '/config.php';

try {
    $pdo = new PDO($config['dsn'], $config['user'], $config['pass'], $config['pdo_options']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'DB connection failed']);
    exit;
}

// 🔑 get user_id from session or fallback to request body
$userId = $_SESSION['user_id'] ?? null;

if (!$userId) {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);
    if (is_array($input) && !empty($input['user_id'])) {
        $userId = (int)$input['user_id'];
    }
}

if (!$userId) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Not logged in']);
    exit;
}

try {
    // ✅ fetch all orders for user
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->execute([$userId]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($orders as &$order) {
        $orderId = $order['order_id'];

        // ✅ fetch items for each order
        $itemStmt = $pdo->prepare("SELECT order_item_id, product_id, product_name, quantity, price, line_total 
                                   FROM order_items 
                                   WHERE order_id = ?");
        $itemStmt->execute([$orderId]);
        $order['items'] = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
    }

    echo json_encode(['ok' => true, 'orders' => $orders]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
