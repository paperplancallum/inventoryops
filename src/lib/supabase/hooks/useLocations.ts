'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../client'
import type { Database } from '../database.types'
import type { Location, FactoryLocationOption } from '@/sections/suppliers/types'
import type { LocationReferences } from '@/sections/locations/types'

// Derive types from Database
type DbLocation = Database['public']['Tables']['locations']['Row']
type LocationType = Database['public']['Enums']['location_type']

// Database location with optional supplier relation
interface DbLocationWithSupplier extends DbLocation {
  owner_supplier?: { id: string; name: string }[] | null
}

// Transform database location to frontend location
function transformLocation(dbLocation: DbLocationWithSupplier): Location {
  // Get the first (and only) supplier that owns this factory
  const ownerSupplier = dbLocation.owner_supplier?.[0]

  return {
    id: dbLocation.id,
    name: dbLocation.name,
    type: dbLocation.type,
    addressLine1: dbLocation.address_line1 || undefined,
    addressLine2: dbLocation.address_line2 || undefined,
    city: dbLocation.city || undefined,
    stateProvince: dbLocation.state_province || undefined,
    postalCode: dbLocation.postal_code || undefined,
    country: dbLocation.country,
    countryCode: dbLocation.country_code || undefined,
    contactName: dbLocation.contact_name || undefined,
    contactEmail: dbLocation.contact_email || undefined,
    contactPhone: dbLocation.contact_phone || undefined,
    isActive: dbLocation.is_active,
    notes: dbLocation.notes || undefined,
    createdAt: dbLocation.created_at,
    updatedAt: dbLocation.updated_at,
    ownerSupplier: ownerSupplier ? { id: ownerSupplier.id, name: ownerSupplier.name } : undefined,
  }
}

// Transform to simplified factory location option for dropdowns
function toFactoryOption(location: Location): FactoryLocationOption {
  return {
    id: location.id,
    name: location.name,
    city: location.city || '',
    country: location.country,
  }
}

interface UseLocationsOptions {
  type?: LocationType
  includeArchived?: boolean
}

