'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type AdjustmentEffect = 'exclude' | 'multiply'

export interface AccountForecastAdjustment {
  id: string
  name: string
  startDate: string
  endDate: string
  effect: AdjustmentEffect
  multiplier: number | null
  isRecurring: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface ProductForecastAdjustment {
  id: string
  productId: string
  accountAdjustmentId: string | null
  name: string
  startDate: string
  endDate: string
  effect: AdjustmentEffect
  multiplier: number | null
  isRecurring: boolean
  isOptedOut: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface AccountAdjustmentInsert {
  name: string
  startDate: string
  endDate: string
  effect: AdjustmentEffect
  multiplier?: number | null
  isRecurring?: boolean
  notes?: string | null
}

export interface ProductAdjustmentInsert {
  productId: string
  accountAdjustmentId?: string | null
  name: string
  startDate: string
  endDate: string
  effect: AdjustmentEffect
  multiplier?: number | null
  isRecurring?: boolean
  isOptedOut?: boolean
  notes?: string | null
}

export function useForecastAdjustments() {
  const [accountAdjustments, setAccountAdjustments] = useState<AccountForecastAdjustment[]>([])
  const [productAdjustments, setProductAdjustments] = useState<ProductForecastAdjustment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchAdjustments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [accountResult, productResult] = await Promise.all([
        supabase
          .from('account_forecast_adjustments')
          .select('*')
          .order('start_date', { ascending: true }),
        supabase
          .from('product_forecast_adjustments')
          .select('*')
          .order('start_date', { ascending: true }),
      ])

      if (accountResult.error) throw accountResult.error
      if (productResult.error) throw productResult.error

      const mappedAccount: AccountForecastAdjustment[] = (accountResult.data || []).map((row) => ({
        id: row.id,
        name: row.name,
        startDate: row.start_date,
        endDate: row.end_date,
        effect: row.effect as AdjustmentEffect,
        multiplier: row.multiplier ? parseFloat(row.multiplier) : null,
        isRecurring: row.is_recurring,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))

      const mappedProduct: ProductForecastAdjustment[] = (productResult.data || []).map((row) => ({
        id: row.id,
        productId: row.product_id,
        accountAdjustmentId: row.account_adjustment_id,
        name: row.name,
        startDate: row.start_date,
        endDate: row.end_date,
        effect: row.effect as AdjustmentEffect,
        multiplier: row.multiplier ? parseFloat(row.multiplier) : null,
        isRecurring: row.is_recurring,
        isOptedOut: row.is_opted_out,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))

      setAccountAdjustments(mappedAccount)
      setProductAdjustments(mappedProduct)
    } catch (err) {
      console.error('Error fetching forecast adjustments:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch adjustments')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchAdjustments()
  }, [fetchAdjustments])

  // Account adjustments CRUD
  const createAccountAdjustment = useCallback(async (adjustment: AccountAdjustmentInsert): Promise<AccountForecastAdjustment | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('account_forecast_adjustments')
        .insert({
          name: adjustment.name,
          start_date: adjustment.startDate,
          end_date: adjustment.endDate,
          effect: adjustment.effect,
          multiplier: adjustment.multiplier,
          is_recurring: adjustment.isRecurring ?? false,
          notes: adjustment.notes,
        })
        .select()
        .single()

      if (insertError) throw insertError

      await fetchAdjustments()
      return data as unknown as AccountForecastAdjustment
    } catch (err) {
      console.error('Error creating account adjustment:', err)
      throw err
    }
  }, [supabase, fetchAdjustments])

