'use client'

import { Plus, Edit2, Trash2, Star, Ship, Plane, Truck, Zap, Train, ChevronRight } from 'lucide-react'
import type { RoutesViewProps, ShippingRouteExpanded } from '@/../product/sections/settings/types'
import type { ShippingMethod } from '@/../product/sections/inventory-intelligence/types'
import { expandRoute } from '@/../product/sections/settings/types'

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

export function RoutesView({
  routes,
  legs,
  onCreateRoute,
  onEditRoute,
  onDeleteRoute,
  onSetDefault,
  onToggleActive,
}: RoutesViewProps) {
  // Expand all routes with leg data
  const expandedRoutes: ShippingRouteExpanded[] = routes.map((route) =>
    expandRoute(route, legs)
  )

  // Group routes by origin-destination pair
  const routesByDestination = expandedRoutes.reduce(
    (acc, route) => {
      const key = route.destinationLocationName || 'Unknown Destination'
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(route)
      return acc
    },
    {} as Record<string, ShippingRouteExpanded[]>
  )

  const formatCost = (route: ShippingRouteExpanded) => {
    const parts: string[] = []
    if (route.totalCosts.perUnit) {
      parts.push(`$${route.totalCosts.perUnit.toFixed(2)}/unit`)
    }
    if (route.totalCosts.perKg) {
      parts.push(`$${route.totalCosts.perKg.toFixed(2)}/kg`)
    }
    if (route.totalCosts.flatFee) {
      parts.push(`$${route.totalCosts.flatFee.toLocaleString()} flat`)
    }
    return parts.join(' + ') || '—'
  }

  const formatTransit = (route: ShippingRouteExpanded) => {
    const { min, typical, max } = route.totalTransitDays
    if (min === max) {
      return `${typical} days`
    }
    return `${min}-${max} days (${typical} typical)`
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-slate-900 dark:text-white">Shipping Routes</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Composed journeys from supplier to destination using multiple legs.
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

      {/* Routes by Destination */}
      <div className="space-y-6">
        {Object.entries(routesByDestination).map(([destination, destinationRoutes]) => (
          <div key={destination}>
            <h3 className="mb-3 text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              To: {destination}
            </h3>
            <div className="space-y-3">
              {destinationRoutes.map((route) => (
                <div
                  key={route.id}
                  className={`rounded-xl border bg-white p-4 dark:bg-slate-800 ${
                    route.isActive
                      ? 'border-slate-200 dark:border-slate-700'
                      : 'border-slate-200/50 opacity-60 dark:border-slate-700/50'
                  }`}
                >
                  {/* Route Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        {route.name}
                      </h4>
                      {route.isDefault && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          <Star className="h-3 w-3" />
                          Default
                        </span>
                      )}
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
                    </div>
                    <div className="flex items-center gap-1">
                      {!route.isDefault && (
                        <button
                          onClick={() => onSetDefault?.(route.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-700 dark:hover:text-amber-400"
                          title="Set as default"
                        >
                          <Star className="h-4 w-4" />
                        </button>
                      )}
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
                  </div>

                  {/* Leg Journey Visualization */}
                  <div className="mb-3 flex items-center gap-1 overflow-x-auto pb-1">
                    {route.legs.map((leg, index) => {
                      const MethodIcon = methodIcons[leg.method]
                      return (
                        <div key={leg.id} className="flex items-center shrink-0">
                          {/* Location */}
                          {index === 0 && (
                            <div className="flex flex-col items-center mr-2">
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                                {leg.fromLocationName.split(' ')[0]}
                              </span>
                              <span className="text-[10px] text-slate-400">Origin</span>
                            </div>
                          )}

                          {/* Leg */}
                          <div className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${methodColors[leg.method]}`}>
                            <MethodIcon className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">{leg.transitDays.typical}d</span>
                          </div>

                          {/* Arrow */}
                          <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-1" />

                          {/* Destination Location */}
                          <div className="flex flex-col items-center ml-1">
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                              {leg.toLocationName.split(' ')[0]}
                            </span>
                            {index === route.legs.length - 1 && (
                              <span className="text-[10px] text-slate-400">Destination</span>
                            )}
                          </div>

                          {/* Separator between legs */}
                          {index < route.legs.length - 1 && (
                            <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-1" />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Route Totals */}
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Total Transit: </span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {formatTransit(route)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Total Cost: </span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {formatCost(route)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Legs: </span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {route.legs.length}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {route.notes && (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 italic">
                      {route.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {routes.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
            <p className="text-slate-500 dark:text-slate-400">
              No shipping routes configured yet. Create legs first, then compose them into routes.
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
