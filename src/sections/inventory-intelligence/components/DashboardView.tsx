'use client'

import { RefreshCw, ArrowRight, Package, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import type { DashboardSummary, ReplenishmentSuggestion, SuggestionType } from '../types'
import { UrgencyBadge } from './UrgencyBadge'

export interface DashboardViewProps {
  summary: DashboardSummary
  topSuggestions: ReplenishmentSuggestion[]
  onViewAllSuggestions?: (type: SuggestionType) => void
  onAcceptSuggestion?: (id: string, type: SuggestionType) => void
  onRefresh?: () => void
}

export function DashboardView({
  summary,
  topSuggestions,
  onViewAllSuggestions,
  onAcceptSuggestion,
  onRefresh,
}: DashboardViewProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const totalUrgency =
    summary.urgencyCounts.critical +
    summary.urgencyCounts.warning +
    summary.urgencyCounts.planned +
    summary.urgencyCounts.monitor

  const getUrgencyWidth = (count: number) => {
    if (totalUrgency === 0) return '0%'
    return `${(count / totalUrgency) * 100}%`
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Last calculated: {formatDate(summary.lastCalculatedAt)}
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30">
              <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total SKUs</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                {summary.totalActiveProducts}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm dark:border-red-900/50 dark:bg-red-900/20">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/50">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-red-600 dark:text-red-400">Critical Alerts</p>
              <p className="text-2xl font-semibold text-red-700 dark:text-red-300">
                {summary.urgencyCounts.critical}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/30">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Pending Actions</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                {summary.totalSuggestions}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Healthy Products</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                {summary.urgencyCounts.monitor}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Urgency Distribution */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">
          Urgency Distribution
        </h3>
        <div className="h-4 flex rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
          {summary.urgencyCounts.critical > 0 && (
            <div
              className="bg-red-500 transition-all"
              style={{ width: getUrgencyWidth(summary.urgencyCounts.critical) }}
              title={`Critical: ${summary.urgencyCounts.critical}`}
            />
          )}
          {summary.urgencyCounts.warning > 0 && (
            <div
              className="bg-amber-500 transition-all"
              style={{ width: getUrgencyWidth(summary.urgencyCounts.warning) }}
              title={`Warning: ${summary.urgencyCounts.warning}`}
            />
          )}
          {summary.urgencyCounts.planned > 0 && (
            <div
              className="bg-indigo-500 transition-all"
              style={{ width: getUrgencyWidth(summary.urgencyCounts.planned) }}
              title={`Planned: ${summary.urgencyCounts.planned}`}
            />
          )}
          {summary.urgencyCounts.monitor > 0 && (
            <div
              className="bg-slate-400 transition-all"
              style={{ width: getUrgencyWidth(summary.urgencyCounts.monitor) }}
              title={`Monitor: ${summary.urgencyCounts.monitor}`}
            />
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-slate-600 dark:text-slate-400">
              Critical ({summary.urgencyCounts.critical})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            <span className="text-slate-600 dark:text-slate-400">
              Warning ({summary.urgencyCounts.warning})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-indigo-500" />
            <span className="text-slate-600 dark:text-slate-400">
              Planned ({summary.urgencyCounts.planned})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">
              Monitor ({summary.urgencyCounts.monitor})
            </span>
          </div>
        </div>
      </div>

      {/* Two-column layout for Location Health and Top Suggestions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Location Health */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">
            Location Health
          </h3>
          <div className="space-y-3">
            {summary.locationHealth.map((location) => (
              <div
                key={location.locationId}
                className="flex items-center justify-between rounded-lg border border-slate-100 p-3 dark:border-slate-700"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-sm">
                    {location.locationName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {location.totalProducts} products
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {location.criticalCount > 0 && (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      {location.criticalCount} critical
                    </span>
                  )}
                  {location.warningCount > 0 && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {location.warningCount} warning
                    </span>
                  )}
                  {location.criticalCount === 0 && location.warningCount === 0 && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Healthy
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Suggestions */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-900 dark:text-white">
              Top Urgent Suggestions
            </h3>
            <button
              onClick={() => onViewAllSuggestions?.('transfer')}
              className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 inline-flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {topSuggestions.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                No pending suggestions. All inventory levels are healthy!
              </p>
            ) : (
              topSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="flex items-start justify-between rounded-lg border border-slate-100 p-3 dark:border-slate-700"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <UrgencyBadge urgency={suggestion.urgency} size="sm" />
                      <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {suggestion.type === 'transfer' ? 'Transfer' : 'PO'}
                      </span>
                    </div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                      {suggestion.productName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {suggestion.sku}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>{suggestion.currentStock.toLocaleString()} units</span>
                      <span>|</span>
                      <span>{suggestion.daysOfStockRemaining} days left</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onAcceptSuggestion?.(suggestion.id, suggestion.type)}
                    className="ml-3 shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                  >
                    {suggestion.type === 'transfer' ? 'Create Transfer' : 'Create PO'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
