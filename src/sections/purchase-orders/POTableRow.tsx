'use client'

import { useState } from 'react'
import { Eye, Pencil, MoreVertical, Copy, Download, Send, Trash2, ClipboardCheck, Link2 } from 'lucide-react'
import type { PurchaseOrder, POStatusOption, POStatus } from './types'

interface POTableRowProps {
  po: PurchaseOrder
  poStatuses: POStatusOption[]
  isSelected?: boolean
  onSelectChange?: (selected: boolean) => void
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  onExportPDF?: () => void
  onSendToSupplier?: () => void
  onUpdateStatus?: (newStatus: POStatus) => void
  onViewInspection?: () => void
  onGenerateMagicLink?: () => void
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

// Inspection status display config
const inspectionStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  'not-needed': { label: 'Not Needed', color: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' },
}

export function POTableRow({
  po,
  poStatuses,
  isSelected = false,
  onSelectChange,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onExportPDF,
  onSendToSupplier,
  onUpdateStatus,
  onViewInspection,
  onGenerateMagicLink,
}: POTableRowProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)

  const statusStyle = statusColors[po.status]
  const statusLabel = poStatuses.find((s) => s.id === po.status)?.label || po.status

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Inspection status display
  const inspectionStatus = po.inspectionStatus || 'pending'
  const inspectionStyle = inspectionStatusConfig[inspectionStatus] || inspectionStatusConfig.pending

  return (
    <tr className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
      {/* Checkbox */}
      <td className="px-4 py-3 w-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelectChange?.(e.target.checked)}
          className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500 dark:bg-slate-700"
        />
      </td>

      {/* PO Number */}
      <td className="px-4 py-3">
        <button
          onClick={onView}
          className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          {po.poNumber}
        </button>
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
              <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
              <div className="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[140px]">
                {poStatuses.map((status) => (
                  <button
                    key={status.id}
                    onClick={() => {
                      onUpdateStatus?.(status.id)
                      setShowStatusMenu(false)
                    }}
                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 ${
                      status.id === po.status
                        ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                        : 'text-slate-700 dark:text-slate-300'
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

      {/* Inspection Required */}
      <td className="px-4 py-3">
        {po.requiresInspection === true ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            Required
          </span>
        ) : po.requiresInspection === false ? (
          <span className="text-xs text-slate-400 dark:text-slate-500">No</span>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
        )}
      </td>

      {/* Inspection Status */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${inspectionStyle.color}`}>
          {inspectionStyle.label}
        </span>
      </td>

      {/* Inspection # */}
      <td className="px-4 py-3">
        {po.inspectionId ? (
          <button
            onClick={onViewInspection}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            View
          </button>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onView}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 min-w-[160px]">
                  <button
                    onClick={() => {
                      onDuplicate?.()
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      onExportPDF?.()
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </button>
                  {onGenerateMagicLink && po.status !== 'cancelled' && (
                    <button
                      onClick={() => {
                        onGenerateMagicLink()
                        setShowMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Link2 className="w-4 h-4" />
                      Generate Magic Link
                    </button>
                  )}
                  {po.status === 'draft' && (
                    <button
                      onClick={() => {
                        onSendToSupplier?.()
                        setShowMenu(false)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send to Supplier
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
                    <Trash2 className="w-4 h-4" />
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
