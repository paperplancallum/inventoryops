'use client'

import { useState, useMemo } from 'react'
import {
  DollarSign,
  TrendingDown,
  Package,
  Calculator,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  RefreshCw,
} from 'lucide-react'
import { useCogsReport, CogsFilters, CogsEntry } from '@/lib/supabase/hooks/useCogsReport'

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  transfer_out: 'Transfer Out',
  adjustment_remove: 'Adjustment (Removal)',
  amazon_reconcile: 'Amazon Reconciliation',
}

const DATE_PRESETS = [
  { id: 'this_month', label: 'This Month', getRange: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: start.toISOString().split('T')[0], to: now.toISOString().split('T')[0] }
  }},
  { id: 'last_month', label: 'Last Month', getRange: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    return { from: start.toISOString().split('T')[0], to: end.toISOString().split('T')[0] }
  }},
  { id: 'last_3_months', label: 'Last 3 Months', getRange: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 3, 1)
    return { from: start.toISOString().split('T')[0], to: now.toISOString().split('T')[0] }
  }},
  { id: 'last_6_months', label: 'Last 6 Months', getRange: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    return { from: start.toISOString().split('T')[0], to: now.toISOString().split('T')[0] }
  }},
  { id: 'this_year', label: 'This Year', getRange: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    return { from: start.toISOString().split('T')[0], to: now.toISOString().split('T')[0] }
  }},
  { id: 'all_time', label: 'All Time', getRange: () => ({ from: null, to: null }) },
]

