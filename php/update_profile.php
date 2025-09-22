<?php
// /Online-store/php/update_profile.php
header('Content-Type: application/json');
session_start();

// DO NOT echo PHP warnings/notices in JSON:
ini_set('display_errors','0');
ini_set('display_startup_errors','0');
error_reporting(E_ALL);

if (empty($_SESSION['user_id'])) {
  http_response_code(401);
  echo json_encode(['ok' => false, 'error' => 'Not authenticated']);
  exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
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

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) { $data = $_POST; }

$userId = (int)$_SESSION['user_id'];

// --- validators ---
function validateFullName(string $full): array {
  $full = trim($full);
  if ($full === '') throw new Exception('Full name is required');
  // letters, spaces, hyphen, apostrophe; 2+ chars total
  if (!preg_match("/^[A-Za-z][A-Za-z' -]{1,98}(?:\s+[A-Za-z][A-Za-z' -]{0,98})*$/u", $full)) {
    throw new Exception('Invalid full name (letters, spaces, apostrophes, hyphens only)');
  }
  $parts = preg_split('/\s+/', $full);
  $first = $parts[0] ?? '';
  $last  = (count($parts) > 1) ? implode(' ', array_slice($parts, 1)) : '';
  return [$first, $last];
}
function validateEmail(string $email): string {
  $email = strtolower(trim($email));
  if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 255) {
    throw new Exception('Invalid email address');
  }
  return $email;
}
function validateUsername(string $u): string {
  $u = trim($u);
  if (!preg_match('/^[A-Za-z0-9._-]{3,32}$/', $u)) {
    throw new Exception('Invalid username (3–32: letters, numbers, . _ -)');
  }
  return $u;
}
function validatePhone(string $p): string {
  $p = trim($p);
  if ($p === '') return ''; // allow blank
  if (!preg_match('/^[0-9 +()\-]{6,20}$/', $p)) {
    throw new Exception('Invalid phone number (digits, spaces, +, -, () allowed)');
  }
  return $p;
}
function columnExists(PDO $pdo, string $table, string $column): bool {
  $q = $pdo->prepare("SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?");
  $q->execute([$table, $column]);
  return (bool)$q->fetch();
}
function emailInUse(PDO $pdo, string $email, int $selfId): bool {
  $q = $pdo->prepare("SELECT 1 FROM users WHERE email = ? AND user_id <> ? LIMIT 1");
  $q->execute([$email, $selfId]);
  return (bool)$q->fetch();
}
function usernameInUse(PDO $pdo, string $u, int $selfId): bool {
  $q = $pdo->prepare("SELECT 1 FROM users WHERE username = ? AND user_id <> ? LIMIT 1");
  $q->execute([$u, $selfId]);
  return (bool)$q->fetch();
}

$hasPhoneColumn = columnExists($pdo, 'users', 'phone');

try {
  $updates = [];

  // single-field update {field, value}
  if (isset($data['field'])) {
    $field = strtolower((string)$data['field']);
    $value = (string)($data['value'] ?? '');

    if ($field === 'name' || $field === 'fullname') {
      [$first, $last] = validateFullName($value);
      $updates['first_name'] = $first;
      $updates['last_name']  = $last;
    } elseif ($field === 'email') {
      $email = validateEmail($value);
      if (emailInUse($pdo, $email, $userId)) {
        http_response_code(409);
        throw new Exception('Email already in use');
      }
      $updates['email'] = $email;
    } elseif ($field === 'username') {
      $u = validateUsername($value);
      if (usernameInUse($pdo, $u, $userId)) {
        http_response_code(409);
        throw new Exception('Username already in use');
      }
      $updates['username'] = $u;
    } elseif ($field === 'phone') {
      if (!$hasPhoneColumn) throw new Exception('Phone not supported by schema');
      $p = validatePhone($value);
      $updates['phone'] = $p;
    } else {
      http_response_code(422);
      throw new Exception('Unsupported field');
    }

  // multi-field update
  } else {
    if (array_key_exists('fullName', $data)) {
      [$first, $last] = validateFullName((string)$data['fullName']);
      $updates['first_name'] = $first;
      $updates['last_name']  = $last;
    }
    if (array_key_exists('email', $data)) {
      $email = validateEmail((string)$data['email']);
      if (emailInUse($pdo, $email, $userId)) {
        http_response_code(409);
        throw new Exception('Email already in use');
      }
      $updates['email'] = $email;
    }
    if (array_key_exists('username', $data)) {
      $u = validateUsername((string)$data['username']);
      if (usernameInUse($pdo, $u, $userId)) {
        http_response_code(409);
        throw new Exception('Username already in use');
      }
      $updates['username'] = $u;
    }
    if ($hasPhoneColumn && array_key_exists('phone', $data)) {
      $p = validatePhone((string)$data['phone']);
      $updates['phone'] = $p;
    }
    if (!$updates) {
      http_response_code(422);
      throw new Exception('No changes provided');
    }
  }

  // build and execute update
  $set = [];
  $params = [];
  foreach ($updates as $col => $val) {
    $set[] = "`$col` = ?";
    $params[] = $val;
  }
  $params[] = $userId;

  $sql = "UPDATE users SET ".implode(', ', $set)." WHERE user_id = ? LIMIT 1";
  $stm = $pdo->prepare($sql);
  $stm->execute($params);

  // refresh session snapshot (optional but helpful)
  if (isset($updates['first_name'])) $_SESSION['first_name'] = $updates['first_name'];
  if (isset($updates['last_name']))  $_SESSION['last_name']  = $updates['last_name'];
  if (isset($updates['email']))      $_SESSION['email']      = $updates['email'];
  if (isset($updates['username']))   $_SESSION['username']   = $updates['username'];
  if (isset($updates['phone']))      $_SESSION['phone']      = $updates['phone'];

  echo json_encode(['ok' => true, 'message' => 'Profile updated', 'updated' => array_keys($updates)]);
  exit;

} catch (Exception $e) {
  // If no status code set yet, use 422 for validation errors
  if (!http_response_code()) http_response_code(422);
  echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
  exit;
}
