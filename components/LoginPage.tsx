'use client'

import { useState, useRef } from 'react'
import type { User } from '@/lib/types'
import { authenticate } from '@/lib/store'

interface Props {
  onLogin: (user: User) => void
}

const FLOAT_ICONS = ['🍾', '🧴', '💄', '👑', '🌸', '🌺', '🧖', '💅', '🎀', '✨', '🌟', '💋', '👄', '💎', '🧪']

const MAX_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000

export default function LoginPage({ onLogin }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPw, setRegPw] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [logoAvailable, setLogoAvailable] = useState(true)

  // Countdown tick
  const startTimer = (until: number) => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      const n = Date.now()
      setNow(n)
      if (n >= until) {
        clearInterval(timerRef.current!)
        setLockedUntil(null)
        setAttempts(0)
        setError('')
      }
    }, 1000)
  }

  const isLocked = lockedUntil !== null && now < lockedUntil
  const remainingMs = lockedUntil ? Math.max(0, lockedUntil - now) : 0
  const remainingMin = Math.floor(remainingMs / 60000)
  const remainingSec = Math.floor((remainingMs % 60000) / 1000).toString().padStart(2, '0')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (isLocked || isSubmitting) return

    setIsSubmitting(true)
    const user = await authenticate(email, password)
    if (user) {
      setAttempts(0)
      onLogin(user)
    } else {
      const next = attempts + 1
      setAttempts(next)
      if (next >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCK_DURATION_MS
        setLockedUntil(until)
        setNow(Date.now())
        startTimer(until)
        setError('Compte verrouillé. Réessayez dans 15 minutes.')
      } else {
        const left = MAX_ATTEMPTS - next
        setError(`Email ou mot de passe incorrect. ${left} tentative(s) restante(s).`)
      }
    }
    setIsSubmitting(false)
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!regName || !regEmail || !regPw) {
      setError('Tous les champs sont requis.')
      return
    }
    if (regPw !== regConfirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setInfo("Demande d'inscription envoyée. Contactez l'administrateur pour l'activation.")
    setRegName('')
    setRegEmail('')
    setRegPw('')
    setRegConfirm('')
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden" style={{ background: '#0a0f1e' }}>
      {/* Floating background icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {FLOAT_ICONS.map((icon, i) => (
          <span
            key={i}
            className="absolute text-5xl opacity-20"
            style={{
              top: `${((i * 17 + 7) % 85) + 5}%`,
              left: `${((i * 23 + 11) % 85) + 5}%`,
              animation: `floatIcon ${16 + (i % 10) * 2}s ease-in-out ${i * 0.5}s infinite alternate`,
            }}
          >
            {icon}
          </span>
        ))}
      </div>

      {/* Glow orb */}
      <div
        className="absolute rounded-full pointer-events-none"
        aria-hidden
        style={{
          width: 600,
          height: 600,
          background: 'radial-gradient(circle, rgba(255,215,0,0.07) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
        }}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-md mx-4 rounded-3xl p-10 shadow-2xl"
        style={{
          background: 'rgba(8, 15, 38, 0.96)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          animation: 'slideInUp 0.5s ease',
        }}
      >
        {/* Header */}
        <header className="text-center mb-7">
          <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-5xl mb-4 shadow-lg overflow-hidden" aria-label="Logo SK Parfumerie">
            {logoAvailable ? (
              <img
                src="/logo.png"
                alt="Logo SK Parfumerie"
                className="w-full h-full object-cover"
                onError={() => setLogoAvailable(false)}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#ffd700,#ffaa00)', border: '4px solid #ffd700' }}
              >
                👑
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold font-serif text-white">SK PARFUMERIE &amp; COSMÉTIQUES</h1>
          <p className="text-sm text-blue-200 mt-1">Système de gestion professionnel</p>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 rounded-xl p-1 mb-6">
          {(['login', 'register'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setInfo('') }}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={
                tab === t
                  ? { background: 'linear-gradient(135deg,#ffd700,#ffaa00)', color: '#0a0f1e', boxShadow: '0 4px 12px rgba(255,215,0,0.35)' }
                  : { color: '#666' }
              }
            >
              {t === 'login' ? 'CONNEXION' : 'INSCRIPTION'}
            </button>
          ))}
        </div>

        {/* Login form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} noValidate>
            <div className="mb-5">
              <label htmlFor="loginEmail" className="block text-sm font-semibold text-gray-600 mb-1.5">
                Email
              </label>
              <input
                id="loginEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                disabled={isLocked || isSubmitting}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-yellow-400 focus:outline-none text-sm transition-all disabled:opacity-50"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="loginPw" className="block text-sm font-semibold text-gray-600 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="loginPw"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLocked || isSubmitting}
                  className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 focus:border-yellow-400 focus:outline-none text-sm transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                  aria-label={showPw ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Error / lock message */}
            {error && (
              <div className="mb-3 text-sm font-medium text-center" style={{ color: '#e74c3c' }}>
                {error}
                {isLocked && (
                  <div className="mt-1 font-bold" style={{ color: '#c0392b' }}>
                    {remainingMin}:{remainingSec}
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLocked || isSubmitting}
              className="w-full py-4 rounded-xl font-bold text-base transition-all mb-4 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#ffd700,#ffaa00)', color: '#0a0f1e' }}
            >
              {isSubmitting ? 'CONNEXION...' : 'SE CONNECTER'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Pas encore de compte?{' '}
              <button type="button" onClick={() => setTab('register')} className="font-semibold" style={{ color: '#d4a017' }}>
                S&apos;inscrire
              </button>
            </p>
          </form>
        )}

        {/* Register form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} noValidate>
            {['Nom complet', 'Email', 'Mot de passe', 'Confirmer'].map((label, i) => {
              const values = [regName, regEmail, regPw, regConfirm]
              const setters = [setRegName, setRegEmail, setRegPw, setRegConfirm]
              const types = ['text', 'email', 'password', 'password']
              return (
                <div key={label} className="mb-4">
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">{label}</label>
                  <input
                    type={types[i]}
                    value={values[i]}
                    onChange={(e) => setters[i](e.target.value)}
                    placeholder={label}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-yellow-400 focus:outline-none text-sm transition-all"
                  />
                </div>
              )
            })}

            {error && <p className="text-sm text-red-500 mb-3 text-center">{error}</p>}
            {info && <p className="text-sm text-green-600 mb-3 text-center">{info}</p>}

            <button
              type="submit"
              className="w-full py-4 rounded-xl font-bold text-base transition-all"
              style={{ background: 'linear-gradient(135deg,#ffd700,#ffaa00)', color: '#0a0f1e' }}
            >
              CRÉER MON COMPTE
            </button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatIcon {
          from { transform: translateY(0) rotate(0deg); }
          to   { transform: translateY(-30px) rotate(15deg); }
        }
      `}</style>
    </div>
  )
}
