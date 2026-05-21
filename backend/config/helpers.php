<?php
// =====================================================
// SK PARFUMERIE — Helpers communs
// =====================================================

require_once __DIR__ . '/database.php';

// ── CORS ──────────────────────────────────────────────
function setCORSHeaders(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Credentials: true');
    header('Content-Type: application/json; charset=utf-8');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// ── JSON helpers ──────────────────────────────────────
function jsonOk(mixed $data = null, string $message = 'OK'): never {
    echo json_encode(['success' => true, 'message' => $message, 'data' => $data]);
    exit;
}

function jsonError(string $message, int $code = 400): never {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $message, 'data' => null]);
    exit;
}

function getBody(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

// ── JWT ───────────────────────────────────────────────
function jwtEncode(array $payload): string {
    $header  = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64url_encode(json_encode($payload));
    $sig     = base64url_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    return "$header.$payload.$sig";
}

function jwtDecode(string $token): array|false {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    [$h, $p, $s] = $parts;
    $expectedSig = base64url_encode(hash_hmac('sha256', "$h.$p", JWT_SECRET, true));
    if (!hash_equals($expectedSig, $s)) return false;
    $payload = json_decode(base64url_decode($p), true);
    if (!$payload || (isset($payload['exp']) && $payload['exp'] < time())) return false;
    return $payload;
}

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4));
}

// ── Auth middleware ───────────────────────────────────
function requireAuth(array $allowedRoles = []): array {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($auth, 'Bearer ')) jsonError('Non authentifié', 401);
    $token = substr($auth, 7);
    $payload = jwtDecode($token);
    if (!$payload) jsonError('Token invalide ou expiré', 401);
    if ($allowedRoles && !in_array($payload['role'], $allowedRoles, true)) {
        jsonError('Accès refusé', 403);
    }
    return $payload;
}
