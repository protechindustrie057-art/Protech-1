<?php
// =====================================================
// /endpoints/settings.php
// GET  — lire les paramètres
// PUT  — modifier les paramètres (admin)
// POST — uploader un logo (admin)
// =====================================================

require_once __DIR__ . '/../config/helpers.php';
setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// ── GET ───────────────────────────────────────────────
if ($method === 'GET') {
    requireAuth(['admin', 'manager', 'caisse']);

    $stmt = $db->query('SELECT * FROM settings WHERE id = 1');
    $row  = $stmt->fetch();
    if (!$row) jsonError('Paramètres introuvables', 404);

    $row['usd_rate']        = (int)$row['usd_rate'];
    $row['backup_interval'] = (int)$row['backup_interval'];

    // Build logo URL
    if ($row['company_logo'] && str_starts_with($row['company_logo'], 'logo_')) {
        $row['company_logo'] = (isset($_SERVER['HTTPS']) ? 'https' : 'http')
            . '://' . $_SERVER['HTTP_HOST']
            . '/backend/uploads/logos/' . $row['company_logo'];
    }

    jsonOk($row);
}

// ── PUT — mettre à jour les paramètres ────────────────
if ($method === 'PUT') {
    requireAuth(['admin']);

    $body = getBody();

    $fields = [];
    $params = [];
    $map = [
        'rccm'             => 'rccm',
        'nif'              => 'nif',
        'idNat'            => 'id_nat',
        'phone'            => 'phone',
        'usdRate'          => 'usd_rate',
        'defaultCurrency'  => 'default_currency',
        'backupInterval'   => 'backup_interval',
    ];

    foreach ($map as $jsKey => $dbCol) {
        if (array_key_exists($jsKey, $body)) {
            $fields[] = "$dbCol = ?";
            $params[] = $body[$jsKey];
        }
    }

    if (empty($fields)) jsonError('Aucun champ à mettre à jour');

    $db->prepare('UPDATE settings SET ' . implode(', ', $fields) . ' WHERE id = 1')->execute($params);
    jsonOk(null, 'Paramètres mis à jour');
}

// ── POST — logo upload ────────────────────────────────
if ($method === 'POST') {
    requireAuth(['admin']);

    if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
        jsonError('Fichier logo requis');
    }

    $uploadDir = __DIR__ . '/../uploads/logos/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

    $file    = $_FILES['logo'];
    $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    $finfo   = new finfo(FILEINFO_MIME_TYPE);
    $mime    = $finfo->file($file['tmp_name']);

    if (!in_array($mime, $allowed, true)) jsonError('Format non supporté (JPEG, PNG, WEBP, SVG)');
    if ($file['size'] > 2 * 1024 * 1024) jsonError('Logo trop grand (max 2 Mo)');

    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = 'logo_' . time() . '.' . strtolower($ext);
    move_uploaded_file($file['tmp_name'], $uploadDir . $filename);

    $db->prepare('UPDATE settings SET company_logo = ? WHERE id = 1')->execute([$filename]);

    $logoUrl = (isset($_SERVER['HTTPS']) ? 'https' : 'http')
             . '://' . $_SERVER['HTTP_HOST']
             . '/backend/uploads/logos/' . $filename;

    jsonOk(['logo_url' => $logoUrl], 'Logo mis à jour');
}

jsonError('Méthode non autorisée', 405);
