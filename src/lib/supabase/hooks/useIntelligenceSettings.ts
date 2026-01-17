'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../client'
import type { IntelligenceSettings } from '@/sections/inventory-intelligence/types'

interface DbIntelligenceSettings {
  id: string
  critical_threshold_days: number
  warning_threshold_days: number
  planned_threshold_days: number
  auto_refresh_interval_minutes: number
  default_safety_stock_days: number
  include_in_transit_in_calculations: boolean
  notify_on_critical: boolean
  notify_on_warning: boolean
  created_at: string
  updated_at: string
}

function transformSettings(db: DbIntelligenceSettings): IntelligenceSettings {
  return {
    id: db.id,
    urgencyThresholds: {
      criticalDays: db.critical_threshold_days,
      warningDays: db.warning_threshold_days,
      plannedDays: db.planned_threshold_days,
    },
    autoRefreshIntervalMinutes: db.auto_refresh_interval_minutes,
    defaultSafetyStockDays: db.default_safety_stock_days,
    includeInTransitInCalculations: db.include_in_transit_in_calculations,
    notifyOnCritical: db.notify_on_critical,
    notifyOnWarning: db.notify_on_warning,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

const DEFAULT_SETTINGS: IntelligenceSettings = {
  id: '',
  urgencyThresholds: {
    criticalDays: 7,
    warningDays: 14,
    plannedDays: 30,
  },
  autoRefreshIntervalMinutes: 60,
  defaultSafetyStockDays: 30,
  includeInTransitInCalculations: true,
  notifyOnCritical: true,
  notifyOnWarning: false,
  createdAt: '',
  updatedAt: '',
}

export function useIntelligenceSettings() {
  const [settings, setSettings] = useState<IntelligenceSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: settingsError } = await supabase
        .from('intelligence_settings')
        .select('*')
        .eq('is_active', true)
        .single()

      if (settingsError) {
        // If no settings exist, use defaults
        if (settingsError.code === 'PGRST116') {
          setSettings(DEFAULT_SETTINGS)
          return
        }
        throw settingsError
      }

      setSettings(transformSettings(data))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch settings'))
      setSettings(DEFAULT_SETTINGS)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const updateSettings = useCallback(async (updates: Partial<{
    criticalThresholdDays: number
    warningThresholdDays: number
    plannedThresholdDays: number
    autoRefreshIntervalMinutes: number
    defaultSafetyStockDays: number
    includeInTransitInCalculations: boolean
    notifyOnCritical: boolean
    notifyOnWarning: boolean
  }>): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {}

      if (updates.criticalThresholdDays !== undefined) {
        updateData.critical_threshold_days = updates.criticalThresholdDays
      }
      if (updates.warningThresholdDays !== undefined) {
        updateData.warning_threshold_days = updates.warningThresholdDays
      }
      if (updates.plannedThresholdDays !== undefined) {
        updateData.planned_threshold_days = updates.plannedThresholdDays
      }
      if (updates.autoRefreshIntervalMinutes !== undefined) {
        updateData.auto_refresh_interval_minutes = updates.autoRefreshIntervalMinutes
      }
      if (updates.defaultSafetyStockDays !== undefined) {
        updateData.default_safety_stock_days = updates.defaultSafetyStockDays
      }
      if (updates.includeInTransitInCalculations !== undefined) {
        updateData.include_in_transit_in_calculations = updates.includeInTransitInCalculations
      }
      if (updates.notifyOnCritical !== undefined) {
        updateData.notify_on_critical = updates.notifyOnCritical
      }
      if (updates.notifyOnWarning !== undefined) {
        updateData.notify_on_warning = updates.notifyOnWarning
      }

      if (settings.id) {
        // Update existing
        const { data, error: updateError } = await supabase
          .from('intelligence_settings')
          .update(updateData)
          .eq('id', settings.id)
          .select()
          .single()

        if (updateError) throw updateError
        setSettings(transformSettings(data))
      } else {
        // Create new
        const { data, error: insertError } = await supabase
          .from('intelligence_settings')
          .insert({
            ...updateData,
            is_active: true,
          })
          .select()
          .single()

        if (insertError) throw insertError
        setSettings(transformSettings(data))
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update settings'))
      return false
    }
  }, [supabase, settings.id])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    updateSettings,
  }
}
