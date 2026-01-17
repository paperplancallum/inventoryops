'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type ThresholdType = 'units' | 'days-of-cover'

export interface SeasonalMultiplier {
  month: number
  multiplier: number
}

export interface SafetyStockRule {
  id: string
  productId: string
  sku: string
  productName: string
  locationId: string
  locationName: string
  thresholdType: ThresholdType
  thresholdValue: number
  seasonalMultipliers: SeasonalMultiplier[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SafetyStockRuleInsert {
  productId: string
  locationId: string
  thresholdType: ThresholdType
  thresholdValue: number
  seasonalMultipliers?: SeasonalMultiplier[]
  isActive?: boolean
}

export function useSafetyStockRules() {
  const [rules, setRules] = useState<SafetyStockRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('safety_stock_rules')
        .select(`
          *,
          product:products(id, sku, name),
          location:locations(id, name)
        `)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const mapped: SafetyStockRule[] = (data || []).map((row) => ({
        id: row.id,
        productId: row.product_id,
        sku: row.product?.sku || '',
        productName: row.product?.name || '',
        locationId: row.location_id,
        locationName: row.location?.name || '',
        thresholdType: row.threshold_type as ThresholdType,
        thresholdValue: parseFloat(row.threshold_value) || 0,
        seasonalMultipliers: (row.seasonal_multipliers || []) as SeasonalMultiplier[],
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))

      setRules(mapped)
    } catch (err) {
      console.error('Error fetching safety stock rules:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch rules')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  const createRule = useCallback(async (rule: SafetyStockRuleInsert): Promise<SafetyStockRule | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('safety_stock_rules')
        .insert({
          product_id: rule.productId,
          location_id: rule.locationId,
          threshold_type: rule.thresholdType,
          threshold_value: rule.thresholdValue,
          seasonal_multipliers: rule.seasonalMultipliers || [],
          is_active: rule.isActive ?? true,
        })
        .select()
        .single()

      if (insertError) throw insertError

      await fetchRules()
      return data as unknown as SafetyStockRule
    } catch (err) {
      console.error('Error creating rule:', err)
      throw err
    }
  }, [supabase, fetchRules])

  const updateRule = useCallback(async (id: string, updates: Partial<SafetyStockRuleInsert>): Promise<void> => {
    try {
      const updateData: Record<string, unknown> = {}
      if (updates.productId !== undefined) updateData.product_id = updates.productId
      if (updates.locationId !== undefined) updateData.location_id = updates.locationId
      if (updates.thresholdType !== undefined) updateData.threshold_type = updates.thresholdType
      if (updates.thresholdValue !== undefined) updateData.threshold_value = updates.thresholdValue
      if (updates.seasonalMultipliers !== undefined) updateData.seasonal_multipliers = updates.seasonalMultipliers
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive

      const { error: updateError } = await supabase
        .from('safety_stock_rules')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError

      await fetchRules()
    } catch (err) {
      console.error('Error updating rule:', err)
      throw err
    }
  }, [supabase, fetchRules])

  const deleteRule = useCallback(async (id: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('safety_stock_rules')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchRules()
    } catch (err) {
      console.error('Error deleting rule:', err)
      throw err
    }
  }, [supabase, fetchRules])

  const toggleActive = useCallback(async (id: string, active: boolean): Promise<void> => {
    await updateRule(id, { isActive: active })
  }, [updateRule])

  return {
    rules,
    loading,
    error,
    refetch: fetchRules,
    createRule,
    updateRule,
    deleteRule,
    toggleActive,
  }
}
