'use client'

import { useState } from 'react'
import type { User, UserPresence } from '@/lib/types'

interface Props {
  users: User[]
  role: 'caisse' | 'manager'
  presences?: UserPresence[]
  onSave: (data: { name: string; email: string; password?: string; caisse_number?: number }, id?: number) => void
  onDelete: (id: number) => void
}

const EMPTY_FORM = { name: '', email: '', password: '', caisse_number: '1' }

export default function UsersPage({ users, role, presences = [], onSave, onDelete }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')

  const isCaisse = role === 'caisse'
  const title = isCaisse ? 'Gestion des caissiers' : 'Gestion des managers'
  const label = isCaisse ? 'caissier' : 'manager'
  const columns = isCaisse
    ? ['ID', 'Nom', 'Email', 'Caisse', 'Statut', 'Connexion', 'Derniere activite', 'Actions']
    : ['ID', 'Nom', 'Email', 'Statut', 'Connexion', 'Derniere activite', 'Actions']

  function getPresence(user: User) {
    return presences.find((presence) => Number(presence.userId) === Number(user.id)) || null
  }

  function openAdd() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setFormError('')
    setShowModal(true)
  }

  function openEdit(user: User) {
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      caisse_number: (user.caisse_number ?? 1).toString(),
    })
    setEditingId(user.id)
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
    if (form.password && form.password.length < 8) {
      setFormError('Mot de passe trop court (min 8 caracteres).')
      return
    }
    onSave(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password || undefined,
        caisse_number: isCaisse ? parseInt(form.caisse_number) : undefined,
      },
      editingId ?? undefined,
    )
    setShowModal(false)
  }

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
                {columns.map((heading) => (
                  <th key={heading} className="px-4 py-3 text-left font-semibold whitespace-nowrap">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#111827] divide-y divide-gray-100 dark:divide-[#1f2937]">
              {users.map((user) => {
                const presence = getPresence(user)
                const lastSeen = presence?.lastSeenAt || user.last_seen || user.last_login
                return (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-[#111827] transition-colors bg-white dark:bg-[#111827]">
                    <td className="px-4 py-3 text-gray-400 dark:text-gray-400 font-mono text-xs">{user.id}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{user.email}</td>
                    {isCaisse && <td className="px-4 py-3 text-gray-600">{user.caisse_number ?? '-'}</td>}
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-semibold"
                        style={
                          user.status === 'actif'
                            ? { background: '#dcfce7', color: '#15803d' }
                            : { background: '#fee2e2', color: '#b91c1c' }
                        }
                      >
                        {user.status === 'actif' ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {presence ? (
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            Connecte
                          </span>
                          <p className="text-[11px] text-gray-400 mt-1 max-w-[170px] truncate">{presence.machineName}</p>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                          <span className="w-2 h-2 rounded-full bg-gray-400" />
                          Hors ligne
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {lastSeen ? new Date(lastSeen).toLocaleString('fr-CD') : 'Jamais'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => openEdit(user)}
                          className="px-2 h-8 rounded-lg flex items-center justify-center text-white text-xs hover:brightness-110"
                          style={{ background: '#3b82f6' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => confirm(`Supprimer ${user.name} ?`) && onDelete(user.id)}
                          className="px-2 h-8 rounded-lg flex items-center justify-center text-white text-xs hover:brightness-110"
                          style={{ background: '#ef4444' }}
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="py-10 text-center text-gray-400 dark:text-gray-500">
                    Aucun {label} enregistre
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-[#0f1117] rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                {editingId ? `Modifier ${label}` : `Nouveau ${label}`}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#1f2937] hover:bg-gray-200 dark:hover:bg-[#374151] flex items-center justify-center text-gray-800 dark:text-gray-200" aria-label="Fermer">x</button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-4">
                <Field label="Nom complet *">
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={INPUT} placeholder="Prenom Nom" required />
                </Field>
                <Field label="Email *">
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={INPUT} placeholder="email@exemple.com" required />
                </Field>
                <Field label={editingId ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={INPUT} placeholder="Min. 8 caracteres" />
                </Field>
                {isCaisse && (
                  <Field label="Numero de caisse">
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
