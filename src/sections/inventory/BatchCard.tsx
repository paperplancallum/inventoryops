'use client'

import { Package, Calendar, Truck, AlertTriangle, Paperclip, MoreVertical } from 'lucide-react'
import type { Batch, BatchStage, PipelineStage, AmazonReconciliation } from './types'

interface BatchCardProps {
  batch: Batch
  reconciliation?: AmazonReconciliation
  onView?: () => void
  onMoveBatch?: (newStage: BatchStage) => void
  allStages: PipelineStage[]
}

export function BatchCard({ batch, reconciliation, onView, onMoveBatch, allStages }: BatchCardProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const hasDiscrepancy = reconciliation?.status === 'discrepancy'
  const isOldBatch = batch.notes.toLowerCase().includes('fifo') || batch.notes.toLowerCase().includes('older')

  return (
    <div
      onClick={onView}
      className={`
        group bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700
        p-3 cursor-pointer transition-all duration-200
        hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600
        ${hasDiscrepancy ? 'ring-2 ring-red-200 dark:ring-red-900' : ''}
        ${isOldBatch ? 'border-l-4 border-l-amber-400' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded">
            <Package className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white font-mono">
              {batch.sku}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
              {batch.productName}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation() }}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Quantity & Value */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-semibold text-slate-900 dark:text-white">
            {batch.quantity.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">units</span>
        </div>
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {formatCurrency(batch.totalCost)}
        </span>
      </div>

      {/* Supplier & PO */}
      <div className="text-xs text-slate-500 dark:text-slate-400 mb-3 space-y-1">
        <p className="truncate">{batch.supplierName}</p>
        <p className="font-mono text-indigo-600 dark:text-indigo-400">{batch.poNumber}</p>
      </div>

      {/* Dates */}
      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>Ordered {formatDate(batch.orderedDate)}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs mb-3">
        <div className="flex items-center gap-1">
          <Truck className="w-3.5 h-3.5" />
          <span className={batch.actualArrival ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}>
            {batch.actualArrival ? `Arrived ${formatDate(batch.actualArrival)}` : `ETA ${formatDate(batch.expectedArrival)}`}
          </span>
        </div>
      </div>

      {/* Indicators */}
      <div className="flex items-center gap-2 flex-wrap">
        {batch.attachments.length > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs text-slate-600 dark:text-slate-300">
            <Paperclip className="w-3.5 h-3.5" />
            {batch.attachments.length}
          </span>
        )}
        {hasDiscrepancy && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 rounded text-xs text-red-700 dark:text-red-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            {reconciliation?.discrepancy} units
          </span>
        )}
        {isOldBatch && (
          <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded text-xs text-amber-700 dark:text-amber-400">
            FIFO
          </span>
        )}
      </div>

      {/* Notes preview */}
      {batch.notes && !isOldBatch && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic">
          {batch.notes}
        </p>
      )}

      {/* Stage move dropdown (visible on hover) */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
        <select
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onMoveBatch?.(e.target.value as BatchStage)}
          value={batch.stage}
          className="w-full text-xs py-1.5 px-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {allStages.map(stage => (
            <option key={stage.id} value={stage.id}>
              Move to: {stage.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
