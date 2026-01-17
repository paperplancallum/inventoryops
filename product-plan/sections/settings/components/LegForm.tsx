'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Ship, Plane, Truck, Zap, Train } from 'lucide-react'
import type { LegFormProps, LegFormData } from '@/../product/sections/settings/types'
import type { ShippingMethod } from '@/../product/sections/inventory-intelligence/types'
import { SearchableSelect, type SelectGroup } from '@/components/ui/searchable-select'

const methodIcons: Record<ShippingMethod, typeof Ship> = {
  sea: Ship,
  air: Plane,
  ground: Truck,
  express: Zap,
  rail: Train,
}

// Group labels for location types
const locationTypeLabels: Record<string, string> = {
  'factory': 'Factories',
  'warehouse': 'Warehouses',
  '3pl': '3PL Warehouses',
  'amazon-fba': 'Amazon FBA',
  'amazon-awd': 'Amazon AWD',
  'port': 'Ports',
  'customs': 'Customs',
}

export function LegForm({
  leg,
  locations,
  shippingMethods,
  existingLegs,
  onSubmit,
  onCancel,
}: LegFormProps) {
  const [name, setName] = useState(leg?.name || '')
  const [fromLocationId, setFromLocationId] = useState(leg?.fromLocationId || '')
  const [toLocationId, setToLocationId] = useState(leg?.toLocationId || '')
  const [method, setMethod] = useState<ShippingMethod>(leg?.method || 'ground')
  const [transitDaysMin, setTransitDaysMin] = useState(leg?.transitDays.min || 1)
  const [transitDaysTypical, setTransitDaysTypical] = useState(leg?.transitDays.typical || 1)
  const [transitDaysMax, setTransitDaysMax] = useState(leg?.transitDays.max || 2)
  const [costPerUnit, setCostPerUnit] = useState<string>(leg?.costs.perUnit?.toString() || '')
  const [costPerKg, setCostPerKg] = useState<string>(leg?.costs.perKg?.toString() || '')
  const [costFlatFee, setCostFlatFee] = useState<string>(leg?.costs.flatFee?.toString() || '')
  const [notes, setNotes] = useState(leg?.notes || '')

  // Build grouped options for From Location (factories, warehouses, 3PL, ports)
  const fromLocationOptions = useMemo((): SelectGroup[] => {
    const groups: Record<string, { value: string; label: string }[]> = {}

    for (const loc of locations) {
      // Exclude Amazon locations from "From" options - legs don't originate from Amazon
      if (loc.type === 'amazon-fba' || loc.type === 'amazon-awd') continue

      const groupLabel = locationTypeLabels[loc.type] || loc.type
      if (!groups[groupLabel]) {
        groups[groupLabel] = []
      }
      groups[groupLabel].push({ value: loc.id, label: loc.name })
    }

    return Object.entries(groups).map(([label, options]) => ({ label, options }))
  }, [locations])

  // Build grouped options for To Location (with Amazon categories first)
  const toLocationOptions = useMemo((): SelectGroup[] => {
    const groups: SelectGroup[] = []

    // Add Amazon categories first
    groups.push({
      label: 'Amazon Categories',
      options: [
        { value: 'type:amazon-fba', label: 'Amazon FBA', description: 'Any FBA warehouse' },
        { value: 'type:amazon-awd', label: 'Amazon AWD', description: 'Any AWD warehouse' },
      ]
    })

    // Group other locations by type
    const otherGroups: Record<string, { value: string; label: string }[]> = {}

    for (const loc of locations) {
      // Skip Amazon locations - they're handled as categories above
      if (loc.type === 'amazon-fba' || loc.type === 'amazon-awd') continue

      const groupLabel = locationTypeLabels[loc.type] || loc.type
      if (!otherGroups[groupLabel]) {
        otherGroups[groupLabel] = []
      }
      otherGroups[groupLabel].push({ value: loc.id, label: loc.name })
    }

    // Add non-Amazon groups
    for (const [label, options] of Object.entries(otherGroups)) {
      groups.push({ label, options })
    }

    return groups
  }, [locations])

  // Check for duplicate leg
  const isDuplicate = existingLegs.some(
    (l) =>
      l.id !== leg?.id &&
      l.fromLocationId === fromLocationId &&
      l.toLocationId === toLocationId &&
      l.method === method
  )

  // Auto-generate name
  const generateName = () => {
    const fromLoc = locations.find((l) => l.id === fromLocationId)
    const methodLabel = shippingMethods.find((m) => m.id === method)?.label || method

    // Handle category-based destinations
    let toShort = ''
    if (toLocationId.startsWith('type:')) {
      const locType = toLocationId.replace('type:', '')
      toShort = locType === 'amazon-fba' ? 'FBA' : locType === 'amazon-awd' ? 'AWD' : locType
    } else {
      const toLoc = locations.find((l) => l.id === toLocationId)
      if (toLoc) {
        toShort = toLoc.name.split(' ')[0]
      }
    }

    if (fromLoc && toShort) {
      // Extract short name from source (e.g., "Shenzhen" from "Shenzhen Drinkware Factory")
      const fromShort = fromLoc.name.split(' ')[0]
      setName(`${fromShort} to ${toShort} ${methodLabel}`)
    }
  }

  // Auto-update typical when min/max change
  useEffect(() => {
    if (transitDaysTypical < transitDaysMin) {
      setTransitDaysTypical(transitDaysMin)
    }
    if (transitDaysTypical > transitDaysMax) {
      setTransitDaysTypical(transitDaysMax)
    }
  }, [transitDaysMin, transitDaysMax, transitDaysTypical])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fromLocationId || !toLocationId || !name) return

    const data: LegFormData = {
      name,
      fromLocationId,
      toLocationId,
      method,
      transitDaysMin,
      transitDaysTypical,
      transitDaysMax,
      costPerUnit: costPerUnit ? parseFloat(costPerUnit) : null,
      costPerKg: costPerKg ? parseFloat(costPerKg) : null,
      costFlatFee: costFlatFee ? parseFloat(costFlatFee) : null,
      notes,
    }
    onSubmit?.(data)
  }

  const isEditing = !!leg

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Shipping Leg' : 'Add Shipping Leg'}
          </h2>
          <button
            onClick={onCancel}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Leg Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Leg Name
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Shenzhen to LA Ocean"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                required
              />
              <button
                type="button"
                onClick={generateName}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
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
              <SearchableSelect
                options={fromLocationOptions}
                value={fromLocationId}
                onChange={setFromLocationId}
                placeholder="Select origin..."
                searchPlaceholder="Search locations..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                To Location
              </label>
              <SearchableSelect
                options={toLocationOptions}
                value={toLocationId}
                onChange={setToLocationId}
                placeholder="Select destination..."
                searchPlaceholder="Search locations..."
              />
            </div>
          </div>

          {/* Shipping Method */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Shipping Method
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {shippingMethods.map((m) => {
                const Icon = methodIcons[m.id as ShippingMethod]
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id as ShippingMethod)}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      method === m.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Transit Days */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Transit Days
            </label>
            <div className="mt-1 grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400">Min</label>
                <input
                  type="number"
                  min={1}
                  value={transitDaysMin}
                  onChange={(e) => setTransitDaysMin(parseInt(e.target.value) || 1)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400">Typical</label>
                <input
                  type="number"
                  min={transitDaysMin}
                  max={transitDaysMax}
                  value={transitDaysTypical}
                  onChange={(e) => setTransitDaysTypical(parseInt(e.target.value) || 1)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400">Max</label>
                <input
                  type="number"
                  min={transitDaysMin}
                  value={transitDaysMax}
                  onChange={(e) => setTransitDaysMax(parseInt(e.target.value) || 2)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Costs */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Costs (USD)
            </label>
            <div className="mt-1 grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400">Per Unit</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400">Per Kg</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={costPerKg}
                  onChange={(e) => setCostPerKg(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400">Flat Fee</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={costFlatFee}
                  onChange={(e) => setCostFlatFee(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this leg..."
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* Duplicate Warning */}
          {isDuplicate && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              A leg with this origin, destination, and method already exists.
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!fromLocationId || !toLocationId || !name}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditing ? 'Save Changes' : 'Create Leg'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
