'use client'

import type { Invoice, Currency } from '@/lib/types'
import { formatPrice } from '@/lib/store'

interface Props {
  invoices: Invoice[]
  currency: Currency
  usdRate: number
}

export default function FacturesPage({ invoices, currency, usdRate }: Props) {
  const fmt = (n: number) => formatPrice(n, currency, usdRate)

  return (
    <div className="text-black dark:text-white">
      <h2 className="text-xl font-bold font-serif text-gray-800 dark:text-white mb-5">Historique des factures</h2>

      {invoices.length === 0 ? (
        <div className="bg-white dark:bg-[#0f1117] rounded-2xl p-12 text-center text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-[#2b344d] shadow-sm">
          <p className="text-4xl mb-3">📑</p>
          <p>Aucune facture enregistrée</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
          {invoices.map((f) => (
            <div key={f.id} className="bg-white dark:bg-[#0f1117] rounded-2xl p-4 border border-gray-100 dark:border-[#2b344d] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-xs text-gray-400">{f.numero}</span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-400">{f.date}</span>
                  </div>
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">{f.client}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{f.caissier}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {f.articles.slice(0, 4).map((a, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-[#111827] rounded-full text-gray-600 dark:text-gray-300">
                        {a.nom} ×{a.quantite}
                      </span>
                    ))}
                    {f.articles.length > 4 && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-[#111827] rounded-full text-gray-400 dark:text-gray-400">+{f.articles.length - 4}</span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-extrabold text-lg" style={{ color: '#22c55e' }}>{fmt(f.total)}</p>
                  {f.remise > 0 && (
                    <p className="text-xs text-red-400">Remise: {f.remise}%</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
