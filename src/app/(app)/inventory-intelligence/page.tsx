'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Hooks
import {
  useReplenishmentSuggestions,
  useSalesForecasts,
  useShippingRoutes,
  useSafetyStockRules,
  useIntelligenceSettings,
  useAccountForecastAdjustments,
  useLocations,
} from '@/lib/supabase/hooks'

// Components
import { InventoryIntelligenceView } from '@/sections/inventory-intelligence/components'

// Types
import type {
  InventoryIntelligenceTab,
  SuggestionType,
  ShippingRouteFormData,
  SafetyStockRuleFormData,
  ForecastAdjustmentFormData,
  ConfidenceLevel,
} from '@/sections/inventory-intelligence/types'

export default function InventoryIntelligencePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get tab from URL or default to dashboard
  const tabParam = searchParams.get('tab') as InventoryIntelligenceTab | null
  const [activeTab, setActiveTab] = useState<InventoryIntelligenceTab>(
    tabParam && ['dashboard', 'transfer-suggestions', 'po-suggestions', 'forecasts', 'settings'].includes(tabParam)
      ? tabParam
      : 'dashboard'
  )

  // ----- Hooks -----
  const {
    suggestions,
    pendingSuggestions,
    transferSuggestions,
    poSuggestions,
    dashboardSummary,
    topUrgentSuggestions,
    loading: suggestionsLoading,
    refetch: refetchSuggestions,
    acceptSuggestion,
    dismissSuggestion,
    snoozeSuggestion,
  } = useReplenishmentSuggestions()

  const {
    forecasts,
    loading: forecastsLoading,
    refetch: refetchForecasts,
    updateForecast,
    toggleEnabled: toggleForecastEnabled,
  } = useSalesForecasts()

  const {
    routes,
    activeRoutes,
    loading: routesLoading,
    createRoute,
    updateRoute,
    deleteRoute,
    toggleActive: toggleRouteActive,
    setDefaultRoute,
  } = useShippingRoutes()

  const {
    rules: safetyStockRules,
    activeRules,
    loading: rulesLoading,
    createRule: createSafetyStockRule,
    updateRule: updateSafetyStockRule,
    deleteRule: deleteSafetyStockRule,
    toggleActive: toggleRuleActive,
  } = useSafetyStockRules()

  const {
    settings,
    loading: settingsLoading,
    updateSettings,
  } = useIntelligenceSettings()

  const {
    adjustments: accountAdjustments,
    loading: adjustmentsLoading,
    createAdjustment: createAccountAdjustment,
    updateAdjustment: updateAccountAdjustment,
    deleteAdjustment: deleteAccountAdjustment,
  } = useAccountForecastAdjustments()

  const { locations, loading: locationsLoading } = useLocations()

  // ----- Computed Values -----
  const loading = suggestionsLoading || forecastsLoading || routesLoading || rulesLoading || settingsLoading || adjustmentsLoading || locationsLoading

  // Transform locations for components
  const locationOptions = useMemo(() =>
    locations.map(l => ({ id: l.id, name: l.name })),
    [locations]
  )

  // ----- Tab Navigation -----
  const handleTabChange = useCallback((tab: InventoryIntelligenceTab) => {
    setActiveTab(tab)
    // Update URL without full navigation
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    router.replace(`/inventory-intelligence?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  // ----- Dashboard Handlers -----
  const handleRefreshDashboard = useCallback(async () => {
    await Promise.all([refetchSuggestions(), refetchForecasts()])
  }, [refetchSuggestions, refetchForecasts])

  const handleViewAllSuggestions = useCallback((type: SuggestionType) => {
    if (type === 'transfer') {
      handleTabChange('transfer-suggestions')
    } else {
      handleTabChange('po-suggestions')
    }
  }, [handleTabChange])

  // ----- Suggestion Handlers -----
  const handleAcceptSuggestion = useCallback(async (suggestionId: string, type: SuggestionType, adjustedQty?: number) => {
    const suggestion = suggestions.find(s => s.id === suggestionId)
    if (!suggestion) return

    // Mark as accepted in database
    await acceptSuggestion(suggestionId)

    // Build prefill data and navigate to create form
    const quantity = adjustedQty ?? suggestion.recommendedQty

    if (type === 'transfer' && suggestion.sourceLocationId) {
      // Navigate to transfers with prefill data
      const params = new URLSearchParams()
      params.set('action', 'create')
      params.set('prefill', 'true')
      params.set('sourceLocationId', suggestion.sourceLocationId)
      params.set('destinationLocationId', suggestion.destinationLocationId)
      params.set('productId', suggestion.productId)
      params.set('sku', suggestion.sku)
      params.set('quantity', quantity.toString())
      params.set('suggestionId', suggestionId)
      if (suggestion.routeId) {
        params.set('routeId', suggestion.routeId)
      }

      router.push(`/transfers?${params.toString()}`)
    } else if (type === 'purchase-order' && suggestion.supplierId) {
      // Navigate to POs with prefill data
      const params = new URLSearchParams()
      params.set('action', 'create')
      params.set('prefill', 'true')
      params.set('supplierId', suggestion.supplierId)
      params.set('productId', suggestion.productId)
      params.set('sku', suggestion.sku)
      params.set('quantity', quantity.toString())
      params.set('suggestionId', suggestionId)

      router.push(`/purchase-orders?${params.toString()}`)
    }
  }, [suggestions, acceptSuggestion, router])

  const handleDismissSuggestion = useCallback(async (suggestionId: string, reason?: string) => {
    await dismissSuggestion(suggestionId, reason)
  }, [dismissSuggestion])

  const handleSnoozeSuggestion = useCallback(async (suggestionId: string, until: string) => {
    await snoozeSuggestion(suggestionId, until)
  }, [snoozeSuggestion])

  // ----- Forecast Handlers -----
  const handleUpdateForecast = useCallback(async (
    forecastId: string,
    updates: { dailyRate?: number; confidence?: ConfidenceLevel; manualOverride?: number | null; seasonalMultipliers?: number[] }
  ) => {
    await updateForecast(forecastId, updates)
  }, [updateForecast])

  const handleToggleForecastEnabled = useCallback(async (forecastId: string) => {
    await toggleForecastEnabled(forecastId)
  }, [toggleForecastEnabled])

  // ----- Shipping Route Handlers -----
  const handleCreateRoute = useCallback(async (data: ShippingRouteFormData) => {
    await createRoute(data)
  }, [createRoute])

  const handleUpdateRoute = useCallback(async (id: string, data: Partial<ShippingRouteFormData>) => {
    await updateRoute(id, data)
  }, [updateRoute])

  const handleDeleteRoute = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this shipping route?')) {
      await deleteRoute(id)
    }
  }, [deleteRoute])

  const handleToggleRouteActive = useCallback(async (id: string) => {
    await toggleRouteActive(id)
  }, [toggleRouteActive])

  const handleSetDefaultRoute = useCallback(async (id: string) => {
    await setDefaultRoute(id)
  }, [setDefaultRoute])

  // ----- Safety Stock Rule Handlers -----
  const handleCreateSafetyStockRule = useCallback(async (data: SafetyStockRuleFormData) => {
    await createSafetyStockRule(data)
  }, [createSafetyStockRule])

  const handleUpdateSafetyStockRule = useCallback(async (id: string, data: Partial<SafetyStockRuleFormData>) => {
    await updateSafetyStockRule(id, data)
  }, [updateSafetyStockRule])

  const handleDeleteSafetyStockRule = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this safety stock rule?')) {
      await deleteSafetyStockRule(id)
    }
  }, [deleteSafetyStockRule])

  const handleToggleSafetyStockRuleActive = useCallback(async (id: string) => {
    await toggleRuleActive(id)
  }, [toggleRuleActive])

  // ----- Account Adjustment Handlers -----
  const handleCreateAccountAdjustment = useCallback(async (data: ForecastAdjustmentFormData) => {
    await createAccountAdjustment(data)
  }, [createAccountAdjustment])

  const handleUpdateAccountAdjustment = useCallback(async (id: string, data: Partial<ForecastAdjustmentFormData>) => {
    await updateAccountAdjustment(id, data)
  }, [updateAccountAdjustment])

  const handleDeleteAccountAdjustment = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this forecast adjustment?')) {
      await deleteAccountAdjustment(id)
    }
  }, [deleteAccountAdjustment])

  // ----- Settings Handlers -----
  const handleUpdateSettings = useCallback(async (updates: Parameters<typeof updateSettings>[0]) => {
    await updateSettings(updates)
  }, [updateSettings])

  return (
    <InventoryIntelligenceView
      // Tab state
      activeTab={activeTab}
      onTabChange={handleTabChange}
      loading={loading}

      // Dashboard data
      dashboardSummary={dashboardSummary}
      topSuggestions={topUrgentSuggestions}
      onRefreshDashboard={handleRefreshDashboard}
      onViewAllSuggestions={handleViewAllSuggestions}

      // Suggestions
      transferSuggestions={transferSuggestions}
      poSuggestions={poSuggestions}
      onAcceptSuggestion={handleAcceptSuggestion}
      onDismissSuggestion={handleDismissSuggestion}
      onSnoozeSuggestion={handleSnoozeSuggestion}

      // Forecasts
      forecasts={forecasts}
      onUpdateForecast={handleUpdateForecast}
      onToggleForecastEnabled={handleToggleForecastEnabled}
      accountAdjustments={accountAdjustments}
      onCreateAccountAdjustment={handleCreateAccountAdjustment}
      onUpdateAccountAdjustment={handleUpdateAccountAdjustment}
      onDeleteAccountAdjustment={handleDeleteAccountAdjustment}

      // Settings
      settings={settings}
      onUpdateSettings={handleUpdateSettings}
      routes={routes}
      onCreateRoute={handleCreateRoute}
      onUpdateRoute={handleUpdateRoute}
      onDeleteRoute={handleDeleteRoute}
      onToggleRouteActive={handleToggleRouteActive}
      onSetDefaultRoute={handleSetDefaultRoute}
      safetyStockRules={safetyStockRules}
      onCreateSafetyStockRule={handleCreateSafetyStockRule}
      onUpdateSafetyStockRule={handleUpdateSafetyStockRule}
      onDeleteSafetyStockRule={handleDeleteSafetyStockRule}
      onToggleSafetyStockRuleActive={handleToggleSafetyStockRuleActive}

      // Reference data
      locations={locationOptions}
    />
  )
}
