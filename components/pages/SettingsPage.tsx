'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { AppSettings } from '@/lib/types'
import { getAdminAccount, updateAdminAccount } from '@/lib/store'

interface Props {
  settings: AppSettings
  onSave: (s: AppSettings) => void
  onLogoChange: (logo: string) => void
}

export default function SettingsPage({ settings, onSave, onLogoChange }: Props) {
  const [form, setForm] = useState<AppSettings>({ ...settings, taxRate: Number(settings.taxRate || 0) })
  const [adminAccount, setAdminAccount] = useState({ name: '', email: '', current: '', next: '', confirm: '' })
  const [visiblePasswords, setVisiblePasswords] = useState({ current: false, next: false, confirm: false })
  const [accountMsg, setAccountMsg] = useState('')
  const [saved, setSaved] = useState(false)
  const totalPrintingPrice = (form.printing?.pagesNumber ?? 0) * (form.printing?.unitPrice ?? 0)

  useEffect(() => {
    let mounted = true
    getAdminAccount().then((account) => {
      if (mounted && account?.email) {
        setAdminAccount((current) => ({ ...current, email: account.email, name: account.name || 'Administrateur' }))
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    onSave(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo trop grand (max 2 Mo)')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string
        setForm((current) => ({ ...current, companyLogo: dataUrl }))
        onLogoChange(dataUrl)
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleAdminAccountUpdate(e: React.FormEvent) {
    e.preventDefault()
    const name = adminAccount.name.trim()
    const email = adminAccount.email.trim().toLowerCase()
    const wantsPasswordChange = Boolean(adminAccount.next || adminAccount.confirm)

    if (!name) {
      setAccountMsg('Nom administrateur requis')
      return
    }
    if (!email) {
      setAccountMsg('Email administrateur requis')
      return
    }
    if (!adminAccount.current) {
      setAccountMsg('Mot de passe actuel requis')
      return
    }
    if (wantsPasswordChange && adminAccount.next !== adminAccount.confirm) {
      setAccountMsg('Les mots de passe ne correspondent pas')
      return
    }
    if (wantsPasswordChange && adminAccount.next.length < 8) {
      setAccountMsg('Minimum 8 caracteres')
      return
    }

    let result: { email: string; name: string } | null = null
    try {
      result = await updateAdminAccount({
        name,
        email,
        currentPassword: adminAccount.current,
        newPassword: wantsPasswordChange ? adminAccount.next : undefined,
      })
    } catch (error: any) {
      setAccountMsg(error?.message || 'Modification impossible')
      return
    }

    if (!result) {
      setAccountMsg('Mot de passe actuel incorrect ou modification impossible')
      return
    }

    setAccountMsg('Compte administrateur mis a jour avec succes')
    setAdminAccount({ name: result.name || name, email: result.email, current: '', next: '', confirm: '' })
  }

  function handleResetAdminPasswordFields() {
    setAdminAccount((current) => ({ ...current, current: '', next: '', confirm: '' }))
    setVisiblePasswords({ current: false, next: false, confirm: false })
    setAccountMsg('')
  }

  function togglePasswordVisibility(field: keyof typeof visiblePasswords) {
    setVisiblePasswords((current) => ({ ...current, [field]: !current[field] }))
  }

  return (
    <div className="h-full max-h-[calc(100vh-120px)] overflow-y-auto pr-1 pb-4 text-black dark:text-white">
      <h2 className="text-xl font-bold font-serif text-gray-800 dark:text-white mb-5">Parametres</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SettingsCard title="Informations legales" icon="ID">
          <form onSubmit={handleSave} className="space-y-4">
            {[
              { id: 'rccm', label: 'RCCM', key: 'rccm' as const },
              { id: 'nif', label: 'NIF', key: 'nif' as const },
              { id: 'idNat', label: 'ID National', key: 'idNat' as const },
              { id: 'phone', label: 'Telephone', key: 'phone' as const },
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
              {saved ? 'Sauvegarde' : 'Enregistrer'}
            </button>
          </form>
        </SettingsCard>

        <SettingsCard title="Impression" icon="Print">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Nombre de pages</label>
              <input
                type="number"
                value={form.printing?.pagesNumber ?? 1}
                onChange={(e) => setForm({ ...form, printing: { ...(form.printing || {}), pagesNumber: Math.max(0, parseInt(e.target.value) || 0) } })}
                className={INPUT}
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Prix unitaire (FC)</label>
              <input
                type="number"
                value={form.printing?.unitPrice ?? 0}
                onChange={(e) => setForm({ ...form, printing: { ...(form.printing || {}), unitPrice: Math.max(0, parseFloat(e.target.value) || 0) } })}
                className={INPUT}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Type d'impression</label>
              <select
                value={form.printing?.printType ?? 'A4'}
                onChange={(e) => setForm({ ...form, printing: { ...(form.printing || {}), printType: e.target.value as any } })}
                className={INPUT}
              >
                <option value="A4">Papier A4</option>
                <option value="A3">Papier A3</option>
                <option value="bache">Bâche</option>
                <option value="tshirt">T-shirt</option>
                <option value="vinyl">Vinyl</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Prix total (calculé)</label>
              <input
                type="number"
                value={Number(totalPrintingPrice.toFixed(2))}
                readOnly
                className={INPUT}
              />
            </div>
            <button type="submit" className={BTN_GREEN}>Enregistrer</button>
          </form>
        </SettingsCard>

        <SettingsCard title="Devises" icon="$">
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
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">TVA (%)</label>
              <input
                type="number"
                value={form.taxRate ?? 0}
                onChange={(e) => setForm({ ...form, taxRate: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
                className={INPUT}
                min="0"
                max="100"
                step="0.01"
                placeholder="0"
              />
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                Ce taux sera affiche et calcule sur les tickets et factures.
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Devise par defaut</label>
              <select
                value={form.defaultCurrency}
                onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value as 'CDF' | 'USD' })}
                className={INPUT}
              >
                <option value="CDF">CDF - Franc Congolais</option>
                <option value="USD">USD - Dollar Americain</option>
              </select>
            </div>
            <button onClick={handleSave} className={BTN_GREEN}>Enregistrer</button>
          </div>
        </SettingsCard>

        <SettingsCard title="Apparence & Logo" icon="Logo">
          <div className="text-center">
            <label
              htmlFor="logoInput"
              className="w-32 h-32 mx-auto rounded-2xl flex items-center justify-center text-gray-300 dark:text-gray-600 cursor-pointer hover:border-yellow-400 transition-all overflow-hidden border-2 border-dashed border-gray-200 dark:border-[#2b344d] bg-white dark:bg-[#1e2436]"
              aria-label="Choisir un logo"
            >
              {form.companyLogo ? (
                <img src={form.companyLogo} alt="Logo entreprise" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold">Logo</span>
              )}
            </label>
            <input id="logoInput" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Cliquer pour choisir un logo (max 2 Mo)</p>
          </div>
        </SettingsCard>

        <SettingsCard title="Compte administrateur" icon="Admin">
          <form onSubmit={handleAdminAccountUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Nom complet administrateur</label>
              <input
                value={adminAccount.name}
                onChange={(e) => setAdminAccount({ ...adminAccount, name: e.target.value })}
                className={INPUT}
                placeholder="Nom complet"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Email administrateur</label>
              <input
                type="email"
                value={adminAccount.email}
                onChange={(e) => setAdminAccount({ ...adminAccount, email: e.target.value })}
                className={INPUT}
                placeholder="admin@protechtouch.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Mot de passe actuel</label>
              <PasswordInput
                value={adminAccount.current}
                visible={visiblePasswords.current}
                onChange={(value) => setAdminAccount({ ...adminAccount, current: value })}
                onToggle={() => togglePasswordVisibility('current')}
                placeholder="Mot de passe actuel"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Nouveau mot de passe (optionnel)</label>
              <PasswordInput
                value={adminAccount.next}
                visible={visiblePasswords.next}
                onChange={(value) => setAdminAccount({ ...adminAccount, next: value })}
                onToggle={() => togglePasswordVisibility('next')}
                placeholder="Laisser vide pour garder le meme"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Confirmer le nouveau mot de passe</label>
              <PasswordInput
                value={adminAccount.confirm}
                visible={visiblePasswords.confirm}
                onChange={(value) => setAdminAccount({ ...adminAccount, confirm: value })}
                onToggle={() => togglePasswordVisibility('confirm')}
                placeholder="Confirmation"
              />
            </div>
            {accountMsg && (
              <p className={`text-xs ${accountMsg.includes('succes') ? 'text-green-600' : 'text-red-500'}`}>{accountMsg}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button type="submit" className={BTN_BLUE}>Enregistrer le compte</button>
              <button type="button" onClick={handleResetAdminPasswordFields} className={BTN_GRAY}>
                Reinitialiser
              </button>
            </div>
          </form>
        </SettingsCard>

        <SettingsCard title="Sauvegarde automatique" icon="Save">
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
            <button onClick={() => alert('Sauvegarde locale effectuee.')} className={BTN_GREEN}>
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

function PasswordInput({
  value,
  visible,
  onChange,
  onToggle,
  placeholder,
}: {
  value: string
  visible: boolean
  onChange: (value: string) => void
  onToggle: () => void
  placeholder: string
}) {
  const Icon = visible ? EyeOff : Eye

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} pr-11`}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-[#2a3448]"
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        title={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      >
        <Icon size={17} />
      </button>
    </div>
  )
}

const INPUT = 'w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-yellow-400 focus:outline-none text-sm bg-white dark:bg-[#1e2436] dark:border-[#2a3448] dark:text-gray-100'
const BTN_GREEN = 'w-full py-2.5 rounded-xl font-bold text-white text-sm hover:brightness-110 transition-all bg-green-500'
const BTN_BLUE = 'w-full py-2.5 rounded-xl font-bold text-white text-sm hover:brightness-110 transition-all bg-blue-500'
const BTN_GRAY = 'w-full py-2.5 rounded-xl font-bold text-sm hover:brightness-105 transition-all bg-gray-100 text-gray-700 border border-gray-200 dark:bg-[#1e2436] dark:text-gray-100 dark:border-[#2a3448]'
