'use client'

import React, { useState, useMemo } from 'react'
import {
  Search,
  Plus,
  Upload,
  Download,
  MoreHorizontal,
  Pencil,
  Archive,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Filter,
  X,
  Package,
  List,
  Layers,
} from 'lucide-react'
import type { Product, SupplierReference, BrandReference, ProductType } from './types'
import { StockBreakdownPopover } from './StockBreakdownPopover'

// BOM data for grouped view
interface BOMComponentMapping {
  finishedProductId: string
  componentProductId: string
  quantityRequired: number
}

type ViewMode = 'flat' | 'grouped'

interface ProductsTableProps {
  products: Product[]
  suppliers: SupplierReference[]
  brands?: BrandReference[]
  selectedBrandId?: string | null
  onBrandFilterChange?: (brandId: string | null) => void
  getSupplierName: (supplierId: string) => string
  getBrandName?: (brandId: string) => string
  onCreate?: () => void
  onEdit?: (id: string) => void
  onArchive?: (id: string) => void
  onDelete?: (id: string) => void
  onImport?: () => void
  onExport?: () => void
  onSelectProduct?: (id: string) => void
  /** BOM component mappings for grouped view */
  bomMappings?: BOMComponentMapping[]
}

type SortKey = 'sku' | 'name' | 'unitCost' | 'stockLevel' | 'status'
type SortDir = 'asc' | 'desc'

const statusStyles: Record<Product['status'], { bg: string; text: string; label: string }> = {
  active: {
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    text: 'text-emerald-700 dark:text-emerald-400',
    label: 'active',
  },
  inactive: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    text: 'text-amber-700 dark:text-amber-400',
    label: 'inactive',
  },
  archived: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-500 dark:text-slate-400',
    label: 'archived',
  },
}

const typeStyles: Record<ProductType, { bg: string; text: string; label: string }> = {
  simple: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    label: 'Simple',
  },
  component: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    text: 'text-blue-700 dark:text-blue-400',
    label: 'Component',
  },
  finished_good: {
    bg: 'bg-purple-50 dark:bg-purple-950',
    text: 'text-purple-700 dark:text-purple-400',
    label: 'Finished',
  },
}

