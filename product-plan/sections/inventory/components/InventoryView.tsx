import { useState, useMemo } from 'react'
import type { InventoryProps, AmazonInventoryItem, Brand } from '@/../product/sections/inventory/types'
import { ProductTable } from './ProductTable'
import { LocationTable } from './LocationTable'
import { InitiateTransferBar } from './InitiateTransferBar'
import { AmazonInventoryTable } from './AmazonInventoryTable'
import { AmazonSkuMappingModal } from './AmazonSkuMappingModal'
import type { InternalSkuOption } from './AmazonSkuMappingModal'
import type { SyncStatus } from './AmazonSyncStatus'
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox'

// Icons
const SearchIcon = () => (
  <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const ProductIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const AmazonIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
  </svg>
)

type TabMode = 'product' | 'location' | 'amazon'

interface InventoryViewProps extends InventoryProps {
  brands?: Brand[]
}

export function InventoryView({
  stock = [],
  amazonInventory = [],
  amazonSummary,
  brands = [],
  onInitiateTransfer,
  onSyncAmazonInventory,
  onMapSku,
  onUnmapSku,
  onViewAmazonItem,
}: InventoryViewProps) {
  const [activeTab, setActiveTab] = useState<TabMode>('product')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStockIds, setSelectedStockIds] = useState<string[]>([])
  const [amazonSyncStatus, setAmazonSyncStatus] = useState<SyncStatus>('idle')
  const [mappingModalItem, setMappingModalItem] = useState<AmazonInventoryItem | null>(null)
  const [brandFilters, setBrandFilters] = useState<string[]>([])

  // Calculate summary stats
  const totalStockValue = stock.reduce((sum, s) => sum + s.totalValue, 0)
  const totalAvailableUnits = stock.reduce((sum, s) => sum + s.availableQuantity, 0)
  const totalReservedUnits = stock.reduce((sum, s) => sum + s.reservedQuantity, 0)

  // Get unique products count
  const uniqueProducts = useMemo(() => {
    const skus = new Set(stock.map(s => s.sku))
    return skus.size
  }, [stock])

  // Get unique locations count
  const uniqueLocations = useMemo(() => {
    const locationIds = new Set(stock.map(s => s.locationId))
    return locationIds.size
  }, [stock])

  // Filter stock by brand
  const filteredStock = useMemo(() => {
    if (brandFilters.length === 0) return stock
    return stock.filter(s => brandFilters.includes(s.brandId || ''))
  }, [stock, brandFilters])

  // Filter Amazon inventory by brand
  const filteredAmazonInventory = useMemo(() => {
    if (brandFilters.length === 0) return amazonInventory
    return amazonInventory.filter(i => brandFilters.includes(i.brandId || ''))
  }, [amazonInventory, brandFilters])

  // Brand options for the multi-select
  const brandOptions = useMemo(() => {
    return brands.map(b => ({ value: b.id, label: b.name }))
  }, [brands])

  // Handle stock selection - allows multi-location selection
  const handleStockSelect = (stockId: string) => {
    setSelectedStockIds(prev => {
      if (prev.includes(stockId)) {
        return prev.filter(id => id !== stockId)
      }
      return [...prev, stockId]
    })
  }

  // Get selected stock and group by location for multi-transfer
  const selectedStock = stock.filter(s => selectedStockIds.includes(s.id))
  const selectedLocationIds = [...new Set(selectedStock.map(s => s.locationId))]
  const canInitiateTransfer = selectedStockIds.length > 0

  // Handle initiate transfer
  const handleInitiateTransfer = () => {
    if (canInitiateTransfer) {
      onInitiateTransfer?.(selectedStockIds)
    }
  }

  // Clear selection
  const handleClearSelection = () => {
    setSelectedStockIds([])
  }

  // Amazon sync handler
  const handleAmazonSync = () => {
    setAmazonSyncStatus('syncing')
    // Simulate sync - in production this would call the API
    onSyncAmazonInventory?.()
    setTimeout(() => {
      setAmazonSyncStatus('success')
      setTimeout(() => setAmazonSyncStatus('idle'), 2000)
    }, 2000)
  }

  // Open mapping modal for an Amazon item
  const handleOpenMappingModal = (amazonSellerSku: string) => {
    const item = amazonInventory.find((i) => i.sellerSku === amazonSellerSku)
    if (item) {
      setMappingModalItem(item)
    }
  }

  // Handle SKU mapping
  const handleMapSku = (amazonSellerSku: string, internalSkuId: string, _internalProductId: string) => {
    onMapSku?.(amazonSellerSku, internalSkuId)
    setMappingModalItem(null)
  }

  // Handle SKU unmapping
  const handleUnmapSku = (amazonSellerSku: string) => {
    onUnmapSku?.(amazonSellerSku)
  }

  // Get unmapped count for tab badge
  const unmappedCount = amazonSummary?.unmappedSkuCount ?? 0

  // Create internal SKU options for the mapping modal
  // In production, this would come from the catalog data
  const internalSkuOptions: InternalSkuOption[] = useMemo(() => {
    // Generate mock internal SKUs from stock data
    const skuMap = new Map<string, InternalSkuOption>()
    stock.forEach((s) => {
      if (!skuMap.has(s.sku)) {
        skuMap.set(s.sku, {
          skuId: `sku-${s.sku}`,
          sku: s.sku,
          productId: `prod-${s.sku}`,
          productName: s.productName,
        })
      }
    })
    return Array.from(skuMap.values())
  }, [stock])

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      {/* Header */}
      <div className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-stone-900 dark:text-white">
                Inventory
              </h1>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                Current stock positions across {uniqueLocations} location{uniqueLocations !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Products</p>
              <p className="mt-1 text-2xl font-semibold text-stone-900 dark:text-white">{uniqueProducts}</p>
            </div>
            <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Available Units</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{totalAvailableUnits.toLocaleString()}</p>
            </div>
            <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Reserved Units</p>
              <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">{totalReservedUnits.toLocaleString()}</p>
            </div>
            <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Total Value</p>
              <p className="mt-1 text-2xl font-semibold text-stone-900 dark:text-white">${totalStockValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 pb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search products, locations, POs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-72 pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              />
            </div>

            {/* Brand Filter */}
            {brands.length > 0 && (
              <MultiSelectCombobox
                options={brandOptions}
                selected={brandFilters}
                onChange={setBrandFilters}
                placeholder="All brands"
                searchPlaceholder="Search brands..."
                className="bg-stone-50 dark:bg-stone-700 border-stone-200 dark:border-stone-600 focus:ring-lime-500"
              />
            )}
          </div>

          {/* Tab Toggle */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-700 rounded-lg">
            <button
              onClick={() => setActiveTab('product')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'product'
                  ? 'bg-white dark:bg-stone-600 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <ProductIcon />
              <span className="hidden sm:inline">By Product</span>
            </button>
            <button
              onClick={() => setActiveTab('location')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'location'
                  ? 'bg-white dark:bg-stone-600 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <LocationIcon />
              <span className="hidden sm:inline">By Location</span>
            </button>
            <button
              onClick={() => setActiveTab('amazon')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'amazon'
                  ? 'bg-white dark:bg-stone-600 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <AmazonIcon />
              <span className="hidden sm:inline">Amazon</span>
              {unmappedCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-full">
                  {unmappedCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'amazon' ? (
          amazonSummary && (
            <AmazonInventoryTable
              items={filteredAmazonInventory}
              summary={amazonSummary}
              syncStatus={amazonSyncStatus}
              onSync={handleAmazonSync}
              onMapSku={handleOpenMappingModal}
              onUnmapSku={handleUnmapSku}
              onViewAmazonItem={onViewAmazonItem}
            />
          )
        ) : (
          <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
            {activeTab === 'product' ? (
              <ProductTable
                stocks={filteredStock}
                selectedStockIds={selectedStockIds}
                onSelectStock={handleStockSelect}
                searchQuery={searchQuery}
              />
            ) : (
              <LocationTable
                stocks={filteredStock}
                selectedStockIds={selectedStockIds}
                onSelectStock={handleStockSelect}
                searchQuery={searchQuery}
              />
            )}
          </div>
        )}
      </div>

      {/* Initiate Transfer Bar - shows when stock is selected */}
      {selectedStockIds.length > 0 && (
        <InitiateTransferBar
          selectedCount={selectedStockIds.length}
          selectedStock={selectedStock}
          selectedLocationCount={selectedLocationIds.length}
          canInitiate={canInitiateTransfer}
          onInitiate={handleInitiateTransfer}
          onClear={handleClearSelection}
        />
      )}

      {/* Amazon SKU Mapping Modal */}
      {mappingModalItem && (
        <AmazonSkuMappingModal
          item={mappingModalItem}
          internalSkus={internalSkuOptions}
          onClose={() => setMappingModalItem(null)}
          onMap={handleMapSku}
        />
      )}
    </div>
  )
}
