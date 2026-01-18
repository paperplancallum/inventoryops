'use client'

import { Plus, Edit2, Trash2, Star, ArrowRight, Route } from 'lucide-react'
import type { RoutesTabProps, ShippingRouteExpanded } from './types'

function formatTransitDays(route: ShippingRouteExpanded): string {
  const { min, typical, max } = route.totalTransitDays
  if (min === max) {
    return `${typical} days`
  }
  return `${min}-${max} days (typ. ${typical})`
}

function formatCost(route: ShippingRouteExpanded): string {
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

export function RoutesTab({
  routes,
  legs,
  loading,
  onCreateRoute,
  onEditRoute,
  onDeleteRoute,
  onSetDefault,
  onToggleActive,
}: RoutesTabProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/50 animate-pulse">
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-3"></div>
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  const hasLegs = legs.length > 0

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-slate-900 dark:text-white">Shipping Routes</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Complete shipping paths from origin to destination, composed of multiple legs.
          </p>
        </div>
        <button
          onClick={onCreateRoute}
          disabled={!hasLegs}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          title={!hasLegs ? 'Create legs first' : undefined}
        >
          <Plus className="h-4 w-4" />
          Add Route
        </button>
      </div>

      {/* Routes list */}
      {!hasLegs ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
          <p className="text-slate-500 dark:text-slate-400">
            Create shipping legs first, then combine them into routes.
          </p>
        </div>
      ) : routes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
          <div className="mx-auto w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
            <Route className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            No shipping routes configured yet.
          </p>
          <button
            onClick={onCreateRoute}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Create Your First Route
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {routes.map((route) => (
            <RouteCard
              key={route.id}
              route={route}
              onEdit={onEditRoute}
              onDelete={onDeleteRoute}
              onSetDefault={onSetDefault}
              onToggleActive={onToggleActive}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function RouteCard({
  route,
  onEdit,
  onDelete,
  onSetDefault,
  onToggleActive,
}: {
  route: ShippingRouteExpanded
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
  onToggleActive: (id: string) => void
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
              {route.name}
            </h3>
            {route.isDefault && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Star className="h-3 w-3" />
                Default
              </span>
            )}
            <button
              onClick={() => onToggleActive(route.id)}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                route.isActive
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
              }`}
            >
              {route.isActive ? 'Active' : 'Inactive'}
            </button>
          </div>

          {/* Route path visualization */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {route.legs.map((leg, i) => (
              <div key={leg.id} className="flex items-center gap-2">
                {i === 0 && (
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {leg.fromLocationName}
                  </span>
                )}
                <ArrowRight className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {leg.toLocationName}
                </span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span>{route.legs.length} leg{route.legs.length !== 1 ? 's' : ''}</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>{formatTransitDays(route)}</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>{formatCost(route)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {!route.isDefault && (
            <button
              onClick={() => onSetDefault(route.id)}
              className="p-2 rounded-lg text-slate-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20 dark:hover:text-amber-400 transition-colors"
              title="Set as default"
            >
              <Star className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(route.id)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors"
            title="Edit route"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(route.id)}
            className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
            title="Delete route"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
