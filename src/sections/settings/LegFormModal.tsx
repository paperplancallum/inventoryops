'use client'

import { useState, useEffect } from 'react'
import { X, ArrowRight, Truck } from 'lucide-react'
import type { ShippingLeg, LegFormData, LocationType, ShippingMethod } from './types'
import { LOCATION_TYPES, SHIPPING_METHODS } from '@/lib/supabase/hooks/useShippingLegs'

interface LegFormModalProps {
  leg?: ShippingLeg | null
  isOpen: boolean
  onClose: () => void
  onSave: (data: LegFormData) => Promise<void>
}

export function LegFormModal({
  leg,
  isOpen,
  onClose,
  onSave,
}: LegFormModalProps) {
  const [formData, setFormData] = useState<LegFormData>({
    name: '',
    fromLocationType: 'factory',
    fromLocationName: '',
    toLocationType: 'warehouse',
    toLocationName: '',
    method: 'ocean-fcl',
    transitDaysMin: 0,
    transitDaysTypical: 0,
    transitDaysMax: 0,
    costPerUnit: null,
    costPerKg: null,
    costFlatFee: null,
    costCurrency: 'USD',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!leg

  // Reset form when leg changes
  useEffect(() => {
    if (leg) {
      setFormData({
        name: leg.name,
        fromLocationType: leg.fromLocationType,
        fromLocationName: leg.fromLocationName,
        toLocationType: leg.toLocationType,
        toLocationName: leg.toLocationName,
        method: leg.method,
        transitDaysMin: leg.transitDays.min,
        transitDaysTypical: leg.transitDays.typical,
        transitDaysMax: leg.transitDays.max,
        costPerUnit: leg.costs.perUnit,
        costPerKg: leg.costs.perKg,
        costFlatFee: leg.costs.flatFee,
        costCurrency: leg.costs.currency,
        notes: leg.notes || '',
      })
    } else {
      setFormData({
        name: '',
        fromLocationType: 'factory',
        fromLocationName: '',
        toLocationType: 'warehouse',
        toLocationName: '',
        method: 'ocean-fcl',
        transitDaysMin: 0,
        transitDaysTypical: 0,
        transitDaysMax: 0,
        costPerUnit: null,
        costPerKg: null,
        costFlatFee: null,
        costCurrency: 'USD',
        notes: '',
      })
    }
    setError(null)
  }, [leg])

  if (!isOpen) return null

  const updateField = <K extends keyof LegFormData>(field: K, value: LegFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      setError('Leg name is required')
      return
    }
    if (!formData.fromLocationName.trim()) {
      setError('Origin location name is required')
      return
    }
    if (!formData.toLocationName.trim()) {
      setError('Destination location name is required')
      return
    }
    if (formData.transitDaysMin > formData.transitDaysTypical) {
      setError('Minimum transit days cannot exceed typical')
      return
    }
    if (formData.transitDaysTypical > formData.transitDaysMax) {
      setError('Typical transit days cannot exceed maximum')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save leg')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Truck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {isEditing ? 'Edit Shipping Leg' : 'Create Shipping Leg'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Leg name */}
            <div>
              <label htmlFor="leg-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Leg Name <span className="text-red-500">*</span>
              </label>
              <input
                id="leg-name"
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., Factory to 3PL (Ocean)"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              />
            </div>

            {/* Origin and Destination */}
            <div className="grid grid-cols-2 gap-4 items-start">
              {/* Origin */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Origin</h4>
                <div>
                  <label htmlFor="from-type" className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Location Type
                  </label>
                  <select
                    id="from-type"
                    value={formData.fromLocationType}
                    onChange={(e) => updateField('fromLocationType', e.target.value as LocationType)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {LOCATION_TYPES.map((lt) => (
                      <option key={lt.id} value={lt.id}>{lt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="from-name" className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Location Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="from-name"
                    type="text"
                    value={formData.fromLocationName}
                    onChange={(e) => updateField('fromLocationName', e.target.value)}
                    placeholder="e.g., Shenzhen Factory"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden md:flex items-center justify-center pt-8">
                <ArrowRight className="h-6 w-6 text-slate-400" />
              </div>

              {/* Destination */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Destination</h4>
                <div>
                  <label htmlFor="to-type" className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Location Type
                  </label>
                  <select
                    id="to-type"
                    value={formData.toLocationType}
                    onChange={(e) => updateField('toLocationType', e.target.value as LocationType)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {LOCATION_TYPES.map((lt) => (
                      <option key={lt.id} value={lt.id}>{lt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="to-name" className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Location Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="to-name"
                    type="text"
                    value={formData.toLocationName}
                    onChange={(e) => updateField('toLocationName', e.target.value)}
                    placeholder="e.g., LA 3PL Warehouse"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Shipping Method */}
            <div>
              <label htmlFor="method" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Shipping Method
              </label>
              <select
                id="method"
                value={formData.method}
                onChange={(e) => updateField('method', e.target.value as ShippingMethod)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {SHIPPING_METHODS.map((sm) => (
                  <option key={sm.id} value={sm.id}>{sm.label}</option>
                ))}
              </select>
            </div>

            {/* Transit Days */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Transit Time (Days)
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="transit-min" className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Minimum
                  </label>
                  <input
                    id="transit-min"
                    type="number"
                    min="0"
                    value={formData.transitDaysMin}
                    onChange={(e) => updateField('transitDaysMin', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="transit-typical" className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Typical
                  </label>
                  <input
                    id="transit-typical"
                    type="number"
                    min="0"
                    value={formData.transitDaysTypical}
                    onChange={(e) => updateField('transitDaysTypical', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="transit-max" className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Maximum
                  </label>
                  <input
                    id="transit-max"
                    type="number"
                    min="0"
                    value={formData.transitDaysMax}
                    onChange={(e) => updateField('transitDaysMax', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Costs */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Costs (Optional)
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="cost-unit" className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Per Unit ($)
                  </label>
                  <input
                    id="cost-unit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costPerUnit ?? ''}
                    onChange={(e) => updateField('costPerUnit', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="cost-kg" className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Per Kg ($)
                  </label>
                  <input
                    id="cost-kg"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costPerKg ?? ''}
                    onChange={(e) => updateField('costPerKg', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="cost-flat" className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Flat Fee ($)
                  </label>
                  <input
                    id="cost-flat"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costFlatFee ?? ''}
                    onChange={(e) => updateField('costFlatFee', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Optional notes about this leg"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Leg'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
