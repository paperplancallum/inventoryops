'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '../client'
import type {
  ReplenishmentSuggestion,
  SuggestionType,
  SuggestionUrgency,
  SuggestionStatus,
  ReasoningItem,
  ShippingMethod,
  DashboardSummary,
  UrgencyCounts,
  LocationHealth,
} from '@/sections/inventory-intelligence/types'

interface DbReplenishmentSuggestion {
  id: string
  type: SuggestionType
  urgency: SuggestionUrgency
  status: SuggestionStatus
  product_id: string
  destination_location_id: string
  current_stock: number
  in_transit_quantity: number
  reserved_quantity: number
  available_stock: number
  daily_sales_rate: number
  weekly_sales_rate: number
  days_of_stock_remaining: number | null
  stockout_date: string | null
  safety_stock_threshold: number
  recommended_qty: number
  estimated_arrival: string | null
  source_location_id: string | null
  source_available_qty: number | null
  supplier_id: string | null
  supplier_lead_time_days: number | null
  route_id: string | null
  route_transit_days: number | null
  reasoning: ReasoningItem[]
  generated_at: string
  snoozed_until: string | null
  dismissed_reason: string | null
  accepted_at: string | null
  linked_entity_id: string | null
  linked_entity_type: string | null
  created_at: string
  updated_at: string
  product?: { id: string; sku: string; name: string }
  destination_location?: { id: string; name: string; type: string }
  source_location?: { id: string; name: string } | null
  supplier?: { id: string; name: string } | null
  route?: { id: string; name: string; method: ShippingMethod } | null
}

function transformSuggestion(db: DbReplenishmentSuggestion): ReplenishmentSuggestion {
  return {
    id: db.id,
    type: db.type,
    urgency: db.urgency,
    status: db.status,
    productId: db.product_id,
    sku: db.product?.sku || '',
    productName: db.product?.name || 'Unknown',
    destinationLocationId: db.destination_location_id,
    destinationLocationName: db.destination_location?.name || 'Unknown',
    currentStock: db.current_stock,
    inTransitQuantity: db.in_transit_quantity,
    reservedQuantity: db.reserved_quantity,
    availableStock: db.available_stock,
    dailySalesRate: db.daily_sales_rate,
    weeklySalesRate: db.weekly_sales_rate,
    daysOfStockRemaining: db.days_of_stock_remaining,
    stockoutDate: db.stockout_date,
    safetyStockThreshold: db.safety_stock_threshold,
    recommendedQty: db.recommended_qty,
    estimatedArrival: db.estimated_arrival,
    sourceLocationId: db.source_location_id,
    sourceLocationName: db.source_location?.name || null,
    sourceAvailableQty: db.source_available_qty,
    supplierId: db.supplier_id,
    supplierName: db.supplier?.name || null,
    supplierLeadTimeDays: db.supplier_lead_time_days,
    routeId: db.route_id,
    routeName: db.route?.name || null,
    routeMethod: db.route?.method || null,
    routeTransitDays: db.route_transit_days,
    reasoning: db.reasoning || [],
    generatedAt: db.generated_at,
    snoozedUntil: db.snoozed_until,
    dismissedReason: db.dismissed_reason,
    acceptedAt: db.accepted_at,
    linkedEntityId: db.linked_entity_id,
    linkedEntityType: db.linked_entity_type as 'transfer' | 'purchase-order' | null,
  }
}

