'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCOGS, useAmazonSales } from '@/lib/supabase/hooks'
import { BatchFIFOReportView } from '@/sections/cogs/components/BatchFIFOReportView'
import type { BatchFIFOReport } from '@/lib/supabase/hooks'

export default function BatchFIFOReportPage() {
  const { getBatchFIFOReport, isLoading, error } = useCOGS()
  const { processPendingCogs } = useAmazonSales()
  const [batches, setBatches] = useState<BatchFIFOReport[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getBatchFIFOReport()
      setBatches(data)
    } catch (err) {
      console.error('Error fetching FIFO report:', err)
    } finally {
      setLoading(false)
    }
  }, [getBatchFIFOReport])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <BatchFIFOReportView
      batches={batches}
      isLoading={loading || isLoading}
      error={error}
      onRefresh={fetchData}
      onProcessAttribution={processPendingCogs}
    />
  )
}
