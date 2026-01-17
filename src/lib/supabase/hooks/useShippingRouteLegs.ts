'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type ShippingMethod = 'sea' | 'air' | 'ground' | 'express' | 'rail'

export interface TransitDays {
  min: number
  typical: number
  max: number
}

export interface RouteCosts {
  perUnit: number | null
  perKg: number | null
  flatFee: number | null
  currency: string
}

export interface ShippingRouteLeg {
  id: string
  name: string
  fromLocationId: string
  fromLocationName: string
  toLocationId: string | null
  toLocationName: string
  toLocationType: string | null
  method: ShippingMethod
  transitDays: TransitDays
  costs: RouteCosts
  isActive: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface ShippingRouteLegInsert {
  name: string
  fromLocationId: string
  toLocationId?: string | null
  toLocationType?: string | null
  method: ShippingMethod
  transitDaysMin: number
  transitDaysTypical: number
  transitDaysMax: number
  costPerUnit?: number | null
  costPerKg?: number | null
  costFlatFee?: number | null
  costCurrency?: string
  isActive?: boolean
  notes?: string | null
}

export function useShippingRouteLegs() {
  const [legs, setLegs] = useState<ShippingRouteLeg[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchLegs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('shipping_route_legs')
        .select(`
          *,
          from_location:locations!from_location_id(id, name),
          to_location:locations!to_location_id(id, name)
        `)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const mapped: ShippingRouteLeg[] = (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        fromLocationId: row.from_location_id,
        fromLocationName: row.from_location?.name || '',
        toLocationId: row.to_location_id,
        toLocationName: row.to_location?.name || row.to_location_type || '',
        toLocationType: row.to_location_type,
        method: row.method as ShippingMethod,
        transitDays: {
          min: row.transit_days_min,
          typical: row.transit_days_typical,
          max: row.transit_days_max,
        },
        costs: {
          perUnit: row.cost_per_unit,
          perKg: row.cost_per_kg,
          flatFee: row.cost_flat_fee,
          currency: row.cost_currency,
        },
        isActive: row.is_active,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))

      setLegs(mapped)
    } catch (err) {
      console.error('Error fetching shipping route legs:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch legs')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchLegs()
  }, [fetchLegs])

  const createLeg = useCallback(async (leg: ShippingRouteLegInsert): Promise<ShippingRouteLeg | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('shipping_route_legs')
        .insert({
          name: leg.name,
          from_location_id: leg.fromLocationId,
          to_location_id: leg.toLocationId,
          to_location_type: leg.toLocationType,
          method: leg.method,
          transit_days_min: leg.transitDaysMin,
          transit_days_typical: leg.transitDaysTypical,
          transit_days_max: leg.transitDaysMax,
          cost_per_unit: leg.costPerUnit,
          cost_per_kg: leg.costPerKg,
          cost_flat_fee: leg.costFlatFee,
          cost_currency: leg.costCurrency || 'USD',
          is_active: leg.isActive ?? true,
          notes: leg.notes,
        })
        .select()
        .single()

      if (insertError) throw insertError

      await fetchLegs()
      return data as unknown as ShippingRouteLeg
    } catch (err) {
      console.error('Error creating leg:', err)
      throw err
    }
  }, [supabase, fetchLegs])

  const updateLeg = useCallback(async (id: string, updates: Partial<ShippingRouteLegInsert>): Promise<void> => {
    try {
      const updateData: Record<string, unknown> = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.fromLocationId !== undefined) updateData.from_location_id = updates.fromLocationId
      if (updates.toLocationId !== undefined) updateData.to_location_id = updates.toLocationId
      if (updates.toLocationType !== undefined) updateData.to_location_type = updates.toLocationType
      if (updates.method !== undefined) updateData.method = updates.method
      if (updates.transitDaysMin !== undefined) updateData.transit_days_min = updates.transitDaysMin
      if (updates.transitDaysTypical !== undefined) updateData.transit_days_typical = updates.transitDaysTypical
      if (updates.transitDaysMax !== undefined) updateData.transit_days_max = updates.transitDaysMax
      if (updates.costPerUnit !== undefined) updateData.cost_per_unit = updates.costPerUnit
      if (updates.costPerKg !== undefined) updateData.cost_per_kg = updates.costPerKg
      if (updates.costFlatFee !== undefined) updateData.cost_flat_fee = updates.costFlatFee
      if (updates.costCurrency !== undefined) updateData.cost_currency = updates.costCurrency
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive
      if (updates.notes !== undefined) updateData.notes = updates.notes

      const { error: updateError } = await supabase
        .from('shipping_route_legs')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError

      await fetchLegs()
    } catch (err) {
      console.error('Error updating leg:', err)
      throw err
    }
  }, [supabase, fetchLegs])

  const deleteLeg = useCallback(async (id: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('shipping_route_legs')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchLegs()
    } catch (err) {
      console.error('Error deleting leg:', err)
      throw err
    }
  }, [supabase, fetchLegs])

  const toggleActive = useCallback(async (id: string): Promise<void> => {
    const leg = legs.find((l) => l.id === id)
    if (leg) {
      await updateLeg(id, { isActive: !leg.isActive })
    }
  }, [legs, updateLeg])

  return {
    legs,
    loading,
    error,
    refetch: fetchLegs,
    createLeg,
    updateLeg,
    deleteLeg,
    toggleActive,
  }
}
