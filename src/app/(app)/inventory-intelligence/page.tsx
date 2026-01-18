'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { InventoryIntelligenceView } from '@/sections/inventory-intelligence/components'
import { useReplenishmentSuggestions } from '@/lib/supabase/hooks/useReplenishmentSuggestions'
import { useSalesForecasts } from '@/lib/supabase/hooks/useSalesForecasts'
import { useSalesHistory } from '@/lib/supabase/hooks/useSalesHistory'
import { useForecastAdjustments } from '@/lib/supabase/hooks/useForecastAdjustments'
import { useLocations } from '@/lib/supabase/hooks/useLocations'
import { useShippingRoutes } from '@/lib/supabase/hooks/useShippingRoutes'
import { useProducts } from '@/lib/supabase/hooks/useProducts'
import type { InventoryIntelligenceTab, DashboardSummary, UrgencyOption, LocationReference, ProductReference } from '@/sections/inventory-intelligence/types'

const URGENCY_OPTIONS: UrgencyOption[] = [
  { id: 'critical', label: 'Critical', color: 'red' },
  { id: 'warning', label: 'Warning', color: 'amber' },
  { id: 'planned', label: 'Planned', color: 'indigo' },
  { id: 'monitor', label: 'Monitor', color: 'slate' },
]

export default function InventoryIntelligencePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<InventoryIntelligenceTab>('dashboard')

  // Fetch data using hooks
  const {
    suggestions,
    transferSuggestions,
    poSuggestions,
    urgencyCounts,
    loading: suggestionsLoading,
    regenerateSuggestions,
    acceptSuggestion,
    dismissSuggestion,
    snoozeSuggestion,
  } = useReplenishmentSuggestions()

  const { products: rawProducts, loading: productsLoading } = useProducts()

  const {
    forecasts,
    loading: forecastsLoading,
    updateForecast,
    toggleEnabled,
    recalculateForecast,
  } = useSalesForecasts()

  const { history: salesHistory, loading: historyLoading } = useSalesHistory()

  const {
    accountAdjustments,
    loading: adjustmentsLoading,
    createAccountAdjustment,
    updateAccountAdjustment,
    deleteAccountAdjustment,
  } = useForecastAdjustments()

  const { locations: rawLocations, loading: locationsLoading } = useLocations()
  const { expandedRoutes: routes, loading: routesLoading } = useShippingRoutes()

  // Transform locations to LocationReference
  const locations: LocationReference[] = useMemo(() => {
    return (rawLocations || []).map((loc) => ({
      id: loc.id,
      name: loc.name,
      type: loc.type,
    }))
  }, [rawLocations])

  // Transform products to ProductReference
  const products: ProductReference[] = useMemo(() => {
    return (rawProducts || []).map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      supplierId: p.supplierId,
    }))
  }, [rawProducts])

  // Build dashboard summary
  const dashboardSummary: DashboardSummary = useMemo(() => {
    // Calculate location health from suggestions
    const locationMap = new Map<string, {
      locationId: string
      locationName: string
      locationType: string
      products: Set<string>
      healthy: number
      warning: number
      critical: number
    }>()

    suggestions.forEach((s) => {
      const key = s.destinationLocationId
      if (!locationMap.has(key)) {
        locationMap.set(key, {
          locationId: key,
          locationName: s.destinationLocationName,
          locationType: 'warehouse', // Default, could be enhanced
          products: new Set(),
          healthy: 0,
          warning: 0,
          critical: 0,
        })
      }
      const loc = locationMap.get(key)!
      loc.products.add(s.productId)

      if (s.urgency === 'critical') loc.critical++
      else if (s.urgency === 'warning') loc.warning++
      else loc.healthy++
    })

    const locationHealth = Array.from(locationMap.values()).map((loc) => ({
      locationId: loc.locationId,
      locationName: loc.locationName,
      locationType: loc.locationType,
      totalProducts: loc.products.size,
      healthyCount: loc.healthy,
      warningCount: loc.warning,
      criticalCount: loc.critical,
      totalValue: 0, // Would need inventory value data
    }))

    return {
      totalActiveProducts: new Set(suggestions.map((s) => s.productId)).size,
      totalSuggestions: suggestions.length,
      urgencyCounts,
      locationHealth,
      recentlyDismissed: suggestions.filter((s) => s.status === 'dismissed').length,
      recentlySnoozed: suggestions.filter((s) => s.status === 'snoozed').length,
      lastCalculatedAt: suggestions[0]?.generatedAt || new Date().toISOString(),
    }
  }, [suggestions, urgencyCounts])

  // Accept transfer suggestion handler - stores prefill data and navigates
  const handleAcceptTransferSuggestion = useCallback((id: string) => {
    const suggestion = transferSuggestions.find(s => s.id === id)
    if (!suggestion) return

    // Store prefill data in sessionStorage
    const prefillData = {
      sourceLocationId: suggestion.sourceLocationId || undefined,
      destinationLocationId: suggestion.destinationLocationId,
      lineItems: [{
        productId: suggestion.productId,
        sku: suggestion.sku,
        quantity: suggestion.recommendedQty,
      }],
      routeId: suggestion.routeId || undefined,
      suggestionId: suggestion.id,
    }
    sessionStorage.setItem('transferPrefill', JSON.stringify(prefillData))

    // Mark as accepted
    acceptSuggestion(id, undefined, 'transfer')

    // Navigate to transfers page
    router.push('/transfers?action=create')
  }, [transferSuggestions, acceptSuggestion, router])

  // Accept PO suggestion handler - stores prefill data and navigates
  const handleAcceptPOSuggestion = useCallback((id: string) => {
    const suggestion = poSuggestions.find(s => s.id === id)
    if (!suggestion) return

    // Store prefill data in sessionStorage
    const prefillData = {
      supplierId: suggestion.supplierId || undefined,
      lineItems: [{
        productId: suggestion.productId,
        sku: suggestion.sku,
        quantity: suggestion.recommendedQty,
      }],
      suggestionId: suggestion.id,
    }
    sessionStorage.setItem('poPrefill', JSON.stringify(prefillData))

    // Mark as accepted
    acceptSuggestion(id, undefined, 'purchase-order')

    // Navigate to purchase orders page
    router.push('/purchase-orders?action=create')
  }, [poSuggestions, acceptSuggestion, router])

  // Check loading state
  const isLoading =
    suggestionsLoading ||
    forecastsLoading ||
    historyLoading ||
    adjustmentsLoading ||
    locationsLoading ||
    routesLoading ||
    productsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Loading inventory intelligence...</p>
        </div>
      </div>
    )
  }

  return (
    <InventoryIntelligenceView
      activeTab={activeTab}
      onTabChange={setActiveTab}
      dashboardSummary={dashboardSummary}
      transferSuggestions={transferSuggestions}
      poSuggestions={poSuggestions}
      locations={locations}
      routes={routes}
      urgencyOptions={URGENCY_OPTIONS}
      onAcceptTransferSuggestion={handleAcceptTransferSuggestion}
      onAcceptPOSuggestion={handleAcceptPOSuggestion}
      onDismissSuggestion={dismissSuggestion}
      onSnoozeSuggestion={snoozeSuggestion}
      onRefreshSuggestions={regenerateSuggestions}
      forecasts={forecasts}
      salesHistory={salesHistory}
      accountForecastAdjustments={accountAdjustments}
      products={products}
      onUpdateForecast={updateForecast}
      onToggleEnabled={toggleEnabled}
      onRecalculateForecast={recalculateForecast}
      onAddAccountAdjustment={(adjustment) => {
        createAccountAdjustment({
          name: adjustment.name,
          startDate: adjustment.startDate,
          endDate: adjustment.endDate,
          effect: adjustment.effect,
          multiplier: adjustment.multiplier,
          isRecurring: adjustment.isRecurring,
          notes: adjustment.notes,
        })
      }}
      onEditAccountAdjustment={(id, adjustment) => {
        updateAccountAdjustment(id, {
          name: adjustment.name,
          startDate: adjustment.startDate,
          endDate: adjustment.endDate,
          effect: adjustment.effect,
          multiplier: adjustment.multiplier,
          isRecurring: adjustment.isRecurring,
          notes: adjustment.notes,
        })
      }}
      onRemoveAccountAdjustment={deleteAccountAdjustment}
    />
  )
}
