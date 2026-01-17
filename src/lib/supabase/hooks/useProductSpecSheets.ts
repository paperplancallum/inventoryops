'use client'

import { useState, useCallback } from 'react'
import { createClient } from '../client'
import type { DbProductSpecSheet } from '../database.types'
import type { ProductSpecSheet } from '@/sections/catalog/types'

// Transform database spec sheet to frontend spec sheet
function transformSpecSheet(dbSpec: DbProductSpecSheet): ProductSpecSheet {
  return {
    id: dbSpec.id,
    fileName: dbSpec.file_name,
    fileUrl: dbSpec.file_url,
    storagePath: dbSpec.storage_path || undefined,
    fileSize: dbSpec.file_size,
    uploadedAt: dbSpec.uploaded_at,
    uploadedById: dbSpec.uploaded_by_id || '',
    uploadedByName: dbSpec.uploaded_by_name || 'Unknown',
    version: dbSpec.version,
    notes: dbSpec.notes || undefined,
  }
}

export function useProductSpecSheets() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Upload spec sheet
  const uploadSpecSheet = useCallback(async (
    productId: string,
    file: File,
    currentVersion?: string
  ): Promise<ProductSpecSheet | null> => {
    setUploading(true)
    setError(null)

    try {
      // Calculate new version
      const newVersion = currentVersion
        ? `v${(parseFloat(currentVersion.replace('v', '')) + 0.1).toFixed(1)}`
        : 'v1.0'

      // Generate unique file path
      const fileExt = file.name.split('.').pop()
      const fileName = `${productId}/${newVersion}-${Date.now()}.${fileExt}`

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-spec-sheets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-spec-sheets')
        .getPublicUrl(uploadData.path)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Create spec sheet record
      const { data: specSheet, error: dbError } = await supabase
        .from('product_spec_sheets')
        .insert({
          product_id: productId,
          version: newVersion,
          file_name: file.name,
          file_url: urlData.publicUrl,
          storage_path: uploadData.path,
          file_size: file.size,
          uploaded_by_id: user.id,
          uploaded_by_name: user.user_metadata?.full_name || user.email || 'Unknown',
        })
        .select()
        .single()

      if (dbError) throw dbError

      return transformSpecSheet(specSheet)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to upload spec sheet'))
      return null
    } finally {
      setUploading(false)
    }
  }, [supabase])

  // Get spec sheet for product (latest version)
  const getSpecSheet = useCallback(async (productId: string): Promise<ProductSpecSheet | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('product_spec_sheets')
        .select('*')
        .eq('product_id', productId)
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') return null // No rows found
        throw fetchError
      }

      return transformSpecSheet(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch spec sheet'))
      return null
    }
  }, [supabase])

  // Get all versions for product
  const getAllVersions = useCallback(async (productId: string): Promise<ProductSpecSheet[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('product_spec_sheets')
        .select('*')
        .eq('product_id', productId)
        .order('uploaded_at', { ascending: false })

      if (fetchError) throw fetchError

      return (data || []).map(spec => transformSpecSheet(spec))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch spec sheet versions'))
      return []
    }
  }, [supabase])

  // Download spec sheet
  const downloadSpecSheet = useCallback(async (specSheet: ProductSpecSheet): Promise<void> => {
    try {
      window.open(specSheet.fileUrl, '_blank')
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to download spec sheet'))
    }
  }, [])

  // Delete spec sheet
  const deleteSpecSheet = useCallback(async (specSheet: ProductSpecSheet): Promise<boolean> => {
    try {
      // Delete from storage if path exists
      if (specSheet.storagePath) {
        const { error: storageError } = await supabase.storage
          .from('product-spec-sheets')
          .remove([specSheet.storagePath])

        if (storageError) {
          console.warn('Failed to delete from storage:', storageError)
          // Continue to delete DB record even if storage delete fails
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('product_spec_sheets')
        .delete()
        .eq('id', specSheet.id)

      if (dbError) throw dbError

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete spec sheet'))
      return false
    }
  }, [supabase])

  return {
    uploading,
    error,
    uploadSpecSheet,
    getSpecSheet,
    getAllVersions,
    downloadSpecSheet,
    deleteSpecSheet,
  }
}
