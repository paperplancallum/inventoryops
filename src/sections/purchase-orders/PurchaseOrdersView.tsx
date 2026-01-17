'use client'

import { useState } from 'react'
import { Plus, Search, Filter, ChevronDown, RefreshCw, ClipboardCheck } from 'lucide-react'
import type { PurchaseOrdersProps, POStatus } from './types'
import { POTableRow } from './POTableRow'

export function PurchaseOrdersView({
  purchaseOrders,
  poStatuses,
  suppliers,
  onViewPO,
  onEditPO,
  onDeletePO,
  onCreatePO,
  onDuplicatePO,
  onExportPDF,
  onSendToSupplier,
  onUpdateStatus,
  onAddToInspection,
  onViewInspection,
  onRefresh,
  loading = false,
}: PurchaseOrdersProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<POStatus | 'all'>('all')
  const [supplierFilter, setSupplierFilter] = useState<string | 'all'>('all')
  const [sortField, setSortField] = useState<'orderDate' | 'expectedDate' | 'total'>('orderDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedPOIds, setSelectedPOIds] = useState<Set<string>>(new Set())

  // Filter and search POs
  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesSearch =
      searchQuery === '' ||
      po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.lineItems.some((li) => li.sku.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || po.status === statusFilter
    const matchesSupplier = supplierFilter === 'all' || po.supplierId === supplierFilter

    return matchesSearch && matchesStatus && matchesSupplier
  })

  // Sort POs
  const sortedPOs = [...filteredPOs].sort((a, b) => {
    let comparison = 0
    if (sortField === 'orderDate') {
      comparison = new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
    } else if (sortField === 'expectedDate') {
      comparison = new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime()
    } else if (sortField === 'total') {
      comparison = a.total - b.total
    }
    return sortDirection === 'desc' ? -comparison : comparison
  })

  const handleSort = (field: 'orderDate' | 'expectedDate' | 'total') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPOIds(new Set(sortedPOs.map(po => po.id)))
    } else {
      setSelectedPOIds(new Set())
    }
  }

  const handleSelectPO = (poId: string, selected: boolean) => {
    const newSelection = new Set(selectedPOIds)
    if (selected) {
      newSelection.add(poId)
    } else {
      newSelection.delete(poId)
    }
    setSelectedPOIds(newSelection)
  }

  const handleAddToInspection = () => {
    if (selectedPOIds.size > 0) {
      onAddToInspection?.(Array.from(selectedPOIds))
      setSelectedPOIds(new Set()) // Clear selection after action
    }
  }

  const isAllSelected = sortedPOs.length > 0 && sortedPOs.every(po => selectedPOIds.has(po.id))
  const isSomeSelected = selectedPOIds.size > 0

  // Calculate summary stats
  const totalPOs = purchaseOrders.length
  const draftCount = purchaseOrders.filter((po) => po.status === 'draft').length
  const pendingCount = purchaseOrders.filter((po) =>
    ['sent', 'confirmed'].includes(po.status)
  ).length
  const totalValue = purchaseOrders.reduce((sum, po) => sum + po.total, 0)

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      {/* Header */}
      <div className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-stone-900 dark:text-white">
                Purchase Orders
              </h1>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                Create and track orders with suppliers
              </p>
            </div>
            <div className="flex items-center gap-3">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className="p-2 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              )}
              {isSomeSelected && (
                <button
                  onClick={handleAddToInspection}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  Add to Inspection ({selectedPOIds.size})
                </button>
              )}
              <button
                onClick={() => onCreatePO?.()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-lime-600 hover:bg-lime-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                New Purchase Order
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Total POs
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                {totalPOs}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Drafts
              </p>
              <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">
                {draftCount}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Pending
              </p>
              <p className="mt-1 text-2xl font-semibold text-indigo-600 dark:text-indigo-400">
                {pendingCount}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Total Value
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                ${totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 pb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by PO#, supplier, or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as POStatus | 'all')}
                className="appearance-none pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
              >
                <option value="all">All statuses</option>
                {poStatuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Filter className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Supplier Filter */}
            <div className="relative">
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="appearance-none pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
              >
                <option value="all">All suppliers</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500 dark:bg-slate-700"
                    />
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Items
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    <button
                      onClick={() => handleSort('orderDate')}
                      className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      Order Date
                      {sortField === 'orderDate' && (
                        <span
                          className={`transition-transform ${
                            sortDirection === 'desc' ? 'rotate-180' : ''
                          }`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </span>
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
                        <span
                          className={`transition-transform ${
                            sortDirection === 'desc' ? 'rotate-180' : ''
                          }`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    <button
                      onClick={() => handleSort('total')}
                      className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      Total
                      {sortField === 'total' && (
                        <span
                          className={`transition-transform ${
                            sortDirection === 'desc' ? 'rotate-180' : ''
                          }`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Insp. Required
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Insp. Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Inspection
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {sortedPOs.map((po) => (
                  <POTableRow
                    key={po.id}
                    po={po}
                    poStatuses={poStatuses}
                    isSelected={selectedPOIds.has(po.id)}
                    onSelectChange={(selected) => handleSelectPO(po.id, selected)}
                    onView={() => onViewPO?.(po.id)}
                    onEdit={() => onEditPO?.(po.id)}
                    onDelete={() => onDeletePO?.(po.id)}
                    onDuplicate={() => onDuplicatePO?.(po.id)}
                    onExportPDF={() => onExportPDF?.(po.id)}
                    onSendToSupplier={() => onSendToSupplier?.(po.id)}
                    onUpdateStatus={(newStatus) => onUpdateStatus?.(po.id, newStatus)}
                    onViewInspection={po.inspectionId ? () => onViewInspection?.(po.inspectionId!) : undefined}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {sortedPOs.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No purchase orders found matching your criteria
              </p>
            </div>
          )}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-indigo-600 dark:text-indigo-400">
              Showing {sortedPOs.length} of {purchaseOrders.length} purchase orders
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
