'use client'

import { useState, useRef, useMemo } from 'react'
import {
  X,
  Plus,
  ChevronDown,
  ChevronRight,
  FileText,
  Download,
  Upload,
  Trash2,
  History,
  Package,
  Tag,
  DollarSign,
  Building2,
  Boxes,
  Receipt,
} from 'lucide-react'
import type { Product, ProductType } from './types'
import type { BOM, BOMLineItem, BOMExpenseItem } from '@/lib/supabase/hooks/useBOMs'
import { SKUVariantsTable } from './SKUVariantsTable'
import { StockBreakdownPopover } from './StockBreakdownPopover'
import { ProductImageUpload } from './ProductImageUpload'
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal'
import { SearchableSelect } from '@/components/ui/SearchableSelect'

import type { ProductSpecSheet } from './types'

// Component product for inline adding
interface ComponentProduct {
  id: string
  sku: string
  name: string
  unit_cost: number
}

interface ProductDetailPanelProps {
  product: Product
  supplierName: string
  brandName?: string
  specSheetVersions?: ProductSpecSheet[]
  // BOM props for finished goods
  bom?: BOM | null
  availableComponents?: ComponentProduct[]
  onAddComponent?: (productId: string, componentId: string, quantity: number) => void
  onRemoveComponent?: (productId: string, bomLineItemId: string) => void
  onUpdateComponentQuantity?: (productId: string, bomLineItemId: string, quantity: number) => void
  // Expense item handlers
  onAddExpense?: (productId: string, name: string, amount: number, isPerUnit: boolean) => void
  onRemoveExpense?: (productId: string, expenseItemId: string) => void
  onUpdateExpense?: (productId: string, expenseItemId: string, amount: number, isPerUnit: boolean) => void
  onClose: () => void
  onEdit?: () => void
  onAddSKU?: (productId: string) => void
  onEditSKU?: (productId: string, skuId: string) => void
  onDeleteSKU?: (productId: string, skuId: string) => void
  onUploadSpecSheet?: (productId: string, file: File) => void
  onDownloadSpecSheet?: (productId: string) => void
  onDeleteSpecSheet?: (productId: string) => void
  onLoadVersionHistory?: (productId: string) => void
  onUpdateProductImage?: (productId: string, imageUrl: string, storagePath: string) => void
  onRemoveProductImage?: (productId: string) => void
}

