'use client'

import { useState, useMemo } from 'react'
import { InventoryIntelligenceView } from '@/sections/inventory-intelligence/components'
import { useReplenishmentSuggestions } from '@/lib/supabase/hooks/useReplenishmentSuggestions'
import { useSalesForecasts } from '@/lib/supabase/hooks/useSalesForecasts'
import { useSalesHistory } from '@/lib/supabase/hooks/useSalesHistory'
import { useForecastAdjustments } from '@/lib/supabase/hooks/useForecastAdjustments'
import { useLocations } from '@/lib/supabase/hooks/useLocations'
import { useShippingRoutes } from '@/lib/supabase/hooks/useShippingRoutes'
import type { InventoryIntelligenceTab, DashboardSummary, UrgencyOption, LocationReference } from '@/sections/inventory-intelligence/types'

const URGENCY_OPTIONS: UrgencyOption[] = [
  { id: 'critical', label: 'Critical', color: 'red' },
  { id: 'warning', label: 'Warning', color: 'amber' },
  { id: 'planned', label: 'Planned', color: 'indigo' },
  { id: 'monitor', label: 'Monitor', color: 'slate' },
]

export default function InventoryIntelligencePage() {
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

  const {
    forecasts,
    loading: forecastsLoading,
    updateForecast,
    toggleEnabled,
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

  // Check loading state
  const isLoading =
    suggestionsLoading ||
    forecastsLoading ||
    historyLoading ||
    adjustmentsLoading ||
    locationsLoading ||
    routesLoading

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
      onAcceptTransferSuggestion={(id) => acceptSuggestion(id)}
      onAcceptPOSuggestion={(id) => acceptSuggestion(id)}
      onDismissSuggestion={dismissSuggestion}
      onSnoozeSuggestion={snoozeSuggestion}
      onRefreshSuggestions={regenerateSuggestions}
      forecasts={forecasts}
      salesHistory={salesHistory}
      accountForecastAdjustments={accountAdjustments}
      onUpdateForecast={updateForecast}
      onToggleEnabled={toggleEnabled}
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
