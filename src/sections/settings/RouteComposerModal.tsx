'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Plus, Trash2, ArrowRight, GripVertical, Route, AlertTriangle, Check } from 'lucide-react'
import type { ShippingLeg, ShippingRoute, RouteFormData } from './types'
import { LOCATION_TYPES, SHIPPING_METHODS } from '@/lib/supabase/hooks/useShippingLegs'
import { validateLegConnectivity, computeRouteTotals } from '@/lib/supabase/hooks/useShippingRoutes'

interface RouteComposerModalProps {
  route?: ShippingRoute | null
  legs: ShippingLeg[]
  allLegs: ShippingLeg[]
  isOpen: boolean
  onClose: () => void
  onSave: (data: RouteFormData) => Promise<void>
}

export function RouteComposerModal({
  route,
  legs,
  allLegs,
  isOpen,
  onClose,
  onSave,
}: RouteComposerModalProps) {
  const [name, setName] = useState('')
  const [selectedLegIds, setSelectedLegIds] = useState<string[]>([])
  const [isDefault, setIsDefault] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!route

  // Reset form when route changes
  useEffect(() => {
    if (route) {
      setName(route.name)
      setSelectedLegIds([...route.legIds])
      setIsDefault(route.isDefault)
      setNotes(route.notes || '')
    } else {
      setName('')
      setSelectedLegIds([])
      setIsDefault(false)
      setNotes('')
    }
    setError(null)
  }, [route])

  // Get selected legs in order
  const selectedLegs = useMemo(() => {
    return selectedLegIds
      .map(id => allLegs.find(leg => leg.id === id))
      .filter((leg): leg is ShippingLeg => leg !== undefined)
  }, [selectedLegIds, allLegs])

  // Validate leg connectivity
  const validation = useMemo(() => {
    return validateLegConnectivity(selectedLegIds, allLegs)
  }, [selectedLegIds, allLegs])

  // Compute totals
  const totals = useMemo(() => {
    if (selectedLegs.length === 0) return null
    return computeRouteTotals(selectedLegs)
  }, [selectedLegs])

  // Available legs (not already selected)
  const availableLegs = useMemo(() => {
    return allLegs.filter(leg => leg.isActive && !selectedLegIds.includes(leg.id))
  }, [allLegs, selectedLegIds])

  if (!isOpen) return null

  const addLeg = (legId: string) => {
    setSelectedLegIds(prev => [...prev, legId])
  }

  const removeLeg = (index: number) => {
    setSelectedLegIds(prev => prev.filter((_, i) => i !== index))
  }

  const moveLegUp = (index: number) => {
    if (index === 0) return
    setSelectedLegIds(prev => {
      const newIds = [...prev]
      ;[newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]]
      return newIds
    })
  }

  const moveLegDown = (index: number) => {
    if (index === selectedLegIds.length - 1) return
    setSelectedLegIds(prev => {
      const newIds = [...prev]
      ;[newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]]
      return newIds
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Route name is required')
      return
    }

    if (selectedLegIds.length === 0) {
      setError('At least one leg is required')
      return
    }

    if (!validation.valid) {
      setError(validation.errors.join('\n'))
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onSave({
        name: name.trim(),
        legIds: selectedLegIds,
        isDefault,
        notes: notes.trim() || undefined,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save route')
    } finally {
      setSaving(false)
    }
  }

  const getLocationTypeLabel = (type: string) => {
    return LOCATION_TYPES.find(lt => lt.id === type)?.label || type
  }

  const getMethodLabel = (method: string) => {
    return SHIPPING_METHODS.find(sm => sm.id === method)?.label || method
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-3xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
              <Route className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {isEditing ? 'Edit Shipping Route' : 'Create Shipping Route'}
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
                <p className="text-sm text-red-700 dark:text-red-400 whitespace-pre-line">{error}</p>
              </div>
            )}

            {/* Route name */}
            <div>
              <label htmlFor="route-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Route Name <span className="text-red-500">*</span>
              </label>
              <input
                id="route-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Standard Ocean Route (China to FBA)"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                required
              />
            </div>

            {/* Leg Composer */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Route Legs <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Add and arrange legs in order. Each leg must connect to the next.
              </p>

              {/* Selected legs */}
              <div className="space-y-2 mb-4">
                {selectedLegs.length === 0 ? (
                  <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No legs added yet. Add legs below to build your route.
                    </p>
                  </div>
                ) : (
                  selectedLegs.map((leg, index) => {
                    const nextLeg = selectedLegs[index + 1]
                    const hasConnectivityError = nextLeg && leg.toLocationType !== nextLeg.fromLocationType

                    return (
                      <div key={`${leg.id}-${index}`}>
                        <div
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                            hasConnectivityError
                              ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {/* Drag handle / order controls */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => moveLegUp(index)}
                              disabled={index === 0}
                              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                                <path d="M6 3L10 7H2L6 3Z" fill="currentColor" />
                              </svg>
                            </button>
                            <GripVertical className="h-4 w-4 text-slate-300" />
                            <button
                              type="button"
                              onClick={() => moveLegDown(index)}
                              disabled={index === selectedLegs.length - 1}
                              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                                <path d="M6 9L2 5H10L6 9Z" fill="currentColor" />
                              </svg>
                            </button>
                          </div>

                          {/* Leg info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-slate-400">#{index + 1}</span>
                              <span className="text-sm font-medium text-slate-900 dark:text-white">{leg.name}</span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-xs text-slate-600 dark:text-slate-300">
                                {getMethodLabel(leg.method)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                {getLocationTypeLabel(leg.fromLocationType)}
                              </span>
                              <ArrowRight className="h-3 w-3" />
                              <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                {getLocationTypeLabel(leg.toLocationType)}
                              </span>
                              <span className="text-slate-300 dark:text-slate-600">|</span>
                              <span>{leg.transitDays.typical} days</span>
                            </div>
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removeLeg(index)}
                            className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Connectivity error indicator */}
                        {hasConnectivityError && (
                          <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-3 w-3" />
                            <span>
                              Ends at {getLocationTypeLabel(leg.toLocationType)} but next leg starts at {getLocationTypeLabel(nextLeg.fromLocationType)}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Add leg dropdown */}
              {availableLegs.length > 0 && (
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Add a leg</label>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) addLeg(e.target.value)
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  >
                    <option value="">Select a leg to add...</option>
                    {availableLegs.map((leg) => (
                      <option key={leg.id} value={leg.id}>
                        {leg.name} ({getLocationTypeLabel(leg.fromLocationType)} → {getLocationTypeLabel(leg.toLocationType)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Validation status */}
              {selectedLegIds.length > 0 && (
                <div className={`mt-3 flex items-center gap-2 text-sm ${validation.valid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {validation.valid ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>All legs connect properly</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      <span>Leg connectivity issues detected</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Computed totals */}
            {totals && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Route Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total Transit Time</span>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      {totals.transitDays.typical} days
                      <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-1">
                        ({totals.transitDays.min}-{totals.transitDays.max})
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Origin → Destination</span>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {selectedLegs.length > 0 && (
                        <>
                          {getLocationTypeLabel(selectedLegs[0].fromLocationType)} → {getLocationTypeLabel(selectedLegs[selectedLegs.length - 1].toLocationType)}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Set as default */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDefault(!isDefault)}
                className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                  isDefault
                    ? 'bg-violet-500 text-white'
                    : 'border-2 border-slate-300 dark:border-slate-600'
                }`}
              >
                {isDefault && <Check className="h-3 w-3" />}
              </button>
              <div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Set as default route</span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  For this origin-destination pair
                </p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes about this route"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
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
              disabled={saving || !validation.valid}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
