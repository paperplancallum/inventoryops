'use client'

import { useState, useMemo } from 'react'
import { X, Plus, GripVertical, Trash2, Ship, Plane, Truck, Zap, Train, AlertCircle, ChevronRight } from 'lucide-react'
import type { RouteComposerProps, RouteFormData, RouteLeg } from '@/../product/sections/settings/types'
import type { ShippingMethod } from '@/../product/sections/inventory-intelligence/types'
import { computeRouteTotals } from '@/../product/sections/settings/types'

const methodIcons: Record<ShippingMethod, typeof Ship> = {
  sea: Ship,
  air: Plane,
  ground: Truck,
  express: Zap,
  rail: Train,
}

const methodColors: Record<ShippingMethod, string> = {
  sea: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  air: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ground: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  express: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  rail: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export function RouteComposer({
  route,
  legs,
  existingRoutes,
  onSubmit,
  onCancel,
}: RouteComposerProps) {
  const [name, setName] = useState(route?.name || '')
  const [selectedLegIds, setSelectedLegIds] = useState<string[]>(route?.legIds || [])
  const [isDefault, setIsDefault] = useState(route?.isDefault || false)
  const [notes, setNotes] = useState(route?.notes || '')

  const isEditing = !!route

  // Get selected legs in order
  const selectedLegs = useMemo(() => {
    return selectedLegIds
      .map((id) => legs.find((l) => l.id === id))
      .filter((l): l is RouteLeg => l !== undefined)
  }, [selectedLegIds, legs])

  // Compute totals from selected legs
  const totals = useMemo(() => {
    if (selectedLegs.length === 0) return null
    return computeRouteTotals(selectedLegs)
  }, [selectedLegs])

  // Validate leg chain (each leg's end must match next leg's start)
  const chainValidation = useMemo(() => {
    if (selectedLegs.length < 2) return { valid: true, errors: [] }

    const errors: string[] = []
    for (let i = 0; i < selectedLegs.length - 1; i++) {
      const current = selectedLegs[i]
      const next = selectedLegs[i + 1]
      if (current.toLocationId !== next.fromLocationId) {
        errors.push(
          `Leg ${i + 1} ends at "${current.toLocationName}" but Leg ${i + 2} starts at "${next.fromLocationName}"`
        )
      }
    }
    return { valid: errors.length === 0, errors }
  }, [selectedLegs])

  // Get available legs for adding (legs not yet selected)
  const availableLegs = useMemo(() => {
    return legs.filter((l) => l.isActive && !selectedLegIds.includes(l.id))
  }, [legs, selectedLegIds])

  // Get legs that could logically connect to the current chain
  const connectableLegs = useMemo(() => {
    if (selectedLegs.length === 0) {
      // Any origin leg is fine
      return availableLegs
    }
    // Filter to legs that start where the current chain ends
    const lastLeg = selectedLegs[selectedLegs.length - 1]
    return availableLegs.filter((l) => l.fromLocationId === lastLeg.toLocationId)
  }, [selectedLegs, availableLegs])

  // Check for duplicate routes
  const isDuplicate = useMemo(() => {
    if (selectedLegIds.length === 0) return false
    return existingRoutes.some(
      (r) =>
        r.id !== route?.id &&
        r.legIds.length === selectedLegIds.length &&
        r.legIds.every((id, index) => id === selectedLegIds[index])
    )
  }, [selectedLegIds, existingRoutes, route?.id])

  const handleAddLeg = (legId: string) => {
    setSelectedLegIds([...selectedLegIds, legId])
  }

  const handleRemoveLeg = (index: number) => {
    setSelectedLegIds(selectedLegIds.filter((_, i) => i !== index))
  }

  const handleMoveLeg = (fromIndex: number, toIndex: number) => {
    const newLegIds = [...selectedLegIds]
    const [removed] = newLegIds.splice(fromIndex, 1)
    newLegIds.splice(toIndex, 0, removed)
    setSelectedLegIds(newLegIds)
  }

  // Auto-generate name from legs
  const generateName = () => {
    if (selectedLegs.length === 0) return

    const origin = selectedLegs[0].fromLocationName.split(' ')[0]
    const destination = selectedLegs[selectedLegs.length - 1].toLocationName.split(' ')[0]
    const methods = [...new Set(selectedLegs.map((l) => l.method))]
    const methodLabel = methods.length === 1 ? methods[0].charAt(0).toUpperCase() + methods[0].slice(1) : 'Multi'

    setName(`${origin} to ${destination} ${methodLabel}`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedLegIds.length === 0 || !name || !chainValidation.valid) return

    const data: RouteFormData = {
      name,
      legIds: selectedLegIds,
      isDefault,
      notes,
    }
    onSubmit?.(data)
  }

  const formatCost = (cost: number | null, suffix: string) => {
    if (cost === null || cost === 0) return null
    return `$${cost.toFixed(2)}${suffix}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-slate-800">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Shipping Route' : 'Create Shipping Route'}
          </h2>
          <button
            onClick={onCancel}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Route Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Route Name
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Standard Ocean via LA"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                required
              />
              <button
                type="button"
                onClick={generateName}
                disabled={selectedLegs.length === 0}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Auto
              </button>
            </div>
          </div>

          {/* Selected Legs */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Route Legs ({selectedLegs.length} selected)
            </label>

            {selectedLegs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
                No legs selected. Add legs to compose a route.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedLegs.map((leg, index) => {
                  const MethodIcon = methodIcons[leg.method]
                  return (
                    <div
                      key={leg.id}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
                    >
                      {/* Drag Handle */}
                      <button
                        type="button"
                        className="cursor-grab text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        title="Drag to reorder"
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>

                      {/* Leg Number */}
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {index + 1}
                      </span>

                      {/* Leg Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 dark:text-white text-sm truncate">
                            {leg.fromLocationName.split(' ')[0]}
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-900 dark:text-white text-sm truncate">
                            {leg.toLocationName.split(' ')[0]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${methodColors[leg.method]}`}>
                            <MethodIcon className="h-3 w-3" />
                            {leg.method}
                          </span>
                          <span>{leg.transitDays.typical} days</span>
                          {leg.costs.perUnit && <span>${leg.costs.perUnit}/unit</span>}
                        </div>
                      </div>

                      {/* Move Buttons */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleMoveLeg(index, index - 1)}
                          disabled={index === 0}
                          className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-slate-700"
                          title="Move up"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveLeg(index, index + 1)}
                          disabled={index === selectedLegs.length - 1}
                          className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed dark:hover:bg-slate-700"
                          title="Move down"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveLeg(index)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Chain Validation Errors */}
            {!chainValidation.valid && (
              <div className="mt-2 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                <div className="flex items-center gap-2 text-sm font-medium text-red-800 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  Invalid leg chain
                </div>
                <ul className="mt-1 list-disc list-inside text-xs text-red-700 dark:text-red-400">
                  {chainValidation.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Add Leg */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Add Leg
              {selectedLegs.length > 0 && connectableLegs.length > 0 && (
                <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                  (Showing legs that connect from {selectedLegs[selectedLegs.length - 1].toLocationName.split(' ')[0]})
                </span>
              )}
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {(connectableLegs.length > 0 ? connectableLegs : availableLegs).map((leg) => {
                const MethodIcon = methodIcons[leg.method]
                const isConnectable = connectableLegs.includes(leg)
                return (
                  <button
                    key={leg.id}
                    type="button"
                    onClick={() => handleAddLeg(leg.id)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      isConnectable
                        ? 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20'
                        : 'border-slate-200 opacity-50 hover:border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <Plus className="h-4 w-4 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {leg.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${methodColors[leg.method]}`}>
                          <MethodIcon className="h-3 w-3" />
                          {leg.method}
                        </span>
                        <span>{leg.transitDays.typical} days</span>
                      </div>
                    </div>
                  </button>
                )
              })}
              {availableLegs.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  All available legs have been added to this route.
                </p>
              )}
              {connectableLegs.length === 0 && availableLegs.length > 0 && selectedLegs.length > 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 text-center py-4">
                  No legs connect from the current endpoint. You may need to create a new leg.
                </p>
              )}
            </div>
          </div>

          {/* Summary */}
          {totals && selectedLegs.length > 0 && (
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
              <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                Route Summary
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Origin</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {selectedLegs[0].fromLocationName}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Destination</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {selectedLegs[selectedLegs.length - 1].toLocationName}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Total Transit</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {totals.transitDays.min === totals.transitDays.max
                      ? `${totals.transitDays.typical} days`
                      : `${totals.transitDays.min}-${totals.transitDays.max} days (${totals.transitDays.typical} typical)`}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Total Cost</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {[
                      formatCost(totals.costs.perUnit, '/unit'),
                      formatCost(totals.costs.perKg, '/kg'),
                      formatCost(totals.costs.flatFee, ' flat'),
                    ]
                      .filter(Boolean)
                      .join(' + ') || '—'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Default Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700"
            />
            <label htmlFor="isDefault" className="text-sm text-slate-700 dark:text-slate-300">
              Set as default route for this origin-destination pair
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this route..."
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* Duplicate Warning */}
          {isDuplicate && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              A route with this exact leg combination already exists.
            </div>
          )}

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
              disabled={selectedLegIds.length === 0 || !name || !chainValidation.valid}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditing ? 'Save Changes' : 'Create Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
