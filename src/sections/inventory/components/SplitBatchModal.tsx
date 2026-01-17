'use client'

import { useState } from 'react'
import { X, GitBranch, AlertCircle } from 'lucide-react'
import type { Batch } from '../types'

interface SplitBatchModalProps {
  batch: Batch
  isOpen: boolean
  onClose: () => void
  onSplit: (batchId: string, splitQuantity: number, note?: string) => Promise<string | null>
}

export function SplitBatchModal({
  batch,
  isOpen,
  onClose,
  onSplit,
}: SplitBatchModalProps) {
  const [splitQuantity, setSplitQuantity] = useState<number>(Math.floor(batch.quantity / 2))
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const remainingQuantity = batch.quantity - splitQuantity
  const isValidSplit = splitQuantity > 0 && splitQuantity < batch.quantity

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidSplit) return

    setIsSubmitting(true)
    setError(null)

    try {
      const newBatchId = await onSplit(batch.id, splitQuantity, note || undefined)
      if (newBatchId) {
        onClose()
      } else {
        setError('Failed to split batch. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-stone-900 rounded-xl shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-lime-100 dark:bg-lime-900/30 rounded-lg">
                <GitBranch className="w-5 h-5 text-lime-600 dark:text-lime-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
                  Split Batch
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

          {/* Content */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4">
              {/* Product Info */}
              <div className="bg-stone-50 dark:bg-stone-800 rounded-lg p-3">
                <p className="text-sm font-medium text-stone-900 dark:text-white">
                  {batch.productName}
                </p>
                <p className="text-xs text-lime-600 dark:text-lime-400 font-mono">
                  {batch.sku}
                </p>
                <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
                  Current quantity: <span className="font-semibold text-stone-900 dark:text-white">{batch.quantity.toLocaleString()}</span> units
                </p>
              </div>

              {/* Split Quantity Input */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Split Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  max={batch.quantity - 1}
                  value={splitQuantity}
                  onChange={(e) => setSplitQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500"
                />
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  Enter the quantity for the new batch (1 to {batch.quantity - 1})
                </p>
              </div>

              {/* Preview */}
              {isValidSplit && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-stone-50 dark:bg-stone-800 rounded-lg p-3 border border-stone-200 dark:border-stone-700">
                    <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase">
                      Original Batch
                    </p>
                    <p className="mt-1 text-lg font-semibold text-stone-900 dark:text-white tabular-nums">
                      {remainingQuantity.toLocaleString()} units
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      ${(remainingQuantity * batch.unitCost).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-lime-50 dark:bg-lime-900/20 rounded-lg p-3 border border-lime-200 dark:border-lime-800">
                    <p className="text-xs font-medium text-lime-600 dark:text-lime-400 uppercase">
                      New Batch
                    </p>
                    <p className="mt-1 text-lg font-semibold text-lime-700 dark:text-lime-300 tabular-nums">
                      {splitQuantity.toLocaleString()} units
                    </p>
                    <p className="text-xs text-lime-600 dark:text-lime-400">
                      ${(splitQuantity * batch.unitCost).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Reason for split..."
                  rows={2}
                  className="w-full px-4 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 rounded-b-xl">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isValidSplit || isSubmitting}
                  className="px-4 py-2 bg-lime-600 hover:bg-lime-700 disabled:bg-stone-300 dark:disabled:bg-stone-600 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Splitting...' : 'Split Batch'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
