'use client'

import { useState } from 'react'
import { X, AlertTriangle, CheckCircle, Award } from 'lucide-react'
import type { ShippingQuote } from '@/sections/shipping-quotes/types'

interface SelectQuoteConfirmDialogProps {
  isOpen: boolean
  quote: ShippingQuote | null
  hasExistingSelection?: boolean
  onConfirm: (quoteId: string) => Promise<void>
  onClose: () => void
}

export function SelectQuoteConfirmDialog({
  isOpen,
  quote,
  hasExistingSelection = false,
  onConfirm,
  onClose,
}: SelectQuoteConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !quote) return null

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return '-'
    return `${currency} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm(quote.id)
      onClose()
    } catch (err) {
      console.error('Error selecting quote:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-stone-800 rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-lime-600 dark:text-lime-400" />
            <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
              {hasExistingSelection ? 'Change Selected Quote' : 'Select Winning Quote'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning for changing selection */}
          {hasExistingSelection && (
            <div className="mb-4 flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                <p className="font-medium">A quote has already been selected</p>
                <p className="mt-1">Changing the selection may require notifying the shipping agent.</p>
              </div>
            </div>
          )}

          {/* Quote summary */}
          <div className="p-4 bg-stone-50 dark:bg-stone-700/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500 dark:text-stone-400">Shipping Agent</p>
                <p className="text-lg font-semibold text-stone-900 dark:text-white">
                  {quote.shippingAgentName || 'Unknown Agent'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-stone-500 dark:text-stone-400">Quote Amount</p>
                <p className="text-xl font-bold text-lime-600 dark:text-lime-400">
                  {formatCurrency(quote.totalAmount, quote.currency)}
                </p>
              </div>
            </div>
            {quote.validUntil && (
              <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
                Valid until: {new Date(quote.validUntil).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>

          {/* Confirmation text */}
          <div className="mt-4 p-3 bg-stone-100 dark:bg-stone-700 rounded-lg">
            <p className="text-sm text-stone-700 dark:text-stone-300">
              By selecting this quote:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-stone-600 dark:text-stone-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>This quote will be marked as the <span className="font-medium">selected winner</span></span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>All other quotes will be marked as <span className="font-medium">not selected</span></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>The transfer will be marked as <span className="font-medium">quote confirmed</span></span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 dark:border-stone-700">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-lime-600 hover:bg-lime-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Selecting...
              </>
            ) : (
              <>
                <Award className="w-4 h-4" />
                {hasExistingSelection ? 'Change Selection' : 'Select as Winner'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
