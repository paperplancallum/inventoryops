'use client'

import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type {
  SafetyStockFormProps,
  SafetyStockFormData,
  ThresholdType,
  SeasonalMultiplier,
} from '@/../product/sections/inventory-intelligence/types'

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function SafetyStockForm({
  rule,
  products,
  locations,
  thresholdTypes,
  onSubmit,
  onCancel,
}: SafetyStockFormProps) {
  const [formData, setFormData] = useState<SafetyStockFormData>({
    productId: rule?.productId || '',
    locationId: rule?.locationId || '',
    thresholdType: rule?.thresholdType || 'days-of-cover',
    thresholdValue: rule?.thresholdValue || 14,
    seasonalMultipliers: rule?.seasonalMultipliers || [],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(formData)
  }

  const addSeasonalMultiplier = () => {
    const usedMonths = formData.seasonalMultipliers.map((sm) => sm.month)
    const availableMonth = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].find(
      (m) => !usedMonths.includes(m)
    )
    if (availableMonth) {
      setFormData({
        ...formData,
        seasonalMultipliers: [
          ...formData.seasonalMultipliers,
          { month: availableMonth, multiplier: 1.5 },
        ],
      })
    }
  }

  const updateSeasonalMultiplier = (index: number, updates: Partial<SeasonalMultiplier>) => {
    const updated = [...formData.seasonalMultipliers]
    updated[index] = { ...updated[index], ...updates }
    setFormData({ ...formData, seasonalMultipliers: updated })
  }

  const removeSeasonalMultiplier = (index: number) => {
    setFormData({
      ...formData,
      seasonalMultipliers: formData.seasonalMultipliers.filter((_, i) => i !== index),
    })
  }

  // Filter locations to show primarily Amazon locations
  const amazonLocations = locations.filter((l) =>
    l.type.includes('amazon') || l.type === 'amazon-fba' || l.type === 'amazon-awd'
  )

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {rule ? 'Edit Safety Stock Rule' : 'Add Safety Stock Rule'}
            </h2>
            <button
              onClick={onCancel}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Product */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Product
              </label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                required
              >
                <option value="">Select product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.sku} - {product.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Location
              </label>
              <select
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                required
              >
                <option value="">Select location...</option>
                <optgroup label="Amazon Locations">
                  {amazonLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Other Locations">
                  {locations
                    .filter((l) => !amazonLocations.includes(l))
                    .map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            {/* Threshold Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Threshold Type
                </label>
                <select
                  value={formData.thresholdType}
                  onChange={(e) =>
                    setFormData({ ...formData, thresholdType: e.target.value as ThresholdType })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  {thresholdTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Value
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={formData.thresholdValue}
                    onChange={(e) =>
                      setFormData({ ...formData, thresholdValue: parseInt(e.target.value) || 1 })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    required
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {formData.thresholdType === 'units' ? 'units' : 'days'}
                  </span>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {formData.thresholdType === 'units' ? (
                  <>
                    Alert when stock falls below{' '}
                    <span className="font-medium">{formData.thresholdValue.toLocaleString()} units</span>
                  </>
                ) : (
                  <>
                    Alert when stock covers less than{' '}
                    <span className="font-medium">{formData.thresholdValue} days</span> of forecasted sales
                  </>
                )}
              </p>
            </div>

            {/* Seasonal Multipliers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Seasonal Multipliers
                </label>
                <button
                  type="button"
                  onClick={addSeasonalMultiplier}
                  disabled={formData.seasonalMultipliers.length >= 12}
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Increase the threshold during high-demand periods (e.g., 2x during holidays)
              </p>
              {formData.seasonalMultipliers.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  No seasonal adjustments configured.
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.seasonalMultipliers.map((sm, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <select
                        value={sm.month}
                        onChange={(e) =>
                          updateSeasonalMultiplier(index, { month: parseInt(e.target.value) })
                        }
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      >
                        {months.map((month, i) => (
                          <option key={i + 1} value={i + 1}>
                            {month}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={sm.multiplier}
                        onChange={(e) =>
                          updateSeasonalMultiplier(index, {
                            multiplier: parseFloat(e.target.value) || 1,
                          })
                        }
                        className="w-20 rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      />
                      <span className="text-sm text-slate-500">x</span>
                      <button
                        type="button"
                        onClick={() => removeSeasonalMultiplier(index)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                {rule ? 'Save Changes' : 'Create Rule'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
