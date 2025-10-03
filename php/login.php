<?php
// login.php — authenticates a user and starts a session
ini_set('display_errors','1');
ini_set('display_startup_errors','1');
error_reporting(E_ALL);
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
  exit;
}

// Read JSON body (fallback to form POST)
$raw   = file_get_contents('php://input');
$input = json_decode($raw, true);
if (!is_array($input)) {
  $input = $_POST;
}

$email      = isset($input['email']) ? strtolower(trim($input['email'])) : '';
$password   = isset($input['password']) ? (string)$input['password'] : '';
$guestCart  = isset($input['guestCart']) && is_array($input['guestCart']) ? $input['guestCart'] : [];

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(422);
  echo json_encode(['ok'=>false,'error'=>'Invalid email']);
  exit;
}
if ($password === '') {
  http_response_code(422);
  echo json_encode(['ok'=>false,'error'=>'Password required']);
  exit;
}

// Connect DB
$config = require __DIR__ . '/config.php';
try {
  $pdo = new PDO($config['dsn'], $config['user'], $config['pass'], $config['pdo_options']);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'DB connection failed']);
  exit;
}

// Lookup user
$stm = $pdo->prepare('SELECT user_id, username, email, password_hash, role, first_name, last_name
                      FROM users WHERE email = ? LIMIT 1');
$stm->execute([$email]);
$user = $stm->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($password, $user['password_hash'])) {
  http_response_code(401);
  echo json_encode(['ok'=>false,'error'=>'Invalid credentials']);
  exit;
}

/* ----------------- SESSION LIFETIME: 1 HOUR ----------------- */
$lifetime = 3600; // seconds
ini_set('session.gc_maxlifetime', (string)$lifetime);

session_set_cookie_params([
  'lifetime' => $lifetime,
  'path'     => '/',
  'domain'   => '',      // leave empty for localhost
  'secure'   => false,   // change to true if HTTPS
  'httponly' => true,
  'samesite' => 'Lax',
]);

session_start();
session_regenerate_id(true);

// Save essentials in session
$_SESSION['user_id']       = (int)$user['user_id'];
$_SESSION['username']      = $user['username'];
$_SESSION['role']          = $user['role'];
$_SESSION['first_name']    = $user['first_name'];
$_SESSION['last_name']     = $user['last_name'];
$_SESSION['email']         = $user['email'];
$_SESSION['last_activity'] = time();

/* ✅ Merge guest cart into DB cart */
// ✅ Merge guest cart into DB
if (!empty($guestCart) && is_array($guestCart)) {
  foreach ($guestCart as $item) {
    $pid = (int)($item['id'] ?? 0);
    $qty = (int)($item['quantity'] ?? 0);

    if ($pid > 0 && $qty > 0) {
      $stmt = $pdo->prepare("
        INSERT INTO user_cart (user_id, product_id, quantity)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
      ");
      $stmt->execute([$_SESSION['user_id'], $pid, $qty]);
    }
  }
}

error_log("guestCart: " . json_encode($guestCart));

/* ✅ Return user data */
echo json_encode([
  'ok'        => true,
  'message'   => 'Login successful',
  'user_id'   => (int)$user['user_id'],
  'username'  => $user['username'],
  'role'      => $user['role'],
  'first_name'=> $user['first_name'],
  'last_name' => $user['last_name'],
  'email'     => $user['email']
]);
