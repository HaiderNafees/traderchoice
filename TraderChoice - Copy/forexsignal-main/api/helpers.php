<?php
// api/helpers.php

declare(strict_types=1);

function ensure_data_files(array $files): void {
  foreach ($files as $key => $path) {
    if (!file_exists($path)) {
      if ($key === 'rates') {
        file_put_contents($path, json_encode(['timestamp' => 0, 'data' => new stdClass()], JSON_PRETTY_PRINT));
      } else {
        file_put_contents($path, json_encode([], JSON_PRETTY_PRINT));
      }
    }
  }
}

function read_json(string $path) {
  $content = @file_get_contents($path);
  if ($content === false || $content === '') return [];
  $data = json_decode($content, true);
  if ($data === null && json_last_error() !== JSON_ERROR_NONE) return [];
  return $data;
}

function write_json(string $path, $data): bool {
  $tmp = $path . '.tmp';
  $ok = @file_put_contents($tmp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
  if ($ok === false) return false;
  return @rename($tmp, $path);
}

function json_response($payload, int $status = 200): void {
  http_response_code($status);
  echo json_encode($payload);
  exit;
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

function require_admin(): void {
  $hdr = isset($_SERVER['HTTP_X_ADMIN_TOKEN']) ? $_SERVER['HTTP_X_ADMIN_TOKEN'] : '';
  $u = current_user();
  if ($u && isset($u['role']) && $u['role'] === 'admin') return;
  if (!defined('ADMIN_TOKEN')) {
    json_response(['success' => false, 'error' => 'Server admin token not configured'], 500);
  }
  if ($hdr !== ADMIN_TOKEN) {
    json_response(['success' => false, 'error' => 'Admin token invalid'], 401);
  }
}

function uuidv4(): string {
  $data = random_bytes(16);
  $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
  $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
  return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}