  const updateAccountAdjustment = useCallback(async (id: string, updates: Partial<AccountAdjustmentInsert>): Promise<void> => {
    try {
      const updateData: Record<string, unknown> = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.startDate !== undefined) updateData.start_date = updates.startDate
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate
      if (updates.effect !== undefined) updateData.effect = updates.effect
      if (updates.multiplier !== undefined) updateData.multiplier = updates.multiplier
      if (updates.isRecurring !== undefined) updateData.is_recurring = updates.isRecurring
      if (updates.notes !== undefined) updateData.notes = updates.notes

      const { error: updateError } = await supabase
        .from('account_forecast_adjustments')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError

      await fetchAdjustments()
    } catch (err) {
      console.error('Error updating account adjustment:', err)
      throw err
    }
  }, [supabase, fetchAdjustments])

  const deleteAccountAdjustment = useCallback(async (id: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('account_forecast_adjustments')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchAdjustments()
    } catch (err) {
      console.error('Error deleting account adjustment:', err)
      throw err
    }
  }, [supabase, fetchAdjustments])

  // Product adjustments CRUD
  const createProductAdjustment = useCallback(async (adjustment: ProductAdjustmentInsert): Promise<ProductForecastAdjustment | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('product_forecast_adjustments')
        .insert({
          product_id: adjustment.productId,
          account_adjustment_id: adjustment.accountAdjustmentId,
          name: adjustment.name,
          start_date: adjustment.startDate,
          end_date: adjustment.endDate,
          effect: adjustment.effect,
          multiplier: adjustment.multiplier,
          is_recurring: adjustment.isRecurring ?? false,
          is_opted_out: adjustment.isOptedOut ?? false,
          notes: adjustment.notes,
        })
        .select()
        .single()

      if (insertError) throw insertError

      await fetchAdjustments()
      return data as unknown as ProductForecastAdjustment
    } catch (err) {
      console.error('Error creating product adjustment:', err)
      throw err
    }
  }, [supabase, fetchAdjustments])

  const updateProductAdjustment = useCallback(async (id: string, updates: Partial<ProductAdjustmentInsert>): Promise<void> => {
    try {
      const updateData: Record<string, unknown> = {}
      if (updates.productId !== undefined) updateData.product_id = updates.productId
      if (updates.accountAdjustmentId !== undefined) updateData.account_adjustment_id = updates.accountAdjustmentId
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.startDate !== undefined) updateData.start_date = updates.startDate
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate
      if (updates.effect !== undefined) updateData.effect = updates.effect
      if (updates.multiplier !== undefined) updateData.multiplier = updates.multiplier
      if (updates.isRecurring !== undefined) updateData.is_recurring = updates.isRecurring
      if (updates.isOptedOut !== undefined) updateData.is_opted_out = updates.isOptedOut
      if (updates.notes !== undefined) updateData.notes = updates.notes

      const { error: updateError } = await supabase
        .from('product_forecast_adjustments')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError

      await fetchAdjustments()
    } catch (err) {
      console.error('Error updating product adjustment:', err)
      throw err
    }
  }, [supabase, fetchAdjustments])

  const deleteProductAdjustment = useCallback(async (id: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('product_forecast_adjustments')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchAdjustments()
    } catch (err) {
      console.error('Error deleting product adjustment:', err)
      throw err
    }
  }, [supabase, fetchAdjustments])

  // Opt out a product from an account adjustment
  const optOutAccountAdjustment = useCallback(async (productId: string, accountAdjustmentId: string): Promise<void> => {
    const existingAdjustment = accountAdjustments.find((a) => a.id === accountAdjustmentId)
    if (!existingAdjustment) return

    await createProductAdjustment({
      productId,
      accountAdjustmentId,
      name: `Opt-out: ${existingAdjustment.name}`,
      startDate: existingAdjustment.startDate,
      endDate: existingAdjustment.endDate,
      effect: existingAdjustment.effect,
      multiplier: existingAdjustment.multiplier,
      isRecurring: existingAdjustment.isRecurring,
      isOptedOut: true,
    })
  }, [accountAdjustments, createProductAdjustment])

  // Opt back in to an account adjustment
  const optInAccountAdjustment = useCallback(async (productId: string, accountAdjustmentId: string): Promise<void> => {
    const optOutRecord = productAdjustments.find(
      (a) => a.productId === productId && a.accountAdjustmentId === accountAdjustmentId && a.isOptedOut
    )
    if (optOutRecord) {
      await deleteProductAdjustment(optOutRecord.id)
    }
  }, [productAdjustments, deleteProductAdjustment])

  // Get product adjustments for a specific product
  const getProductAdjustments = useCallback((productId: string): ProductForecastAdjustment[] => {
    return productAdjustments.filter((a) => a.productId === productId)
  }, [productAdjustments])

  // Get opted-out account adjustment IDs for a product
  const getOptedOutAccountIds = useCallback((productId: string): string[] => {
    return productAdjustments
      .filter((a) => a.productId === productId && a.isOptedOut && a.accountAdjustmentId)
      .map((a) => a.accountAdjustmentId!)
  }, [productAdjustments])

  return {
    accountAdjustments,
    productAdjustments,
    loading,
    error,
    refetch: fetchAdjustments,
    // Account adjustments
    createAccountAdjustment,
    updateAccountAdjustment,
    deleteAccountAdjustment,
    // Product adjustments
    createProductAdjustment,
    updateProductAdjustment,
    deleteProductAdjustment,
    // Opt in/out
    optOutAccountAdjustment,
    optInAccountAdjustment,
    // Helpers
    getProductAdjustments,
    getOptedOutAccountIds,
  }
}
