'use client'

import * as React from 'react'
import {
  X,
  Plus,
  Building2,
  RotateCcw,
  TrendingUp,
  Ban,
  Edit2,
  ChevronDown,
  Calendar
} from 'lucide-react'
import type {
  AccountForecastAdjustment,
  ProductForecastAdjustment
} from '@/../product/sections/inventory-intelligence/types'

export interface ForecastAdjustmentsListProps {
  accountAdjustments: AccountForecastAdjustment[]
  productAdjustments: ProductForecastAdjustment[]
  onAddProductAdjustment: () => void
  onEditProductAdjustment: (adjustment: ProductForecastAdjustment) => void
  onRemoveProductAdjustment: (id: string) => void
  onOverrideAccountAdjustment: (accountAdjustment: AccountForecastAdjustment) => void
  onOptOutAccountAdjustment: (accountAdjustmentId: string) => void
  onOptInAccountAdjustment: (accountAdjustmentId: string) => void
  maxVisible?: number
}

export function ForecastAdjustmentsList({
  accountAdjustments,
  productAdjustments,
  onAddProductAdjustment,
  onEditProductAdjustment,
  onRemoveProductAdjustment,
  onOverrideAccountAdjustment,
  onOptOutAccountAdjustment,
  onOptInAccountAdjustment,
  maxVisible = 5
}: ForecastAdjustmentsListProps) {
  const [showAll, setShowAll] = React.useState(false)

  // Split adjustments into active and opted-out
  const optedOutIds = productAdjustments
    .filter(pa => pa.isOptedOut && pa.accountAdjustmentId)
    .map(pa => pa.accountAdjustmentId!)

  const activeAccountAdjustments = accountAdjustments.filter(
    aa => !optedOutIds.includes(aa.id)
  )
  const optedOutAccountAdjustments = accountAdjustments.filter(
    aa => optedOutIds.includes(aa.id)
  )

  // Product-specific adjustments (not overrides)
  const productOnlyAdjustments = productAdjustments.filter(
    pa => !pa.accountAdjustmentId || pa.multiplier !== undefined
  )

  // Override adjustments (product overriding account)
  const overrideAdjustments = productAdjustments.filter(
    pa => pa.accountAdjustmentId && !pa.isOptedOut && pa.multiplier !== undefined
  )

  const totalCount =
    activeAccountAdjustments.length +
    productOnlyAdjustments.length +
    optedOutAccountAdjustments.length

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T00:00:00')
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${startStr} - ${endStr}`
  }

  const formatMultiplier = (multiplier?: number) => {
    if (multiplier === undefined) return null
    const percent = Math.round((multiplier - 1) * 100)
    if (percent > 0) return `+${percent}%`
    if (percent < 0) return `${percent}%`
    return '0%'
  }

  // Build list of all items for display
  type ListItem =
    | { type: 'account'; data: AccountForecastAdjustment; override?: ProductForecastAdjustment }
    | { type: 'product'; data: ProductForecastAdjustment }
    | { type: 'opted-out'; data: AccountForecastAdjustment }

  const allItems: ListItem[] = [
    // Active account adjustments (with potential overrides)
    ...activeAccountAdjustments.map(aa => {
      const override = overrideAdjustments.find(pa => pa.accountAdjustmentId === aa.id)
      return { type: 'account' as const, data: aa, override }
    }),
    // Product-only adjustments
    ...productOnlyAdjustments
      .filter(pa => !pa.accountAdjustmentId)
      .map(pa => ({ type: 'product' as const, data: pa })),
    // Opted-out account adjustments
    ...optedOutAccountAdjustments.map(aa => ({ type: 'opted-out' as const, data: aa }))
  ]

  const visibleItems = showAll ? allItems : allItems.slice(0, maxVisible)
  const hiddenCount = allItems.length - maxVisible

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Forecast Adjustments ({totalCount})
        </h4>
        <button
          onClick={onAddProductAdjustment}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {/* List */}
      {totalCount === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
          No forecast adjustments
        </p>
      ) : (
        <div className="space-y-1.5">
          {visibleItems.map((item, _index) => {
            if (item.type === 'account') {
              const adjustment = item.data
              const override = item.override
              const effectiveMultiplier = override?.multiplier ?? adjustment.multiplier

              return (
                <div
                  key={`account-${adjustment.id}`}
                  className="px-3 py-2 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-md border border-indigo-200/50 dark:border-indigo-800/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="mt-0.5">
                        {adjustment.effect === 'multiply' ? (
                          <TrendingUp className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Ban className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                            {adjustment.name}
                          </span>
                          <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            Account
                          </span>
                          {override && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              Overridden
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDateRange(adjustment.startDate, adjustment.endDate)}</span>
                          {adjustment.isRecurring && <span className="text-slate-400">(yearly)</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {adjustment.effect === 'exclude' ? (
                            <span className="text-xs text-slate-500">
                              Exclude from history
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                              {override ? (
                                <>
                                  <span className="line-through text-slate-400 mr-1">
                                    {formatMultiplier(adjustment.multiplier)}
                                  </span>
                                  {formatMultiplier(effectiveMultiplier)}
                                </>
                              ) : (
                                formatMultiplier(effectiveMultiplier)
                              )}
                            </span>
                          )}
                        </div>
                        {adjustment.notes && (
                          <p className="text-xs text-slate-500 mt-1 truncate">{adjustment.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {adjustment.effect === 'multiply' && (
                        <button
                          onClick={() => onOverrideAccountAdjustment(adjustment)}
                          className="px-2 py-1 text-[10px] text-slate-500 hover:text-indigo-600 border border-slate-200 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                          title="Override multiplier for this product"
                        >
                          {override ? 'Edit' : 'Override'}
                        </button>
                      )}
                      <button
                        onClick={() => onOptOutAccountAdjustment(adjustment.id)}
                        className="px-2 py-1 text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Don't apply this adjustment to this product"
                      >
                        Opt Out
                      </button>
                    </div>
                  </div>
                </div>
              )
            } else if (item.type === 'opted-out') {
              const adjustment = item.data
              return (
                <div
                  key={`opted-out-${adjustment.id}`}
                  className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/30 rounded-md border border-dashed border-slate-300 dark:border-slate-600 opacity-60"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 line-through">
                          {adjustment.name}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                          Opted Out
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {formatDateRange(adjustment.startDate, adjustment.endDate)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onOptInAccountAdjustment(adjustment.id)}
                    className="p-1 text-slate-400 hover:text-indigo-500 rounded"
                    title="Re-enable this adjustment"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              )
            } else {
              // Product-specific adjustment
              const adjustment = item.data
              return (
                <div
                  key={adjustment.id}
                  className="px-3 py-2 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="mt-0.5">
                        {adjustment.effect === 'multiply' ? (
                          <TrendingUp className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Ban className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                          {adjustment.name}
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDateRange(adjustment.startDate, adjustment.endDate)}</span>
                          {adjustment.isRecurring && <span className="text-slate-400">(yearly)</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {adjustment.effect === 'exclude' ? (
                            <span className="text-xs text-slate-500">
                              Exclude from history
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                              {formatMultiplier(adjustment.multiplier)}
                            </span>
                          )}
                        </div>
                        {adjustment.notes && (
                          <p className="text-xs text-slate-500 mt-1 truncate">{adjustment.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => onEditProductAdjustment(adjustment)}
                        className="p-1 text-slate-400 hover:text-indigo-500 rounded"
                        title="Edit adjustment"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onRemoveProductAdjustment(adjustment.id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded"
                        title="Remove adjustment"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            }
          })}

          {!showAll && hiddenCount > 0 && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full py-2 text-xs text-indigo-600 hover:text-indigo-700 flex items-center justify-center gap-1"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Show {hiddenCount} more
            </button>
          )}

          {showAll && hiddenCount > 0 && (
            <button
              onClick={() => setShowAll(false)}
              className="w-full py-2 text-xs text-indigo-600 hover:text-indigo-700"
            >
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  )
}
