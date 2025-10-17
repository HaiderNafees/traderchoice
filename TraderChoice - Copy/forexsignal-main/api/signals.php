<?php
require_once __DIR__ . '/config.php';

$signalsPath = $FILES['signals'];
$signals = read_json($signalsPath);
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? ($input['action'] ?? null);

if ($method === 'GET' && $action === 'list') {
  // Authenticated list (all signals)
  $u = require_auth();
  usort($signals, function($a, $b){ return ($b['createdAt'] ?? 0) <=> ($a['createdAt'] ?? 0); });
  json_response(['success' => true, 'signals' => $signals]);
}

if ($method === 'GET' && ($action === 'public' || $action === 'public_list')) {
  // Public list (only free signals), no auth required
  $free = array_values(array_filter($signals, function($s){ return ($s['type'] ?? 'free') === 'free'; }));
  usort($free, function($a, $b){ return ($b['createdAt'] ?? 0) <=> ($a['createdAt'] ?? 0); });
  json_response(['success' => true, 'signals' => $free]);
}

if ($method === 'GET' && ($action === 'public_all')) {
  // Public list (all signals), no auth required
  $list = $signals;
  usort($list, function($a, $b){ return ($b['createdAt'] ?? 0) <=> ($a['createdAt'] ?? 0); });
  json_response(['success' => true, 'signals' => $list]);
}

if ($method === 'POST' && $action === 'add') {
  require_admin();
  $payload = $input['signal'] ?? [];
  $id = uuidv4();
  $now = time();
  $u = current_user();
  // auto-increment trade number
  $maxTrade = 0;
  foreach ($signals as $s) { $tn = intval($s['tradeNumber'] ?? 0); if ($tn > $maxTrade) $maxTrade = $tn; }
  $tradeNumber = $maxTrade + 1;
  $signal = array_merge($payload, [
    'id' => $id,
    'createdBy' => $u['uid'] ?? 'admin',
    'createdAt' => $now,
    'tradeNumber' => $tradeNumber,
  ]);
  $signals[] = $signal;
  write_json($signalsPath, $signals);
  json_response(['success' => true, 'signal' => $signal]);
}

if (($method === 'PUT' || $method === 'PATCH' || ($method === 'POST' && $action === 'edit')) && ($action === 'edit' || $action === 'update')) {
  require_admin();
  $id = $_GET['id'] ?? ($input['id'] ?? null);
  if (!$id) json_response(['success' => false, 'error' => 'Missing id'], 400);
  foreach ($signals as &$s) {
    if ($s['id'] === $id) {
      $update = $input['signal'] ?? $input;
      unset($update['id']);
      $s = array_merge($s, $update);
      write_json($signalsPath, $signals);
      json_response(['success' => true, 'signal' => $s]);
    }
  }
  json_response(['success' => false, 'error' => 'Not found'], 404);
}

if (($method === 'DELETE') || ($method === 'POST' && $action === 'delete')) {
  require_admin();
  $id = $_GET['id'] ?? ($input['id'] ?? null);
  if (!$id) json_response(['success' => false, 'error' => 'Missing id'], 400);
  $before = count($signals);
  $signals = array_values(array_filter($signals, function($s) use ($id) { return $s['id'] !== $id; }));
  if ($before === count($signals)) json_response(['success' => false, 'error' => 'Not found'], 404);
  write_json($signalsPath, $signals);
  json_response(['success' => true]);
}

json_response(['success' => false, 'error' => 'Invalid route'], 404);
