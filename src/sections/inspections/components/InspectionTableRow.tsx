'use client'

import { useState } from 'react'
import type { Inspection, InspectionStatusOption, InspectionStatus } from '@/sections/inspections/types'

interface InspectionTableRowProps {
  inspection: Inspection
  statusOptions: InspectionStatusOption[]
  isExpanded?: boolean
  onToggleExpand?: () => void
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onSendToAgent?: () => void
  onMarkPaid?: () => void
  onMarkResult?: (result: 'pass' | 'fail') => void
  onStart?: () => void
  onCreateRework?: () => void
  onScheduleReinspection?: () => void
  onGenerateReport?: () => void
}

// Icons
const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const PlayIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const DotsVerticalIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
)

const PencilIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const DocumentIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const WrenchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const PaperAirplaneIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
)

const CurrencyDollarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const XMarkIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)

const statusColors: Record<InspectionStatus, { bg: string; text: string; dot: string }> = {
  'scheduled': { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
  'pending-confirmation': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
  'confirmed': { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-500' },
  'paid': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  'in-progress': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  'report-submitted': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  'passed': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  'failed': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  'pending-rework': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  're-inspection': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
}

const resultColors: Record<string, { bg: string; text: string }> = {
  'pass': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300' },
  'fail': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
  'pending': { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-500 dark:text-slate-400' },
}

export function InspectionTableRow({
  inspection,
  statusOptions,
  isExpanded,
  onToggleExpand,
  onView,
  onEdit,
  onDelete,
  onSendToAgent,
  onMarkPaid,
  onMarkResult,
  onStart,
  onCreateRework,
  onScheduleReinspection,
  onGenerateReport,
}: InspectionTableRowProps) {
  const [showMenu, setShowMenu] = useState(false)

  const statusStyle = statusColors[inspection.status]
  const resultStyle = resultColors[inspection.result]
  const statusLabel = statusOptions.find(s => s.id === inspection.status)?.label || inspection.status

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Action conditions based on workflow
  const canSendToAgent = inspection.status === 'scheduled' && inspection.agentId
  const canMarkPaid = inspection.status === 'confirmed'
  const canStart = inspection.status === 'paid'
  const canMarkResult = inspection.status === 'report-submitted'
  const canCreateRework = inspection.result === 'fail' && !inspection.reworkRequest
  const canScheduleReinspection = inspection.status === 'pending-rework' && inspection.reworkRequest?.status === 'completed'

  // Calculate line item summary
  const passedItems = inspection.lineItems.filter(li => li.result === 'pass').length
  const failedItems = inspection.lineItems.filter(li => li.result === 'fail').length

  // Get PO display info
  const purchaseOrders = inspection.purchaseOrders || []
  const hasPurchaseOrders = purchaseOrders.length > 0
  const poDisplayText = hasPurchaseOrders
    ? purchaseOrders.length === 1
      ? purchaseOrders[0].poNumber
      : `${purchaseOrders.length} POs`
    : inspection.purchaseOrderNumber || '—'

  const supplierDisplayText = hasPurchaseOrders
    ? purchaseOrders[0].supplierName
    : inspection.supplierName || '—'

  const renderInvoiceStatus = () => {
    if (!inspection.invoiceAmount) {
      return (
        <span className="text-xs text-slate-400 dark:text-slate-500">
          —
        </span>
      )
    }

    const isPaid = ['paid', 'in-progress', 'report-submitted', 'passed', 'failed', 'pending-rework', 're-inspection'].includes(inspection.status)

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        isPaid
          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
      }`}>
        ${inspection.invoiceAmount.toLocaleString()}
        {isPaid && <CheckIcon />}
      </span>
    )
  }

  return (
    <>
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      {/* Expand button */}
      <td className="px-2 py-3">
        <button
          onClick={onToggleExpand}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded transition-transform duration-200"
          title={isExpanded ? 'Collapse' : 'Expand line items'}
        >
          <ChevronRightIcon className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
      </td>

      {/* Inspection Number - clickable to open panel */}
      <td className="px-4 py-3">
        <button
          onClick={onView}
          className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline"
        >
          {inspection.inspectionNumber || '—'}
        </button>
      </td>

      {/* PO(s) */}
      <td className="px-4 py-3">
        <div className="text-sm">
          {hasPurchaseOrders && purchaseOrders.length > 1 ? (
            <div>
              <span className="font-medium text-slate-900 dark:text-white">{poDisplayText}</span>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {purchaseOrders.map(po => po.poNumber).join(', ')}
              </div>
            </div>
          ) : (
            <span className="text-slate-900 dark:text-white">{poDisplayText}</span>
          )}
        </div>
      </td>

      {/* Supplier */}
      <td className="px-4 py-3">
        <span className="text-sm text-slate-900 dark:text-white">
          {supplierDisplayText}
        </span>
      </td>

      {/* Line Items */}
      <td className="px-4 py-3">
        <div className="text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            {inspection.lineItems.length} items
          </span>
          {(passedItems > 0 || failedItems > 0) && (
            <div className="text-xs mt-0.5">
              {passedItems > 0 && <span className="text-emerald-600 dark:text-emerald-400">{passedItems} pass</span>}
              {passedItems > 0 && failedItems > 0 && <span className="text-slate-400 mx-1">/</span>}
              {failedItems > 0 && <span className="text-red-600 dark:text-red-400">{failedItems} fail</span>}
            </div>
          )}
        </div>
      </td>

      {/* Date */}
      <td className="px-4 py-3">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {formatDate(inspection.confirmedDate || inspection.scheduledDate)}
        </span>
      </td>

      {/* Agent */}
      <td className="px-4 py-3">
        <span className={`text-sm ${inspection.agentId ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500 italic'}`}>
          {inspection.agentName}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
          {statusLabel}
        </span>
      </td>

      {/* Defect Rate */}
      <td className="px-4 py-3">
        {inspection.result !== 'pending' ? (
          <span className={`text-sm font-medium ${inspection.overallDefectRate > 2.5 ? 'text-red-600 dark:text-red-400' : inspection.overallDefectRate > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {inspection.overallDefectRate.toFixed(1)}%
          </span>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </td>

      {/* Result */}
      <td className="px-4 py-3">
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${resultStyle.bg} ${resultStyle.text}`}>
          {inspection.result}
        </span>
      </td>

      {/* Invoice Status */}
      <td className="px-4 py-3">
        {renderInvoiceStatus()}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {/* Quick action buttons based on workflow state */}
          {canSendToAgent && (
            <button
              onClick={onSendToAgent}
              className="p-1.5 text-yellow-500 hover:text-yellow-600 dark:hover:text-yellow-400 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
              title="Send to Agent"
            >
              <PaperAirplaneIcon />
            </button>
          )}
          {canMarkPaid && (
            <button
              onClick={onMarkPaid}
              className="p-1.5 text-green-500 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
              title="Mark as Paid"
            >
              <CurrencyDollarIcon />
            </button>
          )}
          {canStart && (
            <button
              onClick={onStart}
              className="p-1.5 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
              title="Start Inspection"
            >
              <PlayIcon />
            </button>
          )}
          {canMarkResult && (
            <>
              <button
                onClick={() => onMarkResult?.('pass')}
                className="p-1.5 text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                title="Mark as Pass"
              >
                <CheckIcon />
              </button>
              <button
                onClick={() => onMarkResult?.('fail')}
                className="p-1.5 text-red-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Mark as Fail"
              >
                <XMarkIcon />
              </button>
            </>
          )}
          <button
            onClick={onView}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            title="View Details"
          >
            <EyeIcon />
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
                      onEdit?.()
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <PencilIcon />
                    Edit
                  </button>
                  {inspection.result !== 'pending' && (
                    <button
                      onClick={() => {
                        onGenerateReport?.()
                        setShowMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <DocumentIcon />
                      Generate Report
                    </button>
                  )}
                  {canCreateRework && (
                    <button
                      onClick={() => {
                        onCreateRework?.()
                        setShowMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-2"
                    >
                      <WrenchIcon />
                      Create Rework Request
                    </button>
                  )}
                  {canScheduleReinspection && (
                    <button
                      onClick={() => {
                        onScheduleReinspection?.()
                        setShowMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-2"
                    >
                      <RefreshIcon />
                      Schedule Re-inspection
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

    {/* Expanded row with line items */}
    {isExpanded && (
      <tr className="bg-slate-50 dark:bg-slate-800/50">
        <td colSpan={11} className="px-4 py-3">
          <div className="ml-8">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
              Line Items
            </p>
            <div className="space-y-2">
              {inspection.lineItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex items-center gap-4 text-sm bg-white dark:bg-slate-700/50 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-600"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    item.result === 'pass' ? 'bg-emerald-500' :
                    item.result === 'fail' ? 'bg-red-500' :
                    'bg-slate-300 dark:bg-slate-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      SKU: {item.productSku} • Qty: {item.orderedQuantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-medium capitalize ${
                      item.result === 'pass' ? 'text-emerald-600 dark:text-emerald-400' :
                      item.result === 'fail' ? 'text-red-600 dark:text-red-400' :
                      'text-slate-500 dark:text-slate-400'
                    }`}>
                      {item.result}
                    </p>
                    {item.defectRate > 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.defectRate.toFixed(1)}% defects
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </td>
      </tr>
    )}
    </>
  )
}
