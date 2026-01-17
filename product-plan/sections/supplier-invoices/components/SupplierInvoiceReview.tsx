import { useState } from 'react'
import type {
  SupplierInvoiceReviewProps,
  SupplierInvoiceStatus,
  AdditionalCostType,
} from '@/../product/sections/supplier-invoices/types'

// Icons
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const XCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
)

const HistoryIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const STATUS_STYLES: Record<SupplierInvoiceStatus, string> = {
  'pending': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'approved': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'rejected': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'revised': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'expired': 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
}

const STATUS_LABELS: Record<SupplierInvoiceStatus, string> = {
  'pending': 'Pending Review',
  'approved': 'Approved',
  'rejected': 'Rejected',
  'revised': 'Revised',
  'expired': 'Expired',
}

const COST_TYPE_LABELS: Record<AdditionalCostType, string> = {
  'handling': 'Handling Fee',
  'rush': 'Rush Fee',
  'tooling': 'Tooling',
  'shipping': 'Shipping',
  'inspection': 'Inspection',
  'other': 'Other',
}

const COST_TYPE_STYLES: Record<AdditionalCostType, string> = {
  'handling': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'rush': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'tooling': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'shipping': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'inspection': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'other': 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
}

type ActionType = 'approve' | 'reject-revision' | 'reject-final' | null

