// lib/db.ts
import Dexie, { Table } from 'dexie'

export interface PendingOperation {
  id?: number
  type: 'sale' | 'product' | 'invoice' | 'user' | 'settings'
  action: 'add' | 'update' | 'delete'
  data: any
  timestamp: number
  synced: 0 | 1
}

export interface LocalSale {
  id: number
  total: number
  items: any[]
  date: string
  synced: 0 | 1
}

class SKParfumerieDB extends Dexie {
  pendingOps!: Table<PendingOperation>
  localSales!: Table<LocalSale>

  constructor() {
    super('SKParfumerieDB')
    this.version(1).stores({
      pendingOps: '++id, type, action, timestamp, synced',
      localSales: 'id, date, synced'
    })

    this.version(2).stores({
      pendingOps: '++id, type, action, timestamp, synced',
      localSales: 'id, date, synced'
    }).upgrade(async (tx) => {
      await tx.table('pendingOps').toCollection().modify((item: any) => {
        item.synced = item.synced ? 1 : 0
      })
      await tx.table('localSales').toCollection().modify((item: any) => {
        item.synced = item.synced ? 1 : 0
      })
    })
  }
}

export const db = new SKParfumerieDB()