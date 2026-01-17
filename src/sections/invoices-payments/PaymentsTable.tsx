'use client'

import { useState, useMemo, useRef } from 'react'
import { Search, CreditCard, Paperclip, FileText, ExternalLink, Upload, X, Loader2, Trash2 } from 'lucide-react'
import { DeletePaymentModal } from './DeletePaymentModal'
import type { PaymentWithInvoice, PaymentMethodOption } from './types'

interface PaymentsTableProps {
  payments: PaymentWithInvoice[]
  paymentMethods: PaymentMethodOption[]
  onViewInvoice?: (invoiceId: string) => void
  onAddAttachments?: (invoiceId: string, paymentId: string, files: File[]) => Promise<boolean>
  onDeletePayment?: (invoiceId: string, paymentId: string) => Promise<boolean>
}

export function PaymentsTable({
  payments,
  paymentMethods,
  onViewInvoice,
  onAddAttachments,
  onDeletePayment,
}: PaymentsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [uploadingPaymentId, setUploadingPaymentId] = useState<string | null>(null)
  const [expandedAttachmentsId, setExpandedAttachmentsId] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentWithInvoice | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetRef = useRef<{ invoiceId: string; paymentId: string } | null>(null)

  // Sort by date (newest first) and filter by search
  const filteredPayments = useMemo(() => {
    let filtered = [...payments]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(payment => {
        const matchesInvoice = payment.invoiceDescription.toLowerCase().includes(query)
        const matchesNumber = payment.invoiceNumber.toLowerCase().includes(query)
        const matchesReference = (payment.reference || '').toLowerCase().includes(query)
        const matchesMethod = getMethodLabel(payment.method, paymentMethods).toLowerCase().includes(query)
        return matchesInvoice || matchesNumber || matchesReference || matchesMethod
      })
    }

    // Sort by date descending (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return filtered
  }, [payments, searchQuery, paymentMethods])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  }

  const getMethodLabel = (methodId: string, methods: PaymentMethodOption[]) => {
    return methods.find(m => m.id === methodId)?.label || methodId
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleUploadClick = (invoiceId: string, paymentId: string) => {
    uploadTargetRef.current = { invoiceId, paymentId }
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !uploadTargetRef.current || !onAddAttachments) return

    const { invoiceId, paymentId } = uploadTargetRef.current
    setUploadingPaymentId(paymentId)

    try {
      await onAddAttachments(invoiceId, paymentId, Array.from(files))
    } finally {
      setUploadingPaymentId(null)
      uploadTargetRef.current = null
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const toggleAttachments = (paymentId: string) => {
    setExpandedAttachmentsId(prev => prev === paymentId ? null : paymentId)
  }

  const handleDeleteClick = (payment: PaymentWithInvoice) => {
    setPaymentToDelete(payment)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async (invoiceId: string, paymentId: string): Promise<boolean> => {
    if (!onDeletePayment) return false
    const success = await onDeletePayment(invoiceId, paymentId)
    if (success) {
      setDeleteModalOpen(false)
      setPaymentToDelete(null)
    }
    return success
  }

  return (
    <div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
      />

      {/* Search */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search payments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {filteredPayments.length > 0 ? (
        <>
          {/* Table Header */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700">
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Invoice</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-2">Method</div>
            <div className="col-span-2">Reference</div>
            <div className="col-span-1">Files</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredPayments.map(payment => (
              <div key={payment.id}>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  {/* Date */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {formatDate(payment.date)}
                    </span>
                  </div>

                  {/* Invoice */}
                  <div className="col-span-2">
                    <button
                      onClick={() => onViewInvoice?.(payment.invoiceId)}
                      className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline text-left"
                    >
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400 block">
                        {payment.invoiceNumber}
                      </span>
                      <span className="line-clamp-1">{payment.invoiceDescription}</span>
                    </button>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 flex items-center justify-end">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>

                  {/* Method */}
                  <div className="col-span-2 flex items-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {getMethodLabel(payment.method, paymentMethods)}
                    </span>
                  </div>

                  {/* Reference */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-mono text-xs truncate">
                      {payment.reference || '—'}
                    </span>
                  </div>

                  {/* Attachments */}
                  <div className="col-span-1 flex items-center gap-1">
                    {payment.attachments.length > 0 ? (
                      <button
                        onClick={() => toggleAttachments(payment.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                      >
                        <Paperclip className="w-3 h-3" />
                        {payment.attachments.length}
                      </button>
                    ) : null}
                    {onAddAttachments && (
                      <button
                        onClick={() => handleUploadClick(payment.invoiceId, payment.id)}
                        disabled={uploadingPaymentId === payment.id}
                        className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                        title="Add attachment"
                      >
                        {uploadingPaymentId === payment.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end">
                    {onDeletePayment && payment.reference && (
                      <button
                        onClick={() => handleDeleteClick(payment)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete payment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Attachments */}
                {expandedAttachmentsId === payment.id && payment.attachments.length > 0 && (
                  <div className="px-4 pb-4 bg-slate-50 dark:bg-slate-800/30">
                    <div className="ml-0 sm:ml-[16.666%] pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                          Attachments
                        </p>
                        <button
                          onClick={() => setExpandedAttachmentsId(null)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {payment.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors group"
                          >
                            <div className="flex-shrink-0 text-slate-400 dark:text-slate-500">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                {attachment.name}
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500">
                                {formatFileSize(attachment.size)}
                              </p>
                            </div>
                            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {filteredPayments.length} of {payments.length} payments
            </p>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="px-4 py-16 text-center">
          <div className="flex justify-center mb-4">
            <CreditCard className="w-12 h-12 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            No payments found
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {searchQuery
              ? 'Try adjusting your search'
              : 'Payments will appear here when recorded against invoices'}
          </p>
        </div>
      )}

      {/* Delete Payment Modal */}
      <DeletePaymentModal
        isOpen={deleteModalOpen}
        payment={paymentToDelete}
        onClose={() => {
          setDeleteModalOpen(false)
          setPaymentToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
