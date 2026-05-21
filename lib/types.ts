// =====================================================
// TYPES CENTRAUX — SK PARFUMERIE & COSMÉTIQUES
// =====================================================

export type UserRole = 'admin' | 'manager' | 'caisse'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  caisse_number?: number
  status?: 'actif' | 'inactif'
  last_login?: string
}

export interface Product {
  id: number
  name: string
  price: number
  stock: number
  alert_threshold: number
  category: string
  category_name?: string
  barcode?: string
  image?: string
}

export interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  total: number
}

export interface InvoiceArticle {
  nom: string
  prix: number
  quantite: number
  total: number
}

export interface Invoice {
  id: number
  numero: string
  date: string
  type: 'ticket' | 'facture'
  client: string
  caissier: string
  articles: InvoiceArticle[]
  sousTotal: number
  remise: number
  montantRemise: number
  total: number
}

export interface AppSettings {
  rccm: string
  nif: string
  idNat: string
  phone: string
  usdRate: number
  defaultCurrency: 'CDF' | 'USD'
  backupInterval: number
  companyLogo?: string
}

export interface DashboardData {
  todaySales: number
  totalStock: number
  lowStockCount: number
  totalUsers: number
  hourlySales: number[]
  topProducts: { name: string; quantity: number }[]
}

export type Currency = 'CDF' | 'USD'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  title: string
  message: string
  type: ToastType
}

export interface ActivityLog {
  _id?: string
  action: string
  entity: string
  entityId?: number | string | null
  actor?: {
    id?: number | string | null
    name?: string | null
    email?: string | null
    role?: string | null
  }
  summary: string
  details?: Record<string, unknown>
  ip?: string | null
  userAgent?: string | null
  createdAt: string
}

export type Language = 'fr' | 'en' | 'de'

export type ContentPage =
  | 'dashboard'
  | 'caisse'
  | 'products'
  | 'caissiers'
  | 'managers'
  | 'factures'
  | 'activity'
  | 'printers'
  | 'settings'
