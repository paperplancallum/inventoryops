'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../client'
import type { Database } from '../database.types'

// Types from database
type DbShippingLeg = Database['public']['Tables']['shipping_legs']['Row']
type DbShippingLegInsert = Database['public']['Tables']['shipping_legs']['Insert']
type LocationType = Database['public']['Enums']['location_type']
type ShippingMethod = Database['public']['Enums']['shipping_method']

// Frontend types
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

export interface ShippingLeg {
  id: string
  name: string
  fromLocationType: LocationType
  fromLocationName: string
  toLocationType: LocationType
  toLocationName: string
  method: ShippingMethod
  transitDays: TransitDays
  costs: RouteCosts
  isActive: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface LegFormData {
  name: string
  fromLocationType: LocationType
  fromLocationName: string
  toLocationType: LocationType
  toLocationName: string
  method: ShippingMethod
  transitDaysMin: number
  transitDaysTypical: number
  transitDaysMax: number
  costPerUnit: number | null
  costPerKg: number | null
  costFlatFee: number | null
  costCurrency?: string
  notes?: string
}

// Location type options for dropdowns
export const LOCATION_TYPES: { id: LocationType; label: string }[] = [
  { id: 'factory', label: 'Factory' },
  { id: 'warehouse', label: 'Warehouse' },
  { id: '3pl', label: '3PL Warehouse' },
  { id: 'amazon_fba', label: 'Amazon FBA' },
  { id: 'amazon_awd', label: 'Amazon AWD' },
  { id: 'port', label: 'Port' },
  { id: 'customs', label: 'Customs' },
]

// Shipping method options
export const SHIPPING_METHODS: { id: ShippingMethod; label: string }[] = [
  { id: 'ocean-fcl', label: 'Ocean FCL' },
  { id: 'ocean-lcl', label: 'Ocean LCL' },
  { id: 'air-freight', label: 'Air Freight' },
  { id: 'air-express', label: 'Air Express' },
  { id: 'ground', label: 'Ground/Truck' },
  { id: 'rail', label: 'Rail' },
  { id: 'courier', label: 'Courier' },
]

// Transform DB to frontend
function transformLeg(db: DbShippingLeg): ShippingLeg {
  return {
    id: db.id,
    name: db.name,
    fromLocationType: db.from_location_type,
    fromLocationName: db.from_location_name,
    toLocationType: db.to_location_type,
    toLocationName: db.to_location_name,
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
    isActive: db.is_active,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

// Transform form data to DB insert
function formToDbInsert(data: LegFormData): DbShippingLegInsert {
  return {
    name: data.name,
    from_location_type: data.fromLocationType,
    from_location_name: data.fromLocationName,
    to_location_type: data.toLocationType,
    to_location_name: data.toLocationName,
    method: data.method,
    transit_days_min: data.transitDaysMin,
    transit_days_typical: data.transitDaysTypical,
    transit_days_max: data.transitDaysMax,
    cost_per_unit: data.costPerUnit,
    cost_per_kg: data.costPerKg,
    cost_flat_fee: data.costFlatFee,
    cost_currency: data.costCurrency || 'USD',
    notes: data.notes || null,
  }
}

export function useShippingLegs() {
  const [legs, setLegs] = useState<ShippingLeg[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch all legs (including inactive for management)
  const fetchLegs = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('shipping_legs')
        .select('*')
        .order('name', { ascending: true })

      if (fetchError) throw fetchError

      setLegs((data || []).map(transformLeg))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch shipping legs'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Get routes that use a specific leg
  const getRoutesUsingLeg = useCallback(async (legId: string): Promise<{ id: string; name: string }[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('shipping_routes')
        .select('id, name, leg_ids')

      if (fetchError) throw fetchError

      // Filter routes that contain this leg ID
      const routesUsingLeg = (data || [])
        .filter(route => route.leg_ids.includes(legId))
        .map(route => ({ id: route.id, name: route.name }))

      return routesUsingLeg
    } catch {
      return []
    }
  }, [supabase])

  // Create leg
  const createLeg = useCallback(async (data: LegFormData): Promise<ShippingLeg | null> => {
    try {
      const insertData = formToDbInsert(data)

      const { data: created, error: createError } = await supabase
        .from('shipping_legs')
        .insert(insertData)
        .select()
        .single()

      if (createError) throw createError

      const leg = transformLeg(created)
      setLegs(prev => [...prev, leg].sort((a, b) => a.name.localeCompare(b.name)))
      return leg
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create shipping leg'))
      return null
    }
  }, [supabase])

  // Update leg
  const updateLeg = useCallback(async (id: string, data: Partial<LegFormData>): Promise<ShippingLeg | null> => {
    try {
      const updateData: Record<string, unknown> = {}

      if (data.name !== undefined) updateData.name = data.name
      if (data.fromLocationType !== undefined) updateData.from_location_type = data.fromLocationType
      if (data.fromLocationName !== undefined) updateData.from_location_name = data.fromLocationName
      if (data.toLocationType !== undefined) updateData.to_location_type = data.toLocationType
      if (data.toLocationName !== undefined) updateData.to_location_name = data.toLocationName
      if (data.method !== undefined) updateData.method = data.method
      if (data.transitDaysMin !== undefined) updateData.transit_days_min = data.transitDaysMin
      if (data.transitDaysTypical !== undefined) updateData.transit_days_typical = data.transitDaysTypical
      if (data.transitDaysMax !== undefined) updateData.transit_days_max = data.transitDaysMax
      if (data.costPerUnit !== undefined) updateData.cost_per_unit = data.costPerUnit
      if (data.costPerKg !== undefined) updateData.cost_per_kg = data.costPerKg
      if (data.costFlatFee !== undefined) updateData.cost_flat_fee = data.costFlatFee
      if (data.costCurrency !== undefined) updateData.cost_currency = data.costCurrency
      if (data.notes !== undefined) updateData.notes = data.notes

      const { data: updated, error: updateError } = await supabase
        .from('shipping_legs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      const leg = transformLeg(updated)
      setLegs(prev => prev.map(l => l.id === id ? leg : l))
      return leg
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update shipping leg'))
      return null
    }
  }, [supabase])

  // Delete leg (with route usage check)
  const deleteLeg = useCallback(async (id: string): Promise<{ success: boolean; error?: string; affectedRoutes?: { id: string; name: string }[] }> => {
    try {
      // Check if leg is used in any routes
      const affectedRoutes = await getRoutesUsingLeg(id)

      if (affectedRoutes.length > 0) {
        return {
          success: false,
          error: `Cannot delete leg: it is used in ${affectedRoutes.length} route(s)`,
          affectedRoutes,
        }
      }

      const { error: deleteError } = await supabase
        .from('shipping_legs')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setLegs(prev => prev.filter(l => l.id !== id))
      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete shipping leg',
      }
    }
  }, [supabase, getRoutesUsingLeg])

  // Toggle active status
  const toggleActive = useCallback(async (id: string): Promise<boolean> => {
    try {
      const leg = legs.find(l => l.id === id)
      if (!leg) throw new Error('Leg not found')

      const { error: updateError } = await supabase
        .from('shipping_legs')
        .update({ is_active: !leg.isActive })
        .eq('id', id)

      if (updateError) throw updateError

      setLegs(prev => prev.map(l => l.id === id ? { ...l, isActive: !l.isActive } : l))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to toggle leg status'))
      return false
    }
  }, [supabase, legs])

  // Initial fetch
  useEffect(() => {
    fetchLegs()
  }, [fetchLegs])

  // Get only active legs (for route composition)
  const activeLegs = legs.filter(l => l.isActive)

  return {
    legs,
    activeLegs,
    loading,
    error,
    refetch: fetchLegs,
    createLeg,
    updateLeg,
    deleteLeg,
    toggleActive,
    getRoutesUsingLeg,
    // Utilities
    locationTypes: LOCATION_TYPES,
    shippingMethods: SHIPPING_METHODS,
  }
}
