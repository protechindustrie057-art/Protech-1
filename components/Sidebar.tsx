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
}

const ADMIN_MENU: { page: ContentPage; label: string; Icon: React.ElementType }[] = [
  { page: 'dashboard', label: 'Tableau de bord', Icon: LayoutDashboard },
  { page: 'caisse',    label: 'Caisse',           Icon: ShoppingCart    },
  { page: 'products',  label: 'Produits',          Icon: Package         },
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
}: Props) {
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
  const activeBg = 'linear-gradient(135deg,#ffd700,#f59e0b)'
  const activeText = '#1a1a1a'
  const hoverBg = darkMode ? 'rgba(255,215,0,0.08)' : 'rgba(255,215,0,0.1)'

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
              background: 'linear-gradient(135deg,#ffd700,#f59e0b)',
              color: '#1a1a1a',
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
                          background: '#ffd700',
                          borderRadius: '3px 0 0 3px',
                        }}
                      />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

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
