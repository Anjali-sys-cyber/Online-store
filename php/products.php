<?php
// Enable full error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set response as JSON
header('Content-Type: application/json');

// Load DB config
$config = require __DIR__ . '/config.php';

try {
    $pdo = new PDO($config['dsn'], $config['user'], $config['pass'], $config['pdo_options']);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

// Determine action
$action = $_GET['action'] ?? $_POST['action'] ?? 'read';

switch ($action) {
    case 'read':
        // Fetch all products
        try {
            $stmt = $pdo->query("SELECT * FROM products ORDER BY id DESC");
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($products);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to fetch products: ' . $e->getMessage()]);
        }
        break;

    case 'create':
        // Create a new product
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) {
            echo json_encode(['error' => 'No input data']);
            exit;
        }
        try {
            $stmt = $pdo->prepare("INSERT INTO products (name, category_id, price, description, image, isNew, rating, reviews, colors, sizes, inStock) VALUES (:name, :category_id, :price, :description, :image, :isNew, :rating, :reviews, :colors, :sizes, :inStock)");
            $stmt->execute([
                ':name' => $data['name'] ?? '',
                ':category_id' => $data['category_id'] ?? null,
                ':price' => $data['price'] ?? 0,
                ':description' => $data['description'] ?? '',
                ':image' => $data['image'] ?? '',
                ':isNew' => $data['isNew'] ?? 0,
                ':rating' => $data['rating'] ?? 0,
                ':reviews' => $data['reviews'] ?? 0,
                ':colors' => isset($data['colors']) ? json_encode($data['colors']) : json_encode([]),
                ':sizes' => isset($data['sizes']) ? json_encode($data['sizes']) : json_encode([]),
                ':inStock' => $data['inStock'] ?? 1,
            ]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to create product: ' . $e->getMessage()]);
        }
        break;

    case 'update':
        // Update existing product
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['id'])) {
            echo json_encode(['error' => 'No product ID or data provided']);
            exit;
        }
        try {
            $stmt = $pdo->prepare("UPDATE products SET name=:name, category_id=:category_id, price=:price, description=:description, image=:image, isNew=:isNew, rating=:rating, reviews=:reviews, colors=:colors, sizes=:sizes, inStock=:inStock WHERE id=:id");
            $stmt->execute([
                ':id' => $data['id'],
                ':name' => $data['name'] ?? '',
                ':category_id' => $data['category_id'] ?? null,
                ':price' => $data['price'] ?? 0,
                ':description' => $data['description'] ?? '',
                ':image' => $data['image'] ?? '',
                ':isNew' => $data['isNew'] ?? 0,
                ':rating' => $data['rating'] ?? 0,
                ':reviews' => $data['reviews'] ?? 0,
                ':colors' => isset($data['colors']) ? json_encode($data['colors']) : json_encode([]),
                ':sizes' => isset($data['sizes']) ? json_encode($data['sizes']) : json_encode([]),
                ':inStock' => $data['inStock'] ?? 1,
            ]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to update product: ' . $e->getMessage()]);
        }
        break;

    case 'delete':
        // Delete product
        $id = $_GET['id'] ?? null;
        if (!$id) {
            echo json_encode(['error' => 'No product ID provided']);
            exit;
        }
        try {
            $stmt = $pdo->prepare("DELETE FROM products WHERE id=:id");
            $stmt->execute([':id' => $id]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            echo json_encode(['error' => 'Failed to delete product: ' . $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(['error' => 'Invalid action']);
        break;
}
