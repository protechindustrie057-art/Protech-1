<?php
// =====================================================
// /endpoints/products.php
// GET    — liste tous les produits
// POST   — créer un produit (admin/manager)
// PUT    — modifier un produit (admin/manager)
// DELETE — supprimer un produit (admin)
// =====================================================

require_once __DIR__ . '/../config/helpers.php';
setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// ── GET (public — les caissiers lisent aussi) ─────────
if ($method === 'GET') {
    requireAuth(['admin', 'manager', 'caisse']);

    $search   = $_GET['search']   ?? '';
    $category = $_GET['category'] ?? '';
    $lowStock = isset($_GET['low_stock']);

    $sql  = 'SELECT p.*, c.name AS category_name
             FROM products p
             LEFT JOIN categories c ON c.slug = p.category_slug
             WHERE 1=1';
    $params = [];

    if ($search) {
        $sql .= ' AND (p.name LIKE ? OR p.barcode = ?)';
        $params[] = "%$search%";
        $params[] = $search;
    }
    if ($category) {
        $sql .= ' AND p.category_slug = ?';
        $params[] = $category;
    }
    if ($lowStock) {
        $sql .= ' AND p.stock <= p.alert_threshold';
    }

    $sql .= ' ORDER BY p.name ASC';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $products = $stmt->fetchAll();

    // Cast types
    foreach ($products as &$p) {
        $p['id']              = (int)$p['id'];
        $p['price']           = (float)$p['price'];
        $p['stock']           = (int)$p['stock'];
        $p['alert_threshold'] = (int)$p['alert_threshold'];
        // Build full image URL if stored
        if ($p['image_path']) {
            $p['image'] = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://'
                        . $_SERVER['HTTP_HOST']
                        . '/backend/uploads/products/' . basename($p['image_path']);
        } else {
            $p['image'] = null;
        }
    }
    unset($p);

    jsonOk($products);
}

// ── POST — créer un produit ───────────────────────────
if ($method === 'POST') {
    requireAuth(['admin', 'manager']);

    // Handle multipart (image upload) or JSON
    $isMultipart = isset($_FILES['image']);
    $data = $isMultipart ? $_POST : getBody();

    $name      = trim($data['name'] ?? '');
    $price     = (float)($data['price'] ?? 0);
    $stock     = (int)($data['stock'] ?? 0);
    $threshold = (int)($data['alert_threshold'] ?? 5);
    $category  = trim($data['category'] ?? 'divers');
    $barcode   = trim($data['barcode'] ?? '') ?: null;

    if (!$name || $price <= 0) jsonError('Nom et prix sont requis');

    $imagePath = null;
    if ($isMultipart && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $imagePath = handleImageUpload($_FILES['image']);
    }

    $stmt = $db->prepare(
        'INSERT INTO products (name, price, stock, alert_threshold, category_slug, barcode, image_path)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$name, $price, $stock, $threshold, $category, $barcode, $imagePath]);
    $newId = (int)$db->lastInsertId();

    $product = $db->prepare('SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.slug=p.category_slug WHERE p.id=?');
    $product->execute([$newId]);
    jsonOk($product->fetch(), 'Produit créé');
}

// ── PUT — modifier un produit ─────────────────────────
if ($method === 'PUT') {
    requireAuth(['admin', 'manager']);

    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('ID requis');

    $isMultipart = isset($_FILES['image']);
    $data = $isMultipart ? $_POST : getBody();

    $fields = [];
    $params = [];

    foreach (['name', 'category_slug'] as $f) {
        if (isset($data[$f])) { $fields[] = "$f = ?"; $params[] = $data[$f === 'category_slug' ? 'category' : $f]; }
    }
    if (isset($data['name']))            { $fields[] = 'name = ?';            $params[] = $data['name']; }
    if (isset($data['price']))           { $fields[] = 'price = ?';           $params[] = (float)$data['price']; }
    if (isset($data['stock']))           { $fields[] = 'stock = ?';           $params[] = (int)$data['stock']; }
    if (isset($data['alert_threshold'])) { $fields[] = 'alert_threshold = ?'; $params[] = (int)$data['alert_threshold']; }
    if (isset($data['category']))        { $fields[] = 'category_slug = ?';   $params[] = $data['category']; }
    if (array_key_exists('barcode', $data)) {
        $fields[] = 'barcode = ?';
        $params[] = $data['barcode'] ?: null;
    }

    if ($isMultipart && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $imagePath = handleImageUpload($_FILES['image']);
        $fields[]  = 'image_path = ?';
        $params[]  = $imagePath;
    }

    if (empty($fields)) jsonError('Aucun champ à mettre à jour');

    $params[] = $id;
    $db->prepare('UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);

    $product = $db->prepare('SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.slug=p.category_slug WHERE p.id=?');
    $product->execute([$id]);
    jsonOk($product->fetch(), 'Produit mis à jour');
}

// ── DELETE ────────────────────────────────────────────
if ($method === 'DELETE') {
    requireAuth(['admin']);
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) jsonError('ID requis');
    $db->prepare('DELETE FROM products WHERE id = ?')->execute([$id]);
    jsonOk(null, 'Produit supprimé');
}

jsonError('Méthode non autorisée', 405);

// ── Image upload helper ───────────────────────────────
function handleImageUpload(array $file): string {
    $uploadDir = __DIR__ . '/../uploads/products/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

    $allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    $finfo   = new finfo(FILEINFO_MIME_TYPE);
    $mime    = $finfo->file($file['tmp_name']);

    if (!in_array($mime, $allowed, true)) jsonError('Format image non supporté');
    if ($file['size'] > 2 * 1024 * 1024) jsonError('Image trop grande (max 2 Mo)');

    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('prod_', true) . '.' . strtolower($ext);
    move_uploaded_file($file['tmp_name'], $uploadDir . $filename);
    return $filename;
}
