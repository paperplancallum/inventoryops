'use client'

import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type {
  ForecastFormProps,
  ForecastFormData,
  ForecastSource,
  ConfidenceLevel,
  SeasonalMultiplier,
} from '@/../product/sections/inventory-intelligence/types'

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function ForecastForm({
  forecast,
  products,
  locations,
  forecastSources,
  onSubmit,
  onCancel,
}: ForecastFormProps) {
  // Convert number[] seasonal multipliers to SeasonalMultiplier[] for form editing
  const initialSeasonalMultipliers = (): SeasonalMultiplier[] => {
    if (!forecast?.seasonalMultipliers) return []
    // If already SeasonalMultiplier[] format, use as-is
    if (forecast.seasonalMultipliers.length > 0 && typeof forecast.seasonalMultipliers[0] === 'object') {
      return forecast.seasonalMultipliers as unknown as SeasonalMultiplier[]
    }
    // Convert number[] (12 values) to SeasonalMultiplier[] (only non-1.0 values)
    return (forecast.seasonalMultipliers as number[])
      .map((multiplier, index) => ({ month: index + 1, multiplier }))
      .filter(sm => sm.multiplier !== 1.0)
  }

  const [formData, setFormData] = useState<ForecastFormData>({
    productId: forecast?.productId || '',
    locationId: forecast?.locationId || '',
    dailyRate: forecast?.dailyRate || 0,
    source: forecast?.source || 'manual',
    confidence: forecast?.confidence || 'medium',
    seasonalMultipliers: initialSeasonalMultipliers(),
    notes: forecast?.notes || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(formData)
  }

  const addSeasonalMultiplier = () => {
    // Find a month not already used
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
              {forecast ? 'Edit Forecast' : 'Add Sales Forecast'}
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

            {/* Daily Rate */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Daily Sales Rate
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={formData.dailyRate}
                  onChange={(e) =>
                    setFormData({ ...formData, dailyRate: parseInt(e.target.value) || 0 })
                  }
                  className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  required
                />
                <span className="text-sm text-slate-500 dark:text-slate-400">units/day</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Weekly: {formData.dailyRate * 7} units | Monthly: {formData.dailyRate * 30} units
              </p>
            </div>

            {/* Source & Confidence */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Source
                </label>
                <select
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value as ForecastSource })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  {forecastSources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Confidence
                </label>
                <select
                  value={formData.confidence}
                  onChange={(e) =>
                    setFormData({ ...formData, confidence: e.target.value as ConfidenceLevel })
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
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
              {formData.seasonalMultipliers.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No seasonal adjustments. Add multipliers for months with different demand.
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

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                placeholder="Optional notes about this forecast..."
              />
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
                {forecast ? 'Save Changes' : 'Create Forecast'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
