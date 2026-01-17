'use client'

import React, { useState, useMemo } from 'react'
import { Search, Filter, ChevronDown, ChevronRight, Plus, X, Building2, TrendingUp, Ban, Calendar, LayoutList, Table2 } from 'lucide-react'
import type {
  SalesForecast,
  SalesHistoryEntry,
  AccountForecastAdjustment,
  ConfidenceLevel,
  LocationReference,
  ProductReference
} from '../types'
import { ForecastRowExpanded, ForecastAdjustmentModal, ForecastTableView } from './forecasting'
import type { ForecastGroupBy } from './forecasting'
import type { ForecastAdjustment } from './forecasting/ForecastAdjustmentModal'

const confidenceStyles: Record<ConfidenceLevel, string> = {
  high: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
}

type FilterOption = 'all' | 'enabled' | 'disabled'

export interface ForecastsViewProps {
  forecasts: SalesForecast[]
  salesHistory: SalesHistoryEntry[]
  accountForecastAdjustments?: AccountForecastAdjustment[]
  products?: ProductReference[]
  locations?: LocationReference[]
  onUpdateForecast?: (id: string, data: Partial<SalesForecast>) => void
  onToggleEnabled?: (id: string, enabled: boolean) => void
  onRecalculateForecast?: (productId: string) => void
  // Adjustment callbacks
  onAddAccountAdjustment?: (adjustment: Omit<ForecastAdjustment, 'id' | 'createdAt'>) => void
  onEditAccountAdjustment?: (id: string, adjustment: Omit<ForecastAdjustment, 'id' | 'createdAt'>) => void
  onRemoveAccountAdjustment?: (id: string) => void
}

