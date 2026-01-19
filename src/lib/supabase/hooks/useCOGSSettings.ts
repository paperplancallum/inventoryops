'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../client'
import type { Database } from '../database.types'

// =============================================================================
// Types
// =============================================================================

type DbCOGSSettings = Database['public']['Tables']['cogs_settings']['Row']
type DbCOGSSettingsInsert = Database['public']['Tables']['cogs_settings']['Insert']
type DbCOGSSettingsUpdate = Database['public']['Tables']['cogs_settings']['Update']

export interface COGSSettings {
  id: string
  name: string
  description: string | null
  isDefault: boolean
  // Product cost
  includeProductCost: boolean
  // Shipping/Transfer
  includeShippingToAmazon: boolean
  includeDutiesTaxes: boolean
  // FBA fees
  includeFbaFulfillment: boolean
  includeFbaStorage: boolean
  includeFbaPrep: boolean
  includeFbaLabeling: boolean
  // Inbound fees
  includeInboundPlacement: boolean
  includeInboundTransportation: boolean
  // AWD fees
  includeAwdStorage: boolean
  includeAwdProcessing: boolean
  includeAwdTransportation: boolean
  // Other
  includeReferralFees: boolean
  includeAdvertising: boolean
  // Adjustments
  includeDamagedLost: boolean
  includeDisposed: boolean
  // Assembly
  includeAssemblyCosts: boolean
  // Export
  exportFormat: string | null
  exportDecimalPlaces: number | null
  exportIncludeHeaders: boolean | null
  // Audit
  createdAt: string
  updatedAt: string
}

export interface COGSSettingsFormData {
  name: string
  description?: string
  isDefault?: boolean
  includeProductCost?: boolean
  includeShippingToAmazon?: boolean
  includeDutiesTaxes?: boolean
  includeFbaFulfillment?: boolean
  includeFbaStorage?: boolean
  includeFbaPrep?: boolean
  includeFbaLabeling?: boolean
  includeInboundPlacement?: boolean
  includeInboundTransportation?: boolean
  includeAwdStorage?: boolean
  includeAwdProcessing?: boolean
  includeAwdTransportation?: boolean
  includeReferralFees?: boolean
  includeAdvertising?: boolean
  includeDamagedLost?: boolean
  includeDisposed?: boolean
  includeAssemblyCosts?: boolean
}

// =============================================================================
// Transform Functions
// =============================================================================

