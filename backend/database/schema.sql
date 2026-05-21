-- =====================================================
-- SK PARFUMERIE & COSMÉTIQUES — Schéma Base de Données
-- =====================================================

CREATE DATABASE IF NOT EXISTS sk_parfumerie
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sk_parfumerie;

-- ── Utilisateurs ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('admin','manager','caisse') NOT NULL DEFAULT 'caisse',
  caisse_number INT           DEFAULT NULL,
  status        ENUM('actif','inactif') NOT NULL DEFAULT 'actif',
  last_login    DATETIME      DEFAULT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Compte admin par défaut (password: admin123)
INSERT INTO users (name, email, password_hash, role) VALUES
('Administrateur', 'admin@skparfumerie.cd', '$2y$12$0oCO3TzdK5s5vJHAExGvbODx/YpLCjVtC3U7OiGFJ7rn7hv3G8JaG', 'admin')
ON DUPLICATE KEY UPDATE id=id;

-- ── Catégories ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(50)  NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO categories (slug, name) VALUES
('parfums',   'Parfums'),
('laits',     'Laits & Crèmes'),
('rouges',    'Rouges à Lèvres'),
('maquillage','Maquillage'),
('soins',     'Soins'),
('cheveux',   'Cheveux'),
('divers',    'Divers');

-- ── Produits ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  price           DECIMAL(15,2) NOT NULL DEFAULT 0,
  stock           INT          NOT NULL DEFAULT 0,
  alert_threshold INT          NOT NULL DEFAULT 5,
  category_slug   VARCHAR(50)  NOT NULL DEFAULT 'divers',
  barcode         VARCHAR(50)  DEFAULT NULL UNIQUE,
  image_path      VARCHAR(500) DEFAULT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_slug) REFERENCES categories(slug) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Factures ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  numero         VARCHAR(50)   NOT NULL UNIQUE,
  client_name    VARCHAR(200)  NOT NULL DEFAULT 'Client anonyme',
  caissier_id    INT           DEFAULT NULL,
  caissier_name  VARCHAR(100)  NOT NULL,
  sous_total     DECIMAL(15,2) NOT NULL,
  remise_pct     DECIMAL(5,2)  NOT NULL DEFAULT 0,
  montant_remise DECIMAL(15,2) NOT NULL DEFAULT 0,
  total          DECIMAL(15,2) NOT NULL,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (caissier_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Lignes de facture ─────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT           NOT NULL,
  product_id INT           DEFAULT NULL,
  nom        VARCHAR(200)  NOT NULL,
  prix       DECIMAL(15,2) NOT NULL,
  quantite   INT           NOT NULL,
  total      DECIMAL(15,2) NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Paramètres application ────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  rccm             VARCHAR(100) DEFAULT 'CD/KIN/2024/A/1234',
  nif              VARCHAR(100) DEFAULT 'A2024123456X',
  id_nat           VARCHAR(100) DEFAULT '01-123456-78',
  phone            VARCHAR(50)  DEFAULT '+243 992 381 922',
  usd_rate         INT          NOT NULL DEFAULT 2850,
  default_currency ENUM('CDF','USD') NOT NULL DEFAULT 'CDF',
  backup_interval  INT          NOT NULL DEFAULT 1,
  company_logo     TEXT         DEFAULT NULL,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO settings (id) VALUES (1);

-- ── Images produits (uploads) ─────────────────────────
-- Les images sont stockées dans /backend/uploads/products/
