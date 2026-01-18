'use client'

import { useState, useMemo } from 'react'
import { RefreshCw, Link2, Link2Off, Search, AlertTriangle, Package, Warehouse, ChevronRight, ChevronDown, ArrowUpDown, ArrowUp, ArrowDown, Copy, Check, Filter } from 'lucide-react'
import type {
  AmazonInventoryItem,
  AmazonInventorySummary,
} from '@/lib/supabase/hooks/useAmazonInventory'

// Helper to check if an item is a "used" condition (not "New")
function isUsedCondition(condition: string): boolean {
  return condition !== 'New'
}

// Helper to check if item has zero stock across all quantities
function hasNoStock(item: AmazonInventoryItem): boolean {
  return (
    item.fbaFulfillable === 0 &&
    item.fbaReserved === 0 &&
    item.fbaInboundWorking === 0 &&
    item.fbaInboundShipped === 0 &&
    item.fbaInboundReceiving === 0 &&
    item.fbaUnfulfillable === 0 &&
    item.awdQuantity === 0 &&
    item.awdInboundQuantity === 0
  )
}

// Generate a fingerprint for FBA quantities only (not AWD, since AWD is tracked per-SKU)
// This detects commingled inventory where Amazon reports same FBA counts under multiple SKUs
function getFbaFingerprint(item: AmazonInventoryItem): string {
  return `${item.fbaFulfillable}|${item.fbaReserved}|${item.fbaInboundWorking}|${item.fbaInboundShipped}|${item.fbaInboundReceiving}|${item.fbaUnfulfillable}`
}

// Detect phantom/duplicate SKUs within the same ASIN group
// Returns a Set of SKU IDs that are likely duplicates
//
// Key insight: When FNSKU equals the ASIN, inventory is "commingled" - Amazon pools
// all inventory together and reports the SAME FBA quantities under each SKU.
// This causes the same units to be counted multiple times.
function detectPhantomSkus(items: AmazonInventoryItem[]): Set<string> {
  const phantomIds = new Set<string>()

  // Group by ASIN first
  const byAsin = new Map<string, AmazonInventoryItem[]>()
  for (const item of items) {
    const existing = byAsin.get(item.asin)
    if (existing) {
      existing.push(item)
    } else {
      byAsin.set(item.asin, [item])
    }
  }

  // For each ASIN group, find items with identical FBA quantities
  for (const [_asin, asinItems] of byAsin) {
    if (asinItems.length <= 1) continue

    // Strategy 1: Group by FNSKU - items sharing FNSKU share physical FBA inventory
    const byFnsku = new Map<string, AmazonInventoryItem[]>()
    for (const item of asinItems) {
      // Use FNSKU, or fallback to a unique key if null
      const fnsku = item.fnsku || `unique-${item.id}`
      const existing = byFnsku.get(fnsku)
      if (existing) {
        existing.push(item)
      } else {
        byFnsku.set(fnsku, [item])
      }
    }

    // Mark duplicates within same FNSKU group
    for (const [, fnskuItems] of byFnsku) {
      if (fnskuItems.length > 1) {
        // Sort: prefer shorter SKU names, then alphabetically
        fnskuItems.sort((a, b) => {
          // Prefer SKUs that DON'T start with "amzn.gr." (those are auto-generated)
          const aIsAuto = a.sellerSku.startsWith('amzn.gr.')
          const bIsAuto = b.sellerSku.startsWith('amzn.gr.')
          if (aIsAuto !== bIsAuto) return aIsAuto ? 1 : -1

          // Then by length (shorter = main SKU)
          if (a.sellerSku.length !== b.sellerSku.length) {
            return a.sellerSku.length - b.sellerSku.length
          }
          return a.sellerSku.localeCompare(b.sellerSku)
        })

        // Mark all but the first as phantom
        for (let i = 1; i < fnskuItems.length; i++) {
          phantomIds.add(fnskuItems[i].id)
        }
      }
    }

    // Strategy 2: Also check for identical FBA fingerprints across different FNSKUs
    // (catches edge cases where same inventory is under different FNSKUs)
    const fingerprintMap = new Map<string, AmazonInventoryItem[]>()
    for (const item of asinItems) {
      // Skip items already marked as phantom
      if (phantomIds.has(item.id)) continue

      const fp = getFbaFingerprint(item)
      // Skip zero-inventory items (they all have the same fingerprint)
      if (fp === '0|0|0|0|0|0') continue

      const existing = fingerprintMap.get(fp)
      if (existing) {
        existing.push(item)
      } else {
        fingerprintMap.set(fp, [item])
      }
    }

    // If multiple non-phantom items have same FBA fingerprint, mark extras as phantom
    for (const [, fpItems] of fingerprintMap) {
      if (fpItems.length > 1) {
        fpItems.sort((a, b) => {
          const aIsAuto = a.sellerSku.startsWith('amzn.gr.')
          const bIsAuto = b.sellerSku.startsWith('amzn.gr.')
          if (aIsAuto !== bIsAuto) return aIsAuto ? 1 : -1
          if (a.sellerSku.length !== b.sellerSku.length) {
            return a.sellerSku.length - b.sellerSku.length
          }
          return a.sellerSku.localeCompare(b.sellerSku)
        })

        for (let i = 1; i < fpItems.length; i++) {
          phantomIds.add(fpItems[i].id)
        }
      }
    }
  }

  return phantomIds
}

