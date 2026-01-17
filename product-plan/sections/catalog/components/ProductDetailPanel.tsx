import { useState, useRef } from 'react'
import {
  X,
  Plus,
  ChevronDown,
  ChevronRight,
  FileText,
  Download,
  Upload,
  Package,
  Tag,
  DollarSign,
  Building2,
} from 'lucide-react'
import type { Product } from '@/../product/sections/catalog/types'
import { SKUVariantsTable } from './SKUVariantsTable'
import { StockBreakdownPopover } from './StockBreakdownPopover'

interface ProductDetailPanelProps {
  product: Product
  supplierName: string
  onClose: () => void
  onEdit?: () => void
  onAddSKU?: (productId: string) => void
  onEditSKU?: (productId: string, skuId: string) => void
  onDeleteSKU?: (productId: string, skuId: string) => void
  onUploadSpecSheet?: (productId: string, file: File) => void
  onDownloadSpecSheet?: (productId: string) => void
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
  onClose,
  onEdit,
  onAddSKU,
  onEditSKU,
  onDeleteSKU,
  onUploadSpecSheet,
  onDownloadSpecSheet,
}: ProductDetailPanelProps) {
  const [skusExpanded, setSkusExpanded] = useState(true)
  const [specSheetExpanded, setSpecSheetExpanded] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const statusStyle = statusStyles[product.status]
  const skuCount = product.skus?.length || 0

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
                    </div>
                  </div>
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
    </div>
  )
}
