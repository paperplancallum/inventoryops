import React, { useState, useMemo } from 'react'
import { ExternalLink, Link2, Unlink, ChevronDown, ChevronRight, Layers } from 'lucide-react'
import type {
  AmazonInventoryItem,
  AmazonInventorySummary,
  AmazonMappingStatus,
  AmazonCondition,
  AmazonMarketplace,
} from '@/../product/sections/inventory/types'
import { AmazonSyncStatus } from './AmazonSyncStatus'
import type { SyncStatus } from './AmazonSyncStatus'

// Icons
const SearchIcon = () => (
  <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

interface AmazonInventoryTableProps {
  items: AmazonInventoryItem[]
  summary: AmazonInventorySummary
  syncStatus?: SyncStatus
  onSync?: () => void
  onMapSku?: (amazonSellerSku: string) => void
  onUnmapSku?: (amazonSellerSku: string) => void
  onViewAmazonItem?: (asin: string) => void
}

type MappingFilter = 'all' | 'mapped' | 'unmapped'
type ConditionFilter = 'all' | AmazonCondition
type MarketplaceFilter = 'all' | AmazonMarketplace
type GroupBy = 'none' | 'marketplace' | 'asin'

interface GroupedItems {
  key: string
  label: string
  items: AmazonInventoryItem[]
  fbaFulfillable: number
  fbaReserved: number
  fbaInbound: number
  awdTotal: number
}

const marketplaceStyles: Record<AmazonMarketplace, { flag: string; label: string; code: string }> = {
  US: { flag: '🇺🇸', label: 'United States', code: 'US' },
  CA: { flag: '🇨🇦', label: 'Canada', code: 'CA' },
  MX: { flag: '🇲🇽', label: 'Mexico', code: 'MX' },
}

const conditionStyles: Record<AmazonCondition, { bg: string; text: string; label: string }> = {
  New: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    label: 'New',
  },
  Refurbished: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    label: 'Refurbished',
  },
  UsedLikeNew: {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-700 dark:text-cyan-400',
    label: 'Like New',
  },
  UsedVeryGood: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    label: 'Very Good',
  },
  UsedGood: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    label: 'Good',
  },
  UsedAcceptable: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    label: 'Acceptable',
  },
}

const statusStyles: Record<AmazonMappingStatus, { bg: string; text: string }> = {
  mapped: {
    bg: 'bg-emerald-500',
    text: 'Linked',
  },
  unmapped: {
    bg: 'bg-amber-500',
    text: 'Unlinked',
  },
  pending: {
    bg: 'bg-stone-400',
    text: 'Pending',
  },
}

