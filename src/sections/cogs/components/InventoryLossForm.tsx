'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { InventoryLoss, InventoryLossFormData, InventoryLossType } from '@/lib/supabase/hooks'

const LOSS_TYPES: { value: InventoryLossType; label: string; description: string }[] = [
  { value: 'damaged_inbound', label: 'Damaged (Inbound)', description: 'Damaged during shipping to Amazon' },
  { value: 'damaged_warehouse', label: 'Damaged (Warehouse)', description: 'Damaged at Amazon fulfillment center' },
  { value: 'damaged_customer', label: 'Damaged (Customer)', description: 'Damaged customer returns' },
  { value: 'lost_inbound', label: 'Lost (Inbound)', description: 'Lost during shipping to Amazon' },
  { value: 'lost_warehouse', label: 'Lost (Warehouse)', description: 'Lost at Amazon fulfillment center' },
  { value: 'disposed', label: 'Disposed', description: 'Disposed by Amazon' },
  { value: 'expired', label: 'Expired', description: 'Expired products' },
  { value: 'recalled', label: 'Recalled', description: 'Product recall' },
  { value: 'write_off', label: 'Write-off', description: 'Manual inventory write-off' },
]

interface InventoryLossFormProps {
  loss?: InventoryLoss | null
  onSubmit: (data: InventoryLossFormData) => Promise<void>
  onCancel: () => void
}

export function InventoryLossForm({ loss, onSubmit, onCancel }: InventoryLossFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<InventoryLossFormData>({
    lossType: loss?.lossType || 'damaged_warehouse',
    description: loss?.description || '',
    sellerSku: loss?.sellerSku || '',
    fnsku: loss?.fnsku || '',
    marketplace: loss?.marketplace || 'US',
    quantity: loss?.quantity || 1,
    unitCost: loss?.unitCost || 0,
    lossDate: loss?.lossDate || new Date().toISOString().split('T')[0],
    amazonCaseId: loss?.amazonCaseId || '',
    includeInCogs: loss?.includeInCogs ?? true,
    notes: loss?.notes || '',
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

  const totalCost = formData.quantity * formData.unitCost

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 py-8">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {loss ? 'Edit Inventory Loss' : 'Record Inventory Loss'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Loss Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Loss Type *
            </label>
            <select
              required
              value={formData.lossType}
              onChange={e => setFormData(prev => ({ ...prev, lossType: e.target.value as InventoryLossType }))}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {LOSS_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {LOSS_TYPES.find(t => t.value === formData.lossType)?.description}
            </p>
          </div>

          {/* SKU & Date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Seller SKU *
              </label>
              <input
                type="text"
                required
                value={formData.sellerSku}
                onChange={e => setFormData(prev => ({ ...prev, sellerSku: e.target.value }))}
                placeholder="e.g., ABC-123"
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Loss Date *
              </label>
              <input
                type="date"
                required
                value={formData.lossDate}
                onChange={e => setFormData(prev => ({ ...prev, lossDate: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Quantity & Unit Cost */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={e => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Unit Cost ($) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.unitCost}
                onChange={e => setFormData(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Total Cost
              </label>
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-red-600 dark:text-red-400">
                ${totalCost.toFixed(2)}
              </div>
            </div>
          </div>

          {/* FNSKU & Marketplace */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                FNSKU
              </label>
              <input
                type="text"
                value={formData.fnsku || ''}
                onChange={e => setFormData(prev => ({ ...prev, fnsku: e.target.value }))}
                placeholder="Optional"
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Marketplace
              </label>
              <select
                value={formData.marketplace || 'US'}
                onChange={e => setFormData(prev => ({ ...prev, marketplace: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="US">US</option>
                <option value="CA">Canada</option>
                <option value="MX">Mexico</option>
                <option value="UK">UK</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="IT">Italy</option>
                <option value="ES">Spain</option>
              </select>
            </div>
          </div>

          {/* Amazon Case ID */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Amazon Case ID
            </label>
            <input
              type="text"
              value={formData.amazonCaseId || ''}
              onChange={e => setFormData(prev => ({ ...prev, amazonCaseId: e.target.value }))}
              placeholder="For reimbursement claims"
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the loss"
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes"
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Include in COGS */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.includeInCogs}
              onChange={e => setFormData(prev => ({ ...prev, includeInCogs: e.target.checked }))}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Include in COGS calculations
            </span>
          </label>
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
            disabled={isSubmitting || !formData.sellerSku || formData.quantity < 1}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isSubmitting ? 'Saving...' : loss ? 'Update Loss' : 'Record Loss'}
          </button>
        </div>
      </div>
    </div>
  )
}
