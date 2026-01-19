'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCOGS } from '@/lib/supabase/hooks'
import { COGSDashboard } from '@/sections/cogs'
import type { COGSMonthlySummary, BatchCOGS } from '@/lib/supabase/hooks'

export default function COGSPage() {
  const { getMonthlySummary, getBatchCOGS, getUnattributedSales, isLoading, error } = useCOGS()
  const [monthlySummary, setMonthlySummary] = useState<COGSMonthlySummary[]>([])
  const [recentBatches, setRecentBatches] = useState<BatchCOGS[]>([])
  const [unattributedCount, setUnattributedCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [summary, batches, unattributed] = await Promise.all([
        getMonthlySummary(),
        getBatchCOGS(),
        getUnattributedSales(),
      ])
      setMonthlySummary(summary)
      setRecentBatches(batches)
      setUnattributedCount(unattributed.length)
    } catch (err) {
      console.error('Error fetching COGS data:', err)
    } finally {
      setLoading(false)
    }
  }, [getMonthlySummary, getBatchCOGS, getUnattributedSales])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <COGSDashboard
      monthlySummary={monthlySummary}
      recentBatches={recentBatches}
      isLoading={loading || isLoading}
      error={error}
      onRefresh={fetchData}
      unattributedSalesCount={unattributedCount}
    />
  )
}
