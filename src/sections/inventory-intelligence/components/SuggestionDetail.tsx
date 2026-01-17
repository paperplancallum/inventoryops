'use client'

import { useState } from 'react'
import { X, Truck, ShoppingCart, Clock, MapPin } from 'lucide-react'
import type { ReplenishmentSuggestion, ShippingRouteExpanded } from '../types'
import { UrgencyBadge } from './UrgencyBadge'
import { ReasoningList } from './ReasoningList'
import { StockIndicator } from './StockIndicator'

export interface SuggestionDetailProps {
  suggestion: ReplenishmentSuggestion
  route?: ShippingRouteExpanded
  onAccept?: (adjustedQty?: number) => void
  onDismiss?: (reason?: string) => void
  onSnooze?: (until: string) => void
  onClose?: () => void
}

export function SuggestionDetail({
  suggestion,
  route,
  onAccept,
  onDismiss,
  onSnooze,
  onClose,
}: SuggestionDetailProps) {
  const [adjustedQty, setAdjustedQty] = useState(suggestion.recommendedQty)
  const [dismissReason, setDismissReason] = useState('')
  const [showDismissForm, setShowDismissForm] = useState(false)
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false)

  const handleAccept = () => {
    onAccept?.(adjustedQty !== suggestion.recommendedQty ? adjustedQty : undefined)
  }

  const handleDismiss = () => {
    onDismiss?.(dismissReason || undefined)
  }

  const handleSnooze = (days: number) => {
    const snoozeDate = new Date()
    snoozeDate.setDate(snoozeDate.getDate() + days)
    onSnooze?.(snoozeDate.toISOString())
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl dark:bg-slate-800">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 p-6 dark:border-slate-700">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <UrgencyBadge urgency={suggestion.urgency} size="lg" />
                <span className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                  {suggestion.type === 'transfer' ? (
                    <span className="inline-flex items-center gap-1">
                      <Truck className="h-4 w-4" /> Transfer Suggestion
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <ShoppingCart className="h-4 w-4" /> Purchase Order Suggestion
                    </span>
                  )}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {suggestion.productName}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                {suggestion.sku}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Current Stock Status */}
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                Current Stock at {suggestion.destinationLocationName}
              </h3>
              <StockIndicator
                current={suggestion.currentStock}
                threshold={suggestion.safetyStockThreshold}
              />
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Daily Sales Rate</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {suggestion.dailySalesRate} units/day
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Days of Stock</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {suggestion.daysOfStockRemaining} days
                  </p>
                </div>
                {suggestion.stockoutDate && (
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Projected Stockout</p>
                    <p className="font-medium text-red-600 dark:text-red-400">
                      {new Date(suggestion.stockoutDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                )}
                {suggestion.inTransitQuantity > 0 && (
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">In Transit</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {suggestion.inTransitQuantity.toLocaleString()} units
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Source/Supplier Info */}
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                {suggestion.type === 'transfer' ? 'Transfer From' : 'Order From'}
              </h3>
              {suggestion.type === 'transfer' ? (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {suggestion.sourceLocationName}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {suggestion.sourceAvailableQty?.toLocaleString()} units available
                    </p>
                    {route && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Route: {route.name} ({route.totalTransitDays.typical} days
                        {route.legs[0]?.method && ` via ${route.legs[0].method}`})
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <ShoppingCart className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {suggestion.supplierName}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Lead time: {suggestion.supplierLeadTimeDays} days
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Reasoning */}
            <div>
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                Why This Recommendation
              </h3>
              <ReasoningList items={suggestion.reasoning} />
            </div>

            {/* Quantity Adjustment */}
            <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                Recommended Quantity
              </h3>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  value={adjustedQty}
                  onChange={(e) => setAdjustedQty(parseInt(e.target.value) || 0)}
                  className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
                <span className="text-sm text-slate-500 dark:text-slate-400">units</span>
                {adjustedQty !== suggestion.recommendedQty && (
                  <button
                    onClick={() => setAdjustedQty(suggestion.recommendedQty)}
                    className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                  >
                    Reset to {suggestion.recommendedQty.toLocaleString()}
                  </button>
                )}
              </div>
              {suggestion.estimatedArrival && (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Estimated arrival:{' '}
                  {new Date(suggestion.estimatedArrival).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>

            {/* Dismiss/Snooze Forms */}
            {showDismissForm && (
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                  Dismiss Reason (Optional)
                </h3>
                <textarea
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                  placeholder="Why are you dismissing this suggestion?"
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleDismiss}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
                  >
                    Confirm Dismiss
                  </button>
                  <button
                    onClick={() => setShowDismissForm(false)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {showSnoozeOptions && (
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">
                  Snooze For
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[1, 3, 7, 14, 30].map((days) => (
                    <button
                      key={days}
                      onClick={() => handleSnooze(days)}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      {days} day{days !== 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowSnoozeOptions(false)}
                  className="mt-3 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 p-6 dark:border-slate-700">
            <div className="flex gap-2">
              {!showDismissForm && !showSnoozeOptions && (
                <>
                  <button
                    onClick={() => setShowDismissForm(true)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => setShowSnoozeOptions(true)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <Clock className="h-4 w-4 inline mr-1" />
                    Snooze
                  </button>
                </>
              )}
            </div>
            {!showDismissForm && !showSnoozeOptions && (
              <button
                onClick={handleAccept}
                className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Accept & Create {suggestion.type === 'transfer' ? 'Transfer' : 'PO'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
