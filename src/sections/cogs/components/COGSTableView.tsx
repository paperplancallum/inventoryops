'use client'

import { useState, useMemo } from 'react'
import { RefreshCw, Download, ChevronDown, ChevronRight, Search, Filter, Table2 } from 'lucide-react'
import type { ProductCOGSCalculation, BatchCOGS } from '@/lib/supabase/hooks'

interface COGSTableViewProps {
  data: ProductCOGSCalculation[]
  batchData: BatchCOGS[]
  selectedMonth: string
  isLoading: boolean
  error: string | null
  onMonthChange: (month: string) => void
  onExport: () => void
  onExportSellerBoard?: () => void
  onRefresh: () => void
}

export function COGSTableView({
  data,
  batchData,
  selectedMonth,
  isLoading,
  error,
  onMonthChange,
  onExport,
  onExportSellerBoard,
  onRefresh,
}: COGSTableViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<keyof ProductCOGSCalculation>('totalCogs')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Generate month options
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

  // Group batch data by SKU for expandable rows
  const batchesBySku = useMemo(() => {
    const map = new Map<string, BatchCOGS[]>()
    batchData.forEach(batch => {
      const existing = map.get(batch.sku) || []
      existing.push(batch)
      map.set(batch.sku, existing)
    })
    return map
  }, [batchData])

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = [...data]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(item =>
        item.sku.toLowerCase().includes(q) ||
        item.productName?.toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      const aNum = Number(aVal) || 0
      const bNum = Number(bVal) || 0
      return sortDir === 'asc' ? aNum - bNum : bNum - aNum
    })

    return result
  }, [data, searchQuery, sortKey, sortDir])

  // Calculate totals
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => ({
        unitsSold: acc.unitsSold + item.unitsSold,
        productCost: acc.productCost + item.productCost,
        transferCost: acc.transferCost + item.transferCost,
        inboundFees: acc.inboundFees + item.inboundFees,
        fbaFees: acc.fbaFees + item.fbaFees,
        storageFees: acc.storageFees + item.storageFees,
        awdFees: acc.awdFees + item.awdFees,
        inventoryLosses: acc.inventoryLosses + item.inventoryLosses,
        totalCogs: acc.totalCogs + item.totalCogs,
      }),
      {
        unitsSold: 0,
        productCost: 0,
        transferCost: 0,
        inboundFees: 0,
        fbaFees: 0,
        storageFees: 0,
        awdFees: 0,
        inventoryLosses: 0,
        totalCogs: 0,
      }
    )
  }, [filteredData])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const handleSort = (key: keyof ProductCOGSCalculation) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const toggleRow = (sku: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(sku)) {
      newExpanded.delete(sku)
    } else {
      newExpanded.add(sku)
    }
    setExpandedRows(newExpanded)
  }

  const SortHeader = ({ label, sortKeyName, className = '' }: { label: string; sortKeyName: keyof ProductCOGSCalculation; className?: string }) => (
    <button
      onClick={() => handleSort(sortKeyName)}
      className={`flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hover:text-slate-700 dark:hover:text-slate-300 ${className}`}
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
                COGS Table
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Detailed cost breakdown by product
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
                placeholder="Search SKU or product..."
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
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-3 py-3 text-left w-8"></th>
                    <th className="px-3 py-3 text-left">
                      <SortHeader label="SKU" sortKeyName="sku" />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Product
                    </th>
                    <th className="px-3 py-3 text-right">
                      <SortHeader label="Units" sortKeyName="unitsSold" className="justify-end" />
                    </th>
                    <th className="px-3 py-3 text-right">
                      <SortHeader label="Product" sortKeyName="productCost" className="justify-end" />
                    </th>
                    <th className="px-3 py-3 text-right">
                      <SortHeader label="Transfer" sortKeyName="transferCost" className="justify-end" />
                    </th>
                    <th className="px-3 py-3 text-right">
                      <SortHeader label="Inbound" sortKeyName="inboundFees" className="justify-end" />
                    </th>
                    <th className="px-3 py-3 text-right">
                      <SortHeader label="FBA" sortKeyName="fbaFees" className="justify-end" />
                    </th>
                    <th className="px-3 py-3 text-right">
                      <SortHeader label="Storage" sortKeyName="storageFees" className="justify-end" />
                    </th>
                    <th className="px-3 py-3 text-right">
                      <SortHeader label="Losses" sortKeyName="inventoryLosses" className="justify-end" />
                    </th>
                    <th className="px-3 py-3 text-right">
                      <SortHeader label="Total COGS" sortKeyName="totalCogs" className="justify-end" />
                    </th>
                    <th className="px-3 py-3 text-right">
                      <SortHeader label="Avg/Unit" sortKeyName="avgCogsPerUnit" className="justify-end" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredData.map((item) => {
                    const batches = batchesBySku.get(item.sku) || []
                    const hasBatches = batches.length > 0
                    const isExpanded = expandedRows.has(item.sku)

                    return (
                      <>
                        <tr
                          key={item.sku}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${hasBatches ? 'cursor-pointer' : ''}`}
                          onClick={() => hasBatches && toggleRow(item.sku)}
                        >
                          <td className="px-3 py-3 text-center">
                            {hasBatches && (
                              isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                              {item.sku}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-sm text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                            {item.productName || '-'}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-slate-900 dark:text-white">
                            {item.unitsSold.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-slate-600 dark:text-slate-400">
                            {formatCurrency(item.productCost)}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-slate-600 dark:text-slate-400">
                            {item.transferCost > 0 ? formatCurrency(item.transferCost) : '-'}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-slate-600 dark:text-slate-400">
                            {item.inboundFees > 0 ? formatCurrency(item.inboundFees) : '-'}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-slate-600 dark:text-slate-400">
                            {item.fbaFees > 0 ? formatCurrency(item.fbaFees) : '-'}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-slate-600 dark:text-slate-400">
                            {item.storageFees > 0 ? formatCurrency(item.storageFees) : '-'}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-red-600 dark:text-red-400">
                            {item.inventoryLosses > 0 ? formatCurrency(item.inventoryLosses) : '-'}
                          </td>
                          <td className="px-3 py-3 text-sm text-right font-medium text-slate-900 dark:text-white">
                            {formatCurrency(item.totalCogs)}
                          </td>
                          <td className="px-3 py-3 text-sm text-right text-slate-600 dark:text-slate-400">
                            {formatCurrency(item.avgCogsPerUnit)}
                          </td>
                        </tr>
                        {isExpanded && batches.map(batch => (
                          <tr
                            key={batch.batchId}
                            className="bg-slate-50 dark:bg-slate-800/30"
                          >
                            <td className="px-3 py-2"></td>
                            <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-500" colSpan={2}>
                              <span className="font-medium">{batch.batchNumber}</span>
                              <span className="ml-2 text-slate-400">({batch.originalQuantity} units)</span>
                            </td>
                            <td className="px-3 py-2 text-xs text-right text-slate-500 dark:text-slate-500">
                              {batch.unitsSold}
                            </td>
                            <td className="px-3 py-2 text-xs text-right text-slate-500 dark:text-slate-500">
                              {formatCurrency(batch.productTotalCost)}
                            </td>
                            <td className="px-3 py-2 text-xs text-right text-slate-500 dark:text-slate-500">
                              {batch.transferCosts > 0 ? formatCurrency(batch.transferCosts) : '-'}
                            </td>
                            <td className="px-3 py-2 text-xs text-right text-slate-500 dark:text-slate-500">
                              {batch.amazonFeesDirect > 0 ? formatCurrency(batch.amazonFeesDirect) : '-'}
                            </td>
                            <td className="px-3 py-2 text-xs text-right text-slate-500 dark:text-slate-500">
                              {batch.amazonFeesAllocated > 0 ? formatCurrency(batch.amazonFeesAllocated) : '-'}
                            </td>
                            <td className="px-3 py-2 text-xs text-right text-slate-500 dark:text-slate-500">
                              -
                            </td>
                            <td className="px-3 py-2 text-xs text-right text-red-500">
                              {batch.inventoryLosses > 0 ? formatCurrency(batch.inventoryLosses) : '-'}
                            </td>
                            <td className="px-3 py-2 text-xs text-right text-slate-500 dark:text-slate-500">
                              {formatCurrency(batch.productTotalCost + batch.transferCosts + batch.amazonFeesDirect + batch.amazonFeesAllocated + batch.inventoryLosses)}
                            </td>
                            <td className="px-3 py-2 text-xs text-right text-slate-500 dark:text-slate-500">
                              {formatCurrency(batch.productUnitCost)}
                            </td>
                          </tr>
                        ))}
                      </>
                    )
                  })}
                </tbody>
                <tfoot className="bg-slate-100 dark:bg-slate-700/50">
                  <tr className="border-t-2 border-slate-300 dark:border-slate-600">
                    <td className="px-3 py-3"></td>
                    <td className="px-3 py-3 font-semibold text-slate-900 dark:text-white" colSpan={2}>
                      Total ({filteredData.length} products)
                    </td>
                    <td className="px-3 py-3 text-sm text-right font-semibold text-slate-900 dark:text-white">
                      {totals.unitsSold.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-sm text-right font-medium text-slate-700 dark:text-slate-300">
                      {formatCurrency(totals.productCost)}
                    </td>
                    <td className="px-3 py-3 text-sm text-right font-medium text-slate-700 dark:text-slate-300">
                      {totals.transferCost > 0 ? formatCurrency(totals.transferCost) : '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-right font-medium text-slate-700 dark:text-slate-300">
                      {totals.inboundFees > 0 ? formatCurrency(totals.inboundFees) : '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-right font-medium text-slate-700 dark:text-slate-300">
                      {totals.fbaFees > 0 ? formatCurrency(totals.fbaFees) : '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-right font-medium text-slate-700 dark:text-slate-300">
                      {totals.storageFees > 0 ? formatCurrency(totals.storageFees) : '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-right font-medium text-red-600 dark:text-red-400">
                      {totals.inventoryLosses > 0 ? formatCurrency(totals.inventoryLosses) : '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-right font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(totals.totalCogs)}
                    </td>
                    <td className="px-3 py-3 text-sm text-right font-medium text-slate-700 dark:text-slate-300">
                      {totals.unitsSold > 0 ? formatCurrency(totals.totalCogs / totals.unitsSold) : '-'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="flex justify-center mb-4">
              <Table2 className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No COGS data for this period
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Try selecting a different month or ensure sales data has been imported
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