export function ForecastsView({
  forecasts,
  salesHistory,
  accountForecastAdjustments = [],
  products: _products,
  locations: _locations,
  onUpdateForecast,
  onToggleEnabled,
  onRecalculateForecast,
  onAddAccountAdjustment,
  onEditAccountAdjustment,
  onRemoveAccountAdjustment
}: ForecastsViewProps) {
  // Suppress unused variable warnings
  void _products
  void _locations

  const [searchQuery, setSearchQuery] = useState('')
  const [filterOption, setFilterOption] = useState<FilterOption>('all')
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

  // View mode state
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart')
  const [groupBy, setGroupBy] = useState<ForecastGroupBy>('product')

  // Adjustment modal state
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [editingAdjustment, setEditingAdjustment] = useState<AccountForecastAdjustment | null>(null)

  // Calculate stats
  const stats = useMemo(() => {
    const enabled = forecasts.filter(f => f.isEnabled !== false).length
    const disabled = forecasts.length - enabled
    return { total: forecasts.length, enabled, disabled }
  }, [forecasts])

  const filteredForecasts = useMemo(() => {
    return forecasts.filter((f) => {
      // Apply search filter
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        f.sku.toLowerCase().includes(query) ||
        f.productName.toLowerCase().includes(query) ||
        f.locationName.toLowerCase().includes(query)

      if (!matchesSearch) return false

      // Apply enabled/disabled filter
      const isEnabled = f.isEnabled !== false
      if (filterOption === 'enabled' && !isEnabled) return false
      if (filterOption === 'disabled' && isEnabled) return false

      return true
    })
  }, [forecasts, searchQuery, filterOption])

  const handleToggleExpand = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id)
  }

  const handleUpdateRate = (forecastId: string, rate: number) => {
    onUpdateForecast?.(forecastId, { manualOverride: rate || null })
  }

  const handleUpdateSeasonalMultipliers = (forecastId: string, multipliers: number[]) => {
    onUpdateForecast?.(forecastId, { seasonalMultipliers: multipliers })
  }

  const handleUpdateTrendRate = (forecastId: string, rate: number) => {
    onUpdateForecast?.(forecastId, { trendRate: rate })
  }

  const handleApply = (forecastId: string) => {
    onRecalculateForecast?.(forecastId)
  }

  return (
    <div className="space-y-4">
      {/* Header with View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-slate-900 dark:text-white">Sales Forecasts</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {viewMode === 'chart'
              ? 'Click a row to expand and adjust forecast settings.'
              : 'View forecast data in tabular format with grouping options.'
            }
          </p>
        </div>

        {/* View Toggle & Grouping */}
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-0.5">
            <button
              onClick={() => setViewMode('chart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'chart'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutList className="h-4 w-4" />
              <span className="hidden sm:inline">Chart</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Table2 className="h-4 w-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {/* Grouping Dropdown (only in table mode) */}
          {viewMode === 'table' && (
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as ForecastGroupBy)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="product">Group by Product</option>
              <option value="month">Group by Month</option>
              <option value="week">Group by Week</option>
            </select>
          )}
        </div>
      </div>

      {/* Forecast Adjustments Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Forecast Adjustments
            </h3>
            <span className="text-xs text-slate-500">
              (Apply to all products)
            </span>
          </div>
          <button
            onClick={() => {
              setEditingAdjustment(null)
              setShowAdjustmentModal(true)
            }}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Adjustments affect all product forecasts. Override per-product in the expanded row below.
        </p>

        {/* Adjustments List */}
        {accountForecastAdjustments.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
            No account-wide adjustments set.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {accountForecastAdjustments.map((adjustment) => {
              const formatDateRange = (start: string, end: string) => {
                const s = new Date(start + 'T00:00:00')
                const e = new Date(end + 'T00:00:00')
                return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              }

              const formatMultiplier = (multiplier?: number | null) => {
                if (multiplier === undefined || multiplier === null) return null
                const percent = Math.round((multiplier - 1) * 100)
                if (percent > 0) return `+${percent}%`
                if (percent < 0) return `${percent}%`
                return '0%'
              }

              return (
                <div
                  key={adjustment.id}
                  className="relative p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg group"
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {adjustment.effect === 'multiply' ? (
                        <TrendingUp className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Ban className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                        {adjustment.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDateRange(adjustment.startDate, adjustment.endDate)}</span>
                        {adjustment.isRecurring && <span className="text-slate-400">(yearly)</span>}
                      </div>
                      <div className="mt-1">
                        {adjustment.effect === 'exclude' ? (
                          <span className="text-xs text-slate-500">Exclude from history</span>
                        ) : (
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                            Multiply: {formatMultiplier(adjustment.multiplier)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Actions (visible on hover) */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingAdjustment(adjustment)
                        setShowAdjustmentModal(true)
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-white dark:hover:bg-slate-700"
                      title="Edit"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onRemoveAccountAdjustment?.(adjustment.id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-white dark:hover:bg-slate-700"
                      title="Remove"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Adjustment Modal */}
      <ForecastAdjustmentModal
        isOpen={showAdjustmentModal}
        onClose={() => {
          setShowAdjustmentModal(false)
          setEditingAdjustment(null)
        }}
        onSave={(adjustment) => {
          if (editingAdjustment) {
            onEditAccountAdjustment?.(editingAdjustment.id, adjustment)
          } else {
            onAddAccountAdjustment?.(adjustment)
          }
        }}
        existingAdjustment={editingAdjustment ?? undefined}
        mode="account"
      />

      {/* Table View */}
      {viewMode === 'table' && (
        <ForecastTableView
          forecasts={filteredForecasts}
          groupBy={groupBy}
        />
      )}

      {/* Chart/List View */}
      {viewMode === 'chart' && (
        <>
          {/* Search and Filter */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by SKU, product, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={filterOption}
                onChange={(e) => setFilterOption(e.target.value as FilterOption)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">All ({stats.total})</option>
                <option value="enabled">Enabled ({stats.enabled})</option>
                <option value="disabled">Disabled ({stats.disabled})</option>
              </select>
            </div>
          </div>

          {/* Forecasts Table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-800">
            {filteredForecasts.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-500 dark:text-slate-400">
                  {forecasts.length === 0
                    ? 'No products with sales history found.'
                    : 'No forecasts match your filters.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 w-10">
                        {/* Expand icon */}
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 w-16">
                        Active
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Daily Rate
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Confidence
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Seasonal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredForecasts.map((forecast) => {
                      const isEnabled = forecast.isEnabled !== false
                      const isExpanded = expandedRowId === forecast.id
                      const hasSeasonalAdjustments = forecast.seasonalMultipliers?.some(m => m !== 1)
                      const hasTrend = forecast.trendRate !== 0

                      return (
                        <React.Fragment key={forecast.id}>
                          {/* Main Row */}
                          <tr
                            className={`cursor-pointer transition-colors ${
                              isExpanded
                                ? 'bg-slate-100 dark:bg-slate-700/50'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            } ${!isEnabled ? 'opacity-50' : ''}`}
                            onClick={() => handleToggleExpand(forecast.id)}
                          >
                            {/* Expand Icon */}
                            <td className="px-4 py-3 text-center">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-slate-400 mx-auto" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-slate-400 mx-auto" />
                              )}
                            </td>
                            {/* Toggle Switch */}
                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => onToggleEnabled?.(forecast.id, !isEnabled)}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                  isEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'
                                }`}
                                role="switch"
                                aria-checked={isEnabled}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    isEnabled ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white text-sm">
                                  {forecast.productName}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                  {forecast.sku}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                              {forecast.locationName}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium text-slate-900 dark:text-white">
                                  {forecast.manualOverride ?? forecast.dailyRate}
                                </span>
                                <span className="text-xs text-slate-500">units/day</span>
                                {forecast.manualOverride && (
                                  <span className="text-xs text-indigo-600 dark:text-indigo-400">(override)</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                                  confidenceStyles[forecast.confidence]
                                }`}
                              >
                                {forecast.confidence}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                {hasSeasonalAdjustments && (
                                  <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                                    Seasonal
                                  </span>
                                )}
                                {hasTrend && (
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                    forecast.trendRate > 0
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  }`}>
                                    {forecast.trendRate > 0 ? '+' : ''}{(forecast.trendRate * 100).toFixed(0)}%
                                  </span>
                                )}
                                {!hasSeasonalAdjustments && !hasTrend && (
                                  <span className="text-xs text-slate-400">Flat</span>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Row */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={7} className="p-0">
                                <ForecastRowExpanded
                                  forecast={forecast}
                                  salesHistory={salesHistory}
                                  accountForecastAdjustments={accountForecastAdjustments}
                                  onClose={() => setExpandedRowId(null)}
                                  onUpdateRate={(rate) => handleUpdateRate(forecast.id, rate)}
                                  onUpdateSeasonalMultipliers={(multipliers) => handleUpdateSeasonalMultipliers(forecast.id, multipliers)}
                                  onUpdateTrendRate={(rate) => handleUpdateTrendRate(forecast.id, rate)}
                                  onApply={() => handleApply(forecast.id)}
                                />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Summary Footer */}
          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>
              {stats.total} products • {stats.enabled} enabled • {stats.disabled} disabled
            </span>
            {stats.disabled > 0 && filterOption !== 'disabled' && (
              <button
                onClick={() => setFilterOption('disabled')}
                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                Show disabled
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
