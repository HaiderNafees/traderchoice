<?php
require_once __DIR__ . '/config.php';

$ratesPath = $FILES['rates'];
$method = $_SERVER['REQUEST_METHOD'];
$ttl = 60; // seconds

// Prefer GET only
if ($method !== 'GET') {
  json_response(['success' => false, 'error' => 'Method not allowed'], 405);
}

$cache = json_decode(file_get_contents($ratesPath), true);
$now = time();
if ($cache && ($now - ($cache['timestamp'] ?? 0) < $ttl)) {
  json_response(['success' => true, 'cached' => true, 'rates' => $cache['data']]);
}

$url = 'https://api.exchangerate.host/latest';
$ctx = stream_context_create([
  'http' => [
    'timeout' => 10,
    'ignore_errors' => true,
  ],
]);
$raw = @file_get_contents($url, false, $ctx);
if ($raw === false) {
  // fallback to cache if exists
  if ($cache && isset($cache['data'])) {
    json_response(['success' => true, 'cached' => true, 'rates' => $cache['data']]);
  }
  json_response(['success' => false, 'error' => 'Failed to fetch rates'], 502);
}
$resp = json_decode($raw, true);
if (!$resp || !isset($resp['rates'])) {
  json_response(['success' => false, 'error' => 'Invalid rates response'], 502);
}
$store = ['timestamp' => $now, 'data' => $resp];
write_json($ratesPath, $store);
json_response(['success' => true, 'cached' => false, 'rates' => $resp]);
