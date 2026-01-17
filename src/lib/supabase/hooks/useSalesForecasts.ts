'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../client'
import type {
  SalesForecast,
  ConfidenceLevel,
  ProductForecastAdjustment,
  AdjustmentEffect,
} from '@/sections/inventory-intelligence/types'

interface DbSalesForecast {
  id: string
  product_id: string
  location_id: string
  daily_rate: number
  confidence: ConfidenceLevel
  accuracy_mape: number | null
  manual_override: number | null
  is_enabled: boolean
  seasonal_multipliers: number[]
  trend_rate: number
  last_calculated_at: string | null
  created_at: string
  updated_at: string
  product?: { id: string; sku: string; name: string }
  location?: { id: string; name: string }
}

interface DbProductForecastAdjustment {
  id: string
  forecast_id: string
  account_adjustment_id: string | null
  name: string
  start_date: string
  end_date: string
  effect: AdjustmentEffect
  multiplier: number | null
  is_recurring: boolean
  is_opted_out: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

function transformForecast(db: DbSalesForecast, adjustments: DbProductForecastAdjustment[] = []): SalesForecast {
  return {
    id: db.id,
    productId: db.product_id,
    sku: db.product?.sku || '',
    productName: db.product?.name || 'Unknown',
    locationId: db.location_id,
    locationName: db.location?.name || 'Unknown',
    dailyRate: db.daily_rate,
    confidence: db.confidence,
    accuracyMAPE: db.accuracy_mape ?? undefined,
    manualOverride: db.manual_override,
    isEnabled: db.is_enabled,
    seasonalMultipliers: db.seasonal_multipliers || [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    trendRate: db.trend_rate,
    lastCalculatedAt: db.last_calculated_at,
    productAdjustments: adjustments.map(a => ({
      id: a.id,
      forecastId: a.forecast_id,
      accountAdjustmentId: a.account_adjustment_id ?? undefined,
      name: a.name,
      startDate: a.start_date,
      endDate: a.end_date,
      effect: a.effect,
      multiplier: a.multiplier ?? undefined,
      isRecurring: a.is_recurring,
      isOptedOut: a.is_opted_out,
      notes: a.notes ?? undefined,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    })),
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

export function useSalesForecasts() {
  const [forecasts, setForecasts] = useState<SalesForecast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const fetchForecasts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch forecasts with related data
      const { data: forecastsData, error: forecastsError } = await supabase
        .from('sales_forecasts')
        .select(`
          *,
          product:products(id, sku, name),
          location:locations(id, name)
        `)
        .order('updated_at', { ascending: false })

      if (forecastsError) throw forecastsError

      // Fetch all product adjustments
      const { data: adjustmentsData, error: adjustmentsError } = await supabase
        .from('product_forecast_adjustments')
        .select('*')

      if (adjustmentsError) throw adjustmentsError

      // Group adjustments by forecast_id
      const adjustmentsByForecast = (adjustmentsData || []).reduce((acc, adj) => {
        if (!acc[adj.forecast_id]) acc[adj.forecast_id] = []
        acc[adj.forecast_id].push(adj)
        return acc
      }, {} as Record<string, DbProductForecastAdjustment[]>)

      setForecasts((forecastsData || []).map(f =>
        transformForecast(f, adjustmentsByForecast[f.id] || [])
      ))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch forecasts'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const createForecast = useCallback(async (data: {
    productId: string
    locationId: string
    dailyRate?: number
    confidence?: ConfidenceLevel
    seasonalMultipliers?: number[]
    trendRate?: number
  }): Promise<SalesForecast | null> => {
    try {
      const { data: newForecast, error: forecastError } = await supabase
        .from('sales_forecasts')
        .insert({
          product_id: data.productId,
          location_id: data.locationId,
          daily_rate: data.dailyRate || 0,
          confidence: data.confidence || 'medium',
          seasonal_multipliers: data.seasonalMultipliers || [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          trend_rate: data.trendRate || 0,
        })
        .select(`
          *,
          product:products(id, sku, name),
          location:locations(id, name)
        `)
        .single()

      if (forecastError) throw forecastError

      const forecast = transformForecast(newForecast, [])
      setForecasts(prev => [forecast, ...prev])
      return forecast
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create forecast'))
      return null
    }
  }, [supabase])

  const updateForecast = useCallback(async (id: string, data: Partial<{
    dailyRate: number
    confidence: ConfidenceLevel
    manualOverride: number | null
    isEnabled: boolean
    seasonalMultipliers: number[]
    trendRate: number
  }>): Promise<SalesForecast | null> => {
    try {
      const updateData: Record<string, unknown> = {}
      if (data.dailyRate !== undefined) updateData.daily_rate = data.dailyRate
      if (data.confidence !== undefined) updateData.confidence = data.confidence
      if (data.manualOverride !== undefined) updateData.manual_override = data.manualOverride
      if (data.isEnabled !== undefined) updateData.is_enabled = data.isEnabled
      if (data.seasonalMultipliers !== undefined) updateData.seasonal_multipliers = data.seasonalMultipliers
      if (data.trendRate !== undefined) updateData.trend_rate = data.trendRate

      const { data: updatedForecast, error: forecastError } = await supabase
        .from('sales_forecasts')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          product:products(id, sku, name),
          location:locations(id, name)
        `)
        .single()

      if (forecastError) throw forecastError

      // Get existing adjustments
      const existingForecast = forecasts.find(f => f.id === id)
      const forecast = transformForecast(updatedForecast, existingForecast?.productAdjustments?.map(a => ({
        id: a.id,
        forecast_id: a.forecastId,
        account_adjustment_id: a.accountAdjustmentId || null,
        name: a.name,
        start_date: a.startDate,
        end_date: a.endDate,
        effect: a.effect,
        multiplier: a.multiplier || null,
        is_recurring: a.isRecurring,
        is_opted_out: a.isOptedOut || false,
        notes: a.notes || null,
        created_at: a.createdAt,
        updated_at: a.updatedAt,
      })) || [])

      setForecasts(prev => prev.map(f => f.id === id ? forecast : f))
      return forecast
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update forecast'))
      return null
    }
  }, [supabase, forecasts])

  const toggleEnabled = useCallback(async (id: string): Promise<boolean> => {
    const forecast = forecasts.find(f => f.id === id)
    if (!forecast) return false

    const result = await updateForecast(id, { isEnabled: !forecast.isEnabled })
    return result !== null
  }, [forecasts, updateForecast])

  const deleteForecast = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('sales_forecasts')
        .delete()
        .eq('id', id)

      if (error) throw error

      setForecasts(prev => prev.filter(f => f.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete forecast'))
      return false
    }
  }, [supabase])

  // Product-level adjustment management
  const addProductAdjustment = useCallback(async (forecastId: string, data: {
    name: string
    startDate: string
    endDate: string
    effect: AdjustmentEffect
    multiplier?: number
    isRecurring?: boolean
    notes?: string
    accountAdjustmentId?: string
    isOptedOut?: boolean
  }): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('product_forecast_adjustments')
        .insert({
          forecast_id: forecastId,
          account_adjustment_id: data.accountAdjustmentId || null,
          name: data.name,
          start_date: data.startDate,
          end_date: data.endDate,
          effect: data.effect,
          multiplier: data.multiplier || null,
          is_recurring: data.isRecurring || false,
          is_opted_out: data.isOptedOut || false,
          notes: data.notes || null,
        })

      if (error) throw error

      await fetchForecasts()
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add product adjustment'))
      return false
    }
  }, [supabase, fetchForecasts])

  const removeProductAdjustment = useCallback(async (adjustmentId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('product_forecast_adjustments')
        .delete()
        .eq('id', adjustmentId)

      if (error) throw error

      await fetchForecasts()
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to remove product adjustment'))
      return false
    }
  }, [supabase, fetchForecasts])

  const optOutAccountAdjustment = useCallback(async (forecastId: string, accountAdjustmentId: string): Promise<boolean> => {
    return addProductAdjustment(forecastId, {
      name: 'Opt-out',
      startDate: '1970-01-01',
      endDate: '2099-12-31',
      effect: 'exclude',
      accountAdjustmentId,
      isOptedOut: true,
    })
  }, [addProductAdjustment])

  useEffect(() => {
    fetchForecasts()
  }, [fetchForecasts])

  return {
    forecasts,
    enabledForecasts: forecasts.filter(f => f.isEnabled),
    loading,
    error,
    refetch: fetchForecasts,
    createForecast,
    updateForecast,
    toggleEnabled,
    deleteForecast,
    addProductAdjustment,
    removeProductAdjustment,
    optOutAccountAdjustment,
  }
}