export function useReplenishmentSuggestions() {
  const [suggestions, setSuggestions] = useState<ReplenishmentSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchSuggestions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: suggestionsError } = await supabase
        .from('replenishment_suggestions')
        .select(`
          *,
          product:products(id, sku, name),
          destination_location:locations!destination_location_id(id, name, type),
          source_location:locations!source_location_id(id, name),
          supplier:suppliers(id, name),
          route:shipping_routes(id, name, method)
        `)
        .order('urgency', { ascending: true })
        .order('days_of_stock_remaining', { ascending: true, nullsFirst: true })

      if (suggestionsError) throw suggestionsError

      setSuggestions((data || []).map(transformSuggestion))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch suggestions'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const acceptSuggestion = useCallback(async (id: string, linkedEntityId?: string): Promise<boolean> => {
    try {
      const suggestion = suggestions.find(s => s.id === id)
      if (!suggestion) return false

      const { error } = await supabase
        .from('replenishment_suggestions')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          linked_entity_id: linkedEntityId || null,
          linked_entity_type: suggestion.type,
        })
        .eq('id', id)

      if (error) throw error

      setSuggestions(prev => prev.map(s =>
        s.id === id
          ? { ...s, status: 'accepted', acceptedAt: new Date().toISOString(), linkedEntityId: linkedEntityId || null }
          : s
      ))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to accept suggestion'))
      return false
    }
  }, [supabase, suggestions])

  const dismissSuggestion = useCallback(async (id: string, reason?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('replenishment_suggestions')
        .update({
          status: 'dismissed',
          dismissed_reason: reason || null,
        })
        .eq('id', id)

      if (error) throw error

      setSuggestions(prev => prev.map(s =>
        s.id === id
          ? { ...s, status: 'dismissed', dismissedReason: reason || null }
          : s
      ))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to dismiss suggestion'))
      return false
    }
  }, [supabase])

  const snoozeSuggestion = useCallback(async (id: string, until: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('replenishment_suggestions')
        .update({
          status: 'snoozed',
          snoozed_until: until,
        })
        .eq('id', id)

      if (error) throw error

      setSuggestions(prev => prev.map(s =>
        s.id === id
          ? { ...s, status: 'snoozed', snoozedUntil: until }
          : s
      ))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to snooze suggestion'))
      return false
    }
  }, [supabase])

  // Filter helpers
  const pendingSuggestions = useMemo(() =>
    suggestions.filter(s => s.status === 'pending'),
    [suggestions]
  )

  const transferSuggestions = useMemo(() =>
    pendingSuggestions.filter(s => s.type === 'transfer'),
    [pendingSuggestions]
  )

  const poSuggestions = useMemo(() =>
    pendingSuggestions.filter(s => s.type === 'purchase-order'),
    [pendingSuggestions]
  )

  // Urgency counts
  const urgencyCounts: UrgencyCounts = useMemo(() => ({
    critical: pendingSuggestions.filter(s => s.urgency === 'critical').length,
    warning: pendingSuggestions.filter(s => s.urgency === 'warning').length,
    planned: pendingSuggestions.filter(s => s.urgency === 'planned').length,
    monitor: pendingSuggestions.filter(s => s.urgency === 'monitor').length,
  }), [pendingSuggestions])

  // Location health
  const locationHealth: LocationHealth[] = useMemo(() => {
    const locationMap = new Map<string, LocationHealth>()

    pendingSuggestions.forEach(s => {
      const key = s.destinationLocationId
      const existing = locationMap.get(key)

      if (existing) {
        existing.totalProducts++
        if (s.urgency === 'critical') existing.criticalCount++
        else if (s.urgency === 'warning') existing.warningCount++
        else existing.healthyCount++
      } else {
        locationMap.set(key, {
          locationId: s.destinationLocationId,
          locationName: s.destinationLocationName,
          locationType: 'amazon-fba', // Default, could be derived from location type
          totalProducts: 1,
          healthyCount: s.urgency === 'monitor' || s.urgency === 'planned' ? 1 : 0,
          warningCount: s.urgency === 'warning' ? 1 : 0,
          criticalCount: s.urgency === 'critical' ? 1 : 0,
          totalValue: 0, // Would need stock value calculation
        })
      }
    })

    return Array.from(locationMap.values())
  }, [pendingSuggestions])

  // Dashboard summary
  const dashboardSummary: DashboardSummary = useMemo(() => ({
    totalActiveProducts: new Set(pendingSuggestions.map(s => s.productId)).size,
    totalSuggestions: pendingSuggestions.length,
    urgencyCounts,
    locationHealth,
    recentlyDismissed: suggestions.filter(s => s.status === 'dismissed').length,
    recentlySnoozed: suggestions.filter(s => s.status === 'snoozed').length,
    lastCalculatedAt: suggestions[0]?.generatedAt || new Date().toISOString(),
  }), [pendingSuggestions, suggestions, urgencyCounts, locationHealth])

  // Top urgent suggestions (for dashboard)
  const topUrgentSuggestions = useMemo(() =>
    pendingSuggestions
      .filter(s => s.urgency === 'critical' || s.urgency === 'warning')
      .slice(0, 5),
    [pendingSuggestions]
  )

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  return {
    suggestions,
    pendingSuggestions,
    transferSuggestions,
    poSuggestions,
    urgencyCounts,
    locationHealth,
    dashboardSummary,
    topUrgentSuggestions,
    loading,
    error,
    refetch: fetchSuggestions,
    acceptSuggestion,
    dismissSuggestion,
    snoozeSuggestion,
  }
}
