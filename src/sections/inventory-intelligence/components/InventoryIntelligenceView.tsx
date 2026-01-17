'use client'

import type {
  InventoryIntelligenceTab,
  DashboardSummary,
  ReplenishmentSuggestion,
  SuggestionType,
  SalesForecast,
  AccountForecastAdjustment,
  ForecastAdjustmentFormData,
  ShippingRoute,
  SafetyStockRule,
  SafetyStockRuleFormData,
  IntelligenceSettings,
  ShippingRouteFormData,
  Location,
  ConfidenceLevel,
} from '../types'
import {
  URGENCY_OPTIONS,
  SHIPPING_METHOD_OPTIONS,
  THRESHOLD_TYPE_OPTIONS,
} from '../types'
import { DashboardView } from './DashboardView'
import { SuggestionsView } from './SuggestionsView'
import { ForecastsView } from './ForecastsView'
import { SettingsView } from './SettingsView'

interface InventoryIntelligenceViewProps {
  // Tab state
  activeTab: InventoryIntelligenceTab
  onTabChange: (tab: InventoryIntelligenceTab) => void
  loading?: boolean

  // Dashboard data
  dashboardSummary: DashboardSummary
  topSuggestions: ReplenishmentSuggestion[]
  onRefreshDashboard?: () => void
  onViewAllSuggestions?: (type: SuggestionType) => void

  // Suggestions
  transferSuggestions: ReplenishmentSuggestion[]
  poSuggestions: ReplenishmentSuggestion[]
  onAcceptSuggestion?: (id: string, type: SuggestionType, adjustedQty?: number) => void
  onDismissSuggestion?: (id: string, reason?: string) => void
  onSnoozeSuggestion?: (id: string, until: string) => void

  // Forecasts
  forecasts: SalesForecast[]
  onUpdateForecast?: (id: string, updates: { dailyRate?: number; confidence?: ConfidenceLevel; manualOverride?: number | null; seasonalMultipliers?: number[] }) => void
  onToggleForecastEnabled?: (id: string) => void
  accountAdjustments: AccountForecastAdjustment[]
  onCreateAccountAdjustment?: (data: ForecastAdjustmentFormData) => void
  onUpdateAccountAdjustment?: (id: string, data: Partial<ForecastAdjustmentFormData>) => void
  onDeleteAccountAdjustment?: (id: string) => void

  // Settings
  settings: IntelligenceSettings
  onUpdateSettings?: (updates: Partial<{
    criticalThresholdDays: number
    warningThresholdDays: number
    plannedThresholdDays: number
    autoRefreshIntervalMinutes: number
    defaultSafetyStockDays: number
    includeInTransitInCalculations: boolean
    notifyOnCritical: boolean
    notifyOnWarning: boolean
  }>) => void
  routes: ShippingRoute[]
  onCreateRoute?: (data: ShippingRouteFormData) => void
  onUpdateRoute?: (id: string, data: Partial<ShippingRouteFormData>) => void
  onDeleteRoute?: (id: string) => void
  onToggleRouteActive?: (id: string) => void
  onSetDefaultRoute?: (id: string) => void
  safetyStockRules: SafetyStockRule[]
  onCreateSafetyStockRule?: (data: SafetyStockRuleFormData) => void
  onUpdateSafetyStockRule?: (id: string, data: Partial<SafetyStockRuleFormData>) => void
  onDeleteSafetyStockRule?: (id: string) => void
  onToggleSafetyStockRuleActive?: (id: string) => void

  // Reference data
  locations: Location[]
}

const tabs: { id: InventoryIntelligenceTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'transfer-suggestions', label: 'Transfer Suggestions' },
  { id: 'po-suggestions', label: 'PO Suggestions' },
  { id: 'forecasts', label: 'Forecasts' },
  { id: 'settings', label: 'Settings' },
]

