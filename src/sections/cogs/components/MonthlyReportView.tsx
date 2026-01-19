'use client'

import { useState, useMemo } from 'react'
import { RefreshCw, Download, ChevronDown, Search, Filter } from 'lucide-react'
import type { MonthlyProductCOGS, ProductCOGSCalculation, COGSSettings } from '@/lib/supabase/hooks'

interface MonthlyReportViewProps {
  monthlyData: MonthlyProductCOGS[]
  detailedData: ProductCOGSCalculation[]
  settings: COGSSettings[]
  selectedMonth: string
  selectedSettings: string
  isLoading: boolean
  error: string | null
  onMonthChange: (month: string) => void
  onSettingsChange: (settingsName: string) => void
  onExport: () => void
  onExportSellerBoard?: () => void
  onRefresh: () => void
}

export function MonthlyReportView({
  monthlyData,
  detailedData,
  settings,
  selectedMonth,
  selectedSettings,
  isLoading,
  error,
  onMonthChange,
  onSettingsChange,
  onExport,
  onExportSellerBoard,
  onRefresh,
}: MonthlyReportViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [sortKey, setSortKey] = useState<'sku' | 'units' | 'revenue' | 'cogs' | 'margin'>('revenue')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Generate month options for the last 12 months
  const monthOptions = useMemo(() => {
    const options = []
    const today = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      options.push({ value, label })
    }
    return options
  }, [])

  // Use detailed data if available, otherwise monthly data
  const reportData = detailedData.length > 0 ? detailedData : monthlyData

  const filteredData = useMemo(() => {
    let result = [...reportData]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(item =>
        item.sku.toLowerCase().includes(q) ||
        ('productName' in item && item.productName?.toLowerCase().includes(q))
      )
    }

    result.sort((a, b) => {
      let aVal = 0
      let bVal = 0

      switch (sortKey) {
        case 'sku':
          return sortDir === 'asc'
            ? a.sku.localeCompare(b.sku)
            : b.sku.localeCompare(a.sku)
        case 'units':
          aVal = a.unitsSold
          bVal = b.unitsSold
          break
        case 'revenue':
          aVal = 'revenueUsd' in a ? a.revenueUsd : 0
          bVal = 'revenueUsd' in b ? b.revenueUsd : 0
          break
        case 'cogs':
          aVal = 'totalCogs' in a ? a.totalCogs : 'productCost' in a ? a.productCost : 0
          bVal = 'totalCogs' in b ? b.totalCogs : 'productCost' in b ? b.productCost : 0
          break
        case 'margin':
          const aRevenue = 'revenueUsd' in a ? a.revenueUsd : 0
          const aCogs = 'totalCogs' in a ? a.totalCogs : 'productCost' in a ? a.productCost : 0
          const bRevenue = 'revenueUsd' in b ? b.revenueUsd : 0
          const bCogs = 'totalCogs' in b ? b.totalCogs : 'productCost' in b ? b.productCost : 0
          aVal = aRevenue > 0 ? ((aRevenue - aCogs) / aRevenue) * 100 : 0
          bVal = bRevenue > 0 ? ((bRevenue - bCogs) / bRevenue) * 100 : 0
          break
      }

      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    })

    return result
  }, [reportData, searchQuery, sortKey, sortDir])

  // Calculate totals
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => {
        acc.units += item.unitsSold
        acc.revenue += 'revenueUsd' in item ? item.revenueUsd : 0
        acc.cogs += 'totalCogs' in item ? item.totalCogs : 'productCost' in item ? item.productCost : 0
        return acc
      },
      { units: 0, revenue: 0, cogs: 0 }
    )
  }, [filteredData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: typeof sortKey }) => (
    <button
      onClick={() => handleSort(sortKeyName)}
      className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hover:text-slate-700 dark:hover:text-slate-300"
    >
      {label}
      {sortKey === sortKeyName && (
        <ChevronDown className={`w-3 h-3 ${sortDir === 'asc' ? 'rotate-180' : ''}`} />
      )}
    </button>
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Monthly COGS Report
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Product-level cost breakdown by month
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={isLoading || filteredData.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Export
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => {
                        onExport()
                        setShowExportMenu(false)
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-t-lg"
                    >
                      Export CSV
                    </button>
                    {onExportSellerBoard && (
                      <button
                        onClick={() => {
                          onExportSellerBoard()
                          setShowExportMenu(false)
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-b-lg border-t border-slate-200 dark:border-slate-700"
                      >
                        Export for SellerBoard
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Products</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{filteredData.length}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Units Sold</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{totals.units.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Revenue</p>
              <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">{formatCurrency(totals.revenue)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total COGS</p>
              <p className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">{formatCurrency(totals.cogs)}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <select
              aria-label="Select month"
              value={selectedMonth}
              onChange={e => onMonthChange(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {monthOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              aria-label="Select settings profile"
              value={selectedSettings}
              onChange={e => onSettingsChange(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {settings.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name} {s.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {filteredData.length > 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left">
                      <SortHeader label="SKU" sortKeyName="sku" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Product
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader label="Units" sortKeyName="units" />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader label="Revenue" sortKeyName="revenue" />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader label="COGS" sortKeyName="cogs" />
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Avg Cost
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader label="Margin" sortKeyName="margin" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredData.map((item, index) => {
                    const revenue = 'revenueUsd' in item ? item.revenueUsd : 0
                    const cogs = 'totalCogs' in item ? item.totalCogs : 'productCost' in item ? item.productCost : 0
                    const avgCost = 'avgCogsPerUnit' in item ? item.avgCogsPerUnit : 'avgUnitCost' in item ? item.avgUnitCost : 0
                    const margin = revenue > 0 ? ((revenue - cogs) / revenue) * 100 : 0
                    const productName = 'productName' in item ? item.productName : null

                    return (
                      <tr key={`${item.sku}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            {item.sku}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                          {productName || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white">
                          {item.unitsSold.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400 font-medium">
                          {formatCurrency(revenue)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400 font-medium">
                          {formatCurrency(cogs)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-400">
                          {formatCurrency(avgCost)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={`font-medium ${margin >= 30 ? 'text-green-600 dark:text-green-400' : margin >= 20 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                            {margin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-700/50">
                  <tr className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white" colSpan={2}>
                      Total
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900 dark:text-white">
                      {totals.units.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(totals.revenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(totals.cogs)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-400">
                      {totals.units > 0 ? formatCurrency(totals.cogs / totals.units) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">
                      <span className={`${totals.revenue > 0 && ((totals.revenue - totals.cogs) / totals.revenue) * 100 >= 30 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {totals.revenue > 0 ? `${(((totals.revenue - totals.cogs) / totals.revenue) * 100).toFixed(1)}%` : '-'}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="flex justify-center mb-4">
              <Filter className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No data for this period
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Try selecting a different month or check if sales data has been imported
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
