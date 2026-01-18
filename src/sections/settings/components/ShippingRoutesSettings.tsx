'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2, ChevronRight, Ship, Plane, Truck, Train, Zap, Check, X, ArrowRight } from 'lucide-react'
import { useShippingRouteLegs, type ShippingRouteLeg, type ShippingMethod, type ShippingRouteLegInsert } from '@/lib/supabase/hooks/useShippingRouteLegs'
import { useShippingRoutes, type ShippingRouteExpanded, type ShippingRouteInsert } from '@/lib/supabase/hooks/useShippingRoutes'
import { useLocations } from '@/lib/supabase/hooks/useLocations'

const methodIcons: Record<ShippingMethod, React.ReactNode> = {
  sea: <Ship className="h-4 w-4" />,
  air: <Plane className="h-4 w-4" />,
  ground: <Truck className="h-4 w-4" />,
  rail: <Train className="h-4 w-4" />,
  express: <Zap className="h-4 w-4" />,
}

const methodLabels: Record<ShippingMethod, string> = {
  sea: 'Sea Freight',
  air: 'Air Freight',
  ground: 'Ground',
  rail: 'Rail',
  express: 'Express',
}

interface LegFormData {
  name: string
  fromLocationId: string
  toLocationId: string
  toLocationType: string
  method: ShippingMethod
  transitDaysMin: number
  transitDaysTypical: number
  transitDaysMax: number
  costPerUnit: string
  notes: string
}

const defaultLegForm: LegFormData = {
  name: '',
  fromLocationId: '',
  toLocationId: '',
  toLocationType: '',
  method: 'sea',
  transitDaysMin: 7,
  transitDaysTypical: 14,
  transitDaysMax: 21,
  costPerUnit: '',
  notes: '',
}

