'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Check, Ship, Plane, Truck, Zap, Train, Search, Settings, Route, Shield, Building2, Calendar, TrendingUp, Ban, X } from 'lucide-react'
import type {
  IntelligenceSettings,
  ShippingRoute,
  ShippingMethodOption,
  Location,
  SafetyStockRule,
  ThresholdTypeOption,
  ShippingRouteFormData,
  SafetyStockRuleFormData,
  AccountForecastAdjustment,
  ForecastAdjustmentFormData,
  ShippingMethod,
  ThresholdType,
} from '../types'

const methodIcons: Record<ShippingMethod, typeof Ship> = {
  sea: Ship,
  air: Plane,
  ground: Truck,
  express: Zap,
  rail: Train,
}

type SettingsSection = 'general' | 'routes' | 'safety-stock' | 'adjustments'

interface SettingsViewProps {
  settings?: IntelligenceSettings
  routes?: ShippingRoute[]
  locations?: Location[]
  shippingMethods?: ShippingMethodOption[]
  safetyStockRules?: SafetyStockRule[]
  thresholdTypes?: ThresholdTypeOption[]
  accountAdjustments?: AccountForecastAdjustment[]
  onUpdateSettings?: (updates: Partial<IntelligenceSettings>) => void
  onCreateRoute?: (data: ShippingRouteFormData) => void
  onEditRoute?: (id: string, data: Partial<ShippingRouteFormData>) => void
  onDeleteRoute?: (id: string) => void
  onSetDefaultRoute?: (id: string) => void
  onToggleRouteActive?: (id: string) => void
  onCreateSafetyRule?: (data: SafetyStockRuleFormData) => void
  onUpdateSafetyRule?: (id: string, updates: Partial<SafetyStockRuleFormData>) => void
  onDeleteSafetyRule?: (id: string) => void
  onToggleSafetyRuleActive?: (id: string) => void
  onAddAccountAdjustment?: (adjustment: ForecastAdjustmentFormData) => void
  onEditAccountAdjustment?: (id: string, adjustment: Partial<ForecastAdjustmentFormData>) => void
  onRemoveAccountAdjustment?: (id: string) => void
}

const sections: { id: SettingsSection; label: string; icon: typeof Settings }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'routes', label: 'Shipping Routes', icon: Route },
  { id: 'safety-stock', label: 'Safety Stock', icon: Shield },
  { id: 'adjustments', label: 'Forecast Adjustments', icon: Building2 },
]

