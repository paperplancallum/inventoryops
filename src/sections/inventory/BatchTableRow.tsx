'use client'

import { Eye, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import type { Batch, BatchStage, PipelineStage, AmazonReconciliation } from './types'

interface BatchTableRowProps {
  batch: Batch
  stages: PipelineStage[]
  reconciliation?: AmazonReconciliation
  allocatedQuantity?: number
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onMoveBatch?: (newStage: BatchStage) => void
}

const stageColors: Record<BatchStage, { bg: string; text: string; dot: string }> = {
  ordered: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
  factory: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  inspected: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  ready_to_ship: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-500' },
  'in-transit': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  warehouse: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-500' },
  amazon: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
}

export function BatchTableRow({ batch, stages, reconciliation, allocatedQuantity, onView, onEdit, onDelete, onMoveBatch }: BatchTableRowProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const colors = stageColors[batch.stage]
  const hasDiscrepancy = reconciliation?.status === 'discrepancy'
  const isOldBatch = batch.notes.toLowerCase().includes('fifo') || batch.notes.toLowerCase().includes('older')

  return (
    <tr className={`
      group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors
      ${hasDiscrepancy ? 'bg-red-50/50 dark:bg-red-900/10' : ''}
    `}>
      {/* SKU */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {isOldBatch && (
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" title="FIFO priority" />
          )}
          <span className="text-sm font-mono font-medium text-slate-900 dark:text-white">
            {batch.sku}
          </span>
        </div>
      </td>

      {/* Product */}
      <td className="px-4 py-3">
        <p className="text-sm text-slate-700 dark:text-slate-200 max-w-[200px] truncate">
          {batch.productName}
        </p>
      </td>

      {/* Quantity - shows available (total - draft) as main number */}
      <td className="px-4 py-3">
        <div className="flex flex-col">
          {(() => {
            const allocated = allocatedQuantity || 0
            const available = batch.quantity - allocated
            const hasDraft = allocated > 0
            return (
              <>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${
                    available <= 0
                      ? 'text-slate-400 dark:text-slate-500'
                      : 'text-slate-900 dark:text-white'
                  }`}>
                    {available.toLocaleString()}
                  </span>
                  {hasDraft && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {hasDraft ? 'available' : 'units'}
                    </span>
                  )}
                  {hasDiscrepancy && (
                    <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {reconciliation?.discrepancy}
                    </span>
                  )}
                </div>
                {hasDraft && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    {allocated.toLocaleString()} in draft
                  </span>
                )}
              </>
            )
          })()}
        </div>
      </td>

      {/* Stage */}
      <td className="px-4 py-3">
        <select
          value={batch.stage}
          onChange={(e) => onMoveBatch?.(e.target.value as BatchStage)}
          className={`
            appearance-none px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer
            border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1
            ${colors.bg} ${colors.text}
          `}
        >
          {stages.map(stage => (
            <option key={stage.id} value={stage.id}>{stage.label}</option>
          ))}
        </select>
      </td>

      {/* Supplier */}
      <td className="px-4 py-3">
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-[150px] truncate">
          {batch.supplierName}
        </p>
      </td>

      {/* Batch / PO */}
      <td className="px-4 py-3">
        <div>
          <span className="text-sm font-mono font-medium text-slate-900 dark:text-white">
            {batch.batchNumber}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 block">
            {batch.poNumber}
          </span>
        </div>
      </td>

      {/* ETA / Arrival */}
      <td className="px-4 py-3">
        <span className={`text-sm ${batch.actualArrival ? 'text-green-600 dark:text-green-400' : 'text-slate-500 dark:text-slate-400'}`}>
          {batch.actualArrival ? formatDate(batch.actualArrival) : formatDate(batch.expectedArrival)}
        </span>
      </td>

      {/* Cost */}
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {formatCurrency(batch.totalCost)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onView}
            className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
            title="Edit batch"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Delete batch"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}
