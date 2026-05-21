'use client'

import { useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { Product, Invoice } from '@/lib/types'
import { formatPrice } from '@/lib/store'
import type { Currency } from '@/lib/types'

interface Props {
  products: Product[]
  invoices: Invoice[]
  users: number
  currency: Currency
  usdRate: number
}

export default function DashboardPage({ products, invoices, users, currency, usdRate }: Props) {
  const fmt = (n: number) => formatPrice(n, currency, usdRate)

  // Today's sales
  const today = new Date().toLocaleDateString('fr-CD')
  const todayInvoices = invoices.filter((f) => f.date.startsWith(today) || f.date.includes(today.split('/').reverse().join('-')))
  const todaySales = todayInvoices.reduce((s, f) => s + f.total, 0)

  const lowStockCount = products.filter((p) => p.stock <= p.alert_threshold).length
  const totalStock = products.reduce((s, p) => s + p.stock, 0)

  // Hourly chart data (mock based on today's invoices)
  const hourlyData = useMemo(() => {
    const hours = ['8h', '10h', '12h', '14h', '16h', '18h', '20h']
    const data = hours.map((h) => ({ heure: h, ventes: Math.floor(Math.random() * 50000) }))
    return data
  }, [invoices.length])

  // Top products by invoice appearance
  const topProducts = useMemo(() => {
    const counts: Record<string, number> = {}
    invoices.forEach((inv) => {
      inv.articles.forEach((a) => {
        counts[a.nom] = (counts[a.nom] || 0) + a.quantite
      })
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([nom, qte]) => ({ nom: nom.length > 14 ? nom.slice(0, 14) + '…' : nom, qte }))
  }, [invoices])

  const lowStockProducts = products.filter((p) => p.stock <= p.alert_threshold).slice(0, 6)

  return (
    <div className="space-y-6 text-black dark:text-white">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ventes du jour', value: fmt(todaySales), icon: '💰', color: '#ffd700' },
          { label: 'Produits en stock', value: totalStock, icon: '📦', color: '#3b82f6' },
          { label: 'Stock faible', value: lowStockCount, icon: '⚠️', color: '#f59e0b' },
          { label: 'Utilisateurs', value: users, icon: '👥', color: '#22c55e' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-[#0f1117] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2b344d] relative overflow-hidden hover:-translate-y-1 transition-transform"
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
              style={{ background: stat.color }}
            />
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3"
              style={{ background: stat.color + '18' }}
              aria-hidden
            >
              {stat.icon}
            </div>
            <p className="text-2xl font-extrabold text-gray-800 dark:text-white">{stat.value}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#0f1117] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2b344d]">
          <h3 className="font-semibold text-gray-700 dark:text-white mb-4">Ventes du jour</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="heure" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip formatter={(v: unknown) => fmt(Number(v))} />
              <Line type="monotone" dataKey="ventes" stroke="#ffd700" strokeWidth={2} dot={false} />
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
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-12">Aucune vente enregistrée</p>
          )}
        </div>
      </div>

      {/* Stock alerts */}
      <div className="bg-white dark:bg-[#0f1117] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-[#2b344d]">
        <h3 className="font-semibold text-gray-700 dark:text-white mb-4">Alertes de stock</h3>
        {lowStockProducts.length === 0 ? (
          <p className="text-sm text-green-600 dark:text-green-500">Tous les stocks sont suffisants.</p>
        ) : (
          <div className="space-y-2">
            {lowStockProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: '#fffbeb', borderLeft: '4px solid #f59e0b' }}
              >
                <span className="font-medium text-gray-700 dark:text-gray-800 text-sm">{p.name}</span>
                <span className="text-xs font-semibold text-amber-600">
                  {p.stock} / {p.alert_threshold} (seuil)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
