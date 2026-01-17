import { useState, useRef } from 'react'
import type { PurchaseOrder, POStatus, SupplierInvoiceStatus } from '@/../product/sections/purchase-orders/types'
import type { InspectionAgent } from '@/../product/sections/inspections/types'
import type { SupplierInvoice } from '@/../product/sections/supplier-invoices/types'
import type { GeneratedDocument } from '@/../product/sections/documents/types'
import { MessageThread } from './MessageThread'
import { MessageComposer } from './MessageComposer'
import { ScheduleInspectionModal } from './ScheduleInspectionModal'
import { SupplierInvoiceReview } from '@/sections/supplier-invoices/components/SupplierInvoiceReview'
import { DocumentHistoryPanel } from '@/components/DocumentHistoryPanel'

interface PODetailProps {
  po: PurchaseOrder
  agents?: InspectionAgent[]
  /** Supplier invoice data if there's a pending/approved submission */
  supplierInvoice?: SupplierInvoice | null
  /** Whether a product invoice already exists for this PO */
  hasProductInvoice?: boolean
  /** Product invoice ID if it exists (for viewing) */
  productInvoiceId?: string | null
  /** Generated documents for this PO (for document history) */
  documents?: GeneratedDocument[]
  onClose: () => void
  onEdit?: () => void
  onScheduleInspection?: (poId: string, agentId: string, date: string, notes?: string) => void
  onMarkInspectionNotNeeded?: (poId: string) => void
  onViewInspection?: (inspectionId: string) => void
  onSendMessage?: (poId: string, content: string, attachments: File[]) => void
  onAddNote?: (poId: string, content: string) => void
  /** Called when user wants to send invoice request to supplier */
  onSendInvoiceRequest?: (poId: string) => void
  /** Called when user approves a supplier invoice */
  onApproveInvoice?: (invoiceId: string, notes?: string) => void
  /** Called when user rejects for revision */
  onRejectInvoiceForRevision?: (invoiceId: string, notes: string) => void
  /** Called when user rejects finally */
  onRejectInvoiceFinal?: (invoiceId: string, notes: string) => void
  /** Called when user wants to create a product invoice */
  onCreateInvoice?: (poId: string) => void
  /** Called when user wants to view the existing product invoice */
  onViewInvoice?: (invoiceId: string) => void
  /** Called when user wants to generate a PO PDF */
  onGeneratePDF?: (poId: string) => void
  /** Called when user wants to download a document */
  onDownloadDocument?: (documentId: string) => void
}

// Icons
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ClipboardCheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const XCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const MinusCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const DocumentTextIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const SendIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CurrencyDollarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
)

const statusColors: Record<POStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  confirmed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
  'partially-received': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  received: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
}

const statusLabels: Record<POStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  confirmed: 'Confirmed',
  'partially-received': 'Partially Received',
  received: 'Received',
  cancelled: 'Cancelled',
}

const statusDotColors: Record<POStatus, string> = {
  draft: 'bg-slate-400',
  sent: 'bg-blue-500',
  confirmed: 'bg-indigo-500',
  'partially-received': 'bg-amber-500',
  received: 'bg-emerald-500',
  cancelled: 'bg-red-500',
}

