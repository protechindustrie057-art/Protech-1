// =====================================================
// TYPES CENTRAUX — ProTech Touch
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
  online?: boolean
  last_seen?: string
  machine_id?: string
  // Impression settings
  printing?: {
    pagesNumber?: number
    unitPrice?: number
    totalPrice?: number
    printType?: 'A4' | 'A3' | 'bache' | 'tshirt' | 'vinyl' | 'other'
  }
  machine_label?: string
}

export interface Product {
  id: number
  name: string
  price: number
  status?: 'pending' | 'executed'
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
  _id?: string
  id: number
  numero: string
  date: string
  type: 'ticket' | 'facture'
  paperSize?: '80' | '58' | 'A4'
  client: string
  clientPhone?: string
  caissier: string
  articles: InvoiceArticle[]
  sousTotal: number
  remise: number
  montantRemise: number
  tvaRate?: number
  montantTva?: number
  total: number
  status?: 'pending' | 'executed'
}

export interface ClientMachine {
  id: number
  name: string
  type: string
  description: string
  price: string
  image?: string
}

export interface ClientOrder {
  id: string
  customerName: string
  phone: string
  email: string
  serviceType: 'impression' | 'maintenance' | 'devis' | 'autre'
  productName: string
  machineName: string
  shirtBrand: string
  shirtColor: string
  quantity: number
  notes: string
  image?: string
  status: 'pending' | 'executed'
  createdAt: string
}

export interface ClientServiceRequest {
  id: string
  type: 'impression' | 'maintenance'
  name: string
  phone: string
  email: string
  printType?: string
  machineType?: string
  availabilityDate?: string
  message: string
  status: 'pending' | 'executed'
  createdAt: string
}

export interface AppSettings {
  rccm: string
  nif: string
  idNat: string
  phone: string
  usdRate: number
  taxRate: number
  defaultCurrency: 'CDF' | 'USD'
  backupInterval: number
  companyLogo?: string
  printing?: {
    pagesNumber?: number
    unitPrice?: number
    totalPrice?: number
    printType?: 'A4' | 'A3' | 'bache' | 'tshirt' | 'vinyl' | 'other'
  }
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

export interface UserPresence {
  _id?: string
  userId: number | string
  name: string
  email: string
  role: UserRole
  machineId: string
  machineName: string
  userAgent?: string | null
  ip?: string | null
  status: 'online' | 'offline'
  lastSeenAt: string
  createdAt?: string
  updatedAt?: string
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
  | 'reports'
