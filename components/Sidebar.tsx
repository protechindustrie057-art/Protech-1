'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import type { User, ContentPage } from '@/lib/types'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Briefcase,
  FileText,
  History,
  Printer,
  Settings,
  LogOut,
  RefreshCw,
  Wifi,
  WifiOff,
  ChevronRight,
} from 'lucide-react'

interface Props {
  user: User
  currentPage: ContentPage
  onNavigate: (page: ContentPage) => void
  onLogout: () => void
  onSync: () => void
  syncStatus: 'idle' | 'syncing' | 'success' | 'error'
  pendingCount: number
  darkMode: boolean
  companyLogo?: string
}

const ADMIN_MENU: { page: ContentPage; label: string; Icon: React.ElementType }[] = [
  { page: 'dashboard', label: 'Tableau de bord', Icon: LayoutDashboard },
  { page: 'caisse',    label: 'Caisse',           Icon: ShoppingCart    },
  { page: 'products',  label: 'Boutique / produits / consommables', Icon: Package },
  { page: 'caissiers', label: 'Caissiers',         Icon: Users           },
  { page: 'managers',  label: 'Managers',          Icon: Briefcase       },
  { page: 'factures',  label: 'Factures',          Icon: FileText        },
  { page: 'activity',  label: 'Activite',          Icon: History         },
  { page: 'printers',  label: 'Imprimantes',       Icon: Printer         },
  { page: 'settings',  label: 'Paramètres',        Icon: Settings        },
]
const MANAGER_MENU: ContentPage[] = ['dashboard', 'products', 'factures', 'printers']
const CASHIER_MENU: ContentPage[] = ['caisse', 'factures', 'printers', 'products']

const RAIL_W = 60   // collapsed icon rail width (px)
const FULL_W = 268  // expanded width (px)

