'use client'
// =====================================================
// STORE GLOBAL (localStorage) — SK PARFUMERIE
// =====================================================

import type {
  User,
  Product,
  CartItem,
  Invoice,
  AppSettings,
  Currency,
  Language,
} from './types'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

// ── Default products ──────────────────────────────────
export const DEFAULT_PRODUCTS: Omit<Product, 'id'>[] = [
  { name: 'Dior Sauvage', price: 85000, stock: 12, alert_threshold: 3, category: 'parfums', category_name: 'Parfums', barcode: '30011' },
  { name: 'Chanel N°5', price: 95000, stock: 8, alert_threshold: 3, category: 'parfums', category_name: 'Parfums', barcode: '30012' },
  { name: 'Lait Corps Nivea', price: 8500, stock: 25, alert_threshold: 5, category: 'laits', category_name: 'Laits & Crèmes', barcode: '30013' },
  { name: 'Rouge Dior', price: 32000, stock: 15, alert_threshold: 4, category: 'rouges', category_name: 'Rouges à Lèvres', barcode: '30014' },
  { name: 'Fond de teint MAC', price: 45000, stock: 10, alert_threshold: 3, category: 'maquillage', category_name: 'Maquillage', barcode: '30015' },
  { name: 'Crème Hydratante', price: 12000, stock: 20, alert_threshold: 5, category: 'soins', category_name: 'Soins', barcode: '30016' },
  { name: 'Shampooing Kerastase', price: 28000, stock: 7, alert_threshold: 3, category: 'cheveux', category_name: 'Cheveux', barcode: '30017' },
  { name: 'Yves Saint Laurent', price: 92000, stock: 5, alert_threshold: 2, category: 'parfums', category_name: 'Parfums', barcode: '30018' },
  { name: 'Crème Nuit', price: 18000, stock: 14, alert_threshold: 4, category: 'soins', category_name: 'Soins', barcode: '30019' },
  { name: 'Mascara Lancôme', price: 38000, stock: 9, alert_threshold: 3, category: 'maquillage', category_name: 'Maquillage', barcode: '30020' },
  { name: 'Parfum Gucci', price: 78000, stock: 6, alert_threshold: 2, category: 'parfums', category_name: 'Parfums', barcode: '30021' },
  { name: 'Lait Corps', price: 7500, stock: 30, alert_threshold: 8, category: 'laits', category_name: 'Laits & Crèmes', barcode: '30022' },
  { name: 'Rouge Chanel', price: 35000, stock: 12, alert_threshold: 4, category: 'rouges', category_name: 'Rouges à Lèvres', barcode: '30023' },
  { name: 'Poudre Libre', price: 22000, stock: 11, alert_threshold: 3, category: 'maquillage', category_name: 'Maquillage', barcode: '30024' },
  { name: 'Sérum Visage', price: 55000, stock: 8, alert_threshold: 2, category: 'soins', category_name: 'Soins', barcode: '30025' },
  { name: 'Après-shampooing', price: 15000, stock: 18, alert_threshold: 5, category: 'cheveux', category_name: 'Cheveux', barcode: '30026' },
  { name: 'Parfum Hugo Boss', price: 62000, stock: 4, alert_threshold: 2, category: 'parfums', category_name: 'Parfums', barcode: '30027' },
  { name: 'Crème Mains', price: 9500, stock: 22, alert_threshold: 6, category: 'soins', category_name: 'Soins', barcode: '30028' },
  { name: 'Vernis à ongles', price: 6500, stock: 35, alert_threshold: 8, category: 'maquillage', category_name: 'Maquillage', barcode: '30029' },
  { name: 'Baume à lèvres', price: 4500, stock: 40, alert_threshold: 10, category: 'soins', category_name: 'Soins', barcode: '30030' },
  { name: 'Parfum Calvin Klein', price: 58000, stock: 7, alert_threshold: 2, category: 'parfums', category_name: 'Parfums', barcode: '30031' },
  { name: 'Gel Douche', price: 8000, stock: 28, alert_threshold: 7, category: 'soins', category_name: 'Soins', barcode: '30032' },
  { name: 'Eye-liner', price: 14000, stock: 16, alert_threshold: 4, category: 'maquillage', category_name: 'Maquillage', barcode: '30033' },
  { name: 'Crème Contour Yeux', price: 42000, stock: 6, alert_threshold: 2, category: 'soins', category_name: 'Soins', barcode: '30034' },
  { name: 'Huile Capillaire', price: 19000, stock: 13, alert_threshold: 4, category: 'cheveux', category_name: 'Cheveux', barcode: '30035' },
  { name: 'Parfum Paco Rabanne', price: 72000, stock: 5, alert_threshold: 2, category: 'parfums', category_name: 'Parfums', barcode: '30036' },
  { name: 'Déodorant', price: 5500, stock: 45, alert_threshold: 10, category: 'divers', category_name: 'Divers', barcode: '30037' },
]

// ── Helpers ───────────────────────────────────────────
function getLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function setLS(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {/* quota exceeded */}
}

// ── Products ──────────────────────────────────────────
export function loadProductsFromLS(): Product[] {
  const stored = getLS<Product[] | null>('sk_products', null)
  if (stored && stored.length > 0) return stored
  // Seed defaults on first run
  const withIds = DEFAULT_PRODUCTS.map((p, i) => ({ ...p, id: i + 1 }))
  setLS('sk_products', withIds)
  return withIds
}

export function saveProductsToLS(products: Product[]) {
  setLS('sk_products', products)
}