export function SupplierInvoiceReview({
  invoice,
  purchaseOrder: _purchaseOrder,
  onClose,
  onApprove,
  onRejectForRevision,
  onRejectFinal,
  onViewPriceHistory,
}: SupplierInvoiceReviewProps) {
  // purchaseOrder available for future use in rendering PO context
  void _purchaseOrder
  const [activeAction, setActiveAction] = useState<ActionType>(null)
  const [notes, setNotes] = useState('')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return 'text-red-600 dark:text-red-400'
    if (variance < 0) return 'text-emerald-600 dark:text-emerald-400'
    return 'text-slate-600 dark:text-slate-400'
  }

  const handleConfirmAction = () => {
    if (activeAction === 'approve') {
      onApprove?.(notes || null)
    } else if (activeAction === 'reject-revision') {
      onRejectForRevision?.(notes)
    } else if (activeAction === 'reject-final') {
      onRejectFinal?.(notes)
    }
    setActiveAction(null)
    setNotes('')
  }

  const cancelAction = () => {
    setActiveAction(null)
    setNotes('')
  }

  const isPending = invoice.status === 'pending'

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-white dark:bg-slate-800 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {invoice.poNumber}
                </h2>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[invoice.status]}`}>
                  {STATUS_LABELS[invoice.status]}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {invoice.supplierName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <XIcon />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Submission Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Submitted By</p>
                <p className="mt-1 text-sm text-slate-900 dark:text-white">{invoice.submittedByName || '-'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{invoice.submittedByEmail || ''}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Submitted</p>
                <p className="mt-1 text-sm text-slate-900 dark:text-white">{formatDate(invoice.submittedAt)}</p>
              </div>
            </div>

            {/* Line Items Comparison */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Line Items Comparison</h3>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Product</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Qty</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Original</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Submitted</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Variance</th>
                      <th className="px-3 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {invoice.lineItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-3 py-2">
                          <p className="font-medium text-slate-900 dark:text-white">{item.sku}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{item.productName}</p>
                          {item.notes && (
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 italic">"{item.notes}"</p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-600 dark:text-slate-300">
                          {item.quantity.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">
                          {formatCurrency(item.originalUnitCost)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-900 dark:text-white">
                          {formatCurrency(item.submittedUnitCost)}
                        </td>
                        <td className={`px-3 py-2 text-right font-medium ${getVarianceColor(item.variance)}`}>
                          {item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance)}
                          <span className="text-xs ml-1">
                            ({item.variancePercent >= 0 ? '+' : ''}{item.variancePercent.toFixed(1)}%)
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => onViewPriceHistory?.(item.poLineItemId)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            title="View price history"
                          >
                            <HistoryIcon />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Costs */}
            {invoice.additionalCosts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Additional Costs</h3>
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700/50">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Type</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Description</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {invoice.additionalCosts.map((cost) => (
                        <tr key={cost.id}>
                          <td className="px-3 py-2">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${COST_TYPE_STYLES[cost.type]}`}>
                              {COST_TYPE_LABELS[cost.type]}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-900 dark:text-white">
                            {cost.description}
                            {cost.perUnit && (
                              <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">(per unit)</span>
                            )}
                            {cost.notes && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-0.5">"{cost.notes}"</p>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-medium text-slate-900 dark:text-white">
                            {formatCurrency(cost.calculatedTotal || cost.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Totals Summary */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Totals Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Original Subtotal</span>
                  <span className="text-slate-900 dark:text-white">{formatCurrency(invoice.originalSubtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Submitted Subtotal</span>
                  <span className="text-slate-900 dark:text-white">{formatCurrency(invoice.submittedSubtotal)}</span>
                </div>
                {invoice.additionalCostsTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Additional Costs</span>
                    <span className="text-slate-900 dark:text-white">+ {formatCurrency(invoice.additionalCostsTotal)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-slate-900 dark:text-white">Submitted Total</span>
                    <span className="text-slate-900 dark:text-white">{formatCurrency(invoice.submittedTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-600 dark:text-slate-400">Variance</span>
                    <span className={`font-semibold ${getVarianceColor(invoice.variance)}`}>
                      {invoice.variance >= 0 ? '+' : ''}{formatCurrency(invoice.variance)}
                      <span className="font-normal ml-1">
                        ({invoice.variancePercent >= 0 ? '+' : ''}{invoice.variancePercent.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Supplier Notes */}
            {invoice.supplierNotes && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Supplier Notes</h3>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {invoice.supplierNotes}
                  </p>
                </div>
              </div>
            )}

            {/* Revision History */}
            {invoice.revisionNumber > 1 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Revision History</h3>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <RefreshIcon />
                  <span>This is revision #{invoice.revisionNumber}</span>
                  {invoice.previousInvoiceId && (
                    <button className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                      View previous
                      <ExternalLinkIcon />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Review Notes (if already reviewed) */}
            {invoice.reviewNotes && invoice.status !== 'pending' && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Review Notes</h3>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {invoice.reviewNotes}
                  </p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    — {invoice.reviewedByUserName}, {formatDate(invoice.reviewedAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        {isPending && !activeAction && (
          <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveAction('approve')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
              >
                <CheckIcon />
                Approve
              </button>
              <button
                onClick={() => setActiveAction('reject-revision')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
              >
                <RefreshIcon />
                Request Revision
              </button>
              <button
                onClick={() => setActiveAction('reject-final')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                <XCircleIcon />
                Reject
              </button>
            </div>
          </div>
        )}

        {/* Action Confirmation */}
        {activeAction && (
          <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-900">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {activeAction === 'approve' && 'Confirm Approval'}
                  {activeAction === 'reject-revision' && 'Request Revision'}
                  {activeAction === 'reject-final' && 'Confirm Rejection'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeAction === 'approve' && 'This will update the PO line items with the submitted prices.'}
                  {activeAction === 'reject-revision' && 'The supplier will receive a new link to submit revised prices.'}
                  {activeAction === 'reject-final' && 'This invoice will be closed. No further revisions allowed.'}
                </p>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={activeAction === 'approve' ? 'Add notes (optional)...' : 'Add notes explaining the reason...'}
                rows={2}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required={activeAction !== 'approve'}
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleConfirmAction}
                  disabled={activeAction !== 'approve' && !notes.trim()}
                  className={`flex-1 px-4 py-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    activeAction === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : activeAction === 'reject-revision'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  Confirm
                </button>
                <button
                  onClick={cancelAction}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
