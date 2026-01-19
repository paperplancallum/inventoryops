'use client'

import { useState, useMemo } from 'react'
import { RefreshCw, Search, ChevronDown, Layers, Package } from 'lucide-react'
import type { BatchFIFOReport } from '@/lib/supabase/hooks'

interface BatchFIFOReportViewProps {
  batches: BatchFIFOReport[]
  isLoading: boolean
  error: string | null
  onRefresh: () => void
  onProcessAttribution: () => Promise<{ processed: number; unattributed: number }>
}

export function BatchFIFOReportView({
  batches,
  isLoading,
  error,
  onRefresh,
  onProcessAttribution,
}: BatchFIFOReportViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<'batch' | 'date' | 'sold' | 'remaining'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processResult, setProcessResult] = useState<{ processed: number; unattributed: number } | null>(null)

  const stages = useMemo(() => {
    const uniqueStages = [...new Set(batches.map(b => b.stage))]
    return uniqueStages.sort()
  }, [batches])

  const filteredBatches = useMemo(() => {
    let result = [...batches]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(b =>
        b.batchNumber.toLowerCase().includes(q) ||
        b.sku.toLowerCase().includes(q) ||
        b.productName?.toLowerCase().includes(q)
      )
    }

    if (stageFilter !== 'all') {
      result = result.filter(b => b.stage === stageFilter)
    }

    result.sort((a, b) => {
      let aVal: string | number = ''
      let bVal: string | number = ''

      switch (sortKey) {
        case 'batch':
          aVal = a.batchNumber
          bVal = b.batchNumber
          return sortDir === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        case 'date':
          aVal = a.orderedDate || ''
          bVal = b.orderedDate || ''
          return sortDir === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        case 'sold':
          aVal = a.quantitySold
          bVal = b.quantitySold
          break
        case 'remaining':
          aVal = a.quantityRemaining
          bVal = b.quantityRemaining
          break
      }

      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })

    return result
  }, [batches, searchQuery, stageFilter, sortKey, sortDir])

  // Calculate summary
  const summary = useMemo(() => {
    return {
      totalBatches: filteredBatches.length,
      totalUnits: filteredBatches.reduce((sum, b) => sum + b.originalQuantity, 0),
      totalSold: filteredBatches.reduce((sum, b) => sum + b.quantitySold, 0),
      totalLost: filteredBatches.reduce((sum, b) => sum + b.quantityLost, 0),
      totalRemaining: filteredBatches.reduce((sum, b) => sum + b.quantityRemaining, 0),
      totalCOGS: filteredBatches.reduce((sum, b) => sum + b.cogsRecognized, 0),
      fullyDepleted: filteredBatches.filter(b => b.quantityRemaining === 0).length,
    }
  }, [filteredBatches])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const handleProcess = async () => {
    setIsProcessing(true)
    setProcessResult(null)
    try {
      const result = await onProcessAttribution()
      setProcessResult(result)
      onRefresh()
    } finally {
      setIsProcessing(false)
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

  const getDepletionBar = (batch: BatchFIFOReport) => {
    const soldPercent = (batch.quantitySold / batch.originalQuantity) * 100
    const lostPercent = (batch.quantityLost / batch.originalQuantity) * 100

    return (
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
        <div
          className="h-full bg-green-500"
          style={{ width: `${soldPercent}%` }}
          title={`Sold: ${batch.quantitySold}`}
        />
        <div
          className="h-full bg-red-400"
          style={{ width: `${lostPercent}%` }}
          title={`Lost: ${batch.quantityLost}`}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Batch FIFO Report
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Track batch depletion with First-In-First-Out method
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
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                <Layers className="w-4 h-4" />
                {isProcessing ? 'Processing...' : 'Run Attribution'}
              </button>
            </div>
          </div>

          {/* Process Result */}
          {processResult && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300">
                Processed {processResult.processed} sales. {processResult.unattributed > 0 ? `${processResult.unattributed} units could not be attributed (no matching batch).` : 'All units attributed successfully.'}
              </p>
            </div>
          )}

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Batches</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{summary.totalBatches}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Units</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{summary.totalUnits.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Sold</p>
              <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">{summary.totalSold.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Lost</p>
              <p className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">{summary.totalLost.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Remaining</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{summary.totalRemaining.toLocaleString()}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">COGS Recognized</p>
              <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(summary.totalCOGS)}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Depleted</p>
              <p className="mt-1 text-2xl font-semibold text-indigo-600 dark:text-indigo-400">{summary.fullyDepleted}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search batches..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <select
              aria-label="Filter by stage"
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All stages</option>
              {stages.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
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
        {filteredBatches.length > 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left">
                      <SortHeader label="Batch" sortKeyName="batch" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left">
                      <SortHeader label="Date" sortKeyName="date" />
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Original
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader label="Sold" sortKeyName="sold" />
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Lost
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader label="Remaining" sortKeyName="remaining" />
                    </th>
                    <th className="px-4 py-3 w-32 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Depletion
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Unit Cost
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      COGS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredBatches.map(batch => (
                    <tr key={batch.batchId} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          {batch.batchNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-900 dark:text-white">
                          {batch.sku}
                        </div>
                        {batch.productName && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                            {batch.productName}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {formatDate(batch.orderedDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white">
                        {batch.originalQuantity.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400 font-medium">
                        {batch.quantitySold.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400">
                        {batch.quantityLost > 0 ? batch.quantityLost.toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white font-medium">
                        {batch.quantityRemaining.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {getDepletionBar(batch)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-400">
                        {formatCurrency(batch.unitCost)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-amber-600 dark:text-amber-400 font-medium">
                        {formatCurrency(batch.cogsRecognized)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing {filteredBatches.length} of {batches.length} batches
              </p>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span className="text-slate-500 dark:text-slate-400">Sold</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-400 rounded" />
                  <span className="text-slate-500 dark:text-slate-400">Lost</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-slate-200 dark:bg-slate-600 rounded" />
                  <span className="text-slate-500 dark:text-slate-400">Remaining</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="flex justify-center mb-4">
              <Package className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No batch data available
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Batch FIFO data will appear here once inventory is received
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
