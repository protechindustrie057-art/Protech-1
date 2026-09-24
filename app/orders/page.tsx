'use client'

import { useEffect, useState } from 'react'
import OrdersPage from '@/components/pages/OrdersPage'
import { loadInvoicesFromLS } from '@/lib/store'
import type { Invoice } from '@/lib/types'

export default function Page() {
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    setInvoices(loadInvoicesFromLS())
  }, [])

  return <OrdersPage invoices={invoices} currency={'CDF'} usdRate={2850} />
}
