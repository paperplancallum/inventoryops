'use client'

import { useState, Fragment } from 'react'
import { Search, Filter, ChevronDown, ChevronRight, MoreHorizontal, Clock, AlertTriangle, X } from 'lucide-react'
import type { ReplenishmentSuggestion, SuggestionUrgency, SuggestionType, ShippingRoute, Location } from '../types'
import { UrgencyBadge } from './UrgencyBadge'
import { DaysRemainingBadge } from './DaysRemainingBadge'
import { ReasoningList } from './ReasoningList'
import { TransferTimeline } from './TransferTimeline'
import { POTimeline } from './POTimeline'

interface UrgencyOption {
  id: SuggestionUrgency
  label: string
}

interface SuggestionsViewProps {
  suggestions: ReplenishmentSuggestion[]
  type: SuggestionType
  locations: Location[]
  urgencyOptions: UrgencyOption[]
  routes?: ShippingRoute[]
  onAccept?: (suggestionId: string, quantity: number) => void
  onDismiss?: (suggestionId: string) => void
  onSnooze?: (suggestionId: string, snoozeUntil: string) => void
  onViewDetail?: (suggestionId: string) => void
}

export function SuggestionsView({
  suggestions,
  type,
  locations,
  urgencyOptions,
  routes,
  onAccept,
  onSnooze,
  // onDismiss and onViewDetail are defined in props but not yet implemented
  // They will be used when dismiss/detail functionality is added
}: SuggestionsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState<SuggestionUrgency[]>([])
  const [locationFilter, setLocationFilter] = useState<string>('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [adjustedQuantities, setAdjustedQuantities] = useState<Record<string, number>>({})
  const [snoozeDialog, setSnoozeDialog] = useState<{ suggestionId: string; days: number } | null>(null)

  // Get the suggestion being snoozed
  const snoozingSuggestion = snoozeDialog
    ? suggestions.find(s => s.id === snoozeDialog.suggestionId)
    : null

  // Handle snooze confirmation
  const confirmSnooze = () => {
    if (snoozeDialog) {
      const snoozeDate = new Date()
      snoozeDate.setDate(snoozeDate.getDate() + snoozeDialog.days)
      onSnooze?.(snoozeDialog.suggestionId, snoozeDate.toISOString())
      setSnoozeDialog(null)
    }
  }

  // Get the quantity for a suggestion (adjusted or recommended)
  const getQuantity = (suggestionId: string, recommendedQty: number) => {
    return adjustedQuantities[suggestionId] ?? recommendedQty
  }

  // Update adjusted quantity
  const setQuantity = (suggestionId: string, qty: number) => {
    setAdjustedQuantities(prev => ({
      ...prev,
      [suggestionId]: qty
    }))
  }

  // Filter suggestions
  const filteredSuggestions = suggestions.filter((s) => {
    const matchesSearch =
      searchQuery === '' ||
      s.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.productName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesUrgency = urgencyFilter.length === 0 || urgencyFilter.includes(s.urgency)

    const matchesLocation =
      locationFilter === '' || s.destinationLocationId === locationFilter

    return matchesSearch && matchesUrgency && matchesLocation
  })

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const toggleUrgencyFilter = (urgency: SuggestionUrgency) => {
    if (urgencyFilter.includes(urgency)) {
      setUrgencyFilter(urgencyFilter.filter((u) => u !== urgency))
    } else {
      setUrgencyFilter([...urgencyFilter, urgency])
    }
  }

  const getDestinationLocations = () => {
    const locationIds = new Set(suggestions.map((s) => s.destinationLocationId))
    return locations.filter((l) => locationIds.has(l.id))
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU or product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
            showFilters || urgencyFilter.length > 0 || locationFilter
              ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {(urgencyFilter.length > 0 || locationFilter) && (
            <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-xs text-white">
              {urgencyFilter.length + (locationFilter ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-wrap gap-6">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                Urgency
              </label>
              <div className="flex flex-wrap gap-2">
                {urgencyOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => toggleUrgencyFilter(option.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      urgencyFilter.includes(option.id)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                Destination
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white py-1.5 px-3 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                <option value="">All locations</option>
                {getDestinationLocations().map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {filteredSuggestions.length} {type === 'transfer' ? 'transfer' : 'purchase order'}{' '}
        suggestion{filteredSuggestions.length !== 1 ? 's' : ''}
      </p>

      {/* Suggestions Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:border-slate-700 dark:bg-slate-800">
        {filteredSuggestions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-500 dark:text-slate-400">
              {suggestions.length === 0
                ? `No ${type === 'transfer' ? 'transfer' : 'purchase order'} suggestions at this time.`
                : 'No suggestions match your filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                  <th className="w-8 px-4 py-3"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Urgency
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Days Left
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Recommendation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {type === 'transfer' ? 'Source' : 'Supplier'}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredSuggestions.map((suggestion) => (
                  <Fragment key={suggestion.id}>
                    <tr
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleRow(suggestion.id)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {expandedRows.has(suggestion.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <UrgencyBadge urgency={suggestion.urgency} />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">
                            {suggestion.productName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {suggestion.sku}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {suggestion.currentStock.toLocaleString()}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            @ {suggestion.destinationLocationName}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <DaysRemainingBadge
                          days={suggestion.daysOfStockRemaining}
                          stockoutDate={suggestion.stockoutDate}
                          urgency={suggestion.urgency}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {suggestion.recommendedQty.toLocaleString()} units
                          </p>
                          {suggestion.estimatedArrival && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Est. arrival:{' '}
                              {new Date(suggestion.estimatedArrival).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {type === 'transfer' ? (
                            <>
                              <p className="text-slate-900 dark:text-white">
                                {suggestion.sourceLocationName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {suggestion.sourceAvailableQty?.toLocaleString()} avail
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-slate-900 dark:text-white">
                                {suggestion.supplierName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {suggestion.supplierLeadTimeDays} days lead time
                              </p>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleRow(suggestion.id)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                          >
                            Review
                          </button>
                          <div className="relative group">
                            <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10">
                              <div className="rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                                <div className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                                  Snooze for...
                                </div>
                                <button
                                  onClick={() => setSnoozeDialog({ suggestionId: suggestion.id, days: 7 })}
                                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                  7 days
                                </button>
                                <button
                                  onClick={() => setSnoozeDialog({ suggestionId: suggestion.id, days: 14 })}
                                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                  14 days
                                </button>
                                <button
                                  onClick={() => setSnoozeDialog({ suggestionId: suggestion.id, days: 30 })}
                                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                  30 days
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded Row */}
                    {expandedRows.has(suggestion.id) && (
                      <tr>
                        <td colSpan={8} className="bg-slate-50 px-8 py-4 dark:bg-slate-800/50">
                          <div className="max-w-3xl space-y-6">
                            {/* Timeline - Transfer suggestions */}
                            {type === 'transfer' && (
                              <TransferTimeline suggestion={suggestion} />
                            )}

                            {/* Timeline - PO suggestions (includes reasoning internally) */}
                            {type === 'purchase-order' && (
                              <POTimeline suggestion={suggestion} routes={routes} />
                            )}

                            {/* Reasoning - Only for transfer suggestions (PO has reasoning in timeline) */}
                            {type === 'transfer' && (
                              <div>
                                <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                                  Reasoning
                                </h4>
                                <ReasoningList items={suggestion.reasoning} />
                              </div>
                            )}

                            {/* Action Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-slate-500 dark:text-slate-400 mr-2">Snooze:</span>
                                <button
                                  onClick={() => setSnoozeDialog({ suggestionId: suggestion.id, days: 7 })}
                                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                                >
                                  7 days
                                </button>
                                <button
                                  onClick={() => setSnoozeDialog({ suggestionId: suggestion.id, days: 14 })}
                                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                                >
                                  14 days
                                </button>
                                <button
                                  onClick={() => setSnoozeDialog({ suggestionId: suggestion.id, days: 30 })}
                                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                                >
                                  30 days
                                </button>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <label className="text-sm text-slate-600 dark:text-slate-400">
                                    Quantity:
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={getQuantity(suggestion.id, suggestion.recommendedQty)}
                                    onChange={(e) => setQuantity(suggestion.id, parseInt(e.target.value) || 0)}
                                    className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-mono text-right focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                  />
                                  <span className="text-sm text-slate-500 dark:text-slate-400">units</span>
                                </div>
                                <button
                                  onClick={() => onAccept?.(suggestion.id, getQuantity(suggestion.id, suggestion.recommendedQty))}
                                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                                >
                                  {type === 'transfer' ? 'Accept & Create Transfer' : 'Accept & Create PO'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Snooze Confirmation Dialog */}
      {snoozeDialog && snoozingSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSnoozeDialog(null)}
          />

          {/* Dialog */}
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <button
              onClick={() => setSnoozeDialog(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <Clock className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Snooze for {snoozeDialog.days} days?
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  This suggestion will reappear on{' '}
                  <strong>
                    {new Date(Date.now() + snoozeDialog.days * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </strong>
                </p>
              </div>
            </div>

            {/* Warning for critical/warning items */}
            {(snoozingSuggestion.urgency === 'critical' || snoozingSuggestion.urgency === 'warning') && (
              <div className="mt-4 flex items-start gap-3 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>{snoozingSuggestion.productName}</strong> has{' '}
                  <strong>{snoozingSuggestion.daysOfStockRemaining} days</strong> of stock remaining.
                  {snoozingSuggestion.stockoutDate && (
                    <>
                      {' '}Projected stockout:{' '}
                      <strong>
                        {new Date(snoozingSuggestion.stockoutDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </strong>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Product info */}
            <div className="mt-4 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {snoozingSuggestion.productName}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">{snoozingSuggestion.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600 dark:text-slate-400">Recommended</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {snoozingSuggestion.recommendedQty.toLocaleString()} units
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setSnoozeDialog(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmSnooze}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500"
              >
                Snooze {snoozeDialog.days} days
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
