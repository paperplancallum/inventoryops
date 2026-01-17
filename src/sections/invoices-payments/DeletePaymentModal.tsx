'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle, Loader2 } from 'lucide-react'
import type { PaymentWithInvoice } from './types'

interface DeletePaymentModalProps {
  isOpen: boolean
  payment: PaymentWithInvoice | null
  onClose: () => void
  onConfirm: (invoiceId: string, paymentId: string) => Promise<boolean>
}

export function DeletePaymentModal({
  isOpen,
  payment,
  onClose,
  onConfirm,
}: DeletePaymentModalProps) {
  const [confirmationInput, setConfirmationInput] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setConfirmationInput('')
      setError(null)
      setIsDeleting(false)
    }
  }, [isOpen])

  if (!isOpen || !payment) return null

  const referenceToMatch = payment.reference || ''
  const isConfirmationValid = confirmationInput === referenceToMatch && referenceToMatch !== ''

  const handleDelete = async () => {
    if (!isConfirmationValid) {
      setError('Reference number does not match')
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const success = await onConfirm(payment.invoiceId, payment.id)
      if (success) {
        onClose()
      } else {
        setError('Failed to delete payment. Please try again.')
      }
    } catch {
      setError('An error occurred while deleting the payment.')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-xl bg-white dark:bg-slate-800 shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Delete Payment
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            {/* Warning message */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                This action cannot be undone. The payment record and all associated attachments will be permanently deleted.
              </p>
            </div>

            {/* Payment details */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Invoice</span>
                <span className="font-medium text-slate-900 dark:text-white">{payment.invoiceNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Amount</span>
                <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(payment.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Date</span>
                <span className="font-medium text-slate-900 dark:text-white">{formatDate(payment.date)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Reference</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">{payment.reference || '—'}</span>
              </div>
            </div>

            {/* Confirmation input */}
            {referenceToMatch ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  To confirm deletion, type the payment reference number:
                  <span className="font-mono ml-2 text-red-600 dark:text-red-400">{referenceToMatch}</span>
                </label>
                <input
                  type="text"
                  value={confirmationInput}
                  onChange={(e) => {
                    setConfirmationInput(e.target.value)
                    setError(null)
                  }}
                  placeholder="Enter reference number"
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
                  autoFocus
                />
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  This payment has no reference number. Please contact support to delete this payment.
                </p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-700 px-6 py-4">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!isConfirmationValid || isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Payment'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
