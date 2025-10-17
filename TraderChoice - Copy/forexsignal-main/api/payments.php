<?php
require_once __DIR__ . '/config.php';

$paymentsPath = $FILES['payments'];
$usersPath = $FILES['users'];
$subsPath = $FILES['subscriptions'];
$payments = read_json($paymentsPath);
$users = read_json($usersPath);
$method = $_SERVER['REQUEST_METHOD'];
$raw = file_get_contents('php://input');
$input = json_decode($raw ?: '{}', true);
$action = $_GET['action'] ?? ($input['action'] ?? null);

if ($method === 'POST' && $action === 'verify') {
  $u = require_auth();
  $txHash = trim($input['txHash'] ?? '');
  if (!$txHash) json_response(['success' => false, 'error' => 'txHash required'], 400);
  $id = uuidv4();
  $record = [
    'id' => $id,
    'uid' => $u['uid'],
    'userId' => $u['uid'],
    'email' => $u['email'],
    'txHash' => $txHash,
    'amount' => 60,
    'status' => 'pending',
    'createdAt' => time(),
  ];
  $payments[] = $record;
  write_json($paymentsPath, $payments);
  json_response(['success' => true, 'message' => 'Payment submitted for verification', 'payment' => $record]);
}

// Upload payment proof (multipart/form-data) with optional txHash
if ($method === 'POST' && $action === 'verify_upload') {
  $u = require_auth();
  // Accept multipart form: fields txHash, amount (optional), file 'proof'
  $txHash = isset($_POST['txHash']) ? trim($_POST['txHash']) : '';
  if (!$txHash) $txHash = null;
  if (!isset($_FILES['proof']) || !is_uploaded_file($_FILES['proof']['tmp_name'])) {
    json_response(['success' => false, 'error' => 'proof file is required'], 400);
  }
  $proofDir = dirname($paymentsPath) . DIRECTORY_SEPARATOR . 'proofs';
  if (!is_dir($proofDir)) mkdir($proofDir, 0775, true);
  $id = uuidv4();
  $orig = $_FILES['proof']['name'];
  $ext = pathinfo($orig, PATHINFO_EXTENSION);
  if (!$ext) $ext = 'jpg';
  $fname = $id . '.' . strtolower($ext);
  $dest = $proofDir . DIRECTORY_SEPARATOR . $fname;
  if (!move_uploaded_file($_FILES['proof']['tmp_name'], $dest)) {
    json_response(['success' => false, 'error' => 'Failed to store file'], 500);
  }
  // Public URL under /data/proofs/
  $publicUrl = '/data/proofs/' . $fname;
  $record = [
    'id' => $id,
    'uid' => $u['uid'],
    'userId' => $u['uid'],
    'email' => $u['email'],
    'txHash' => $txHash,
    'amount' => 60,
    'status' => 'pending',
    'createdAt' => time(),
    'proofUrl' => $publicUrl,
  ];
  $payments[] = $record;
  write_json($paymentsPath, $payments);
  json_response(['success' => true, 'message' => 'Payment proof uploaded. Awaiting verification.', 'payment' => $record]);
}

if ($method === 'GET' && $action === 'history') {
  $u = require_auth();
  $list = array_values(array_filter($payments, function($p) use ($u){ return $p['uid'] === $u['uid']; }));
  usort($list, function($a,$b){ return ($b['createdAt'] ?? 0) <=> ($a['createdAt'] ?? 0); });
  json_response(['success' => true, 'payments' => $list]);
}

if ($method === 'GET' && $action === 'status') {
  $u = require_auth();
  $latest = null;
  foreach ($payments as $p) {
    if ($p['uid'] === $u['uid']) {
      if (!$latest || ($p['createdAt'] ?? 0) > ($latest['createdAt'] ?? 0)) $latest = $p;
    }
  }
  json_response(['success' => true, 'latest' => $latest]);
}

// Admin: update payment and upgrade user
if (($method === 'POST' && $action === 'admin_update')) {
  require_admin();
  $id = $input['id'] ?? null;
  $status = $input['status'] ?? null; // 'verified' | 'rejected'
  if (!$id || !$status) json_response(['success' => false, 'error' => 'id and status required'], 400);
  $found = false;
  foreach ($payments as &$p) {
    if ($p['id'] === $id) {
      $p['status'] = $status;
      $found = true;
      // upgrade user if verified
      if ($status === 'verified') {
        $now = time();
        $expires = $now + (30 * 24 * 60 * 60);
        foreach ($users as &$u) {
          if ($u['uid'] === $p['uid']) {
            $u['role'] = 'pro';
            $u['proExpires'] = $expires;
          }
        }
        write_json($usersPath, $users);
        // append subscription record
        $subs = read_json($subsPath);
        if (!is_array($subs)) $subs = [];
        $subs[] = [
          'uid' => $p['uid'],
          'email' => $p['email'] ?? null,
          'paymentId' => $p['id'],
          'txHash' => $p['txHash'] ?? null,
          'amount' => $p['amount'] ?? 60,
          'startsAt' => $now,
          'expiresAt' => $expires,
          'status' => 'active'
        ];
        write_json($subsPath, $subs);
      }
      break;
    }
  }
  if (!$found) json_response(['success' => false, 'error' => 'Payment not found'], 404);
  write_json($paymentsPath, $payments);
  json_response(['success' => true]);
}

// Admin: list all payments
if ($method === 'GET' && $action === 'admin_list') {
  require_admin();
  usort($payments, function($a,$b){ return ($b['createdAt'] ?? 0) <=> ($a['createdAt'] ?? 0); });
  json_response(['success' => true, 'payments' => $payments]);
}

json_response(['success' => false, 'error' => 'Invalid route'], 404);
