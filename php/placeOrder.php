<?php
// productOrder.php (was place_order.php)

// Enable error reporting (remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

// Load DB config
$config = require __DIR__ . '/config.php';

try {
    $pdo = new PDO($config['dsn'], $config['user'], $config['pass'], $config['pdo_options']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB connection failed: ' . $e->getMessage()]);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents("php://input"), true);

if (!$input) {
    echo json_encode(['success' => false, 'message' => 'No input received']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Insert into orders
    $stmt = $pdo->prepare("
        INSERT INTO orders (user_id, guest_name, guest_email, guest_address, subtotal, tax, total, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    ");
    $stmt->execute([
        null, // user_id → null for guest checkout
        $input['guest_name'] ?? null,
        $input['guest_email'] ?? null,
        $input['guest_address'] ?? null,
        $input['subtotal'] ?? 0,
        $input['tax'] ?? 0,
        $input['total'] ?? 0
    ]);

    $orderId = $pdo->lastInsertId();

    // Insert order items
    $stmtItem = $pdo->prepare("
        INSERT INTO order_items (order_id, product_id, product_name, quantity, price, line_total)
        VALUES (?, ?, ?, ?, ?, ?)
    ");

    foreach ($input['items'] as $item) {
        $stmtItem->execute([
            $orderId,
            $item['product_id'],
            $item['product_name'],
            $item['quantity'],
            $item['price'],
            $item['line_total']
        ]);
    }

    $pdo->commit();

    echo json_encode(['success' => true, 'order_id' => $orderId]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