const statusStyles: Record<Product['status'], { bg: string; text: string; label: string }> = {
  active: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-700 dark:text-emerald-400',
    label: 'Active',
  },
  inactive: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    label: 'Inactive',
  },
  archived: {
    bg: 'bg-slate-100 dark:bg-slate-700',
    text: 'text-slate-500 dark:text-slate-400',
    label: 'Archived',
  },
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ProductDetailPanel({
  product,
  supplierName,
  brandName,
  specSheetVersions,
  bom,
  availableComponents = [],
  onAddComponent,
  onRemoveComponent,
  onUpdateComponentQuantity,
  onAddExpense,
  onRemoveExpense,
  onUpdateExpense,
  onClose,
  onEdit,
  onAddSKU,
  onEditSKU,
  onDeleteSKU,
  onUploadSpecSheet,
  onDownloadSpecSheet,
  onDeleteSpecSheet,
  onLoadVersionHistory,
  onUpdateProductImage,
  onRemoveProductImage,
}: ProductDetailPanelProps) {
  const [skusExpanded, setSkusExpanded] = useState(true)
  const [specSheetExpanded, setSpecSheetExpanded] = useState(true)
  const [componentsExpanded, setComponentsExpanded] = useState(true)
  const [expensesExpanded, setExpensesExpanded] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)

  // Delete confirmation state for components and expenses
  const [componentToDelete, setComponentToDelete] = useState<BOMLineItem | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<BOMExpenseItem | null>(null)

  // Expense item add form state
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [newExpenseName, setNewExpenseName] = useState('')
  const [newExpenseAmount, setNewExpenseAmount] = useState(0)
  const [showAddComponent, setShowAddComponent] = useState(false)
  const [selectedComponentId, setSelectedComponentId] = useState('')
  const [componentQty, setComponentQty] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isFinishedGood = product.productType === 'finished_good'

  const statusStyle = statusStyles[product.status]
  const skuCount = product.skus?.length || 0
  const componentCount = bom?.lineItems?.length || 0
  const expenseCount = bom?.expenseItems?.length || 0

  // Filter out components that are already in the BOM
  const filteredAvailableComponents = useMemo(() => {
    if (!bom?.lineItems || bom.lineItems.length === 0) {
      return availableComponents
    }
    const existingComponentIds = new Set(bom.lineItems.map(item => item.componentProductId))
    return availableComponents.filter(comp => !existingComponentIds.has(comp.id))
  }, [availableComponents, bom?.lineItems])

  const handleAddComponent = () => {
    if (selectedComponentId && componentQty > 0 && onAddComponent) {
      onAddComponent(product.id, selectedComponentId, componentQty)
      setSelectedComponentId('')
      setComponentQty(1)
      setShowAddComponent(false)
    }
  }

  const handleAddExpense = () => {
    if (newExpenseName.trim() && newExpenseAmount > 0 && onAddExpense) {
      onAddExpense(product.id, newExpenseName.trim(), newExpenseAmount, true) // Always per-unit
      setNewExpenseName('')
      setNewExpenseAmount(0)
      setShowAddExpense(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onUploadSpecSheet) {
      // Validate file type (PDF only)
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file')
        return
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }
      onUploadSpecSheet(product.id, file)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Hidden file input for spec sheet upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-slate-800 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-slate-900 dark:text-white">
                {product.name}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
              >
                {statusStyle.label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          {/* Default SKU */}
          <div className="mt-2 flex items-center gap-4 text-sm">
            <span className="font-mono text-slate-600 dark:text-slate-400">{product.sku}</span>
            <span className="text-slate-400 dark:text-slate-500">|</span>
            <span className="text-slate-600 dark:text-slate-400">{supplierName}</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Product Image */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Product Image
            </h3>
            <div className="flex items-start gap-4">
              <ProductImageUpload
                productId={product.id}
                productName={product.name}
                currentImageUrl={product.imageUrl}
                currentStoragePath={product.imageStoragePath}
                onUpload={(imageUrl, storagePath) => onUpdateProductImage?.(product.id, imageUrl, storagePath)}
                onRemove={() => onRemoveProductImage?.(product.id)}
                size="lg"
              />
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <p>Upload a product image (JPEG, PNG, WebP, or GIF)</p>
                <p className="mt-1">Max file size: 5MB</p>
              </div>
            </div>
          </section>

          {/* Product Info */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Product Info
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3">
              {product.description && (
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Description
                  </span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                    {product.description}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {product.category && (
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Category
                    </span>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      {product.category}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Supplier
                  </span>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {supplierName}
                  </p>
                </div>
                {brandName && (
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Brand
                    </span>
                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">
                      {brandName}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Cost & Stock */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Cost & Stock
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Unit Cost
                </span>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">
                  ${product.unitCost.toFixed(2)}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Total Stock
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <StockBreakdownPopover
                    stockLevel={product.stockLevel}
                    stockBreakdown={product.stockBreakdown}
                    isLowStock={product.stockLevel < 500}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Amazon Identifiers */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Amazon Identifiers
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    ASIN
                  </span>
                  <p className="text-sm font-mono font-medium text-slate-900 dark:text-white mt-0.5">
                    {product.asin}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    FNSKU
                  </span>
                  <p className="text-sm font-mono font-medium text-slate-900 dark:text-white mt-0.5">
                    {product.fnsku || <span className="text-slate-400">—</span>}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SKU Variants */}
          <section className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50">
              <button
                onClick={() => setSkusExpanded(!skusExpanded)}
                className="flex-1 flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="text-slate-500 dark:text-slate-400">
                  {skusExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </span>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  SKU Variants {skuCount > 0 && `(${skuCount})`}
                </h3>
              </button>
              {onAddSKU && (
                <button
                  onClick={() => onAddSKU(product.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 mr-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add SKU
                </button>
              )}
            </div>
            {skusExpanded && (
              <div className="border-t border-slate-200 dark:border-slate-700">
                <SKUVariantsTable
                  skus={product.skus || []}
                  onEditSKU={onEditSKU ? (skuId) => onEditSKU(product.id, skuId) : undefined}
                  onDeleteSKU={onDeleteSKU ? (skuId) => onDeleteSKU(product.id, skuId) : undefined}
                />
              </div>
            )}
          </section>

          {/* Components (BOM) - Only for finished goods */}
          {isFinishedGood && (
            <section className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50">
                <button
                  onClick={() => setComponentsExpanded(!componentsExpanded)}
                  className="flex-1 flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="text-slate-500 dark:text-slate-400">
                    {componentsExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </span>
                  <Boxes className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Components (BOM) {componentCount > 0 && `(${componentCount})`}
                  </h3>
                </button>
                {onAddComponent && filteredAvailableComponents.length > 0 && (
                  <button
                    onClick={() => setShowAddComponent(!showAddComponent)}
                    className="flex items-center gap-1.5 px-3 py-1.5 mr-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Component
                  </button>
                )}
              </div>
              {componentsExpanded && (
                <div className="border-t border-slate-200 dark:border-slate-700">
                  {/* Add Component Form */}
                  {showAddComponent && (
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Component
                          </label>
                          <SearchableSelect
                            options={filteredAvailableComponents.map((comp) => ({
                              value: comp.id,
                              label: `${comp.sku} - ${comp.name}`,
                            }))}
                            value={selectedComponentId}
                            onChange={setSelectedComponentId}
                            placeholder="Select a component..."
                            searchPlaceholder="Search components..."
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Qty
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={componentQty}
                            onChange={(e) => setComponentQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <button
                          onClick={handleAddComponent}
                          disabled={!selectedComponentId}
                          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setShowAddComponent(false)}
                          className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Components List */}
                  {bom && bom.lineItems.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {bom.lineItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {item.componentName}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                {item.componentSku}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {onUpdateComponentQuantity ? (
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={item.quantityRequired}
                                onChange={(e) => onUpdateComponentQuantity(product.id, item.id, Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-16 px-2 py-1 text-sm text-center rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            ) : (
                              <span className="text-sm font-medium text-slate-900 dark:text-white">
                                ×{item.quantityRequired}
                              </span>
                            )}
                            <span className="text-xs text-slate-500 dark:text-slate-400 w-16 text-right">
                              ${(item.componentUnitCost * item.quantityRequired).toFixed(2)}
                            </span>
                            {onRemoveComponent && (
                              <button
                                onClick={() => setComponentToDelete(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Remove component"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Boxes className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        No components added yet
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        Add components to define the bill of materials
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Expenses (BOM) - Only for finished goods */}
          {isFinishedGood && (
            <section className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20">
                <button
                  onClick={() => setExpensesExpanded(!expensesExpanded)}
                  className="flex-1 flex items-center gap-2 px-4 py-3 text-left hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                >
                  <span className="text-slate-500 dark:text-slate-400">
                    {expensesExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </span>
                  <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Expenses {expenseCount > 0 && `(${expenseCount})`}
                  </h3>
                </button>
                {onAddExpense && (
                  <button
                    onClick={() => setShowAddExpense(!showAddExpense)}
                    className="flex items-center gap-1.5 px-3 py-1.5 mr-2 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Expense
                  </button>
                )}
              </div>
              {expensesExpanded && (
                <div className="border-t border-slate-200 dark:border-slate-700">
                  {/* Add Expense Form */}
                  {showAddExpense && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Expense Name
                          </label>
                          <input
                            type="text"
                            value={newExpenseName}
                            onChange={(e) => setNewExpenseName(e.target.value)}
                            placeholder="e.g., Kitting Fee, Processing Fee"
                            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Amount per Unit ($)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={newExpenseAmount}
                            onChange={(e) => setNewExpenseAmount(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setShowAddExpense(false)
                              setNewExpenseName('')
                              setNewExpenseAmount(0)
                            }}
                            className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddExpense}
                            disabled={!newExpenseName.trim() || newExpenseAmount <= 0}
                            className="px-4 py-1.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expense Items List */}
                  {bom && bom.expenseItems && bom.expenseItems.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {bom.expenseItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        >
                          <div className="flex items-center gap-3">
                            <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {item.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            {onUpdateExpense ? (
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-slate-500">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.amount}
                                  onChange={(e) => onUpdateExpense(product.id, item.id, parseFloat(e.target.value) || 0, true)}
                                  className="w-20 px-2 py-1 text-sm text-right rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                                <span className="text-xs text-slate-500">/ unit</span>
                              </div>
                            ) : (
                              <span className="text-sm font-medium text-slate-900 dark:text-white">
                                ${item.amount.toFixed(2)} / unit
                              </span>
                            )}
                            {onRemoveExpense && (
                              <button
                                onClick={() => setExpenseToDelete(item)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Remove expense"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        No expenses added
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        Add processing fees, kitting fees, etc.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* BOM Cost Summary - Only for finished goods with BOM */}
          {isFinishedGood && bom && (
            <section className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
                Estimated Unit Cost
              </h3>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                ${bom.estimatedUnitCost.toFixed(2)}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                {componentCount} component{componentCount !== 1 ? 's' : ''}{expenseCount > 0 ? ` + ${expenseCount} expense${expenseCount !== 1 ? 's' : ''}` : ''}
              </p>
            </section>
          )}

          {/* Spec Sheet */}
          <section className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50">
              <button
                onClick={() => setSpecSheetExpanded(!specSheetExpanded)}
                className="flex-1 flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="text-slate-500 dark:text-slate-400">
                  {specSheetExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </span>
                <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Product Spec Sheet
                </h3>
              </button>
            </div>
            {specSheetExpanded && (
              <div className="border-t border-slate-200 dark:border-slate-700 p-4">
                {product.specSheet ? (
                  <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {product.specSheet.fileName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {product.specSheet.version} &middot;{' '}
                          {formatFileSize(product.specSheet.fileSize)} &middot; Uploaded{' '}
                          {formatDate(product.specSheet.uploadedAt)}
                        </p>
                        {product.specSheet.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {product.specSheet.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {onDownloadSpecSheet && (
                        <button
                          onClick={() => onDownloadSpecSheet(product.id)}
                          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                          title="Download spec sheet"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      {onUploadSpecSheet && (
                        <button
                          onClick={triggerFileUpload}
                          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                          title="Upload new version"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                      )}
                      {onDeleteSpecSheet && (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                          title="Delete spec sheet"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {onLoadVersionHistory && (
                        <button
                          onClick={() => {
                            if (!showVersionHistory) {
                              onLoadVersionHistory(product.id)
                            }
                            setShowVersionHistory(!showVersionHistory)
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            showVersionHistory
                              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'
                          }`}
                          title="Version history"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Version History Panel */}
                  {showVersionHistory && specSheetVersions && specSheetVersions.length > 0 && (
                    <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                      <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                        Version History ({specSheetVersions.length})
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {specSheetVersions.map((version) => (
                          <div
                            key={version.id}
                            className={`flex items-center justify-between p-2 rounded-lg ${
                              version.id === product.specSheet?.id
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800'
                                : 'bg-slate-50 dark:bg-slate-700/50'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                                  {version.version}
                                  {version.id === product.specSheet?.id && (
                                    <span className="ml-2 text-xs text-indigo-600 dark:text-indigo-400">(current)</span>
                                  )}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {formatFileSize(version.fileSize)} &middot; {formatDate(version.uploadedAt)}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => window.open(version.fileUrl, '_blank')}
                              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 flex-shrink-0"
                              title="Download this version"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                      No spec sheet uploaded
                    </p>
                    {onUploadSpecSheet && (
                      <button
                        onClick={triggerFileUpload}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Upload Spec Sheet
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Timestamps */}
          {(product.createdAt || product.updatedAt) && (
            <section className="text-xs text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4">
                {product.createdAt && <span>Created {formatDate(product.createdAt)}</span>}
                {product.updatedAt && <span>Updated {formatDate(product.updatedAt)}</span>}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog for Spec Sheet */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Delete Spec Sheet?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              This will permanently delete the spec sheet for this product. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteSpecSheet?.(product.id)
                  setShowDeleteConfirm(false)
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Component Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!componentToDelete}
        onClose={() => setComponentToDelete(null)}
        onConfirm={() => {
          if (componentToDelete && onRemoveComponent) {
            onRemoveComponent(product.id, componentToDelete.id)
          }
        }}
        title="Remove Component"
        message="Are you sure you want to remove this component from the bill of materials?"
        itemName={componentToDelete?.componentName}
        confirmLabel="Remove"
        requireConfirmText="REMOVE"
      />

      {/* Delete Expense Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={() => {
          if (expenseToDelete && onRemoveExpense) {
            onRemoveExpense(product.id, expenseToDelete.id)
          }
        }}
        title="Remove Expense"
        message="Are you sure you want to remove this expense from the bill of materials?"
        itemName={expenseToDelete?.name}
        confirmLabel="Remove"
        requireConfirmText="REMOVE"
      />
    </div>
  )
}
