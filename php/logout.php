<?php
// logout.php — destroy session, then REDIRECT to login page

// IMPORTANT: no whitespace/newlines before <?php

// Choose where to go after logout
$defaultRedirect = '/Online-store/pages/login.html';
$redirect = isset($_GET['redirect']) && $_GET['redirect'] !== ''
  ? $_GET['redirect']
  : $defaultRedirect;

// Start session so we can destroy it
session_start();

// Wipe session data
$_SESSION = array();

// Expire the session cookie
if (ini_get('session.use_cookies')) {
  $p = session_get_cookie_params();
  setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
}

// Destroy the session
session_destroy();

// Redirect (no JSON output)
header('Location: ' . $redirect);
exit;
