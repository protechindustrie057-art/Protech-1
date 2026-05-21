// lib/sync.ts
import { db, PendingOperation } from './db'
import { apiCall } from '@/lib/api'

export async function enqueuePendingOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'synced'>) {
  await db.pendingOps.add({
    ...operation,
    timestamp: Date.now(),
    synced: 0,
  })

  if (typeof window !== 'undefined' && navigator.onLine) {
    void synchronize()
  }
}

export async function getPendingCount(): Promise<number> {
  return db.pendingOps.where('synced').equals(0).count()
}

export function initSync() {
  if (typeof window === 'undefined') return

  window.addEventListener('online', () => {
    console.log('🌐 Connexion rétablie, synchronisation...')
    void synchronize()
  })

  if (navigator.onLine) {
    void synchronize()
  }
}

// Synchroniser toutes les opérations en attente
export async function synchronize(): Promise<{ synced: number; failed: number }> {
  if (!navigator.onLine) {
    console.log('📴 Hors ligne, synchronisation impossible')
    return { synced: 0, failed: 0 }
  }

  const pendingOps = await db.pendingOps.where('synced').equals(0).toArray()
  
  if (pendingOps.length === 0) {
    console.log('✅ Rien à synchroniser')
    return { synced: 0, failed: 0 }
  }

  console.log(`🔄 Synchronisation de ${pendingOps.length} opérations...`)

  let synced = 0
  let failed = 0

  for (const op of pendingOps) {
    try {
      let result
      switch (op.type) {
        case 'sale':
          result = await apiCall('sales', op.data, 'POST')
          break
        case 'product':
          if (op.action === 'add') {
            result = await apiCall('products', op.data, 'POST')
          } else if (op.action === 'update') {
            result = await apiCall(`products?id=${op.data.id}`, op.data, 'PUT')
          } else if (op.action === 'delete') {
            result = await apiCall(`products?id=${op.data.id}`, undefined, 'DELETE')
          }
          break
        case 'invoice':
          result = await apiCall('invoices', op.data, 'POST')
          break
        case 'user':
          if (op.action === 'add') {
            result = await apiCall('users', op.data, 'POST')
          } else if (op.action === 'update') {
            result = await apiCall(`users?id=${op.data.id}`, op.data, 'PUT')
          } else if (op.action === 'delete') {
            result = await apiCall(`users?id=${op.data.id}`, undefined, 'DELETE')
          }
          break
        case 'settings':
          if (op.action === 'update') {
            result = await apiCall('settings', op.data, 'PUT')
          }
          break
      }

      if (result?.success ?? true) {
        await db.pendingOps.update(op.id!, { synced: 1 })
        synced += 1
        console.log(`✅ Opération ${op.id} synchronisée`)
      } else {
        failed += 1
        console.warn(`⚠️ Opération ${op.id} non synchronisée :`, result)
      }
    } catch (error) {
      console.error(`❌ Échec synchronisation opération ${op.id}:`, error)
      failed += 1
    }
  }

  console.log('🎉 Synchronisation terminée')
  return { synced, failed }
}