export function ShippingRoutesSettings() {
  const { legs, loading: legsLoading, createLeg, updateLeg, deleteLeg, toggleActive: toggleLegActive } = useShippingRouteLegs()
  const { expandedRoutes, loading: routesLoading, createRoute, updateRoute, deleteRoute, setDefault, toggleActive: toggleRouteActive } = useShippingRoutes(legs)
  const { locations, loading: locationsLoading } = useLocations()

  const [activeSection, setActiveSection] = useState<'legs' | 'routes'>('legs')
  const [showLegForm, setShowLegForm] = useState(false)
  const [showRouteForm, setShowRouteForm] = useState(false)
  const [editingLeg, setEditingLeg] = useState<ShippingRouteLeg | null>(null)
  const [editingRoute, setEditingRoute] = useState<ShippingRouteExpanded | null>(null)
  const [legForm, setLegForm] = useState<LegFormData>(defaultLegForm)
  const [routeForm, setRouteForm] = useState<{ name: string; legIds: string[]; notes: string }>({
    name: '',
    legIds: [],
    notes: '',
  })

  const loading = legsLoading || routesLoading || locationsLoading

  const handleSaveLeg = async () => {
    const data: ShippingRouteLegInsert = {
      name: legForm.name,
      fromLocationId: legForm.fromLocationId,
      toLocationId: legForm.toLocationId || null,
      toLocationType: legForm.toLocationType || null,
      method: legForm.method,
      transitDaysMin: legForm.transitDaysMin,
      transitDaysTypical: legForm.transitDaysTypical,
      transitDaysMax: legForm.transitDaysMax,
      costPerUnit: legForm.costPerUnit ? parseFloat(legForm.costPerUnit) : null,
      notes: legForm.notes || null,
    }

    if (editingLeg) {
      await updateLeg(editingLeg.id, data)
    } else {
      await createLeg(data)
    }

    setShowLegForm(false)
    setEditingLeg(null)
    setLegForm(defaultLegForm)
  }

  const handleSaveRoute = async () => {
    const data: ShippingRouteInsert = {
      name: routeForm.name,
      legIds: routeForm.legIds,
      notes: routeForm.notes || null,
    }

    if (editingRoute) {
      await updateRoute(editingRoute.id, data)
    } else {
      await createRoute(data)
    }

    setShowRouteForm(false)
    setEditingRoute(null)
    setRouteForm({ name: '', legIds: [], notes: '' })
  }

  const handleEditLeg = (leg: ShippingRouteLeg) => {
    setEditingLeg(leg)
    setLegForm({
      name: leg.name,
      fromLocationId: leg.fromLocationId,
      toLocationId: leg.toLocationId || '',
      toLocationType: leg.toLocationType || '',
      method: leg.method,
      transitDaysMin: leg.transitDays.min,
      transitDaysTypical: leg.transitDays.typical,
      transitDaysMax: leg.transitDays.max,
      costPerUnit: leg.costs.perUnit?.toString() || '',
      notes: leg.notes || '',
    })
    setShowLegForm(true)
  }

  const handleEditRoute = (route: ShippingRouteExpanded) => {
    setEditingRoute(route)
    setRouteForm({
      name: route.name,
      legIds: route.legIds,
      notes: route.notes || '',
    })
    setShowRouteForm(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveSection('legs')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeSection === 'legs'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Route Legs ({legs.length})
        </button>
        <button
          onClick={() => setActiveSection('routes')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeSection === 'routes'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          Composed Routes ({expandedRoutes.length})
        </button>
      </div>

      {/* Route Legs Section */}
      {activeSection === 'legs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Define individual point-to-point shipping segments
            </p>
            <button
              onClick={() => {
                setEditingLeg(null)
                setLegForm(defaultLegForm)
                setShowLegForm(true)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add Leg
            </button>
          </div>

          {/* Leg Form */}
          {showLegForm && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-4">
                {editingLeg ? 'Edit Route Leg' : 'New Route Leg'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Name</label>
                  <input
                    type="text"
                    value={legForm.name}
                    onChange={(e) => setLegForm({ ...legForm, name: e.target.value })}
                    placeholder="e.g., Factory to Port"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Method</label>
                  <select
                    value={legForm.method}
                    onChange={(e) => setLegForm({ ...legForm, method: e.target.value as ShippingMethod })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  >
                    {Object.entries(methodLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">From Location</label>
                  <select
                    value={legForm.fromLocationId}
                    onChange={(e) => setLegForm({ ...legForm, fromLocationId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  >
                    <option value="">Select location</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">To Location</label>
                  <select
                    value={legForm.toLocationId}
                    onChange={(e) => setLegForm({ ...legForm, toLocationId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  >
                    <option value="">Select location or use type</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Min Days</label>
                    <input
                      type="number"
                      value={legForm.transitDaysMin}
                      onChange={(e) => setLegForm({ ...legForm, transitDaysMin: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Typical</label>
                    <input
                      type="number"
                      value={legForm.transitDaysTypical}
                      onChange={(e) => setLegForm({ ...legForm, transitDaysTypical: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Max Days</label>
                    <input
                      type="number"
                      value={legForm.transitDaysMax}
                      onChange={(e) => setLegForm({ ...legForm, transitDaysMax: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Cost per Unit ($)</label>
                  <input
                    type="number"
                    value={legForm.costPerUnit}
                    onChange={(e) => setLegForm({ ...legForm, costPerUnit: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs text-slate-500 mb-1">Notes</label>
                <textarea
                  value={legForm.notes}
                  onChange={(e) => setLegForm({ ...legForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setShowLegForm(false)
                    setEditingLeg(null)
                  }}
                  className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLeg}
                  disabled={!legForm.name || !legForm.fromLocationId}
                  className="px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {editingLeg ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          )}

          {/* Legs List */}
          {legs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No route legs defined yet
            </div>
          ) : (
            <div className="space-y-2">
              {legs.map((leg) => (
                <div
                  key={leg.id}
                  className={`flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg ${
                    !leg.isActive ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                      {methodIcons[leg.method]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{leg.name}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <span>{leg.fromLocationName}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{leg.toLocationName}</span>
                        <span className="ml-2">• {leg.transitDays.typical} days</span>
                        {leg.costs.perUnit && <span>• ${leg.costs.perUnit}/unit</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleLegActive(leg.id)}
                      className={`p-1.5 rounded ${leg.isActive ? 'text-emerald-600' : 'text-slate-400'}`}
                      title={leg.isActive ? 'Active' : 'Inactive'}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditLeg(leg)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteLeg(leg.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Composed Routes Section */}
      {activeSection === 'routes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Combine legs into complete shipping routes
            </p>
            <button
              onClick={() => {
                setEditingRoute(null)
                setRouteForm({ name: '', legIds: [], notes: '' })
                setShowRouteForm(true)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add Route
            </button>
          </div>

          {/* Route Form */}
          {showRouteForm && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-4">
                {editingRoute ? 'Edit Route' : 'New Route'}
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Route Name</label>
                  <input
                    type="text"
                    value={routeForm.name}
                    onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                    placeholder="e.g., China to FBA via Sea"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Select Legs (in order)</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {legs.filter(l => l.isActive).map((leg) => (
                      <label
                        key={leg.id}
                        className="flex items-center gap-2 p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-600"
                      >
                        <input
                          type="checkbox"
                          checked={routeForm.legIds.includes(leg.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRouteForm({ ...routeForm, legIds: [...routeForm.legIds, leg.id] })
                            } else {
                              setRouteForm({ ...routeForm, legIds: routeForm.legIds.filter(id => id !== leg.id) })
                            }
                          }}
                          className="rounded border-slate-300"
                        />
                        <div className="p-1 bg-slate-100 dark:bg-slate-600 rounded">
                          {methodIcons[leg.method]}
                        </div>
                        <span className="text-sm">{leg.name}</span>
                        <span className="text-xs text-slate-500 ml-auto">{leg.transitDays.typical}d</span>
                      </label>
                    ))}
                  </div>
                  {routeForm.legIds.length > 0 && (
                    <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded text-xs text-indigo-700 dark:text-indigo-300">
                      Total: {routeForm.legIds.reduce((sum, id) => {
                        const leg = legs.find(l => l.id === id)
                        return sum + (leg?.transitDays.typical || 0)
                      }, 0)} days typical transit
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Notes</label>
                  <textarea
                    value={routeForm.notes}
                    onChange={(e) => setRouteForm({ ...routeForm, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setShowRouteForm(false)
                    setEditingRoute(null)
                  }}
                  className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRoute}
                  disabled={!routeForm.name || routeForm.legIds.length === 0}
                  className="px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {editingRoute ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          )}

          {/* Routes List */}
          {expandedRoutes.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No routes defined yet. Create legs first, then combine them into routes.
            </div>
          ) : (
            <div className="space-y-2">
              {expandedRoutes.map((route) => (
                <div
                  key={route.id}
                  className={`p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg ${
                    !route.isActive ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{route.name}</p>
                        {route.isDefault && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {route.originLocationName} → {route.destinationLocationName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!route.isDefault && (
                        <button
                          onClick={() => setDefault(route.id)}
                          className="px-2 py-1 text-xs text-slate-500 hover:text-indigo-600 rounded"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => toggleRouteActive(route.id)}
                        className={`p-1.5 rounded ${route.isActive ? 'text-emerald-600' : 'text-slate-400'}`}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditRoute(route)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteRoute(route.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Legs visualization */}
                  <div className="flex items-center gap-1 mt-3 flex-wrap">
                    {route.legs.map((leg, i) => (
                      <div key={leg.id} className="flex items-center gap-1">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">
                          {methodIcons[leg.method]}
                          <span>{leg.name}</span>
                          <span className="text-slate-400">({leg.transitDays.typical}d)</span>
                        </div>
                        {i < route.legs.length - 1 && (
                          <ChevronRight className="h-3 w-3 text-slate-400" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span>Total: {route.totalTransitDays.typical} days typical</span>
                    <span>({route.totalTransitDays.min}-{route.totalTransitDays.max} range)</span>
                    {route.totalCosts.perUnit && (
                      <span>• ${route.totalCosts.perUnit.toFixed(2)}/unit</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
