'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../client'
import type {
  SafetyStockRule,
  ThresholdType,
  SeasonalMultiplier,
  SafetyStockRuleFormData,
} from '@/sections/inventory-intelligence/types'

interface DbSafetyStockRule {
  id: string
  product_id: string
  location_id: string
  threshold_type: ThresholdType
  threshold_value: number
  seasonal_multipliers: SeasonalMultiplier[]
  is_active: boolean
  created_at: string
  updated_at: string
  product?: { id: string; sku: string; name: string }
  location?: { id: string; name: string }
}

function transformRule(db: DbSafetyStockRule): SafetyStockRule {
  return {
    id: db.id,
    productId: db.product_id,
    sku: db.product?.sku || '',
    productName: db.product?.name || 'Unknown',
    locationId: db.location_id,
    locationName: db.location?.name || 'Unknown',
    thresholdType: db.threshold_type,
    thresholdValue: db.threshold_value,
    seasonalMultipliers: db.seasonal_multipliers || [],
    isActive: db.is_active,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

export function useSafetyStockRules() {
  const [rules, setRules] = useState<SafetyStockRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const fetchRules = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: rulesError } = await supabase
        .from('safety_stock_rules')
        .select(`
          *,
          product:products(id, sku, name),
          location:locations(id, name)
        `)
        .order('updated_at', { ascending: false })

      if (rulesError) throw rulesError

      setRules((data || []).map(transformRule))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch safety stock rules'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const createRule = useCallback(async (data: SafetyStockRuleFormData): Promise<SafetyStockRule | null> => {
    try {
      const { data: newRule, error: ruleError } = await supabase
        .from('safety_stock_rules')
        .insert({
          product_id: data.productId,
          location_id: data.locationId,
          threshold_type: data.thresholdType,
          threshold_value: data.thresholdValue,
          seasonal_multipliers: data.seasonalMultipliers,
        })
        .select(`
          *,
          product:products(id, sku, name),
          location:locations(id, name)
        `)
        .single()

      if (ruleError) throw ruleError

      const rule = transformRule(newRule)
      setRules(prev => [rule, ...prev])
      return rule
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create safety stock rule'))
      return null
    }
  }, [supabase])

  const updateRule = useCallback(async (id: string, data: Partial<SafetyStockRuleFormData>): Promise<SafetyStockRule | null> => {
    try {
      const updateData: Record<string, unknown> = {}
      if (data.thresholdType !== undefined) updateData.threshold_type = data.thresholdType
      if (data.thresholdValue !== undefined) updateData.threshold_value = data.thresholdValue
      if (data.seasonalMultipliers !== undefined) updateData.seasonal_multipliers = data.seasonalMultipliers

      const { data: updatedRule, error: ruleError } = await supabase
        .from('safety_stock_rules')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          product:products(id, sku, name),
          location:locations(id, name)
        `)
        .single()

      if (ruleError) throw ruleError

      const rule = transformRule(updatedRule)
      setRules(prev => prev.map(r => r.id === id ? rule : r))
      return rule
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update safety stock rule'))
      return null
    }
  }, [supabase])

  const deleteRule = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('safety_stock_rules')
        .delete()
        .eq('id', id)

      if (error) throw error

      setRules(prev => prev.filter(r => r.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete safety stock rule'))
      return false
    }
  }, [supabase])

  const toggleActive = useCallback(async (id: string): Promise<boolean> => {
    const rule = rules.find(r => r.id === id)
    if (!rule) return false

    try {
      const { error } = await supabase
        .from('safety_stock_rules')
        .update({ is_active: !rule.isActive })
        .eq('id', id)

      if (error) throw error

      setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to toggle safety stock rule'))
      return false
    }
  }, [supabase, rules])

  // Get rule for a specific product/location
  const getRuleForProductLocation = useCallback((productId: string, locationId: string): SafetyStockRule | undefined => {
    return rules.find(r =>
      r.productId === productId &&
      r.locationId === locationId &&
      r.isActive
    )
  }, [rules])

  // Get effective threshold considering seasonal multipliers
  const getEffectiveThreshold = useCallback((rule: SafetyStockRule, month?: number): number => {
    const currentMonth = month ?? new Date().getMonth() + 1 // 1-12
    const seasonalMultiplier = rule.seasonalMultipliers.find(m => m.month === currentMonth)
    const multiplier = seasonalMultiplier?.multiplier || 1
    return Math.round(rule.thresholdValue * multiplier)
  }, [])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  return {
    rules,
    activeRules: rules.filter(r => r.isActive),
    loading,
    error,
    refetch: fetchRules,
    createRule,
    updateRule,
    deleteRule,
    toggleActive,
    getRuleForProductLocation,
    getEffectiveThreshold,
  }
}
