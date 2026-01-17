'use client'

import {
  X,
  Calendar,
  Package,
  DollarSign,
  Truck,
  FileText,
  Paperclip,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import type { Batch, BatchStage, PipelineStage, AmazonReconciliation } from './types'

interface BatchDetailModalProps {
  isOpen: boolean
  onClose: () => void
  batch: Batch | null
  pipelineStages: PipelineStage[]
  reconciliation?: AmazonReconciliation
  onEdit?: () => void
}

const stageColors: Record<BatchStage, { bg: string; text: string; dot: string }> = {
  ordered: {
    bg: 'bg-slate-100 dark:bg-slate-700',
    text: 'text-slate-700 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
  factory: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  inspected: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
  ready_to_ship: {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    text: 'text-teal-700 dark:text-teal-300',
    dot: 'bg-teal-500',
  },
  'in-transit': {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  warehouse: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-700 dark:text-cyan-300',
    dot: 'bg-cyan-500',
  },
  amazon: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    dot: 'bg-green-500',
  },
}

export function BatchDetailModal({
  isOpen,
  onClose,
  batch,
  pipelineStages,
  reconciliation,
  onEdit,
}: BatchDetailModalProps) {
  if (!isOpen || !batch) return null

  const stageStyle = stageColors[batch.stage]
  const stageLabel = pipelineStages.find((s) => s.id === batch.stage)?.label || batch.stage

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const hasDiscrepancy = reconciliation?.status === 'discrepancy'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative w-full max-w-3xl bg-white dark:bg-slate-800 rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-mono">
                  {batch.sku}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{batch.productName}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${stageStyle.bg} ${stageStyle.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${stageStyle.dot}`} />
                {stageLabel}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                  <Package className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Quantity</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {batch.quantity.toLocaleString()} units
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Total Cost</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(batch.totalCost)}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Ordered</span>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {formatDate(batch.orderedDate)}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                  <Truck className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">
                    {batch.actualArrival ? 'Arrived' : 'ETA'}
                  </span>
                </div>
                <p
                  className={`text-sm font-medium ${batch.actualArrival ? 'text-green-600 dark:text-green-400' : 'text-slate-900 dark:text-white'}`}
                >
                  {formatDate(batch.actualArrival || batch.expectedArrival)}
                </p>
              </div>
            </div>

            {/* Supplier & PO Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Supplier
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{batch.supplierName}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                  Purchase Order
                </h4>
                <p className="text-sm font-mono text-indigo-600 dark:text-indigo-400">
                  {batch.poNumber}
                </p>
                {batch.shipmentId && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Shipment: {batch.shipmentId}
                  </p>
                )}
              </div>
            </div>

            {/* Unit Cost Breakdown */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                Cost Breakdown
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Unit Cost</span>
                  <span className="text-slate-900 dark:text-white">
                    {formatCurrency(batch.unitCost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Quantity</span>
                  <span className="text-slate-900 dark:text-white">
                    × {batch.quantity.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-600">
                  <span className="font-medium text-slate-900 dark:text-white">Total</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(batch.totalCost)}
                  </span>
                </div>
              </div>
            </div>

            {/* Amazon Reconciliation (if applicable) */}
            {batch.stage === 'amazon' && reconciliation && (
              <div
                className={`rounded-lg p-4 ${hasDiscrepancy ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {hasDiscrepancy ? (
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                  <h4
                    className={`text-sm font-medium ${hasDiscrepancy ? 'text-red-900 dark:text-red-300' : 'text-green-900 dark:text-green-300'}`}
                  >
                    Amazon Reconciliation
                  </h4>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs uppercase">Expected</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {reconciliation.expectedQuantity.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs uppercase">Received</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {reconciliation.amazonQuantity.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs uppercase">
                      Discrepancy
                    </p>
                    <p
                      className={`font-medium ${hasDiscrepancy ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}
                    >
                      {reconciliation.discrepancy === 0
                        ? 'None'
                        : `${reconciliation.discrepancy} units`}
                    </p>
                  </div>
                </div>
                {reconciliation.notes && (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 italic">
                    {reconciliation.notes}
                  </p>
                )}
              </div>
            )}

            {/* Attachments */}
            {batch.attachments.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Attachments ({batch.attachments.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {batch.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                    >
                      <div
                        className={`w-8 h-8 rounded flex items-center justify-center text-xs font-medium ${attachment.type === 'photo' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}
                      >
                        {attachment.type === 'photo' ? 'IMG' : 'PDF'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDateTime(attachment.uploadedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {batch.notes && (
              <div>
                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{batch.notes}</p>
              </div>
            )}

            {/* Stage History */}
            <div>
              <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                Stage History
              </h4>
              <div className="space-y-3">
                {batch.stageHistory.map((entry, index) => {
                  const entryStageStyle = stageColors[entry.stage]
                  const entryLabel =
                    pipelineStages.find((s) => s.id === entry.stage)?.label || entry.stage
                  return (
                    <div key={index} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${entryStageStyle.dot}`} />
                        {index < batch.stageHistory.length - 1 && (
                          <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-600 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${entryStageStyle.text}`}>
                            {entryLabel}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDateTime(entry.date)}
                          </span>
                        </div>
                        {entry.note && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                            {entry.note}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
            {onEdit && (
              <button
                onClick={() => {
                  onClose()
                  onEdit()
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Edit Batch
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
