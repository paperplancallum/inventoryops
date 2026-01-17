import { useState, useMemo } from 'react'
import type {
  POLineItemFlat,
  POStatusOption,
  Supplier,
  LineItemsSummary,
} from '@/../product/sections/purchase-orders/types'
import { LineItemsSummaryCards } from './LineItemsSummaryCards'
import { LineItemsTable } from './LineItemsTable'
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox'

// Icons
const SearchIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

interface LineItemsViewProps {
  lineItems: POLineItemFlat[]
  poStatuses: POStatusOption[]
  suppliers: Supplier[]
  onViewPO?: (poId: string) => void
}

export function LineItemsView({
  lineItems,
  poStatuses,
  suppliers,
  onViewPO,
}: LineItemsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [supplierFilters, setSupplierFilters] = useState<string[]>([])
  const [skuFilters, setSkuFilters] = useState<string[]>([])
  const [sortField, setSortField] = useState<'sku' | 'quantity' | 'unitCost' | 'subtotal' | 'expectedDate'>('expectedDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Get unique SKUs for the filter dropdown
  const uniqueSkus = useMemo(() => {
    const skus = [...new Set(lineItems.map((item) => item.sku))].sort()
    return skus
  }, [lineItems])

  // Filter line items
  const filteredLineItems = useMemo(() => {
    return lineItems.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.poNumber.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(item.status)
      const matchesSupplier = supplierFilters.length === 0 || supplierFilters.includes(item.supplierId)
      const matchesSku = skuFilters.length === 0 || skuFilters.includes(item.sku)

      return matchesSearch && matchesStatus && matchesSupplier && matchesSku
    })
  }, [lineItems, searchQuery, statusFilters, supplierFilters, skuFilters])

  // Sort line items
  const sortedLineItems = useMemo(() => {
    return [...filteredLineItems].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'sku':
          comparison = a.sku.localeCompare(b.sku)
          break
        case 'quantity':
          comparison = a.quantity - b.quantity
          break
        case 'unitCost':
          comparison = a.unitCost - b.unitCost
          break
        case 'subtotal':
          comparison = a.subtotal - b.subtotal
          break
        case 'expectedDate':
          comparison = new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime()
          break
      }
      return sortDirection === 'desc' ? -comparison : comparison
    })
  }, [filteredLineItems, sortField, sortDirection])

  // Calculate summary stats
  const summary: LineItemsSummary = useMemo(() => {
    return {
      totalLineItems: filteredLineItems.length,
      totalUnits: filteredLineItems.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: filteredLineItems.reduce((sum, item) => sum + item.subtotal, 0),
      uniqueProducts: new Set(filteredLineItems.map((item) => item.sku)).size,
    }
  }, [filteredLineItems])

  const handleSort = (field: 'sku' | 'quantity' | 'unitCost' | 'subtotal' | 'expectedDate') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <LineItemsSummaryCards summary={summary} />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search by SKU, product, or PO#..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* SKU Filter */}
        <MultiSelectCombobox
          options={uniqueSkus.map(sku => ({ value: sku, label: sku }))}
          selected={skuFilters}
          onChange={setSkuFilters}
          placeholder="All SKUs"
          searchPlaceholder="Search SKUs..."
        />

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

      {/* Table */}
      <LineItemsTable
        lineItems={sortedLineItems}
        poStatuses={poStatuses}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
        onViewPO={onViewPO}
      />
    </div>
  )
}