export function useLocations(options?: UseLocationsOptions | LocationType) {
  // Handle both old signature (type?: LocationType) and new signature (options?: UseLocationsOptions)
  const opts: UseLocationsOptions = typeof options === 'string'
    ? { type: options }
    : options || {}

  const { type, includeArchived = false } = opts

  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch locations
  const fetchLocations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Join supplier data for factory locations (reverse FK lookup)
      let query = supabase
        .from('locations')
        .select(`
          *,
          owner_supplier:suppliers!factory_location_id(id, name)
        `)
        .order('name', { ascending: true })

      // Only filter by active status if not including archived
      if (!includeArchived) {
        query = query.eq('is_active', true)
      }

      // Filter by type if specified
      if (type) {
        query = query.eq('type', type)
      }

      const { data, error: locationsError } = await query

      if (locationsError) throw locationsError

      setLocations((data || []).map(transformLocation))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch locations'))
    } finally {
      setLoading(false)
    }
  }, [supabase, type, includeArchived])

  // Create location
  const createLocation = useCallback(async (data: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location | null> => {
    try {
      const { data: newLocation, error: locationError } = await supabase
        .from('locations')
        .insert({
          name: data.name,
          type: data.type,
          address_line1: data.addressLine1 || null,
          address_line2: data.addressLine2 || null,
          city: data.city || null,
          state_province: data.stateProvince || null,
          postal_code: data.postalCode || null,
          country: data.country,
          country_code: data.countryCode || null,
          contact_name: data.contactName || null,
          contact_email: data.contactEmail || null,
          contact_phone: data.contactPhone || null,
          is_active: data.isActive,
          notes: data.notes || null,
        })
        .select()
        .single()

      if (locationError) throw locationError

      const location = transformLocation(newLocation)
      setLocations(prev => [...prev, location].sort((a, b) => a.name.localeCompare(b.name)))
      return location
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create location'))
      return null
    }
  }, [supabase])

  // Update location
  const updateLocation = useCallback(async (id: string, data: Partial<Location>): Promise<Location | null> => {
    try {
      const updateData: Record<string, unknown> = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.type !== undefined) updateData.type = data.type
      if (data.addressLine1 !== undefined) updateData.address_line1 = data.addressLine1 || null
      if (data.addressLine2 !== undefined) updateData.address_line2 = data.addressLine2 || null
      if (data.city !== undefined) updateData.city = data.city || null
      if (data.stateProvince !== undefined) updateData.state_province = data.stateProvince || null
      if (data.postalCode !== undefined) updateData.postal_code = data.postalCode || null
      if (data.country !== undefined) updateData.country = data.country
      if (data.countryCode !== undefined) updateData.country_code = data.countryCode || null
      if (data.contactName !== undefined) updateData.contact_name = data.contactName || null
      if (data.contactEmail !== undefined) updateData.contact_email = data.contactEmail || null
      if (data.contactPhone !== undefined) updateData.contact_phone = data.contactPhone || null
      if (data.isActive !== undefined) updateData.is_active = data.isActive
      if (data.notes !== undefined) updateData.notes = data.notes || null

      const { data: updatedLocation, error: locationError } = await supabase
        .from('locations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (locationError) throw locationError

      const location = transformLocation(updatedLocation)
      setLocations(prev => prev.map(l => l.id === id ? location : l))
      return location
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update location'))
      return null
    }
  }, [supabase])

  // Delete location (kept for backwards compatibility, but archiving is preferred)
  const deleteLocation = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id)

      if (error) throw error

      setLocations(prev => prev.filter(l => l.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete location'))
      return false
    }
  }, [supabase])

  // Check for references before archiving
  const checkReferences = useCallback(async (id: string): Promise<LocationReferences> => {
    try {
      // Check stock_ledger_entries
      const { count: stockCount, error: stockError } = await supabase
        .from('stock_ledger_entries')
        .select('*', { count: 'exact', head: true })
        .eq('location_id', id)

      if (stockError) throw stockError

      // Check suppliers (factory_location_id)
      const { count: supplierCount, error: supplierError } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })
        .eq('factory_location_id', id)

      if (supplierError) throw supplierError

      const stockLedgerEntries = stockCount || 0
      const suppliers = supplierCount || 0

      return {
        stockLedgerEntries,
        suppliers,
        hasReferences: stockLedgerEntries > 0 || suppliers > 0,
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to check location references'))
      return {
        stockLedgerEntries: 0,
        suppliers: 0,
        hasReferences: false,
      }
    }
  }, [supabase])

  // Archive location (set is_active to false)
  const archiveLocation = useCallback(async (id: string): Promise<Location | null> => {
    try {
      const { data: updatedLocation, error: locationError } = await supabase
        .from('locations')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single()

      if (locationError) throw locationError

      const location = transformLocation(updatedLocation)

      // If we're including archived, update the location in state
      // Otherwise, remove it from the list
      if (includeArchived) {
        setLocations(prev => prev.map(l => l.id === id ? location : l))
      } else {
        setLocations(prev => prev.filter(l => l.id !== id))
      }

      return location
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to archive location'))
      return null
    }
  }, [supabase, includeArchived])

  // Unarchive location (set is_active to true)
  const unarchiveLocation = useCallback(async (id: string): Promise<Location | null> => {
    try {
      const { data: updatedLocation, error: locationError } = await supabase
        .from('locations')
        .update({ is_active: true })
        .eq('id', id)
        .select()
        .single()

      if (locationError) throw locationError

      const location = transformLocation(updatedLocation)
      setLocations(prev => prev.map(l => l.id === id ? location : l))
      return location
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to unarchive location'))
      return null
    }
  }, [supabase])

  // Get a single location by ID
  const getLocation = useCallback(async (id: string): Promise<Location | null> => {
    try {
      const { data, error: locationError } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id)
        .single()

      if (locationError) throw locationError

      return transformLocation(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get location'))
      return null
    }
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  // Helper to get factory locations as dropdown options
  const factoryOptions: FactoryLocationOption[] = locations
    .filter(l => l.type === 'factory' && l.isActive)
    .map(toFactoryOption)

  return {
    locations,
    factoryOptions,
    loading,
    error,
    refetch: fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation,
    archiveLocation,
    unarchiveLocation,
    checkReferences,
    getLocation,
  }
}
