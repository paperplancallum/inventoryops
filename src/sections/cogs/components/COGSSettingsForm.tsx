'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { COGSSettings, COGSSettingsFormData } from '@/lib/supabase/hooks'

interface COGSSettingsFormProps {
  settings?: COGSSettings | null
  onSubmit: (data: COGSSettingsFormData) => Promise<void>
  onCancel: () => void
}

export function COGSSettingsForm({ settings, onSubmit, onCancel }: COGSSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<COGSSettingsFormData>({
    name: settings?.name || '',
    description: settings?.description || '',
    isDefault: settings?.isDefault || false,
    includeProductCost: settings?.includeProductCost ?? true,
    includeShippingToAmazon: settings?.includeShippingToAmazon ?? true,
    includeDutiesTaxes: settings?.includeDutiesTaxes ?? true,
    includeFbaFulfillment: settings?.includeFbaFulfillment ?? false,
    includeFbaStorage: settings?.includeFbaStorage ?? false,
    includeFbaPrep: settings?.includeFbaPrep ?? false,
    includeFbaLabeling: settings?.includeFbaLabeling ?? false,
    includeInboundPlacement: settings?.includeInboundPlacement ?? true,
    includeInboundTransportation: settings?.includeInboundTransportation ?? true,
    includeAwdStorage: settings?.includeAwdStorage ?? false,
    includeAwdProcessing: settings?.includeAwdProcessing ?? false,
    includeAwdTransportation: settings?.includeAwdTransportation ?? false,
    includeReferralFees: settings?.includeReferralFees ?? false,
    includeAdvertising: settings?.includeAdvertising ?? false,
    includeDamagedLost: settings?.includeDamagedLost ?? true,
    includeDisposed: settings?.includeDisposed ?? true,
    includeAssemblyCosts: settings?.includeAssemblyCosts ?? true,
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

  const costCategories = [
    {
      group: 'Base Costs',
      description: 'Core product and shipping costs',
      items: [
        { key: 'includeProductCost', label: 'Product Cost', description: 'Purchase price from supplier' },
        { key: 'includeShippingToAmazon', label: 'Shipping to Amazon', description: 'Transfer/freight costs' },
        { key: 'includeDutiesTaxes', label: 'Duties & Taxes', description: 'Import duties and taxes' },
        { key: 'includeAssemblyCosts', label: 'Assembly Costs', description: 'Work order assembly costs' },
      ],
    },
    {
      group: 'FBA Fees',
      description: 'Amazon fulfillment fees (often calculated by tools like SellerBoard)',
      items: [
        { key: 'includeFbaFulfillment', label: 'FBA Fulfillment', description: 'Per-unit fulfillment fee' },
        { key: 'includeFbaStorage', label: 'FBA Storage', description: 'Monthly storage fees' },
        { key: 'includeFbaPrep', label: 'FBA Prep', description: 'Prep service fees' },
        { key: 'includeFbaLabeling', label: 'FBA Labeling', description: 'Labeling service fees' },
      ],
    },
    {
      group: 'Inbound Fees',
      description: 'Fees for sending inventory to Amazon',
      items: [
        { key: 'includeInboundPlacement', label: 'Inbound Placement', description: 'Distribution placement fees' },
        { key: 'includeInboundTransportation', label: 'Inbound Transportation', description: 'Amazon partner carrier fees' },
      ],
    },
    {
      group: 'AWD Fees',
      description: 'Amazon Warehousing & Distribution fees',
      items: [
        { key: 'includeAwdStorage', label: 'AWD Storage', description: 'AWD storage fees' },
        { key: 'includeAwdProcessing', label: 'AWD Processing', description: 'AWD processing fees' },
        { key: 'includeAwdTransportation', label: 'AWD Transportation', description: 'AWD to FBA transfer fees' },
      ],
    },
    {
      group: 'Other Fees',
      description: 'Additional Amazon fees',
      items: [
        { key: 'includeReferralFees', label: 'Referral Fees', description: 'Amazon sales commission' },
        { key: 'includeAdvertising', label: 'Advertising', description: 'PPC and advertising costs' },
      ],
    },
    {
      group: 'Adjustments',
      description: 'Inventory losses and write-offs',
      items: [
        { key: 'includeDamagedLost', label: 'Damaged/Lost', description: 'Damaged or lost inventory' },
        { key: 'includeDisposed', label: 'Disposed', description: 'Disposed inventory' },
      ],
    },
  ]

  const toggleAll = (groupItems: { key: string }[], value: boolean) => {
    const updates = groupItems.reduce((acc, item) => {
      ;(acc as Record<string, boolean>)[item.key] = value
      return acc
    }, {} as Partial<COGSSettingsFormData>)
    setFormData(prev => ({ ...prev, ...updates }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 py-8">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {settings ? 'Edit Settings Profile' : 'New Settings Profile'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Name & Description */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Profile Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., SellerBoard Export"
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
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
          </div>

          {/* Default Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={e => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Set as default profile
            </span>
          </label>

          {/* Cost Categories */}
          <div className="space-y-6">
            {costCategories.map(category => (
              <div key={category.group} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {category.group}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {category.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAll(category.items, true)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      All
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => toggleAll(category.items, false)}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:underline"
                    >
                      None
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {category.items.map(item => (
                    <label key={item.key} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData[item.key as keyof COGSSettingsFormData] as boolean}
                        onChange={e => setFormData(prev => ({ ...prev, [item.key]: e.target.checked }))}
                        className="mt-0.5 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {item.label}
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
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
            disabled={isSubmitting || !formData.name}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isSubmitting ? 'Saving...' : settings ? 'Update Profile' : 'Create Profile'}
          </button>
        </div>
      </div>
    </div>
  )
}
