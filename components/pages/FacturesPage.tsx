'use client'

import Link from 'next/link'
import type { Invoice, Currency, InvoiceArticle } from '@/lib/types'
import { formatPrice } from '@/lib/store'

interface Props {
  invoices: Invoice[]
  currency: Currency
  usdRate: number
}

function getInvoiceArticles(invoice: Partial<Invoice> & { products?: Array<Record<string, unknown>> }): InvoiceArticle[] {
  const rawArticles = Array.isArray(invoice.articles)
    ? invoice.articles
    : Array.isArray(invoice.products)
      ? invoice.products
      : []

  return rawArticles.map((article: any) => {
    const productName = article?.nom ?? article?.name ?? (article?.product_id ? `Produit ${article.product_id}` : 'Produit')
    const unitPrice = Number(article?.prix ?? article?.price ?? 0)
    const quantity = Number(article?.quantite ?? article?.quantity ?? 0)

    return {
      nom: String(productName),
      prix: unitPrice,
      quantite: quantity,
      total: Number(article?.total ?? unitPrice * quantity),
    }
  })
}

export default function FacturesPage({ invoices, currency, usdRate }: Props) {
  const fmt = (n: number) => formatPrice(n, currency, usdRate)

  return (
    <div className="text-black dark:text-white">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold font-serif text-gray-800 dark:text-white">Historique des factures</h2>
        <Link href="/" className="rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-600">
          Retour au tableau de bord
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white dark:bg-[#0f1117] rounded-2xl p-12 text-center text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-[#2b344d] shadow-sm">
          <p className="text-4xl mb-3">Factures</p>
          <p>Aucune facture enregistree</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-260px)] overflow-y-auto pr-1">
          {invoices.map((invoice: any, index) => {
            const articles = getInvoiceArticles(invoice)
            const numero = invoice.numero || invoice.invoice_number || `INV-${invoice.id || index + 1}`
            const date = invoice.date || invoice.createdAt || ''
            const client = invoice.client || invoice.customer || 'Client non renseigne'
            const clientPhone = invoice.clientPhone || invoice.client_phone || invoice.customerPhone || ''
            const caissier = invoice.caissier || invoice.cashier || 'Caissier non renseigne'
            const total = Number(invoice.total || invoice.amount || 0)
            const remise = Number(invoice.remise || 0)

            return (
              <div key={String(invoice._id || invoice.id || index)} className="bg-white dark:bg-[#0f1117] rounded-2xl p-4 border border-gray-100 dark:border-[#2b344d] shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-xs text-gray-400">{numero}</span>
                      <span className="text-xs text-gray-300">-</span>
                      <span className="text-xs text-gray-400">{date ? new Date(date).toString() === 'Invalid Date' ? String(date) : new Date(date).toLocaleString('fr-CD') : 'Date non renseignee'}</span>
                    </div>
                    <p className="font-semibold text-gray-800 dark:text-white text-sm">{client}</p>
                    {clientPhone && <p className="text-xs text-gray-400 dark:text-gray-500">Numero : {clientPhone}</p>}
                    <p className="text-xs text-gray-400 dark:text-gray-500">{caissier}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {articles.slice(0, 4).map((article, articleIndex) => (
                        <span key={articleIndex} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-[#111827] rounded-full text-gray-600 dark:text-gray-300">
                          {article.nom} x{article.quantite}
                        </span>
                      ))}
                      {articles.length === 0 && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-[#111827] rounded-full text-gray-400 dark:text-gray-400">
                          Aucun article detaille
                        </span>
                      )}
                      {articles.length > 4 && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-[#111827] rounded-full text-gray-400 dark:text-gray-400">+{articles.length - 4}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-extrabold text-lg" style={{ color: '#22c55e' }}>{fmt(total)}</p>
                    {remise > 0 && (
                      <p className="text-xs text-red-400">Remise: {remise}%</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
