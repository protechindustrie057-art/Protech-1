<?php
// =====================================================
// POST /endpoints/auth.php
// Body: { email, password }
// Returns: { success, data: { token, user } }
// =====================================================

require_once __DIR__ . '/../config/helpers.php';
setCORSHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Méthode non autorisée', 405);

$body = getBody();
$email    = trim($body['email'] ?? '');
$password = $body['password'] ?? '';

if (!$email || !$password) jsonError('Email et mot de passe requis');

$db = getDB();
$stmt = $db->prepare('SELECT * FROM users WHERE email = ? AND status = "actif"');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    jsonError('Identifiants incorrects', 401);
}

// Update last login
$db->prepare('UPDATE users SET last_login = NOW() WHERE id = ?')->execute([$user['id']]);

$payload = [
    'sub'  => $user['id'],
    'name' => $user['name'],
    'role' => $user['role'],
    'exp'  => time() + JWT_EXPIRY,
];

$token = jwtEncode($payload);

jsonOk([
    'token' => $token,
    'user'  => [
        'id'            => (int)$user['id'],
        'name'          => $user['name'],
        'email'         => $user['email'],
        'role'          => $user['role'],
        'caisse_number' => $user['caisse_number'] ? (int)$user['caisse_number'] : null,
        'status'        => $user['status'],
        'last_login'    => $user['last_login'],
    ],
], 'Connexion réussie');
