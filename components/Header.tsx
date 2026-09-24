'use client'

import { Sun, Moon, Download, Globe, DollarSign, RefreshCw } from 'lucide-react'
import type { Currency, Language } from '@/lib/types'

interface Props {
  darkMode: boolean
  onToggleTheme: () => void
  language: Language
  onLanguageChange: (l: Language) => void
  currency: Currency
  onCurrencyChange: (c: Currency) => void
  onExport: () => void
  onRefresh: () => void
  isRefreshing: boolean
  companyName: string
  companyLogo?: string
}

export default function Header({
  darkMode,
  onToggleTheme,
  language,
  onLanguageChange,
  currency,
  onCurrencyChange,
  onExport,
  onRefresh,
  isRefreshing,
  companyName,
  companyLogo,
}: Props) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-[2000] flex items-center justify-between px-4"
      style={{
        height: 60,
        background: 'hsl(var(--background))',
        borderBottom: '1px solid hsl(var(--border))',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 border"
          style={{
            background: 'linear-gradient(135deg, rgba(255,215,0,0.18), rgba(59,130,246,0.18))',
            borderColor: 'rgba(255,215,0,0.3)',
          }}
        >
          <img src={companyLogo || '/logo.png'} alt="Logo ProTech Touch" className="w-full h-full object-cover" />
        </div>
        <span className="font-serif font-bold text-base text-white hidden sm:block truncate max-w-[180px]">
          {companyName}
        </span>
      </div>

      {/* Center */}
      <h1 className="font-serif font-semibold text-sm hidden md:block" style={{ color: '#38bdf8', letterSpacing: '0.08em' }}>
        GESTION PROFESSIONNELLE
      </h1>

      {/* Right controls */}
      <div className="flex items-center gap-1">
        {/* Language */}
        <div className="relative flex items-center">
          <Globe size={13} className="absolute left-2 text-blue-500 pointer-events-none" aria-hidden />
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="text-xs pl-6 pr-2 rounded-lg border-none outline-none cursor-pointer appearance-none"
            style={{ background: 'hsl(var(--popover))', color: 'hsl(var(--foreground))', height: 34 }}
            aria-label="Changer de langue"
          >
            <option value="fr" style={{ background: '#1a1f2e' }}>FR</option>
            <option value="en" style={{ background: '#1a1f2e' }}>EN</option>
            <option value="de" style={{ background: '#1a1f2e' }}>DE</option>
          </select>
        </div>

        {/* Currency */}
        <div className="relative flex items-center">
          <DollarSign size={13} className="absolute left-2 text-green-500 pointer-events-none" aria-hidden />
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value as Currency)}
            className="text-xs pl-6 pr-2 rounded-lg border-none outline-none cursor-pointer appearance-none"
            style={{ background: 'hsl(var(--popover))', color: 'hsl(var(--foreground))', height: 34 }}
            aria-label="Changer de devise"
          >
            <option value="CDF" style={{ background: '#1a1f2e' }}>CDF</option>
            <option value="USD" style={{ background: '#1a1f2e' }}>USD</option>
          </select>
        </div>

        {/* Export */}
        <button
          onClick={onExport}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
          title="Exporter les données"
          aria-label="Exporter les données"
          style={{ color: 'hsl(var(--foreground) / 0.7)' }}
        >
          <Download size={16} aria-hidden />
        </button>

        {/* Refresh data */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/10 disabled:opacity-50"
          title="Actualiser les donnees"
          aria-label="Actualiser les donnees"
          style={{ color: 'hsl(var(--foreground) / 0.7)' }}
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} aria-hidden />
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="group relative inline-flex h-8 w-16 items-center rounded-full border border-sky-200 bg-slate-100 p-1 shadow-inner transition-all duration-300 hover:border-sky-300 dark:border-sky-800 dark:bg-[#0f172a]"
          title={darkMode ? 'Mode clair' : 'Mode sombre'}
          aria-label={darkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
        >
          <span className="absolute inset-x-0 flex items-center justify-between px-2 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            <span className={darkMode ? 'text-slate-400' : 'text-sky-600'}>Light</span>
            <span className={darkMode ? 'text-sky-300' : 'text-slate-400'}>Dark</span>
          </span>

          <span
            className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-lg transition-transform duration-300 ${
              darkMode ? 'translate-x-8 bg-slate-900 text-sky-300' : 'translate-x-0 bg-white text-amber-500'
            }`}
          >
            {darkMode ? <Moon size={12} aria-hidden /> : <Sun size={12} aria-hidden />}
          </span>
        </button>
      </div>
    </header>
  )
}
