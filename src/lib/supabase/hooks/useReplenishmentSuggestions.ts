'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ShippingMethod } from './useShippingRouteLegs'

export type SuggestionType = 'transfer' | 'purchase-order'
export type SuggestionUrgency = 'critical' | 'warning' | 'planned' | 'monitor'
export type SuggestionStatus = 'pending' | 'accepted' | 'dismissed' | 'snoozed'
export type ReasoningItemType = 'info' | 'warning' | 'calculation'

export interface ReasoningItem {
  type: ReasoningItemType
  message: string
  value?: string | number
}

export interface ReplenishmentSuggestion {
  id: string
  type: SuggestionType
  urgency: SuggestionUrgency
  status: SuggestionStatus

  // Product information
  productId: string
  sku: string
  productName: string

  // Destination (usually Amazon location)
  destinationLocationId: string
  destinationLocationName: string

  // Current state at destination
  currentStock: number
  inTransitQuantity: number
  reservedQuantity: number
  availableStock: number

  // Sales and coverage
  dailySalesRate: number
  weeklySalesRate: number
  daysOfStockRemaining: number
  stockoutDate: string | null
  safetyStockThreshold: number

  // Recommendation
  recommendedQty: number
  estimatedArrival: string | null

  // Source (for transfers)
  sourceLocationId: string | null
  sourceLocationName: string | null
  sourceAvailableQty: number | null

  // Supplier (for POs)
  supplierId: string | null
  supplierName: string | null
  supplierLeadTimeDays: number | null

  // Route information
  routeId: string | null
  routeName: string | null
  routeMethod: ShippingMethod | null
  routeTransitDays: number | null

  // Reasoning
  reasoning: ReasoningItem[]

  // Metadata
  generatedAt: string
  snoozedUntil: string | null
  dismissedReason: string | null
  acceptedAt: string | null
  linkedEntityId: string | null
  linkedEntityType: 'transfer' | 'purchase-order' | null
}

export interface UrgencyCounts {
  critical: number
  warning: number
  planned: number
  monitor: number
}

export interface SuggestionFilters {
  type?: SuggestionType
  urgency?: SuggestionUrgency[]
  status?: SuggestionStatus[]
  locationId?: string
  productId?: string
}

