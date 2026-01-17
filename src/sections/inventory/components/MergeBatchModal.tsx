'use client'

import { useState, useMemo } from 'react'
import { X, GitMerge, AlertCircle, Check } from 'lucide-react'
import type { Batch } from '../types'

interface MergeBatchModalProps {
  currentBatch: Batch
  availableBatches: Batch[]
  isOpen: boolean
  onClose: () => void
  onMerge: (batchIds: string[], note?: string) => Promise<string | null>
}

export function MergeBatchModal({
  currentBatch,
  availableBatches,
  isOpen,
  onClose,
  onMerge,
}: MergeBatchModalProps) {
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([currentBatch.id])
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter to batches with same SKU and same stage
  const compatibleBatches = useMemo(() => {
    return availableBatches.filter(
      (b) => b.sku === currentBatch.sku && b.stage === currentBatch.stage && b.id !== currentBatch.id
    )
  }, [availableBatches, currentBatch])

  // Calculate merged totals
  const mergedTotals = useMemo(() => {
    const selectedBatches = [currentBatch, ...compatibleBatches.filter((b) => selectedBatchIds.includes(b.id))]
    const totalQuantity = selectedBatches.reduce((sum, b) => sum + b.quantity, 0)
    const totalCost = selectedBatches.reduce((sum, b) => sum + b.totalCost, 0)
    const weightedAvgCost = totalCost / totalQuantity

    return {
      count: selectedBatches.length,
      totalQuantity,
      totalCost,
      weightedAvgCost,
    }
  }, [currentBatch, compatibleBatches, selectedBatchIds])

  if (!isOpen) return null

  const toggleBatchSelection = (batchId: string) => {
    if (batchId === currentBatch.id) return // Can't deselect current batch

    setSelectedBatchIds((prev) => {
      if (prev.includes(batchId)) {
        return prev.filter((id) => id !== batchId)
      }
      return [...prev, batchId]
    })
  }

  const canMerge = selectedBatchIds.length >= 2

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canMerge) return

    setIsSubmitting(true)
    setError(null)

    try {
      const newBatchId = await onMerge(selectedBatchIds, note || undefined)
      if (newBatchId) {
        onClose()
      } else {
        setError('Failed to merge batches. Please try again.')
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
        <div className="bg-white dark:bg-stone-900 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                <GitMerge className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
                  Merge Batches
                </h2>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  Combine batches with same SKU
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
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              {/* Current Batch Info */}
              <div className="bg-stone-50 dark:bg-stone-800 rounded-lg p-3">
                <p className="text-sm font-medium text-stone-900 dark:text-white">
                  {currentBatch.productName}
                </p>
                <p className="text-xs text-lime-600 dark:text-lime-400 font-mono">
                  {currentBatch.sku}
                </p>
                <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                  Merging batches in <span className="font-medium capitalize">{currentBatch.stage}</span> stage
                </p>
              </div>

              {/* Compatible Batches */}
              {compatibleBatches.length === 0 ? (
                <div className="text-center py-8 text-stone-500 dark:text-stone-400">
                  <p className="text-sm">No compatible batches found.</p>
                  <p className="text-xs mt-1">
                    Batches must have the same SKU and be in the same stage.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                      Select batches to merge ({selectedBatchIds.length} selected)
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {/* Current batch (always selected) */}
                      <div className="flex items-center gap-3 p-3 bg-lime-50 dark:bg-lime-900/20 rounded-lg border border-lime-200 dark:border-lime-800">
                        <Check className="w-5 h-5 text-lime-600 dark:text-lime-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-stone-900 dark:text-white">
                            {currentBatch.poNumber}
                          </p>
                          <p className="text-xs text-stone-500 dark:text-stone-400">
                            {currentBatch.quantity.toLocaleString()} units @ ${currentBatch.unitCost.toFixed(2)}
                          </p>
                        </div>
                        <span className="text-xs bg-lime-100 dark:bg-lime-800 text-lime-700 dark:text-lime-300 px-2 py-0.5 rounded">
                          Current
                        </span>
                      </div>

                      {/* Other compatible batches */}
                      {compatibleBatches.map((batch) => {
                        const isSelected = selectedBatchIds.includes(batch.id)
                        return (
                          <button
                            key={batch.id}
                            type="button"
                            onClick={() => toggleBatchSelection(batch.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                              isSelected
                                ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800'
                                : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-violet-300 dark:hover:border-violet-700'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              isSelected
                                ? 'bg-violet-600 border-violet-600'
                                : 'border-stone-300 dark:border-stone-600'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-sm font-medium text-stone-900 dark:text-white">
                                {batch.poNumber}
                              </p>
                              <p className="text-xs text-stone-500 dark:text-stone-400">
                                {batch.quantity.toLocaleString()} units @ ${batch.unitCost.toFixed(2)}
                              </p>
                            </div>
                            <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
                              ${batch.totalCost.toLocaleString()}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Merged Preview */}
                  {canMerge && (
                    <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4 border border-violet-200 dark:border-violet-800">
                      <p className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase mb-2">
                        Merged Result
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-stone-500 dark:text-stone-400">Batches</p>
                          <p className="text-lg font-semibold text-stone-900 dark:text-white">
                            {mergedTotals.count}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-500 dark:text-stone-400">Total Units</p>
                          <p className="text-lg font-semibold text-stone-900 dark:text-white tabular-nums">
                            {mergedTotals.totalQuantity.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-stone-500 dark:text-stone-400">Total Value</p>
                          <p className="text-lg font-semibold text-stone-900 dark:text-white tabular-nums">
                            ${mergedTotals.totalCost.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                        Weighted avg cost: ${mergedTotals.weightedAvgCost.toFixed(2)}/unit
                      </p>
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
                      placeholder="Reason for merge..."
                      rows={2}
                      className="w-full px-4 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                    />
                  </div>
                </>
              )}

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
                  disabled={!canMerge || isSubmitting}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-stone-300 dark:disabled:bg-stone-600 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Merging...' : `Merge ${mergedTotals.count} Batches`}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