export function CogsReportView() {
  const [filters, setFilters] = useState<CogsFilters>({
    dateFrom: null,
    dateTo: null,
    movementType: null,
    productSearch: '',
  })
  const [datePreset, setDatePreset] = useState('all_time')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(25)
  const [sortField, setSortField] = useState<keyof CogsEntry>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'entries' | 'products'>('entries')

  const { entries, summary, productSummary, loading, error, refetch } = useCogsReport(filters)

  // Sort entries
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }

      const aStr = String(aVal)
      const bStr = String(bVal)
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
    })
  }, [entries, sortField, sortDirection])

  // Paginate
  const totalPages = Math.ceil(sortedEntries.length / pageSize)
  const paginatedEntries = sortedEntries.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSort = (field: keyof CogsEntry) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleDatePresetChange = (presetId: string) => {
    setDatePreset(presetId)
    const preset = DATE_PRESETS.find(p => p.id === presetId)
    if (preset) {
      const range = preset.getRange()
      setFilters(prev => ({
        ...prev,
        dateFrom: range.from,
        dateTo: range.to,
      }))
    }
    setCurrentPage(1)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">Error loading COGS data: {error.message}</p>
          <button
            onClick={refetch}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-5">
          {/* Title */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">COGS Report</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Cost of Goods Sold analysis and tracking
              </p>
            </div>
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
            {/* Total COGS */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-600 dark:text-red-400">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Total COGS
                </p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {loading ? '...' : formatCurrency(summary.totalCogs)}
              </p>
            </div>

            {/* Total Units */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                  <Package className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Units Sold
                </p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {loading ? '...' : formatNumber(summary.totalUnits)}
              </p>
            </div>

            {/* Unique Products */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-purple-600 dark:text-purple-400">
                  <Filter className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Products
                </p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {loading ? '...' : formatNumber(summary.uniqueProducts)}
              </p>
            </div>

            {/* Avg Cost Per Unit */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <Calculator className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Avg Cost/Unit
                </p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                {loading ? '...' : formatCurrency(summary.avgCostPerUnit)}
              </p>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-700 mb-4">
            <button
              onClick={() => setViewMode('entries')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                viewMode === 'entries'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              All Entries
            </button>
            <button
              onClick={() => setViewMode('products')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                viewMode === 'products'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              By Product
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search SKU or product..."
                value={filters.productSearch}
                onChange={e => {
                  setFilters(prev => ({ ...prev, productSearch: e.target.value }))
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Date Preset */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={datePreset}
                onChange={e => handleDatePresetChange(e.target.value)}
                className="pl-10 pr-8 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                {DATE_PRESETS.map(preset => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Movement Type Filter */}
            <div className="relative">
              <select
                value={filters.movementType || 'all'}
                onChange={e => {
                  setFilters(prev => ({ ...prev, movementType: e.target.value === 'all' ? null : e.target.value }))
                  setCurrentPage(1)
                }}
                className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer pr-8"
              >
                <option value="all">All Types</option>
                <option value="amazon_reconcile">Amazon Reconciliation</option>
                <option value="transfer_out">Transfer Out</option>
                <option value="adjustment_remove">Adjustments</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Loading COGS data...</p>
            </div>
          ) : viewMode === 'entries' ? (
            <>
              {/* Entries Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="px-4 py-3 text-left">
                        <button
                          onClick={() => handleSort('createdAt')}
                          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          Date
                          {sortField === 'createdAt' && (
                            <ChevronDown className={`w-4 h-4 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">
                        <button
                          onClick={() => handleSort('sku')}
                          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          SKU
                          {sortField === 'sku' && (
                            <ChevronDown className={`w-4 h-4 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Location
                      </th>
                      <th className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleSort('quantity')}
                          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ml-auto"
                        >
                          Qty
                          {sortField === 'quantity' && (
                            <ChevronDown className={`w-4 h-4 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Unit Cost
                      </th>
                      <th className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleSort('totalCost')}
                          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 ml-auto"
                        >
                          Total COGS
                          {sortField === 'totalCost' && (
                            <ChevronDown className={`w-4 h-4 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                          )}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {paginatedEntries.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center">
                          <DollarSign className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                          <p className="text-slate-500 dark:text-slate-400">No COGS entries found</p>
                          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                            Try adjusting your filters or date range
                          </p>
                        </td>
                      </tr>
                    ) : (
                      paginatedEntries.map(entry => (
                        <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                            {formatDate(entry.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                              {entry.sku}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate">
                            {entry.productName}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              entry.movementType === 'amazon_reconcile'
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                : entry.movementType === 'transfer_out'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {MOVEMENT_TYPE_LABELS[entry.movementType] || entry.movementType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                            {entry.locationName}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-slate-900 dark:text-white">
                            {formatNumber(entry.quantity)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-300">
                            {formatCurrency(entry.unitCost)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-red-600 dark:text-red-400">
                            {formatCurrency(entry.totalCost)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedEntries.length)} of {sortedEntries.length} entries
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Products Table */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Product
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Units Sold
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Avg Unit Cost
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Total COGS
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {productSummary.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">No product data found</p>
                      </td>
                    </tr>
                  ) : (
                    productSummary.map(product => (
                      <tr key={product.sku} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                            {product.sku}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {product.productName}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-slate-900 dark:text-white">
                          {formatNumber(product.totalUnits)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-300">
                          {formatCurrency(product.avgUnitCost)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(product.totalCogs)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-300">
                          {summary.totalCogs > 0
                            ? ((product.totalCogs / summary.totalCogs) * 100).toFixed(1)
                            : 0}%
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {productSummary.length > 0 && (
                  <tfoot className="bg-slate-50 dark:bg-slate-700/50">
                    <tr className="font-semibold">
                      <td colSpan={2} className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                        Total
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white">
                        {formatNumber(summary.totalUnits)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-300">
                        {formatCurrency(summary.avgCostPerUnit)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400">
                        {formatCurrency(summary.totalCogs)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white">
                        100%
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>

        {/* Monthly Trend Chart */}
        {summary.monthlyTrend.length > 0 && (
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Monthly COGS Trend</h2>
            <div className="h-64">
              <div className="flex items-end justify-between h-full gap-2">
                {summary.monthlyTrend.map((month, index) => {
                  const maxCogs = Math.max(...summary.monthlyTrend.map(m => m.cogs))
                  const heightPercent = maxCogs > 0 ? (month.cogs / maxCogs) * 100 : 0
                  return (
                    <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center">
                        <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          {formatCurrency(month.cogs)}
                        </span>
                        <div
                          className="w-full bg-red-500 dark:bg-red-600 rounded-t-lg transition-all duration-300"
                          style={{ height: `${heightPercent}%`, minHeight: heightPercent > 0 ? '4px' : '0' }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