export default function Sidebar({
  user,
  currentPage,
  onNavigate,
  onLogout,
  onSync,
  syncStatus,
  pendingCount,
  darkMode,
  companyLogo,
}: Props) {
  const [showDailyReport, setShowDailyReport] = useState(false)
  const [reportExpenses, setReportExpenses] = useState('')
  const [reportCash, setReportCash] = useState('')
  const [reportMobile, setReportMobile] = useState('')
  const [reportNotes, setReportNotes] = useState('')
  const [reportMessage, setReportMessage] = useState('')
  const [showCashReports, setShowCashReports] = useState(false)
  const [cashReports, setCashReports] = useState<any[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [reportsMessage, setReportsMessage] = useState('')
  const [reportFilterDate, setReportFilterDate] = useState('')
  const [reportFilterCashier, setReportFilterCashier] = useState('')
  const [showCloseDay, setShowCloseDay] = useState(false)
  const [showSyncCenter, setShowSyncCenter] = useState(false)
  const [showBackupCenter, setShowBackupCenter] = useState(false)
  const [showJournal, setShowJournal] = useState(false)
  const [showClientSetup, setShowClientSetup] = useState(false)
  const [showTicketSetup, setShowTicketSetup] = useState(false)
  const [showPermissions, setShowPermissions] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [ticketNote, setTicketNote] = useState(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('protech_ticket_note') || 'Merci pour votre achat'
  })
  const [clientCompany, setClientCompany] = useState(() => {
    if (typeof window === 'undefined') return ''
    try {
      return JSON.parse(localStorage.getItem('protech_settings') || '{}')?.companyName || ''
    } catch {
      return ''
    }
  })

  const readLocalList = (key: string) => {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]')
    } catch {
      return []
    }
  }

  const pendingReportCount = typeof window === 'undefined' ? 0 : readLocalList('protech_pending_daily_reports').length
  const pendingOperationCount = typeof window === 'undefined' ? 0 : readLocalList('protech_pending_operations').length
  const localSales = typeof window === 'undefined' ? [] : readLocalList('protech_sales')

  const openReportsPage = useCallback(() => {
    onNavigate('reports')
    setShowDailyReport(false)
    setShowCashReports(false)
  }, [onNavigate])

  function exportLocalBackup() {
    const keys = [
      'protech_products',
      'protech_sales',
      'protech_invoices',
      'protech_settings',
      'protech_daily_reports',
      'protech_pending_daily_reports',
      'protech_pending_operations',
      'protech_users_caisse',
      'protech_users_manager',
    ]
    const data = Object.fromEntries(keys.map((key) => [key, localStorage.getItem(key)]))
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `protech-touch-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function saveClientSetup() {
    try {
      const current = JSON.parse(localStorage.getItem('protech_settings') || '{}')
      localStorage.setItem('protech_settings', JSON.stringify({ ...current, companyName: clientCompany.trim() }))
      setShowClientSetup(false)
    } catch {
      setShowClientSetup(false)
    }
  }

  function saveTicketSetup() {
    localStorage.setItem('protech_ticket_note', ticketNote.trim())
    setShowTicketSetup(false)
  }

  async function submitDailyReport(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    const report = {
      id: `report-${Date.now()}`,
      reportDate: new Date().toISOString().slice(0, 10),
      cashierId: user.id,
      cashierName: user.name,
      cashierEmail: user.email,
      expenses: Number(reportExpenses || 0),
      cashAmount: Number(reportCash || 0),
      mobileAmount: Number(reportMobile || 0),
      notes: reportNotes.trim(),
      actor: user,
      createdAt: new Date().toISOString(),
    }

    if (!report.notes && report.expenses <= 0 && report.cashAmount <= 0 && report.mobileAmount <= 0) {
      setReportMessage('Complete au moins un champ du rapport.')
      return
    }

    const pendingKey = 'protech_pending_daily_reports'
    const localKey = 'protech_daily_reports'
    const readList = (key: string) => {
      try {
        return JSON.parse(localStorage.getItem(key) || '[]')
      } catch {
        return []
      }
    }

    localStorage.setItem(localKey, JSON.stringify([report, ...readList(localKey)].slice(0, 100)))

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '/api').replace(/\/+$/, '')
      const response = await fetch(`${baseUrl}/daily-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(report),
      })
      if (!response.ok) throw new Error('Envoi impossible')
      setReportMessage('Rapport envoye a l administrateur.')
    } catch {
      localStorage.setItem(pendingKey, JSON.stringify([report, ...readList(pendingKey)]))
      setReportMessage('Connexion indisponible. Rapport garde en attente.')
    }

    setReportExpenses('')
    setReportCash('')
    setReportMobile('')
    setReportNotes('')
  }

  async function loadCashReports() {
    setReportsLoading(true)
    setReportsMessage('')

    const readList = (key: string) => {
      try {
        return JSON.parse(localStorage.getItem(key) || '[]')
      } catch {
        return []
      }
    }

    const pendingReports = readList('protech_pending_daily_reports').map((report: any) => ({
      ...report,
      status: report.status || 'en attente',
    }))

    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '/api').replace(/\/+$/, '')
      const response = await fetch(`${baseUrl}/daily-reports`, {
        headers: { Accept: 'application/json' },
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || result?.success === false) throw new Error(result?.message || 'Chargement impossible')

      const sentReports = (result?.data || []).map((report: any) => ({
        ...report,
        status: report.status || 'envoye',
      }))
      setCashReports([...pendingReports, ...sentReports])
    } catch (error: any) {
      setCashReports(pendingReports)
      setReportsMessage(error?.message || 'Rapports en ligne indisponibles. Affichage des rapports en attente locaux.')
    } finally {
      setReportsLoading(false)
    }
  }

  function openCashReports() {
    setShowCashReports(true)
    void loadCashReports()
  }

  const filteredCashReports = cashReports.filter((report) => {
    const matchesDate = !reportFilterDate || String(report.reportDate || '').slice(0, 10) === reportFilterDate
    const cashier = `${report.cashierName || ''} ${report.cashierEmail || ''}`.toLowerCase()
    const matchesCashier = !reportFilterCashier || cashier.includes(reportFilterCashier.trim().toLowerCase())
    return matchesDate && matchesCashier
  })
  const [expanded, setExpanded] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const sidebarRef = useRef<HTMLElement>(null)
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Online / offline detection
  useEffect(() => {
    setIsOnline(navigator.onLine)
    const onOnline  = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const handleMouseEnter = useCallback(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current)
    setExpanded(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    collapseTimer.current = setTimeout(() => setExpanded(false), 120)
  }, [])

  const allowedPages =
    user.role === 'admin'   ? ADMIN_MENU.map((m) => m.page)
    : user.role === 'manager' ? MANAGER_MENU
    : CASHIER_MENU

  const visibleMenu = ADMIN_MENU.filter((m) => allowedPages.includes(m.page))
  const roleLabel =
    user.role === 'admin' ? 'Administrateur'
    : user.role === 'manager' ? 'Manager'
    : 'Caissier'

  const bg   = darkMode ? '#0f1117' : '#ffffff'
  const bd   = darkMode ? '#1e2130' : '#f0f0f0'
  const text = darkMode ? '#e2e8f0' : '#1f2937'
  const sub  = darkMode ? '#64748b' : '#9ca3af'
  const activeBg = 'linear-gradient(135deg,#38bdf8,#0ea5e9)'
  const activeText = '#ffffff'
  const hoverBg = darkMode ? 'rgba(56,189,248,0.12)' : 'rgba(56,189,248,0.08)'

  return (
    <>
      {/* Invisible left-edge trigger strip (when collapsed) */}
      {!expanded && (
        <div
          className="fixed top-[60px] left-0 z-[1001]"
          style={{ width: RAIL_W, height: 'calc(100vh - 60px)', cursor: 'default' }}
          onMouseEnter={handleMouseEnter}
        />
      )}

      {/* Main sidebar */}
      <aside
        ref={sidebarRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="fixed top-[60px] left-0 z-[1000] flex flex-col"
        style={{
          width: expanded ? FULL_W : RAIL_W,
          height: 'calc(100vh - 60px)',
          background: bg,
          borderRight: `1px solid ${bd}`,
          boxShadow: expanded ? '4px 0 24px rgba(0,0,0,0.12)' : 'none',
          transition: 'width 220ms cubic-bezier(0.4,0,0.2,1), box-shadow 220ms ease',
          overflow: 'hidden',
        }}
        aria-label="Navigation principale"
      >
        {/* Brand */}
        <div
          className="flex items-center flex-shrink-0 overflow-hidden"
          style={{
            padding: expanded ? '14px 12px' : '12px 10px',
            borderBottom: `1px solid ${bd}`,
            minHeight: 72,
          }}
        >
          <div
            className="flex items-center justify-center rounded-xl overflow-hidden flex-shrink-0"
            style={{
              width: 38,
              height: 38,
              background: 'linear-gradient(135deg, rgba(56,189,248,0.18), rgba(59,130,246,0.18))',
              border: '1px solid rgba(56,189,248,0.25)',
            }}
          >
            <img
              src={companyLogo || '/logo.png'}
              alt="Logo ProTech Touch"
              className="w-full h-full object-cover"
            />
          </div>
          <div
            className="ml-3 overflow-hidden"
            style={{
              opacity: expanded ? 1 : 0,
              width: expanded ? 180 : 0,
              transition: 'opacity 180ms ease, width 200ms ease',
              whiteSpace: 'nowrap',
            }}
          >
            <p className="font-serif font-bold text-sm truncate" style={{ color: text }}>ProTech Touch</p>
            <p className="text-[11px] truncate" style={{ color: sub }}>{roleLabel}</p>
          </div>
        </div>

        {/* User profile */}
        <div
          className="flex items-center flex-shrink-0 overflow-hidden"
          style={{
            padding: expanded ? '16px 14px' : '12px 10px',
            borderBottom: `1px solid ${bd}`,
            transition: 'padding 200ms ease',
            minHeight: 72,
          }}
        >
          <div
            className="flex items-center justify-center text-white font-bold rounded-xl flex-shrink-0"
            style={{
              width: 38,
              height: 38,
              fontSize: 16,
              background: 'linear-gradient(135deg,#38bdf8,#0ea5e9)',
              color: '#ffffff',
              minWidth: 38,
            }}
            aria-hidden
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div
            className="ml-3 overflow-hidden"
            style={{
              opacity: expanded ? 1 : 0,
              width: expanded ? 180 : 0,
              transition: 'opacity 180ms ease, width 200ms ease',
              whiteSpace: 'nowrap',
            }}
          >
            <p className="font-semibold text-sm truncate" style={{ color: text }}>{user.name}</p>
            <p className="text-xs truncate" style={{ color: sub }}>{roleLabel}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2" aria-label="Menu principal">
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {visibleMenu.map(({ page, label, Icon }) => {
              const active = currentPage === page
              return (
                <li key={page}>
                  <button
                    onClick={() => onNavigate(page)}
                    className="w-full flex items-center text-left transition-all outline-none"
                    style={{
                      padding: expanded ? '10px 14px' : '10px 11px',
                      background: active ? activeBg : 'transparent',
                      color: active ? activeText : text,
                      borderRadius: 10,
                      margin: '1px 6px',
                      width: 'calc(100% - 12px)',
                      transition: 'background 150ms ease, padding 200ms ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = hoverBg }}
                    onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                    aria-current={active ? 'page' : undefined}
                    title={!expanded ? label : undefined}
                  >
                    <Icon
                      size={18}
                      style={{ flexShrink: 0, minWidth: 18, color: active ? activeText : text }}
                      aria-hidden
                    />
                    <span
                      className="ml-3 text-sm font-medium"
                      style={{
                        opacity: expanded ? 1 : 0,
                        width: expanded ? 'auto' : 0,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        transition: 'opacity 160ms ease',
                        color: active ? activeText : text,
                      }}
                    >
                      {label}
                    </span>
                    {!expanded && active && (
                      <span
                        className="absolute right-0 top-1/2 -translate-y-1/2"
                        style={{
                          width: 3,
                          height: 20,
                          background: '#38bdf8',
                          borderRadius: '3px 0 0 3px',
                        }}
                      />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        {user?.role === 'caisse' && (
          <button
            type="button"
            onClick={openReportsPage}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              currentPage === 'reports'
                ? 'bg-sky-400 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1e2436]'
            }`}
          >
            <span aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
                <path d="M10 9H8" />
              </svg>
            </span>
            <span>Rapport</span>
          </button>
        )}
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button
            type="button"
            onClick={openCashReports}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1e2436]"
          >
            <span aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
                <path d="M10 9H8" />
              </svg>
            </span>
            <span>Rapports de caisse</span>
          </button>
        )}
        {user?.role === 'caisse' && (
          <button
            type="button"
            onClick={() => setShowCloseDay(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1e2436]"
          >
            <span aria-hidden>✓</span>
            <span>Cloturer la journee</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowSyncCenter(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1e2436]"
        >
          <span aria-hidden>↻</span>
          <span>Synchronisation</span>
          {(pendingReportCount + pendingOperationCount) > 0 && (
            <span className="ml-auto rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
              {pendingReportCount + pendingOperationCount}
            </span>
          )}
        </button>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button
            type="button"
            onClick={() => setShowJournal(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1e2436]"
          >
            <span aria-hidden>J</span>
            <span>Journal de caisse</span>
          </button>
        )}
        {user?.role === 'admin' && (
          <>
            <button
              type="button"
              onClick={() => setShowBackupCenter(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1e2436]"
            >
              <span aria-hidden>↓</span>
              <span>Sauvegarde</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNotifications(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1e2436]"
            >
              <span aria-hidden>!</span>
              <span>Notifications</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPermissions(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1e2436]"
            >
              <span aria-hidden>⚿</span>
              <span>Permissions</span>
            </button>
            <button
              type="button"
              onClick={() => setShowClientSetup(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1e2436]"
            >
              <span aria-hidden>⚙</span>
              <span>Configuration client</span>
            </button>
            <button
              type="button"
              onClick={() => setShowTicketSetup(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1e2436]"
            >
              <span aria-hidden>QR</span>
              <span>Ticket</span>
            </button>
          </>
        )}
      </nav>

      {showCloseDay && user && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-lg mx-auto mt-10 bg-white dark:bg-[#0f1117] rounded-2xl shadow-2xl p-5 border border-gray-100 dark:border-[#2b344d]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Cloturer la journee</h2>
              <button type="button" onClick={() => setShowCloseDay(false)} className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-[#1e2436] text-gray-700 dark:text-gray-100">x</button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
              La cloture utilise le meme rapport de caisse et marque la fin de service du caissier.
            </p>
            <button type="button" onClick={() => { setShowCloseDay(false); setShowDailyReport(false); onNavigate('reports') }} className="w-full py-3 rounded-xl font-bold text-white text-sm bg-blue-500">
              Remplir le rapport de cloture
            </button>
          </div>
        </div>
      )}

      {showSyncCenter && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-lg mx-auto mt-10 bg-white dark:bg-[#0f1117] rounded-2xl shadow-2xl p-5 border border-gray-100 dark:border-[#2b344d]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Synchronisation</h2>
              <button type="button" onClick={() => setShowSyncCenter(false)} className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-[#1e2436] text-gray-700 dark:text-gray-100">x</button>
            </div>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex justify-between rounded-xl border border-gray-100 dark:border-[#2b344d] p-3">
                <span>Rapports en attente</span>
                <strong>{pendingReportCount}</strong>
              </div>
              <div className="flex justify-between rounded-xl border border-gray-100 dark:border-[#2b344d] p-3">
                <span>Operations en attente</span>
                <strong>{pendingOperationCount}</strong>
              </div>
              <p>Les elements en attente seront renvoyes quand la connexion sera disponible.</p>
            </div>
          </div>
        </div>
      )}

      {showBackupCenter && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-lg mx-auto mt-10 bg-white dark:bg-[#0f1117] rounded-2xl shadow-2xl p-5 border border-gray-100 dark:border-[#2b344d]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Sauvegarde locale</h2>
              <button type="button" onClick={() => setShowBackupCenter(false)} className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-[#1e2436] text-gray-700 dark:text-gray-100">x</button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
              Exporte les donnees locales importantes dans un fichier JSON de secours.
            </p>
            <button type="button" onClick={exportLocalBackup} className="w-full py-3 rounded-xl font-bold text-white text-sm bg-green-500">
              Exporter la sauvegarde
            </button>
          </div>
        </div>
      )}

      {showJournal && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-3xl mx-auto mt-10 bg-white dark:bg-[#0f1117] rounded-2xl shadow-2xl p-5 border border-gray-100 dark:border-[#2b344d]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Journal de caisse</h2>
              <button type="button" onClick={() => setShowJournal(false)} className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-[#1e2436] text-gray-700 dark:text-gray-100">x</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl border border-gray-100 dark:border-[#2b344d] p-3">
                <p className="text-xs text-gray-400">Ventes locales</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{localSales.length}</p>
              </div>
              <div className="rounded-xl border border-gray-100 dark:border-[#2b344d] p-3">
                <p className="text-xs text-gray-400">Rapports en attente</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{pendingReportCount}</p>
              </div>
              <div className="rounded-xl border border-gray-100 dark:border-[#2b344d] p-3">
                <p className="text-xs text-gray-400">Operations en attente</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{pendingOperationCount}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-300">Ce journal resume les donnees locales disponibles sur cette machine.</p>
          </div>
        </div>
      )}

      {showNotifications && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-lg mx-auto mt-10 bg-white dark:bg-[#0f1117] rounded-2xl shadow-2xl p-5 border border-gray-100 dark:border-[#2b344d]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Notifications admin</h2>
              <button type="button" onClick={() => setShowNotifications(false)} className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-[#1e2436] text-gray-700 dark:text-gray-100">x</button>
            </div>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <p>{pendingReportCount > 0 ? `${pendingReportCount} rapport(s) en attente sur cette machine.` : 'Aucun rapport local en attente.'}</p>
              <p>{pendingOperationCount > 0 ? `${pendingOperationCount} operation(s) en attente de synchronisation.` : 'Aucune operation locale en attente.'}</p>
            </div>
          </div>
        </div>
      )}

      {showPermissions && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-2xl mx-auto mt-10 bg-white dark:bg-[#0f1117] rounded-2xl shadow-2xl p-5 border border-gray-100 dark:border-[#2b344d]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Permissions</h2>
              <button type="button" onClick={() => setShowPermissions(false)} className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-[#1e2436] text-gray-700 dark:text-gray-100">x</button>
            </div>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <p><strong>Admin</strong> : acces complet, parametres, rapports, sauvegarde, utilisateurs.</p>
              <p><strong>Manager</strong> : tableau de bord, produits, rapports de caisse.</p>
              <p><strong>Caissier</strong> : caisse, rapport, cloture et operations autorisees uniquement.</p>
            </div>
          </div>
        </div>
      )}

      {showClientSetup && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-lg mx-auto mt-10 bg-white dark:bg-[#0f1117] rounded-2xl shadow-2xl p-5 border border-gray-100 dark:border-[#2b344d]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Configuration client</h2>
              <button type="button" onClick={() => setShowClientSetup(false)} className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-[#1e2436] text-gray-700 dark:text-gray-100">x</button>
            </div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Nom de l'entreprise</label>
            <input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-[#2b344d] bg-white dark:bg-[#1e2436] text-sm text-gray-900 dark:text-gray-100 mb-4" />
            <button type="button" onClick={saveClientSetup} className="w-full py-3 rounded-xl font-bold text-white text-sm bg-blue-500">
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {showTicketSetup && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-lg mx-auto mt-10 bg-white dark:bg-[#0f1117] rounded-2xl shadow-2xl p-5 border border-gray-100 dark:border-[#2b344d]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Ticket</h2>
              <button type="button" onClick={() => setShowTicketSetup(false)} className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-[#1e2436] text-gray-700 dark:text-gray-100">x</button>
            </div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Note de bas de ticket</label>
            <textarea value={ticketNote} onChange={(e) => setTicketNote(e.target.value)} className="w-full min-h-[100px] px-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-[#2b344d] bg-white dark:bg-[#1e2436] text-sm text-gray-900 dark:text-gray-100 mb-4" />
            <button type="button" onClick={saveTicketSetup} className="w-full py-3 rounded-xl font-bold text-white text-sm bg-blue-500">
              Enregistrer
            </button>
          </div>
        </div>
      )}

      {showDailyReport && user && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-xl mx-auto mt-10 bg-white dark:bg-[#0f1117] rounded-2xl shadow-2xl p-5 border border-gray-100 dark:border-[#2b344d]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">Rapport de caisse</h2>
              <button
                type="button"
                onClick={() => setShowDailyReport(false)}
                className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-[#1e2436] text-gray-700 dark:text-gray-100"
                aria-label="Fermer"
              >
                x
              </button>
            </div>

            <form onSubmit={submitDailyReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Caissier</label>
                <input value={user.name} disabled className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-[#2b344d] bg-gray-50 dark:bg-[#1e2436] text-sm text-gray-700 dark:text-gray-200" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Depenses</label>
                  <input type="number" min="0" value={reportExpenses} onChange={(e) => setReportExpenses(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-[#2b344d] bg-white dark:bg-[#1e2436] text-sm text-gray-900 dark:text-gray-100" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Cash</label>
                  <input type="number" min="0" value={reportCash} onChange={(e) => setReportCash(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-[#2b344d] bg-white dark:bg-[#1e2436] text-sm text-gray-900 dark:text-gray-100" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Mobile</label>
                  <input type="number" min="0" value={reportMobile} onChange={(e) => setReportMobile(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-[#2b344d] bg-white dark:bg-[#1e2436] text-sm text-gray-900 dark:text-gray-100" placeholder="0" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Observations</label>
                <textarea
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  className="w-full min-h-[130px] px-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-[#2b344d] bg-white dark:bg-[#1e2436] text-sm text-gray-900 dark:text-gray-100 resize-y"
                  placeholder="Depenses, ecarts, incidents, remarques de fin de journee..."
                />
              </div>

              {reportMessage && <p className="text-sm text-gray-600 dark:text-gray-300">{reportMessage}</p>}

              <button type="submit" className="w-full py-3 rounded-xl font-bold text-white text-sm hover:brightness-110 transition-all bg-blue-500">
                Envoyer le rapport
              </button>
            </form>
          </div>
        </div>
      )}

      {showCashReports && (user?.role === 'admin' || user?.role === 'manager') && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-6xl mx-auto mt-8 bg-white dark:bg-[#0f1117] rounded-2xl shadow-2xl p-5 border border-gray-100 dark:border-[#2b344d]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Rapports de caisse</h2>
                <p className="text-xs text-gray-400">Depenses, declarations et observations envoyees par les caissiers.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={loadCashReports}
                  className="px-3 h-9 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:brightness-110"
                >
                  Actualiser
                </button>
                <button
                  type="button"
                  onClick={() => setShowCashReports(false)}
                  className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-[#1e2436] text-gray-700 dark:text-gray-100"
                  aria-label="Fermer"
                >
                  x
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Filtrer par date</label>
                <input
                  type="date"
                  value={reportFilterDate}
                  onChange={(e) => setReportFilterDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-[#2b344d] bg-white dark:bg-[#1e2436] text-sm text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Filtrer par caissier</label>
                <input
                  value={reportFilterCashier}
                  onChange={(e) => setReportFilterCashier(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-[#2b344d] bg-white dark:bg-[#1e2436] text-sm text-gray-900 dark:text-gray-100"
                  placeholder="Nom ou email"
                />
              </div>
            </div>

            {reportsMessage && <p className="text-sm text-sky-700 bg-sky-50 rounded-lg px-3 py-2 mb-3">{reportsMessage}</p>}

            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-[#2b344d]">
              <table className="w-full text-sm">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-3 py-3 text-left whitespace-nowrap">Date</th>
                    <th className="px-3 py-3 text-left whitespace-nowrap">Caissier</th>
                    <th className="px-3 py-3 text-left whitespace-nowrap">Depenses</th>
                    <th className="px-3 py-3 text-left whitespace-nowrap">Cash</th>
                    <th className="px-3 py-3 text-left whitespace-nowrap">Mobile</th>
                    <th className="px-3 py-3 text-left min-w-[260px]">Observations</th>
                    <th className="px-3 py-3 text-left whitespace-nowrap">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#243047]">
                  {filteredCashReports.map((report) => (
                    <tr key={report.id || `${report.cashierEmail}-${report.createdAt}`} className="bg-white dark:bg-[#111827]">
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{String(report.reportDate || '').slice(0, 10) || '-'}</td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-gray-800 dark:text-white">{report.cashierName || '-'}</p>
                        <p className="text-xs text-gray-400">{report.cashierEmail || ''}</p>
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{Number(report.expenses || 0).toLocaleString('fr-CD')}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{Number(report.cashAmount || 0).toLocaleString('fr-CD')}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{Number(report.mobileAmount || 0).toLocaleString('fr-CD')}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{report.notes || '-'}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            report.status === 'en attente'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {report.status === 'en attente' ? 'En attente' : 'Envoye'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!reportsLoading && filteredCashReports.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-gray-400">
                        Aucun rapport trouve
                      </td>
                    </tr>
                  )}
                  {reportsLoading && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-gray-400">
                        Chargement des rapports...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


        {/* Divider */}
        <div style={{ height: 1, background: bd, margin: '4px 10px', flexShrink: 0 }} />

        {/* Sync button */}
        <div className="flex-shrink-0 px-1.5 py-1">
          <button
            onClick={onSync}
            disabled={syncStatus === 'syncing'}
            className="w-full flex items-center transition-all outline-none rounded-xl"
            style={{
              padding: expanded ? '9px 12px' : '9px 11px',
              color: isOnline ? '#22c55e' : '#ef4444',
              transition: 'padding 200ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = hoverBg }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            title={!expanded ? (isOnline ? 'En ligne — Synchroniser' : 'Hors ligne') : undefined}
            aria-label="Synchroniser les données"
          >
            {isOnline ? (
              <Wifi size={18} style={{ flexShrink: 0, minWidth: 18 }} aria-hidden />
            ) : (
              <WifiOff size={18} style={{ flexShrink: 0, minWidth: 18 }} aria-hidden />
            )}
            <span
              className="ml-3 flex items-center gap-2 text-sm font-medium"
              style={{
                opacity: expanded ? 1 : 0,
                width: expanded ? 'auto' : 0,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                transition: 'opacity 160ms ease',
              }}
            >
              {isOnline ? 'Synchroniser' : 'Hors ligne'}
              {syncStatus === 'syncing' && (
                <RefreshCw size={13} className="animate-spin" aria-hidden />
              )}
              {pendingCount > 0 && isOnline && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-white text-[10px] font-bold"
                  style={{ background: '#ef4444', lineHeight: 1.2 }}
                >
                  {pendingCount}
                </span>
              )}
            </span>
            {!expanded && pendingCount > 0 && (
              <span
                className="absolute"
                style={{
                  top: 6,
                  right: 6,
                  width: 7,
                  height: 7,
                  background: '#ef4444',
                  borderRadius: '50%',
                }}
              />
            )}
          </button>
        </div>

        {/* Logout */}
        <div className="flex-shrink-0 px-1.5 pb-3">
          <button
            onClick={onLogout}
            className="w-full flex items-center transition-all rounded-xl outline-none"
            style={{
              padding: expanded ? '9px 12px' : '9px 11px',
              color: '#ef4444',
              transition: 'padding 200ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            title={!expanded ? 'Déconnexion' : undefined}
            aria-label="Déconnexion"
          >
            <LogOut size={18} style={{ flexShrink: 0, minWidth: 18 }} aria-hidden />
            <span
              className="ml-3 text-sm font-medium"
              style={{
                opacity: expanded ? 1 : 0,
                width: expanded ? 'auto' : 0,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                transition: 'opacity 160ms ease',
              }}
            >
              Déconnexion
            </span>
          </button>
        </div>

        {/* Expand hint when collapsed */}
        {!expanded && (
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{
              width: 14,
              height: 40,
              background: darkMode ? '#1e2130' : '#f0f0f0',
              borderRadius: '4px 0 0 4px',
              opacity: 0.6,
            }}
            aria-hidden
          >
            <ChevronRight size={10} style={{ color: sub }} />
          </div>
        )}
      </aside>
    </>
  )
}

export { RAIL_W, FULL_W }
