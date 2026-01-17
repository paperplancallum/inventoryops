'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface SalesForecast {
  id: string
  productId: string
  sku: string
  productName: string
  locationId: string
  locationName: string
  dailyRate: number
  confidence: ConfidenceLevel
  accuracyMAPE: number | null
  manualOverride: number | null
  isEnabled: boolean
  seasonalMultipliers: number[] // 12 values for months
  trendRate: number // Monthly growth rate
  lastCalculatedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SalesForecastInsert {
  productId: string
  locationId: string
  dailyRate: number
  confidence?: ConfidenceLevel
  accuracyMAPE?: number | null
  manualOverride?: number | null
  isEnabled?: boolean
  seasonalMultipliers?: number[]
  trendRate?: number
}

export function useSalesForecasts() {
  const [forecasts, setForecasts] = useState<SalesForecast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchForecasts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('sales_forecasts')
        .select(`
          *,
          product:products(id, sku, name),
          location:locations(id, name)
        `)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const mapped: SalesForecast[] = (data || []).map((row) => ({
        id: row.id,
        productId: row.product_id,
        sku: row.product?.sku || '',
        productName: row.product?.name || '',
        locationId: row.location_id,
        locationName: row.location?.name || '',
        dailyRate: parseFloat(row.daily_rate) || 0,
        confidence: row.confidence as ConfidenceLevel,
        accuracyMAPE: row.accuracy_mape ? parseFloat(row.accuracy_mape) : null,
        manualOverride: row.manual_override ? parseFloat(row.manual_override) : null,
        isEnabled: row.is_enabled,
        seasonalMultipliers: row.seasonal_multipliers || [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        trendRate: parseFloat(row.trend_rate) || 0,
        lastCalculatedAt: row.last_calculated_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))

      setForecasts(mapped)
    } catch (err) {
      console.error('Error fetching sales forecasts:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch forecasts')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchForecasts()
  }, [fetchForecasts])

  const createForecast = useCallback(async (forecast: SalesForecastInsert): Promise<SalesForecast | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('sales_forecasts')
        .insert({
          product_id: forecast.productId,
          location_id: forecast.locationId,
          daily_rate: forecast.dailyRate,
          confidence: forecast.confidence || 'medium',
          accuracy_mape: forecast.accuracyMAPE,
          manual_override: forecast.manualOverride,
          is_enabled: forecast.isEnabled ?? true,
          seasonal_multipliers: forecast.seasonalMultipliers || [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          trend_rate: forecast.trendRate || 0,
        })
        .select()
        .single()

      if (insertError) throw insertError

      await fetchForecasts()
      return data as unknown as SalesForecast
    } catch (err) {
      console.error('Error creating forecast:', err)
      throw err
    }
  }, [supabase, fetchForecasts])

  const updateForecast = useCallback(async (id: string, updates: Partial<SalesForecastInsert>): Promise<void> => {
    try {
      const updateData: Record<string, unknown> = {}
      if (updates.productId !== undefined) updateData.product_id = updates.productId
      if (updates.locationId !== undefined) updateData.location_id = updates.locationId
      if (updates.dailyRate !== undefined) updateData.daily_rate = updates.dailyRate
      if (updates.confidence !== undefined) updateData.confidence = updates.confidence
      if (updates.accuracyMAPE !== undefined) updateData.accuracy_mape = updates.accuracyMAPE
      if (updates.manualOverride !== undefined) updateData.manual_override = updates.manualOverride
      if (updates.isEnabled !== undefined) updateData.is_enabled = updates.isEnabled
      if (updates.seasonalMultipliers !== undefined) updateData.seasonal_multipliers = updates.seasonalMultipliers
      if (updates.trendRate !== undefined) updateData.trend_rate = updates.trendRate

      const { error: updateError } = await supabase
        .from('sales_forecasts')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError

      await fetchForecasts()
    } catch (err) {
      console.error('Error updating forecast:', err)
      throw err
    }
  }, [supabase, fetchForecasts])

  const deleteForecast = useCallback(async (id: string): Promise<void> => {
    try {
      const { error: deleteError } = await supabase
        .from('sales_forecasts')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      await fetchForecasts()
    } catch (err) {
      console.error('Error deleting forecast:', err)
      throw err
    }
  }, [supabase, fetchForecasts])

  const toggleEnabled = useCallback(async (id: string, enabled: boolean): Promise<void> => {
    await updateForecast(id, { isEnabled: enabled })
  }, [updateForecast])

  return {
    forecasts,
    loading,
    error,
    refetch: fetchForecasts,
    createForecast,
    updateForecast,
    deleteForecast,
    toggleEnabled,
  }
}
