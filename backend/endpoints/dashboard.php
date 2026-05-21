<?php
// =====================================================
// GET /endpoints/dashboard.php
// Statistiques pour le tableau de bord
// =====================================================

require_once __DIR__ . '/../config/helpers.php';
setCORSHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') jsonError('Méthode non autorisée', 405);
requireAuth(['admin', 'manager']);

$db  = getDB();
$now = new DateTime();

// ── Ventes du jour ────────────────────────────────────
$today = $now->format('Y-m-d');
$todaySales = $db->prepare("SELECT COALESCE(SUM(total), 0) AS total FROM invoices WHERE DATE(created_at) = ?");
$todaySales->execute([$today]);
$todaySalesTotal = (float)$todaySales->fetch()['total'];

// ── Stock total ───────────────────────────────────────
$totalStock = (int)$db->query('SELECT COALESCE(SUM(stock), 0) AS s FROM products')->fetch()['s'];

// ── Produits en stock faible ──────────────────────────
$lowStock = (int)$db->query('SELECT COUNT(*) AS c FROM products WHERE stock <= alert_threshold')->fetch()['c'];

// ── Nombre d\'utilisateurs ─────────────────────────────
$totalUsers = (int)$db->query('SELECT COUNT(*) AS c FROM users WHERE status = "actif"')->fetch()['c'];

// ── Ventes par heure (aujourd\'hui) ────────────────────
$hourlySalesStmt = $db->prepare(
    'SELECT HOUR(created_at) AS h, COALESCE(SUM(total), 0) AS total
     FROM invoices
     WHERE DATE(created_at) = ?
     GROUP BY HOUR(created_at)'
);
$hourlySalesStmt->execute([$today]);
$hourlyRaw = $hourlySalesStmt->fetchAll();

$hourlySales = array_fill(0, 24, 0);
foreach ($hourlyRaw as $row) {
    $hourlySales[(int)$row['h']] = (float)$row['total'];
}

// ── Top 5 produits vendus (30 derniers jours) ─────────
$topProducts = $db->prepare(
    'SELECT ii.nom AS name, SUM(ii.quantite) AS quantity
     FROM invoice_items ii
     JOIN invoices i ON i.id = ii.invoice_id
     WHERE i.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY ii.nom
     ORDER BY quantity DESC
     LIMIT 5'
);
$topProducts->execute();
$topProductsList = array_map(function ($r) {
    return ['name' => $r['name'], 'quantity' => (int)$r['quantity']];
}, $topProducts->fetchAll());

// ── Factures récentes ─────────────────────────────────
$recentInvoices = $db->query(
    'SELECT id, numero, client_name, caissier_name, total, created_at
     FROM invoices
     ORDER BY created_at DESC
     LIMIT 10'
)->fetchAll();

foreach ($recentInvoices as &$inv) {
    $inv['id']    = (int)$inv['id'];
    $inv['total'] = (float)$inv['total'];
}
unset($inv);

jsonOk([
    'todaySales'     => $todaySalesTotal,
    'totalStock'     => $totalStock,
    'lowStockCount'  => $lowStock,
    'totalUsers'     => $totalUsers,
    'hourlySales'    => $hourlySales,
    'topProducts'    => $topProductsList,
    'recentInvoices' => $recentInvoices,
]);
