<?php
// TEMP: show errors while debugging
ini_set('display_errors','1');
ini_set('display_startup_errors','1');
error_reporting(E_ALL);

header('Content-Type: application/json');

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(array('ok' => false, 'error' => 'Method not allowed'));
  exit;
}

// Load DB config and connect
$config = require __DIR__ . '/config.php';
try {
  $pdo = new PDO($config['dsn'], $config['user'], $config['pass'], $config['pdo_options']);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(array('ok' => false, 'error' => 'DB connection failed'));
  exit;
}

// Read JSON body (fallback to form POST)
$raw   = file_get_contents('php://input');
$input = json_decode($raw, true);
if (!is_array($input)) { $input = $_POST; }

// Collect fields
$fullname = isset($input['fullname']) ? trim($input['fullname']) : '';
$email    = isset($input['email']) ? strtolower(trim($input['email'])) : '';
$pass     = isset($input['password']) ? (string)$input['password'] : '';
$pass2    = isset($input['confirmPassword']) ? (string)$input['confirmPassword'] : '';

// ✅ NEW: read role from request (default to 'user'); normalize & validate to match ENUM
$role     = isset($input['role']) ? strtolower(trim((string)$input['role'])) : 'user';
if ($role !== 'user' && $role !== 'admin') {
  $role = 'user'; // keep table happy if something else was sent
}

// Basic validation
if ($fullname === '' || !preg_match("/^[A-Za-z' -]{2,}$/u", $fullname)) {
  http_response_code(422); echo json_encode(array('ok'=>false,'error'=>'Invalid full name')); exit;
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(422); echo json_encode(array('ok'=>false,'error'=>'Invalid email')); exit;
}
if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&]).{8,72}$/', $pass)) {
  http_response_code(422); echo json_encode(array('ok'=>false,'error'=>'Weak password')); exit;
}
if ($pass !== $pass2) {
  http_response_code(422); echo json_encode(array('ok'=>false,'error'=>'Passwords do not match')); exit;
}

// Ensure email is unique
$stm = $pdo->prepare('SELECT 1 FROM users WHERE email = ? LIMIT 1');
$stm->execute(array($email));
if ($stm->fetch()) {
  http_response_code(409); echo json_encode(array('ok'=>false,'error'=>'Email already registered')); exit;
}

// Split name
$parts = preg_split('/\s+/', $fullname);
$first = isset($parts[0]) ? $parts[0] : '';
$last  = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : '';

// Generate unique username from email local-part
$base = preg_replace('/[^A-Za-z0-9_]/', '_', explode('@', $email)[0]);
if ($base === '') $base = 'user';
$base = substr($base, 0, 30);
$username = $base;

$chk  = $pdo->prepare('SELECT 1 FROM users WHERE username = ? LIMIT 1');
$i = 0;
while (true) {
  $chk->execute(array($username));
  if (!$chk->fetch()) break;
  $i++;
  $username = substr($base, 0, 28) . $i; // keep <= 30 chars
}

// Insert user
$hash = password_hash($pass, PASSWORD_DEFAULT);

// ⬇️ CHANGED: include role as a bound parameter instead of hardcoded "user"
$ins  = $pdo->prepare('INSERT INTO users (username, email, password_hash, first_name, last_name, role)
                       VALUES (?, ?, ?, ?, ?, ?)');
$ins->execute(array($username, $email, $hash, $first, $last, $role));

echo json_encode(array(
  'ok' => true,
  'message' => 'Registration successful',
  'username' => $username,
  'role' => $role
));
