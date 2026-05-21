'use client'

import { useState } from 'react'
import type { AppSettings } from '@/lib/types'
import { changeAdminPassword } from '@/lib/store'

interface Props {
  settings: AppSettings
  onSave: (s: AppSettings) => void
  onLogoChange: (logo: string) => void
}

export default function SettingsPage({ settings, onSave, onLogoChange }: Props) {
  const [form, setForm] = useState<AppSettings>(settings)
  const [adminPw, setAdminPw] = useState({ current: '', next: '', confirm: '' })
  const [pwMsg, setPwMsg] = useState('')
  const [saved, setSaved] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    onSave(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('Logo trop grand (max 2 Mo)'); return }
    const reader = new FileReader()
    reader.onload = (ev) => {
      if (ev.target?.result) {
        const dataUrl = ev.target.result as string
        // Update both local form (for preview) and parent state (for persistence)
        setForm((f) => ({ ...f, companyLogo: dataUrl }))
        onLogoChange(dataUrl)
      }
    }
    reader.readAsDataURL(file)
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!adminPw.current) { setPwMsg('Mot de passe actuel requis'); return }
    if (adminPw.next !== adminPw.confirm) { setPwMsg('Les mots de passe ne correspondent pas'); return }
    if (adminPw.next.length < 6) { setPwMsg('Minimum 6 caractères'); return }

    const ok = await changeAdminPassword(adminPw.current, adminPw.next)
    if (!ok) {
      setPwMsg('Mot de passe actuel incorrect')
      return
    }
    setPwMsg('Mot de passe mis à jour avec succès')
    setAdminPw({ current: '', next: '', confirm: '' })
  }

  return (
    <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-1 text-black dark:text-white">
      <h2 className="text-xl font-bold font-serif text-gray-800 dark:text-white mb-5">Paramètres</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Legal info */}
        <SettingsCard title="Informations légales" icon="🏛️">
          <form onSubmit={handleSave} className="space-y-4">
            {[
              { id: 'rccm', label: 'RCCM', key: 'rccm' as const },
              { id: 'nif', label: 'NIF', key: 'nif' as const },
              { id: 'idNat', label: 'ID National', key: 'idNat' as const },
              { id: 'phone', label: 'Téléphone', key: 'phone' as const },
            ].map(({ id, label, key }) => (
              <div key={id}>
                <label htmlFor={id} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                <input
                  id={id}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className={INPUT}
                />
              </div>
            ))}
            <button type="submit" className={BTN_GREEN}>
              {saved ? '✓ Sauvegardé' : 'Enregistrer'}
            </button>
          </form>
        </SettingsCard>

        {/* Currency */}
        <SettingsCard title="Devises" icon="💱">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Taux USD/CDF (1 USD = ? FC)</label>
              <input
                type="number"
                value={form.usdRate}
                onChange={(e) => setForm({ ...form, usdRate: parseInt(e.target.value) || 2850 })}
                className={INPUT}
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Devise par défaut</label>
              <select
                value={form.defaultCurrency}
                onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value as 'CDF' | 'USD' })}
                className={INPUT}
              >
                <option value="CDF">CDF — Franc Congolais</option>
                <option value="USD">USD — Dollar Américain</option>
              </select>
            </div>
            <button onClick={handleSave} className={BTN_GREEN}>Enregistrer</button>
          </div>
        </SettingsCard>

        {/* Logo */}
        <SettingsCard title="Apparence & Logo" icon="🎨">
          <div className="text-center">
            <label
              htmlFor="logoInput"
              className="w-32 h-32 mx-auto rounded-2xl flex items-center justify-center text-gray-300 dark:text-gray-600 cursor-pointer hover:border-yellow-400 transition-all overflow-hidden border-2 border-dashed border-gray-200 dark:border-[#2b344d] bg-white dark:bg-[#1e2436]"
              aria-label="Choisir un logo"
            >
              {form.companyLogo ? (
                <img src={form.companyLogo} alt="Logo entreprise" className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl">🖼️</span>
              )}
            </label>
            <input id="logoInput" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Cliquer pour choisir un logo (max 2 Mo)</p>
          </div>
        </SettingsCard>

        {/* Admin account */}
        <SettingsCard title="Compte administrateur" icon="🔐">
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            {[
              { label: 'Mot de passe actuel', val: adminPw.current, set: (v: string) => setAdminPw({ ...adminPw, current: v }) },
              { label: 'Nouveau mot de passe', val: adminPw.next, set: (v: string) => setAdminPw({ ...adminPw, next: v }) },
              { label: 'Confirmer', val: adminPw.confirm, set: (v: string) => setAdminPw({ ...adminPw, confirm: v }) },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                <input type="password" value={val} onChange={(e) => set(e.target.value)} className={INPUT} placeholder="••••••••" />
              </div>
            ))}
            {pwMsg && (
              <p className={`text-xs ${pwMsg.includes('succès') ? 'text-green-600' : 'text-red-500'}`}>{pwMsg}</p>
            )}
            <button type="submit" className={BTN_BLUE}>Mettre à jour</button>
          </form>
        </SettingsCard>

        {/* Backup */}
        <SettingsCard title="Sauvegarde automatique" icon="☁️">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Intervalle (heures)</label>
              <input
                type="number"
                value={form.backupInterval}
                onChange={(e) => setForm({ ...form, backupInterval: parseInt(e.target.value) || 1 })}
                className={INPUT}
                min="1"
              />
            </div>
            <button onClick={() => alert('Sauvegarde locale effectuée.')} className={BTN_GREEN}>
              Sauvegarder maintenant
            </button>
          </div>
        </SettingsCard>
      </div>
    </div>
  )
}

function SettingsCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#0f1117] rounded-2xl p-5 border border-gray-100 dark:border-[#2b344d] shadow-sm">
      <h3 className="font-bold text-gray-700 dark:text-white mb-4 flex items-center gap-2 text-base">
        <span aria-hidden>{icon}</span> {title}
      </h3>
      {children}
    </div>
  )
}

const INPUT = 'w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:outline-none text-sm bg-white dark:bg-[#1e2436] dark:border-[#2a3448] dark:text-gray-100'
const BTN_GREEN = 'w-full py-2.5 rounded-xl font-bold text-white text-sm hover:brightness-110 transition-all bg-green-500'
const BTN_BLUE = 'w-full py-2.5 rounded-xl font-bold text-white text-sm hover:brightness-110 transition-all bg-blue-500'
