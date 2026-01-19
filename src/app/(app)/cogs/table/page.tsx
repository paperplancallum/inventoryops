'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCOGS } from '@/lib/supabase/hooks'
import { COGSTableView } from '@/sections/cogs/components/COGSTableView'
import type { ProductCOGSCalculation, BatchCOGS } from '@/lib/supabase/hooks'

export default function COGSTablePage() {
  const { calculateProductCOGS, getBatchCOGS, exportMonthlyReport, exportSellerBoardFormat, downloadCSV, isLoading, error } = useCOGS()

  const currentMonth = new Date().toISOString().substring(0, 7)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [cogsData, setCogsData] = useState<ProductCOGSCalculation[]>([])
  const [batchData, setBatchData] = useState<BatchCOGS[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [year, month] = selectedMonth.split('-').map(Number)
      const startDate = `${selectedMonth}-01`
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]

      const [cogs, batches] = await Promise.all([
        calculateProductCOGS(null, startDate, endDate, 'default'),
        getBatchCOGS(),
      ])

      setCogsData(cogs)
      setBatchData(batches)
    } catch (err) {
      console.error('Error fetching COGS data:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, calculateProductCOGS, getBatchCOGS])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = async () => {
    try {
      const csv = await exportMonthlyReport(selectedMonth, 'default')
      downloadCSV(csv, `cogs-table-${selectedMonth}.csv`)
    } catch (err) {
      console.error('Error exporting:', err)
    }
  }

  const handleExportSellerBoard = async () => {
    try {
      const csv = await exportSellerBoardFormat(selectedMonth, 'default')
      downloadCSV(csv, `sellerboard-import-${selectedMonth}.csv`)
    } catch (err) {
      console.error('Error exporting SellerBoard format:', err)
    }
  }

  return (
    <COGSTableView
      data={cogsData}
      batchData={batchData}
      selectedMonth={selectedMonth}
      isLoading={loading || isLoading}
      error={error}
      onMonthChange={setSelectedMonth}
      onExport={handleExport}
      onExportSellerBoard={handleExportSellerBoard}
      onRefresh={fetchData}
    />
  )
}
