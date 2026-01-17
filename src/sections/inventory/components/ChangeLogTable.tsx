'use client'

import { GitBranch, GitMerge, RefreshCw, ArrowRight } from 'lucide-react'
import type { BatchChangeLogEntry, BatchChangeType } from '@/lib/supabase/hooks/useChangeLog'

interface ChangeLogTableProps {
  entries: BatchChangeLogEntry[]
  loading: boolean
  onRefresh: () => void
}

const changeTypeConfig: Record<BatchChangeType, { icon: typeof GitBranch; label: string; color: string }> = {
  split: {
    icon: GitBranch,
    label: 'Split',
    color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  },
  merge: {
    icon: GitMerge,
    label: 'Merge',
    color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
  },
  quantity_adjustment: {
    icon: RefreshCw,
    label: 'Adjustment',
    color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20',
  },
  cost_adjustment: {
    icon: RefreshCw,
    label: 'Cost Adj.',
    color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20',
  },
  stage_change: {
    icon: ArrowRight,
    label: 'Stage Move',
    color: 'text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-900/20',
  },
}

export function ChangeLogTable({ entries, loading, onRefresh }: ChangeLogTableProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatQuantityChange = (entry: BatchChangeLogEntry) => {
    if (entry.quantityChange === null) return '—'
    const sign = entry.quantityChange > 0 ? '+' : ''
    return `${sign}${entry.quantityChange.toLocaleString()}`
  }

  const getQuantityChangeColor = (entry: BatchChangeLogEntry) => {
    if (entry.quantityChange === null) return 'text-stone-500'
    if (entry.quantityChange > 0) return 'text-emerald-600 dark:text-emerald-400'
    if (entry.quantityChange < 0) return 'text-red-600 dark:text-red-400'
    return 'text-stone-500'
  }

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 mx-auto text-stone-400 animate-spin" />
          <p className="mt-4 text-stone-500 dark:text-stone-400">Loading change log...</p>
        </div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <GitBranch className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600" />
          <h3 className="mt-4 text-lg font-medium text-stone-900 dark:text-white">
            No changes recorded yet
          </h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            Split, merge, or move batches to see changes appear here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
        <h3 className="font-medium text-stone-900 dark:text-white">
          Recent Changes
        </h3>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-700/50 text-left text-xs font-medium uppercase text-stone-500 dark:text-stone-400">
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Batch</th>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Related / Stage</th>
              <th className="py-3 px-4 text-right">Qty Change</th>
              <th className="py-3 px-4 text-right">Result</th>
              <th className="py-3 px-4">Note</th>
              <th className="py-3 px-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
            {entries.map((entry) => {
              const config = changeTypeConfig[entry.changeType]
              const Icon = config.icon

              return (
                <tr
                  key={entry.id}
                  className="hover:bg-stone-50 dark:hover:bg-stone-700/50"
                >
                  {/* Type */}
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {config.label}
                    </span>
                  </td>

                  {/* Batch */}
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium text-stone-900 dark:text-white font-mono">
                      {entry.batchNumber}
                    </span>
                  </td>

                  {/* Product */}
                  <td className="py-3 px-4">
                    <div>
                      <p className="text-sm text-stone-900 dark:text-white truncate max-w-[150px]">
                        {entry.productName}
                      </p>
                      <p className="text-xs text-lime-600 dark:text-lime-400 font-mono">
                        {entry.sku}
                      </p>
                    </div>
                  </td>

                  {/* Related Batches / Stage Transition */}
                  <td className="py-3 px-4">
                    {entry.changeType === 'stage_change' && entry.stageFrom && entry.stageTo ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="bg-stone-100 dark:bg-stone-700 px-1.5 py-0.5 rounded text-stone-600 dark:text-stone-400 capitalize">
                          {entry.stageFrom.replace('-', ' ')}
                        </span>
                        <ArrowRight className="w-3 h-3 text-stone-400" />
                        <span className="bg-cyan-100 dark:bg-cyan-900/30 px-1.5 py-0.5 rounded text-cyan-700 dark:text-cyan-400 capitalize">
                          {entry.stageTo.replace('-', ' ')}
                        </span>
                      </div>
                    ) : entry.relatedBatchNumbers.length > 0 ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        {entry.changeType === 'split' && entry.quantityChange && entry.quantityChange > 0 && (
                          <span className="text-xs text-stone-400 mr-1">from</span>
                        )}
                        {entry.changeType === 'split' && entry.quantityChange && entry.quantityChange < 0 && (
                          <span className="text-xs text-stone-400 mr-1">to</span>
                        )}
                        {entry.changeType === 'merge' && entry.quantityChange && entry.quantityChange > 0 && (
                          <span className="text-xs text-stone-400 mr-1">from</span>
                        )}
                        {entry.changeType === 'merge' && entry.quantityChange && entry.quantityChange < 0 && (
                          <span className="text-xs text-stone-400 mr-1">into</span>
                        )}
                        {entry.relatedBatchNumbers.slice(0, 3).map((bn, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-mono bg-stone-100 dark:bg-stone-700 px-1.5 py-0.5 rounded text-stone-600 dark:text-stone-400"
                          >
                            {bn}
                          </span>
                        ))}
                        {entry.relatedBatchNumbers.length > 3 && (
                          <span className="text-xs text-stone-400">
                            +{entry.relatedBatchNumbers.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-stone-400">—</span>
                    )}
                  </td>

                  {/* Quantity Change */}
                  <td className="py-3 px-4 text-right">
                    <span className={`text-sm font-medium tabular-nums ${getQuantityChangeColor(entry)}`}>
                      {formatQuantityChange(entry)}
                    </span>
                  </td>

                  {/* Result Quantity */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 text-xs text-stone-500 dark:text-stone-400">
                      {entry.quantityBefore !== null && (
                        <>
                          <span className="tabular-nums">{entry.quantityBefore.toLocaleString()}</span>
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                      <span className="tabular-nums font-medium text-stone-900 dark:text-white">
                        {entry.quantityAfter?.toLocaleString() ?? '—'}
                      </span>
                    </div>
                  </td>

                  {/* Note */}
                  <td className="py-3 px-4">
                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate max-w-[200px]" title={entry.note || ''}>
                      {entry.note || '—'}
                    </p>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-4">
                    <span className="text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap">
                      {formatDate(entry.createdAt)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-stone-200 dark:border-stone-700">
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Showing {entries.length} most recent changes
        </p>
      </div>
    </div>
  )
}
