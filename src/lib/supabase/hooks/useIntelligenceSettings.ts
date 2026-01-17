'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface UrgencyThresholds {
  criticalDays: number
  warningDays: number
  plannedDays: number
}

export interface IntelligenceSettings {
  id: string
  urgencyThresholds: UrgencyThresholds
  autoRefreshIntervalMinutes: number
  defaultSafetyStockDays: number
  includeInTransitInCalculations: boolean
  notifyOnCritical: boolean
  notifyOnWarning: boolean
  createdAt: string
  updatedAt: string
}

export interface IntelligenceSettingsUpdate {
  criticalDays?: number
  warningDays?: number
  plannedDays?: number
  autoRefreshIntervalMinutes?: number
  defaultSafetyStockDays?: number
  includeInTransitInCalculations?: boolean
  notifyOnCritical?: boolean
  notifyOnWarning?: boolean
}

const DEFAULT_SETTINGS: Omit<IntelligenceSettings, 'id' | 'createdAt' | 'updatedAt'> = {
  urgencyThresholds: {
    criticalDays: 3,
    warningDays: 7,
    plannedDays: 14,
  },
  autoRefreshIntervalMinutes: 60,
  defaultSafetyStockDays: 14,
  includeInTransitInCalculations: true,
  notifyOnCritical: true,
  notifyOnWarning: false,
}

export function useIntelligenceSettings() {
  const [settings, setSettings] = useState<IntelligenceSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('intelligence_settings')
        .select('*')
        .limit(1)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (data) {
        const mapped: IntelligenceSettings = {
          id: data.id,
          urgencyThresholds: {
            criticalDays: data.critical_days,
            warningDays: data.warning_days,
            plannedDays: data.planned_days,
          },
          autoRefreshIntervalMinutes: data.auto_refresh_interval_minutes,
          defaultSafetyStockDays: data.default_safety_stock_days,
          includeInTransitInCalculations: data.include_in_transit_in_calculations,
          notifyOnCritical: data.notify_on_critical,
          notifyOnWarning: data.notify_on_warning,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        }
        setSettings(mapped)
      }
    } catch (err) {
      console.error('Error fetching intelligence settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch settings')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateSettings = useCallback(async (updates: IntelligenceSettingsUpdate): Promise<void> => {
    try {
      if (!settings) return

      const updateData: Record<string, unknown> = {}
      if (updates.criticalDays !== undefined) updateData.critical_days = updates.criticalDays
      if (updates.warningDays !== undefined) updateData.warning_days = updates.warningDays
      if (updates.plannedDays !== undefined) updateData.planned_days = updates.plannedDays
      if (updates.autoRefreshIntervalMinutes !== undefined) updateData.auto_refresh_interval_minutes = updates.autoRefreshIntervalMinutes
      if (updates.defaultSafetyStockDays !== undefined) updateData.default_safety_stock_days = updates.defaultSafetyStockDays
      if (updates.includeInTransitInCalculations !== undefined) updateData.include_in_transit_in_calculations = updates.includeInTransitInCalculations
      if (updates.notifyOnCritical !== undefined) updateData.notify_on_critical = updates.notifyOnCritical
      if (updates.notifyOnWarning !== undefined) updateData.notify_on_warning = updates.notifyOnWarning

      const { error: updateError } = await supabase
        .from('intelligence_settings')
        .update(updateData)
        .eq('id', settings.id)

      if (updateError) throw updateError

      await fetchSettings()
    } catch (err) {
      console.error('Error updating intelligence settings:', err)
      throw err
    }
  }, [supabase, settings, fetchSettings])

  // Get effective settings (with defaults if not loaded)
  const effectiveSettings = settings || {
    ...DEFAULT_SETTINGS,
    id: '',
    createdAt: '',
    updatedAt: '',
  }

  return {
    settings: effectiveSettings,
    loading,
    error,
    refetch: fetchSettings,
    updateSettings,
  }
}
