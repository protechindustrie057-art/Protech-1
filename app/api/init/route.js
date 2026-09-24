import { getMongoDb } from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { requireInternalEndpointAccess } from '@/lib/internalEndpoint';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const denied = requireInternalEndpointAccess(req, {
    enabledEnv: 'ENABLE_INIT_API',
    tokenEnv: 'INIT_API_TOKEN',
  });
  if (denied) return denied;

  try {
    const db = await getMongoDb();

    // ========================================
    // 1. COLLECTION products (Produits)
    // ========================================
    const products = [
      {
        id: 1,
        name: "Cartouche d'encre noir 67A",
        price: 28.99,
        stock: 25,
        category: "cartouches",
        alert_threshold: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: "Papier A4 80g premium",
        price: 12.99,
        stock: 100,
        category: "papier",
        alert_threshold: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        name: "Clé USB 32 Go",
        price: 19.99,
        stock: 50,
        category: "stockage",
        alert_threshold: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        name: "Câble USB-C vers USB-A",
        price: 9.99,
        stock: 15,
        category: "cables",
        alert_threshold: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 5,
        name: "Batterie portable 20 000 mAh",
        price: 49.99,
        stock: 200,
        category: "accessoires",
        alert_threshold: 20,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // ========================================
    // 2. COLLECTION users (Utilisateurs)
    // ========================================
    const users = [
      {
        id: 1,
        name: "Prosper Minga",
        email: "prosper@protechtouch.com",
        role: "admin",
        createdAt: new Date()
      },
      {
        id: 2,
        name: "Client Test",
        email: "client@test.com",
        role: "client",
        createdAt: new Date()
      },
      {
        id: 3,
        name: "Manager Stock",
        email: "stock@protechtouch.com",
        role: "manager",
        createdAt: new Date()
      }
    ];

    // ========================================
    // 3. COLLECTION settings (Configuration)
    // ========================================
    const settings = [
      {
        key: "company_name",
        value: "ProTech Touch",
        type: "string",
        updatedAt: new Date()
      },
      {
        key: "alert_threshold_default",
        value: 10,
        type: "number",
        updatedAt: new Date()
      },
      {
        key: "tax_rate",
        value: 20,
        type: "number",
        updatedAt: new Date()
      },
      {
        key: "currency",
        value: "EUR",
        type: "string",
        updatedAt: new Date()
      }
    ];

    // ========================================
    // 4. COLLECTION orders (Commandes)
    // ========================================
    const orders = [
      {
        id: 1001,
        user_id: 1,
        products: [
          { product_id: 1, quantity: 2, price: 129.99 }
        ],
        total: 259.98,
        status: "delivered",
        createdAt: new Date("2025-05-20"),
        updatedAt: new Date("2025-05-20")
      },
      {
        id: 1002,
        user_id: 2,
        products: [
          { product_id: 2, quantity: 3, price: 19.99 },
          { product_id: 5, quantity: 5, price: 9.99 }
        ],
        total: 109.92,
        status: "pending",
        createdAt: new Date("2025-05-22"),
        updatedAt: new Date("2025-05-22")
      }
    ];

    // ========================================
    // 5. COLLECTION invoices (Factures)
    // ========================================
    const invoices = [
      {
        id: 5001,
        order_id: 1001,
        amount: 259.98,
        status: "paid",
        pdf_url: "/invoices/invoice_5001.pdf",
        createdAt: new Date("2025-05-20")
      },
      {
        id: 5002,
        order_id: 1002,
        amount: 109.92,
        status: "pending",
        pdf_url: null,
        createdAt: new Date("2025-05-22")
      }
    ];

    // ========================================
    // UPSERT (insert or update) toutes les collections
    // ========================================
    
    const result = {};

    // Products
    for (const product of products) {
      await db.collection('products').updateOne(
        { id: product.id },
        { $set: product },
        { upsert: true }
      );
    }
    result.products = `${products.length} produits ajoutés/mis à jour`;

    // Users
    for (const user of users) {
      await db.collection('users').updateOne(
        { id: user.id },
        { $set: user },
        { upsert: true }
      );
    }
    result.users = `${users.length} utilisateurs ajoutés/mis à jour`;

    // Settings
    for (const setting of settings) {
      await db.collection('settings').updateOne(
        { key: setting.key },
        { $set: setting },
        { upsert: true }
      );
    }
    result.settings = `${settings.length} paramètres ajoutés/mis à jour`;

    // Orders
    for (const order of orders) {
      await db.collection('orders').updateOne(
        { id: order.id },
        { $set: order },
        { upsert: true }
      );
    }
    result.orders = `${orders.length} commandes ajoutées/mis à jour`;

    // Invoices
    for (const invoice of invoices) {
      await db.collection('invoices').updateOne(
        { id: invoice.id },
        { $set: invoice },
        { upsert: true }
      );
    }
    result.invoices = `${invoices.length} factures ajoutées/mis à jour`;

    return NextResponse.json({
      success: true,
      message: "Base de données initialisée avec succès",
      details: result
    });

  } catch (error) {
    console.error("Erreur d'initialisation:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
