'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '../client'
import type {
  ShippingRoute,
  ShippingMethod,
  ShippingRouteFormData,
} from '@/sections/inventory-intelligence/types'

interface DbShippingRoute {
  id: string
  name: string
  from_location_id: string
  to_location_id: string
  method: ShippingMethod
  transit_days_min: number
  transit_days_typical: number
  transit_days_max: number
  cost_per_unit: number | null
  cost_per_kg: number | null
  cost_flat_fee: number | null
  cost_currency: string
  is_default: boolean
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
  from_location?: { id: string; name: string }
  to_location?: { id: string; name: string }
}

function transformRoute(db: DbShippingRoute): ShippingRoute {
  return {
    id: db.id,
    name: db.name,
    fromLocationId: db.from_location_id,
    fromLocationName: db.from_location?.name || 'Unknown',
    toLocationId: db.to_location_id,
    toLocationName: db.to_location?.name || 'Unknown',
    method: db.method,
    transitDays: {
      min: db.transit_days_min,
      typical: db.transit_days_typical,
      max: db.transit_days_max,
    },
    costs: {
      perUnit: db.cost_per_unit,
      perKg: db.cost_per_kg,
      flatFee: db.cost_flat_fee,
      currency: db.cost_currency,
    },
    isDefault: db.is_default,
    isActive: db.is_active,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

export function useShippingRoutes() {
  const [routes, setRoutes] = useState<ShippingRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchRoutes = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: routesError } = await supabase
        .from('shipping_routes')
        .select(`
          *,
          from_location:locations!from_location_id(id, name),
          to_location:locations!to_location_id(id, name)
        `)
        .order('name', { ascending: true })

      if (routesError) throw routesError

      setRoutes((data || []).map(transformRoute))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch routes'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const createRoute = useCallback(async (data: ShippingRouteFormData): Promise<ShippingRoute | null> => {
    try {
      const { data: newRoute, error: routeError } = await supabase
        .from('shipping_routes')
        .insert({
          name: data.name,
          from_location_id: data.fromLocationId,
          to_location_id: data.toLocationId,
          method: data.method,
          transit_days_min: data.transitDays.min,
          transit_days_typical: data.transitDays.typical,
          transit_days_max: data.transitDays.max,
          cost_per_unit: data.costs.perUnit,
          cost_per_kg: data.costs.perKg,
          cost_flat_fee: data.costs.flatFee,
          cost_currency: data.costs.currency,
          is_default: data.isDefault,
          notes: data.notes || null,
        })
        .select(`
          *,
          from_location:locations!from_location_id(id, name),
          to_location:locations!to_location_id(id, name)
        `)
        .single()

      if (routeError) throw routeError

      const route = transformRoute(newRoute)
      setRoutes(prev => [...prev, route].sort((a, b) => a.name.localeCompare(b.name)))
      return route
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create route'))
      return null
    }
  }, [supabase])

  const updateRoute = useCallback(async (id: string, data: Partial<ShippingRouteFormData>): Promise<ShippingRoute | null> => {
    try {
      const updateData: Record<string, unknown> = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.fromLocationId !== undefined) updateData.from_location_id = data.fromLocationId
      if (data.toLocationId !== undefined) updateData.to_location_id = data.toLocationId
      if (data.method !== undefined) updateData.method = data.method
      if (data.transitDays !== undefined) {
        updateData.transit_days_min = data.transitDays.min
        updateData.transit_days_typical = data.transitDays.typical
        updateData.transit_days_max = data.transitDays.max
      }
      if (data.costs !== undefined) {
        updateData.cost_per_unit = data.costs.perUnit
        updateData.cost_per_kg = data.costs.perKg
        updateData.cost_flat_fee = data.costs.flatFee
        updateData.cost_currency = data.costs.currency
      }
      if (data.isDefault !== undefined) updateData.is_default = data.isDefault
      if (data.notes !== undefined) updateData.notes = data.notes || null

      const { data: updatedRoute, error: routeError } = await supabase
        .from('shipping_routes')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          from_location:locations!from_location_id(id, name),
          to_location:locations!to_location_id(id, name)
        `)
        .single()

      if (routeError) throw routeError

      const route = transformRoute(updatedRoute)
      setRoutes(prev => prev.map(r => r.id === id ? route : r))
      return route
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update route'))
      return null
    }
  }, [supabase])

  const deleteRoute = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shipping_routes')
        .delete()
        .eq('id', id)

      if (error) throw error

      setRoutes(prev => prev.filter(r => r.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete route'))
      return false
    }
  }, [supabase])

  const toggleActive = useCallback(async (id: string): Promise<boolean> => {
    const route = routes.find(r => r.id === id)
    if (!route) return false

    try {
      const { error } = await supabase
        .from('shipping_routes')
        .update({ is_active: !route.isActive })
        .eq('id', id)

      if (error) throw error

      setRoutes(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to toggle route active'))
      return false
    }
  }, [supabase, routes])

  const setDefaultRoute = useCallback(async (id: string): Promise<boolean> => {
    const route = routes.find(r => r.id === id)
    if (!route) return false

    try {
      // Unset default for all routes with same from/to pair, then set new default
      // Note: These operations are not atomic, but the unique index constraint
      // on (from_location_id, to_location_id) WHERE is_default = true ensures
      // database consistency even if there's a race condition
      const { error: unsetError } = await supabase
        .from('shipping_routes')
        .update({ is_default: false })
        .eq('from_location_id', route.fromLocationId)
        .eq('to_location_id', route.toLocationId)

      if (unsetError) throw unsetError

      const { error: setError } = await supabase
        .from('shipping_routes')
        .update({ is_default: true })
        .eq('id', id)

      if (setError) throw setError

      setRoutes(prev => prev.map(r => {
        if (r.fromLocationId === route.fromLocationId && r.toLocationId === route.toLocationId) {
          return { ...r, isDefault: r.id === id }
        }
        return r
      }))
      return true
    } catch (err) {
      // Refetch to ensure UI is in sync with database state
      await fetchRoutes()
      setError(err instanceof Error ? err : new Error('Failed to set default route'))
      return false
    }
  }, [supabase, routes, fetchRoutes])

  // Get routes for a specific location pair
  const getRoutesForLocations = useCallback((fromLocationId: string, toLocationId: string): ShippingRoute[] => {
    return routes.filter(r =>
      r.fromLocationId === fromLocationId &&
      r.toLocationId === toLocationId &&
      r.isActive
    )
  }, [routes])

  // Get default route for a location pair
  const getDefaultRoute = useCallback((fromLocationId: string, toLocationId: string): ShippingRoute | undefined => {
    return routes.find(r =>
      r.fromLocationId === fromLocationId &&
      r.toLocationId === toLocationId &&
      r.isDefault &&
      r.isActive
    )
  }, [routes])

  useEffect(() => {
    fetchRoutes()
  }, [fetchRoutes])

  return {
    routes,
    activeRoutes: routes.filter(r => r.isActive),
    loading,
    error,
    refetch: fetchRoutes,
    createRoute,
    updateRoute,
    deleteRoute,
    toggleActive,
    setDefaultRoute,
    getRoutesForLocations,
    getDefaultRoute,
  }
}
