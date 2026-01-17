'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Ship, Plane, Truck, Zap, Train } from 'lucide-react'
import type { LegsViewProps, RouteLeg } from '@/../product/sections/settings/types'
import type { ShippingMethod } from '@/../product/sections/inventory-intelligence/types'

const methodIcons: Record<ShippingMethod, typeof Ship> = {
  sea: Ship,
  air: Plane,
  ground: Truck,
  express: Zap,
  rail: Train,
}

export function LegsView({
  legs,
  locations: _locations,
  shippingMethods,
  onCreateLeg,
  onEditLeg,
  onDeleteLeg,
  onToggleActive,
}: LegsViewProps) {
  // Suppress unused variable warning - location names are denormalized in legs
  void _locations
  const [expandedOrigins, setExpandedOrigins] = useState<Set<string>>(
    new Set(legs.map((l) => l.fromLocationId))
  )

  // Group legs by origin
  const legsByOrigin = legs.reduce(
    (acc, leg) => {
      if (!acc[leg.fromLocationId]) {
        acc[leg.fromLocationId] = {
          locationName: leg.fromLocationName,
          legs: [],
        }
      }
      acc[leg.fromLocationId].legs.push(leg)
      return acc
    },
    {} as Record<string, { locationName: string; legs: RouteLeg[] }>
  )

  const toggleOrigin = (originId: string) => {
    const newExpanded = new Set(expandedOrigins)
    if (newExpanded.has(originId)) {
      newExpanded.delete(originId)
    } else {
      newExpanded.add(originId)
    }
    setExpandedOrigins(newExpanded)
  }

  const formatCost = (leg: RouteLeg) => {
    const parts: string[] = []
    if (leg.costs.perUnit) {
      parts.push(`$${leg.costs.perUnit}/unit`)
    }
    if (leg.costs.perKg) {
      parts.push(`$${leg.costs.perKg}/kg`)
    }
    if (leg.costs.flatFee) {
      parts.push(`$${leg.costs.flatFee} flat`)
    }
    return parts.join(' + ') || '—'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-slate-900 dark:text-white">Shipping Legs</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Define individual point-to-point segments. Legs can be combined into routes.
          </p>
        </div>
        <button
          onClick={onCreateLeg}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Add Leg
        </button>
      </div>

      {/* Legs by Origin */}
      <div className="space-y-4">
        {Object.entries(legsByOrigin).map(([originId, { locationName, legs: originLegs }]) => (
          <div
            key={originId}
            className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-800"
          >
            {/* Origin Header */}
            <button
              onClick={() => toggleOrigin(originId)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">📍</span>
                <div className="text-left">
                  <p className="font-medium text-slate-900 dark:text-white">{locationName}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {originLegs.length} leg{originLegs.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <svg
                className={`h-5 w-5 text-slate-400 transition-transform ${
                  expandedOrigins.has(originId) ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Legs Table */}
            {expandedOrigins.has(originId) && (
              <div className="border-t border-slate-200 dark:border-slate-700">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Destination
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Method
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Transit Days
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Cost
                      </th>
                      <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Status
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {originLegs.map((leg) => {
                      const MethodIcon = methodIcons[leg.method]
                      return (
                        <tr key={leg.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900 dark:text-white text-sm">
                              {leg.toLocationName}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <MethodIcon className="h-4 w-4 text-slate-400" />
                              <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                                {shippingMethods.find((m) => m.id === leg.method)?.label || leg.method}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                            {leg.transitDays.min === leg.transitDays.max
                              ? `${leg.transitDays.typical} days`
                              : `${leg.transitDays.min}-${leg.transitDays.max} days`}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                            {formatCost(leg)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => onToggleActive?.(leg.id)}
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                leg.isActive
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                              }`}
                            >
                              {leg.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => onEditLeg?.(leg.id)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => onDeleteLeg?.(leg.id)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}

        {legs.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
            <p className="text-slate-500 dark:text-slate-400">
              No shipping legs configured yet.
            </p>
            <button
              onClick={onCreateLeg}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              Add Your First Leg
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