export function SettingsView({
  settings,
  routes = [],
  locations: _locations,
  shippingMethods = [],
  safetyStockRules = [],
  thresholdTypes = [],
  accountAdjustments = [],
  onUpdateSettings,
  onCreateRoute: _onCreateRoute,
  onEditRoute: _onEditRoute,
  onDeleteRoute,
  onSetDefaultRoute,
  onToggleRouteActive,
  onCreateSafetyRule: _onCreateSafetyRule,
  onUpdateSafetyRule,
  onDeleteSafetyRule,
  onToggleSafetyRuleActive: _onToggleSafetyRuleActive,
  onAddAccountAdjustment: _onAddAccountAdjustment,
  onEditAccountAdjustment: _onEditAccountAdjustment,
  onRemoveAccountAdjustment,
}: SettingsViewProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)
  const [expandedOrigins, setExpandedOrigins] = useState<Set<string>>(new Set(
    routes.map((r) => r.fromLocationId)
  ))

  const toggleOrigin = (originId: string) => {
    const newExpanded = new Set(expandedOrigins)
    if (newExpanded.has(originId)) {
      newExpanded.delete(originId)
    } else {
      newExpanded.add(originId)
    }
    setExpandedOrigins(newExpanded)
  }

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

  const formatCost = (route: ShippingRoute) => {
    const parts: string[] = []
    if (route.costs.perUnit) parts.push(`$${route.costs.perUnit}/unit`)
    if (route.costs.perKg) parts.push(`$${route.costs.perKg}/kg`)
    if (route.costs.flatFee) parts.push(`$${route.costs.flatFee} flat`)
    return parts.join(' + ') || '—'
  }

  const filteredRules = safetyStockRules.filter((r) => {
    const query = searchQuery.toLowerCase()
    return (
      r.sku.toLowerCase().includes(query) ||
      r.productName.toLowerCase().includes(query) ||
      r.locationName.toLowerCase().includes(query)
    )
  })

  const getThresholdLabel = (type: ThresholdType) => {
    return thresholdTypes.find((t) => t.id === type)?.label || type
  }

  const handleStartEdit = (id: string, currentValue: number) => {
    setEditingRuleId(id)
    setEditValue(currentValue)
  }

  const handleSaveEdit = (id: string) => {
    onUpdateSafetyRule?.(id, { thresholdValue: editValue })
    setEditingRuleId(null)
  }

  const handleCancelEdit = () => {
    setEditingRuleId(null)
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-48 flex-shrink-0">
        <nav className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {section.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1">
        {/* General Settings */}
        {activeSection === 'general' && settings && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-slate-900 dark:text-white">General Settings</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Configure thresholds and notification preferences
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">
                Urgency Thresholds
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Critical (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.urgencyThresholds.criticalDays}
                    onChange={(e) => onUpdateSettings?.({
                      urgencyThresholds: {
                        ...settings.urgencyThresholds,
                        criticalDays: parseInt(e.target.value) || 7
                      }
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Warning (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.urgencyThresholds.warningDays}
                    onChange={(e) => onUpdateSettings?.({
                      urgencyThresholds: {
                        ...settings.urgencyThresholds,
                        warningDays: parseInt(e.target.value) || 14
                      }
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Planned (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.urgencyThresholds.plannedDays}
                    onChange={(e) => onUpdateSettings?.({
                      urgencyThresholds: {
                        ...settings.urgencyThresholds,
                        plannedDays: parseInt(e.target.value) || 30
                      }
                    })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">
                Calculation Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Default Safety Stock (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.defaultSafetyStockDays}
                    onChange={(e) => onUpdateSettings?.({
                      defaultSafetyStockDays: parseInt(e.target.value) || 30
                    })}
                    className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="includeInTransit"
                    checked={settings.includeInTransitInCalculations}
                    onChange={(e) => onUpdateSettings?.({
                      includeInTransitInCalculations: e.target.checked
                    })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="includeInTransit" className="text-sm text-slate-700 dark:text-slate-300">
                    Include in-transit inventory in stock calculations
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">
                Notifications
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="notifyCritical"
                    checked={settings.notifyOnCritical}
                    onChange={(e) => onUpdateSettings?.({
                      notifyOnCritical: e.target.checked
                    })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="notifyCritical" className="text-sm text-slate-700 dark:text-slate-300">
                    Notify on critical suggestions
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="notifyWarning"
                    checked={settings.notifyOnWarning}
                    onChange={(e) => onUpdateSettings?.({
                      notifyOnWarning: e.target.checked
                    })}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="notifyWarning" className="text-sm text-slate-700 dark:text-slate-300">
                    Notify on warning suggestions
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Routes Section */}
        {activeSection === 'routes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-slate-900 dark:text-white">Shipping Routes</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Configure shipping paths between locations
                </p>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                <Plus className="h-4 w-4" />
                Add Route
              </button>
            </div>

            <div className="space-y-4">
              {Object.entries(routesByOrigin).map(([originId, { locationName, routes: originRoutes }]) => (
                <div
                  key={originId}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-800"
                >
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
                                    onClick={() => onSetDefaultRoute?.(route.id)}
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
                                    onClick={() => onToggleRouteActive?.(route.id)}
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
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                  >
                    <Plus className="h-4 w-4" />
                    Add Your First Route
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Safety Stock Section */}
        {activeSection === 'safety-stock' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-medium text-slate-900 dark:text-white">Safety Stock Rules</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Minimum inventory thresholds that trigger replenishment suggestions
                </p>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                <Plus className="h-4 w-4" />
                Add Rule
              </button>
            </div>

            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by SKU, product, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-800">
              {filteredRules.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-slate-500 dark:text-slate-400">
                    {safetyStockRules.length === 0
                      ? 'No safety stock rules configured yet.'
                      : 'No rules match your search.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Location
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Threshold Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Value
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {filteredRules.map((rule) => (
                        <tr key={rule.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white text-sm">
                                {rule.productName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                {rule.sku}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                            {rule.locationName}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                            {getThresholdLabel(rule.thresholdType)}
                          </td>
                          <td className="px-4 py-3">
                            {editingRuleId === rule.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={editValue}
                                  onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                                  className="w-20 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit(rule.id)
                                    if (e.key === 'Escape') handleCancelEdit()
                                  }}
                                />
                                <button
                                  onClick={() => handleSaveEdit(rule.id)}
                                  className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(rule.id, rule.thresholdValue)}
                                className="text-sm font-medium text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                              >
                                {rule.thresholdValue.toLocaleString()}
                                {rule.thresholdType === 'units' ? ' units' : ' days'}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                rule.isActive
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                              }`}
                            >
                              {rule.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleStartEdit(rule.id, rule.thresholdValue)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => onDeleteSafetyRule?.(rule.id)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Forecast Adjustments Section */}
        {activeSection === 'adjustments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-slate-900 dark:text-white">Forecast Adjustments</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Account-wide adjustments that affect all product forecasts
                </p>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                <Plus className="h-4 w-4" />
                Add Adjustment
              </button>
            </div>

            {accountAdjustments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">
                <p className="text-slate-500 dark:text-slate-400">
                  No account-wide adjustments configured yet.
                </p>
                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                  Use adjustments to exclude holiday periods or apply seasonal multipliers.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {accountAdjustments.map((adjustment) => {
                  const formatDateRange = (start: string, end: string) => {
                    const s = new Date(start + 'T00:00:00')
                    const e = new Date(end + 'T00:00:00')
                    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                  }

                  const formatMultiplier = (multiplier?: number) => {
                    if (multiplier === undefined) return null
                    const percent = Math.round((multiplier - 1) * 100)
                    if (percent > 0) return `+${percent}%`
                    if (percent < 0) return `${percent}%`
                    return '0%'
                  }

                  return (
                    <div
                      key={adjustment.id}
                      className="relative p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                          {adjustment.effect === 'multiply' ? (
                            <TrendingUp className="h-5 w-5 text-amber-500" />
                          ) : (
                            <Ban className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {adjustment.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDateRange(adjustment.startDate, adjustment.endDate)}</span>
                            {adjustment.isRecurring && <span className="text-slate-400">(yearly)</span>}
                          </div>
                          <div className="mt-2">
                            {adjustment.effect === 'exclude' ? (
                              <span className="text-sm text-slate-600 dark:text-slate-400">Exclude from history</span>
                            ) : (
                              <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                Multiply: {formatMultiplier(adjustment.multiplier)}
                              </span>
                            )}
                          </div>
                          {adjustment.notes && (
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                              {adjustment.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onRemoveAccountAdjustment?.(adjustment.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                          title="Remove"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
