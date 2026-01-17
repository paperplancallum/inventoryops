import { useState, useMemo } from 'react'
import type {
  PurchaseOrdersProps,
  POViewTab,
  POLineItemFlat,
} from '@/../product/sections/purchase-orders/types'
import { POTableRow } from './POTableRow'
import { POViewTabs } from './POViewTabs'
import { LineItemsView } from './LineItemsView'
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox'

// Icons
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

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
  onScheduleInspection,
}: PurchaseOrdersProps) {
  const [activeTab, setActiveTab] = useState<POViewTab>('purchase-orders')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [supplierFilters, setSupplierFilters] = useState<string[]>([])
  const [sortField, setSortField] = useState<'orderDate' | 'expectedDate' | 'total'>('orderDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Flatten line items from all POs for the Line Items view
  const flattenedLineItems: POLineItemFlat[] = useMemo(() => {
    return purchaseOrders.flatMap((po) =>
      po.lineItems.map((item) => ({
        lineItemId: item.id,
        sku: item.sku,
        productName: item.productName,
        quantity: item.quantity,
        unitCost: item.unitCost,
        subtotal: item.subtotal,
        poId: po.id,
        poNumber: po.poNumber,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        status: po.status,
        orderDate: po.orderDate,
        expectedDate: po.expectedDate,
      }))
    )
  }, [purchaseOrders])

  // Filter and search POs
  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = searchQuery === '' ||
      po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.lineItems.some(li => li.sku.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(po.status)
    const matchesSupplier = supplierFilters.length === 0 || supplierFilters.includes(po.supplierId)

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

  // Calculate summary stats
  const totalPOs = purchaseOrders.length
  const draftCount = purchaseOrders.filter(po => po.status === 'draft').length
  const pendingCount = purchaseOrders.filter(po => ['sent', 'confirmed'].includes(po.status)).length
  const totalValue = purchaseOrders.reduce((sum, po) => sum + po.total, 0)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Purchase Orders
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Create and track orders with suppliers
              </p>
            </div>
            <button
              onClick={() => onCreatePO?.()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <PlusIcon />
              New Purchase Order
            </button>
          </div>

          {/* Stats Row */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total POs</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{totalPOs}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Drafts</p>
              <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">{draftCount}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Pending</p>
              <p className="mt-1 text-2xl font-semibold text-indigo-600 dark:text-indigo-400">{pendingCount}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Value</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                ${totalValue.toLocaleString()}
              </p>
            </div>
          </div>

          {/* View Tabs */}
          <div className="mt-6">
            <POViewTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              poCount={purchaseOrders.length}
              lineItemCount={flattenedLineItems.length}
            />
          </div>
        </div>

        {/* PO Filters - only show when on purchase-orders tab */}
        {activeTab === 'purchase-orders' && (
        <div className="px-6 pb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
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
            <MultiSelectCombobox
              options={poStatuses.map(status => ({ value: status.id, label: status.label }))}
              selected={statusFilters}
              onChange={setStatusFilters}
              placeholder="All statuses"
              searchPlaceholder="Search statuses..."
            />

            {/* Supplier Filter */}
            <MultiSelectCombobox
              options={suppliers.map(supplier => ({ value: supplier.id, label: supplier.name }))}
              selected={supplierFilters}
              onChange={setSupplierFilters}
              placeholder="All suppliers"
              searchPlaceholder="Search suppliers..."
            />
          </div>
        </div>
        )}
      </div>

      {/* Content */}
      {activeTab === 'purchase-orders' ? (
      <div className="p-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
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
                    Inspection
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    <button
                      onClick={() => handleSort('orderDate')}
                      className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      Order Date
                      {sortField === 'orderDate' && (
                        <span className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                          <ChevronDownIcon />
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
                        <span className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                          <ChevronDownIcon />
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
                        <span className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                          <ChevronDownIcon />
                        </span>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {sortedPOs.map(po => (
                  <POTableRow
                    key={po.id}
                    po={po}
                    poStatuses={poStatuses}
                    onView={() => onViewPO?.(po.id)}
                    onEdit={() => onEditPO?.(po.id)}
                    onDelete={() => onDeletePO?.(po.id)}
                    onDuplicate={() => onDuplicatePO?.(po.id)}
                    onExportPDF={() => onExportPDF?.(po.id)}
                    onSendToSupplier={() => onSendToSupplier?.(po.id)}
                    onUpdateStatus={(newStatus) => onUpdateStatus?.(po.id, newStatus)}
                    onScheduleInspection={() => onScheduleInspection?.(po.id)}
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
      ) : (
      <div className="p-6">
        <LineItemsView
          lineItems={flattenedLineItems}
          poStatuses={poStatuses}
          suppliers={suppliers}
          onViewPO={onViewPO}
        />
      </div>
      )}
    </div>
  )
}
