'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../client'
import type { Database } from '../database.types'
import type { BrandReference } from '@/sections/catalog/types'

// Types from database
type DbBrand = Database['public']['Tables']['brands']['Row']
type DbBrandInsert = Database['public']['Tables']['brands']['Insert']
type BrandStatus = Database['public']['Enums']['brand_status']

const LOGO_BUCKET = 'brand-logos'
const MAX_LOGO_SIZE = 5 * 1024 * 1024 // 5MB

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
  amazonConnectionIds: string[]
  createdAt: string
  updatedAt: string
}

export interface BrandFormData {
  name: string
  description?: string | null
  logoFile?: File | null
  amazonConnectionIds?: string[]
}

function transformFullBrand(dbBrand: DbBrand): Brand {
  return {
    id: dbBrand.id,
    name: dbBrand.name,
    description: dbBrand.description,
    logoUrl: dbBrand.logo_url,
    status: dbBrand.status,
    amazonConnectionIds: dbBrand.amazon_connection_ids || [],
    createdAt: dbBrand.created_at,
    updatedAt: dbBrand.updated_at,
  }
}

// Generate a unique filename for logo uploads
function generateLogoFilename(brandId: string, file: File): string {
  const ext = file.name.split('.').pop() || 'png'
  const timestamp = Date.now()
  return `${brandId}/${timestamp}.${ext}`
}

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const supabase = createClient()

  // Upload logo to storage
  const uploadLogo = useCallback(async (brandId: string, file: File): Promise<string | null> => {
    // Validate file size
    if (file.size > MAX_LOGO_SIZE) {
      throw new Error(`Logo file must be less than ${MAX_LOGO_SIZE / 1024 / 1024}MB`)
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Logo must be PNG, JPEG, GIF, WebP, or SVG')
    }

    setUploadingLogo(true)
    try {
      const filename = generateLogoFilename(brandId, file)

      const { error: uploadError } = await supabase.storage
        .from(LOGO_BUCKET)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(LOGO_BUCKET)
        .getPublicUrl(filename)

      return publicUrl
    } finally {
      setUploadingLogo(false)
    }
  }, [supabase])

  // Delete logo from storage
  const deleteLogo = useCallback(async (logoUrl: string): Promise<void> => {
    // Extract path from URL
    const url = new URL(logoUrl)
    const pathParts = url.pathname.split(`/${LOGO_BUCKET}/`)
    if (pathParts.length < 2) return

    const filePath = pathParts[1]

    await supabase.storage
      .from(LOGO_BUCKET)
      .remove([filePath])
  }, [supabase])

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

  // Create brand with optional logo
  const createBrand = useCallback(async (data: BrandFormData): Promise<Brand | null> => {
    try {
      // First create the brand without logo
      const insertData: DbBrandInsert = {
        name: data.name,
        description: data.description || null,
        amazon_connection_ids: data.amazonConnectionIds || [],
        status: 'active' as BrandStatus,
      }

      const { data: created, error: createError } = await supabase
        .from('brands')
        .insert(insertData)
        .select()
        .single()

      if (createError) throw createError

      let brand = transformFullBrand(created)

      // If logo file provided, upload it and update the brand
      if (data.logoFile) {
        const logoUrl = await uploadLogo(brand.id, data.logoFile)

        if (logoUrl) {
          const { data: updated, error: updateError } = await supabase
            .from('brands')
            .update({ logo_url: logoUrl })
            .eq('id', brand.id)
            .select()
            .single()

          if (updateError) {
            // Try to clean up uploaded logo on failure
            await deleteLogo(logoUrl).catch(() => {})
            throw updateError
          }

          brand = transformFullBrand(updated)
        }
      }

      setBrands(prev => [...prev, brand].sort((a, b) => a.name.localeCompare(b.name)))
      return brand
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create brand'))
      return null
    }
  }, [supabase, uploadLogo, deleteLogo])

  // Update brand with optional logo change
  const updateBrand = useCallback(async (
    id: string,
    data: Partial<BrandFormData> & { removeLogo?: boolean }
  ): Promise<Brand | null> => {
    try {
      const currentBrand = brands.find(b => b.id === id)
      const updateData: Record<string, unknown> = {}

      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description
      if (data.amazonConnectionIds !== undefined) updateData.amazon_connection_ids = data.amazonConnectionIds

      // Handle logo changes
      let newLogoUrl: string | null = null
      const oldLogoUrl = currentBrand?.logoUrl

      if (data.removeLogo && oldLogoUrl) {
        // Remove existing logo
        updateData.logo_url = null
      } else if (data.logoFile) {
        // Upload new logo
        newLogoUrl = await uploadLogo(id, data.logoFile)
        if (newLogoUrl) {
          updateData.logo_url = newLogoUrl
        }
      }

      const { data: updated, error: updateError } = await supabase
        .from('brands')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        // Clean up newly uploaded logo on failure
        if (newLogoUrl) {
          await deleteLogo(newLogoUrl).catch(() => {})
        }
        throw updateError
      }

      // Delete old logo if replaced or removed
      if ((data.removeLogo || newLogoUrl) && oldLogoUrl) {
        await deleteLogo(oldLogoUrl).catch(() => {
          // Non-fatal: logo cleanup failed
          console.warn('Failed to delete old logo:', oldLogoUrl)
        })
      }

      const brand = transformFullBrand(updated)
      setBrands(prev => prev.map(b => b.id === id ? brand : b))
      return brand
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update brand'))
      return null
    }
  }, [supabase, brands, uploadLogo, deleteLogo])

  // Delete brand (soft delete - set status to archived)
  const deleteBrand = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('brands')
        .update({ status: 'archived' as BrandStatus })
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
    uploadingLogo,
    refetch: fetchBrands,
    createBrand,
    updateBrand,
    deleteBrand,
    uploadLogo,
  }
}
