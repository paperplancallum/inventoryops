'use client'

import * as React from 'react'
import { X, TrendingUp, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react'
import type {
  SalesForecast,
  SalesHistoryEntry,
  AccountForecastAdjustment,
  ProductForecastAdjustment
} from '@/../product/sections/inventory-intelligence/types'
import { SimpleForecastChart } from './SimpleForecastChart'
import { ForecastAdjustmentsList } from './ForecastAdjustmentsList'
import { ForecastAdjustmentModal } from './ForecastAdjustmentModal'

export interface ForecastRowExpandedProps {
  forecast: SalesForecast
  salesHistory: SalesHistoryEntry[]
  accountForecastAdjustments?: AccountForecastAdjustment[]
  onClose: () => void
  onUpdateRate: (rate: number) => void
  onUpdateSeasonalMultipliers: (multipliers: number[]) => void
  onUpdateTrendRate: (rate: number) => void
  onAddProductAdjustment?: (adjustment: ProductForecastAdjustment) => void
  onEditProductAdjustment?: (adjustment: ProductForecastAdjustment) => void
  onRemoveProductAdjustment?: (id: string) => void
  onOptOutAccountAdjustment?: (accountAdjustmentId: string) => void
  onOptInAccountAdjustment?: (accountAdjustmentId: string) => void
  onOverrideAccountAdjustment?: (accountAdjustment: AccountForecastAdjustment, override: ProductForecastAdjustment) => void
  onApply: () => void
}

const confidenceConfig = {
  high: {
    label: 'High',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    icon: CheckCircle
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    icon: TrendingUp
  },
  low: {
    label: 'Low',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
    icon: AlertCircle
  }
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DEFAULT_MULTIPLIERS = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]

export function ForecastRowExpanded({
  forecast,
  salesHistory,
  accountForecastAdjustments = [],
  onClose,
  onUpdateRate,
  onUpdateSeasonalMultipliers,
  onUpdateTrendRate,
  onAddProductAdjustment,
  onEditProductAdjustment,
  onRemoveProductAdjustment,
  onOptOutAccountAdjustment,
  onOptInAccountAdjustment,
  onOverrideAccountAdjustment,
  onApply
}: ForecastRowExpandedProps) {
  const [overrideRate, setOverrideRate] = React.useState<string>(
    forecast.manualOverride?.toString() ?? ''
  )
  const [seasonalMultipliers, setSeasonalMultipliers] = React.useState<number[]>(
    forecast.seasonalMultipliers?.length === 12 ? forecast.seasonalMultipliers : DEFAULT_MULTIPLIERS
  )
  const [trendRate, setTrendRate] = React.useState<number>(forecast.trendRate ?? 0)
  const [hasChanges, setHasChanges] = React.useState(false)

  // Adjustment modal state
  const [showAdjustmentModal, setShowAdjustmentModal] = React.useState(false)
  const [editingAdjustment, setEditingAdjustment] = React.useState<ProductForecastAdjustment | null>(null)
  const [overridingAccountAdjustment, setOverridingAccountAdjustment] = React.useState<AccountForecastAdjustment | null>(null)

  // Filter history for this product
  const productHistory = salesHistory.filter(h => h.productId === forecast.productId)

  // Get product adjustments from forecast
  const productAdjustments = forecast.productAdjustments || []

  const displayRate = overrideRate ? parseFloat(overrideRate) : forecast.dailyRate
  const confidenceInfo = confidenceConfig[forecast.confidence]
  const ConfidenceIcon = confidenceInfo.icon

  const handleOverrideChange = (value: string) => {
    setOverrideRate(value)
    setHasChanges(true)
  }

  const handleSeasonalChange = (monthIndex: number, value: string) => {
    const parsed = parseFloat(value)
    if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 2.0) {
      const newMultipliers = [...seasonalMultipliers]
      newMultipliers[monthIndex] = parsed
      setSeasonalMultipliers(newMultipliers)
      setHasChanges(true)
    }
  }

  const handleTrendChange = (value: string) => {
    const parsed = parseFloat(value)
    if (!isNaN(parsed)) {
      setTrendRate(parsed / 100) // Convert from percentage to decimal
      setHasChanges(true)
    }
  }

  const handleResetSeasonal = () => {
    setSeasonalMultipliers(DEFAULT_MULTIPLIERS)
    setHasChanges(true)
  }

  const handleApply = () => {
    if (overrideRate) {
      onUpdateRate(parseFloat(overrideRate))
    }
    onUpdateSeasonalMultipliers(seasonalMultipliers)
    onUpdateTrendRate(trendRate)
    onApply()
    setHasChanges(false)
  }

  const handleClearOverride = () => {
    setOverrideRate('')
    onUpdateRate(0) // 0 or null to clear override
    setHasChanges(true)
  }

  // Check if seasonal is non-flat
  const isSeasonalFlat = seasonalMultipliers.every(m => m === 1)

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border-x border-b border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h3 className="font-medium text-slate-900 dark:text-white">
            {forecast.productName}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {forecast.sku} @ {forecast.locationName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Chart */}
        <SimpleForecastChart
          salesHistory={productHistory}
          forecastDailyRate={displayRate}
          seasonalMultipliers={seasonalMultipliers}
          trendRate={trendRate}
          height={220}
        />

        {/* Stats Row */}
        <div className="flex items-center gap-6 py-3 px-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Base Rate</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              {displayRate.toFixed(1)} <span className="text-sm font-normal text-slate-500">units/day</span>
            </p>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Confidence</p>
            <div className="flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm font-medium ${confidenceInfo.bg} ${confidenceInfo.color}`}>
                <ConfidenceIcon className="h-3.5 w-3.5" />
                {confidenceInfo.label}
              </span>
              {forecast.accuracyMAPE && (
                <span className="text-sm text-slate-500">
                  ({forecast.accuracyMAPE.toFixed(1)}% error)
                </span>
              )}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Trend</p>
            <p className={`text-sm font-medium ${trendRate > 0 ? 'text-emerald-600' : trendRate < 0 ? 'text-red-600' : 'text-slate-500'}`}>
              {trendRate > 0 ? '+' : ''}{(trendRate * 100).toFixed(1)}%/mo
            </p>
          </div>
          {!isSeasonalFlat && (
            <>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Seasonal</p>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  Active
                </p>
              </div>
            </>
          )}
        </div>

        {/* Seasonal Adjustments */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Seasonal Adjustments
            </h4>
            <button
              onClick={handleResetSeasonal}
              disabled={isSeasonalFlat}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to Flat
            </button>
          </div>
          <div className="grid grid-cols-6 lg:grid-cols-12 gap-2">
            {MONTH_LABELS.map((month, i) => (
              <div key={month} className="text-center">
                <label className="block text-[10px] text-slate-500 mb-1">{month}</label>
                <input
                  type="number"
                  value={seasonalMultipliers[i].toFixed(1)}
                  onChange={(e) => handleSeasonalChange(i, e.target.value)}
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  className={`w-full px-1.5 py-1.5 text-xs text-center border rounded-md
                    ${seasonalMultipliers[i] !== 1
                      ? 'border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                    }
                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Adjust for seasonal patterns. 1.0 = normal, 1.5 = 50% more demand, 0.5 = 50% less demand.
          </p>
        </div>

        {/* Two Column Layout: Adjustments + Override/Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Forecast Adjustments */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <ForecastAdjustmentsList
              accountAdjustments={accountForecastAdjustments}
              productAdjustments={productAdjustments}
              onAddProductAdjustment={() => {
                setEditingAdjustment(null)
                setOverridingAccountAdjustment(null)
                setShowAdjustmentModal(true)
              }}
              onEditProductAdjustment={(adjustment) => {
                setEditingAdjustment(adjustment)
                setOverridingAccountAdjustment(null)
                setShowAdjustmentModal(true)
              }}
              onRemoveProductAdjustment={(id) => onRemoveProductAdjustment?.(id)}
              onOverrideAccountAdjustment={(accountAdj) => {
                setEditingAdjustment(null)
                setOverridingAccountAdjustment(accountAdj)
                setShowAdjustmentModal(true)
              }}
              onOptOutAccountAdjustment={(id) => onOptOutAccountAdjustment?.(id)}
              onOptInAccountAdjustment={(id) => onOptInAccountAdjustment?.(id)}
              maxVisible={5}
            />
          </div>

          {/* Override and Trend Column */}
          <div className="space-y-4">
            {/* Override Rate */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Override Base Rate
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Custom daily rate (leave empty to use calculated)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={overrideRate}
                      onChange={(e) => handleOverrideChange(e.target.value)}
                      placeholder={forecast.dailyRate.toFixed(1)}
                      min="0"
                      step="0.1"
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {overrideRate && (
                      <button
                        onClick={handleClearOverride}
                        className="px-3 py-2 text-sm text-slate-600 hover:text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Override the calculated base rate if you have additional knowledge about demand.
                </p>
              </div>
            </div>

            {/* Trend Rate */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Monthly Trend
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Growth rate per month (%)
                  </label>
                  <input
                    type="number"
                    value={(trendRate * 100).toFixed(1)}
                    onChange={(e) => handleTrendChange(e.target.value)}
                    min="-20"
                    max="20"
                    step="0.5"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Apply a compound growth/decline rate. E.g., 2% means each month increases 2% from the previous.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleApply}
            disabled={!hasChanges}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Apply Changes
          </button>
        </div>
      </div>

      {/* Product Adjustment Modal */}
      <ForecastAdjustmentModal
        isOpen={showAdjustmentModal}
        onClose={() => {
          setShowAdjustmentModal(false)
          setEditingAdjustment(null)
          setOverridingAccountAdjustment(null)
        }}
        onSave={(adjustment) => {
          if (overridingAccountAdjustment) {
            // Creating an override for an account adjustment
            const override: ProductForecastAdjustment = {
              id: `pfa-${Date.now()}`,
              productId: forecast.productId,
              accountAdjustmentId: overridingAccountAdjustment.id,
              ...adjustment,
              createdAt: new Date().toISOString()
            }
            onOverrideAccountAdjustment?.(overridingAccountAdjustment, override)
          } else if (editingAdjustment) {
            // Editing existing adjustment
            onEditProductAdjustment?.({
              ...editingAdjustment,
              ...adjustment
            })
          } else {
            // Adding new product-specific adjustment
            onAddProductAdjustment?.({
              id: `pfa-${Date.now()}`,
              productId: forecast.productId,
              ...adjustment,
              createdAt: new Date().toISOString()
            })
          }
        }}
        existingAdjustment={editingAdjustment ?? overridingAccountAdjustment ?? undefined}
        mode="product"
        productId={forecast.productId}
      />
    </div>
  )
}