const invoiceStatusColors: Record<SupplierInvoiceStatus, string> = {
  'none': 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  'pending-submission': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'pending-review': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'approved': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'rejected': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const invoiceStatusLabels: Record<SupplierInvoiceStatus, string> = {
  'none': 'Not Requested',
  'pending-submission': 'Awaiting Supplier',
  'pending-review': 'Pending Review',
  'approved': 'Prices Confirmed',
  'rejected': 'Rejected',
}

export function PODetail({
  po,
  agents = [],
  supplierInvoice,
  hasProductInvoice = false,
  productInvoiceId,
  documents = [],
  onClose,
  onEdit,
  onScheduleInspection,
  onMarkInspectionNotNeeded,
  onViewInspection,
  onSendMessage,
  onAddNote,
  onSendInvoiceRequest,
  onApproveInvoice,
  onRejectInvoiceForRevision,
  onRejectInvoiceFinal,
  onCreateInvoice,
  onViewInvoice,
  onGeneratePDF,
  onDownloadDocument,
}: PODetailProps) {
  const messageCount = po.messages?.length || 0
  const [messagesExpanded, setMessagesExpanded] = useState(messageCount <= 3)
  const [showInspectionModal, setShowInspectionModal] = useState(false)
  const [showInvoiceReview, setShowInvoiceReview] = useState(false)
  const composerRef = useRef<HTMLDivElement>(null)

  const scrollToComposer = () => {
    setMessagesExpanded(true)
    setTimeout(() => {
      composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  // Sort status history by date descending (most recent first)
  const sortedHistory = [...po.statusHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Inspection status logic
  const inspectionStatus = po.inspectionStatus || 'pending'
  const showInspectionActions = po.requiresInspection &&
    inspectionStatus === 'pending' &&
    ['confirmed', 'partially-received', 'received'].includes(po.status)

  // Render inspection UI based on state
  const renderInspectionUI = () => {
    // Case 1: Inspection not required for this PO
    if (!po.requiresInspection) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-full">
          <MinusCircleIcon />
          Inspection Not Required
        </span>
      )
    }

    // Case 2: Inspection scheduled
    if (inspectionStatus === 'scheduled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-900/30 rounded-full">
          <CheckCircleIcon />
          Inspection Scheduled
          {po.inspectionId && onViewInspection && (
            <button
              onClick={() => onViewInspection(po.inspectionId!)}
              className="ml-1 underline hover:no-underline"
            >
              View
            </button>
          )}
        </span>
      )
    }

    // Case 3: Marked as not needed
    if (inspectionStatus === 'not-needed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-full">
          <XCircleIcon />
          No Inspection
        </span>
      )
    }

    // Case 4: Pending decision (requiresInspection = true, status = pending)
    if (showInspectionActions) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInspectionModal(true)}
            className="px-3 py-1.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ClipboardCheckIcon />
            Schedule Inspection
          </button>
          <button
            onClick={() => onMarkInspectionNotNeeded?.(po.id)}
            className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Not Needed
          </button>
        </div>
      )
    }

    // Case 5: Requires inspection but PO is in early status (draft/sent)
    if (po.requiresInspection) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 rounded-full">
          <ClipboardCheckIcon />
          Inspection Required
        </span>
      )
    }

    return null
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-slate-800 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-slate-900 dark:text-white">
                {po.poNumber}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[po.status]}`}>
                {statusLabels[po.status]}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {renderInspectionUI()}
              <button
                onClick={onEdit}
                className="px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <XIcon />
              </button>
            </div>
          </div>
          {/* Supplier */}
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {po.supplierName}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Summary */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Order Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Order Date</span>
                <p className="text-slate-900 dark:text-white font-medium">{formatDate(po.orderDate)}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Expected Date</span>
                <p className="text-slate-900 dark:text-white font-medium">{formatDate(po.expectedDate)}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Received Date</span>
                <p className={`font-medium ${po.receivedDate ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                  {formatDate(po.receivedDate)}
                </p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Payment Terms</span>
                <p className="text-slate-900 dark:text-white font-medium">{po.paymentTerms}</p>
              </div>
            </div>
          </section>

          {/* Line Items */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Line Items ({po.lineItems.length})
              </h3>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {po.lineItems.reduce((sum, li) => sum + li.quantity, 0).toLocaleString()} units
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-600">
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">SKU</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Product</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Unit Cost</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                  {po.lineItems.map(item => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">{item.sku}</span>
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400 max-w-[180px] truncate" title={item.productName}>
                        {item.productName}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                        {item.quantity.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                        ${item.unitCost.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
                        ${item.subtotal.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-slate-200 dark:border-slate-600">
                  <tr>
                    <td colSpan={2} className="px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Totals</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-white">
                      {po.lineItems.reduce((sum, li) => sum + li.quantity, 0).toLocaleString()}
                    </td>
                    <td></td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-white">
                      ${po.total.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* Supplier Pricing */}
          <section className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <DocumentTextIcon />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Supplier Pricing</h3>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${invoiceStatusColors[po.supplierInvoiceStatus || 'none']}`}>
                {invoiceStatusLabels[po.supplierInvoiceStatus || 'none']}
              </span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 p-4">
              {/* No request sent yet */}
              {(!po.supplierInvoiceStatus || po.supplierInvoiceStatus === 'none') && (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                    Request price confirmation from supplier
                  </p>
                  <button
                    onClick={() => onSendInvoiceRequest?.(po.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <SendIcon />
                    Send Invoice Request
                  </button>
                </div>
              )}

              {/* Awaiting supplier submission */}
              {po.supplierInvoiceStatus === 'pending-submission' && (
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <ClockIcon />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Waiting for supplier to submit prices
                    </p>
                    {po.invoiceLinkSentAt && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Link sent {formatDate(po.invoiceLinkSentAt)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onSendInvoiceRequest?.(po.id)}
                    className="ml-auto text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Resend Link
                  </button>
                </div>
              )}

              {/* Pending review */}
              {po.supplierInvoiceStatus === 'pending-review' && supplierInvoice && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <DocumentTextIcon />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        Supplier submitted prices for review
                      </p>
                      {po.invoiceSubmittedAt && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Submitted {formatDate(po.invoiceSubmittedAt)}
                        </p>
                      )}
                    </div>
                    {supplierInvoice.variance !== 0 && (
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${supplierInvoice.variance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {supplierInvoice.variance >= 0 ? '+' : ''}{supplierInvoice.variancePercent.toFixed(1)}%
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">variance</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowInvoiceReview(true)}
                    className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Review Submission
                  </button>
                </div>
              )}

              {/* Approved */}
              {po.supplierInvoiceStatus === 'approved' && (
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircleIcon />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Prices confirmed
                    </p>
                    {po.invoiceReviewedAt && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Approved {formatDate(po.invoiceReviewedAt)}
                      </p>
                    )}
                  </div>
                  {po.invoiceVariance != null && po.invoiceVariance !== 0 && (
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${(po.invoiceVariance ?? 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {(po.invoiceVariance ?? 0) >= 0 ? '+' : ''}{po.invoiceVariancePercent?.toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">final variance</p>
                    </div>
                  )}
                </div>
              )}

              {/* Rejected */}
              {po.supplierInvoiceStatus === 'rejected' && (
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                    <XCircleIcon />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Submission rejected
                    </p>
                    {po.invoiceReviewedAt && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Rejected {formatDate(po.invoiceReviewedAt)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onSendInvoiceRequest?.(po.id)}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Request New Submission
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Product Invoice */}
          <section className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <CurrencyDollarIcon />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Product Invoice</h3>
              </div>
              {hasProductInvoice ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Invoice Created
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                  No Invoice
                </span>
              )}
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 p-4">
              {hasProductInvoice ? (
                // Invoice exists - show view button
                <div className="flex items-center gap-3 py-2">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircleIcon />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Product invoice has been created
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Total: ${po.total.toLocaleString()}
                    </p>
                  </div>
                  {productInvoiceId && onViewInvoice && (
                    <button
                      onClick={() => onViewInvoice(productInvoiceId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                    >
                      <ExternalLinkIcon />
                      View Invoice
                    </button>
                  )}
                </div>
              ) : (
                // No invoice - show create button (conditionally enabled)
                <div className="text-center py-4">
                  {['draft', 'sent'].includes(po.status) ? (
                    // PO not yet confirmed - show disabled state with explanation
                    <>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                        Create a product invoice to track payment for this order
                      </p>
                      <button
                        disabled
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 text-sm font-medium rounded-lg cursor-not-allowed"
                        title="PO must be confirmed before creating an invoice"
                      >
                        <CurrencyDollarIcon />
                        Create Invoice
                      </button>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                        PO must be confirmed to create invoice
                      </p>
                    </>
                  ) : (
                    // PO is confirmed or later - can create invoice
                    <>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                        Create a product invoice to track payment for this order
                      </p>
                      <button
                        onClick={() => onCreateInvoice?.(po.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <CurrencyDollarIcon />
                        Create Invoice
                      </button>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                        Uses supplier payment terms: {po.paymentTerms}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Document History */}
          <section>
            <DocumentHistoryPanel
              documents={documents}
              sourceType="purchase-order"
              sourceId={po.id}
              sourceRef={po.poNumber}
              onGenerateNew={() => onGeneratePDF?.(po.id)}
              onDownloadDocument={onDownloadDocument}
            />
          </section>

          {/* Status History */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Status History</h3>
            <div className="space-y-3">
              {sortedHistory.map((entry, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${statusDotColors[entry.status]}`} />
                    {index < sortedHistory.length - 1 && (
                      <div className="w-px h-full bg-slate-200 dark:bg-slate-600 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {statusLabels[entry.status]}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
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
              ))}
            </div>
          </section>

          {/* Messages */}
          <section className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            {/* Collapsible header */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50">
              <button
                onClick={() => setMessagesExpanded(!messagesExpanded)}
                className="flex-1 flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="text-slate-500 dark:text-slate-400">
                  {messagesExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                </span>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Messages {messageCount > 0 && `(${messageCount})`}
                </h3>
              </button>
              {!messagesExpanded && (
                <button
                  onClick={scrollToComposer}
                  className="flex items-center gap-1.5 px-3 py-1.5 mr-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                >
                  <PlusIcon />
                  New
                </button>
              )}
            </div>

            {/* Collapsible content */}
            {messagesExpanded && (
              <div className="border-t border-slate-200 dark:border-slate-700">
                <div className="p-4 space-y-4">
                  <MessageThread messages={po.messages || []} />
                  <div ref={composerRef}>
                    <MessageComposer
                      onSend={(content, attachments) => {
                        onSendMessage?.(po.id, content, attachments)
                      }}
                      onAddNote={(content) => {
                        onAddNote?.(po.id, content)
                      }}
                      placeholder={`Write a message to ${po.supplierName}...`}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Notes */}
          {po.notes && (
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Notes</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                {po.notes}
              </p>
            </section>
          )}
        </div>
      </div>

      {/* Schedule Inspection Modal */}
      <ScheduleInspectionModal
        isOpen={showInspectionModal}
        po={po}
        agents={agents}
        onClose={() => setShowInspectionModal(false)}
        onSchedule={(poId, agentId, date, notes) => {
          onScheduleInspection?.(poId, agentId, date, notes)
          setShowInspectionModal(false)
        }}
      />

      {/* Supplier Invoice Review */}
      {showInvoiceReview && supplierInvoice && (
        <SupplierInvoiceReview
          invoice={supplierInvoice}
          purchaseOrder={{
            poNumber: po.poNumber,
            supplierName: po.supplierName,
            orderDate: po.orderDate,
            status: po.status,
          }}
          onClose={() => setShowInvoiceReview(false)}
          onApprove={(notes) => {
            onApproveInvoice?.(supplierInvoice.id, notes || undefined)
            setShowInvoiceReview(false)
          }}
          onRejectForRevision={(notes) => {
            onRejectInvoiceForRevision?.(supplierInvoice.id, notes)
            setShowInvoiceReview(false)
          }}
          onRejectFinal={(notes) => {
            onRejectInvoiceFinal?.(supplierInvoice.id, notes)
            setShowInvoiceReview(false)
          }}
        />
      )}
    </div>
  )
}
