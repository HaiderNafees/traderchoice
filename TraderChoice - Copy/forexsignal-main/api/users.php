<?php
require_once __DIR__ . '/config.php';

$usersPath = $FILES['users'];
$users = read_json($usersPath);
$adminEmail = 'admin@forexsignal.com';
$adminPassword = 'Admin798956!!';
// Ensure default admin exists
$hasAdmin = false;
foreach ($users as $u) {
  if (($u['email'] ?? '') === $adminEmail) { $hasAdmin = true; break; }
}
if (!$hasAdmin) {
  $uid = uuidv4();
  $user = [
    'uid' => $uid,
    'email' => $adminEmail,
    'password' => password_hash($adminPassword, PASSWORD_DEFAULT),
    'role' => 'admin',
    'proExpires' => null,
    'createdAt' => time(),
  ];
  $users[] = $user;
  write_json($usersPath, $users);
}
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? ($input['action'] ?? null);

if ($method === 'GET' && $action === 'profile') {
  $u = current_user();
  json_response(['success' => true, 'user' => $u]);
}

if ($method === 'POST' && $action === 'register') {
  $email = trim(strtolower($input['email'] ?? ''));
  $password = $input['password'] ?? '';
  if (!$email || !$password) json_response(['success' => false, 'error' => 'Email and password required'], 400);
  foreach ($users as $u) {
    if (($u['email'] ?? '') === $email) json_response(['success' => false, 'error' => 'Email already exists'], 409);
  }
  $uid = uuidv4();
  $user = [
    'uid' => $uid,
    'email' => $email,
    'password' => password_hash($password, PASSWORD_DEFAULT),
    'role' => 'free',
    'proExpires' => null,
    'createdAt' => time(),
  ];
  $users[] = $user;
  write_json($usersPath, $users);
  unset($user['password']);
  $_SESSION['user'] = $user;
  json_response(['success' => true, 'user' => $user]);
}

if ($method === 'POST' && $action === 'login') {
  $email = trim(strtolower($input['email'] ?? ''));
  $password = $input['password'] ?? '';
  foreach ($users as $u) {
    if (($u['email'] ?? '') === $email) {
      if (password_verify($password, $u['password'])) {
        $sessionUser = $u;
        unset($sessionUser['password']);
        $_SESSION['user'] = $sessionUser;
        json_response(['success' => true, 'user' => $sessionUser]);
      } else {
        json_response(['success' => false, 'error' => 'Invalid credentials'], 401);
      }
    }
  }
  json_response(['success' => false, 'error' => 'User not found'], 404);
}

if ($method === 'POST' && $action === 'logout') {
  $_SESSION = [];
  if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
      $params['path'], $params['domain'],
      $params['secure'], $params['httponly']
    );
  }
  session_destroy();
  json_response(['success' => true]);
}

// Admin: set a specific user to PRO (role=pro, subscription=premium)
if ($method === 'POST' && $action === 'setPro') {
  require_admin();
  $targetEmail = trim(strtolower($input['email'] ?? ''));
  $targetUid = $input['userId'] ?? null;
  if (!$targetEmail && !$targetUid) json_response(['success' => false, 'error' => 'email or userId required'], 400);
  $found = false;
  foreach ($users as &$u) {
    if (($targetEmail && (strtolower($u['email'] ?? '') === $targetEmail)) || ($targetUid && ($u['uid'] ?? '') === $targetUid)) {
      $u['role'] = 'pro';
      $u['subscription'] = 'premium';
      $u['updatedAt'] = time();
      $found = true;
      break;
    }
  }
  if (!$found) json_response(['success' => false, 'error' => 'User not found'], 404);
  write_json($usersPath, $users);
  json_response(['success' => true, 'message' => 'User upgraded to PRO successfully']);
}

// Admin: set a specific user back to NORMAL (role=free, remove subscription)
if ($method === 'POST' && $action === 'setNormal') {
  require_admin();
  $targetEmail = trim(strtolower($input['email'] ?? ''));
  $targetUid = $input['userId'] ?? null;
  if (!$targetEmail && !$targetUid) json_response(['success' => false, 'error' => 'email or userId required'], 400);
  $found = false;
  foreach ($users as &$u) {
    if (($targetEmail && (strtolower($u['email'] ?? '') === $targetEmail)) || ($targetUid && ($u['uid'] ?? '') === $targetUid)) {
      $u['role'] = 'free';
      unset($u['subscription']);
      $u['updatedAt'] = time();
      $found = true;
      break;
    }
  }
  if (!$found) json_response(['success' => false, 'error' => 'User not found'], 404);
  write_json($usersPath, $users);
  json_response(['success' => true, 'message' => 'User downgraded to NORMAL successfully']);
}

// Admin: list all users (without passwords)
if ($method === 'GET' && $action === 'admin_list') {
  require_admin();
  $sanitized = array_map(function($u){
    $v = $u;
    unset($v['password']);
    return $v;
  }, $users);
  // Sort by createdAt desc
  usort($sanitized, function($a,$b){ return ($b['createdAt'] ?? 0) <=> ($a['createdAt'] ?? 0); });
  json_response(['success' => true, 'users' => $sanitized]);
}

json_response(['success' => false, 'error' => 'Invalid route'], 404);