function transformSettings(db: DbCOGSSettings): COGSSettings {
  return {
    id: db.id,
    name: db.name,
    description: db.description,
    isDefault: db.is_default,
    includeProductCost: db.include_product_cost,
    includeShippingToAmazon: db.include_shipping_to_amazon,
    includeDutiesTaxes: db.include_duties_taxes,
    includeFbaFulfillment: db.include_fba_fulfillment,
    includeFbaStorage: db.include_fba_storage,
    includeFbaPrep: db.include_fba_prep,
    includeFbaLabeling: db.include_fba_labeling,
    includeInboundPlacement: db.include_inbound_placement,
    includeInboundTransportation: db.include_inbound_transportation,
    includeAwdStorage: db.include_awd_storage,
    includeAwdProcessing: db.include_awd_processing,
    includeAwdTransportation: db.include_awd_transportation,
    includeReferralFees: db.include_referral_fees,
    includeAdvertising: db.include_advertising,
    includeDamagedLost: db.include_damaged_lost,
    includeDisposed: db.include_disposed,
    includeAssemblyCosts: db.include_assembly_costs,
    exportFormat: db.export_format,
    exportDecimalPlaces: db.export_decimal_places,
    exportIncludeHeaders: db.export_include_headers,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

function toDbInsert(data: COGSSettingsFormData): DbCOGSSettingsInsert {
  return {
    name: data.name,
    description: data.description,
    is_default: data.isDefault,
    include_product_cost: data.includeProductCost,
    include_shipping_to_amazon: data.includeShippingToAmazon,
    include_duties_taxes: data.includeDutiesTaxes,
    include_fba_fulfillment: data.includeFbaFulfillment,
    include_fba_storage: data.includeFbaStorage,
    include_fba_prep: data.includeFbaPrep,
    include_fba_labeling: data.includeFbaLabeling,
    include_inbound_placement: data.includeInboundPlacement,
    include_inbound_transportation: data.includeInboundTransportation,
    include_awd_storage: data.includeAwdStorage,
    include_awd_processing: data.includeAwdProcessing,
    include_awd_transportation: data.includeAwdTransportation,
    include_referral_fees: data.includeReferralFees,
    include_advertising: data.includeAdvertising,
    include_damaged_lost: data.includeDamagedLost,
    include_disposed: data.includeDisposed,
    include_assembly_costs: data.includeAssemblyCosts,
  }
}

function toDbUpdate(data: Partial<COGSSettingsFormData>): DbCOGSSettingsUpdate {
  const update: DbCOGSSettingsUpdate = {}
  if (data.name !== undefined) update.name = data.name
  if (data.description !== undefined) update.description = data.description
  if (data.isDefault !== undefined) update.is_default = data.isDefault
  if (data.includeProductCost !== undefined) update.include_product_cost = data.includeProductCost
  if (data.includeShippingToAmazon !== undefined) update.include_shipping_to_amazon = data.includeShippingToAmazon
  if (data.includeDutiesTaxes !== undefined) update.include_duties_taxes = data.includeDutiesTaxes
  if (data.includeFbaFulfillment !== undefined) update.include_fba_fulfillment = data.includeFbaFulfillment
  if (data.includeFbaStorage !== undefined) update.include_fba_storage = data.includeFbaStorage
  if (data.includeFbaPrep !== undefined) update.include_fba_prep = data.includeFbaPrep
  if (data.includeFbaLabeling !== undefined) update.include_fba_labeling = data.includeFbaLabeling
  if (data.includeInboundPlacement !== undefined) update.include_inbound_placement = data.includeInboundPlacement
  if (data.includeInboundTransportation !== undefined) update.include_inbound_transportation = data.includeInboundTransportation
  if (data.includeAwdStorage !== undefined) update.include_awd_storage = data.includeAwdStorage
  if (data.includeAwdProcessing !== undefined) update.include_awd_processing = data.includeAwdProcessing
  if (data.includeAwdTransportation !== undefined) update.include_awd_transportation = data.includeAwdTransportation
  if (data.includeReferralFees !== undefined) update.include_referral_fees = data.includeReferralFees
  if (data.includeAdvertising !== undefined) update.include_advertising = data.includeAdvertising
  if (data.includeDamagedLost !== undefined) update.include_damaged_lost = data.includeDamagedLost
  if (data.includeDisposed !== undefined) update.include_disposed = data.includeDisposed
  if (data.includeAssemblyCosts !== undefined) update.include_assembly_costs = data.includeAssemblyCosts
  return update
}

// =============================================================================
// Hook
// =============================================================================

export function useCOGSSettings() {
  const [settings, setSettings] = useState<COGSSettings[]>([])
  const [defaultSettings, setDefaultSettings] = useState<COGSSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch all settings
  const fetchSettings = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('cogs_settings')
      .select('*')
      .order('name')

    if (fetchError) {
      setError(fetchError.message)
      setIsLoading(false)
      return
    }

    const transformed = (data || []).map(transformSettings)
    setSettings(transformed)
    setDefaultSettings(transformed.find(s => s.isDefault) || null)
    setIsLoading(false)
  }, [supabase])

  // Create new settings profile
  const createSettings = useCallback(async (data: COGSSettingsFormData): Promise<COGSSettings | null> => {
    const { data: created, error: createError } = await supabase
      .from('cogs_settings')
      .insert(toDbInsert(data))
      .select()
      .single()

    if (createError) {
      setError(createError.message)
      return null
    }

    const transformed = transformSettings(created)
    setSettings(prev => [...prev, transformed].sort((a, b) => a.name.localeCompare(b.name)))
    if (transformed.isDefault) {
      setDefaultSettings(transformed)
    }
    return transformed
  }, [supabase])

  // Update settings
  const updateSettings = useCallback(async (id: string, data: Partial<COGSSettingsFormData>): Promise<COGSSettings | null> => {
    const { data: updated, error: updateError } = await supabase
      .from('cogs_settings')
      .update(toDbUpdate(data))
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
      return null
    }

    const transformed = transformSettings(updated)
    setSettings(prev => prev.map(s => s.id === id ? transformed : s))
    if (transformed.isDefault) {
      setDefaultSettings(transformed)
    }
    return transformed
  }, [supabase])

  // Set as default
  const setAsDefault = useCallback(async (id: string): Promise<boolean> => {
    const { error: updateError } = await supabase
      .from('cogs_settings')
      .update({ is_default: true })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      return false
    }

    // Refresh to get updated default states (trigger handles unsetting others)
    await fetchSettings()
    return true
  }, [supabase, fetchSettings])

  // Delete settings
  const deleteSettings = useCallback(async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('cogs_settings')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    setSettings(prev => prev.filter(s => s.id !== id))
    if (defaultSettings?.id === id) {
      setDefaultSettings(null)
    }
    return true
  }, [supabase, defaultSettings])

  // Get settings by name
  const getSettingsByName = useCallback((name: string): COGSSettings | undefined => {
    return settings.find(s => s.name === name)
  }, [settings])

  // Initial fetch
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return {
    settings,
    defaultSettings,
    isLoading,
    error,
    fetchSettings,
    createSettings,
    updateSettings,
    setAsDefault,
    deleteSettings,
    getSettingsByName,
  }
}
