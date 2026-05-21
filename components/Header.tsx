'use client'

import { Sun, Moon, Download, Globe, DollarSign } from 'lucide-react'
import type { Currency, Language } from '@/lib/types'

interface Props {
  darkMode: boolean
  onToggleTheme: () => void
  language: Language
  onLanguageChange: (l: Language) => void
  currency: Currency
  onCurrencyChange: (c: Currency) => void
  onExport: () => void
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
          className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))' }}
        >
          {companyLogo ? (
            <img src={companyLogo} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-base font-bold text-gray-900" aria-hidden>S</span>
          )}
        </div>
        <span className="font-serif font-bold text-base text-white hidden sm:block truncate max-w-[180px]">
          {companyName}
        </span>
      </div>

      {/* Center */}
      <h1 className="font-serif font-semibold text-sm hidden md:block" style={{ color: '#ffd700', letterSpacing: '0.08em' }}>
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

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
          title={darkMode ? 'Mode clair' : 'Mode sombre'}
          aria-label={darkMode ? 'Activer le mode clair' : 'Activer le mode sombre'}
          style={{ background: 'linear-gradient(135deg,#ffffff 50%,#000000 50%)', color: '#ffd700' }}
        >
          {darkMode ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
        </button>
      </div>
    </header>
  )
}
