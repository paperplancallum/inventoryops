import { useState, useEffect, useRef } from 'react'
import type { PaymentMethod, PaymentMethodOption, NewPayment, PaymentAttachment } from '@/../product/sections/invoices-and-payments/types'

interface RecordPaymentModalProps {
  isOpen: boolean
  invoiceDescription: string
  invoiceBalance: number
  paymentMethods: PaymentMethodOption[]
  onClose: () => void
  onSubmit: (payment: NewPayment) => void
}

// Icons
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const CreditCardIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
)

const PaperclipIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
)

const DocumentIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

export function RecordPaymentModal({
  isOpen,
  invoiceDescription,
  invoiceBalance,
  paymentMethods,
  onClose,
  onSubmit,
}: RecordPaymentModalProps) {
  const today = new Date().toISOString().split('T')[0]
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [amount, setAmount] = useState(invoiceBalance.toString())
  const [date, setDate] = useState(today)
  const [method, setMethod] = useState<PaymentMethod>('wire-transfer')
  const [reference, setReference] = useState('')
  const [attachments, setAttachments] = useState<PaymentAttachment[]>([])
  const [errors, setErrors] = useState<{ amount?: string; reference?: string }>({})

  // Reset form when modal opens with new invoice
  useEffect(() => {
    if (isOpen) {
      setAmount(invoiceBalance.toString())
      setDate(new Date().toISOString().split('T')[0])
      setMethod('wire-transfer')
      setReference('')
      setAttachments([])
      setErrors({})
    }
  }, [isOpen, invoiceBalance])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: { amount?: string; reference?: string } = {}
    const amountNum = parseFloat(amount)

    if (isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Please enter a valid amount'
    } else if (amountNum > invoiceBalance) {
      newErrors.amount = `Amount cannot exceed balance ($${invoiceBalance.toLocaleString()})`
    }

    if (!reference.trim()) {
      newErrors.reference = 'Reference is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit({
      amount: amountNum,
      date,
      method,
      reference: reference.trim(),
      attachments,
    })

    // Reset form
    setAmount(invoiceBalance.toString())
    setDate(today)
    setMethod('wire-transfer')
    setReference('')
    setAttachments([])
    setErrors({})
  }

  const handleClose = () => {
    setAmount(invoiceBalance.toString())
    setDate(today)
    setMethod('wire-transfer')
    setReference('')
    setAttachments([])
    setErrors({})
    onClose()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newAttachments: PaymentAttachment[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
    }))

    setAttachments((prev) => [...prev, ...newAttachments])

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform rounded-xl bg-white dark:bg-slate-800 shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                <CreditCardIcon />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Record Payment
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                  {invoiceDescription}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-500 dark:hover:text-slate-300"
            >
              <XIcon />
            </button>
          </div>

          {/* Balance Display */}
          <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Outstanding Balance
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              ${invoiceBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Amount
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  min="0.01"
                  max={invoiceBalance}
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value)
                    setErrors({ ...errors, amount: undefined })
                  }}
                  className={`w-full rounded-lg border pl-7 pr-4 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.amount
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-slate-200 dark:border-slate-600'
                  }`}
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.amount}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Method */}
            <div>
              <label htmlFor="method" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Payment Method
              </label>
              <select
                id="method"
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {paymentMethods.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Reference */}
            <div>
              <label htmlFor="reference" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Reference
              </label>
              <input
                type="text"
                id="reference"
                value={reference}
                onChange={(e) => {
                  setReference(e.target.value)
                  setErrors({ ...errors, reference: undefined })
                }}
                placeholder="e.g., WT-2024-0108-001"
                className={`w-full rounded-lg border px-4 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.reference
                    ? 'border-red-300 dark:border-red-600'
                    : 'border-slate-200 dark:border-slate-600'
                }`}
              />
              {errors.reference && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.reference}</p>
              )}
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Attachments
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 px-4 py-3 text-sm text-slate-500 dark:text-slate-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-full justify-center"
              >
                <PaperclipIcon />
                <span>Attach files (receipts, confirmations)</span>
              </button>

              {/* Attached Files List */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 bg-slate-50 dark:bg-slate-700/50"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="text-slate-400 dark:text-slate-500">
                          <DocumentIcon />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(file.id)}
                        className="ml-2 p-1 rounded text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                        title="Remove attachment"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
              >
                Record Payment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
