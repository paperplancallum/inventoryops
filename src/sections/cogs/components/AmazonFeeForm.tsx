'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { AmazonFee, AmazonFeeFormData, AmazonFeeType, FeeAttributionLevel } from '@/lib/supabase/hooks'

const FEE_TYPES: { value: AmazonFeeType; label: string; group: string }[] = [
  { value: 'fba_fulfillment', label: 'FBA Fulfillment', group: 'FBA' },
  { value: 'fba_storage_monthly', label: 'FBA Storage (Monthly)', group: 'FBA' },
  { value: 'fba_storage_long_term', label: 'FBA Storage (Long-term)', group: 'FBA' },
  { value: 'fba_removal', label: 'FBA Removal', group: 'FBA' },
  { value: 'fba_disposal', label: 'FBA Disposal', group: 'FBA' },
  { value: 'fba_prep', label: 'FBA Prep', group: 'FBA' },
  { value: 'fba_labeling', label: 'FBA Labeling', group: 'FBA' },
  { value: 'inbound_placement', label: 'Inbound Placement', group: 'Inbound' },
  { value: 'inbound_defect', label: 'Inbound Defect', group: 'Inbound' },
  { value: 'inbound_transportation', label: 'Inbound Transportation', group: 'Inbound' },
  { value: 'awd_storage', label: 'AWD Storage', group: 'AWD' },
  { value: 'awd_processing', label: 'AWD Processing', group: 'AWD' },
  { value: 'awd_transportation', label: 'AWD Transportation', group: 'AWD' },
  { value: 'referral_fee', label: 'Referral Fee', group: 'Sales' },
  { value: 'sponsored_products', label: 'Sponsored Products', group: 'Advertising' },
  { value: 'sponsored_brands', label: 'Sponsored Brands', group: 'Advertising' },
  { value: 'sponsored_display', label: 'Sponsored Display', group: 'Advertising' },
  { value: 'reimbursement', label: 'Reimbursement', group: 'Other' },
  { value: 'refund_admin', label: 'Refund Admin', group: 'Other' },
  { value: 'other', label: 'Other', group: 'Other' },
]

const ATTRIBUTION_LEVELS: { value: FeeAttributionLevel; label: string; description: string }[] = [
  { value: 'order_item', label: 'Order Item', description: 'Tied to a specific order item' },
  { value: 'shipment', label: 'Shipment', description: 'Tied to an inbound shipment' },
  { value: 'product', label: 'Product', description: 'Applies to a product across orders' },
  { value: 'account', label: 'Account', description: 'Account-level fee to be prorated' },
]

interface AmazonFeeFormProps {
  fee?: AmazonFee | null
  onSubmit: (data: AmazonFeeFormData) => Promise<void>
  onCancel: () => void
}

export function AmazonFeeForm({ fee, onSubmit, onCancel }: AmazonFeeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<AmazonFeeFormData>({
    feeType: fee?.feeType || 'fba_fulfillment',
    description: fee?.description || '',
    amount: fee?.amount || 0,
    originalCurrency: fee?.originalCurrency || 'USD',
    originalAmount: fee?.originalAmount || undefined,
    exchangeRateToUsd: fee?.exchangeRateToUsd || 1.0,
    attributionLevel: fee?.attributionLevel || 'account',
    feeDate: fee?.feeDate || new Date().toISOString().split('T')[0],
    periodStart: fee?.periodStart || undefined,
    periodEnd: fee?.periodEnd || undefined,
    marketplace: fee?.marketplace || 'US',
    sourceReference: fee?.sourceReference || '',
    includeInCogs: fee?.includeInCogs ?? true,
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

  const groupedFeeTypes = FEE_TYPES.reduce((acc, type) => {
    if (!acc[type.group]) acc[type.group] = []
    acc[type.group].push(type)
    return acc
  }, {} as Record<string, typeof FEE_TYPES>)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 py-8">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {fee ? 'Edit Amazon Fee' : 'Add Amazon Fee'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Fee Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Fee Type *
            </label>
            <select
              required
              value={formData.feeType}
              onChange={e => setFormData(prev => ({ ...prev, feeType: e.target.value as AmazonFeeType }))}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(groupedFeeTypes).map(([group, types]) => (
                <optgroup key={group} label={group}>
                  {types.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Attribution Level */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Attribution Level *
            </label>
            <select
              required
              value={formData.attributionLevel}
              onChange={e => setFormData(prev => ({ ...prev, attributionLevel: e.target.value as FeeAttributionLevel }))}
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {ATTRIBUTION_LEVELS.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {ATTRIBUTION_LEVELS.find(l => l.value === formData.attributionLevel)?.description}
            </p>
          </div>

          {/* Amount & Date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Amount (USD) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.amount}
                onChange={e => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="Positive = charge, Negative = credit"
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Use negative for reimbursements/credits
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Fee Date *
              </label>
              <input
                type="date"
                required
                value={formData.feeDate}
                onChange={e => setFormData(prev => ({ ...prev, feeDate: e.target.value }))}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Period (for storage fees) */}
          {(formData.feeType.includes('storage') || formData.attributionLevel === 'account') && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Period Start
                </label>
                <input
                  type="date"
                  value={formData.periodStart || ''}
                  onChange={e => setFormData(prev => ({ ...prev, periodStart: e.target.value || undefined }))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Period End
                </label>
                <input
                  type="date"
                  value={formData.periodEnd || ''}
                  onChange={e => setFormData(prev => ({ ...prev, periodEnd: e.target.value || undefined }))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Marketplace */}
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

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description"
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Source Reference */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Source Reference
            </label>
            <input
              type="text"
              value={formData.sourceReference || ''}
              onChange={e => setFormData(prev => ({ ...prev, sourceReference: e.target.value }))}
              placeholder="Transaction ID, report reference, etc."
              className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isSubmitting ? 'Saving...' : fee ? 'Update Fee' : 'Add Fee'}
          </button>
        </div>
      </div>
    </div>
  )
}
