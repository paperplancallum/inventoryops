import { useState } from 'react'
import type { PurchaseOrder, POStatusOption, POStatus } from '@/../product/sections/purchase-orders/types'
import type { PaymentStatus } from '@/../product/sections/invoices-and-payments/types'

interface POTableRowProps {
  po: PurchaseOrder
  poStatuses: POStatusOption[]
  /** Whether a product invoice exists for this PO */
  hasInvoice?: boolean
  /** Invoice payment status if exists */
  invoiceStatus?: PaymentStatus
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  onExportPDF?: () => void
  onSendToSupplier?: () => void
  onUpdateStatus?: (newStatus: POStatus) => void
  onScheduleInspection?: () => void
  onCreateInvoice?: () => void
}

// Icons
const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
)

const DotsVerticalIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
)

const DuplicateIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
)

const SendIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const ClipboardCheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)

const CheckCircleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const XCircleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const MinusCircleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ClockIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const DocumentTextIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const DocumentPlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const ExclamationCircleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const statusColors: Record<POStatus, { bg: string; text: string; dot: string }> = {
  'draft': { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
  'sent': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  'confirmed': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
  'partially-received': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  'received': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  'cancelled': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
}

export function POTableRow({
  po,
  poStatuses,
  hasInvoice,
  invoiceStatus,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onExportPDF,
  onSendToSupplier,
  onUpdateStatus,
  onScheduleInspection,
  onCreateInvoice,
}: POTableRowProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const statusStyle = statusColors[po.status]
  const statusLabel = poStatuses.find(s => s.id === po.status)?.label || po.status

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const inspectionStatus = po.inspectionStatus || 'pending'

  const renderInvoiceStatus = () => {
    // No invoice created
    if (!hasInvoice) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
          <MinusCircleIcon className="w-3.5 h-3.5" />
          —
        </span>
      )
    }

    // Invoice exists - show payment status
    switch (invoiceStatus) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            Paid
          </span>
        )
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
            <DocumentTextIcon className="w-3.5 h-3.5" />
            Partial
          </span>
        )
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
            <ExclamationCircleIcon className="w-3.5 h-3.5" />
            Overdue
          </span>
        )
      case 'unpaid':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
            <DocumentTextIcon className="w-3.5 h-3.5" />
            Unpaid
          </span>
        )
    }
  }

  const renderInspectionStatus = () => {
    // Not required
    if (!po.requiresInspection) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
          <MinusCircleIcon className="w-3.5 h-3.5" />
          N/A
        </span>
      )
    }

    // Scheduled
    if (inspectionStatus === 'scheduled') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300">
          <CheckCircleIcon className="w-3.5 h-3.5" />
          Scheduled
        </span>
      )
    }

    // Not needed (user decided to skip)
    if (inspectionStatus === 'not-needed') {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <XCircleIcon className="w-3.5 h-3.5" />
          Skipped
        </span>
      )
    }

    // Pending decision - show different indicators based on PO status
    if (['confirmed', 'partially-received', 'received'].includes(po.status)) {
      // Ready for decision
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
          <ClockIcon className="w-3.5 h-3.5" />
          Pending
        </span>
      )
    }

    // PO not yet confirmed, inspection will be needed later
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
        <ClipboardCheckIcon className="w-3.5 h-3.5" />
        Required
      </span>
    )
  }

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      {/* PO Number */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onView}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            {po.poNumber}
          </button>
          {po.unreadCount && po.unreadCount > 0 && (
            <span
              className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full"
              title={`${po.unreadCount} unread message${po.unreadCount > 1 ? 's' : ''}`}
            >
              {po.unreadCount}
            </span>
          )}
        </div>
      </td>

      {/* Supplier */}
      <td className="px-4 py-3">
        <span className="text-sm text-slate-900 dark:text-white">{po.supplierName}</span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <div className="relative">
          <button
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
            {statusLabel}
          </button>
          {showStatusMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowStatusMenu(false)}
              />
              <div className="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[140px]">
                {poStatuses.map(status => (
                  <button
                    key={status.id}
                    onClick={() => {
                      onUpdateStatus?.(status.id)
                      setShowStatusMenu(false)
                    }}
                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 ${
                      status.id === po.status ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusColors[status.id].dot}`} />
                    {status.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </td>

      {/* Items Count */}
      <td className="px-4 py-3">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {po.lineItems.length} {po.lineItems.length === 1 ? 'item' : 'items'}
        </span>
      </td>

      {/* Inspection Status */}
      <td className="px-4 py-3">
        {renderInspectionStatus()}
      </td>

      {/* Invoice Status */}
      <td className="px-4 py-3">
        {renderInvoiceStatus()}
      </td>

      {/* Order Date */}
      <td className="px-4 py-3">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {formatDate(po.orderDate)}
        </span>
      </td>

      {/* Expected Date */}
      <td className="px-4 py-3">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {formatDate(po.expectedDate)}
        </span>
      </td>

      {/* Total */}
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-slate-900 dark:text-white">
          ${po.total.toLocaleString()}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onView}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            title="View"
          >
            <EyeIcon />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            title="Edit"
          >
            <PencilIcon />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <DotsVerticalIcon />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[160px]">
                  <button
                    onClick={() => {
                      onDuplicate?.()
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <DuplicateIcon />
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      onExportPDF?.()
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <DownloadIcon />
                    Export PDF
                  </button>
                  {po.status === 'draft' && (
                    <button
                      onClick={() => {
                        onSendToSupplier?.()
                        setShowMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <SendIcon />
                      Send to Supplier
                    </button>
                  )}
                  {po.requiresInspection && ['confirmed', 'partially-received', 'received'].includes(po.status) && (
                    <button
                      onClick={() => {
                        onScheduleInspection?.()
                        setShowMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <ClipboardCheckIcon />
                      Schedule Inspection
                    </button>
                  )}
                  {!hasInvoice && ['confirmed', 'partially-received', 'received', 'completed'].includes(po.status) && (
                    <button
                      onClick={() => {
                        onCreateInvoice?.()
                        setShowMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <DocumentPlusIcon />
                      Create Invoice
                    </button>
                  )}
                  <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                  <button
                    onClick={() => {
                      onDelete?.()
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <TrashIcon />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
}
