'use client'

import { useEffect, useMemo, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { Product, Invoice, Currency, UserPresence } from '@/lib/types'
import { formatPrice, loadClientOrdersFromLS, loadServiceRequestsFromLS } from '@/lib/store'
import Link from 'next/link'

interface Props {
  products: Product[]
  invoices: Invoice[]
  users: number
  currency: Currency
  usdRate: number
  presences: UserPresence[]
}

export default function DashboardPage({ products, invoices, users, currency, usdRate, presences }: Props) {
  const fmt = (n: number) => formatPrice(n, currency, usdRate)
  const [clientOrderCount, setClientOrderCount] = useState(0)

  useEffect(() => {
    const readCount = () => {
      const orders = loadClientOrdersFromLS()
      const serviceRequests = loadServiceRequestsFromLS()
      setClientOrderCount(orders.length + serviceRequests.length)
    }

    readCount()
    const onStorage = () => readCount()
    const onOrdersUpdated = () => readCount()
    const onServiceRequestsUpdated = () => readCount()
    window.addEventListener('storage', onStorage)
    window.addEventListener('protech-orders-updated', onOrdersUpdated as EventListener)
    window.addEventListener('protech-service-requests-updated', onServiceRequestsUpdated as EventListener)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('protech-orders-updated', onOrdersUpdated as EventListener)
      window.removeEventListener('protech-service-requests-updated', onServiceRequestsUpdated as EventListener)
    }
  }, [])

  const today = new Date().toLocaleDateString('fr-CD')
  const todayIso = today.split('/').reverse().join('-')
  const todayInvoices = invoices.filter((invoice: any) => {
    const value = String(invoice.date || invoice.createdAt || '')
    return value.startsWith(today) || value.includes(todayIso)
  })
  const todaySales = todayInvoices.reduce((sum, invoice: any) => sum + Number(invoice.total || invoice.amount || 0), 0)

  const lowStockCount = products.filter((product) => product.stock <= product.alert_threshold).length
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0)

  const hourlyData = useMemo(() => {
    const hours = ['8h', '10h', '12h', '14h', '16h', '18h', '20h']
    return hours.map((heure) => ({ heure, ventes: Math.floor(Math.random() * 50000) }))
  }, [invoices.length])

  const topProducts = useMemo(() => {
    const counts: Record<string, number> = {}
    invoices.forEach((invoice: any) => {
      const articles = Array.isArray(invoice.articles)
        ? invoice.articles
        : Array.isArray(invoice.products)
          ? invoice.products
          : []

      articles.forEach((article: any) => {
        const name = article.nom || article.name || `Produit ${article.product_id || ''}`.trim()
        const quantity = Number(article.quantite || article.quantity || 0)
        counts[name] = (counts[name] || 0) + quantity
      })
    })

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([nom, qte]) => ({ nom: nom.length > 14 ? `${nom.slice(0, 14)}...` : nom, qte }))
  }, [invoices])

  const loyalClients = useMemo(() => {
    const clients: Record<string, { name: string; phone: string; purchases: number; total: number }> = {}

    invoices.forEach((invoice: any) => {
      const rawPhone = String(invoice.clientPhone || invoice.client_phone || invoice.customerPhone || '').trim()
      const normalizedPhone = rawPhone.replace(/[^\d]/g, '')
      if (!normalizedPhone) return

      const clientName = String(invoice.client || invoice.customer || 'Client non renseigne').trim()
      const total = Number(invoice.total || invoice.amount || 0)

      if (!clients[normalizedPhone]) {
        clients[normalizedPhone] = {
          name: clientName || 'Client non renseigne',
          phone: rawPhone,
          purchases: 0,
          total: 0,
        }
      }

      clients[normalizedPhone].purchases += 1
      clients[normalizedPhone].total += total
      if (clientName && clients[normalizedPhone].name === 'Client non renseigne') {
        clients[normalizedPhone].name = clientName
      }
    })

    return Object.values(clients)
      .filter((client) => client.purchases >= 100)
      .sort((a, b) => b.purchases - a.purchases)
      .slice(0, 6)
  }, [invoices])

  const lowStockProducts = products.filter((product) => product.stock <= product.alert_threshold).slice(0, 6)

  return (
    <div className="space-y-6 text-black dark:text-white">
      <div className="flex justify-end gap-3">
        <Link href="/orders" className="relative px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          Commande
          {clientOrderCount > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
              {clientOrderCount}
            </span>
          )}
        </Link>
        <Link href="/client" className="px-3 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600">
          Lien client
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Ventes du jour', value: fmt(todaySales), icon: '$', color: '#38bdf8' },
          { label: 'Produits en stock', value: totalStock, icon: 'Stock', color: '#3b82f6' },
          { label: 'Stock faible', value: lowStockCount, icon: 'Alerte', color: '#0ea5e9' },
          { label: 'Utilisateurs', value: users, icon: 'User', color: '#22c55e' },
          { label: 'Machines connectees', value: presences.length, icon: 'ON', color: '#10b981' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-[#0f1117] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2b344d] relative overflow-hidden hover:-translate-y-1 transition-transform"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: stat.color }} />
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold mb-3"
              style={{ background: `${stat.color}18`, color: stat.color }}
              aria-hidden
            >
              {stat.icon === 'User' ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              ) : (
                stat.icon
              )}
            </div>
            <p className="text-2xl font-extrabold text-gray-800 dark:text-white">{stat.value}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {stat.label === 'Utilisateurs' ? (
                <span className="inline-flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M20 21a8 8 0 0 0-16 0" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {stat.label}
                </span>
              ) : (
                stat.label
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#0f1117] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2b344d]">
          <h3 className="font-semibold text-gray-700 dark:text-white mb-4">Connexions actives</h3>
          {presences.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">Aucune caisse ou machine connectee</p>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {presences.map((presence) => (
                <div
                  key={`${presence.machineId}-${presence.userId}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-[#2b344d] px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.18)]" />
                      <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{presence.name}</p>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{presence.machineName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-green-600">Connecte</p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(presence.lastSeenAt).toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#0f1117] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2b344d]">
          <h3 className="font-semibold text-gray-700 dark:text-white mb-4">Ventes du jour</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="heure" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip formatter={(value: unknown) => fmt(Number(value))} />
              <Line type="monotone" dataKey="ventes" stroke="#38bdf8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-[#0f1117] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2b344d]">
          <h3 className="font-semibold text-gray-700 dark:text-white mb-4">Top produits vendus</h3>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="nom" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip />
                <Bar dataKey="qte" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-12">Aucune vente enregistree</p>
          )}
        </div>

        <div className="bg-white dark:bg-[#0f1117] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2b344d]">
          <h3 className="font-semibold text-gray-700 dark:text-white mb-4">Clients fideles</h3>
          {loyalClients.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">Aucun client n'a encore atteint 100 achats.</p>
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">Le suivi se fait avec le numero du client sur les factures et tickets.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {loyalClients.map((client) => (
                <div
                  key={client.phone}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-[#2b344d] px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{client.name}</p>
                    <p className="text-xs text-gray-400 truncate">{client.phone}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-sky-600">{client.purchases} achats</p>
                    <p className="text-[11px] text-gray-400">{fmt(client.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f1117] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2b344d]">
        <h3 className="font-semibold text-gray-700 dark:text-white mb-4">Alertes de stock</h3>
        {lowStockProducts.length === 0 ? (
          <p className="text-sm text-green-600 dark:text-green-500">Tous les stocks sont suffisants.</p>
        ) : (
          <div className="space-y-2">
            {lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: '#f0f9ff', borderLeft: '4px solid #38bdf8' }}
              >
                <span className="font-medium text-gray-700 dark:text-gray-800 text-sm">{product.name}</span>
                <span className="text-xs font-semibold text-sky-600">
                  {product.stock} / {product.alert_threshold} (seuil)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
