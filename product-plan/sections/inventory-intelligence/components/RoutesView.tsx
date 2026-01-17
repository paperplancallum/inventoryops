'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Check, Ship, Plane, Truck, Zap, Train } from 'lucide-react'
import type { RoutesViewProps, ShippingMethod } from '@/../product/sections/inventory-intelligence/types'

const methodIcons: Record<ShippingMethod, typeof Ship> = {
  sea: Ship,
  air: Plane,
  ground: Truck,
  express: Zap,
  rail: Train,
}

export function RoutesView({
  routes,
  locations: _locations,
  shippingMethods,
  onCreateRoute,
  onEditRoute,
  onDeleteRoute,
  onSetDefault,
  onToggleActive,
}: RoutesViewProps) {
  // Suppress unused variable warning - location names are denormalized in routes
  void _locations
  const [expandedOrigins, setExpandedOrigins] = useState<Set<string>>(new Set(
    routes.map((r) => r.fromLocationId)
  ))

  // Group routes by origin
  const routesByOrigin = routes.reduce(
    (acc, route) => {
      if (!acc[route.fromLocationId]) {
        acc[route.fromLocationId] = {
          locationName: route.fromLocationName,
          routes: [],
        }
      }
      acc[route.fromLocationId].routes.push(route)
      return acc
    },
    {} as Record<string, { locationName: string; routes: typeof routes }>
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

  const formatCost = (route: typeof routes[0]) => {
    const parts: string[] = []
    if (route.costs.perUnit) {
      parts.push(`$${route.costs.perUnit}/unit`)
    }
    if (route.costs.perKg) {
      parts.push(`$${route.costs.perKg}/kg`)
    }
    if (route.costs.flatFee) {
      parts.push(`$${route.costs.flatFee} flat`)
    }
    return parts.join(' + ') || '—'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-slate-900 dark:text-white">Shipping Routes</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure shipping paths between locations with transit times and costs
          </p>
        </div>
        <button
          onClick={onCreateRoute}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Add Route
        </button>
      </div>

      {/* Routes by Origin */}
      <div className="space-y-4">
        {Object.entries(routesByOrigin).map(([originId, { locationName, routes: originRoutes }]) => (
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
                    {originRoutes.length} route{originRoutes.length !== 1 ? 's' : ''}
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

            {/* Routes Table */}
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
                        Default
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
                    {originRoutes.map((route) => {
                      const MethodIcon = methodIcons[route.method]
                      return (
                        <tr key={route.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900 dark:text-white text-sm">
                              {route.toLocationName}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <MethodIcon className="h-4 w-4 text-slate-400" />
                              <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                                {shippingMethods.find((m) => m.id === route.method)?.label || route.method}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                            {route.transitDays.min === route.transitDays.max
                              ? `${route.transitDays.typical} days`
                              : `${route.transitDays.min}-${route.transitDays.max} days`}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                            {formatCost(route)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => onSetDefault?.(route.id)}
                              className={`rounded-full p-1 ${
                                route.isDefault
                                  ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                                  : 'text-slate-300 hover:text-slate-400 dark:text-slate-600 dark:hover:text-slate-500'
                              }`}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => onToggleActive?.(route.id)}
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                route.isActive
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                              }`}
                            >
                              {route.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => onEditRoute?.(route.id)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => onDeleteRoute?.(route.id)}
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

        {routes.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
            <p className="text-slate-500 dark:text-slate-400">
              No shipping routes configured yet.
            </p>
            <button
              onClick={onCreateRoute}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              Add Your First Route
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
