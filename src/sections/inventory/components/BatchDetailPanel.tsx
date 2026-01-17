'use client'

import { useState } from 'react'
import {
  X,
  Package,
  Truck,
  Building2,
  Check,
  Clock,
  DollarSign,
  Calendar,
  FileText,
  Image as ImageIcon,
  Upload,
  Trash2,
  GitBranch,
  GitMerge,
  History,
} from 'lucide-react'
import type { Batch, BatchStage, StageHistoryEntry, Attachment, StockLedgerEntry } from '../types'

interface BatchDetailPanelProps {
  batch: Batch
  ledgerEntries?: StockLedgerEntry[]
  isOpen: boolean
  onClose: () => void
  onEdit?: (id: string) => void
  onSplit?: (id: string) => void
  onMerge?: (id: string) => void
  onCreateTransfer?: (id: string) => void
  onAddAttachment?: (batchId: string, file: File) => void
  onRemoveAttachment?: (batchId: string, attachmentId: string) => void
}

const stageConfig: Record<BatchStage, { icon: React.ReactNode; label: string; color: string }> = {
  ordered: { icon: <Clock className="w-4 h-4" />, label: 'Ordered', color: 'text-stone-500' },
  factory: { icon: <Building2 className="w-4 h-4" />, label: 'At Factory', color: 'text-blue-500' },
  inspected: { icon: <Check className="w-4 h-4" />, label: 'Inspected', color: 'text-cyan-500' },
  ready_to_ship: { icon: <Package className="w-4 h-4" />, label: 'Ready to Ship', color: 'text-teal-500' },
  'in-transit': { icon: <Truck className="w-4 h-4" />, label: 'In Transit', color: 'text-amber-500' },
  warehouse: { icon: <Package className="w-4 h-4" />, label: 'Warehouse', color: 'text-emerald-500' },
  amazon: { icon: <Package className="w-4 h-4" />, label: 'Amazon FBA', color: 'text-violet-500' },
}

