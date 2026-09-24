'use client'
// =====================================================
// STORE GLOBAL (localStorage) — ProTech Touch
// =====================================================

import bcrypt from 'bcryptjs'
import type {
  User,
  Product,
  CartItem,
  Invoice,
  AppSettings,
  Currency,
  Language,
  ClientOrder,
  ClientServiceRequest,
} from './types'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

// ── Default products ──────────────────────────────────
export const DEFAULT_PRODUCTS: Omit<Product, 'id'>[] = [
  { name: 'Cartouche d\'encre noir 67A', price: 28000, stock: 18, alert_threshold: 5, category: 'cartouches', category_name: 'Cartouches & encres', barcode: '10011', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80' },
  { name: 'Cartouche d\'encre couleur 67A', price: 32000, stock: 12, alert_threshold: 4, category: 'cartouches', category_name: 'Cartouches & encres', barcode: '10012', image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=900&q=80' },
  { name: 'Papier A4 80g premium', price: 6500, stock: 42, alert_threshold: 10, category: 'papier', category_name: 'Papier & supports', barcode: '10013', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80' },
  { name: 'Câble USB-C vers USB-A', price: 9500, stock: 30, alert_threshold: 8, category: 'cables', category_name: 'Câbles & accessoires', barcode: '10014', image: 'https://images.unsplash.com/photo-1526570207772-784f6b3c2f3b?auto=format&fit=crop&w=900&q=80' },
  { name: 'Clé USB 32 Go', price: 22000, stock: 16, alert_threshold: 4, category: 'stockage', category_name: 'Stockage & mémoire', barcode: '10015', image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=900&q=80' },
  { name: 'Disque SSD 1 To', price: 44000, stock: 9, alert_threshold: 3, category: 'stockage', category_name: 'Stockage & mémoire', barcode: '10016', image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=900&q=80' },
  { name: 'Batterie portable 20 000 mAh', price: 36000, stock: 14, alert_threshold: 4, category: 'accessoires', category_name: 'Accessoires', barcode: '10017', image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=900&q=80' },
  { name: 'Rouleau thermique transfert', price: 18000, stock: 20, alert_threshold: 5, category: 'impression', category_name: 'Impression & maintenance', barcode: '10018', image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80' },
  { name: 'Nettoyage tête d\'impression', price: 16000, stock: 11, alert_threshold: 3, category: 'impression', category_name: 'Impression & maintenance', barcode: '10019', image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=80' },
  { name: 'Housse de protection ordinateur portable', price: 12000, stock: 24, alert_threshold: 6, category: 'accessoires', category_name: 'Accessoires', barcode: '10020', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80' },
  { name: 'Rouleau de maintenance imprimante', price: 25000, stock: 8, alert_threshold: 2, category: 'impression', category_name: 'Impression & maintenance', barcode: '10021', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80' },
  { name: 'Carte mémoire microSD 128 Go', price: 17000, stock: 21, alert_threshold: 5, category: 'stockage', category_name: 'Stockage & mémoire', barcode: '10022', image: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80' },
  { name: 'Filtre anti-poussière PC', price: 9000, stock: 28, alert_threshold: 7, category: 'accessoires', category_name: 'Accessoires', barcode: '10023', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80' },
  { name: 'Papier photo A4 satin', price: 11000, stock: 19, alert_threshold: 5, category: 'papier', category_name: 'Papier & supports', barcode: '10024', image: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=900&q=80' },
  { name: 'Toner monochrome laser', price: 29000, stock: 10, alert_threshold: 3, category: 'cartouches', category_name: 'Cartouches & encres', barcode: '10025', image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=80' },
  { name: 'Câble HDMI 2m', price: 12000, stock: 26, alert_threshold: 7, category: 'cables', category_name: 'Câbles & accessoires', barcode: '10026', image: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80' },
  { name: 'Adaptateur USB vers VGA', price: 15000, stock: 13, alert_threshold: 4, category: 'cables', category_name: 'Câbles & accessoires', barcode: '10027', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80' },
  { name: 'Tambour de nettoyage imprimante', price: 21000, stock: 7, alert_threshold: 2, category: 'impression', category_name: 'Impression & maintenance', barcode: '10028', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80' },
  { name: 'Stylet tactile pour tablette', price: 18000, stock: 15, alert_threshold: 4, category: 'accessoires', category_name: 'Accessoires', barcode: '10029', image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80' },
  { name: 'Disque dur externe 2 To', price: 52000, stock: 6, alert_threshold: 2, category: 'stockage', category_name: 'Stockage & mémoire', barcode: '10030', image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=900&q=80' },
  { name: 'Papier d\'impression transfert', price: 14000, stock: 18, alert_threshold: 5, category: 'papier', category_name: 'Papier & supports', barcode: '10031', image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80' },
  { name: 'Cartouche de toner couleur', price: 35000, stock: 11, alert_threshold: 3, category: 'cartouches', category_name: 'Cartouches & encres', barcode: '10032', image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=80' },
  { name: 'Hub USB 4 ports', price: 14000, stock: 22, alert_threshold: 5, category: 'cables', category_name: 'Câbles & accessoires', barcode: '10033', image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=900&q=80' },
  { name: 'Support ventilé pour PC', price: 17000, stock: 8, alert_threshold: 2, category: 'accessoires', category_name: 'Accessoires', barcode: '10034', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80' },
  { name: 'DVD-R 50 unités', price: 7000, stock: 33, alert_threshold: 8, category: 'divers', category_name: 'Divers', barcode: '10035', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80' },
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
  const stored = getLS<Product[] | null>('protech_products', null)

  const hasLegacyBeautyProducts = Array.isArray(stored) && stored.some((product) => {
    const name = (product.name || '').toLowerCase()
    const category = (product.category || '').toLowerCase()
    return /dior|chanel|parfum|gucci|boss|calvin|nivea|rouge|mac|kerastase|lait|maquillage|soin|cheveux|femme|portrait|beauty|cosmetics/i.test(name + ' ' + category) || product.category === 'parfums' || product.category === 'maquillage' || product.category === 'soins'
  })

  if (stored && stored.length > 0 && !hasLegacyBeautyProducts) return stored

  const withIds = DEFAULT_PRODUCTS.map((p, i) => ({
    ...p,
    id: i + 1,
    image: p.image || (() => {
      const category = (p.category || 'default').toLowerCase()
      if (category.includes('cartouches')) return 'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?auto=format&fit=crop&w=900&q=80'
      if (category.includes('papier')) return 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80'
      if (category.includes('stockage')) return 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=900&q=80'
      if (category.includes('cables')) return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80'
      if (category.includes('accessoires')) return 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80'
      if (category.includes('impression')) return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80'
      return 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=900&q=80'
    })(),
  }))
  setLS('protech_products', withIds)
  return withIds
}

export function saveProductsToLS(products: Product[]) {
  setLS('protech_products', products)
}

// ── Cart ──────────────────────────────────────────────
export function loadCartFromLS(): CartItem[] {
  return getLS<CartItem[]>('protech_cart', [])
}

export function saveCartToLS(cart: CartItem[]) {
  setLS('protech_cart', cart)
}

// ── Invoices ──────────────────────────────────────────
export function loadInvoicesFromLS(): Invoice[] {
  return getLS<Invoice[]>('protech_invoices', [])
}

export function saveInvoicesToLS(invoices: Invoice[]) {
  setLS('protech_invoices', invoices)
}

// ── Users (caissiers / managers) ─────────────────────
export function loadUsersFromLS(role: 'caisse' | 'manager'): User[] {
  return getLS<User[]>(`protech_users_${role}`, [])
}

export function saveUsersToLS(role: 'caisse' | 'manager', users: User[]) {
  setLS(`protech_users_${role}`, users)
}

// ── Client orders & service requests ─────────────────
export function loadClientOrdersFromLS(): ClientOrder[] {
  return getLS<ClientOrder[]>('protech_client_orders', [])
}

export function saveClientOrdersToLS(orders: ClientOrder[]) {
  setLS('protech_client_orders', orders)
}

export function loadServiceRequestsFromLS(): ClientServiceRequest[] {
  return getLS<ClientServiceRequest[]>('protech_service_requests', [])
}

export function saveServiceRequestsToLS(requests: ClientServiceRequest[]) {
  setLS('protech_service_requests', requests)
}

// ── Settings ──────────────────────────────────────────
export const DEFAULT_SETTINGS: AppSettings = {
  rccm: 'CD/KIN/2024/A/1234',
  nif: 'A2024123456X',
  idNat: '01-123456-78',
  phone: '+243 992 381 922',
  usdRate: 2850,
  taxRate: 0,
  defaultCurrency: 'CDF',
  backupInterval: 1,
  printing: {
    pagesNumber: 1,
    unitPrice: 0,
    totalPrice: 0,
    printType: 'A4',
  },
}

export function loadSettingsFromLS(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...getLS<Partial<AppSettings>>('protech_settings', DEFAULT_SETTINGS) }
}

export function saveSettingsToLS(settings: AppSettings) {
  setLS('protech_settings', { ...DEFAULT_SETTINGS, ...settings })
}

// ── Auth ──────────────────────────────────────────────
const LEGACY_PASSWORD_HASH_PREFIX = 'sha256$'
const CLIENT_BCRYPT_PREFIX = '$2'
const CLIENT_BCRYPT_COST = 10
const ADMIN_ID = 1
const LOCAL_ADMIN_CREDENTIALS_KEY = 'protech_admin_credentials'

const ADMIN_CREDENTIALS = {
  email: 'admin@protechtouch.com',
  user: {
    id: ADMIN_ID,
    name: 'Administrateur',
    email: 'admin@protechtouch.com',
    role: 'admin' as const,
  },
}

type LocalAdminCredentials = {
  email: string
  name: string
  passwordHash: string
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hashSync(password, CLIENT_BCRYPT_COST)
}

async function hashLegacyPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(password))
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  return `${LEGACY_PASSWORD_HASH_PREFIX}${hash}`
}

function isCurrentPasswordHash(value: string | undefined): value is string {
  return Boolean(value?.startsWith(CLIENT_BCRYPT_PREFIX))
}

async function verifyPassword(storedValue: string | undefined, password: string): Promise<boolean> {
  if (!storedValue) return false
  if (storedValue.startsWith(LEGACY_PASSWORD_HASH_PREFIX)) return storedValue === await hashLegacyPassword(password)
  if (isCurrentPasswordHash(storedValue)) return bcrypt.compareSync(password, storedValue)

  return storedValue === password
}

function loadLocalAdminCredentials() {
  return getLS<LocalAdminCredentials | null>(LOCAL_ADMIN_CREDENTIALS_KEY, null)
}

async function saveLocalAdminCredentials(email: string, password: string, name = 'Administrateur') {
  setLS(LOCAL_ADMIN_CREDENTIALS_KEY, {
    email: email.trim().toLowerCase(),
    name,
    passwordHash: await hashPassword(password),
  })
}

async function authenticateLocalAdmin(email: string, password: string): Promise<User | null> {
  const credentials = loadLocalAdminCredentials()
  if (!credentials) return null
  if (credentials.email !== email.trim().toLowerCase()) return null
  if (!await verifyPassword(credentials.passwordHash, password)) return null

  return {
    id: ADMIN_ID,
    name: credentials.name || 'Administrateur',
    email: credentials.email,
    role: 'admin',
    status: 'actif',
  }
}

function buildApiUrl(baseUrl: string, endpoint: string) {
  return `${baseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`
}

async function fetchAuthApi<T>(baseUrl: string, endpoint: string, payload: unknown, method = 'POST'): Promise<T | null> {
  const url = buildApiUrl(baseUrl, endpoint)
  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: method === 'GET' ? undefined : JSON.stringify(payload),
  }).catch(() => null)
  if (!response) return null

  const result = await response.json().catch(() => null)

  if (!response.ok || result?.success === false) return null
  return result?.data ?? ({} as T)
}

async function callAuthApi<T>(endpoint: string, payload: unknown, method = 'POST'): Promise<T | null> {
  const primary = await fetchAuthApi<T>(API_BASE_URL, endpoint, payload, method)
  if (primary || API_BASE_URL === '/api') return primary

  return fetchAuthApi<T>('/api', endpoint, payload, method)
}

async function fetchAuthApiOrThrow<T>(baseUrl: string, endpoint: string, payload: unknown, method = 'POST'): Promise<T> {
  const url = buildApiUrl(baseUrl, endpoint)
  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: method === 'GET' ? undefined : JSON.stringify(payload),
  })

  const result = await response.json().catch(() => null)
  if (!response.ok || result?.success === false) {
    throw new Error(result?.message || 'Modification impossible')
  }

  return result?.data ?? ({} as T)
}

async function callAuthApiOrThrow<T>(endpoint: string, payload: unknown, method = 'POST'): Promise<T> {
  try {
    return await fetchAuthApiOrThrow<T>(API_BASE_URL, endpoint, payload, method)
  } catch (error) {
    if (API_BASE_URL === '/api') throw error
    return fetchAuthApiOrThrow<T>('/api', endpoint, payload, method)
  }
}

export async function authenticate(email: string, password: string): Promise<User | null> {
  // Check central server accounts first.
  const data = await callAuthApi<{ user: User }>('auth/login', { email, password })
  if (data?.user) {
    if (data.user.role === 'admin') {
      await saveLocalAdminCredentials(data.user.email || email, password, data.user.name)
    }
    return data.user
  }

  const localAdmin = await authenticateLocalAdmin(email, password)
  if (localAdmin) return localAdmin

  const passwords = getLS<Record<number, string>>('protech_user_passwords', {})
  // Check caissiers
  const caissiers = loadUsersFromLS('caisse')
  const caissier = caissiers.find((u) => u.email === email)
  if (caissier) {
    if (await verifyPassword(passwords[caissier.id], password)) {
      if (!isCurrentPasswordHash(passwords[caissier.id])) await saveUserPassword(caissier.id, password)
      return caissier
    }
  }
  // Check managers
  const managers = loadUsersFromLS('manager')
  const manager = managers.find((u) => u.email === email)
  if (manager) {
    if (await verifyPassword(passwords[manager.id], password)) {
      if (!isCurrentPasswordHash(passwords[manager.id])) await saveUserPassword(manager.id, password)
      return manager
    }
  }
  return null
}

export async function saveUserPassword(userId: number, password: string) {
  const passwords = getLS<Record<number, string>>('protech_user_passwords', {})
  passwords[userId] = await hashPassword(password)
  setLS('protech_user_passwords', passwords)
}

/**
 * Change the admin password.
 * Returns true on success, false if currentPassword is wrong.
 */
export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<boolean> {
  const data = await callAuthApi('auth/admin-password', { currentPassword, newPassword }, 'PUT')
  if (data !== null) {
    const credentials = loadLocalAdminCredentials()
    await saveLocalAdminCredentials(credentials?.email || ADMIN_CREDENTIALS.email, newPassword, credentials?.name)
  }
  return data !== null
}

export async function getAdminAccount(): Promise<{ email: string; name: string } | null> {
  return callAuthApi<{ email: string; name: string }>('auth/admin-password', undefined, 'GET')
}

export async function updateAdminAccount(input: {
  email: string
  name: string
  currentPassword: string
  newPassword?: string
}): Promise<{ email: string; name: string } | null> {
  const result = await callAuthApiOrThrow<{ email: string; name: string }>('auth/admin-password', input, 'PUT')
  if (result?.email) {
    await saveLocalAdminCredentials(result.email, input.newPassword || input.currentPassword, result.name || input.name)
  }
  return result
}

/**
 * Change any user password (caissier/manager).
 * Returns true on success, false if currentPassword is wrong.
 */
export async function changeUserPassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
  const passwords = getLS<Record<number, string>>('protech_user_passwords', {})
  if (!await verifyPassword(passwords[userId], currentPassword)) return false
  passwords[userId] = await hashPassword(newPassword)
  setLS('protech_user_passwords', passwords)
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
  return getLS<Sale[]>('protech_sales', [])
}

export function saveSaleToLS(sale: Sale) {
  const sales = loadSalesFromLS()
  sales.unshift(sale)
  setLS('protech_sales', sales.slice(0, 500)) // keep last 500
}
