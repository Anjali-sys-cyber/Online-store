<?php
// login.php — authenticates a user and starts a session
ini_set('display_errors','1'); ini_set('display_startup_errors','1'); error_reporting(E_ALL);
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
  exit;
}

// Read JSON body (fallback to form)
$raw   = file_get_contents('php://input');
$input = json_decode($raw, true);
if (!is_array($input)) { $input = $_POST; }

$email    = isset($input['email']) ? strtolower(trim($input['email'])) : '';
$password = isset($input['password']) ? (string)$input['password'] : '';

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(422); echo json_encode(['ok'=>false,'error'=>'Invalid email']); exit;
}
if ($password === '') {
  http_response_code(422); echo json_encode(['ok'=>false,'error'=>'Password required']); exit;
}

// Connect DB
$config = require __DIR__ . '/config.php';
try {
  $pdo = new PDO($config['dsn'], $config['user'], $config['pass'], $config['pdo_options']);
} catch (Exception $e) {
  http_response_code(500); echo json_encode(['ok'=>false,'error'=>'DB connection failed']); exit;
}

// Lookup user
$stm = $pdo->prepare('SELECT user_id, username, email, password_hash, role, first_name, last_name
                      FROM users WHERE email = ? LIMIT 1');
$stm->execute([$email]);
$user = $stm->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
  http_response_code(401); echo json_encode(['ok'=>false,'error'=>'Invalid credentials']); exit;
}

/* ----------------- SESSION LIFETIME: 1 HOUR ----------------- */
$lifetime = 3600; // seconds (1 hour)
ini_set('session.gc_maxlifetime', (string)$lifetime);  // keep session files this long

session_set_cookie_params([
  'lifetime' => $lifetime,
  'path'     => '/',
  'domain'   => '',      // leave empty for localhost
  'secure'   => false,   // true if you use HTTPS
  'httponly' => true,
  'samesite' => 'Lax',
]);
/* ------------------------------------------------------------ */

session_start();
session_regenerate_id(true);

// Save essentials in session
$_SESSION['user_id']       = (int)$user['user_id'];
$_SESSION['username']      = $user['username'];
$_SESSION['role']          = $user['role'];
$_SESSION['first_name']    = $user['first_name'];
$_SESSION['last_name']     = $user['last_name'];
$_SESSION['email']         = $user['email'];
$_SESSION['last_activity'] = time(); // for idle-time checks

echo json_encode([
  'ok'       => true,
  'message'  => 'Login successful',
  'role'     => $user['role'],
  'username' => $user['username']
]);
