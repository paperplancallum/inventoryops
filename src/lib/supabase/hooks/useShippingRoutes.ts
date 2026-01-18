'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../client'
import type { Database } from '../database.types'
import type { ShippingLeg, TransitDays, RouteCosts } from './useShippingLegs'

// Types from database
type DbShippingRoute = Database['public']['Tables']['shipping_routes']['Row']
type DbShippingRoutInsert = Database['public']['Tables']['shipping_routes']['Insert']
type LocationType = Database['public']['Enums']['location_type']

// Frontend types
export interface ShippingRoute {
  id: string
  name: string
  legIds: string[]
  originLocationType: LocationType | null
  destinationLocationType: LocationType | null
  isDefault: boolean
  isActive: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

// Expanded route with computed totals
export interface ShippingRouteExpanded extends ShippingRoute {
  legs: ShippingLeg[]
  totalTransitDays: TransitDays
  totalCosts: RouteCosts
  originLocationName: string
  destinationLocationName: string
}

export interface RouteFormData {
  name: string
  legIds: string[]
  isDefault?: boolean
  notes?: string
}

// Transform DB to frontend
function transformRoute(db: DbShippingRoute): ShippingRoute {
  return {
    id: db.id,
    name: db.name,
    legIds: db.leg_ids,
    originLocationType: db.origin_location_type,
    destinationLocationType: db.destination_location_type,
    isDefault: db.is_default,
    isActive: db.is_active,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

// Compute totals from legs
export function computeRouteTotals(legs: ShippingLeg[]): {
  transitDays: TransitDays
  costs: RouteCosts
} {
  const transitDays: TransitDays = {
    min: legs.reduce((sum, leg) => sum + leg.transitDays.min, 0),
    typical: legs.reduce((sum, leg) => sum + leg.transitDays.typical, 0),
    max: legs.reduce((sum, leg) => sum + leg.transitDays.max, 0),
  }

  const costs: RouteCosts = {
    perUnit: legs.reduce((sum, leg) => sum + (leg.costs.perUnit || 0), 0) || null,
    perKg: legs.reduce((sum, leg) => sum + (leg.costs.perKg || 0), 0) || null,
    flatFee: legs.reduce((sum, leg) => sum + (leg.costs.flatFee || 0), 0) || null,
    currency: legs[0]?.costs.currency || 'USD',
  }

  return { transitDays, costs }
}

// Expand a route with its leg data
export function expandRoute(
  route: ShippingRoute,
  allLegs: ShippingLeg[]
): ShippingRouteExpanded {
  const legs = route.legIds
    .map(id => allLegs.find(leg => leg.id === id))
    .filter((leg): leg is ShippingLeg => leg !== undefined)

  const { transitDays, costs } = computeRouteTotals(legs)

  return {
    ...route,
    legs,
    totalTransitDays: transitDays,
    totalCosts: costs,
    originLocationName: legs[0]?.fromLocationName || '',
    destinationLocationName: legs[legs.length - 1]?.toLocationName || '',
  }
}

// Validate leg connectivity: leg N's to_type must equal leg N+1's from_type
export function validateLegConnectivity(
  legIds: string[],
  allLegs: ShippingLeg[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (legIds.length === 0) {
    errors.push('Route must have at least one leg')
    return { valid: false, errors }
  }

  const legs = legIds
    .map(id => allLegs.find(leg => leg.id === id))
    .filter((leg): leg is ShippingLeg => leg !== undefined)

  if (legs.length !== legIds.length) {
    errors.push('Some legs could not be found')
    return { valid: false, errors }
  }

  // Check connectivity between consecutive legs
  for (let i = 0; i < legs.length - 1; i++) {
    const currentLeg = legs[i]
    const nextLeg = legs[i + 1]

    if (currentLeg.toLocationType !== nextLeg.fromLocationType) {
      errors.push(
        `Leg "${currentLeg.name}" ends at ${currentLeg.toLocationType} but leg "${nextLeg.name}" starts at ${nextLeg.fromLocationType}. Legs must connect end-to-end.`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function useShippingRoutes(allLegs: ShippingLeg[] = []) {
  const [routes, setRoutes] = useState<ShippingRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch all routes
  const fetchRoutes = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('shipping_routes')
        .select('*')
        .order('name', { ascending: true })

      if (fetchError) throw fetchError

      setRoutes((data || []).map(transformRoute))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch shipping routes'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Create route (with validation)
  const createRoute = useCallback(async (data: RouteFormData): Promise<{ route: ShippingRoute | null; errors?: string[] }> => {
    // Validate leg connectivity
    const validation = validateLegConnectivity(data.legIds, allLegs)
    if (!validation.valid) {
      return { route: null, errors: validation.errors }
    }

    try {
      const insertData: DbShippingRoutInsert = {
        name: data.name,
        leg_ids: data.legIds,
        is_default: data.isDefault || false,
        notes: data.notes || null,
      }

      const { data: created, error: createError } = await supabase
        .from('shipping_routes')
        .insert(insertData)
        .select()
        .single()

      if (createError) throw createError

      const route = transformRoute(created)
      setRoutes(prev => [...prev, route].sort((a, b) => a.name.localeCompare(b.name)))

      // If this was set as default, update local state for other routes
      if (route.isDefault) {
        setRoutes(prev => prev.map(r => {
          if (r.id !== route.id &&
              r.originLocationType === route.originLocationType &&
              r.destinationLocationType === route.destinationLocationType) {
            return { ...r, isDefault: false }
          }
          return r
        }))
      }

      return { route }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create shipping route'))
      return { route: null, errors: [err instanceof Error ? err.message : 'Failed to create route'] }
    }
  }, [supabase, allLegs])

  // Update route (with validation)
  const updateRoute = useCallback(async (id: string, data: Partial<RouteFormData>): Promise<{ route: ShippingRoute | null; errors?: string[] }> => {
    // If legIds are being updated, validate connectivity
    if (data.legIds) {
      const validation = validateLegConnectivity(data.legIds, allLegs)
      if (!validation.valid) {
        return { route: null, errors: validation.errors }
      }
    }

    try {
      const updateData: Record<string, unknown> = {}

      if (data.name !== undefined) updateData.name = data.name
      if (data.legIds !== undefined) updateData.leg_ids = data.legIds
      if (data.isDefault !== undefined) updateData.is_default = data.isDefault
      if (data.notes !== undefined) updateData.notes = data.notes

      const { data: updated, error: updateError } = await supabase
        .from('shipping_routes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      const route = transformRoute(updated)
      setRoutes(prev => prev.map(r => r.id === id ? route : r))

      // Handle default flag changes
      if (route.isDefault) {
        setRoutes(prev => prev.map(r => {
          if (r.id !== route.id &&
              r.originLocationType === route.originLocationType &&
              r.destinationLocationType === route.destinationLocationType) {
            return { ...r, isDefault: false }
          }
          return r
        }))
      }

      return { route }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update shipping route'))
      return { route: null, errors: [err instanceof Error ? err.message : 'Failed to update route'] }
    }
  }, [supabase, allLegs])

  // Delete route
  const deleteRoute = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('shipping_routes')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setRoutes(prev => prev.filter(r => r.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete shipping route'))
      return false
    }
  }, [supabase])

  // Set route as default (unsets others for same origin-dest pair)
  const setDefault = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { data: updated, error: updateError } = await supabase
        .from('shipping_routes')
        .update({ is_default: true })
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      const route = transformRoute(updated)

      // Update local state - the DB trigger handles unsetting other defaults
      setRoutes(prev => prev.map(r => {
        if (r.id === id) return route
        if (r.originLocationType === route.originLocationType &&
            r.destinationLocationType === route.destinationLocationType) {
          return { ...r, isDefault: false }
        }
        return r
      }))

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to set default route'))
      return false
    }
  }, [supabase])

  // Toggle active status
  const toggleActive = useCallback(async (id: string): Promise<boolean> => {
    try {
      const route = routes.find(r => r.id === id)
      if (!route) throw new Error('Route not found')

      const { error: updateError } = await supabase
        .from('shipping_routes')
        .update({ is_active: !route.isActive })
        .eq('id', id)

      if (updateError) throw updateError

      setRoutes(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to toggle route status'))
      return false
    }
  }, [supabase, routes])

  // Initial fetch
  useEffect(() => {
    fetchRoutes()
  }, [fetchRoutes])

  // Expanded routes with computed totals
  const expandedRoutes = routes.map(r => expandRoute(r, allLegs))
  const activeRoutes = routes.filter(r => r.isActive)
  const activeExpandedRoutes = activeRoutes.map(r => expandRoute(r, allLegs))

  return {
    routes,
    expandedRoutes,
    activeRoutes,
    activeExpandedRoutes,
    loading,
    error,
    refetch: fetchRoutes,
    createRoute,
    updateRoute,
    deleteRoute,
    setDefault,
    toggleActive,
    // Utilities
    validateLegConnectivity: (legIds: string[]) => validateLegConnectivity(legIds, allLegs),
    expandRoute: (route: ShippingRoute) => expandRoute(route, allLegs),
    computeRouteTotals,
  }
}
