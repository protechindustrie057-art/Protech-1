'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ActivityLog } from '@/lib/types'
import { apiCall } from '@/lib/api'

const ACTION_LABELS: Record<string, string> = {
  login: 'Connexion',
  logout: 'Deconnexion',
  product_created: 'Produit ajoute',
  product_updated: 'Produit modifie',
  product_deleted: 'Produit supprime',
  sale_created: 'Vente',
  invoice_created: 'Facture',
  user_created: 'Utilisateur ajoute',
  user_updated: 'Utilisateur modifie',
  user_deleted: 'Utilisateur supprime',
  settings_updated: 'Parametres',
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  async function loadLogs() {
    setLoading(true)
    setError('')
    try {
      const response = await apiCall<ActivityLog[]>('activity-logs?limit=200')
      setLogs(response.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les activites')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadLogs()
  }, [])

  const actions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.action))).sort()
  }, [logs])

  const filteredLogs = filter === 'all' ? logs : logs.filter((log) => log.action === filter)

  return (
    <div className="text-black dark:text-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <h2 className="text-xl font-bold font-serif text-gray-800 dark:text-white">Activite utilisateurs</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2b344d] bg-white dark:bg-[#1e2436] text-sm"
            aria-label="Filtrer les activites"
          >
            <option value="all">Toutes les actions</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {ACTION_LABELS[action] || action}
              </option>
            ))}
          </select>
          <button
            onClick={loadLogs}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-500 hover:brightness-110"
          >
            Actualiser
          </button>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-[#2b344d] shadow-sm bg-white dark:bg-[#0f1117]">
        <div className="overflow-x-auto max-h-[calc(100vh-260px)] overflow-y-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-gray-800 text-white z-10">
              <tr>
                {['Date', 'Utilisateur', 'Action', 'Resume', 'Cible'].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#111827] divide-y divide-gray-100 dark:divide-[#1f2937]">
              {loading && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">Chargement...</td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-red-500">{error}</td>
                </tr>
              )}
              {!loading && !error && filteredLogs.map((log) => (
                <tr key={String(log._id || `${log.createdAt}-${log.summary}`)} className="hover:bg-gray-50 dark:hover:bg-[#111827]">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('fr-CD')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-800 dark:text-white">{log.actor?.name || 'Utilisateur inconnu'}</div>
                    <div className="text-xs text-gray-400">{log.actor?.role || ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{log.summary}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {log.entity}
                    {log.entityId !== null && log.entityId !== undefined ? ` #${log.entityId}` : ''}
                  </td>
                </tr>
              ))}
              {!loading && !error && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">
                    Aucune activite enregistree
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
