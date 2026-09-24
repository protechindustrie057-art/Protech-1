"use client"

import { useEffect, useState } from 'react'
import type { Invoice, Currency, ClientOrder, ClientServiceRequest } from '@/lib/types'
import {
  formatPrice,
  loadClientOrdersFromLS,
  saveClientOrdersToLS,
  loadServiceRequestsFromLS,
  saveServiceRequestsToLS,
} from '@/lib/store'
import Link from 'next/link'

interface Props {
  invoices: Invoice[]
  currency: Currency
  usdRate: number
}

export default function OrdersPage({ invoices, currency, usdRate }: Props) {
  const fmt = (n: number) => formatPrice(n, currency, usdRate)
  const [clientOrders, setClientOrders] = useState<ClientOrder[]>([])
  const [serviceRequests, setServiceRequests] = useState<ClientServiceRequest[]>([])

  useEffect(() => {
    const readOrders = () => {
      setClientOrders(loadClientOrdersFromLS())
      setServiceRequests(loadServiceRequestsFromLS())
    }

    readOrders()
    const onStorage = () => readOrders()
    const onOrdersUpdated = () => readOrders()
    const onServiceRequestsUpdated = () => readOrders()
    window.addEventListener('storage', onStorage)
    window.addEventListener('protech-orders-updated', onOrdersUpdated as EventListener)
    window.addEventListener('protech-service-requests-updated', onServiceRequestsUpdated as EventListener)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('protech-orders-updated', onOrdersUpdated as EventListener)
      window.removeEventListener('protech-service-requests-updated', onServiceRequestsUpdated as EventListener)
    }
  }, [])

  const pending = invoices.filter((i) => i.status === 'pending')
  const executed = invoices.filter((i) => i.status === 'executed' || !i.status)

  const updateClientOrderStatus = (orderId: string, nextStatus: 'pending' | 'executed') => {
    const current = loadClientOrdersFromLS()
    const updated = current.map((order) => (
      String(order.id || order.createdAt) === String(orderId) ? { ...order, status: nextStatus } : order
    ))
    saveClientOrdersToLS(updated)
    setClientOrders(updated)
    window.dispatchEvent(new CustomEvent('protech-orders-updated', { detail: updated }))
  }

  const updateServiceRequestStatus = (requestId: string, nextStatus: 'pending' | 'executed') => {
    const current = loadServiceRequestsFromLS()
    const updated = current.map((request) => (
      String(request.id) === String(requestId) ? { ...request, status: nextStatus } : request
    ))
    saveServiceRequestsToLS(updated)
    setServiceRequests(updated)
    window.dispatchEvent(new CustomEvent('protech-service-requests-updated', { detail: updated }))
  }

  const extractComment = (invoice: any) => {
    const raw = (
      invoice?.comment ||
      invoice?.comments ||
      invoice?.commentaire ||
      invoice?.clientComment ||
      invoice?.client_comment ||
      invoice?.client_note ||
      invoice?.notes ||
      invoice?.observation ||
      invoice?.observations ||
      ''
    )

    return typeof raw === 'string' ? raw.trim() : ''
  }

  const clientComments = [...pending, ...executed]
    .map((invoice, index) => {
      const comment = extractComment(invoice)
      if (!comment) return null

      return {
        id: String(invoice._id || invoice.id || index),
        client: invoice.client || 'Client',
        numero: invoice.numero || `#${invoice.id || index + 1}`,
        comment,
      }
    })
    .filter(Boolean) as { id: string; client: string; numero: string; comment: string }[]

  return (
    <div className="space-y-4 text-black dark:text-white">
      <h2 className="text-xl font-bold font-serif text-gray-800 dark:text-white mb-2">Commandes</h2>

      <div className="mb-4 flex gap-3">
        <Link
          href="/"
          className="px-3 py-2 bg-sky-500 text-white rounded hover:bg-sky-600"
        >
          Retour au tableau de bord
        </Link>
        <Link href="/factures" className="px-3 py-2 bg-gray-100 dark:bg-[#111827] rounded">Voir factures</Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#0f1117] rounded-2xl p-4 border border-gray-100 dark:border-[#2b344d] shadow-sm">
          <h3 className="font-semibold mb-3">En attente ({pending.length})</h3>
          {pending.length === 0 ? <p className="text-sm text-gray-400">Aucune commande en attente</p> : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {pending.map((inv, idx) => (
                <div key={String(inv._id || inv.id || idx)} className="p-3 rounded border border-gray-100 dark:border-[#2b344d] bg-gray-50 dark:bg-[#141c2e]">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{inv.numero || `#${inv.id}`}</div>
                      <div className="text-xs text-gray-400 truncate">Client: {inv.client || 'N/A'}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-green-600">{fmt(Number(inv.total || 0))}</div>
                      <div className="text-xs text-gray-400">{inv.date ? new Date(inv.date).toLocaleString() : 'Date non fournie'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#0f1117] rounded-2xl p-4 border border-gray-100 dark:border-[#2b344d] shadow-sm">
          <h3 className="font-semibold mb-3">Executées ({executed.length})</h3>
          {executed.length === 0 ? <p className="text-sm text-gray-400">Aucune commande executee</p> : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {executed.map((inv, idx) => (
                <div key={String(inv._id || inv.id || idx)} className="p-3 rounded border border-gray-100 dark:border-[#2b344d] bg-gray-50 dark:bg-[#141c2e]">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{inv.numero || `#${inv.id}`}</div>
                      <div className="text-xs text-gray-400 truncate">Client: {inv.client || 'N/A'}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-green-600">{fmt(Number(inv.total || 0))}</div>
                      <div className="text-xs text-gray-400">{inv.date ? new Date(inv.date).toLocaleString() : 'Date non fournie'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f1117] rounded-2xl p-4 border border-gray-100 dark:border-[#2b344d] shadow-sm">
        <h3 className="font-semibold mb-3">Demandes de service</h3>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-sm text-amber-700 dark:text-amber-400">Demandes en cours</h4>
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {serviceRequests.filter((request) => request.status === 'pending' || !request.status).length}
              </span>
            </div>

            {serviceRequests.filter((request) => request.status === 'pending' || !request.status).length === 0 ? (
              <p className="text-sm text-gray-400">Aucune demande de service en cours.</p>
            ) : (
              <div className="space-y-3 max-h-[240px] overflow-y-auto">
                {serviceRequests.filter((request) => request.status === 'pending' || !request.status).map((request) => (
                  <div key={request.id} className="rounded-xl border border-amber-200 bg-white dark:border-amber-800 dark:bg-[#141c2e] p-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-sm">{request.name}</p>
                        <p className="text-[11px] text-gray-500">{request.phone} • {request.email}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full bg-amber-500 text-[10px] font-bold text-white uppercase">{request.type}</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                      <p><span className="font-semibold">Machine:</span> {request.machineType || 'Non précisé'}</p>
                      <p><span className="font-semibold">Type:</span> {request.printType || 'Non précisé'}</p>
                      {request.availabilityDate && <p><span className="font-semibold">Disponibilité:</span> {request.availabilityDate}</p>}
                      {request.message && <p><span className="font-semibold">Message:</span> {request.message}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => updateServiceRequestStatus(request.id, 'executed')}
                      className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      Valider comme exécutée
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-sm text-emerald-700 dark:text-emerald-400">Demandes exécutées</h4>
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {serviceRequests.filter((request) => request.status === 'executed').length}
              </span>
            </div>

            {serviceRequests.filter((request) => request.status === 'executed').length === 0 ? (
              <p className="text-sm text-gray-400">Aucune demande exécutée.</p>
            ) : (
              <div className="space-y-3 max-h-[240px] overflow-y-auto">
                {serviceRequests.filter((request) => request.status === 'executed').map((request) => (
                  <div key={request.id} className="rounded-xl border border-emerald-200 bg-white dark:border-emerald-800 dark:bg-[#141c2e] p-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-sm">{request.name}</p>
                        <p className="text-[11px] text-gray-500">{request.phone} • {request.email}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full bg-emerald-600 text-[10px] font-bold text-white uppercase">Exécutée</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                      <p><span className="font-semibold">Type:</span> {request.type}</p>
                      <p><span className="font-semibold">Machine:</span> {request.machineType || 'Non précisé'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateServiceRequestStatus(request.id, 'pending')}
                      className="mt-3 w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-[#1d2438] dark:text-slate-200"
                    >
                      Repasser en cours
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <h3 className="font-semibold mb-3">Commandes clients</h3>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-sm text-amber-700 dark:text-amber-400">En cours</h4>
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {clientOrders.filter((order: any) => order.status === 'pending' || !order.status).length}
              </span>
            </div>

            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {clientOrders.filter((order: any) => order.status === 'pending' || !order.status).length === 0 ? (
                <p className="text-sm text-gray-400">Aucune commande en cours.</p>
              ) : (
                clientOrders.filter((order: any) => order.status === 'pending' || !order.status).map((order: any) => (
                  <div key={order.id} className="rounded-xl border border-amber-200 bg-white dark:border-amber-800 dark:bg-[#141c2e] p-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-sm">{order.customerName}</p>
                        <p className="text-[11px] text-gray-500">{order.phone} • {order.email}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full bg-amber-500 text-[10px] font-bold text-white uppercase">
                        En cours
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                      <p><span className="font-semibold">Service:</span> {order.serviceType}</p>
                      <p><span className="font-semibold">Produit:</span> {order.productName}</p>
                      <p><span className="font-semibold">Machine:</span> {order.machineName}</p>
                      <p><span className="font-semibold">Quantité:</span> {order.quantity}</p>
                      {order.notes && <p><span className="font-semibold">Notes:</span> {order.notes}</p>}
                    </div>
                    {order.image && (
                      <img src={order.image} alt="Preuve de commande client" className="mt-2 w-full max-h-40 object-cover rounded-lg border border-red-200" />
                    )}
                    <button
                      type="button"
                      onClick={() => updateClientOrderStatus(String(order.id || order._id), 'executed')}
                      className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      Valider comme exécutée
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-sm text-emerald-700 dark:text-emerald-400">Exécutées</h4>
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {clientOrders.filter((order: any) => order.status === 'executed').length}
              </span>
            </div>

            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {clientOrders.filter((order: any) => order.status === 'executed').length === 0 ? (
                <p className="text-sm text-gray-400">Aucune commande exécutée.</p>
              ) : (
                clientOrders.filter((order: any) => order.status === 'executed').map((order: any) => (
                  <div key={order.id} className="rounded-xl border border-emerald-200 bg-white dark:border-emerald-800 dark:bg-[#141c2e] p-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-sm">{order.customerName}</p>
                        <p className="text-[11px] text-gray-500">{order.phone} • {order.email}</p>
                      </div>
                      <span className="px-2 py-1 rounded-full bg-emerald-600 text-[10px] font-bold text-white uppercase">
                        Exécutée
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                      <p><span className="font-semibold">Service:</span> {order.serviceType}</p>
                      <p><span className="font-semibold">Produit:</span> {order.productName}</p>
                      <p><span className="font-semibold">Machine:</span> {order.machineName}</p>
                      <p><span className="font-semibold">Quantité:</span> {order.quantity}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateClientOrderStatus(String(order.id || order._id), 'pending')}
                      className="mt-3 w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-[#1d2438] dark:text-slate-200"
                    >
                      Repasser en cours
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f1117] rounded-2xl p-4 border border-gray-100 dark:border-[#2b344d] shadow-sm">
        <h3 className="font-semibold mb-3">Commentaires clients</h3>
        {clientComments.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun commentaire client pour le moment.</p>
        ) : (
          <div className="space-y-2 max-h-[220px] overflow-y-auto">
            {clientComments.map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-100 dark:border-[#2b344d] bg-gray-50 dark:bg-[#141c2e] p-3">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-sm font-semibold truncate">{item.client}</span>
                  <span className="text-[11px] text-gray-400">{item.numero}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{item.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
