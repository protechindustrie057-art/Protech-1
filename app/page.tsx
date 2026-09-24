'use client'

import { useState, useCallback, useEffect } from 'react'
import type { User, Product, CartItem, Invoice, AppSettings, Currency, ContentPage, UserPresence } from '@/lib/types'
import type { Language } from '@/lib/types'
import {
  loadProductsFromLS, saveProductsToLS,
  loadCartFromLS, saveCartToLS,
  loadInvoicesFromLS, saveInvoicesToLS,
  loadUsersFromLS, saveUsersToLS,
  loadSettingsFromLS, saveSettingsToLS,
  saveUserPassword,
  formatPrice,
  DEFAULT_PRODUCTS,
} from '@/lib/store'
import { initSync, enqueuePendingOperation, getPendingCount, synchronize } from '@/lib/sync'

import LoginPage from '@/components/LoginPage'
import Header from '@/components/Header'
import GlobalTranslator from '@/components/GlobalTranslator'
import Sidebar from '@/components/Sidebar'
import ToastContainer from '@/components/ToastContainer'
import DashboardPage from '@/components/pages/DashboardPage'
import CaissePage from '@/components/pages/CaissePage'
import ProductsPage from '@/components/pages/ProductsPage'
import UsersPage from '@/components/pages/UsersPage'
import FacturesPage from '@/components/pages/FacturesPage'
import ActivityLogsPage from '@/components/pages/ActivityLogsPage'
import DailyReportsPage from '@/components/pages/DailyReportsPage'
import PrintersPage from '@/components/pages/PrintersPage'
import SettingsPage from '@/components/pages/SettingsPage'
import type { ToastMessage, ToastType } from '@/lib/types'
import { apiCall } from '@/lib/api'

// ─────────────────────────────────────────────────────────
// Invoice Modal (inline, used when caissier clicks "FACTURER")
// ─────────────────────────────────────────────────────────
interface InvoiceModalProps {
  cart: CartItem[]
  settings: AppSettings
  currency: Currency
  usdRate: number
  caissierName: string
  printerName: string | null
  invoiceType: 'ticket' | 'facture'
  onTypeChange: (type: 'ticket' | 'facture') => void
  onConfirm: (client: string, clientPhone: string, remise: number, type: 'ticket' | 'facture', preview?: boolean) => void
  onClose: () => void
}

