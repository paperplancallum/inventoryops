'use client'

import { useMemo } from 'react'
import { X, Truck, AlertTriangle } from 'lucide-react'
import type { Batch } from '../types'
import type { AvailableStock } from '@/sections/transfers/types'

interface BatchSelectionBarProps {
  selectedBatches: Batch[]
  availableStock: AvailableStock[]
  onInitiateTransfer: () => void
  onClearSelection: () => void
}

export function BatchSelectionBar({
  selectedBatches,
  availableStock,
  onInitiateTransfer,
  onClearSelection,
}: BatchSelectionBarProps) {
  // Get available stock for selected batches
  const selectedStock = useMemo(() => {
    const batchIds = new Set(selectedBatches.map(b => b.id))
    return availableStock.filter(s => batchIds.has(s.batchId))
  }, [selectedBatches, availableStock])

  // Calculate totals
  const totalUnits = selectedStock.reduce((sum, s) => sum + s.availableQuantity, 0)
  const totalValue = selectedStock.reduce((sum, s) => sum + s.totalValue, 0)

  // Get unique locations
  const locations = useMemo(() => {
    const locationMap = new Map<string, string>()
    selectedStock.forEach(s => {
      locationMap.set(s.locationId, s.locationName)
    })
    return Array.from(locationMap.entries()).map(([id, name]) => ({ id, name }))
  }, [selectedStock])

  const isMultiLocation = locations.length > 1
  const hasNoStock = selectedStock.length === 0 && selectedBatches.length > 0

  // Can only initiate if we have stock and it's from a single location
  const canInitiate = !isMultiLocation && selectedStock.length > 0

  if (selectedBatches.length === 0) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50">
      {/* Backdrop gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-900/20 to-transparent pointer-events-none" />

      {/* Bar */}
      <div className="relative bg-white dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Selection info */}
            <div className="flex items-center gap-6">
              {/* Clear button */}
              <button
                onClick={onClearSelection}
                className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors rounded-full hover:bg-stone-100 dark:hover:bg-stone-700"
                title="Clear selection"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Count badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-lime-100 dark:bg-lime-900/50 text-lime-600 dark:text-lime-400 text-sm font-semibold">
                  {selectedBatches.length}
                </span>
                <span className="text-sm text-stone-600 dark:text-stone-300">
                  batch{selectedBatches.length !== 1 ? 'es' : ''} selected
                </span>
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-stone-200 dark:bg-stone-600" />

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-4 text-sm">
                {hasNoStock ? (
                  <div className="text-amber-600 dark:text-amber-400">
                    No transferable stock
                  </div>
                ) : isMultiLocation ? (
                  <div>
                    <span className="text-stone-500 dark:text-stone-400">From: </span>
                    <span className="font-medium text-stone-900 dark:text-white">{locations.length} locations</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-stone-500 dark:text-stone-400">From: </span>
                    <span className="font-medium text-stone-900 dark:text-white">{locations[0]?.name || 'Unknown'}</span>
                  </div>
                )}
                {selectedStock.length > 0 && (
                  <>
                    <div>
                      <span className="text-stone-500 dark:text-stone-400">Units: </span>
                      <span className="font-medium text-lime-600 dark:text-lime-400">{totalUnits.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-stone-500 dark:text-stone-400">Value: </span>
                      <span className="font-medium text-stone-900 dark:text-white">${totalValue.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Multi-location warning */}
              {isMultiLocation && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Select batches from same location</span>
                </div>
              )}

              {/* Initiate Transfer button */}
              <button
                onClick={onInitiateTransfer}
                disabled={!canInitiate}
                className={`
                  inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm
                  ${canInitiate
                    ? 'bg-lime-600 hover:bg-lime-700 text-white'
                    : 'bg-stone-200 dark:bg-stone-600 text-stone-400 dark:text-stone-500 cursor-not-allowed'}
                `}
              >
                <Truck className="w-5 h-5" />
                <span>Create Transfer</span>
              </button>
            </div>
          </div>

          {/* Mobile multi-location warning */}
          {isMultiLocation && (
            <div className="md:hidden mt-3 flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Select batches from same location</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
