'use client'

import { useEffect, useMemo, useState } from 'react'
import type { User } from '@/lib/types'
import { API_BASE_URL } from '@/lib/store'

type Props = {
  user: User
}

type DailyReport = {
  id: string
  reportDate: string
  cashierId: number
  cashierName: string
  cashierEmail: string
  expenses: number
  cashAmount: number
  mobileAmount: number
  notes: string
  createdAt: string
  actor?: User
}

const PENDING_KEY = 'protech_pending_daily_reports'
const REPORTS_KEY = 'protech_daily_reports'

function getLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function setLS(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

function apiUrl(path: string) {
  return `${API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

async function sendReport(report: DailyReport) {
  const response = await fetch(apiUrl('daily-reports'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(report),
  })

  if (!response.ok) throw new Error('Envoi impossible')
}

async function flushPendingReports() {
  const pending = getLS<DailyReport[]>(PENDING_KEY, [])
  if (pending.length === 0) return

  const remaining: DailyReport[] = []
  for (const report of pending) {
    try {
      await sendReport(report)
    } catch {
      remaining.push(report)
    }
  }
  setLS(PENDING_KEY, remaining)
}

export default function DailyReportsPage({ user }: Props) {
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10))
  const [expenses, setExpenses] = useState('')
  const [cashAmount, setCashAmount] = useState('')
  const [mobileAmount, setMobileAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState('')
  const [pendingCount, setPendingCount] = useState(0)

  const savedReports = useMemo(() => getLS<DailyReport[]>(REPORTS_KEY, []), [])

  function refreshPendingCount() {
    setPendingCount(getLS<DailyReport[]>(PENDING_KEY, []).length)
  }

  useEffect(() => {
    refreshPendingCount()
    flushPendingReports().finally(refreshPendingCount)
    window.addEventListener('online', flushPendingReports)
    return () => window.removeEventListener('online', flushPendingReports)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')

    const report: DailyReport = {
      id: `report-${Date.now()}`,
      reportDate,
      cashierId: Number(user.id),
      cashierName: user.name,
      cashierEmail: user.email,
      expenses: Number(expenses || 0),
      cashAmount: Number(cashAmount || 0),
      mobileAmount: Number(mobileAmount || 0),
      notes: notes.trim(),
      actor: user,
      createdAt: new Date().toISOString(),
    }

    if (!report.notes && report.expenses <= 0 && report.cashAmount <= 0 && report.mobileAmount <= 0) {
      setMessage('Complete au moins un champ du rapport.')
      return
    }

    const localReports = [report, ...getLS<DailyReport[]>(REPORTS_KEY, [])].slice(0, 100)
    setLS(REPORTS_KEY, localReports)

    try {
      await sendReport(report)
      setMessage('Rapport envoye a l administrateur.')
    } catch {
      const pending = [report, ...getLS<DailyReport[]>(PENDING_KEY, [])]
      setLS(PENDING_KEY, pending)
      setMessage('Connexion indisponible. Rapport garde en attente de synchronisation.')
    }

    setExpenses('')
    setCashAmount('')
    setMobileAmount('')
    setNotes('')
    refreshPendingCount()
  }

  return (
    <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-1 text-black dark:text-white">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold font-serif text-gray-800 dark:text-white">Rapport de caisse</h2>
        {pendingCount > 0 && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
            {pendingCount} en attente
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        <section className="bg-white dark:bg-[#0f1117] rounded-2xl p-5 border border-gray-100 dark:border-[#2b344d] shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Date">
                <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} className={INPUT} />
              </Field>
              <Field label="Caissier">
                <input value={user.name} disabled className={`${INPUT} opacity-70`} />
              </Field>
              <Field label="Depenses">
                <input type="number" min="0" value={expenses} onChange={(e) => setExpenses(e.target.value)} className={INPUT} placeholder="0" />
              </Field>
              <Field label="Montant cash declare">
                <input type="number" min="0" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} className={INPUT} placeholder="0" />
              </Field>
              <Field label="Montant mobile declare">
                <input type="number" min="0" value={mobileAmount} onChange={(e) => setMobileAmount(e.target.value)} className={INPUT} placeholder="0" />
              </Field>
            </div>

            <Field label="Observations">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={`${INPUT} min-h-[140px] resize-y`}
                placeholder="Depenses, ecarts, incidents, besoins, remarques de fin de journee..."
              />
            </Field>

            {message && <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{message}</p>}

            <button type="submit" className="w-full py-3 rounded-xl font-bold text-white text-sm hover:brightness-110 transition-all bg-blue-500">
              Envoyer le rapport
            </button>
          </form>
        </section>

        <aside className="bg-white dark:bg-[#0f1117] rounded-2xl p-5 border border-gray-100 dark:border-[#2b344d] shadow-sm">
          <h3 className="font-bold text-gray-700 dark:text-white mb-3">Derniers rapports locaux</h3>
          <div className="space-y-3">
            {savedReports.slice(0, 5).map((report) => (
              <div key={report.id} className="rounded-xl border border-gray-100 dark:border-[#2b344d] p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-gray-700 dark:text-white">{report.reportDate}</span>
                  <span className="text-xs text-gray-400">{new Date(report.createdAt).toLocaleTimeString('fr-CD')}</span>
                </div>
                <p className="text-gray-500 dark:text-gray-300 mt-1 line-clamp-2">{report.notes || 'Rapport financier'}</p>
              </div>
            ))}
            {savedReports.length === 0 && <p className="text-sm text-gray-400">Aucun rapport local.</p>}
          </div>
        </aside>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  )
}

const INPUT = 'w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:outline-none text-sm bg-white dark:bg-[#1e2436] dark:border-[#2a3448] dark:text-gray-100 disabled:cursor-not-allowed'
