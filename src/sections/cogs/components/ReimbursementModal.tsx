'use client'

import { useState } from 'react'
import { X, DollarSign } from 'lucide-react'
import type { InventoryLoss, ReimbursementData } from '@/lib/supabase/hooks'

interface ReimbursementModalProps {
  loss: InventoryLoss
  onSubmit: (data: ReimbursementData) => Promise<void>
  onCancel: () => void
}

export function ReimbursementModal({ loss, onSubmit, onCancel }: ReimbursementModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<ReimbursementData>({
    amount: loss.reimbursementAmount || loss.totalCost,
    date: loss.reimbursementDate || new Date().toISOString().split('T')[0],
    reference: loss.reimbursementReference || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const remainingLoss = loss.totalCost - formData.amount
  const isFullReimbursement = formData.amount >= loss.totalCost
  const isPartialReimbursement = formData.amount > 0 && formData.amount < loss.totalCost

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Record Reimbursement
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loss Summary */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/30">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500 dark:text-slate-400">SKU</p>
              <p className="font-medium text-slate-900 dark:text-white">{loss.sellerSku}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Quantity</p>
              <p className="font-medium text-slate-900 dark:text-white">{loss.quantity} units</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Total Cost</p>
              <p className="font-medium text-red-600 dark:text-red-400">${loss.totalCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Previous Reimbursement</p>
              <p className="font-medium text-green-600 dark:text-green-400">${loss.reimbursementAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Reimbursement Amount ($) *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              max={loss.totalCost}
              value={formData.amount}
              onChange={e => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, amount: loss.totalCost }))}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Full amount (${loss.totalCost.toFixed(2)})
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Reference
            </label>
            <input
              type="text"
              value={formData.reference || ''}
              onChange={e => setFormData(prev => ({ ...prev, reference: e.target.value }))}
              placeholder="Transaction ID, case number, etc."
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Preview */}
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Status after recording:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isFullReimbursement
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                  : isPartialReimbursement
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
              }`}>
                {isFullReimbursement ? 'Complete' : isPartialReimbursement ? 'Partial' : 'None'}
              </span>
            </div>
            {formData.amount > 0 && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Remaining loss:</span>
                <span className={`font-medium ${remainingLoss > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                  ${Math.max(0, remainingLoss).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || formData.amount <= 0}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Record Reimbursement'}
          </button>
        </div>
      </div>
    </div>
  )
}