export function useReplenishmentSuggestions(filters?: SuggestionFilters) {
  const [suggestions, setSuggestions] = useState<ReplenishmentSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('replenishment_suggestions')
        .select(`
          *,
          product:products(id, sku, name),
          destination:locations!destination_location_id(id, name),
          source:locations!source_location_id(id, name),
          supplier:suppliers(id, name, lead_time_days),
          route:shipping_routes(id, name)
        `)
        .order('urgency', { ascending: true }) // critical first
        .order('days_of_stock_remaining', { ascending: true })

      if (filters?.type) {
        query = query.eq('type', filters.type)
      }
      if (filters?.urgency?.length) {
        query = query.in('urgency', filters.urgency)
      }
      if (filters?.status?.length) {
        query = query.in('status', filters.status)
      } else {
        query = query.eq('status', 'pending') // Default to pending
      }
      if (filters?.locationId) {
        query = query.eq('destination_location_id', filters.locationId)
      }
      if (filters?.productId) {
        query = query.eq('product_id', filters.productId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      const mapped: ReplenishmentSuggestion[] = (data || []).map((row) => ({
        id: row.id,
        type: row.type as SuggestionType,
        urgency: row.urgency as SuggestionUrgency,
        status: row.status as SuggestionStatus,
        productId: row.product_id,
        sku: row.product?.sku || '',
        productName: row.product?.name || '',
        destinationLocationId: row.destination_location_id,
        destinationLocationName: row.destination?.name || '',
        currentStock: row.current_stock,
        inTransitQuantity: row.in_transit_quantity,
        reservedQuantity: row.reserved_quantity,
        availableStock: row.available_stock,
        dailySalesRate: parseFloat(row.daily_sales_rate) || 0,
        weeklySalesRate: parseFloat(row.weekly_sales_rate) || 0,
        daysOfStockRemaining: row.days_of_stock_remaining,
        stockoutDate: row.stockout_date,
        safetyStockThreshold: row.safety_stock_threshold,
        recommendedQty: row.recommended_qty,
        estimatedArrival: row.estimated_arrival,
        sourceLocationId: row.source_location_id,
        sourceLocationName: row.source?.name || null,
        sourceAvailableQty: row.source_available_qty,
        supplierId: row.supplier_id,
        supplierName: row.supplier?.name || null,
        supplierLeadTimeDays: row.supplier?.lead_time_days || row.supplier_lead_time_days,
        routeId: row.route_id,
        routeName: row.route?.name || null,
        routeMethod: row.route_method as ShippingMethod | null,
        routeTransitDays: row.route_transit_days,
        reasoning: (row.reasoning || []) as ReasoningItem[],
        generatedAt: row.generated_at,
        snoozedUntil: row.snoozed_until,
        dismissedReason: row.dismissed_reason,
        acceptedAt: row.accepted_at,
        linkedEntityId: row.linked_entity_id,
        linkedEntityType: row.linked_entity_type as 'transfer' | 'purchase-order' | null,
      }))

      setSuggestions(mapped)
    } catch (err) {
      console.error('Error fetching replenishment suggestions:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch suggestions')
    } finally {
      setLoading(false)
    }
  }, [supabase, filters])

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  const acceptSuggestion = useCallback(async (id: string, linkedEntityId?: string, linkedEntityType?: 'transfer' | 'purchase-order'): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('replenishment_suggestions')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          linked_entity_id: linkedEntityId || null,
          linked_entity_type: linkedEntityType || null,
        })
        .eq('id', id)

      if (updateError) throw updateError

      await fetchSuggestions()
    } catch (err) {
      console.error('Error accepting suggestion:', err)
      throw err
    }
  }, [supabase, fetchSuggestions])

  const dismissSuggestion = useCallback(async (id: string, reason?: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('replenishment_suggestions')
        .update({
          status: 'dismissed',
          dismissed_reason: reason || null,
        })
        .eq('id', id)

      if (updateError) throw updateError

      await fetchSuggestions()
    } catch (err) {
      console.error('Error dismissing suggestion:', err)
      throw err
    }
  }, [supabase, fetchSuggestions])

  const snoozeSuggestion = useCallback(async (id: string, until: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('replenishment_suggestions')
        .update({
          status: 'snoozed',
          snoozed_until: until,
        })
        .eq('id', id)

      if (updateError) throw updateError

      await fetchSuggestions()
    } catch (err) {
      console.error('Error snoozing suggestion:', err)
      throw err
    }
  }, [supabase, fetchSuggestions])

  // Regenerate suggestions by calling the API
  const regenerateSuggestions = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await fetch('/api/inventory-intelligence/generate-suggestions', {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to regenerate suggestions')
      }

      // Refetch to get the new suggestions
      await fetchSuggestions()
    } catch (err) {
      console.error('Error regenerating suggestions:', err)
      setError(err instanceof Error ? err.message : 'Failed to regenerate suggestions')
    } finally {
      setLoading(false)
    }
  }, [fetchSuggestions])

  // Get urgency counts
  const urgencyCounts: UrgencyCounts = {
    critical: suggestions.filter((s) => s.urgency === 'critical' && s.status === 'pending').length,
    warning: suggestions.filter((s) => s.urgency === 'warning' && s.status === 'pending').length,
    planned: suggestions.filter((s) => s.urgency === 'planned' && s.status === 'pending').length,
    monitor: suggestions.filter((s) => s.urgency === 'monitor' && s.status === 'pending').length,
  }

  // Filter by type
  const transferSuggestions = suggestions.filter((s) => s.type === 'transfer')
  const poSuggestions = suggestions.filter((s) => s.type === 'purchase-order')

  return {
    suggestions,
    transferSuggestions,
    poSuggestions,
    urgencyCounts,
    loading,
    error,
    refetch: fetchSuggestions,
    regenerateSuggestions,
    acceptSuggestion,
    dismissSuggestion,
    snoozeSuggestion,
  }
}