export function BatchDetailPanel({
  batch,
  ledgerEntries = [],
  isOpen,
  onClose,
  onEdit,
  onSplit,
  onMerge,
  onCreateTransfer,
  onAddAttachment,
  onRemoveAttachment,
}: BatchDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'ledger' | 'attachments'>('details')
  const [isDraggingFile, setIsDraggingFile] = useState(false)

  if (!isOpen) return null

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingFile(false)
    const files = e.dataTransfer.files
    if (files.length > 0 && onAddAttachment) {
      Array.from(files).forEach((file) => {
        onAddAttachment(batch.id, file)
      })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0 && onAddAttachment) {
      Array.from(files).forEach((file) => {
        onAddAttachment(batch.id, file)
      })
    }
  }

  const currentStage = stageConfig[batch.stage]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-stone-900 shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-stone-100 dark:bg-stone-800 ${currentStage.color}`}>
              {currentStage.icon}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
                Batch Details
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {batch.poNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 dark:border-stone-700">
          {(['details', 'timeline', 'ledger', 'attachments'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-lime-600 dark:text-lime-400 border-b-2 border-lime-500'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
              }`}
            >
              {tab === 'details' && 'Details'}
              {tab === 'timeline' && 'Timeline'}
              {tab === 'ledger' && 'Ledger'}
              {tab === 'attachments' && `Files (${batch.attachments.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Product Info */}
              <div>
                <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">
                  Product
                </h3>
                <div className="bg-stone-50 dark:bg-stone-800 rounded-lg p-4">
                  <p className="text-lg font-semibold text-stone-900 dark:text-white">
                    {batch.productName}
                  </p>
                  <p className="text-sm text-lime-600 dark:text-lime-400 font-mono">
                    {batch.sku}
                  </p>
                </div>
              </div>

              {/* Quantity & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-stone-50 dark:bg-stone-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 mb-1">
                    <Package className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase">Quantity</span>
                  </div>
                  <p className="text-2xl font-semibold text-stone-900 dark:text-white tabular-nums">
                    {batch.quantity.toLocaleString()}
                  </p>
                </div>
                <div className="bg-stone-50 dark:bg-stone-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase">Total Value</span>
                  </div>
                  <p className="text-2xl font-semibold text-stone-900 dark:text-white tabular-nums">
                    ${batch.totalCost.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Unit Cost */}
              <div className="bg-stone-50 dark:bg-stone-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-500 dark:text-stone-400">Unit Cost (FIFO)</span>
                  <span className="text-sm font-medium text-stone-900 dark:text-white tabular-nums">
                    ${batch.unitCost.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div>
                <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">
                  Dates
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Ordered</span>
                    </div>
                    <span className="text-sm text-stone-900 dark:text-white">
                      {formatDate(batch.orderedDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Expected Arrival</span>
                    </div>
                    <span className="text-sm text-stone-900 dark:text-white">
                      {formatDate(batch.expectedArrival)}
                    </span>
                  </div>
                  {batch.actualArrival && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-500">
                        <Check className="w-4 h-4" />
                        <span className="text-sm">Actual Arrival</span>
                      </div>
                      <span className="text-sm text-emerald-600 dark:text-emerald-400">
                        {formatDate(batch.actualArrival)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Supplier */}
              <div>
                <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">
                  Supplier
                </h3>
                <p className="text-sm text-stone-900 dark:text-white">
                  {batch.supplierName}
                </p>
              </div>

              {/* Notes */}
              {batch.notes && (
                <div>
                  <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3">
                    Notes
                  </h3>
                  <p className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-wrap">
                    {batch.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                Stage History
              </h3>
              {batch.stageHistory.length === 0 ? (
                <p className="text-sm text-stone-400 dark:text-stone-500">
                  No stage history yet
                </p>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-stone-200 dark:bg-stone-700" />

                  {/* Timeline items */}
                  <div className="space-y-4">
                    {[...batch.stageHistory].reverse().map((entry, index) => {
                      const config = stageConfig[entry.stage]
                      return (
                        <div key={index} className="relative flex gap-4">
                          <div className={`relative z-10 w-6 h-6 rounded-full bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-700 flex items-center justify-center ${config.color}`}>
                            {config.icon}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="text-sm font-medium text-stone-900 dark:text-white">
                              {config.label}
                            </p>
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                              {formatDateTime(entry.date)}
                            </p>
                            {entry.note && (
                              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                                {entry.note}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                Stock Movements
              </h3>
              {ledgerEntries.length === 0 ? (
                <p className="text-sm text-stone-400 dark:text-stone-500">
                  No stock movements recorded
                </p>
              ) : (
                <div className="space-y-3">
                  {ledgerEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-stone-50 dark:bg-stone-800 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-stone-400" />
                          <span className="text-sm font-medium text-stone-900 dark:text-white capitalize">
                            {entry.movementType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className={`text-sm font-semibold tabular-nums ${
                          entry.quantity > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                        {entry.locationName} • {formatDateTime(entry.createdAt)}
                      </p>
                      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                        {entry.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-4">
              {/* Upload Area */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true) }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDraggingFile
                    ? 'border-lime-500 bg-lime-50 dark:bg-lime-900/20'
                    : 'border-stone-300 dark:border-stone-600'
                }`}
              >
                <Upload className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                <p className="text-sm text-stone-600 dark:text-stone-400">
                  Drag & drop files here, or{' '}
                  <label className="text-lime-600 dark:text-lime-400 cursor-pointer hover:underline">
                    browse
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                </p>
              </div>

              {/* Attachment List */}
              <div className="space-y-2">
                {batch.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between bg-stone-50 dark:bg-stone-800 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      {attachment.type === 'photo' ? (
                        <ImageIcon className="w-5 h-5 text-blue-500" />
                      ) : (
                        <FileText className="w-5 h-5 text-stone-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-stone-900 dark:text-white">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {formatDateTime(attachment.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    {onRemoveAttachment && (
                      <button
                        onClick={() => onRemoveAttachment(batch.id, attachment.id)}
                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
          <div className="flex items-center gap-3">
            {onEdit && (
              <button
                onClick={() => onEdit(batch.id)}
                className="flex-1 px-4 py-2 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-lg text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-600 transition-colors"
              >
                Edit Batch
              </button>
            )}
            {onSplit && (
              <button
                onClick={() => onSplit(batch.id)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-lg text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-600 transition-colors"
              >
                <GitBranch className="w-4 h-4" />
                Split
              </button>
            )}
            {onMerge && (
              <button
                onClick={() => onMerge(batch.id)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 rounded-lg text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-600 transition-colors"
              >
                <GitMerge className="w-4 h-4" />
                Merge
              </button>
            )}
            {onCreateTransfer && (
              <button
                onClick={() => onCreateTransfer(batch.id)}
                className="flex items-center gap-2 px-4 py-2 bg-lime-600 hover:bg-lime-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Truck className="w-4 h-4" />
                Transfer
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
