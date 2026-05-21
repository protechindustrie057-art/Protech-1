<?php
// =====================================================
// /endpoints/users.php
// GET    — liste les utilisateurs (admin)
// POST   — créer un utilisateur (admin)
// PUT    — modifier / changer mot de passe
// DELETE — supprimer (admin)
// =====================================================

require_once __DIR__ . '/../config/helpers.php';
setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// ── GET ───────────────────────────────────────────────
if ($method === 'GET') {
    requireAuth(['admin', 'manager']);

    $role = $_GET['role'] ?? null;
    $sql  = 'SELECT id, name, email, role, caisse_number, status, last_login, created_at FROM users WHERE 1=1';
    $params = [];

    if ($role) { $sql .= ' AND role = ?'; $params[] = $role; }
    $sql .= ' ORDER BY name ASC';

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll();

    foreach ($users as &$u) {
        $u['id'] = (int)$u['id'];
        $u['caisse_number'] = $u['caisse_number'] ? (int)$u['caisse_number'] : null;
    }
    unset($u);

    jsonOk($users);
}

// ── POST — créer un utilisateur ───────────────────────
if ($method === 'POST') {
    requireAuth(['admin']);

    $body     = getBody();
    $name     = trim($body['name'] ?? '');
    $email    = trim($body['email'] ?? '');
    $password = $body['password'] ?? '';
    $role     = $body['role'] ?? 'caisse';
    $caisse   = isset($body['caisse_number']) ? (int)$body['caisse_number'] : null;

    if (!$name || !$email || !$password) jsonError('Nom, email et mot de passe sont requis');
    if (!in_array($role, ['admin', 'manager', 'caisse'], true)) jsonError('Rôle invalide');
    if (strlen($password) < 6) jsonError('Mot de passe trop court (min 6 caractères)');

    // Check email uniqueness
    $exists = $db->prepare('SELECT id FROM users WHERE email = ?');
    $exists->execute([$email]);
    if ($exists->fetch()) jsonError('Email déjà utilisé');

    $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    $db->prepare(
        'INSERT INTO users (name, email, password_hash, role, caisse_number) VALUES (?, ?, ?, ?, ?)'
    )->execute([$name, $email, $hash, $role, $caisse]);

    $newId = (int)$db->lastInsertId();
    $user  = $db->prepare('SELECT id, name, email, role, caisse_number, status, last_login FROM users WHERE id = ?');
    $user->execute([$newId]);
    jsonOk($user->fetch(), 'Utilisateur créé');
}

// ── PUT — modifier un utilisateur ────────────────────
if ($method === 'PUT') {
    $auth = requireAuth(['admin', 'manager', 'caisse']);

    $id   = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('ID requis');

    // Non-admins can only update their own account
    if ($auth['role'] !== 'admin' && $auth['sub'] !== $id) {
        jsonError('Accès refusé', 403);
    }

    $body = getBody();

    // ── Change password ──────────────────────────────
    if (isset($body['current_password'], $body['new_password'])) {
        $user = $db->prepare('SELECT password_hash FROM users WHERE id = ?');
        $user->execute([$id]);
        $row = $user->fetch();
        if (!$row) jsonError('Utilisateur introuvable', 404);

        if (!password_verify($body['current_password'], $row['password_hash'])) {
            jsonError('Mot de passe actuel incorrect');
        }
        if (strlen($body['new_password']) < 6) jsonError('Nouveau mot de passe trop court (min 6 caractères)');

        $hash = password_hash($body['new_password'], PASSWORD_BCRYPT, ['cost' => 12]);
        $db->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$hash, $id]);
        jsonOk(null, 'Mot de passe mis à jour');
    }

    // ── Update profile ───────────────────────────────
    $fields = [];
    $params = [];

    if ($auth['role'] === 'admin') {
        if (isset($body['name']))          { $fields[] = 'name = ?';          $params[] = $body['name']; }
        if (isset($body['email']))         { $fields[] = 'email = ?';         $params[] = $body['email']; }
        if (isset($body['role']))          { $fields[] = 'role = ?';          $params[] = $body['role']; }
        if (isset($body['status']))        { $fields[] = 'status = ?';        $params[] = $body['status']; }
        if (isset($body['caisse_number'])) { $fields[] = 'caisse_number = ?'; $params[] = (int)$body['caisse_number']; }
    } else {
        if (isset($body['name'])) { $fields[] = 'name = ?'; $params[] = $body['name']; }
    }

    if (empty($fields)) jsonError('Aucun champ à mettre à jour');

    $params[] = $id;
    $db->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);

    $user = $db->prepare('SELECT id, name, email, role, caisse_number, status, last_login FROM users WHERE id = ?');
    $user->execute([$id]);
    jsonOk($user->fetch(), 'Utilisateur mis à jour');
}

// ── DELETE ────────────────────────────────────────────
if ($method === 'DELETE') {
    requireAuth(['admin']);
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('ID requis');

    // Prevent deleting main admin
    $user = $db->prepare('SELECT role FROM users WHERE id = ?');
    $user->execute([$id]);
    $row = $user->fetch();
    if (!$row) jsonError('Utilisateur introuvable', 404);
    if ($row['role'] === 'admin') jsonError('Impossible de supprimer le compte administrateur');

    $db->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
    jsonOk(null, 'Utilisateur supprimé');
}

jsonError('Méthode non autorisée', 405);
