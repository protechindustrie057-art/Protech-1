<?php
// =====================================================
// ProTech Touch — Configuration Base de Données
// =====================================================

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'protech_touch_db');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

define('JWT_SECRET', getenv('JWT_SECRET') ?: 'change-me-in-production');
define('JWT_EXPIRY', 3600 * 8);    // 8 heures

function getDB(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        error_log('Erreur connexion DB: ' . $e->getMessage());
        http_response_code(500);
        die(json_encode(['success' => false, 'message' => 'Erreur connexion DB']));
    }
    return $pdo;
}
