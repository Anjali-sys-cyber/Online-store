<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

$config = require __DIR__ . '/config.php';

try {
    $pdo = new PDO($config['dsn'], $config['user'], $config['pass'], $config['pdo_options']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB connection failed']);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    echo json_encode(['success' => false, 'message' => 'No input received']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Always keep user_id if logged in, plus guest fields
    $userId = !empty($input['user_id']) ? intval($input['user_id']) : null;
    $guestName = $input['guest_name'] ?? null;
    $guestEmail = $input['guest_email'] ?? null;
    // $guestPhone = $input['guest_phone'] ?? null;
    $guestAddress = $input['guest_address'] ?? null;

    $stmt = $pdo->prepare("
        INSERT INTO orders (user_id, guest_name, guest_email, guest_address, subtotal, tax, total, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    ");
    $stmt->execute([
        $userId,
        $guestName,
        $guestEmail,
        // $guestPhone,
        $guestAddress,
        $input['subtotal'] ?? 0,
        $input['tax'] ?? 0,
        $input['total'] ?? 0
    ]);

    $orderId = $pdo->lastInsertId();

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
