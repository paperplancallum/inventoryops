'use client'

import { useState } from 'react'
import { X, Calendar, Package, DollarSign, Clock, FileText, AlertTriangle, Boxes, ArrowRightLeft, MapPin, Send, RefreshCw, Loader2, FileCheck } from 'lucide-react'
import type { PurchaseOrder, POStatus, POStatusOption } from './types'
import type { Batch } from '@/sections/inventory/types'

interface PODetailModalProps {
  isOpen: boolean
  onClose: () => void
  purchaseOrder: PurchaseOrder | null
  poStatuses: POStatusOption[]
  linkedBatches?: Batch[]
  loadingBatches?: boolean
  onEdit?: () => void
  onUpdateStatus?: (id: string, newStatus: POStatus) => Promise<void>
  onCreateTransfer?: (batchIds: string[]) => void
  onSendToSupplier?: (id: string, customMessage?: string) => Promise<void>
  onResendToSupplier?: (id: string) => Promise<void>
  onReviewInvoice?: (poId: string) => void
  updating?: boolean
  sendingToSupplier?: boolean
}

// Status transitions: what statuses can transition to what
// Includes both forward progression and backtracking options
const STATUS_TRANSITIONS: Record<POStatus, { status: POStatus; label: string; primary?: boolean; variant?: 'forward' | 'back' | 'cancel' }[]> = {
  draft: [
    // Primary action is "Send to Supplier" button, not status transition
    { status: 'cancelled', label: 'Cancel Order', variant: 'cancel' }
  ],
  sent: [
    { status: 'awaiting_invoice', label: 'Awaiting Invoice', primary: true, variant: 'forward' },
    { status: 'draft', label: 'Back to Draft', variant: 'back' },
    { status: 'cancelled', label: 'Cancel Order', variant: 'cancel' }
  ],
  awaiting_invoice: [
    { status: 'invoice_received', label: 'Invoice Received', primary: true, variant: 'forward' },
    { status: 'sent', label: 'Back to Sent', variant: 'back' },
    { status: 'cancelled', label: 'Cancel Order', variant: 'cancel' }
  ],
  invoice_received: [
    { status: 'confirmed', label: 'Confirm Order', primary: true, variant: 'forward' },
    { status: 'awaiting_invoice', label: 'Back to Awaiting', variant: 'back' },
    { status: 'cancelled', label: 'Cancel Order', variant: 'cancel' }
  ],
  confirmed: [
    { status: 'production_complete', label: 'Production Complete', primary: true, variant: 'forward' },
    { status: 'invoice_received', label: 'Back to Invoice Received', variant: 'back' },
    { status: 'cancelled', label: 'Cancel Order', variant: 'cancel' }
  ],
  'production_complete': [
    { status: 'ready-to-ship', label: 'Ready to Ship', primary: true, variant: 'forward' },
    { status: 'confirmed', label: 'Back to Confirmed', variant: 'back' }
  ],
  'ready-to-ship': [
    { status: 'received', label: 'Mark as Received', primary: true, variant: 'forward' },
    { status: 'partially-received', label: 'Partial Receipt', variant: 'forward' },
    { status: 'production_complete', label: 'Back to Production Complete', variant: 'back' }
  ],
  'partially-received': [
    { status: 'received', label: 'Mark as Received', primary: true, variant: 'forward' },
    { status: 'production_complete', label: 'Back to Production Complete', variant: 'back' }
  ],
  received: [
    { status: 'production_complete', label: 'Revert to Production Complete', variant: 'back' },
    { status: 'partially-received', label: 'Revert to Partial', variant: 'back' }
  ],
  cancelled: [
    { status: 'draft', label: 'Reopen as Draft', variant: 'back' }
  ]
}

const statusColors: Record<POStatus, { bg: string; text: string; dot: string }> = {
  draft: {
    bg: 'bg-slate-100 dark:bg-slate-700',
    text: 'text-slate-700 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
  sent: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  awaiting_invoice: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    dot: 'bg-yellow-500',
  },
  invoice_received: {
    bg: 'bg-lime-100 dark:bg-lime-900/30',
    text: 'text-lime-700 dark:text-lime-300',
    dot: 'bg-lime-500',
  },
  confirmed: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    dot: 'bg-indigo-500',
  },
  'production_complete': {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    text: 'text-teal-700 dark:text-teal-300',
    dot: 'bg-teal-500',
  },
  'ready-to-ship': {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-700 dark:text-cyan-300',
    dot: 'bg-cyan-500',
  },
  'partially-received': {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  received: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
  },
}

