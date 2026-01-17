'use client'

import type {
  InventoryIntelligenceTab,
  DashboardSummary,
  ReplenishmentSuggestion,
  LocationReference,
  UrgencyOption,
  SalesForecast,
  SalesHistoryEntry,
  AccountForecastAdjustment,
  ForecastAdjustment,
  ShippingRoute,
  ProductReference
} from '@/../product/sections/inventory-intelligence/types'
import { DashboardView } from './DashboardView'
import { SuggestionsView } from './SuggestionsView'
import { ForecastsView } from './ForecastsView'

interface Props {
  activeTab: InventoryIntelligenceTab
  onTabChange: (tab: InventoryIntelligenceTab) => void
  dashboardSummary: DashboardSummary
  transferSuggestions: ReplenishmentSuggestion[]
  poSuggestions: ReplenishmentSuggestion[]
  locations: LocationReference[]
  routes?: ShippingRoute[]
  urgencyOptions: UrgencyOption[]
  onAcceptTransferSuggestion?: (id: string) => void
  onAcceptPOSuggestion?: (id: string) => void
  onDismissSuggestion?: (id: string, reason?: string) => void
  onSnoozeSuggestion?: (id: string, until: string) => void
  onViewSuggestionDetail?: (id: string) => void
  onRefreshSuggestions?: () => void
  // Forecasts props
  forecasts?: SalesForecast[]
  salesHistory?: SalesHistoryEntry[]
  accountForecastAdjustments?: AccountForecastAdjustment[]
  products?: ProductReference[]
  onUpdateForecast?: (id: string, updates: Partial<SalesForecast>) => void
  onToggleEnabled?: (id: string, enabled: boolean) => void
  onRecalculateForecast?: (productId: string) => void
  // Adjustment callbacks
  onAddAccountAdjustment?: (adjustment: Omit<ForecastAdjustment, 'id' | 'createdAt'>) => void
  onEditAccountAdjustment?: (id: string, adjustment: Omit<ForecastAdjustment, 'id' | 'createdAt'>) => void
  onRemoveAccountAdjustment?: (id: string) => void
}

const tabs: { id: InventoryIntelligenceTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'transfer-suggestions', label: 'Transfer Suggestions' },
  { id: 'po-suggestions', label: 'PO Suggestions' },
  { id: 'forecasts', label: 'Forecasts' },
]

export function InventoryIntelligenceView({
  activeTab,
  onTabChange,
  dashboardSummary,
  transferSuggestions,
  poSuggestions,
  locations,
  routes = [],
  urgencyOptions,
  onAcceptTransferSuggestion,
  onAcceptPOSuggestion,
  onDismissSuggestion,
  onSnoozeSuggestion,
  onViewSuggestionDetail,
  onRefreshSuggestions,
  // Forecasts props
  forecasts = [],
  salesHistory = [],
  accountForecastAdjustments = [],
  products = [],
  onUpdateForecast,
  onToggleEnabled,
  onRecalculateForecast,
  // Adjustment callbacks
  onAddAccountAdjustment,
  onEditAccountAdjustment,
  onRemoveAccountAdjustment
}: Props) {
  // Combine suggestions for dashboard top suggestions
  const allSuggestions = [...transferSuggestions, ...poSuggestions]
    .sort((a, b) => {
      const urgencyOrder = { critical: 0, warning: 1, planned: 2, monitor: 3 }
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    })
    .slice(0, 5)

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
            topSuggestions={allSuggestions}
            onViewAllSuggestions={(type) =>
              onTabChange(type === 'transfer' ? 'transfer-suggestions' : 'po-suggestions')
            }
            onAcceptSuggestion={(id, type) => {
              if (type === 'transfer') {
                onAcceptTransferSuggestion?.(id)
              } else {
                onAcceptPOSuggestion?.(id)
              }
            }}
            onRefresh={onRefreshSuggestions}
          />
        )}

        {activeTab === 'transfer-suggestions' && (
          <SuggestionsView
            suggestions={transferSuggestions}
            type="transfer"
            locations={locations}
            urgencyOptions={urgencyOptions}
            onAccept={onAcceptTransferSuggestion}
            onDismiss={onDismissSuggestion}
            onSnooze={onSnoozeSuggestion}
            onViewDetail={onViewSuggestionDetail}
          />
        )}

        {activeTab === 'po-suggestions' && (
          <SuggestionsView
            suggestions={poSuggestions}
            type="purchase-order"
            locations={locations}
            routes={routes}
            urgencyOptions={urgencyOptions}
            onAccept={onAcceptPOSuggestion}
            onDismiss={onDismissSuggestion}
            onSnooze={onSnoozeSuggestion}
            onViewDetail={onViewSuggestionDetail}
          />
        )}

        {activeTab === 'forecasts' && (
          <ForecastsView
            forecasts={forecasts}
            salesHistory={salesHistory}
            accountForecastAdjustments={accountForecastAdjustments}
            products={products}
            locations={locations}
            onUpdateForecast={onUpdateForecast}
            onToggleEnabled={onToggleEnabled}
            onRecalculateForecast={onRecalculateForecast}
            onAddAccountAdjustment={onAddAccountAdjustment}
            onEditAccountAdjustment={onEditAccountAdjustment}
            onRemoveAccountAdjustment={onRemoveAccountAdjustment}
          />
        )}
      </div>
    </div>
  )
}
