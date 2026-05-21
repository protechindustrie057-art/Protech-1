<?php
// =====================================================
// /endpoints/invoices.php
// GET  — liste les factures (admin/manager)
// POST — créer une facture + déduire le stock
// =====================================================

require_once __DIR__ . '/../config/helpers.php';
setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// ── GET ───────────────────────────────────────────────
if ($method === 'GET') {
    requireAuth(['admin', 'manager', 'caisse']);

    $page  = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(100, max(10, (int)($_GET['limit'] ?? 50)));
    $offset = ($page - 1) * $limit;

    $from  = $_GET['from']  ?? null;
    $to    = $_GET['to']    ?? null;
    $search = $_GET['search'] ?? '';

    $sql    = 'SELECT * FROM invoices WHERE 1=1';
    $params = [];

    if ($from)   { $sql .= ' AND DATE(created_at) >= ?'; $params[] = $from; }
    if ($to)     { $sql .= ' AND DATE(created_at) <= ?'; $params[] = $to; }
    if ($search) { $sql .= ' AND (numero LIKE ? OR client_name LIKE ?)'; $params[] = "%$search%"; $params[] = "%$search%"; }

    // Total count
    $countStmt = $db->prepare(str_replace('SELECT *', 'SELECT COUNT(*) AS cnt', $sql));
    $countStmt->execute($params);
    $total = (int)$countStmt->fetch()['cnt'];

    $sql .= " ORDER BY created_at DESC LIMIT $limit OFFSET $offset";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $invoices = $stmt->fetchAll();

    // Attach items
    foreach ($invoices as &$inv) {
        $inv['id']         = (int)$inv['id'];
        $inv['sous_total'] = (float)$inv['sous_total'];
        $inv['total']      = (float)$inv['total'];
        $inv['remise_pct'] = (float)$inv['remise_pct'];
        $inv['montant_remise'] = (float)$inv['montant_remise'];

        $items = $db->prepare('SELECT * FROM invoice_items WHERE invoice_id = ?');
        $items->execute([$inv['id']]);
        $inv['articles'] = array_map(function ($i) {
            return [
                'nom'      => $i['nom'],
                'prix'     => (float)$i['prix'],
                'quantite' => (int)$i['quantite'],
                'total'    => (float)$i['total'],
            ];
        }, $items->fetchAll());
    }
    unset($inv);

    jsonOk(['invoices' => $invoices, 'total' => $total, 'page' => $page, 'limit' => $limit]);
}

// ── POST — créer une facture ──────────────────────────
if ($method === 'POST') {
    $auth = requireAuth(['admin', 'manager', 'caisse']);

    $body    = getBody();
    $client  = trim($body['client'] ?? 'Client anonyme');
    $remise  = min(100, max(0, (float)($body['remise'] ?? 0)));
    $articles = $body['articles'] ?? [];

    if (empty($articles)) jsonError('Articles requis');

    $db->beginTransaction();
    try {
        $sousTotal  = 0;
        $validated  = [];

        foreach ($articles as $art) {
            $prodId = (int)($art['product_id'] ?? 0);
            $qty    = max(1, (int)($art['quantite'] ?? 1));

            if ($prodId) {
                $prod = $db->prepare('SELECT * FROM products WHERE id = ? FOR UPDATE');
                $prod->execute([$prodId]);
                $product = $prod->fetch();
                if (!$product) throw new RuntimeException("Produit #$prodId introuvable");
                if ($product['stock'] < $qty) throw new RuntimeException("Stock insuffisant pour {$product['name']}");

                $prix  = (float)$product['price'];
                $total = $prix * $qty;
                $sousTotal += $total;

                $validated[] = [
                    'product_id' => $prodId,
                    'nom'        => $product['name'],
                    'prix'       => $prix,
                    'quantite'   => $qty,
                    'total'      => $total,
                ];

                // Deduct stock
                $db->prepare('UPDATE products SET stock = stock - ? WHERE id = ?')->execute([$qty, $prodId]);
            } else {
                // Article libre (sans ID produit)
                $prix  = (float)($art['prix'] ?? 0);
                $total = $prix * $qty;
                $sousTotal += $total;
                $validated[] = [
                    'product_id' => null,
                    'nom'        => $art['nom'] ?? 'Article',
                    'prix'       => $prix,
                    'quantite'   => $qty,
                    'total'      => $total,
                ];
            }
        }

        $montantRemise = ($sousTotal * $remise) / 100;
        $total         = $sousTotal - $montantRemise;

        $now    = new DateTime();
        $numero = 'FAC-' . $now->format('Ymd') . '-' . strtoupper(substr(uniqid(), -6));

        $db->prepare(
            'INSERT INTO invoices (numero, client_name, caissier_id, caissier_name, sous_total, remise_pct, montant_remise, total)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([$numero, $client, $auth['sub'], $auth['name'], $sousTotal, $remise, $montantRemise, $total]);

        $invoiceId = (int)$db->lastInsertId();

        $itemStmt = $db->prepare(
            'INSERT INTO invoice_items (invoice_id, product_id, nom, prix, quantite, total)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        foreach ($validated as $v) {
            $itemStmt->execute([$invoiceId, $v['product_id'], $v['nom'], $v['prix'], $v['quantite'], $v['total']]);
        }

        $db->commit();

        jsonOk([
            'id'             => $invoiceId,
            'numero'         => $numero,
            'client'         => $client,
            'caissier'       => $auth['name'],
            'sous_total'     => $sousTotal,
            'remise'         => $remise,
            'montant_remise' => $montantRemise,
            'total'          => $total,
            'articles'       => $validated,
            'date'           => $now->format('d/m/Y H:i'),
        ], 'Facture créée');

    } catch (RuntimeException $e) {
        $db->rollBack();
        jsonError($e->getMessage());
    } catch (Throwable $e) {
        $db->rollBack();
        jsonError('Erreur serveur: ' . $e->getMessage(), 500);
    }
}

jsonError('Méthode non autorisée', 405);
