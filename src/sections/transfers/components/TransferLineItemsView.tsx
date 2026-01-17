'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronDown, Package, DollarSign, Layers } from 'lucide-react'
import type { TransferStatus, TransferLineItemStatus } from '../types'

// Flat line item type for the aggregated view
export interface TransferLineItemFlat {
  id: string
  transferId: string
  transferNumber: string
  transferStatus: TransferStatus
  sourceLocationName: string
  destinationLocationName: string
  shippingAgentId: string | null
  shippingAgentName: string | null
  batchId: string
  sku: string
  productName: string
  quantity: number
  unitCost: number
  totalCost: number
  status: TransferLineItemStatus
  receivedQuantity: number | null
  scheduledDepartureDate: string | null
  scheduledArrivalDate: string | null
}

export interface TransferLineItemsSummary {
  totalItems: number
  totalUnits: number
  totalValue: number
  uniqueProducts: number
  byStatus: { status: TransferStatus; count: number; value: number }[]
}

interface TransferLineItemsViewProps {
  lineItems: TransferLineItemFlat[]
  summary: TransferLineItemsSummary
  onViewTransfer?: (id: string) => void
  onViewAgent?: (id: string) => void
}

const statusColors: Record<TransferStatus, { bg: string; text: string; dot: string }> = {
  draft: {
    bg: 'bg-stone-100 dark:bg-stone-700',
    text: 'text-stone-700 dark:text-stone-300',
    dot: 'bg-stone-400',
  },
  booked: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  'in-transit': {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  delivered: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  completed: {
    bg: 'bg-lime-100 dark:bg-lime-900/30',
    text: 'text-lime-700 dark:text-lime-300',
    dot: 'bg-lime-500',
  },
  cancelled: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
  },
}

const statusLabels: Record<TransferStatus, string> = {
  draft: 'Draft',
  booked: 'Booked',
  'in-transit': 'In Transit',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function TransferLineItemsView({
  lineItems,
  summary,
  onViewTransfer,
  onViewAgent,
}: TransferLineItemsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<TransferStatus | 'all'>('all')
  const [sortField, setSortField] = useState<'sku' | 'quantity' | 'totalCost' | 'arrivalDate'>('arrivalDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Filter line items
  const filteredItems = useMemo(() => {
    return lineItems.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.transferNumber.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || item.transferStatus === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [lineItems, searchQuery, statusFilter])

  // Sort line items
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let comparison = 0
      if (sortField === 'sku') {
        comparison = a.sku.localeCompare(b.sku)
      } else if (sortField === 'quantity') {
        comparison = a.quantity - b.quantity
      } else if (sortField === 'totalCost') {
        comparison = a.totalCost - b.totalCost
      } else if (sortField === 'arrivalDate') {
        const aDate = a.scheduledArrivalDate ? new Date(a.scheduledArrivalDate).getTime() : Infinity
        const bDate = b.scheduledArrivalDate ? new Date(b.scheduledArrivalDate).getTime() : Infinity
        comparison = aDate - bDate
      }
      return sortDirection === 'desc' ? -comparison : comparison
    })
  }, [filteredItems, sortField, sortDirection])

  const handleSort = (field: 'sku' | 'quantity' | 'totalCost' | 'arrivalDate') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 mb-2">
            <Package className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Total Items</span>
          </div>
          <p className="text-2xl font-semibold text-stone-900 dark:text-white">
            {summary.totalItems.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 mb-2">
            <Layers className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Total Units</span>
          </div>
          <p className="text-2xl font-semibold text-stone-900 dark:text-white">
            {summary.totalUnits.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Total Value</span>
          </div>
          <p className="text-2xl font-semibold text-stone-900 dark:text-white">
            ${summary.totalValue.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-4">
          <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 mb-2">
            <Package className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Unique Products</span>
          </div>
          <p className="text-2xl font-semibold text-stone-900 dark:text-white">
            {summary.uniqueProducts.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-stone-400" />
          </div>
          <input
            type="text"
            placeholder="Search by SKU, product, or transfer#..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TransferStatus | 'all')}
            className="appearance-none px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent cursor-pointer"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="booked">Booked</option>
            <option value="in-transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('sku')}
                    className="inline-flex items-center gap-1 hover:text-stone-700 dark:hover:text-stone-200"
                  >
                    SKU
                    {sortField === 'sku' && (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          sortDirection === 'desc' ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Transfer #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  From
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  To
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Agent
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('quantity')}
                    className="inline-flex items-center gap-1 hover:text-stone-700 dark:hover:text-stone-200"
                  >
                    Qty
                    {sortField === 'quantity' && (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          sortDirection === 'desc' ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  Unit Cost
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('totalCost')}
                    className="inline-flex items-center gap-1 hover:text-stone-700 dark:hover:text-stone-200"
                  >
                    Total
                    {sortField === 'totalCost' && (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          sortDirection === 'desc' ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('arrivalDate')}
                    className="inline-flex items-center gap-1 hover:text-stone-700 dark:hover:text-stone-200"
                  >
                    ETA
                    {sortField === 'arrivalDate' && (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          sortDirection === 'desc' ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-700">
              {sortedItems.map((item) => {
                const statusStyle = statusColors[item.transferStatus]

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-lime-600 dark:text-lime-400">
                      {item.sku}
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-900 dark:text-white max-w-[200px] truncate">
                      {item.productName}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onViewTransfer?.(item.transferId)}
                        className="text-sm font-medium text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300"
                      >
                        {item.transferNumber}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600 dark:text-stone-400">
                      <span className="truncate block max-w-[120px]" title={item.sourceLocationName}>
                        {item.sourceLocationName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600 dark:text-stone-400">
                      <span className="truncate block max-w-[120px]" title={item.destinationLocationName}>
                        {item.destinationLocationName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.shippingAgentId && item.shippingAgentName ? (
                        <button
                          onClick={() => onViewAgent?.(item.shippingAgentId!)}
                          className="text-sm font-medium text-lime-600 dark:text-lime-400 hover:text-lime-800 dark:hover:text-lime-300 truncate block max-w-[100px]"
                          title={item.shippingAgentName}
                        >
                          {item.shippingAgentName}
                        </button>
                      ) : (
                        <span className="text-sm text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                        {statusLabels[item.transferStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums text-stone-600 dark:text-stone-400">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums text-stone-600 dark:text-stone-400">
                      ${item.unitCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right tabular-nums font-medium text-stone-900 dark:text-white">
                      ${item.totalCost.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600 dark:text-stone-400">
                      {formatDate(item.scheduledArrivalDate)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {sortedItems.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              No line items found matching your criteria
            </p>
          </div>
        )}
        <div className="px-4 py-3 border-t border-stone-200 dark:border-stone-700">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Showing {sortedItems.length} of {lineItems.length} line items
          </p>
        </div>
      </div>
    </div>
  )
}
