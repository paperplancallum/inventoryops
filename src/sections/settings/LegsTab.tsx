'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Ship, Plane, Truck, Zap, Train, ChevronDown } from 'lucide-react'
import type { LegsTabProps, ShippingLeg, ShippingMethod } from './types'
import { SHIPPING_METHODS } from '@/lib/supabase/hooks/useShippingLegs'

const methodIcons: Record<string, typeof Ship> = {
  'ocean-fcl': Ship,
  'ocean-lcl': Ship,
  'air-freight': Plane,
  'air-express': Plane,
  'ground': Truck,
  'courier': Zap,
  'rail': Train,
}

function formatCost(leg: ShippingLeg): string {
  const parts: string[] = []
  if (leg.costs.perUnit) {
    parts.push(`$${leg.costs.perUnit.toFixed(2)}/unit`)
  }
  if (leg.costs.perKg) {
    parts.push(`$${leg.costs.perKg.toFixed(2)}/kg`)
  }
  if (leg.costs.flatFee) {
    parts.push(`$${leg.costs.flatFee.toLocaleString()} flat`)
  }
  return parts.join(' + ') || '—'
}

function formatTransitDays(leg: ShippingLeg): string {
  if (leg.transitDays.min === leg.transitDays.max) {
    return `${leg.transitDays.typical} days`
  }
  return `${leg.transitDays.min}-${leg.transitDays.max} days (typ. ${leg.transitDays.typical})`
}

export function LegsTab({
  legs,
  loading,
  onCreateLeg,
  onEditLeg,
  onDeleteLeg,
  onToggleActive,
}: LegsTabProps) {
  const [expandedOrigins, setExpandedOrigins] = useState<Set<string>>(
    new Set(legs.map((l) => l.fromLocationType))
  )

  // Group legs by origin location type
  const legsByOrigin = legs.reduce(
    (acc, leg) => {
      const key = leg.fromLocationType
      if (!acc[key]) {
        acc[key] = {
          locationName: leg.fromLocationName,
          locationType: leg.fromLocationType,
          legs: [],
        }
      }
      acc[key].legs.push(leg)
      return acc
    },
    {} as Record<string, { locationName: string; locationType: string; legs: ShippingLeg[] }>
  )

  const toggleOrigin = (originType: string) => {
    const newExpanded = new Set(expandedOrigins)
    if (newExpanded.has(originType)) {
      newExpanded.delete(originType)
    } else {
      newExpanded.add(originType)
    }
    setExpandedOrigins(newExpanded)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/50 animate-pulse">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-slate-900 dark:text-white">Shipping Legs</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Point-to-point shipping segments. Combine legs to create routes.
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
      {legs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            No shipping legs configured yet.
          </p>
          <button
            onClick={onCreateLeg}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Add Your First Leg
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(legsByOrigin).map(([originType, { locationName, legs: originLegs }]) => (
            <div
              key={originType}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-800"
            >
              {/* Origin Header */}
              <button
                onClick={() => toggleOrigin(originType)}
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
                <ChevronDown
                  className={`h-5 w-5 text-slate-400 transition-transform ${
                    expandedOrigins.has(originType) ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Legs Table */}
              {expandedOrigins.has(originType) && (
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
                          Transit
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
                        const MethodIcon = methodIcons[leg.method] || Truck
                        const methodLabel = SHIPPING_METHODS.find(m => m.id === leg.method)?.label || leg.method

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
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                  {methodLabel}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                              {formatTransitDays(leg)}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                              {formatCost(leg)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => onToggleActive(leg.id)}
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
                                  onClick={() => onEditLeg(leg.id)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => onDeleteLeg(leg.id)}
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
        </div>
      )}
    </div>
  )
}