// Stage badge colors
const stageBadgeColors: Record<string, { bg: string; text: string }> = {
  ordered: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300' },
  factory: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300' },
  inspected: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  ready_to_ship: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300' },
  'in-transit': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  warehouse: { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-700 dark:text-teal-300' },
  amazon: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' },
}

const stageLabels: Record<string, string> = {
  ordered: 'Ordered',
  factory: 'At Factory',
  inspected: 'Inspected',
  ready_to_ship: 'Ready to Ship',
  'in-transit': 'In Transit',
  warehouse: 'Warehouse',
  amazon: 'Amazon',
}

export function PODetailModal({
  isOpen,
  onClose,
  purchaseOrder,
  poStatuses,
  linkedBatches = [],
  loadingBatches = false,
  onEdit,
  onUpdateStatus,
  onCreateTransfer,
  onSendToSupplier,
  onResendToSupplier,
  onReviewInvoice,
  updating = false,
  sendingToSupplier = false,
}: PODetailModalProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([])

  if (!isOpen || !purchaseOrder) return null

  const availableTransitions = STATUS_TRANSITIONS[purchaseOrder.status]

  const handleStatusChange = async (newStatus: POStatus) => {
    if (newStatus === 'cancelled') {
      setShowCancelConfirm(true)
      return
    }
    await onUpdateStatus?.(purchaseOrder.id, newStatus)
  }

  const handleConfirmCancel = async () => {
    await onUpdateStatus?.(purchaseOrder.id, 'cancelled')
    setShowCancelConfirm(false)
  }

  const statusStyle = statusColors[purchaseOrder.status]
  const statusLabel =
    poStatuses.find((s) => s.id === purchaseOrder.status)?.label || purchaseOrder.status

  const formatDate = (dateStr: string) => {
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative w-full max-w-5xl bg-white dark:bg-slate-800 rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {purchaseOrder.poNumber}
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                {statusLabel}
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
                  <span className="text-xs font-medium uppercase">Supplier</span>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {purchaseOrder.supplierName}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Order Date</span>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {formatDate(purchaseOrder.orderDate)}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Expected</span>
                </div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {formatDate(purchaseOrder.expectedDate)}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Total</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  ${purchaseOrder.total.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                Line Items ({purchaseOrder.lineItems.length})
              </h3>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-600">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        SKU
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        Product
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        Qty
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        Unit Cost
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                    {purchaseOrder.lineItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm font-mono text-slate-600 dark:text-slate-400">
                          {item.sku}
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-900 dark:text-white">
                          {item.productName}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-slate-600 dark:text-slate-400">
                          {item.quantity.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-sm text-right text-slate-600 dark:text-slate-400">
                          ${item.unitCost.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-sm text-right font-medium text-slate-900 dark:text-white">
                          ${item.subtotal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 dark:border-slate-500">
                      <td
                        colSpan={4}
                        className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-white text-right"
                      >
                        Total
                      </td>
                      <td className="px-4 py-2 text-sm font-semibold text-right text-slate-900 dark:text-white">
                        ${purchaseOrder.total.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Details */}
            {(purchaseOrder.paymentTerms || purchaseOrder.notes) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {purchaseOrder.paymentTerms && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                      Payment Terms
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {purchaseOrder.paymentTerms}
                    </p>
                  </div>
                )}
                {purchaseOrder.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Notes
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {purchaseOrder.notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Status History */}
            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                Status History
              </h3>
              <div className="space-y-3">
                {purchaseOrder.statusHistory.map((entry, index) => {
                  const entryStatusStyle = statusColors[entry.status]
                  const entryLabel =
                    poStatuses.find((s) => s.id === entry.status)?.label || entry.status
                  return (
                    <div key={index} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${entryStatusStyle.dot}`}
                        />
                        {index < purchaseOrder.statusHistory.length - 1 && (
                          <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-600 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${entryStatusStyle.text}`}
                          >
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

            {/* Inventory / Batches Section - Show for production_complete and later */}
            {['production_complete', 'partially-received', 'received'].includes(purchaseOrder.status) && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <Boxes className="w-4 h-4" />
                    Inventory Batches ({linkedBatches.length})
                  </h3>
                  {onCreateTransfer && linkedBatches.length > 0 && (
                    <button
                      onClick={() => {
                        const batchIds = selectedBatchIds.length > 0
                          ? selectedBatchIds
                          : linkedBatches.map(b => b.id)
                        onCreateTransfer(batchIds)
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      Create Transfer
                      {selectedBatchIds.length > 0 && ` (${selectedBatchIds.length})`}
                    </button>
                  )}
                </div>

                {loadingBatches ? (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                    <span className="ml-2 text-sm text-slate-500">Loading batches...</span>
                  </div>
                ) : linkedBatches.length > 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-600">
                          <th className="px-3 py-2 text-left w-8">
                            <input
                              type="checkbox"
                              checked={selectedBatchIds.length === linkedBatches.length && linkedBatches.length > 0}
                              onChange={(e) => {
                                setSelectedBatchIds(e.target.checked ? linkedBatches.map(b => b.id) : [])
                              }}
                              className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                            />
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                            Batch
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                            Product
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                            Qty
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                            Stage
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                        {linkedBatches.map((batch) => {
                          const stageStyle = stageBadgeColors[batch.stage] || stageBadgeColors.ordered
                          return (
                            <tr key={batch.id} className="hover:bg-slate-100 dark:hover:bg-slate-700/70">
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={selectedBatchIds.includes(batch.id)}
                                  onChange={(e) => {
                                    setSelectedBatchIds(prev =>
                                      e.target.checked
                                        ? [...prev, batch.id]
                                        : prev.filter(id => id !== batch.id)
                                    )
                                  }}
                                  className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                                  {batch.batchNumber}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <div>
                                  <span className="text-sm text-slate-900 dark:text-white">
                                    {batch.productName}
                                  </span>
                                  <span className="block text-xs text-slate-500 font-mono">
                                    {batch.sku}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                  {batch.quantity.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${stageStyle.bg} ${stageStyle.text}`}>
                                  <MapPin className="w-3 h-3" />
                                  {stageLabels[batch.stage] || batch.stage}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                    <Boxes className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No inventory batches linked to this PO yet.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Batches are created when goods are received at the factory.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between gap-3">
              {/* Left side: Secondary actions */}
              <div className="flex items-center gap-3">
                {onUpdateStatus && availableTransitions.filter(t => t.variant === 'back').map(transition => (
                  <button
                    key={transition.status}
                    onClick={() => handleStatusChange(transition.status)}
                    disabled={updating}
                    className="px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? 'Updating...' : transition.label}
                  </button>
                ))}
                {onUpdateStatus && availableTransitions.filter(t => t.variant === 'cancel').map(transition => (
                  <button
                    key={transition.status}
                    onClick={() => handleStatusChange(transition.status)}
                    disabled={updating}
                    className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? 'Updating...' : transition.label}
                  </button>
                ))}
              </div>

              {/* Right side: Primary actions */}
              <div className="flex items-center gap-3">
                {/* Primary status transition */}
                {onUpdateStatus && availableTransitions.filter(t => t.primary).map(transition => (
                  <button
                    key={transition.status}
                    onClick={() => handleStatusChange(transition.status)}
                    disabled={updating}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? 'Updating...' : transition.label}
                  </button>
                ))}
                {/* Send to Supplier - only for draft status */}
                {onSendToSupplier && purchaseOrder.status === 'draft' && (
                  <button
                    onClick={() => onSendToSupplier(purchaseOrder.id)}
                    disabled={sendingToSupplier}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingToSupplier ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {sendingToSupplier ? 'Sending...' : 'Send to Supplier'}
                  </button>
                )}
                {/* Resend to Supplier - only for awaiting_invoice status */}
                {onResendToSupplier && purchaseOrder.status === 'awaiting_invoice' && (
                  <button
                    onClick={() => onResendToSupplier(purchaseOrder.id)}
                    disabled={sendingToSupplier}
                    className="px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingToSupplier ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    {sendingToSupplier ? 'Sending...' : 'Resend Reminder'}
                  </button>
                )}
                {/* Review Invoice - only for invoice_received status */}
                {onReviewInvoice && purchaseOrder.status === 'invoice_received' && (
                  <button
                    onClick={() => onReviewInvoice(purchaseOrder.id)}
                    className="px-4 py-2 text-sm font-medium text-white bg-lime-600 rounded-lg hover:bg-lime-700 transition-colors flex items-center gap-2"
                  >
                    <FileCheck className="w-4 h-4" />
                    Review Invoice
                  </button>
                )}
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
                    Edit PO
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cancel Confirmation Dialog */}
          {showCancelConfirm && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 m-4 max-w-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Cancel Order?
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {purchaseOrder.poNumber}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  This action cannot be undone. The purchase order will be marked as cancelled.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    disabled={updating}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    Keep Order
                  </button>
                  <button
                    onClick={handleConfirmCancel}
                    disabled={updating}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {updating ? 'Cancelling...' : 'Yes, Cancel Order'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
