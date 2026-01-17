'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../client'
import type { DbSupplier, SupplierStatus } from '../database.types'
import type { Supplier, SupplierFormData, PaymentMilestoneTrigger } from '@/sections/suppliers/types'

interface MilestoneJson {
  id: string
  name: string
  percentage: number
  trigger: string
  offsetDays: number
}

// Transform database supplier to frontend supplier
function transformSupplier(
  dbSupplier: DbSupplier,
  productCount: number = 0
): Supplier {
  const milestones = dbSupplier.custom_payment_milestones as MilestoneJson[] | null
  return {
    id: dbSupplier.id,
    name: dbSupplier.name,
    contactName: dbSupplier.contact_name || '',
    contactEmail: dbSupplier.contact_email || '',
    contactPhone: dbSupplier.contact_phone || undefined,
    country: dbSupplier.country,
    countryCode: dbSupplier.country_code || undefined,
    productCount,
    leadTimeDays: dbSupplier.lead_time_days,
    paymentTerms: dbSupplier.payment_terms || '',
    paymentTermsTemplateId: dbSupplier.payment_terms_template_id || undefined,
    customPaymentMilestones: milestones?.map(m => ({
      id: m.id,
      name: m.name,
      percentage: m.percentage,
      trigger: m.trigger as PaymentMilestoneTrigger,
      offsetDays: m.offsetDays,
    })) || undefined,
    factoryLocationId: dbSupplier.factory_location_id || undefined,
    status: dbSupplier.status,
    notes: dbSupplier.notes || undefined,
    createdAt: dbSupplier.created_at,
    updatedAt: dbSupplier.updated_at,
  }
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch all suppliers with product counts
  const fetchSuppliers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true })

      if (suppliersError) throw suppliersError

      if (!suppliersData || suppliersData.length === 0) {
        setSuppliers([])
        return
      }

      // Fetch product counts per supplier
      const { data: productCounts, error: countsError } = await supabase
        .from('products')
        .select('supplier_id')
        .not('supplier_id', 'is', null)

      if (countsError) throw countsError

      // Count products per supplier
      const countsBySupplier = (productCounts || []).reduce((acc, p) => {
        if (p.supplier_id) {
          acc[p.supplier_id] = (acc[p.supplier_id] || 0) + 1
        }
        return acc
      }, {} as Record<string, number>)

      // Transform suppliers
      const transformedSuppliers = suppliersData.map(s =>
        transformSupplier(s, countsBySupplier[s.id] || 0)
      )

      setSuppliers(transformedSuppliers)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch suppliers'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Create supplier
  const createSupplier = useCallback(async (data: SupplierFormData): Promise<Supplier | null> => {
    try {
      // If createFactoryLocation is true, create a factory location first
      let factoryLocationId: string | null = null

      if (data.createFactoryLocation && data.name && data.country) {
        const { data: newLocation, error: locationError } = await supabase
          .from('locations')
          .insert({
            name: `${data.name} Factory`,
            type: 'factory',
            country: data.country,
            is_active: true,
          })
          .select()
          .single()

        if (locationError) throw locationError
        factoryLocationId = newLocation.id
      }

      // Insert supplier
      const { data: newSupplier, error: supplierError } = await supabase
        .from('suppliers')
        .insert({
          name: data.name,
          contact_name: data.contactName || null,
          contact_email: data.contactEmail || null,
          contact_phone: data.contactPhone || null,
          country: data.country,
          lead_time_days: data.leadTimeDays,
          payment_terms: data.paymentTerms || null,
          payment_terms_template_id: data.paymentTermsTemplateId || null,
          custom_payment_milestones: data.customPaymentMilestones || null,
          factory_location_id: factoryLocationId || data.factoryLocationId || null,
          status: 'active' as SupplierStatus,
          notes: data.notes || null,
        })
        .select()
        .single()

      if (supplierError) throw supplierError

      const supplier = transformSupplier(newSupplier, 0)
      setSuppliers(prev => [...prev, supplier].sort((a, b) => a.name.localeCompare(b.name)))
      return supplier
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create supplier'))
      return null
    }
  }, [supabase])

  // Update supplier
  const updateSupplier = useCallback(async (id: string, data: Partial<SupplierFormData>): Promise<Supplier | null> => {
    try {
      const updateData: Record<string, unknown> = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.contactName !== undefined) updateData.contact_name = data.contactName || null
      if (data.contactEmail !== undefined) updateData.contact_email = data.contactEmail || null
      if (data.contactPhone !== undefined) updateData.contact_phone = data.contactPhone || null
      if (data.country !== undefined) updateData.country = data.country
      if (data.leadTimeDays !== undefined) updateData.lead_time_days = data.leadTimeDays
      if (data.paymentTerms !== undefined) updateData.payment_terms = data.paymentTerms || null
      if (data.paymentTermsTemplateId !== undefined) updateData.payment_terms_template_id = data.paymentTermsTemplateId || null
      if (data.customPaymentMilestones !== undefined) updateData.custom_payment_milestones = data.customPaymentMilestones || null
      if (data.factoryLocationId !== undefined) updateData.factory_location_id = data.factoryLocationId || null
      if (data.notes !== undefined) updateData.notes = data.notes || null

      const { data: updatedSupplier, error: supplierError } = await supabase
        .from('suppliers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (supplierError) throw supplierError

      // Get current product count
      const existingSupplier = suppliers.find(s => s.id === id)
      const productCount = existingSupplier?.productCount || 0

      const supplier = transformSupplier(updatedSupplier, productCount)
      setSuppliers(prev => prev.map(s => s.id === id ? supplier : s))
      return supplier
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update supplier'))
      return null
    }
  }, [supabase, suppliers])

  // Archive supplier (for suppliers with products)
  const archiveSupplier = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ status: 'archived' as SupplierStatus })
        .eq('id', id)

      if (error) throw error

      setSuppliers(prev => prev.map(s =>
        s.id === id ? { ...s, status: 'archived' as SupplierStatus } : s
      ))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to archive supplier'))
      return false
    }
  }, [supabase])

  // Delete supplier (only for suppliers without products)
  const deleteSupplier = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Check if supplier has products
      const supplier = suppliers.find(s => s.id === id)
      if (supplier && supplier.productCount > 0) {
        throw new Error('Cannot delete supplier with products. Archive instead.')
      }

      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSuppliers(prev => prev.filter(s => s.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete supplier'))
      return false
    }
  }, [supabase, suppliers])

  // Initial fetch
  useEffect(() => {
    fetchSuppliers()
  }, [fetchSuppliers])

  return {
    suppliers,
    loading,
    error,
    refetch: fetchSuppliers,
    createSupplier,
    updateSupplier,
    archiveSupplier,
    deleteSupplier,
  }
}
