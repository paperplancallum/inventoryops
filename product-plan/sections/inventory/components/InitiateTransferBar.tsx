import { useMemo } from 'react'
import type { Stock } from '@/../product/sections/inventory/types'

interface InitiateTransferBarProps {
  selectedCount: number
  selectedStock: Stock[]
  selectedLocationCount: number
  canInitiate: boolean
  onInitiate: () => void
  onClear: () => void
}

const TruckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const AlertIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

export function InitiateTransferBar({
  selectedCount,
  selectedStock,
  selectedLocationCount,
  canInitiate,
  onInitiate,
  onClear,
}: InitiateTransferBarProps) {
  // Calculate totals
  const totalUnits = selectedStock.reduce((sum, s) => sum + s.availableQuantity, 0)
  const totalValue = selectedStock.reduce((sum, s) => sum + s.totalValue, 0)

  // Group stock by location for display
  const locationSummary = useMemo(() => {
    const byLocation = new Map<string, { name: string; count: number; units: number }>()
    for (const stock of selectedStock) {
      const existing = byLocation.get(stock.locationId)
      if (existing) {
        existing.count++
        existing.units += stock.availableQuantity
      } else {
        byLocation.set(stock.locationId, {
          name: stock.locationName,
          count: 1,
          units: stock.availableQuantity
        })
      }
    }
    return Array.from(byLocation.values())
  }, [selectedStock])

  const isMultiLocation = selectedLocationCount > 1

  return (
    <div className="fixed bottom-0 inset-x-0 z-50">
      {/* Backdrop gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent pointer-events-none" />

      {/* Bar */}
      <div className="relative bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Selection info */}
            <div className="flex items-center gap-6">
              {/* Clear button */}
              <button
                onClick={onClear}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Clear selection"
              >
                <CloseIcon />
              </button>

              {/* Count badge */}
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
                  {selectedCount}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  stock position{selectedCount !== 1 ? 's' : ''} selected
                </span>
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-600" />

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-4 text-sm">
                {isMultiLocation ? (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">From: </span>
                    <span className="font-medium text-slate-900 dark:text-white">{selectedLocationCount} locations</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">From: </span>
                    <span className="font-medium text-slate-900 dark:text-white">{locationSummary[0]?.name || 'Unknown'}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Units: </span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{totalUnits.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Value: </span>
                  <span className="font-medium text-slate-900 dark:text-white">${totalValue.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Multi-location info */}
              {isMultiLocation && (
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg text-sm text-indigo-700 dark:text-indigo-400">
                  <AlertIcon />
                  <span>{selectedLocationCount} transfers will be created</span>
                </div>
              )}

              {/* Initiate Transfer button */}
              <button
                onClick={onInitiate}
                disabled={!canInitiate}
                className={`
                  inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm
                  ${canInitiate
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-slate-200 dark:bg-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed'}
                `}
              >
                <TruckIcon />
                <span>Initiate Transfer</span>
              </button>
            </div>
          </div>

          {/* Mobile multi-location info */}
          {isMultiLocation && (
            <div className="md:hidden mt-3 flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg text-sm text-indigo-700 dark:text-indigo-400">
              <AlertIcon />
              <span>{selectedLocationCount} transfers will be created</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
