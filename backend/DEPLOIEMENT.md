# SK Parfumerie — Guide de Déploiement Backend PHP

## Structure des fichiers

```
backend/
├── config/
│   ├── database.php        ← Connexion PDO + config JWT
│   └── helpers.php         ← CORS, JWT, middlewares
├── database/
│   └── schema.sql          ← Schéma complet MySQL
├── endpoints/
│   ├── auth.php            ← POST /login
│   ├── products.php        ← CRUD produits + upload image
│   ├── invoices.php        ← Création + liste factures
│   ├── users.php           ← CRUD utilisateurs + changement MDP
│   ├── settings.php        ← Paramètres + upload logo
│   └── dashboard.php       ← Statistiques tableau de bord
├── uploads/
│   ├── products/           ← Images produits (auto-créé)
│   └── logos/              ← Logos entreprise (auto-créé)
└── .htaccess
```

## Prérequis serveur

- PHP 8.1+ avec extensions : `pdo_mysql`, `fileinfo`, `json`
- MySQL 5.7+ ou MariaDB 10.4+
- Apache avec `mod_rewrite` et `mod_headers`

## Étapes de déploiement

### 1. Base de données

```bash
mysql -u root -p < backend/database/schema.sql
```

### 2. Configuration

Modifier `backend/config/database.php` :
```php
define('DB_HOST', 'votre-host');
define('DB_NAME', 'sk_parfumerie');
define('DB_USER', 'votre-user');
define('DB_PASS', 'votre-password');
define('JWT_SECRET', 'changez-cette-cle-secrete-longue-et-aleatoire');
```

### 3. Permissions des dossiers d'upload

```bash
mkdir -p backend/uploads/products backend/uploads/logos
chmod 755 backend/uploads/products backend/uploads/logos
chown www-data:www-data backend/uploads -R
```

### 4. URL de l'API dans le frontend

Dans `lib/store.ts`, définir l'URL de l'API :
```typescript
export const API_BASE_URL = 'https://votre-domaine.com/backend/endpoints'
```

## Endpoints disponibles

| Méthode | URL | Description | Rôles |
|---------|-----|-------------|-------|
| POST | /auth.php | Connexion | Public |
| GET | /products.php | Liste produits | Tous |
| POST | /products.php | Créer produit + image | Admin, Manager |
| PUT | /products.php?id=X | Modifier produit | Admin, Manager |
| DELETE | /products.php?id=X | Supprimer produit | Admin |
| GET | /invoices.php | Liste factures | Admin, Manager, Caisse |
| POST | /invoices.php | Créer facture | Tous |
| GET | /users.php | Liste utilisateurs | Admin, Manager |
| POST | /users.php | Créer utilisateur | Admin |
| PUT | /users.php?id=X | Modifier / changer MDP | Admin + soi-même |
| DELETE | /users.php?id=X | Supprimer utilisateur | Admin |
| GET | /settings.php | Lire paramètres | Tous |
| PUT | /settings.php | Modifier paramètres | Admin |
| POST | /settings.php | Upload logo | Admin |
| GET | /dashboard.php | Statistiques | Admin, Manager |

## Authentification

Toutes les requêtes protégées nécessitent un header :
```
Authorization: Bearer <JWT_TOKEN>
```

Le token est retourné par `POST /auth.php` et expire après 8 heures.

## Compte admin par défaut

- Email : `admin@skparfumerie.cd`
- Mot de passe : `admin123`

**Changer immédiatement ce mot de passe après le premier déploiement.**