function InvoiceModal({ cart, settings, currency, usdRate, caissierName, printerName, invoiceType, onTypeChange, onConfirm, onClose }: InvoiceModalProps) {
  const [client, setClient] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [remise, setRemise] = useState(0)
  const fmt = (n: number) => formatPrice(n, currency, usdRate)
  const sousTotal = cart.reduce((s, i) => s + i.total, 0)
  const montantRemise = (sousTotal * remise) / 100
  const taxableAmount = sousTotal - montantRemise
  const taxRate = Math.max(0, Number(settings.taxRate || 0))
  const montantTva = (taxableAmount * taxRate) / 100
  const total = taxableAmount + montantTva

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Impression</h3>
            <p className="text-xs text-gray-500 mt-1">
              Type d'impression : <strong>{invoiceType === 'ticket' ? 'Ticket' : 'Facture'}</strong>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Imprimante sélectionnée :{' '}
              <strong>{printerName ?? 'Aucune imprimante connectée'}</strong>
            </p>
            {!printerName && (
              <p className="text-xs text-red-500 mt-2">
                Branchez une imprimante physiquement et sélectionnez-la dans la page Imprimantes avant d’imprimer.
              </p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500" aria-label="Fermer">
            ✕
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {['ticket', 'facture'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onTypeChange(type as 'ticket' | 'facture')}
              className={`py-3 rounded-2xl font-semibold transition-all ${invoiceType === type ? 'bg-yellow-400 text-black' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {type === 'ticket' ? 'Ticket' : 'Facture'}
            </button>
          ))}
        </div>

        {/* Client + remise */}
        <div className="space-y-3 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nom du client</label>
              <input
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Client anonyme"
                className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Numero du client</label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+243 ..."
                className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:outline-none text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Remise (%)</label>
            <input
              type="number"
              value={remise}
              onChange={(e) => setRemise(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
              min="0" max="100"
              className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Articles */}
        <div className="border border-gray-100 rounded-xl overflow-hidden mb-4">
          <table className="w-full text-xs">
            <thead className="bg-gray-800 text-white">
              <tr>
                {['Article', 'Qté', 'P.U.', 'Total'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cart.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-800">{item.name}</td>
                  <td className="px-3 py-2 text-center">{item.quantity}</td>
                  <td className="px-3 py-2">{fmt(item.price)}</td>
                  <td className="px-3 py-2 font-semibold text-blue-600">{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="rounded-xl p-3 bg-gray-50 border border-gray-100 space-y-1.5 mb-5 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Sous-total</span><span className="font-semibold">{fmt(sousTotal)}</span>
          </div>
          {remise > 0 && (
            <div className="flex justify-between text-red-500">
              <span>Remise ({remise}%)</span><span>- {fmt(montantRemise)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>TVA ({taxRate}%)</span><span>{fmt(montantTva)}</span>
          </div>
          <div className="flex justify-between font-extrabold text-base text-blue-600 border-t border-gray-200 pt-2">
            <span>TOTAL</span><span>{fmt(total)}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(client || 'Client anonyme', clientPhone.trim(), remise, invoiceType, true)}
            disabled={!printerName}
            className="flex-1 py-3 rounded-xl font-bold text-black bg-yellow-300 hover:bg-yellow-400 transition-all disabled:opacity-50"
          >
            Prévisualiser
          </button>
          <button
            onClick={() => onConfirm(client || 'Client anonyme', clientPhone.trim(), remise, invoiceType, false)}
            disabled={!printerName}
            className="flex-1 py-3 rounded-xl font-bold text-white hover:brightness-110 transition-all disabled:opacity-50"
            style={{ background: '#22c55e' }}
          >
            {invoiceType === 'ticket' ? 'Imprimer le ticket' : 'Imprimer la facture'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-all border border-gray-200"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────
export default function App() {
  // Auth
  const [user, setUser] = useState<User | null>(null)

  // UI state
  const [currentPage, setCurrentPage] = useState<ContentPage>('dashboard')
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('protech_theme') === 'dark'
  })
  const [language, setLanguage] = useState<Language>('fr')
  const [currency, setCurrency] = useState<Currency>('CDF')
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [pendingCount, setPendingCount] = useState(0)
  const [isRefreshingData, setIsRefreshingData] = useState(false)

  const PRINTER_INFO = [
    { key: 'epson', name: 'EPSON TM-T20/T88', icon: '🖨️' },
    { key: 'xprinter', name: 'XPRINTER XP-58/80', icon: '🖨️' },
    { key: 'bluetooth', name: 'Bluetooth', icon: '🔵' },
    { key: 'standard', name: 'Imprimante standard', icon: 'A4' },
  ] as const
  type PrinterKey = (typeof PRINTER_INFO)[number]['key']
  type PrinterState = { connected: boolean; paperSize: '80' | '58' | 'A4' }
  const INITIAL_PRINTERS: Record<PrinterKey, PrinterState> = {
    epson: { connected: false, paperSize: '80' },
    xprinter: { connected: false, paperSize: '80' },
    bluetooth: { connected: false, paperSize: '80' },
    standard: { connected: false, paperSize: 'A4' },
  }

  const [printers, setPrinters] = useState<Record<PrinterKey, PrinterState>>(INITIAL_PRINTERS)
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterKey>('epson')
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null)
  const [printPreview, setPrintPreview] = useState(false)
  const [invoiceType, setInvoiceType] = useState<'ticket' | 'facture'>('facture')

  // Data state (loaded lazily on client)
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [caissiers, setCaissiers] = useState<User[]>([])
  const [managers, setManagers] = useState<User[]>([])
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [onlinePresences, setOnlinePresences] = useState<UserPresence[]>([])
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [showSplash, setShowSplash] = useState(false)

  // Hydrate from localStorage once mounted
  useEffect(() => {
    const s = loadSettingsFromLS()
    const savedLanguage = localStorage.getItem('protech_language') as Language | null
    const savedTheme = localStorage.getItem('protech_theme')
    const savedUser = localStorage.getItem('protech_session_user')

    if (savedTheme === 'dark' || savedTheme === 'light') {
      setDarkMode(savedTheme === 'dark')
    }

    setProducts(loadProductsFromLS())
    setCart(loadCartFromLS())
    setInvoices(loadInvoicesFromLS())
    setCaissiers(loadUsersFromLS('caisse'))
    setManagers(loadUsersFromLS('manager'))
    setSettings(s)
    setCurrency(s.defaultCurrency)
    if (savedLanguage === 'fr' || savedLanguage === 'en' || savedLanguage === 'de') {
      setLanguage(savedLanguage)
    }
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as User
        if (parsedUser && parsedUser.id && parsedUser.name && parsedUser.role) {
          setUser(parsedUser)
          setCurrentPage(parsedUser.role === 'caisse' ? 'caisse' : 'dashboard')
        }
      } catch {
        localStorage.removeItem('protech_session_user')
      }
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem('protech_language', language)
  }, [hydrated, language])

  useEffect(() => {
    if (!hydrated) return
    if (user) {
      localStorage.setItem('protech_session_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('protech_session_user')
    }
  }, [hydrated, user])

  useEffect(() => {
    setShowSplash(false)
  }, [])

  useEffect(() => {
    initSync()
    async function updatePendingCount() {
      setPendingCount(await getPendingCount())
    }

    updatePendingCount()
  }, [])

  const refreshPendingCount = useCallback(async () => {
    setPendingCount(await getPendingCount())
  }, [])

  function getMachineId() {
    const key = 'protech_machine_id'
    const existing = localStorage.getItem(key)
    if (existing) return existing

    const id = `machine-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(key, id)
    return id
  }

  function getMachineName() {
    const platform = navigator.platform || 'Machine'
    const browser = navigator.userAgent.includes('Edg')
      ? 'Edge'
      : navigator.userAgent.includes('Chrome')
        ? 'Chrome'
        : navigator.userAgent.includes('Firefox')
          ? 'Firefox'
          : 'Navigateur'

    return `${platform} - ${browser}`
  }

  const refreshPresence = useCallback(async () => {
    if (!navigator.onLine) return
    const response = await apiCall<UserPresence[]>('presence')
    setOnlinePresences(response.data || [])
  }, [])

  useEffect(() => {
    if (!user) {
      setOnlinePresences([])
      return
    }

    const machineId = getMachineId()
    const payload = {
      user,
      machineId,
      machineName: getMachineName(),
    }

    async function heartbeat() {
      if (!navigator.onLine) return
      await apiCall('presence', payload, 'POST').catch(() => {})
      await refreshPresence().catch(() => {})
    }

    void heartbeat()
    const interval = window.setInterval(heartbeat, 30000)

    return () => {
      window.clearInterval(interval)
    }
  }, [user, refreshPresence])

  // Dark mode toggle — applies .dark class on <html> so Tailwind dark: variants work
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.classList.toggle('dark', darkMode)
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light'
    localStorage.setItem('protech_theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  // ── Toast helpers ──────────────────────────────────────
  const addToast = useCallback((title: string, message: string, type: ToastType = 'success') => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, title, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  function currentActor() {
    return user
      ? { id: user.id, name: user.name, email: user.email, role: user.role }
      : null
  }

  function recordActivity(action: string, summary: string, entity = 'app', entityId?: number | string) {
    const actor = currentActor()
    if (!actor || !navigator.onLine) return

    void apiCall('activity-logs', { action, summary, entity, entityId, actor }, 'POST').catch((error) => {
      console.warn('Activity log failed:', error)
    })
  }

  // ── Sync ──────────────────────────────────────────────
  async function handleSync() {
    if (syncStatus === 'syncing') return
    if (!navigator.onLine) {
      addToast('Hors ligne', 'Impossible de synchroniser sans connexion.', 'warning')
      return
    }

    setSyncStatus('syncing')
    try {
      const result = await synchronize()
      await refreshPendingCount()
      if (result.failed === 0) {
        setSyncStatus('success')
        addToast('Synchronisation', 'Données synchronisées avec le serveur.', 'success')
      } else {
        setSyncStatus('error')
        addToast('Synchronisation partielle', `${result.synced} opérations synchronisées, ${result.failed} échouées.`, 'warning')
      }
    } catch (error) {
      console.error(error)
      setSyncStatus('error')
      addToast('Erreur sync', 'Impossible de joindre le serveur.', 'error')
    } finally {
      setTimeout(() => setSyncStatus('idle'), 2500)
    }
  }

  // ── Auth ───────────────────────────────────────────────
  async function handleRefreshData() {
    if (isRefreshingData) return
    if (!navigator.onLine) {
      addToast('Hors ligne', 'Impossible d’actualiser les donnees sans connexion.', 'warning')
      return
    }

    setIsRefreshingData(true)
    try {
      await synchronize()

      const [productsResponse, usersResponse, invoicesResponse, settingsResponse, presenceResponse] = await Promise.all([
        apiCall<Product[]>('products'),
        apiCall<User[]>('users'),
        apiCall<Invoice[]>('invoices'),
        apiCall<AppSettings | null>('settings'),
        apiCall<UserPresence[]>('presence'),
      ])

      const freshProducts = (productsResponse.data || []).map((product: any) => ({
        ...product,
        category: product.category || product.category_slug || 'divers',
      })) as Product[]
      const freshUsers = usersResponse.data || []
      const freshInvoices = invoicesResponse.data || []
      const freshSettings = settingsResponse.data
      const freshPresences = presenceResponse.data || []

      setProducts(freshProducts)
      saveProductsToLS(freshProducts)

      setInvoices(freshInvoices)
      saveInvoicesToLS(freshInvoices)

      const freshCaissiers = freshUsers.filter((item) => item.role === 'caisse')
      const freshManagers = freshUsers.filter((item) => item.role === 'manager')
      setCaissiers(freshCaissiers)
      setManagers(freshManagers)
      saveUsersToLS('caisse', freshCaissiers)
      saveUsersToLS('manager', freshManagers)

      if (freshSettings && 'defaultCurrency' in freshSettings) {
        const normalizedSettings = { ...freshSettings, taxRate: Number((freshSettings as any).taxRate || 0) }
        setSettings(normalizedSettings)
        saveSettingsToLS(normalizedSettings)
        setCurrency(normalizedSettings.defaultCurrency)
      }

      setOnlinePresences(freshPresences)

      await refreshPendingCount()
      addToast('Données actualisées', 'Les donnees ont ete rechargees sans fermer la session.', 'success')
    } catch (error) {
      console.error(error)
      addToast('Actualisation impossible', 'Impossible de recharger les donnees depuis le serveur.', 'error')
    } finally {
      setIsRefreshingData(false)
    }
  }

  function handleLogin(u: User) {
    setUser(u)
    localStorage.setItem('protech_session_user', JSON.stringify(u))
    const defaultPage: ContentPage = u.role === 'caisse' ? 'caisse' : 'dashboard'
    setCurrentPage(defaultPage)
    addToast('Connexion réussie', `Bienvenue, ${u.name} !`, 'success')
  }

  function handleLogout() {
    recordActivity('logout', `${user?.name || 'Utilisateur'} s'est deconnecte`, 'auth')
    void apiCall('auth/google/logout', {}, 'POST').catch(() => {})
    const machineId = localStorage.getItem('protech_machine_id')
    if (machineId) {
      void apiCall(`presence?machineId=${encodeURIComponent(machineId)}`, undefined, 'DELETE').catch(() => {})
    }
    setUser(null)
    localStorage.removeItem('protech_session_user')
    setOnlinePresences([])
    setCart([])
    saveCartToLS([])
    addToast('Déconnexion', 'À bientôt !', 'info')
  }

  // ── Navigation ─────────────────────────────────────────
  function handleNavigate(page: ContentPage) {
    setCurrentPage(page)
  }

  // ── Export ─────────────────────────────────────────────
  function handleExport() {
    const data = { products, invoices, caissiers, managers, settings, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `protech-touch-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    addToast('Export réussi', 'Données exportées avec succès.', 'success')
  }

  // ── Products ───────────────────────────────────────────
  function handleSaveProduct(data: Omit<Product, 'id'>, id?: number) {
    setProducts((prev) => {
      let next: Product[]
      if (id !== undefined) {
        next = prev.map((p) => (p.id === id ? { ...p, ...data } : p))
        addToast('Produit modifié', `"${data.name}" mis à jour.`, 'success')
        void enqueuePendingOperation({ type: 'product', action: 'update', data: { ...data, id, actor: currentActor() } }).then(refreshPendingCount)
      } else {
        const newId = Math.max(0, ...prev.map((p) => p.id)) + 1
        next = [...prev, { ...data, id: newId }]
        addToast('Produit ajouté', `"${data.name}" ajouté au catalogue.`, 'success')
        void enqueuePendingOperation({ type: 'product', action: 'add', data: { ...data, id: newId, actor: currentActor() } }).then(refreshPendingCount)
      }
      saveProductsToLS(next)
      return next
    })
  }

  function handleDeleteProduct(id: number) {
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id)
      saveProductsToLS(next)
      return next
    })
    addToast('Produit supprimé', 'Le produit a été retiré du catalogue.', 'warning')
    void enqueuePendingOperation({ type: 'product', action: 'delete', data: { id, actor: currentActor() } }).then(refreshPendingCount)
  }

  function handleResetProducts() {
    if (!confirm('Réinitialiser le catalogue avec les produits par défaut ?')) return
    const withIds = DEFAULT_PRODUCTS.map((p, i) => ({ ...p, id: i + 1 }))
    setProducts(withIds)
    saveProductsToLS(withIds)
    addToast('Catalogue réinitialisé', 'Produits par défaut rechargés.', 'info')
  }

  function handleClearAllProducts() {
    setProducts([])
    saveProductsToLS([])
    addToast('Catalogue vidé', 'Tous les produits ont été supprimés.', 'warning')
  }

  // ── Cart ───────────────────────────────────────────────
  function handleAddToCart(productId: number) {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    if (product.stock <= 0) { addToast('Stock épuisé', `"${product.name}" est en rupture de stock.`, 'error'); return }

    setCart((prev) => {
      const existing = prev.findIndex((i) => i.id === productId)
      let next: CartItem[]
      if (existing >= 0) {
        if (prev[existing].quantity >= product.stock) {
          addToast('Stock insuffisant', `Stock disponible: ${product.stock}`, 'warning')
          return prev
        }
        next = prev.map((i, idx) =>
          idx === existing ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price } : i
        )
      } else {
        next = [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, total: product.price }]
      }
      saveCartToLS(next)
      return next
    })
  }

  function handleUpdateQuantity(index: number, delta: number) {
    setCart((prev) => {
      const item = prev[index]
      const product = products.find((p) => p.id === item.id)
      const newQty = item.quantity + delta
      if (newQty <= 0) {
        const next = prev.filter((_, i) => i !== index)
        saveCartToLS(next)
        return next
      }
      if (product && newQty > product.stock) {
        addToast('Stock insuffisant', `Stock disponible: ${product.stock}`, 'warning')
        return prev
      }
      const next = prev.map((it, i) =>
        i === index ? { ...it, quantity: newQty, total: newQty * it.price } : it
      )
      saveCartToLS(next)
      return next
    })
  }

  function handleRemoveFromCart(index: number) {
    setCart((prev) => {
      const next = prev.filter((_, i) => i !== index)
      saveCartToLS(next)
      return next
    })
  }

  function togglePrinterConnection(key: PrinterKey) {
    setPrinters((prev) => ({
      ...prev,
      [key]: { ...prev[key], connected: !prev[key].connected },
    }))
  }

  function selectPrinter(key: PrinterKey) {
    setSelectedPrinter(key)
  }

  function changePrinterSize(key: PrinterKey, size: '58' | '80' | 'A4') {
    setPrinters((prev) => ({
      ...prev,
      [key]: { ...prev[key], paperSize: size },
    }))
  }

  const selectedPrinterState = printers[selectedPrinter]
  const activePrinter = selectedPrinterState.connected ? { key: selectedPrinter, state: selectedPrinterState } : null
  const activePrinterName = activePrinter
    ? PRINTER_INFO.find((item) => item.key === activePrinter.key)?.name ?? activePrinter.key
    : null

  // ── Checkout (quick sale without invoice) ─────────────
  function handleCheckout() {
    if (cart.length === 0) return
    const sale = {
      id: Date.now(),
      total: cart.reduce((sum, item) => sum + item.total, 0),
      items: cart,
      date: new Date().toISOString(),
      cashier: user?.name || 'Caissier',
    }

    setProducts((prev) => {
      const next = prev.map((p) => {
        const item = cart.find((c) => c.id === p.id)
        return item ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p
      })
      saveProductsToLS(next)
      return next
    })
    setCart([])
    saveCartToLS([])
    void enqueuePendingOperation({ type: 'sale', action: 'add', data: { ...sale, actor: currentActor() } }).then(refreshPendingCount)
    addToast('Vente effectuée', 'La vente a été enregistrée avec succès.', 'success')
  }

  // ── Invoice creation ───────────────────────────────────
  function handleConfirmInvoice(client: string, clientPhone: string, remise: number, type: 'ticket' | 'facture', preview = false) {
    if (cart.length === 0) return
    if (!activePrinter) {
      addToast('Erreur d’impression', 'Aucune imprimante connectée. Veuillez en connecter une dans la page Imprimantes.', 'error')
      return
    }

    if (type === 'ticket' && activePrinter.key === 'standard') {
      addToast('Imprimante standard', 'L’imprimante standard est prévue pour les factures A4. Choisissez EPSON, XPRINTER ou Bluetooth pour un ticket.', 'warning')
      return
    }

    const sousTotal = cart.reduce((s, i) => s + i.total, 0)
    const montantRemise = (sousTotal * remise) / 100
    const taxableAmount = sousTotal - montantRemise
    const tvaRate = Math.max(0, Number(settings?.taxRate || 0))
    const montantTva = (taxableAmount * tvaRate) / 100
    const total = taxableAmount + montantTva
    const now = new Date()

    const invoice: Invoice = {
      id: Date.now(),
      type,
      paperSize: activePrinter.state.paperSize,
      numero: `${type === 'ticket' ? 'TKT' : 'FAC'}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 9000) + 1000}`,
      date: now.toLocaleString('fr-CD'),
      client,
      clientPhone,
      caissier: user?.name || 'Caissier',
      articles: cart.map((i) => ({ nom: i.name, prix: i.price, quantite: i.quantity, total: i.total })),
      sousTotal,
      remise,
      montantRemise,
      tvaRate,
      montantTva,
      total,
    }

    // Deduct stock
    setProducts((prev) => {
      const next = prev.map((p) => {
        const item = cart.find((c) => c.id === p.id)
        return item ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p
      })
      saveProductsToLS(next)
      return next
    })

    setInvoices((prev) => {
      const next = [invoice, ...prev]
      saveInvoicesToLS(next)
      return next
    })

    setCart([])
    saveCartToLS([])
    void enqueuePendingOperation({ type: 'invoice', action: 'add', data: { ...invoice, actor: currentActor() } }).then(refreshPendingCount)
    setShowInvoiceModal(false)
    setPrintPreview(preview)
    setPrintInvoice(invoice)
    addToast(
      preview
        ? `${invoice.type === 'ticket' ? 'Ticket prêt' : 'Facture prête'} à la prévisualisation.`
        : `${invoice.type === 'ticket' ? 'Ticket créé' : 'Facture créée'}`,
      preview
        ? `Prévisualisation de ${invoice.type === 'ticket' ? 'ticket' : 'facture'} ${invoice.numero}.`
        : `${invoice.type === 'ticket' ? 'Ticket' : 'Facture'} ${invoice.numero} enregistrée.`, 
      preview ? 'info' : 'success'
    )

    if (!preview) {
      setTimeout(() => {
        window.print()
        setTimeout(() => setPrintInvoice(null), 500)
      }, 300)
    }
  }
  // ── Users (caissiers & managers) ──────────────────────
  function handleSaveUser(role: 'caisse' | 'manager', data: { name: string; email: string; password?: string; caisse_number?: number }, id?: number) {
    const setter = role === 'caisse' ? setCaissiers : setManagers
    setter((prev) => {
      let next: User[]
      if (id !== undefined) {
        next = prev.map((u) =>
          u.id === id ? { ...u, name: data.name, email: data.email, caisse_number: data.caisse_number } : u
        )
        if (data.password) saveUserPassword(id, data.password)
        addToast('Utilisateur modifié', `${data.name} mis à jour.`, 'success')
        void enqueuePendingOperation({ type: 'user', action: 'update', data: { id, ...data, actor: currentActor() } }).then(refreshPendingCount)
      } else {
        const newId = Math.max(0, ...prev.map((u) => u.id), 100) + 1
        const newUser: User = {
          id: newId,
          name: data.name,
          email: data.email,
          role,
          caisse_number: data.caisse_number,
          status: 'actif',
          last_login: undefined,
        }
        next = [...prev, newUser]
        if (data.password) saveUserPassword(newId, data.password)
        addToast('Utilisateur créé', `${data.name} ajouté.`, 'success')
        void enqueuePendingOperation({ type: 'user', action: 'add', data: { ...newUser, actor: currentActor() } }).then(refreshPendingCount)
      }
      saveUsersToLS(role, next)
      return next
    })
  }

  function handleDeleteUser(role: 'caisse' | 'manager', id: number) {
    const setter = role === 'caisse' ? setCaissiers : setManagers
    setter((prev) => {
      const next = prev.filter((u) => u.id !== id)
      saveUsersToLS(role, next)
      return next
    })
    addToast('Utilisateur supprimé', 'Le compte a été supprimé.', 'warning')
    void enqueuePendingOperation({ type: 'user', action: 'delete', data: { id, actor: currentActor() } }).then(refreshPendingCount)
  }

  // ── Settings ───────────────────────────────────────────
  function handleSaveSettings(s: AppSettings) {
    setSettings(s)
    saveSettingsToLS(s)
    setCurrency(s.defaultCurrency)
    void enqueuePendingOperation({ type: 'settings', action: 'update', data: { ...s, actor: currentActor() } }).then(refreshPendingCount)
    addToast('Paramètres sauvegardés', 'Les modifications ont été enregistrées.', 'success')
  }

  function handleLogoChange(logo: string) {
    if (!settings) return
    const updated = { ...settings, companyLogo: logo }
    setSettings(updated)
    saveSettingsToLS(updated)
  }

  const usdRate = settings?.usdRate ?? 2850
  const totalUsers = 1 + caissiers.length + managers.length

  // ── Render: not hydrated yet ───────────────────────────
  if (!hydrated) {
    return (
      <>
      <GlobalTranslator language={language} />
      <div className="fixed inset-0 flex items-center justify-center bg-slate-100 dark:bg-[#0f1117]">
        <div className="text-center text-slate-700 dark:text-slate-200">
          <div
            className="w-14 h-14 mx-auto mb-4 rounded-full border-4 border-yellow-400 border-t-transparent"
            style={{ animation: 'spin 0.8s linear infinite' }}
            aria-label="Chargement"
            role="status"
          />
          <p className="font-semibold text-lg">Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
      </>
    )
  }

  // ── Render: login ──────────────────────────────────────
  if (!user) {
    return (
      <>
        <GlobalTranslator language={language} />
        <LoginPage onLogin={handleLogin} />
      </>
    )
  }

  // ── Render: main app ───────────────────────────────────
  return (
    <>
      <GlobalTranslator language={language} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <Header
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((v) => !v)}
        language={language}
        onLanguageChange={setLanguage}
        currency={currency}
        onCurrencyChange={setCurrency}
        onExport={handleExport}
        onRefresh={handleRefreshData}
        isRefreshing={isRefreshingData}
        companyName="ProTech Touch"
        companyLogo={settings?.companyLogo}
      />

      <Sidebar
        user={user}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onSync={handleSync}
        syncStatus={syncStatus}
        pendingCount={pendingCount}
        darkMode={darkMode}
        companyLogo={settings?.companyLogo}
      />

      {/* Main content — always offset by the collapsed rail (60px) */}
      <main
        className="fixed top-[60px] right-0 bottom-0 overflow-y-auto p-5 transition-all duration-300 bg-slate-100 dark:bg-[#0f1117]"
        style={{ left: 60 }}
      >
        {currentPage === 'dashboard' && (
          <DashboardPage
            products={products}
            invoices={invoices}
            users={totalUsers}
            currency={currency}
            usdRate={usdRate}
            presences={onlinePresences}
          />
        )}

        {currentPage === 'caisse' && (
          <CaissePage
            products={products}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveFromCart={handleRemoveFromCart}
            onCheckout={handleCheckout}
            onOpenInvoice={() => cart.length > 0 && setShowInvoiceModal(true)}
            currency={currency}
            usdRate={usdRate}
          />
        )}

        {currentPage === 'products' && (
          <ProductsPage
            products={products}
            onSave={handleSaveProduct}
            onDelete={handleDeleteProduct}
            onReset={handleResetProducts}
            onClearAll={handleClearAllProducts}
            onExport={handleExport}
            currency={currency}
            usdRate={usdRate}
            canEdit={user.role !== 'caisse'}
          />
        )}

        {currentPage === 'caissiers' && user.role === 'admin' && (
          <UsersPage
            users={caissiers}
            role="caisse"
            presences={onlinePresences}
            onSave={(data, id) => handleSaveUser('caisse', data, id)}
            onDelete={(id) => handleDeleteUser('caisse', id)}
          />
        )}

        {currentPage === 'managers' && user.role === 'admin' && (
          <UsersPage
            users={managers}
            role="manager"
            presences={onlinePresences}
            onSave={(data, id) => handleSaveUser('manager', data, id)}
            onDelete={(id) => handleDeleteUser('manager', id)}
          />
        )}

        {currentPage === 'factures' && (
          <FacturesPage
            invoices={invoices}
            currency={currency}
            usdRate={usdRate}
          />
        )}

        {currentPage === 'activity' && user.role === 'admin' && (
          <ActivityLogsPage />
        )}

        {currentPage === 'printers' && (
          <PrintersPage
            printers={printers}
            selectedPrinter={selectedPrinter}
            onToggleConnect={togglePrinterConnection}
            onSelectPrinter={selectPrinter}
            onChangeSize={changePrinterSize}
          />
        )}

        {currentPage === 'settings' && settings && (
          <SettingsPage
            settings={settings}
            onSave={handleSaveSettings}
            onLogoChange={handleLogoChange}
          />
        )}
        {currentPage === 'reports' && user && (user.role === 'admin' || user.role === 'manager' || user.role === 'caisse') && <DailyReportsPage user={user} />}
      </main>

      {/* Invoice modal */}
      {showInvoiceModal && (
        <InvoiceModal
          cart={cart}
          settings={settings!}
          currency={currency}
          usdRate={usdRate}
          caissierName={user.name}
          printerName={activePrinterName}
          invoiceType={invoiceType}
          onTypeChange={setInvoiceType}
          onConfirm={handleConfirmInvoice}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}

      {printInvoice && (
        <div className="print-panel" style={{ maxWidth: printInvoice.type === 'ticket' && printInvoice.paperSize === '58' ? 220 : printInvoice.type === 'ticket' ? 320 : 740 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexDirection: printInvoice.type === 'ticket' ? 'column' : 'row', marginBottom: 20 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: printInvoice.type === 'ticket' ? 16 : 24 }}>{printInvoice.type === 'ticket' ? 'Ticket de caisse' : 'Facture'}</h1>
                <p style={{ margin: '6px 0 0', fontSize: 11 }}>{settings?.phone || 'Contact : +243 000 000 000'}</p>
                <p style={{ margin: '4px 0 0', fontSize: 11 }}>{settings?.rccm || 'RCCM: N/A'}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: printInvoice.type === 'ticket' ? 'flex-start' : 'flex-end', marginTop: printInvoice.type === 'ticket' ? 12 : 0 }}>
                <p style={{ margin: 0, fontSize: 12 }}>{printInvoice.type === 'ticket' ? 'TICKET' : 'FACTURE'}</p>
                <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700 }}>{printInvoice.numero}</p>
                <p style={{ margin: '4px 0 0', fontSize: 12 }}>{printInvoice.date}</p>
              </div>
              {printPreview && (
                <button
                  onClick={() => { setPrintInvoice(null); setPrintPreview(false) }}
                  style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 12, padding: '8px 12px', cursor: 'pointer' }}
                >
                  Fermer
                </button>
              )}
            </div>

            <div style={{ marginBottom: 18 }}>
              <p style={{ margin: '0 0 4px', fontSize: printInvoice.type === 'ticket' && printInvoice.paperSize === '58' ? 10 : 12 }}>Client : {printInvoice.client}</p>
              {printInvoice.clientPhone && (
                <p style={{ margin: '0 0 4px', fontSize: printInvoice.type === 'ticket' && printInvoice.paperSize === '58' ? 10 : 12 }}>Numero : {printInvoice.clientPhone}</p>
              )}
              <p style={{ margin: '0 0 4px', fontSize: printInvoice.type === 'ticket' && printInvoice.paperSize === '58' ? 10 : 12 }}>Caissier : {printInvoice.caissier}</p>
              <p style={{ margin: 0, fontSize: printInvoice.type === 'ticket' && printInvoice.paperSize === '58' ? 10 : 12 }}>Imprimante : {activePrinterName || 'Non définie'}</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Article</th>
                  <th style={{ textAlign: 'right' }}>Prix</th>
                  <th style={{ textAlign: 'right' }}>Qté</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {printInvoice.articles.map((article, index) => (
                  <tr key={index}>
                    <td>{article.nom}</td>
                    <td style={{ textAlign: 'right' }}>{formatPrice(article.prix, currency, usdRate)}</td>
                    <td style={{ textAlign: 'right' }}>{article.quantite}</td>
                    <td style={{ textAlign: 'right' }}>{formatPrice(article.total, currency, usdRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginTop: 18, width: '100%', display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
              <div style={{ minWidth: printInvoice.type === 'ticket' && printInvoice.paperSize === '58' ? 140 : 220 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: printInvoice.type === 'ticket' && printInvoice.paperSize === '58' ? 10 : 12 }}>
                  <span>Sous-total</span>
                  <span>{formatPrice(printInvoice.sousTotal, currency, usdRate)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: printInvoice.type === 'ticket' && printInvoice.paperSize === '58' ? 10 : 12 }}>
                  <span>Remise</span>
                  <span>-{formatPrice(printInvoice.montantRemise, currency, usdRate)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: printInvoice.type === 'ticket' && printInvoice.paperSize === '58' ? 10 : 12 }}>
                  <span>TVA ({printInvoice.tvaRate ?? 0}%)</span>
                  <span>{formatPrice(printInvoice.montantTva ?? 0, currency, usdRate)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 8, fontSize: printInvoice.type === 'ticket' && printInvoice.paperSize === '58' ? 11 : 12 }}>
                  <span>Total</span>
                  <span>{formatPrice(printInvoice.total, currency, usdRate)}</span>
                </div>
              </div>
            </div>

            <p style={{ marginTop: 24, fontSize: 10 }}>Merci pour votre achat.</p>
          </div>
        </div>
      )}
    </>
  )
}