export function AmazonInventoryTable({
  items,
  summary,
  syncStatus = 'idle',
  onSync,
  onMapSku,
  onUnmapSku,
  onViewAmazonItem,
}: AmazonInventoryTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [mappingFilter, setMappingFilter] = useState<MappingFilter>('all')
  const [conditionFilter, setConditionFilter] = useState<ConditionFilter>('all')
  const [marketplaceFilter, setMarketplaceFilter] = useState<MarketplaceFilter>('all')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [showMappingDropdown, setShowMappingDropdown] = useState(false)
  const [showConditionDropdown, setShowConditionDropdown] = useState(false)
  const [showMarketplaceDropdown, setShowMarketplaceDropdown] = useState(false)
  const [showGroupByDropdown, setShowGroupByDropdown] = useState(false)

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Marketplace filter
      if (marketplaceFilter !== 'all' && item.marketplace !== marketplaceFilter) {
        return false
      }

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesSearch =
          item.asin.toLowerCase().includes(q) ||
          item.sellerSku.toLowerCase().includes(q) ||
          item.productName.toLowerCase().includes(q) ||
          (item.fnsku?.toLowerCase().includes(q) ?? false)
        if (!matchesSearch) return false
      }

      // Mapping filter
      if (mappingFilter !== 'all' && item.mappingStatus !== mappingFilter) {
        return false
      }

      // Condition filter
      if (conditionFilter !== 'all' && item.condition !== conditionFilter) {
        return false
      }

      return true
    })
  }, [items, searchQuery, mappingFilter, conditionFilter, marketplaceFilter])

  // Calculate filtered summary (recalculate based on marketplace filter)
  const filteredSummary = useMemo(() => {
    const itemsToSum = marketplaceFilter === 'all' ? items : items.filter(i => i.marketplace === marketplaceFilter)

    return {
      fbaFulfillableTotal: itemsToSum.reduce((sum, i) => sum + i.fbaFulfillable, 0),
      fbaReservedTotal: itemsToSum.reduce((sum, i) => sum + i.fbaReserved, 0),
      fbaInboundTotal: itemsToSum.reduce((sum, i) => sum + i.fbaInboundWorking + i.fbaInboundShipped + i.fbaInboundReceiving, 0),
      fbaUnfulfillableTotal: itemsToSum.reduce((sum, i) => sum + i.fbaUnfulfillable, 0),
      awdTotal: itemsToSum.reduce((sum, i) => sum + i.awdQuantity, 0),
      awdInboundTotal: itemsToSum.reduce((sum, i) => sum + i.awdInboundQuantity, 0),
      unmappedSkuCount: itemsToSum.filter(i => i.mappingStatus === 'unmapped').length,
      lastSyncedAt: summary.lastSyncedAt,
    }
  }, [items, marketplaceFilter, summary.lastSyncedAt])

  // Group items by marketplace or ASIN
  const groupedItems = useMemo((): GroupedItems[] => {
    if (groupBy === 'none') return []

    const groups = new Map<string, AmazonInventoryItem[]>()

    filteredItems.forEach((item) => {
      const key = groupBy === 'marketplace' ? item.marketplace : item.asin
      const existing = groups.get(key) || []
      groups.set(key, [...existing, item])
    })

    // Sort groups and calculate totals
    const result: GroupedItems[] = []
    groups.forEach((groupItems, key) => {
      const label =
        groupBy === 'marketplace'
          ? `${marketplaceStyles[key as AmazonMarketplace]?.code || key} — ${marketplaceStyles[key as AmazonMarketplace]?.label || key}`
          : `${key} — ${groupItems[0]?.productName || 'Unknown'}`

      result.push({
        key,
        label,
        items: groupItems,
        fbaFulfillable: groupItems.reduce((sum, i) => sum + i.fbaFulfillable, 0),
        fbaReserved: groupItems.reduce((sum, i) => sum + i.fbaReserved, 0),
        fbaInbound: groupItems.reduce(
          (sum, i) => sum + i.fbaInboundWorking + i.fbaInboundShipped + i.fbaInboundReceiving,
          0
        ),
        awdTotal: groupItems.reduce((sum, i) => sum + i.awdQuantity, 0),
      })
    })

    // Sort: marketplace by code, ASIN alphabetically
    result.sort((a, b) => a.key.localeCompare(b.key))
    return result
  }, [filteredItems, groupBy])

  // Toggle group expansion
  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  // Expand/collapse all groups
  const toggleAllGroups = () => {
    if (expandedGroups.size === groupedItems.length) {
      setExpandedGroups(new Set())
    } else {
      setExpandedGroups(new Set(groupedItems.map((g) => g.key)))
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {/* FBA Fulfillable */}
        <div className="bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 px-4 py-3">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
            FBA Fulfillable
          </p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            {filteredSummary.fbaFulfillableTotal.toLocaleString()}
          </p>
        </div>

        {/* FBA Reserved */}
        <div className="bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 px-4 py-3">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
            FBA Reserved
          </p>
          <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">
            {filteredSummary.fbaReservedTotal.toLocaleString()}
          </p>
        </div>

        {/* FBA Inbound */}
        <div className="bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 px-4 py-3">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
            FBA Inbound
          </p>
          <p className="mt-1 text-2xl font-semibold text-blue-600 dark:text-blue-400">
            {filteredSummary.fbaInboundTotal.toLocaleString()}
          </p>
        </div>

        {/* FBA Unfulfillable */}
        <div className="bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 px-4 py-3">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
            FBA Unfulfillable
          </p>
          <p className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">
            {filteredSummary.fbaUnfulfillableTotal.toLocaleString()}
          </p>
        </div>

        {/* AWD Total */}
        <div className="bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 px-4 py-3">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
            AWD Total
          </p>
          <p className="mt-1 text-2xl font-semibold text-violet-600 dark:text-violet-400">
            {filteredSummary.awdTotal.toLocaleString()}
          </p>
        </div>

        {/* AWD Inbound */}
        <div className="bg-white dark:bg-stone-800 rounded-lg border border-stone-200 dark:border-stone-700 px-4 py-3">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">
            AWD Inbound
          </p>
          <p className="mt-1 text-2xl font-semibold text-violet-600 dark:text-violet-400">
            {filteredSummary.awdInboundTotal.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search ASIN, SKU, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            />
          </div>

          {/* Marketplace Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowMarketplaceDropdown(!showMarketplaceDropdown)
                setShowMappingDropdown(false)
                setShowConditionDropdown(false)
                setShowGroupByDropdown(false)
              }}
              className="inline-flex items-center gap-2 px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600"
            >
              <span>
                {marketplaceFilter === 'all'
                  ? 'All Markets'
                  : marketplaceStyles[marketplaceFilter].code}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showMarketplaceDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMarketplaceDropdown(false)}
                />
                <div className="absolute top-full left-0 mt-1 z-20 w-44 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg py-1">
                  <button
                    onClick={() => {
                      setMarketplaceFilter('all')
                      setShowMarketplaceDropdown(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-stone-50 dark:hover:bg-stone-700 ${
                      marketplaceFilter === 'all'
                        ? 'text-lime-600 dark:text-lime-400 font-medium'
                        : 'text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    All Markets
                  </button>
                  {(Object.keys(marketplaceStyles) as AmazonMarketplace[]).map((mp) => (
                    <button
                      key={mp}
                      onClick={() => {
                        setMarketplaceFilter(mp)
                        setShowMarketplaceDropdown(false)
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-stone-50 dark:hover:bg-stone-700 ${
                        marketplaceFilter === mp
                          ? 'text-lime-600 dark:text-lime-400 font-medium'
                          : 'text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {marketplaceStyles[mp].code} — {marketplaceStyles[mp].label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Mapping Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowMappingDropdown(!showMappingDropdown)
                setShowConditionDropdown(false)
                setShowMarketplaceDropdown(false)
                setShowGroupByDropdown(false)
              }}
              className="inline-flex items-center gap-2 px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600"
            >
              <span>
                {mappingFilter === 'all'
                  ? 'All Status'
                  : mappingFilter === 'mapped'
                    ? 'Linked'
                    : 'Unlinked'}
              </span>
              {summary.unmappedSkuCount > 0 && mappingFilter === 'all' && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-full">
                  {summary.unmappedSkuCount}
                </span>
              )}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showMappingDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMappingDropdown(false)}
                />
                <div className="absolute top-full left-0 mt-1 z-20 w-40 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg py-1">
                  {(['all', 'mapped', 'unmapped'] as MappingFilter[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {
                        setMappingFilter(filter)
                        setShowMappingDropdown(false)
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-stone-50 dark:hover:bg-stone-700 ${
                        mappingFilter === filter
                          ? 'text-lime-600 dark:text-lime-400 font-medium'
                          : 'text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {filter === 'all' ? 'All Status' : filter === 'mapped' ? 'Linked' : 'Unlinked'}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Condition Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowConditionDropdown(!showConditionDropdown)
                setShowMappingDropdown(false)
                setShowMarketplaceDropdown(false)
                setShowGroupByDropdown(false)
              }}
              className="inline-flex items-center gap-2 px-3 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600"
            >
              <span>
                {conditionFilter === 'all'
                  ? 'All Conditions'
                  : conditionStyles[conditionFilter].label}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showConditionDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowConditionDropdown(false)}
                />
                <div className="absolute top-full left-0 mt-1 z-20 w-40 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg py-1">
                  <button
                    onClick={() => {
                      setConditionFilter('all')
                      setShowConditionDropdown(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-stone-50 dark:hover:bg-stone-700 ${
                      conditionFilter === 'all'
                        ? 'text-lime-600 dark:text-lime-400 font-medium'
                        : 'text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    All Conditions
                  </button>
                  {(Object.keys(conditionStyles) as AmazonCondition[]).map((condition) => (
                    <button
                      key={condition}
                      onClick={() => {
                        setConditionFilter(condition)
                        setShowConditionDropdown(false)
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-stone-50 dark:hover:bg-stone-700 ${
                        conditionFilter === condition
                          ? 'text-lime-600 dark:text-lime-400 font-medium'
                          : 'text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {conditionStyles[condition].label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-stone-200 dark:bg-stone-600" />

          {/* Group By */}
          <div className="relative">
            <button
              onClick={() => {
                setShowGroupByDropdown(!showGroupByDropdown)
                setShowMappingDropdown(false)
                setShowConditionDropdown(false)
                setShowMarketplaceDropdown(false)
              }}
              className={`inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
                groupBy !== 'none'
                  ? 'bg-lime-50 dark:bg-lime-900/20 border-lime-300 dark:border-lime-700 text-lime-700 dark:text-lime-400'
                  : 'bg-stone-50 dark:bg-stone-700 border-stone-200 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-600'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>
                {groupBy === 'none'
                  ? 'Group by'
                  : groupBy === 'marketplace'
                    ? 'By Market'
                    : 'By ASIN'}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showGroupByDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowGroupByDropdown(false)}
                />
                <div className="absolute top-full left-0 mt-1 z-20 w-44 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg py-1">
                  <button
                    onClick={() => {
                      setGroupBy('none')
                      setExpandedGroups(new Set())
                      setShowGroupByDropdown(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-stone-50 dark:hover:bg-stone-700 ${
                      groupBy === 'none'
                        ? 'text-lime-600 dark:text-lime-400 font-medium'
                        : 'text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    None (flat list)
                  </button>
                  <button
                    onClick={() => {
                      setGroupBy('marketplace')
                      setExpandedGroups(new Set())
                      setShowGroupByDropdown(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-stone-50 dark:hover:bg-stone-700 ${
                      groupBy === 'marketplace'
                        ? 'text-lime-600 dark:text-lime-400 font-medium'
                        : 'text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    By Marketplace
                  </button>
                  <button
                    onClick={() => {
                      setGroupBy('asin')
                      setExpandedGroups(new Set())
                      setShowGroupByDropdown(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-stone-50 dark:hover:bg-stone-700 ${
                      groupBy === 'asin'
                        ? 'text-lime-600 dark:text-lime-400 font-medium'
                        : 'text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    By ASIN
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Sync Status */}
        <AmazonSyncStatus
          lastSyncedAt={summary.lastSyncedAt}
          status={syncStatus}
          onSync={onSync}
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-700/50 border-b border-stone-200 dark:border-stone-600">
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider w-20">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider w-16">
                  Mkt
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  ASIN
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  FNSKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  FBA Avail
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  FBA Rsrvd
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  FBA Inb
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  AWD
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  Internal SKU
                </th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-12 text-center">
                    <p className="text-stone-500 dark:text-stone-400">
                      {searchQuery || mappingFilter !== 'all' || conditionFilter !== 'all' || marketplaceFilter !== 'all'
                        ? 'No items match your filters'
                        : 'No Amazon inventory data'}
                    </p>
                  </td>
                </tr>
              ) : groupBy !== 'none' ? (
                // Grouped view
                <>
                  {/* Expand/Collapse All Row */}
                  <tr className="bg-stone-100 dark:bg-stone-700/80">
                    <td colSpan={13} className="px-4 py-2">
                      <button
                        onClick={toggleAllGroups}
                        className="text-xs font-medium text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
                      >
                        {expandedGroups.size === groupedItems.length ? 'Collapse All' : 'Expand All'} ({groupedItems.length} groups)
                      </button>
                    </td>
                  </tr>
                  {groupedItems.map((group) => {
                    const isExpanded = expandedGroups.has(group.key)
                    return (
                      <React.Fragment key={group.key}>
                        {/* Group Header */}
                        <tr
                          onClick={() => toggleGroup(group.key)}
                          className="bg-stone-50 dark:bg-stone-700/50 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-700"
                        >
                          <td colSpan={7} className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-stone-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-stone-500" />
                              )}
                              <span className="font-medium text-stone-900 dark:text-white">
                                {group.label}
                              </span>
                              <span className="text-xs text-stone-500 dark:text-stone-400">
                                ({group.items.length} item{group.items.length !== 1 ? 's' : ''})
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                              {group.fbaFulfillable.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            <span className="text-sm text-amber-600 dark:text-amber-400">
                              {group.fbaReserved.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            <span className="text-sm text-blue-600 dark:text-blue-400">
                              {group.fbaInbound.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            <span className="text-sm text-violet-600 dark:text-violet-400">
                              {group.awdTotal.toLocaleString()}
                            </span>
                          </td>
                          <td colSpan={2} />
                        </tr>
                        {/* Group Items */}
                        {isExpanded &&
                          group.items.map((item) => {
                            const statusStyle = statusStyles[item.mappingStatus]
                            const conditionStyle = conditionStyles[item.condition]
                            const fbaInbound =
                              item.fbaInboundWorking + item.fbaInboundShipped + item.fbaInboundReceiving

                            return (
                              <tr
                                key={`${item.asin}-${item.sellerSku}`}
                                className={`hover:bg-stone-50 dark:hover:bg-stone-700/50 ${
                                  item.mappingStatus === 'unmapped'
                                    ? 'bg-amber-50/50 dark:bg-amber-900/10'
                                    : ''
                                }`}
                              >
                                {/* Status */}
                                <td className="px-4 py-3 pl-10">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-2.5 h-2.5 rounded-full ${statusStyle.bg}`}
                                      title={statusStyle.text}
                                    />
                                    <span className="text-xs text-stone-500 dark:text-stone-400">
                                      {statusStyle.text}
                                    </span>
                                  </div>
                                </td>

                                {/* Marketplace */}
                                <td className="px-4 py-3 text-center">
                                  <span
                                    title={marketplaceStyles[item.marketplace].label}
                                    className="text-xs font-medium text-stone-600 dark:text-stone-400"
                                  >
                                    {marketplaceStyles[item.marketplace].code}
                                  </span>
                                </td>

                                {/* ASIN */}
                                <td className="px-4 py-3">
                                  <span className="font-mono text-sm text-stone-900 dark:text-white">
                                    {item.asin}
                                  </span>
                                </td>

                                {/* FNSKU */}
                                <td className="px-4 py-3">
                                  <span className="font-mono text-sm text-stone-600 dark:text-stone-400">
                                    {item.fnsku || '—'}
                                  </span>
                                </td>

                                {/* Product Name */}
                                <td className="px-4 py-3 max-w-xs">
                                  <p className="text-sm text-stone-900 dark:text-white truncate">
                                    {item.productName}
                                  </p>
                                  <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                                    {item.sellerSku}
                                  </p>
                                </td>

                                {/* Brand */}
                                <td className="px-4 py-3">
                                  <span className="text-sm text-stone-600 dark:text-stone-400">
                                    {item.brandName || '—'}
                                  </span>
                                </td>

                                {/* Condition */}
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${conditionStyle.bg} ${conditionStyle.text}`}
                                  >
                                    {conditionStyle.label}
                                  </span>
                                </td>

                                {/* FBA Fulfillable */}
                                <td className="px-4 py-3 text-right tabular-nums">
                                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                    {item.fbaFulfillable.toLocaleString()}
                                  </span>
                                </td>

                                {/* FBA Reserved */}
                                <td className="px-4 py-3 text-right tabular-nums">
                                  <span className="text-sm text-amber-600 dark:text-amber-400">
                                    {item.fbaReserved.toLocaleString()}
                                  </span>
                                </td>

                                {/* FBA Inbound */}
                                <td className="px-4 py-3 text-right tabular-nums">
                                  <span className="text-sm text-blue-600 dark:text-blue-400">
                                    {fbaInbound.toLocaleString()}
                                  </span>
                                </td>

                                {/* AWD */}
                                <td className="px-4 py-3 text-right tabular-nums">
                                  <span className="text-sm text-violet-600 dark:text-violet-400">
                                    {item.awdQuantity.toLocaleString()}
                                  </span>
                                </td>

                                {/* Internal SKU */}
                                <td className="px-4 py-3">
                                  {item.internalSkuId ? (
                                    <span className="font-mono text-sm text-stone-600 dark:text-stone-400">
                                      {item.internalSkuId}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-stone-400 dark:text-stone-500">—</span>
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-end gap-1">
                                    {item.mappingStatus === 'unmapped' && onMapSku && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onMapSku(item.sellerSku)
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-lime-600 dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 rounded transition-colors"
                                        title="Link to catalog"
                                      >
                                        <Link2 className="w-3.5 h-3.5" />
                                        Link
                                      </button>
                                    )}
                                    {item.mappingStatus === 'mapped' && onUnmapSku && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onUnmapSku(item.sellerSku)
                                        }}
                                        className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition-colors"
                                        title="Unlink from catalog"
                                      >
                                        <Unlink className="w-4 h-4" />
                                      </button>
                                    )}
                                    {onViewAmazonItem && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onViewAmazonItem(item.asin)
                                        }}
                                        className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition-colors"
                                        title="View on Amazon"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                      </React.Fragment>
                    )
                  })}
                </>
              ) : (
                // Flat list view
                filteredItems.map((item) => {
                  const statusStyle = statusStyles[item.mappingStatus]
                  const conditionStyle = conditionStyles[item.condition]
                  const fbaInbound =
                    item.fbaInboundWorking + item.fbaInboundShipped + item.fbaInboundReceiving

                  return (
                    <tr
                      key={`${item.asin}-${item.sellerSku}`}
                      className={`hover:bg-stone-50 dark:hover:bg-stone-700/50 ${
                        item.mappingStatus === 'unmapped'
                          ? 'bg-amber-50/50 dark:bg-amber-900/10'
                          : ''
                      }`}
                    >
                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${statusStyle.bg}`}
                            title={statusStyle.text}
                          />
                          <span className="text-xs text-stone-500 dark:text-stone-400">
                            {statusStyle.text}
                          </span>
                        </div>
                      </td>

                      {/* Marketplace */}
                      <td className="px-4 py-3 text-center">
                        <span
                          title={marketplaceStyles[item.marketplace].label}
                          className="text-xs font-medium text-stone-600 dark:text-stone-400"
                        >
                          {marketplaceStyles[item.marketplace].code}
                        </span>
                      </td>

                      {/* ASIN */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-stone-900 dark:text-white">
                          {item.asin}
                        </span>
                      </td>

                      {/* FNSKU */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-stone-600 dark:text-stone-400">
                          {item.fnsku || '—'}
                        </span>
                      </td>

                      {/* Product Name */}
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-sm text-stone-900 dark:text-white truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                          {item.sellerSku}
                        </p>
                      </td>

                      {/* Brand */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-stone-600 dark:text-stone-400">
                          {item.brandName || '—'}
                        </span>
                      </td>

                      {/* Condition */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${conditionStyle.bg} ${conditionStyle.text}`}
                        >
                          {conditionStyle.label}
                        </span>
                      </td>

                      {/* FBA Fulfillable */}
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          {item.fbaFulfillable.toLocaleString()}
                        </span>
                      </td>

                      {/* FBA Reserved */}
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="text-sm text-amber-600 dark:text-amber-400">
                          {item.fbaReserved.toLocaleString()}
                        </span>
                      </td>

                      {/* FBA Inbound */}
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="text-sm text-blue-600 dark:text-blue-400">
                          {fbaInbound.toLocaleString()}
                        </span>
                      </td>

                      {/* AWD */}
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="text-sm text-violet-600 dark:text-violet-400">
                          {item.awdQuantity.toLocaleString()}
                        </span>
                      </td>

                      {/* Internal SKU */}
                      <td className="px-4 py-3">
                        {item.internalSkuId ? (
                          <span className="font-mono text-sm text-stone-600 dark:text-stone-400">
                            {item.internalSkuId}
                          </span>
                        ) : (
                          <span className="text-sm text-stone-400 dark:text-stone-500">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {item.mappingStatus === 'unmapped' && onMapSku && (
                            <button
                              onClick={() => onMapSku(item.sellerSku)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-lime-600 dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 rounded transition-colors"
                              title="Link to catalog"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                              Link
                            </button>
                          )}
                          {item.mappingStatus === 'mapped' && onUnmapSku && (
                            <button
                              onClick={() => onUnmapSku(item.sellerSku)}
                              className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition-colors"
                              title="Unlink from catalog"
                            >
                              <Unlink className="w-4 h-4" />
                            </button>
                          )}
                          {onViewAmazonItem && (
                            <button
                              onClick={() => onViewAmazonItem(item.asin)}
                              className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition-colors"
                              title="View on Amazon"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
