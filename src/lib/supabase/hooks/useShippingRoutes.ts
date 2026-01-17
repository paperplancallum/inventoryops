'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ShippingRouteLeg, TransitDays, RouteCosts } from './useShippingRouteLegs'

export interface ShippingRoute {
  id: string
  name: string
  legIds: string[]
  isDefault: boolean
  isActive: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface ShippingRouteExpanded extends ShippingRoute {
  legs: ShippingRouteLeg[]
  totalTransitDays: TransitDays
  totalCosts: RouteCosts
  originLocationName: string
  destinationLocationName: string
}

export interface ShippingRouteInsert {
  name: string
  legIds: string[]
  isDefault?: boolean
  isActive?: boolean
  notes?: string | null
}

function computeRouteTotals(legs: ShippingRouteLeg[]): { transitDays: TransitDays; costs: RouteCosts } {
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

export function useShippingRoutes(allLegs: ShippingRouteLeg[] = []) {
  const [routes, setRoutes] = useState<ShippingRoute[]>([])
  const [expandedRoutes, setExpandedRoutes] = useState<ShippingRouteExpanded[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchRoutes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('shipping_routes')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const mapped: ShippingRoute[] = (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        legIds: row.leg_ids || [],
        isDefault: row.is_default,
        isActive: row.is_active,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))

      setRoutes(mapped)
    } catch (err) {
      console.error('Error fetching shipping routes:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch routes')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchRoutes()
  }, [fetchRoutes])

  // Expand routes when legs change
  useEffect(() => {
    const expanded = routes.map((route): ShippingRouteExpanded => {
      const legs = route.legIds
        .map((id) => allLegs.find((leg) => leg.id === id))
        .filter((leg): leg is ShippingRouteLeg => leg !== undefined)

      const { transitDays, costs } = computeRouteTotals(legs)

      return {
        ...route,
        legs,
        totalTransitDays: transitDays,
        totalCosts: costs,
        originLocationName: legs[0]?.fromLocationName || '',
        destinationLocationName: legs[legs.length - 1]?.toLocationName || '',
      }
    })

    setExpandedRoutes(expanded)
  }, [routes, allLegs])

  const createRoute = useCallback(async (route: ShippingRouteInsert): Promise<ShippingRoute | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('shipping_routes')
        .insert({
          name: route.name,
          leg_ids: route.legIds,
          is_default: route.isDefault ?? false,
          is_active: route.isActive ?? true,
          notes: route.notes,
        })
        .select()
        .single()

      if (insertError) throw insertError

      await fetchRoutes()
      return data as unknown as ShippingRoute
    } catch (err) {
      console.error('Error creating route:', err)
      throw err
    }
  }, [supabase, fetchRoutes])

  const updateRoute = useCallback(async (id: string, updates: Partial<ShippingRouteInsert>): Promise<void> => {
    try {
      const updateData: Record<string, unknown> = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.legIds !== undefined) updateData.leg_ids = updates.legIds
      if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive
      if (updates.notes !== undefined) updateData.notes = updates.notes

      const { error: updateError } = await supabase
        .from('shipping_routes')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError

      await fetchRoutes()
    } catch (err) {
      console.error('Error updating route:', err)
      throw err
    }
  }, [supabase, fetchRoutes])

  const deleteRoute = useCallback(async (id: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('shipping_routes')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchRoutes()
    } catch (err) {
      console.error('Error deleting route:', err)
      throw err
    }
  }, [supabase, fetchRoutes])

  const setDefault = useCallback(async (id: string): Promise<void> => {
    try {
      // First, unset all defaults
      await supabase
        .from('shipping_routes')
        .update({ is_default: false })
        .neq('id', id)

      // Then set the new default
      const { error: updateError } = await supabase
        .from('shipping_routes')
        .update({ is_default: true })
        .eq('id', id)

      if (updateError) throw updateError

      await fetchRoutes()
    } catch (err) {
      console.error('Error setting default route:', err)
      throw err
    }
  }, [supabase, fetchRoutes])

  const toggleActive = useCallback(async (id: string): Promise<void> => {
    const route = routes.find((r) => r.id === id)
    if (route) {
      await updateRoute(id, { isActive: !route.isActive })
    }
  }, [routes, updateRoute])

  return {
    routes,
    expandedRoutes,
    loading,
    error,
    refetch: fetchRoutes,
    createRoute,
    updateRoute,
    deleteRoute,
    setDefault,
    toggleActive,
  }
}
