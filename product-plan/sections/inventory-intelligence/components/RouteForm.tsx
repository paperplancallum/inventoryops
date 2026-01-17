'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { RouteFormProps, RouteFormData, ShippingMethod } from '@/../product/sections/inventory-intelligence/types'

export function RouteForm({
  route,
  locations,
  shippingMethods,
  existingRoutes,
  onSubmit,
  onCancel,
}: RouteFormProps) {
  const [formData, setFormData] = useState<RouteFormData>({
    name: route?.name || '',
    fromLocationId: route?.fromLocationId || '',
    toLocationId: route?.toLocationId || '',
    method: route?.method || 'ground',
    transitDays: route?.transitDays || { min: 1, typical: 1, max: 2 },
    costs: route?.costs || { perUnit: null, perKg: null, flatFee: null, currency: 'USD' },
    isDefault: route?.isDefault || false,
    notes: route?.notes || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(formData)
  }

  const generateRouteName = () => {
    const fromLoc = locations.find((l) => l.id === formData.fromLocationId)
    const toLoc = locations.find((l) => l.id === formData.toLocationId)
    const methodLabel = shippingMethods.find((m) => m.id === formData.method)?.label || formData.method
    if (fromLoc && toLoc) {
      return `${fromLoc.name} to ${toLoc.name} ${methodLabel}`
    }
    return ''
  }

  // Check if route pair already has a default
  const hasExistingDefault = existingRoutes.some(
    (r) =>
      r.id !== route?.id &&
      r.fromLocationId === formData.fromLocationId &&
      r.toLocationId === formData.toLocationId &&
      r.isDefault
  )

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {route ? 'Edit Route' : 'Add Shipping Route'}
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
            {/* Route Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Route Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  placeholder="e.g., FlexPort LA to PHX7 Ground"
                  required
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, name: generateRouteName() })}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Auto
                </button>
              </div>
            </div>

            {/* From/To Locations */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  From Location
                </label>
                <select
                  value={formData.fromLocationId}
                  onChange={(e) => setFormData({ ...formData, fromLocationId: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  required
                >
                  <option value="">Select origin...</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  To Location
                </label>
                <select
                  value={formData.toLocationId}
                  onChange={(e) => setFormData({ ...formData, toLocationId: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  required
                >
                  <option value="">Select destination...</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Shipping Method */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Shipping Method
              </label>
              <select
                value={formData.method}
                onChange={(e) =>
                  setFormData({ ...formData, method: e.target.value as ShippingMethod })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                {shippingMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Transit Days */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Transit Days
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Min
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.transitDays.min}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transitDays: {
                          ...formData.transitDays,
                          min: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Typical
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.transitDays.typical}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transitDays: {
                          ...formData.transitDays,
                          typical: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Max
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.transitDays.max}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        transitDays: {
                          ...formData.transitDays,
                          max: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Costs */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Costs (USD)
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Per Unit
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costs.perUnit || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costs: {
                          ...formData.costs,
                          perUnit: e.target.value ? parseFloat(e.target.value) : null,
                        },
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Per Kg
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costs.perKg || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costs: {
                          ...formData.costs,
                          perKg: e.target.value ? parseFloat(e.target.value) : null,
                        },
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Flat Fee
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costs.flatFee || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costs: {
                          ...formData.costs,
                          flatFee: e.target.value ? parseFloat(e.target.value) : null,
                        },
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Default Route */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700"
              />
              <label htmlFor="isDefault" className="text-sm text-slate-700 dark:text-slate-300">
                Set as default route for this origin-destination pair
              </label>
            </div>
            {hasExistingDefault && formData.isDefault && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                This will replace the existing default route for this pair.
              </p>
            )}

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
                placeholder="Optional notes about this route..."
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
                {route ? 'Save Changes' : 'Create Route'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
