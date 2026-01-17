'use client'

import { useState, useMemo } from 'react'
import { RefreshCw, Link2, Link2Off, Search, Filter, AlertTriangle } from 'lucide-react'
import type {
  AmazonInventoryItem,
  AmazonInventorySummary,
} from '@/lib/supabase/hooks/useAmazonInventory'

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

export function AmazonInventoryTable({
  inventory,
  summary,
  loading,
  syncing,
  lastSyncAt,
  onSync,
  onMapSku,
  onUnmapSku,
}: AmazonInventoryTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

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

      return matchesSearch && matchesFilter
    })
  }, [inventory, searchQuery, filter])

  const formatNumber = (n: number) => n.toLocaleString()

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <div className="bg-white dark:bg-stone-800 rounded-lg px-4 py-3 border border-stone-200 dark:border-stone-700">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase">Total Items</p>
          <p className="mt-1 text-xl font-semibold text-stone-900 dark:text-white">{formatNumber(summary.totalItems)}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-4 py-3 border border-emerald-200 dark:border-emerald-800">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase">FBA Fulfillable</p>
          <p className="mt-1 text-xl font-semibold text-emerald-700 dark:text-emerald-300">{formatNumber(summary.totalFbaFulfillable)}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg px-4 py-3 border border-amber-200 dark:border-amber-800">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase">Reserved</p>
          <p className="mt-1 text-xl font-semibold text-amber-700 dark:text-amber-300">{formatNumber(summary.totalFbaReserved)}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-3 border border-blue-200 dark:border-blue-800">
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">Inbound</p>
          <p className="mt-1 text-xl font-semibold text-blue-700 dark:text-blue-300">{formatNumber(summary.totalFbaInbound)}</p>
        </div>
        <div className="bg-lime-50 dark:bg-lime-900/20 rounded-lg px-4 py-3 border border-lime-200 dark:border-lime-800">
          <p className="text-xs font-medium text-lime-600 dark:text-lime-400 uppercase">Mapped</p>
          <p className="mt-1 text-xl font-semibold text-lime-700 dark:text-lime-300">{formatNumber(summary.mappedCount)}</p>
        </div>
        <div className="bg-stone-50 dark:bg-stone-700/50 rounded-lg px-4 py-3 border border-stone-200 dark:border-stone-600">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase">Unmapped</p>
          <p className="mt-1 text-xl font-semibold text-stone-700 dark:text-stone-300">{formatNumber(summary.unmappedCount)}</p>
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
              <thead>
                <tr className="bg-stone-100 dark:bg-stone-700 text-left text-xs font-medium uppercase text-stone-500 dark:text-stone-400">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">ASIN / SKU</th>
                  <th className="py-3 px-4 text-right">Fulfillable</th>
                  <th className="py-3 px-4 text-right">Reserved</th>
                  <th className="py-3 px-4 text-right">Inbound</th>
                  <th className="py-3 px-4 text-right">Unfulfillable</th>
                  <th className="py-3 px-4 text-center">Mapping</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-700">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50 dark:hover:bg-stone-700/50">
                    <td className="py-3 px-4">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-stone-900 dark:text-white truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {item.condition}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-mono text-stone-900 dark:text-white">{item.asin}</p>
                      <p className="text-xs font-mono text-lime-600 dark:text-lime-400">{item.sellerSku}</p>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatNumber(item.fbaFulfillable)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-sm text-stone-600 dark:text-stone-400">
                      {formatNumber(item.fbaReserved)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-sm text-stone-600 dark:text-stone-400">
                      {formatNumber(item.fbaInboundWorking + item.fbaInboundShipped + item.fbaInboundReceiving)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      {item.fbaUnfulfillable > 0 ? (
                        <span className="text-sm text-red-600 dark:text-red-400">
                          {formatNumber(item.fbaUnfulfillable)}
                        </span>
                      ) : (
                        <span className="text-sm text-stone-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.mappingStatus === 'mapped' ? (
                        <button
                          onClick={() => onUnmapSku(item.sellerSku)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300 rounded text-xs font-medium hover:bg-lime-200 dark:hover:bg-lime-900/50 transition-colors"
                        >
                          <Link2 className="w-3 h-3" />
                          Mapped
                        </button>
                      ) : (
                        <button
                          onClick={() => onMapSku(item)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded text-xs font-medium hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
                        >
                          <Link2Off className="w-3 h-3" />
                          Map SKU
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
