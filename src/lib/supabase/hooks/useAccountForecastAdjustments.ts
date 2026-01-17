'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../client'
import type {
  AccountForecastAdjustment,
  AdjustmentEffect,
  ForecastAdjustmentFormData,
} from '@/sections/inventory-intelligence/types'

interface DbAccountForecastAdjustment {
  id: string
  name: string
  start_date: string
  end_date: string
  effect: AdjustmentEffect
  multiplier: number | null
  is_recurring: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

function transformAdjustment(db: DbAccountForecastAdjustment): AccountForecastAdjustment {
  return {
    id: db.id,
    name: db.name,
    startDate: db.start_date,
    endDate: db.end_date,
    effect: db.effect,
    multiplier: db.multiplier ?? undefined,
    isRecurring: db.is_recurring,
    notes: db.notes ?? undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

export function useAccountForecastAdjustments() {
  const [adjustments, setAdjustments] = useState<AccountForecastAdjustment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const fetchAdjustments = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: adjustmentsError } = await supabase
        .from('account_forecast_adjustments')
        .select('*')
        .order('start_date', { ascending: true })

      if (adjustmentsError) throw adjustmentsError

      setAdjustments((data || []).map(transformAdjustment))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch account adjustments'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const createAdjustment = useCallback(async (data: ForecastAdjustmentFormData): Promise<AccountForecastAdjustment | null> => {
    try {
      const { data: newAdjustment, error: adjustmentError } = await supabase
        .from('account_forecast_adjustments')
        .insert({
          name: data.name,
          start_date: data.startDate,
          end_date: data.endDate,
          effect: data.effect,
          multiplier: data.multiplier || null,
          is_recurring: data.isRecurring,
          notes: data.notes || null,
        })
        .select()
        .single()

      if (adjustmentError) throw adjustmentError

      const adjustment = transformAdjustment(newAdjustment)
      setAdjustments(prev => [...prev, adjustment].sort((a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      ))
      return adjustment
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create account adjustment'))
      return null
    }
  }, [supabase])

  const updateAdjustment = useCallback(async (id: string, data: Partial<ForecastAdjustmentFormData>): Promise<AccountForecastAdjustment | null> => {
    try {
      const updateData: Record<string, unknown> = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.startDate !== undefined) updateData.start_date = data.startDate
      if (data.endDate !== undefined) updateData.end_date = data.endDate
      if (data.effect !== undefined) updateData.effect = data.effect
      if (data.multiplier !== undefined) updateData.multiplier = data.multiplier || null
      if (data.isRecurring !== undefined) updateData.is_recurring = data.isRecurring
      if (data.notes !== undefined) updateData.notes = data.notes || null

      const { data: updatedAdjustment, error: adjustmentError } = await supabase
        .from('account_forecast_adjustments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (adjustmentError) throw adjustmentError

      const adjustment = transformAdjustment(updatedAdjustment)
      setAdjustments(prev => prev.map(a => a.id === id ? adjustment : a))
      return adjustment
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update account adjustment'))
      return null
    }
  }, [supabase])

  const deleteAdjustment = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('account_forecast_adjustments')
        .delete()
        .eq('id', id)

      if (error) throw error

      setAdjustments(prev => prev.filter(a => a.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete account adjustment'))
      return false
    }
  }, [supabase])

  // Get adjustments that are active for a specific date
  const getActiveAdjustments = useCallback((date: Date = new Date()): AccountForecastAdjustment[] => {
    const dateStr = date.toISOString().split('T')[0]
    return adjustments.filter(a => {
      if (a.isRecurring) {
        // For recurring, check month/day regardless of year
        const startMonth = parseInt(a.startDate.split('-')[1])
        const startDay = parseInt(a.startDate.split('-')[2])
        const endMonth = parseInt(a.endDate.split('-')[1])
        const endDay = parseInt(a.endDate.split('-')[2])
        const currentMonth = date.getMonth() + 1
        const currentDay = date.getDate()

        // Simple check - doesn't handle year wraparound perfectly
        if (startMonth < endMonth || (startMonth === endMonth && startDay <= endDay)) {
          return (currentMonth > startMonth || (currentMonth === startMonth && currentDay >= startDay)) &&
                 (currentMonth < endMonth || (currentMonth === endMonth && currentDay <= endDay))
        }
      }
      return dateStr >= a.startDate && dateStr <= a.endDate
    })
  }, [adjustments])

  useEffect(() => {
    fetchAdjustments()
  }, [fetchAdjustments])

  return {
    adjustments,
    loading,
    error,
    refetch: fetchAdjustments,
    createAdjustment,
    updateAdjustment,
    deleteAdjustment,
    getActiveAdjustments,
  }
}