export function InventoryIntelligenceView({
  activeTab,
  onTabChange,
  loading = false,
  // Dashboard
  dashboardSummary,
  topSuggestions,
  onRefreshDashboard,
  onViewAllSuggestions,
  // Suggestions
  transferSuggestions,
  poSuggestions,
  onAcceptSuggestion,
  onDismissSuggestion,
  onSnoozeSuggestion,
  // Forecasts
  forecasts,
  onUpdateForecast,
  onToggleForecastEnabled,
  accountAdjustments,
  onCreateAccountAdjustment,
  onUpdateAccountAdjustment,
  onDeleteAccountAdjustment,
  // Settings
  settings,
  onUpdateSettings,
  routes,
  onCreateRoute,
  onUpdateRoute,
  onDeleteRoute,
  onToggleRouteActive,
  onSetDefaultRoute,
  safetyStockRules,
  onCreateSafetyStockRule,
  onUpdateSafetyStockRule,
  onDeleteSafetyStockRule,
  onToggleSafetyStockRuleActive,
  // Reference
  locations,
}: InventoryIntelligenceViewProps) {
  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Inventory Intelligence
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Smart suggestions for transfers and purchase orders based on forecasts and safety stock
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading intelligence data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Inventory Intelligence
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Smart suggestions for transfers and purchase orders based on forecasts and safety stock
          </p>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              const count =
                tab.id === 'transfer-suggestions'
                  ? transferSuggestions.length
                  : tab.id === 'po-suggestions'
                    ? poSuggestions.length
                    : undefined

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors
                    ${
                      isActive
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                    }
                  `}
                >
                  {tab.label}
                  {count !== undefined && count > 0 && (
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                        isActive
                          ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-slate-950">
        {activeTab === 'dashboard' && (
          <DashboardView
            summary={dashboardSummary}
            topSuggestions={topSuggestions}
            onViewAllSuggestions={onViewAllSuggestions}
            onAcceptSuggestion={(id, type) => {
              const suggestion = topSuggestions.find(s => s.id === id)
              onAcceptSuggestion?.(id, type, suggestion?.recommendedQty)
            }}
            onRefresh={onRefreshDashboard}
          />
        )}

        {activeTab === 'transfer-suggestions' && (
          <SuggestionsView
            suggestions={transferSuggestions}
            type="transfer"
            locations={locations}
            urgencyOptions={URGENCY_OPTIONS}
            onAccept={(id, qty) => onAcceptSuggestion?.(id, 'transfer', qty)}
            onDismiss={onDismissSuggestion}
            onSnooze={onSnoozeSuggestion}
          />
        )}

        {activeTab === 'po-suggestions' && (
          <SuggestionsView
            suggestions={poSuggestions}
            type="purchase-order"
            locations={locations}
            routes={routes}
            urgencyOptions={URGENCY_OPTIONS}
            onAccept={(id, qty) => onAcceptSuggestion?.(id, 'purchase-order', qty)}
            onDismiss={onDismissSuggestion}
            onSnooze={onSnoozeSuggestion}
          />
        )}

        {activeTab === 'forecasts' && (
          <ForecastsView
            forecasts={forecasts}
            accountAdjustments={accountAdjustments}
            onUpdateForecast={onUpdateForecast}
            onToggleEnabled={onToggleForecastEnabled}
            onAddAccountAdjustment={onCreateAccountAdjustment}
            onEditAccountAdjustment={onUpdateAccountAdjustment}
            onRemoveAccountAdjustment={onDeleteAccountAdjustment}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            routes={routes}
            locations={locations}
            shippingMethods={SHIPPING_METHOD_OPTIONS}
            safetyStockRules={safetyStockRules}
            thresholdTypes={THRESHOLD_TYPE_OPTIONS}
            accountAdjustments={accountAdjustments}
            onUpdateSettings={onUpdateSettings}
            onCreateRoute={onCreateRoute}
            onEditRoute={onUpdateRoute}
            onDeleteRoute={onDeleteRoute}
            onSetDefaultRoute={onSetDefaultRoute}
            onToggleRouteActive={onToggleRouteActive}
            onCreateSafetyRule={onCreateSafetyStockRule}
            onUpdateSafetyRule={onUpdateSafetyStockRule}
            onDeleteSafetyRule={onDeleteSafetyStockRule}
            onToggleSafetyRuleActive={onToggleSafetyStockRuleActive}
            onAddAccountAdjustment={onCreateAccountAdjustment}
            onEditAccountAdjustment={onUpdateAccountAdjustment}
            onRemoveAccountAdjustment={onDeleteAccountAdjustment}
          />
        )}
      </div>
    </div>
  )
}
