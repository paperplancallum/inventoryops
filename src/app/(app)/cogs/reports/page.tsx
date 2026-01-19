'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCOGS, useCOGSSettings } from '@/lib/supabase/hooks'
import { MonthlyReportView } from '@/sections/cogs/components/MonthlyReportView'
import type { MonthlyProductCOGS, ProductCOGSCalculation } from '@/lib/supabase/hooks'

export default function MonthlyReportPage() {
  const { getMonthlyProductCOGS, calculateProductCOGS, exportMonthlyReport, exportSellerBoardFormat, downloadCSV, isLoading, error } = useCOGS()
  const { settings } = useCOGSSettings()

  const currentMonth = new Date().toISOString().substring(0, 7)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [selectedSettings, setSelectedSettings] = useState('default')
  const [monthlyData, setMonthlyData] = useState<MonthlyProductCOGS[]>([])
  const [detailedData, setDetailedData] = useState<ProductCOGSCalculation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [year, month] = selectedMonth.split('-').map(Number)
      const startDate = `${selectedMonth}-01`
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]

      const [monthly, detailed] = await Promise.all([
        getMonthlyProductCOGS(selectedMonth),
        calculateProductCOGS(null, startDate, endDate, selectedSettings),
      ])

      setMonthlyData(monthly)
      setDetailedData(detailed)
    } catch (err) {
      console.error('Error fetching report data:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedSettings, getMonthlyProductCOGS, calculateProductCOGS])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = async () => {
    try {
      const csv = await exportMonthlyReport(selectedMonth, selectedSettings)
      downloadCSV(csv, `cogs-report-${selectedMonth}.csv`)
    } catch (err) {
      console.error('Error exporting report:', err)
    }
  }

  const handleExportSellerBoard = async () => {
    try {
      const csv = await exportSellerBoardFormat(selectedMonth, selectedSettings)
      downloadCSV(csv, `sellerboard-import-${selectedMonth}.csv`)
    } catch (err) {
      console.error('Error exporting SellerBoard format:', err)
    }
  }

  return (
    <MonthlyReportView
      monthlyData={monthlyData}
      detailedData={detailedData}
      settings={settings}
      selectedMonth={selectedMonth}
      selectedSettings={selectedSettings}
      isLoading={loading || isLoading}
      error={error}
      onMonthChange={setSelectedMonth}
      onSettingsChange={setSelectedSettings}
      onExport={handleExport}
      onExportSellerBoard={handleExportSellerBoard}
      onRefresh={fetchData}
    />
  )
}
