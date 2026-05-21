'use client'

import { useState } from 'react'
import type { User } from '@/lib/types'

interface Props {
  users: User[]
  role: 'caisse' | 'manager'
  onSave: (data: { name: string; email: string; password?: string; caisse_number?: number }, id?: number) => void
  onDelete: (id: number) => void
}

const EMPTY_FORM = { name: '', email: '', password: '', caisse_number: '1' }

export default function UsersPage({ users, role, onSave, onDelete }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')

  const isCaisse = role === 'caisse'
  const title = isCaisse ? 'Gestion des caissiers' : 'Gestion des managers'
  const label = isCaisse ? 'caissier' : 'manager'

  function openAdd() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setFormError('')
    setShowModal(true)
  }

  function openEdit(u: User) {
    setForm({ name: u.name, email: u.email, password: '', caisse_number: (u.caisse_number ?? 1).toString() })
    setEditingId(u.id)
    setFormError('')
    setShowModal(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Nom et email sont requis.')
      return
    }
    if (!editingId && !form.password) {
      setFormError('Mot de passe requis pour un nouveau compte.')
      return
    }
    onSave(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password || undefined,
        caisse_number: isCaisse ? parseInt(form.caisse_number) : undefined,
      },
      editingId ?? undefined
    )
    setShowModal(false)
  }

  const columns = isCaisse
    ? ['ID', 'Nom', 'Email', 'Caisse N°', 'Statut', 'Dernière connexion', 'Actions']
    : ['ID', 'Nom', 'Email', 'Statut', 'Dernière connexion', 'Actions']

  return (
    <div className="text-black dark:text-white">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold font-serif text-gray-800 dark:text-white">{title}</h2>
        <button
          onClick={openAdd}
          className="px-4 py-2 rounded-xl text-white text-sm font-semibold hover:brightness-110 transition-all flex items-center gap-2"
          style={{ background: '#22c55e' }}
        >
          + Nouveau {label}
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-[#2b344d] shadow-sm bg-white dark:bg-[#0f1117]">
        <div className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-gray-800 text-white z-10">
              <tr>
                {columns.map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#111827] divide-y divide-gray-100 dark:divide-[#1f2937]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-[#111827] transition-colors bg-white dark:bg-[#111827]">
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-400 font-mono text-xs">{u.id}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{u.email}</td>
                  {isCaisse && <td className="px-4 py-3 text-gray-600">{u.caisse_number ?? '—'}</td>}
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-1 rounded-full text-xs font-semibold"
                      style={
                        u.status === 'actif'
                          ? { background: '#dcfce7', color: '#15803d' }
                          : { background: '#fee2e2', color: '#b91c1c' }
                      }
                    >
                      {u.status === 'actif' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {u.last_login ? new Date(u.last_login).toLocaleString('fr-CD') : 'Jamais'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openEdit(u)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs hover:brightness-110"
                        style={{ background: '#3b82f6' }}
                        aria-label="Modifier"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => confirm(`Supprimer ${u.name} ?`) && onDelete(u.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs hover:brightness-110"
                        style={{ background: '#ef4444' }}
                        aria-label="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="py-10 text-center text-gray-400 dark:text-gray-500">
                    Aucun {label} enregistré
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-[#0f1117] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                {editingId ? `Modifier ${label}` : `Nouveau ${label}`}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#1f2937] hover:bg-gray-200 dark:hover:bg-[#374151] flex items-center justify-center text-gray-800 dark:text-gray-200" aria-label="Fermer">✕</button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-4">
                <Field label="Nom complet *">
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={INPUT} placeholder="Prénom Nom" required />
                </Field>
                <Field label="Email *">
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={INPUT} placeholder="email@exemple.com" required />
                </Field>
                <Field label={editingId ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={INPUT} placeholder="••••••••" />
                </Field>
                {isCaisse && (
                  <Field label="Numéro de caisse">
                    <input type="number" value={form.caisse_number} onChange={(e) => setForm({ ...form, caisse_number: e.target.value })} className={INPUT} min="1" max="9" />
                  </Field>
                )}
              </div>
              {formError && <p className="text-red-500 text-xs mt-2">{formError}</p>}
              <div className="flex gap-3 mt-5">
                <button type="submit" className="flex-1 py-3 rounded-xl font-bold text-white hover:brightness-110 transition-all" style={{ background: '#22c55e' }}>
                  Enregistrer
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl font-bold text-white hover:brightness-110 transition-all" style={{ background: '#6b7280' }}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const INPUT = 'w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 dark:border-[#2b344d] focus:border-yellow-400 focus:outline-none text-sm bg-white dark:bg-[#1e2436] text-gray-900 dark:text-gray-100'
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  )
}
