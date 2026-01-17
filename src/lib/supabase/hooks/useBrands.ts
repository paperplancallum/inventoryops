'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../client'
import type { DbBrand, BrandStatus } from '../database.types'
import type { BrandReference } from '@/sections/catalog/types'

// Transform database brand to frontend brand reference
function transformBrand(dbBrand: DbBrand): BrandReference {
  return {
    id: dbBrand.id,
    name: dbBrand.name,
  }
}

export interface Brand extends BrandReference {
  description: string | null
  logoUrl: string | null
  status: BrandStatus
  createdAt: string
  updatedAt: string
}

function transformFullBrand(dbBrand: DbBrand): Brand {
  return {
    id: dbBrand.id,
    name: dbBrand.name,
    description: dbBrand.description,
    logoUrl: dbBrand.logo_url,
    status: dbBrand.status,
    createdAt: dbBrand.created_at,
    updatedAt: dbBrand.updated_at,
  }
}

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch all active brands
  const fetchBrands = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('brands')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true })

      if (fetchError) throw fetchError

      setBrands((data || []).map(transformFullBrand))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch brands'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Get brand references for dropdowns
  const getBrandReferences = useCallback((): BrandReference[] => {
    return brands.map(b => ({ id: b.id, name: b.name }))
  }, [brands])

  // Create brand
  const createBrand = useCallback(async (name: string, description?: string): Promise<Brand | null> => {
    try {
      const { data, error: createError } = await supabase
        .from('brands')
        .insert({
          name,
          description: description || null,
          status: 'active' as BrandStatus,
        })
        .select()
        .single()

      if (createError) throw createError

      const brand = transformFullBrand(data)
      setBrands(prev => [...prev, brand].sort((a, b) => a.name.localeCompare(b.name)))
      return brand
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create brand'))
      return null
    }
  }, [supabase])

  // Update brand
  const updateBrand = useCallback(async (id: string, data: Partial<{ name: string; description: string | null; status: BrandStatus }>): Promise<Brand | null> => {
    try {
      const updateData: Record<string, unknown> = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.status !== undefined) updateData.status = data.status

      const { data: updated, error: updateError } = await supabase
        .from('brands')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      const brand = transformFullBrand(updated)
      setBrands(prev => prev.map(b => b.id === id ? brand : b))
      return brand
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update brand'))
      return null
    }
  }, [supabase])

  // Delete brand (soft delete - set status to inactive)
  const deleteBrand = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('brands')
        .update({ status: 'inactive' as BrandStatus })
        .eq('id', id)

      if (deleteError) throw deleteError

      setBrands(prev => prev.filter(b => b.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete brand'))
      return false
    }
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    fetchBrands()
  }, [fetchBrands])

  return {
    brands,
    brandReferences: getBrandReferences(),
    loading,
    error,
    refetch: fetchBrands,
    createBrand,
    updateBrand,
    deleteBrand,
  }
}