export function ProductsTable({
  products,
  suppliers,
  brands = [],
  selectedBrandId,
  onBrandFilterChange,
  getSupplierName,
  getBrandName,
  onCreate,
  onEdit,
  onArchive,
  onDelete,
  onImport,
  onExport,
  onSelectProduct,
  bomMappings = [],
}: ProductsTableProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<Product['status'] | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<ProductType | 'all'>('all')
  const [supplierFilter, setSupplierFilter] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('sku')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grouped')
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // Brand filter (from props)
    if (selectedBrandId) {
      result = result.filter((p) => p.brandId === selectedBrandId)
    }

    // Search
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.sku.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.asin.toLowerCase().includes(q) ||
          (p.fnsku?.toLowerCase().includes(q) ?? false)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter)
    }

    // Product type filter
    if (typeFilter !== 'all') {
      result = result.filter((p) => p.productType === typeFilter)
    }

    // Supplier filter
    if (supplierFilter !== 'all') {
      result = result.filter((p) => p.supplierId === supplierFilter)
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      return 0
    })

    return result
  }, [products, selectedBrandId, search, statusFilter, typeFilter, supplierFilter, sortKey, sortDir])

  // Build grouped view data
  const groupedData = useMemo(() => {
    if (viewMode !== 'grouped') return null

    // Create a map of finished product ID -> component IDs
    const finishedToComponents = new Map<string, Set<string>>()
    const componentToFinished = new Map<string, Set<string>>()

    bomMappings.forEach(mapping => {
      // Track which components belong to which finished product
      if (!finishedToComponents.has(mapping.finishedProductId)) {
        finishedToComponents.set(mapping.finishedProductId, new Set())
      }
      finishedToComponents.get(mapping.finishedProductId)!.add(mapping.componentProductId)

      // Track which finished products use which component
      if (!componentToFinished.has(mapping.componentProductId)) {
        componentToFinished.set(mapping.componentProductId, new Set())
      }
      componentToFinished.get(mapping.componentProductId)!.add(mapping.finishedProductId)
    })

    // Categorize products
    const finishedGoods: Product[] = []
    const simpleProducts: Product[] = []
    const unassignedComponents: Product[] = []
    const productMap = new Map<string, Product>()

    filteredProducts.forEach(product => {
      productMap.set(product.id, product)

      if (product.productType === 'finished_good') {
        finishedGoods.push(product)
      } else if (product.productType === 'simple') {
        simpleProducts.push(product)
      } else if (product.productType === 'component') {
        // Check if this component is used in any BOM
        if (!componentToFinished.has(product.id)) {
          unassignedComponents.push(product)
        }
      }
    })

    // Build the grouped structure
    const finishedWithComponents = finishedGoods.map(finished => {
      const componentIds = finishedToComponents.get(finished.id) || new Set()
      const components = Array.from(componentIds)
        .map(id => productMap.get(id))
        .filter((p): p is Product => p !== undefined)
      return { finished, components }
    })

    return {
      finishedWithComponents,
      simpleProducts,
      unassignedComponents,
    }
  }, [viewMode, filteredProducts, bomMappings])

  // Toggle expand/collapse for a finished product
  const toggleExpand = (productId: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null
    return sortDir === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )
  }

  const hasFilters = statusFilter !== 'all' || typeFilter !== 'all' || supplierFilter !== 'all' || search || selectedBrandId

  // Helper function to render a product row
  const renderProductRow = (product: Product, options?: { isNested?: boolean; isFinishedWithComponents?: boolean; componentCount?: number }) => {
    const { isNested = false, isFinishedWithComponents = false, componentCount = 0 } = options || {}
    const isExpanded = expandedProducts.has(product.id)

    return (
      <tr
        key={product.id}
        onClick={() => onSelectProduct?.(product.id)}
        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
          isNested ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''
        }`}
      >
        <td className="px-2 py-2">
          <div className="flex items-center gap-1">
            {/* Expand/Collapse for finished goods with components */}
            {isFinishedWithComponents ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleExpand(product.id)
                }}
                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
              >
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              </button>
            ) : isNested ? (
              <span className="w-5 ml-2 border-l-2 border-slate-200 dark:border-slate-600 h-6" />
            ) : null}
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                <Package className="w-5 h-5 text-slate-400" />
              </div>
            )}
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="font-mono text-sm text-slate-900 dark:text-white">
            {product.sku}
          </span>
        </td>
        <td className="px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[200px]" title={product.name}>
              {product.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {product.asin}{product.fnsku ? ` · ${product.fnsku}` : ''}
            </p>
            {isFinishedWithComponents && componentCount > 0 && (
              <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">
                {componentCount} component{componentCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              typeStyles[product.productType || 'simple'].bg
            } ${typeStyles[product.productType || 'simple'].text}`}
          >
            {typeStyles[product.productType || 'simple'].label}
          </span>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          {getBrandName && product.brandId ? (
            <span className="text-sm text-slate-600 dark:text-slate-300">
              {getBrandName(product.brandId)}
            </span>
          ) : (
            <span className="text-sm text-slate-400 dark:text-slate-500">—</span>
          )}
        </td>
        <td className="px-4 py-3 hidden lg:table-cell">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {getSupplierName(product.supplierId)}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <span className="font-mono text-sm text-slate-900 dark:text-white">
            ${product.unitCost.toFixed(2)}
          </span>
        </td>
        <td className="px-4 py-3 text-right hidden md:table-cell">
          <StockBreakdownPopover
            stockLevel={product.stockLevel}
            stockBreakdown={product.stockBreakdown}
            isLowStock={product.stockLevel < 500}
          />
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
              statusStyles[product.status].bg
            } ${statusStyles[product.status].text}`}
          >
            {statusStyles[product.status].label}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setOpenMenuId(openMenuId === product.id ? null : product.id)
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {openMenuId === product.id && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setOpenMenuId(null)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit?.(product.id)
                      setOpenMenuId(null)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onArchive?.(product.id)
                      setOpenMenuId(null)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </button>
                  <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete?.(product.id)
                      setOpenMenuId(null)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </td>
      </tr>
    )
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setTypeFilter('all')
    setSupplierFilter('all')
    onBrandFilterChange?.(null)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by SKU, name, ASIN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {/* Brand Filter */}
            {brands.length > 0 && (
              <div className="relative">
                <select
                  value={selectedBrandId || ''}
                  onChange={(e) => onBrandFilterChange?.(e.target.value || null)}
                  className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  aria-label="brand"
                  role="combobox"
                >
                  <option value="">All Brands</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            )}

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Product['status'] | 'all')}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
              <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as ProductType | 'all')}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All types</option>
                <option value="simple">Simple</option>
                <option value="component">Component</option>
                <option value="finished_good">Finished Good</option>
              </select>
              <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {/* View Mode Toggle */}
          {bomMappings.length > 0 && (
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
              <button
                onClick={() => setViewMode('flat')}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'flat'
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                title="Flat view"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Flat</span>
              </button>
              <button
                onClick={() => setViewMode('grouped')}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-l border-slate-200 dark:border-slate-700 ${
                  viewMode === 'grouped'
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                title="Grouped view"
              >
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">Grouped</span>
              </button>
            </div>
          )}
          <button
            onClick={() => onImport?.()}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={() => onExport?.()}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => onCreate?.()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="w-12 px-2 py-3">
                  <span className="sr-only">Image</span>
                </th>
                <th className="text-left px-4 py-3">
                  <button
                    onClick={() => handleSort('sku')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    SKU
                    <SortIcon column="sku" />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Name
                    <SortIcon column="name" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 hidden md:table-cell">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Type
                  </span>
                </th>
                <th className="text-left px-4 py-3 hidden md:table-cell">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Brand
                  </span>
                </th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Supplier
                  </span>
                </th>
                <th className="text-right px-4 py-3">
                  <button
                    onClick={() => handleSort('unitCost')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-300 ml-auto"
                  >
                    Cost
                    <SortIcon column="unitCost" />
                  </button>
                </th>
                <th className="text-right px-4 py-3 hidden md:table-cell">
                  <button
                    onClick={() => handleSort('stockLevel')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-300 ml-auto"
                  >
                    Stock
                    <SortIcon column="stockLevel" />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Status
                    <SortIcon column="status" />
                  </button>
                </th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <p className="text-slate-500 dark:text-slate-400">
                      {products.length === 0
                        ? 'No products yet'
                        : hasFilters
                          ? 'No products match your filters'
                          : 'No products yet'}
                    </p>
                    {products.length === 0 && (
                      <button
                        onClick={() => onCreate?.()}
                        className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                      >
                        Add your first product
                      </button>
                    )}
                    {hasFilters && products.length > 0 && (
                      <button
                        onClick={clearFilters}
                        className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : viewMode === 'flat' ? (
                // Flat View - just render all products
                filteredProducts.map((product) => renderProductRow(product))
              ) : (
                // Grouped View
                <>
                  {/* Simple Products - shown at top level */}
                  {groupedData?.simpleProducts.map((product) => renderProductRow(product))}

                  {/* Finished Goods with their Components */}
                  {groupedData?.finishedWithComponents.map(({ finished, components }) => (
                    <React.Fragment key={finished.id}>
                      {renderProductRow(finished, {
                        isFinishedWithComponents: components.length > 0,
                        componentCount: components.length,
                      })}
                      {/* Nested components when expanded */}
                      {expandedProducts.has(finished.id) &&
                        components.map((component) => renderProductRow(component, { isNested: true }))}
                    </React.Fragment>
                  ))}

                  {/* Unassigned Components Section */}
                  {groupedData && groupedData.unassignedComponents.length > 0 && (
                    <>
                      <tr className="bg-slate-100 dark:bg-slate-800">
                        <td colSpan={10} className="px-4 py-2">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Unassigned Components ({groupedData.unassignedComponents.length})
                          </span>
                        </td>
                      </tr>
                      {groupedData.unassignedComponents.map((product) => renderProductRow(product))}
                    </>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with count */}
        {filteredProducts.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing <span>{filteredProducts.length}</span> of {products.length} products
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