interface AmazonInventoryTableProps {
  inventory: AmazonInventoryItem[]
  summary: AmazonInventorySummary
  loading: boolean
  syncing: boolean
  lastSyncAt: string | null
  onSync: () => Promise<boolean>
  onMapSku: (item: AmazonInventoryItem) => void
  onUnmapSku: (amazonSellerSku: string) => void | Promise<void>
}

type FilterType = 'all' | 'mapped' | 'unmapped'

type SortColumn = 'productName' | 'fbaFulfillable' | 'fbaReserved' | 'fbaInbound' | 'fbaUnfulfillable' | 'awdOnhand' | 'awdInbound'
type SortDirection = 'asc' | 'desc'

interface SortState {
  column: SortColumn | null
  direction: SortDirection
}

interface AsinGroup {
  asin: string
  productName: string
  items: AmazonInventoryItem[]
  totals: {
    fbaFulfillable: number
    fbaReserved: number
    fbaInbound: number
    fbaUnfulfillable: number
    awdOnhand: number
    awdInbound: number
  }
  allMapped: boolean
  allUnmapped: boolean
}

export function AmazonInventoryTable({
  inventory,
  summary: _summary, // Unused - we compute correctedSummary locally to exclude phantoms
  loading,
  syncing,
  lastSyncAt,
  onSync,
  onMapSku,
  onUnmapSku,
}: AmazonInventoryTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [expandedAsins, setExpandedAsins] = useState<Set<string>>(new Set())

  // Visibility toggles (defaults: hide used, hide no stock, hide discontinued, hide phantoms)
  const [showUsed, setShowUsed] = useState(false)
  const [showNoStock, setShowNoStock] = useState(false)
  const [showDiscontinued, setShowDiscontinued] = useState(false)
  const [showPhantoms, setShowPhantoms] = useState(false)

  // Detect phantom/duplicate SKUs (computed once from full inventory)
  const phantomSkuIds = useMemo(() => detectPhantomSkus(inventory), [inventory])

  // Compute corrected summary that excludes phantom SKUs for FBA (shared inventory)
  // but includes ALL items for AWD (AWD is tracked per-SKU, not shared)
  const correctedSummary = useMemo(() => {
    const nonPhantomItems = inventory.filter(item => !phantomSkuIds.has(item.id))
    const mappedItems = nonPhantomItems.filter(i => i.mappingStatus === 'mapped')
    const unmappedItems = nonPhantomItems.filter(i => i.mappingStatus === 'unmapped')

    return {
      totalItems: nonPhantomItems.length,
      // FBA totals: Only non-phantoms (FBA is commingled/shared inventory)
      totalFbaFulfillable: nonPhantomItems.reduce((sum, i) => sum + i.fbaFulfillable, 0),
      totalFbaReserved: nonPhantomItems.reduce((sum, i) => sum + i.fbaReserved, 0),
      totalFbaInbound: nonPhantomItems.reduce((sum, i) =>
        sum + i.fbaInboundWorking + i.fbaInboundShipped + i.fbaInboundReceiving, 0),
      totalFbaUnfulfillable: nonPhantomItems.reduce((sum, i) => sum + i.fbaUnfulfillable, 0),
      // AWD totals: ALL items (AWD is tracked per-SKU, not shared)
      totalAwdOnhand: inventory.reduce((sum, i) => sum + i.awdQuantity, 0),
      totalAwdInbound: inventory.reduce((sum, i) => sum + i.awdInboundQuantity, 0),
      mappedCount: mappedItems.length,
      unmappedCount: unmappedItems.length,
    }
  }, [inventory, phantomSkuIds])

  // Sorting state (default: sort by fulfillable desc)
  const [sort, setSort] = useState<SortState>({ column: 'fbaFulfillable', direction: 'desc' })

  // Copy feedback state
  const [copiedAsin, setCopiedAsin] = useState<string | null>(null)

  // Visibility dropdown state
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false)

  // Count how many item types are currently hidden
  const hiddenFilterCount = useMemo(() => {
    let count = 0
    if (!showUsed) count++
    if (!showNoStock) count++
    if (!showDiscontinued) count++
    if (!showPhantoms && phantomSkuIds.size > 0) count++
    return count
  }, [showUsed, showNoStock, showDiscontinued, showPhantoms, phantomSkuIds.size])

  // Copy ASIN to clipboard
  const copyAsin = async (asin: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row expansion
    try {
      await navigator.clipboard.writeText(asin)
      setCopiedAsin(asin)
      setTimeout(() => setCopiedAsin(null), 2000)
    } catch {
      console.error('Failed to copy ASIN')
    }
  }

  // Toggle sort - click same column toggles direction, new column starts desc
  const toggleSort = (column: SortColumn) => {
    setSort(prev => {
      if (prev.column === column) {
        return { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { column, direction: 'desc' }
    })
  }

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      // Apply search filter
      const matchesSearch = searchQuery === '' ||
        item.sellerSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.asin.toLowerCase().includes(searchQuery.toLowerCase())

      // Apply mapping filter
      const matchesFilter = filter === 'all' ||
        (filter === 'mapped' && item.mappingStatus === 'mapped') ||
        (filter === 'unmapped' && item.mappingStatus === 'unmapped')

      // Apply visibility toggles
      // Hide used items unless showUsed is true
      if (!showUsed && isUsedCondition(item.condition)) {
        return false
      }

      // Hide no-stock items unless showNoStock is true
      if (!showNoStock && hasNoStock(item)) {
        return false
      }

      // Hide discontinued items unless showDiscontinued is true
      // (only applies to items mapped to products with 'archived' status)
      if (!showDiscontinued && item.productStatus === 'archived') {
        return false
      }

      // Hide phantom/duplicate SKUs unless:
      // - showPhantoms is true, OR
      // - they have AWD inventory (AWD is per-SKU, so these phantoms have real inventory)
      const hasAwdInventory = item.awdQuantity > 0 || item.awdInboundQuantity > 0
      if (!showPhantoms && phantomSkuIds.has(item.id) && !hasAwdInventory) {
        return false
      }

      return matchesSearch && matchesFilter
    })
  }, [inventory, searchQuery, filter, showUsed, showNoStock, showDiscontinued, showPhantoms, phantomSkuIds])

  // Group inventory by ASIN
  // FBA totals: Only non-phantom items (FBA is shared/commingled)
  // AWD totals: All items (AWD is per-SKU)
  const groupedByAsin = useMemo((): AsinGroup[] => {
    const groups = new Map<string, AsinGroup>()

    for (const item of filteredInventory) {
      const isPhantom = phantomSkuIds.has(item.id)
      const existing = groups.get(item.asin)

      if (existing) {
        existing.items.push(item)
        // Only add FBA quantities from non-phantom items (FBA is shared)
        if (!isPhantom) {
          existing.totals.fbaFulfillable += item.fbaFulfillable
          existing.totals.fbaReserved += item.fbaReserved
          existing.totals.fbaInbound += item.fbaInboundWorking + item.fbaInboundShipped + item.fbaInboundReceiving
          existing.totals.fbaUnfulfillable += item.fbaUnfulfillable
        }
        // Always add AWD quantities (AWD is per-SKU, not shared)
        existing.totals.awdOnhand += item.awdQuantity
        existing.totals.awdInbound += item.awdInboundQuantity
      } else {
        groups.set(item.asin, {
          asin: item.asin,
          productName: item.productName,
          items: [item],
          totals: {
            // Only add FBA from non-phantom items
            fbaFulfillable: isPhantom ? 0 : item.fbaFulfillable,
            fbaReserved: isPhantom ? 0 : item.fbaReserved,
            fbaInbound: isPhantom ? 0 : (item.fbaInboundWorking + item.fbaInboundShipped + item.fbaInboundReceiving),
            fbaUnfulfillable: isPhantom ? 0 : item.fbaUnfulfillable,
            // Always add AWD
            awdOnhand: item.awdQuantity,
            awdInbound: item.awdInboundQuantity,
          },
          allMapped: true,
          allUnmapped: true,
        })
      }
    }

    // Calculate mapping status for each group
    for (const group of groups.values()) {
      group.allMapped = group.items.every(i => i.mappingStatus === 'mapped')
      group.allUnmapped = group.items.every(i => i.mappingStatus === 'unmapped')
    }

    // Sort groups based on sort state
    const sortedGroups = Array.from(groups.values()).sort((a, b) => {
      if (!sort.column) {
        return a.productName.localeCompare(b.productName)
      }

      let comparison = 0
      switch (sort.column) {
        case 'productName':
          comparison = a.productName.localeCompare(b.productName)
          break
        case 'fbaFulfillable':
          comparison = a.totals.fbaFulfillable - b.totals.fbaFulfillable
          break
        case 'fbaReserved':
          comparison = a.totals.fbaReserved - b.totals.fbaReserved
          break
        case 'fbaInbound':
          comparison = a.totals.fbaInbound - b.totals.fbaInbound
          break
        case 'fbaUnfulfillable':
          comparison = a.totals.fbaUnfulfillable - b.totals.fbaUnfulfillable
          break
        case 'awdOnhand':
          comparison = a.totals.awdOnhand - b.totals.awdOnhand
          break
        case 'awdInbound':
          comparison = a.totals.awdInbound - b.totals.awdInbound
          break
      }

      return sort.direction === 'asc' ? comparison : -comparison
    })

    return sortedGroups
  }, [filteredInventory, sort, phantomSkuIds])

  const formatNumber = (n: number) => n.toLocaleString()

  // Sort items helper (for nested SKU rows)
  const sortItems = (items: AmazonInventoryItem[]): AmazonInventoryItem[] => {
    if (!sort.column) return items

    return [...items].sort((a, b) => {
      let comparison = 0
      switch (sort.column) {
        case 'productName':
          comparison = a.productName.localeCompare(b.productName)
          break
        case 'fbaFulfillable':
          comparison = a.fbaFulfillable - b.fbaFulfillable
          break
        case 'fbaReserved':
          comparison = a.fbaReserved - b.fbaReserved
          break
        case 'fbaInbound':
          comparison = (a.fbaInboundWorking + a.fbaInboundShipped + a.fbaInboundReceiving) -
                       (b.fbaInboundWorking + b.fbaInboundShipped + b.fbaInboundReceiving)
          break
        case 'fbaUnfulfillable':
          comparison = a.fbaUnfulfillable - b.fbaUnfulfillable
          break
        case 'awdOnhand':
          comparison = a.awdQuantity - b.awdQuantity
          break
        case 'awdInbound':
          comparison = a.awdInboundQuantity - b.awdInboundQuantity
          break
      }
      return sort.direction === 'asc' ? comparison : -comparison
    })
  }

  // Sortable header component
  const SortHeader = ({ column, children, align = 'right' }: { column: SortColumn; children: React.ReactNode; align?: 'left' | 'right' }) => {
    const isActive = sort.column === column
    return (
      <button
        onClick={() => toggleSort(column)}
        className={`flex items-center gap-1 w-full group ${align === 'right' ? 'justify-end' : 'justify-start'}`}
      >
        <span className={isActive ? 'text-stone-900 dark:text-white' : ''}>{children}</span>
        {isActive ? (
          sort.direction === 'asc' ? (
            <ArrowUp className="w-3.5 h-3.5 text-lime-600" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 text-lime-600" />
          )
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
        )}
      </button>
    )
  }

  // Check if any items have AWD data
  const hasAwdData = inventory.some(item => item.awdQuantity > 0 || item.awdInboundQuantity > 0)

  const toggleAsin = (asin: string) => {
    setExpandedAsins(prev => {
      const next = new Set(prev)
      if (next.has(asin)) {
        next.delete(asin)
      } else {
        next.add(asin)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedAsins(new Set(groupedByAsin.map(g => g.asin)))
  }

  const collapseAll = () => {
    setExpandedAsins(new Set())
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards - Two sections: FBA and AWD */}
      <div className="space-y-4">
        {/* FBA Section */}
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
            <Package className="w-4 h-4 text-orange-500" />
            <span>FBA (Fulfillment by Amazon)</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <div className="bg-white dark:bg-stone-800 rounded-lg px-4 py-3 border border-stone-200 dark:border-stone-700">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase">Total SKUs</p>
              <p className="mt-1 text-xl font-semibold text-stone-900 dark:text-white">{formatNumber(correctedSummary.totalItems)}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-4 py-3 border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase">Fulfillable</p>
              <p className="mt-1 text-xl font-semibold text-emerald-700 dark:text-emerald-300">{formatNumber(correctedSummary.totalFbaFulfillable)}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg px-4 py-3 border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase">Reserved</p>
              <p className="mt-1 text-xl font-semibold text-amber-700 dark:text-amber-300">{formatNumber(correctedSummary.totalFbaReserved)}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-3 border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">Inbound</p>
              <p className="mt-1 text-xl font-semibold text-blue-700 dark:text-blue-300">{formatNumber(correctedSummary.totalFbaInbound)}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-3 border border-red-200 dark:border-red-800">
              <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase">Unfulfillable</p>
              <p className="mt-1 text-xl font-semibold text-red-700 dark:text-red-300">{formatNumber(correctedSummary.totalFbaUnfulfillable)}</p>
            </div>
          </div>
        </div>

        {/* AWD Section */}
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-stone-400 mb-2">
            <Warehouse className="w-4 h-4 text-purple-500" />
            <span>AWD (Amazon Warehousing & Distribution)</span>
            {!hasAwdData && (
              <span className="text-xs text-stone-400 dark:text-stone-500 font-normal ml-1">(No AWD inventory)</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className={`rounded-lg px-4 py-3 border ${hasAwdData ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' : 'bg-stone-50 dark:bg-stone-700/30 border-stone-200 dark:border-stone-700'}`}>
              <p className={`text-xs font-medium uppercase ${hasAwdData ? 'text-purple-600 dark:text-purple-400' : 'text-stone-400 dark:text-stone-500'}`}>On-Hand</p>
              <p className={`mt-1 text-xl font-semibold ${hasAwdData ? 'text-purple-700 dark:text-purple-300' : 'text-stone-400 dark:text-stone-500'}`}>{formatNumber(correctedSummary.totalAwdOnhand)}</p>
            </div>
            <div className={`rounded-lg px-4 py-3 border ${hasAwdData ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800' : 'bg-stone-50 dark:bg-stone-700/30 border-stone-200 dark:border-stone-700'}`}>
              <p className={`text-xs font-medium uppercase ${hasAwdData ? 'text-violet-600 dark:text-violet-400' : 'text-stone-400 dark:text-stone-500'}`}>Inbound</p>
              <p className={`mt-1 text-xl font-semibold ${hasAwdData ? 'text-violet-700 dark:text-violet-300' : 'text-stone-400 dark:text-stone-500'}`}>{formatNumber(correctedSummary.totalAwdInbound)}</p>
            </div>
            <div className="bg-lime-50 dark:bg-lime-900/20 rounded-lg px-4 py-3 border border-lime-200 dark:border-lime-800">
              <p className="text-xs font-medium text-lime-600 dark:text-lime-400 uppercase">Mapped SKUs</p>
              <p className="mt-1 text-xl font-semibold text-lime-700 dark:text-lime-300">{formatNumber(correctedSummary.mappedCount)}</p>
            </div>
            <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg px-4 py-3 border border-stone-200 dark:border-stone-600">
              <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase">Unmapped</p>
              <p className="mt-1 text-xl font-semibold text-stone-700 dark:text-stone-300">{formatNumber(correctedSummary.unmappedCount)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search SKU, ASIN, or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-64 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-700 rounded-lg">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-white dark:bg-stone-600 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('mapped')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                filter === 'mapped'
                  ? 'bg-white dark:bg-stone-600 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-300'
              }`}
            >
              Mapped
            </button>
            <button
              onClick={() => setFilter('unmapped')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                filter === 'unmapped'
                  ? 'bg-white dark:bg-stone-600 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-600 dark:text-stone-300'
              }`}
            >
              Unmapped
            </button>
          </div>

          {/* Expand/Collapse buttons */}
          {groupedByAsin.length > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={expandAll}
                className="px-2 py-1 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
              >
                Expand all
              </button>
              <span className="text-stone-300 dark:text-stone-600">|</span>
              <button
                onClick={collapseAll}
                className="px-2 py-1 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
              >
                Collapse all
              </button>
            </div>
          )}

          {/* Visibility dropdown */}
          <div className="relative border-l border-stone-200 dark:border-stone-600 pl-3 ml-2">
            <button
              onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                hiddenFilterCount > 0
                  ? 'bg-stone-100 text-stone-700 dark:bg-stone-700 dark:text-stone-200'
                  : 'text-stone-500 hover:text-stone-700 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              View
              {hiddenFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-stone-200 dark:bg-stone-600 rounded-full">
                  {hiddenFilterCount} hidden
                </span>
              )}
            </button>

            {showVisibilityDropdown && (
              <>
                {/* Backdrop to close dropdown */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowVisibilityDropdown(false)}
                />
                {/* Dropdown panel */}
                <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg py-1 min-w-[180px]">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                    Show/Hide
                  </div>

                  {/* Used toggle */}
                  <button
                    onClick={() => setShowUsed(!showUsed)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
                  >
                    <span className={`flex items-center justify-center w-4 h-4 rounded border ${
                      showUsed
                        ? 'bg-lime-500 border-lime-500 text-white'
                        : 'border-stone-300 dark:border-stone-600'
                    }`}>
                      {showUsed && <Check className="w-3 h-3" />}
                    </span>
                    <span className="text-stone-700 dark:text-stone-200">Used condition</span>
                  </button>

                  {/* No Stock toggle */}
                  <button
                    onClick={() => setShowNoStock(!showNoStock)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
                  >
                    <span className={`flex items-center justify-center w-4 h-4 rounded border ${
                      showNoStock
                        ? 'bg-lime-500 border-lime-500 text-white'
                        : 'border-stone-300 dark:border-stone-600'
                    }`}>
                      {showNoStock && <Check className="w-3 h-3" />}
                    </span>
                    <span className="text-stone-700 dark:text-stone-200">Out of stock</span>
                  </button>

                  {/* Discontinued toggle */}
                  <button
                    onClick={() => setShowDiscontinued(!showDiscontinued)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
                  >
                    <span className={`flex items-center justify-center w-4 h-4 rounded border ${
                      showDiscontinued
                        ? 'bg-lime-500 border-lime-500 text-white'
                        : 'border-stone-300 dark:border-stone-600'
                    }`}>
                      {showDiscontinued && <Check className="w-3 h-3" />}
                    </span>
                    <span className="text-stone-700 dark:text-stone-200">Discontinued</span>
                  </button>

                  {/* Phantoms toggle (only if there are phantoms) */}
                  {phantomSkuIds.size > 0 && (
                    <>
                      <div className="my-1 border-t border-stone-200 dark:border-stone-700" />
                      <button
                        onClick={() => setShowPhantoms(!showPhantoms)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
                      >
                        <span className={`flex items-center justify-center w-4 h-4 rounded border ${
                          showPhantoms
                            ? 'bg-orange-500 border-orange-500 text-white'
                            : 'border-stone-300 dark:border-stone-600'
                        }`}>
                          {showPhantoms && <Check className="w-3 h-3" />}
                        </span>
                        <span className="text-stone-700 dark:text-stone-200">
                          Phantoms
                          <span className="ml-1.5 text-xs text-orange-600 dark:text-orange-400">
                            ({phantomSkuIds.size})
                          </span>
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastSyncAt && (
            <span className="text-xs text-stone-500 dark:text-stone-400">
              Last sync: {new Date(lastSyncAt).toLocaleString()}
            </span>
          )}
          <button
            onClick={onSync}
            disabled={syncing || loading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-stone-300 dark:disabled:bg-stone-600 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Products count */}
      {groupedByAsin.length > 0 && (
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {groupedByAsin.length} product{groupedByAsin.length !== 1 ? 's' : ''} ({filteredInventory.length} SKU{filteredInventory.length !== 1 ? 's' : ''})
        </p>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        {loading && inventory.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 mx-auto text-stone-400 animate-spin" />
              <p className="mt-4 text-stone-500 dark:text-stone-400">Loading Amazon inventory...</p>
            </div>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 mx-auto text-stone-300 dark:text-stone-600" />
              <h3 className="mt-4 text-lg font-medium text-stone-900 dark:text-white">
                {inventory.length === 0 ? 'No inventory data' : 'No matching items'}
              </h3>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                {inventory.length === 0
                  ? 'Sync from Amazon to see your FBA inventory.'
                  : 'Try adjusting your search or filter.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Two-row header for segmented FBA/AWD columns */}
              <thead>
                {/* Group headers row */}
                <tr className="bg-stone-50 dark:bg-stone-750 border-b border-stone-200 dark:border-stone-700">
                  <th colSpan={2} className="py-2 px-4"></th>
                  <th colSpan={4} className="py-2 px-4 text-center border-l border-r border-stone-200 dark:border-stone-600">
                    <div className="flex items-center justify-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">FBA</span>
                    </div>
                  </th>
                  <th colSpan={2} className="py-2 px-4 text-center border-r border-stone-200 dark:border-stone-600">
                    <div className="flex items-center justify-center gap-1.5">
                      <Warehouse className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">AWD</span>
                    </div>
                  </th>
                  <th className="py-2 px-4"></th>
                </tr>
                {/* Column headers row */}
                <tr className="bg-stone-100 dark:bg-stone-700 text-left text-xs font-medium uppercase text-stone-500 dark:text-stone-400">
                  <th className="py-3 px-4 w-8"></th>
                  <th className="py-3 px-4">
                    <SortHeader column="productName" align="left">Product / SKU</SortHeader>
                  </th>
                  {/* FBA columns */}
                  <th className="py-3 px-4 text-right border-l border-stone-200 dark:border-stone-600">
                    <SortHeader column="fbaFulfillable">Fulfillable</SortHeader>
                  </th>
                  <th className="py-3 px-4 text-right">
                    <SortHeader column="fbaReserved">Reserved</SortHeader>
                  </th>
                  <th className="py-3 px-4 text-right">
                    <SortHeader column="fbaInbound">Inbound</SortHeader>
                  </th>
                  <th className="py-3 px-4 text-right border-r border-stone-200 dark:border-stone-600">
                    <SortHeader column="fbaUnfulfillable">Unfulfill.</SortHeader>
                  </th>
                  {/* AWD columns */}
                  <th className="py-3 px-4 text-right">
                    <SortHeader column="awdOnhand">On-Hand</SortHeader>
                  </th>
                  <th className="py-3 px-4 text-right border-r border-stone-200 dark:border-stone-600">
                    <SortHeader column="awdInbound">Inbound</SortHeader>
                  </th>
                  <th className="py-3 px-4 text-center">Mapping</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                {groupedByAsin.map((group) => {
                  const isExpanded = expandedAsins.has(group.asin)
                  const hasMultipleSkus = group.items.length > 1

                  return (
                    <>
                      {/* ASIN parent row */}
                      <tr
                        key={group.asin}
                        className={`${hasMultipleSkus ? 'cursor-pointer' : ''} hover:bg-stone-50 dark:hover:bg-stone-700/50 ${isExpanded ? 'bg-stone-50 dark:bg-stone-700/30' : ''}`}
                        onClick={hasMultipleSkus ? () => toggleAsin(group.asin) : undefined}
                      >
                        <td className="py-3 px-4">
                          {hasMultipleSkus ? (
                            <button className="p-0.5 rounded hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-stone-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-stone-500" />
                              )}
                            </button>
                          ) : (
                            <span className="w-4 h-4 block" />
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-sm">
                            <p className="text-sm font-medium text-stone-900 dark:text-white truncate">
                              {group.productName}
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => copyAsin(group.asin, e)}
                                className="flex items-center gap-1 text-xs font-mono text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 group/copy transition-colors"
                                title="Click to copy ASIN"
                              >
                                {group.asin}
                                {copiedAsin === group.asin ? (
                                  <Check className="w-3 h-3 text-lime-500" />
                                ) : (
                                  <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                                )}
                              </button>
                              {hasMultipleSkus && (
                                <span className="text-xs text-stone-400 dark:text-stone-500">
                                  ({group.items.length} SKUs)
                                </span>
                              )}
                              {!hasMultipleSkus && (
                                <p className="text-xs font-mono text-lime-600 dark:text-lime-400">{group.items[0].sellerSku}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* FBA totals */}
                        <td className="py-3 px-4 text-right tabular-nums border-l border-stone-100 dark:border-stone-700">
                          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatNumber(group.totals.fbaFulfillable)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-sm text-stone-600 dark:text-stone-400">
                          {formatNumber(group.totals.fbaReserved)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-sm text-stone-600 dark:text-stone-400">
                          {formatNumber(group.totals.fbaInbound)}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums border-r border-stone-100 dark:border-stone-700">
                          {group.totals.fbaUnfulfillable > 0 ? (
                            <span className="text-sm text-red-600 dark:text-red-400">
                              {formatNumber(group.totals.fbaUnfulfillable)}
                            </span>
                          ) : (
                            <span className="text-sm text-stone-400">0</span>
                          )}
                        </td>
                        {/* AWD totals */}
                        <td className="py-3 px-4 text-right tabular-nums">
                          {group.totals.awdOnhand > 0 ? (
                            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                              {formatNumber(group.totals.awdOnhand)}
                            </span>
                          ) : (
                            <span className="text-sm text-stone-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums border-r border-stone-100 dark:border-stone-700">
                          {group.totals.awdInbound > 0 ? (
                            <span className="text-sm text-violet-600 dark:text-violet-400">
                              {formatNumber(group.totals.awdInbound)}
                            </span>
                          ) : (
                            <span className="text-sm text-stone-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          {!hasMultipleSkus ? (
                            // Single SKU - show mapping button
                            group.items[0].mappingStatus === 'mapped' ? (
                              <button
                                onClick={() => onUnmapSku(group.items[0].sellerSku)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300 rounded text-xs font-medium hover:bg-lime-200 dark:hover:bg-lime-900/50 transition-colors"
                              >
                                <Link2 className="w-3 h-3" />
                                Mapped
                              </button>
                            ) : (
                              <button
                                onClick={() => onMapSku(group.items[0])}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded text-xs font-medium hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
                              >
                                <Link2Off className="w-3 h-3" />
                                Map SKU
                              </button>
                            )
                          ) : (
                            // Multiple SKUs - show summary badge
                            group.allMapped ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300 rounded text-xs font-medium">
                                <Link2 className="w-3 h-3" />
                                All mapped
                              </span>
                            ) : group.allUnmapped ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded text-xs font-medium">
                                <Link2Off className="w-3 h-3" />
                                Unmapped
                              </span>
                            ) : (
                              <span className="text-xs text-stone-500 dark:text-stone-400">
                                Mixed
                              </span>
                            )
                          )}
                        </td>
                      </tr>

                      {/* Child SKU rows (when expanded and has multiple SKUs) */}
                      {isExpanded && hasMultipleSkus && sortItems(group.items).map((item) => {
                        const isPhantom = phantomSkuIds.has(item.id)
                        return (
                        <tr
                          key={item.id}
                          className={`hover:bg-stone-100 dark:hover:bg-stone-700/70 ${isPhantom ? 'bg-orange-50/50 dark:bg-orange-900/10' : 'bg-stone-50/50 dark:bg-stone-750/50'}`}
                        >
                          <td className="py-2 px-4"></td>
                          <td className="py-2 px-4 pl-8">
                            <div className="flex items-center gap-3">
                              <div className={`w-1 h-6 rounded-full ${isPhantom ? 'bg-orange-300 dark:bg-orange-600' : 'bg-stone-200 dark:bg-stone-600'}`} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className={`text-xs font-mono ${isPhantom ? 'text-orange-600 dark:text-orange-400' : 'text-lime-600 dark:text-lime-400'}`}>{item.sellerSku}</p>
                                  {isPhantom && (
                                    <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-[10px] font-medium uppercase">
                                      Phantom
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-stone-500 dark:text-stone-400">{item.condition}</p>
                              </div>
                            </div>
                          </td>
                          {/* FBA columns */}
                          <td className="py-2 px-4 text-right tabular-nums border-l border-stone-100 dark:border-stone-700">
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              {formatNumber(item.fbaFulfillable)}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-right tabular-nums text-xs text-stone-500 dark:text-stone-400">
                            {formatNumber(item.fbaReserved)}
                          </td>
                          <td className="py-2 px-4 text-right tabular-nums text-xs text-stone-500 dark:text-stone-400">
                            {formatNumber(item.fbaInboundWorking + item.fbaInboundShipped + item.fbaInboundReceiving)}
                          </td>
                          <td className="py-2 px-4 text-right tabular-nums border-r border-stone-100 dark:border-stone-700">
                            {item.fbaUnfulfillable > 0 ? (
                              <span className="text-xs text-red-600 dark:text-red-400">
                                {formatNumber(item.fbaUnfulfillable)}
                              </span>
                            ) : (
                              <span className="text-xs text-stone-400">0</span>
                            )}
                          </td>
                          {/* AWD columns */}
                          <td className="py-2 px-4 text-right tabular-nums">
                            {item.awdQuantity > 0 ? (
                              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                                {formatNumber(item.awdQuantity)}
                              </span>
                            ) : (
                              <span className="text-xs text-stone-400">-</span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-right tabular-nums border-r border-stone-100 dark:border-stone-700">
                            {item.awdInboundQuantity > 0 ? (
                              <span className="text-xs text-violet-600 dark:text-violet-400">
                                {formatNumber(item.awdInboundQuantity)}
                              </span>
                            ) : (
                              <span className="text-xs text-stone-400">-</span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-center">
                            {item.mappingStatus === 'mapped' ? (
                              <button
                                onClick={() => onUnmapSku(item.sellerSku)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300 rounded text-xs font-medium hover:bg-lime-200 dark:hover:bg-lime-900/50 transition-colors"
                              >
                                <Link2 className="w-3 h-3" />
                              </button>
                            ) : (
                              <button
                                onClick={() => onMapSku(item)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded text-xs font-medium hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
                              >
                                <Link2Off className="w-3 h-3" />
                              </button>
                            )}
                          </td>
                        </tr>
                      )})}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
