<?php
// api/config.php
// CORS, session, helpers, data file initialization

header('Content-Type: application/json');
$allowedOrigins = [
  'https://traderchoice.asia',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
if (in_array($origin, $allowedOrigins)) {
  header('Access-Control-Allow-Origin: ' . $origin);
} else {
  header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Admin-Token');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if (session_status() === PHP_SESSION_NONE) {
  session_start();
}

// Admin token
if (!defined('ADMIN_TOKEN')) {
  define('ADMIN_TOKEN', 'my_secure_admin_token_123');
}

// Data directory and files
$ROOT = dirname(__DIR__);
$DATA_DIR = $ROOT . DIRECTORY_SEPARATOR . 'data';
if (!file_exists($DATA_DIR)) {
  mkdir($DATA_DIR, 0775, true);
}
$FILES = [
  'users' => $DATA_DIR . DIRECTORY_SEPARATOR . 'users.json',
  'signals' => $DATA_DIR . DIRECTORY_SEPARATOR . 'signals.json',
  'payments' => $DATA_DIR . DIRECTORY_SEPARATOR . 'payments.json',
  'rates' => $DATA_DIR . DIRECTORY_SEPARATOR . 'rates.json',
  'subscriptions' => $DATA_DIR . DIRECTORY_SEPARATOR . 'subscriptions.json',
];

foreach ($FILES as $key => $path) {
  if (!file_exists($path)) {
    if ($key === 'rates') {
      file_put_contents($path, json_encode(['timestamp' => 0, 'data' => new stdClass()], JSON_PRETTY_PRINT));
    } else {
      file_put_contents($path, json_encode([], JSON_PRETTY_PRINT));
    }
  }
}

function read_json($path) {
  $content = file_get_contents($path);
  if ($content === false || $content === '') return [];
  $data = json_decode($content, true);
  if ($data === null && json_last_error() !== JSON_ERROR_NONE) return [];
  return $data;
}

function write_json($path, $data) {
  $tmp = $path . '.tmp';
  $ok = file_put_contents($tmp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
  if ($ok === false) return false;
  return rename($tmp, $path);
}

function json_response($payload, $status = 200) {
  http_response_code($status);
  echo json_encode($payload);
  exit;
}

function require_admin() {
  $hdr = isset($_SERVER['HTTP_X_ADMIN_TOKEN']) ? $_SERVER['HTTP_X_ADMIN_TOKEN'] : '';
  $u = current_user();
  if ($u && isset($u['role']) && $u['role'] === 'admin') {
    return; // session admin
  }
  if (!defined('ADMIN_TOKEN')) {
    json_response(['success' => false, 'error' => 'Server admin token not configured'], 500);
  }
  if ($hdr !== ADMIN_TOKEN) {
    json_response(['success' => false, 'error' => 'Admin token invalid'], 401);
  }
}

function current_user() {
  return isset($_SESSION['user']) ? $_SESSION['user'] : null;
}

function require_auth() {
  $u = current_user();
  if (!$u) {
    json_response(['success' => false, 'error' => 'Not authenticated'], 401);
  }
  return $u;
}

function uuidv4() {
  $data = random_bytes(16);
  $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
  $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}
