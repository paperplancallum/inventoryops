import { useState, useMemo } from 'react'
import { X, Search, Plus, Check, Package } from 'lucide-react'
import type { AmazonInventoryItem, AmazonCondition } from '@/../product/sections/inventory/types'

// Simplified internal SKU type for the modal
export interface InternalSkuOption {
  skuId: string
  sku: string
  productId: string
  productName: string
  asin?: string
  condition?: string
}

interface AmazonSkuMappingModalProps {
  item: AmazonInventoryItem
  internalSkus: InternalSkuOption[]
  onClose: () => void
  onMap: (amazonSellerSku: string, internalSkuId: string, internalProductId: string) => void
  onCreateNewSku?: () => void
}

const conditionLabels: Record<AmazonCondition, string> = {
  New: 'New',
  Refurbished: 'Refurbished',
  UsedLikeNew: 'Used - Like New',
  UsedVeryGood: 'Used - Very Good',
  UsedGood: 'Used - Good',
  UsedAcceptable: 'Used - Acceptable',
}

export function AmazonSkuMappingModal({
  item,
  internalSkus,
  onClose,
  onMap,
  onCreateNewSku,
}: AmazonSkuMappingModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSku, setSelectedSku] = useState<InternalSkuOption | null>(null)

  // Filter and sort SKUs - prioritize matching ASINs
  const filteredSkus = useMemo(() => {
    const q = searchQuery.toLowerCase()

    // Filter by search query
    const filtered = internalSkus.filter((sku) => {
      if (!searchQuery) return true
      return (
        sku.sku.toLowerCase().includes(q) ||
        sku.productName.toLowerCase().includes(q) ||
        (sku.asin?.toLowerCase().includes(q) ?? false)
      )
    })

    // Sort: matching ASINs first, then by name
    return filtered.sort((a, b) => {
      const aMatchesAsin = a.asin === item.asin
      const bMatchesAsin = b.asin === item.asin
      if (aMatchesAsin && !bMatchesAsin) return -1
      if (!aMatchesAsin && bMatchesAsin) return 1
      return a.productName.localeCompare(b.productName)
    })
  }, [internalSkus, searchQuery, item.asin])

  // Find suggested matches (same ASIN)
  const suggestedMatches = useMemo(() => {
    return internalSkus.filter((sku) => sku.asin === item.asin)
  }, [internalSkus, item.asin])

  const handleConfirm = () => {
    if (selectedSku) {
      onMap(item.sellerSku, selectedSku.skuId, selectedSku.productId)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white dark:bg-stone-800 rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-700">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
              Link Amazon SKU to Catalog
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Amazon Item Info */}
          <div className="px-6 py-4 bg-stone-50 dark:bg-stone-700/50 border-b border-stone-200 dark:border-stone-700">
            <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
              Amazon Item
            </p>
            <p className="text-sm font-medium text-stone-900 dark:text-white">
              {item.productName}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone-600 dark:text-stone-400">
              <span className="font-mono">ASIN: {item.asin}</span>
              {item.fnsku && <span className="font-mono">FNSKU: {item.fnsku}</span>}
              <span className="font-mono">SKU: {item.sellerSku}</span>
              <span className="px-2 py-0.5 bg-stone-200 dark:bg-stone-600 rounded">
                {conditionLabels[item.condition]}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {/* Search */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-stone-400" />
              </div>
              <input
                type="text"
                placeholder="Search catalog SKUs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Suggested Matches */}
            {suggestedMatches.length > 0 && !searchQuery && (
              <div className="mb-4">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2">
                  Suggested Matches (Same ASIN)
                </p>
                <div className="space-y-2">
                  {suggestedMatches.map((sku) => (
                    <button
                      key={sku.skuId}
                      onClick={() => setSelectedSku(sku)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                        selectedSku?.skuId === sku.skuId
                          ? 'border-lime-500 bg-lime-50 dark:bg-lime-900/20'
                          : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                      }`}
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 dark:text-white truncate">
                          {sku.productName}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                          {sku.sku}
                        </p>
                      </div>
                      {selectedSku?.skuId === sku.skuId && (
                        <Check className="w-5 h-5 text-lime-600 dark:text-lime-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* All SKUs */}
            <div>
              {suggestedMatches.length > 0 && !searchQuery && (
                <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
                  All Catalog SKUs
                </p>
              )}
              {filteredSkus.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    {searchQuery ? 'No SKUs match your search' : 'No catalog SKUs available'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSkus
                    .filter((sku) => !suggestedMatches.includes(sku) || searchQuery)
                    .map((sku) => (
                      <button
                        key={sku.skuId}
                        onClick={() => setSelectedSku(sku)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                          selectedSku?.skuId === sku.skuId
                            ? 'border-lime-500 bg-lime-50 dark:bg-lime-900/20'
                            : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700/50'
                        }`}
                      >
                        <div className="flex-shrink-0 w-10 h-10 bg-stone-100 dark:bg-stone-700 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-stone-500 dark:text-stone-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-stone-900 dark:text-white truncate">
                            {sku.productName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                              {sku.sku}
                            </span>
                            {sku.asin === item.asin && (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                ASIN match
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedSku?.skuId === sku.skuId && (
                          <Check className="w-5 h-5 text-lime-600 dark:text-lime-400 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-700/50">
            {onCreateNewSku ? (
              <button
                onClick={onCreateNewSku}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300"
              >
                <Plus className="w-4 h-4" />
                Create New SKU
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedSku}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedSku
                    ? 'bg-lime-600 hover:bg-lime-700 text-white'
                    : 'bg-stone-200 dark:bg-stone-700 text-stone-400 dark:text-stone-500 cursor-not-allowed'
                }`}
              >
                Link SKU
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
