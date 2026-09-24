'use client'

import { useEffect, useState } from 'react'
import FacturesPage from '@/components/pages/FacturesPage'
import { loadInvoicesFromLS } from '@/lib/store'
import type { Invoice } from '@/lib/types'

export default function Page() {
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    setInvoices(loadInvoicesFromLS())
  }, [])

  return <FacturesPage invoices={invoices} currency={'CDF'} usdRate={2850} />
}