// ── Cart ──────────────────────────────────────────────
export function loadCartFromLS(): CartItem[] {
  return getLS<CartItem[]>('sk_cart', [])
}

export function saveCartToLS(cart: CartItem[]) {
  setLS('sk_cart', cart)
}

// ── Invoices ──────────────────────────────────────────
export function loadInvoicesFromLS(): Invoice[] {
  return getLS<Invoice[]>('sk_invoices', [])
}

export function saveInvoicesToLS(invoices: Invoice[]) {
  setLS('sk_invoices', invoices)
}

// ── Users (caissiers / managers) ─────────────────────
export function loadUsersFromLS(role: 'caisse' | 'manager'): User[] {
  return getLS<User[]>(`sk_users_${role}`, [])
}

export function saveUsersToLS(role: 'caisse' | 'manager', users: User[]) {
  setLS(`sk_users_${role}`, users)
}

// ── Settings ──────────────────────────────────────────
export const DEFAULT_SETTINGS: AppSettings = {
  rccm: 'CD/KIN/2024/A/1234',
  nif: 'A2024123456X',
  idNat: '01-123456-78',
  phone: '+243 992 381 922',
  usdRate: 2850,
  defaultCurrency: 'CDF',
  backupInterval: 1,
}

export function loadSettingsFromLS(): AppSettings {
  return getLS<AppSettings>('sk_settings', DEFAULT_SETTINGS)
}

export function saveSettingsToLS(settings: AppSettings) {
  setLS('sk_settings', settings)
}

// ── Auth ──────────────────────────────────────────────
const PASSWORD_HASH_PREFIX = 'sha256$'
const ADMIN_DEFAULT_PASSWORD_HASH = `${PASSWORD_HASH_PREFIX}240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9`
const ADMIN_ID = 1

const ADMIN_CREDENTIALS = {
  email: 'admin@skparfumerie.cd',
  user: {
    id: ADMIN_ID,
    name: 'Administrateur',
    email: 'admin@skparfumerie.cd',
    role: 'admin' as const,
  },
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(password))
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  return `${PASSWORD_HASH_PREFIX}${hash}`
}

function isPasswordHash(value: string | undefined): value is string {
  return Boolean(value?.startsWith(PASSWORD_HASH_PREFIX))
}

async function verifyPassword(storedValue: string | undefined, password: string): Promise<boolean> {
  if (!storedValue) return false
  if (isPasswordHash(storedValue)) return storedValue === await hashPassword(password)

  return storedValue === password
}

function getAdminPasswordHash(): string {
  const passwords = getLS<Record<number, string>>('sk_user_passwords', {})
  return passwords[ADMIN_ID] ?? ADMIN_DEFAULT_PASSWORD_HASH
}

export async function authenticate(email: string, password: string): Promise<User | null> {
  // Check admin
  const passwords = getLS<Record<number, string>>('sk_user_passwords', {})

  if (email === ADMIN_CREDENTIALS.email && await verifyPassword(getAdminPasswordHash(), password)) {
    if (!isPasswordHash(passwords[ADMIN_ID])) await saveUserPassword(ADMIN_ID, password)
    return ADMIN_CREDENTIALS.user
  }
  // Check caissiers
  const caissiers = loadUsersFromLS('caisse')
  const caissier = caissiers.find((u) => u.email === email)
  if (caissier) {
    if (await verifyPassword(passwords[caissier.id], password)) {
      if (!isPasswordHash(passwords[caissier.id])) await saveUserPassword(caissier.id, password)
      return caissier
    }
  }
  // Check managers
  const managers = loadUsersFromLS('manager')
  const manager = managers.find((u) => u.email === email)
  if (manager) {
    if (await verifyPassword(passwords[manager.id], password)) {
      if (!isPasswordHash(passwords[manager.id])) await saveUserPassword(manager.id, password)
      return manager
    }
  }
  return null
}

export async function saveUserPassword(userId: number, password: string) {
  const passwords = getLS<Record<number, string>>('sk_user_passwords', {})
  passwords[userId] = await hashPassword(password)
  setLS('sk_user_passwords', passwords)
}

/**
 * Change the admin password.
 * Returns true on success, false if currentPassword is wrong.
 */
export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<boolean> {
  if (!await verifyPassword(getAdminPasswordHash(), currentPassword)) return false
  await saveUserPassword(ADMIN_ID, newPassword)
  return true
}

/**
 * Change any user password (caissier/manager).
 * Returns true on success, false if currentPassword is wrong.
 */
export async function changeUserPassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
  const passwords = getLS<Record<number, string>>('sk_user_passwords', {})
  if (!await verifyPassword(passwords[userId], currentPassword)) return false
  passwords[userId] = await hashPassword(newPassword)
  setLS('sk_user_passwords', passwords)
  return true
}

// ── Currency formatting ───────────────────────────────
export function formatPrice(
  amount: number,
  currency: Currency,
  usdRate = 2850
): string {
  if (isNaN(amount)) return '0 FC'
  if (currency === 'USD') {
    return '$' + (amount / usdRate).toFixed(2)
  }
  return amount.toLocaleString('fr-CD') + ' FC'
}

// ── Sales persistence ─────────────────────────────────
export interface Sale {
  id: number
  date: string
  total: number
  items: CartItem[]
  cashier: string
}

export function loadSalesFromLS(): Sale[] {
  return getLS<Sale[]>('sk_sales', [])
}

export function saveSaleToLS(sale: Sale) {
  const sales = loadSalesFromLS()
  sales.unshift(sale)
  setLS('sk_sales', sales.slice(0, 500)) // keep last 500
}
