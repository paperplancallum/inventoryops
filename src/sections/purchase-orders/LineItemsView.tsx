'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronDown, Package, DollarSign, Layers, Building } from 'lucide-react'
import type { LineItemsViewProps, POStatus } from './types'

const statusColors: Record<POStatus, { bg: string; text: string; dot: string }> = {
  draft: {
    bg: 'bg-slate-100 dark:bg-slate-700',
    text: 'text-slate-700 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
  sent: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  awaiting_invoice: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    dot: 'bg-yellow-500',
  },
  invoice_received: {
    bg: 'bg-lime-100 dark:bg-lime-900/30',
    text: 'text-lime-700 dark:text-lime-300',
    dot: 'bg-lime-500',
  },
  confirmed: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    dot: 'bg-indigo-500',
  },
  'production_complete': {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    text: 'text-teal-700 dark:text-teal-300',
    dot: 'bg-teal-500',
  },
  'ready-to-ship': {
    bg: 'bg-cyan-100 dark:bg-cyan-900/30',
    text: 'text-cyan-700 dark:text-cyan-300',
    dot: 'bg-cyan-500',
  },
  'partially-received': {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  received: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  cancelled: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
  },
}

export function LineItemsView({
  lineItems,
  summary,
  poStatuses,
  suppliers,
  onViewPO,
}: LineItemsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<POStatus | 'all'>('all')
  const [supplierFilter, setSupplierFilter] = useState<string | 'all'>('all')
  const [sortField, setSortField] = useState<'sku' | 'quantity' | 'subtotal' | 'expectedDate'>('expectedDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Filter line items
  const filteredItems = useMemo(() => {
    return lineItems.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.poNumber.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || item.poStatus === statusFilter
      const matchesSupplier = supplierFilter === 'all' || item.supplierId === supplierFilter

      return matchesSearch && matchesStatus && matchesSupplier
    })
  }, [lineItems, searchQuery, statusFilter, supplierFilter])

  // Sort line items
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let comparison = 0
      if (sortField === 'sku') {
        comparison = a.sku.localeCompare(b.sku)
      } else if (sortField === 'quantity') {
        comparison = a.quantity - b.quantity
      } else if (sortField === 'subtotal') {
        comparison = a.subtotal - b.subtotal
      } else if (sortField === 'expectedDate') {
        comparison = new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime()
      }
      return sortDirection === 'desc' ? -comparison : comparison
    })
  }, [filteredItems, sortField, sortDirection])

  const handleSort = (field: 'sku' | 'quantity' | 'subtotal' | 'expectedDate') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
            <Package className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Total Items</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {summary.totalItems.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
            <Layers className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Total Units</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {summary.totalUnits.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Total Value</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            ${summary.totalValue.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
            <Building className="w-4 h-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Unique Products</span>
          </div>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {summary.uniqueProducts.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by SKU, product, or PO#..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as POStatus | 'all')}
            className="appearance-none px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
          >
            <option value="all">All statuses</option>
            {poStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
          </select>

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="appearance-none px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
          >
            <option value="all">All suppliers</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('sku')}
                    className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  PO #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Supplier
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('quantity')}
                    className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
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
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Unit Cost
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('subtotal')}
                    className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    Subtotal
                    {sortField === 'subtotal' && (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          sortDirection === 'desc' ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  <button
                    onClick={() => handleSort('expectedDate')}
                    className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    Expected
                    {sortField === 'expectedDate' && (
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {sortedItems.map((item) => {
                const statusStyle = statusColors[item.poStatus]
                const statusLabel = poStatuses.find((s) => s.id === item.poStatus)?.label || item.poStatus

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-slate-600 dark:text-slate-400">
                      {item.sku}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                      {item.productName}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onViewPO?.(item.poId)}
                        className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                      >
                        {item.poNumber}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {item.supplierName}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-400">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-400">
                      ${item.unitCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-slate-900 dark:text-white">
                      ${item.subtotal.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {formatDate(item.expectedDate)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {sortedItems.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No line items found matching your criteria
            </p>
          </div>
        )}
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing {sortedItems.length} of {lineItems.length} line items
          </p>
        </div>
      </div>
    </div>
  )
}
