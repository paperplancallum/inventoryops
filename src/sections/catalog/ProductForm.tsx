'use client'

import { useState } from 'react'
import { X, ChevronDown, Lock, Info } from 'lucide-react'
import type { Product, SupplierReference, BrandReference, ProductFormData, ProductType } from './types'
import { SearchableSelect } from '@/components/ui/SearchableSelect'

interface ParentProductInfo {
  finishedProductName: string
  brandId: string
  brandName: string
}

interface ProductFormProps {
  product?: Product
  suppliers: SupplierReference[]
  brands: BrandReference[]
  /** If this component is used in BOMs with branded finished products */
  parentProductInfo?: ParentProductInfo | null
  onSubmit?: (data: ProductFormData) => void
  onCancel?: () => void
  onAddSupplier?: () => void
}

export function ProductForm({
  product,
  suppliers,
  brands,
  parentProductInfo,
  onSubmit,
  onCancel,
  onAddSupplier,
}: ProductFormProps) {
  const isEditing = !!product

  // Brand is locked if this is a component used in a BOM with a branded finished product
  const isBrandLocked = !!(
    isEditing &&
    product?.productType === 'component' &&
    parentProductInfo?.brandId
  )

  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    brandId: product?.brandId || '',
    supplierId: product?.supplierId || '',
    unitCost: product?.unitCost || 0,
    sku: product?.sku || '',
    asin: product?.asin || '',
    fnsku: product?.fnsku || '',
    status: product?.status || 'active',
    productType: product?.productType || 'simple',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {}

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required'
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required'
    }
    if (formData.unitCost < 0) {
      newErrors.unitCost = 'Unit cost must be positive'
    }
    // Supplier is optional until Suppliers section is implemented
    if (!formData.brandId) {
      newErrors.brandId = 'Brand is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSubmit?.(formData)
    }
  }

  const handleChange = (field: keyof ProductFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-slate-800 shadow-xl overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {isEditing ? 'Edit Product' : 'Add Product'}
              </h2>
              <button
                type="button"
                onClick={onCancel}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Basic Info */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Basic Info</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    SKU *
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => handleChange('sku', e.target.value)}
                    placeholder="e.g., WB-TUMBLER-20"
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.sku ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.sku && <p className="mt-1 text-xs text-red-500">{errors.sku}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Insulated Water Bottle 20oz"
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Product description..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category || ''}
                      onChange={(e) => handleChange('category', e.target.value)}
                      placeholder="e.g., Drinkware"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Unit Cost ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.unitCost}
                      onChange={(e) => handleChange('unitCost', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        errors.unitCost ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                      }`}
                    />
                    {errors.unitCost && <p className="mt-1 text-xs text-red-500">{errors.unitCost}</p>}
                  </div>
                </div>
              </div>
            </section>

            {/* Brand & Supplier */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Brand & Supplier</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Brand *
                    {isBrandLocked && (
                      <Lock className="inline w-3.5 h-3.5 ml-1.5 text-slate-400" />
                    )}
                  </label>
                  {isBrandLocked ? (
                    <>
                      <div className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 cursor-not-allowed">
                        {parentProductInfo?.brandName || 'Locked'}
                      </div>
                      <div className="mt-2 flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Brand cannot be changed because this component is used in the finished product "{parentProductInfo?.finishedProductName}" which has a brand assigned.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <SearchableSelect
                        options={brands.map((b) => ({
                          value: b.id,
                          label: b.name,
                        }))}
                        value={formData.brandId}
                        onChange={(value) => handleChange('brandId', value)}
                        placeholder="Select a brand..."
                        searchPlaceholder="Search brands..."
                        className={errors.brandId ? 'border-red-500' : ''}
                      />
                      {errors.brandId && <p className="mt-1 text-xs text-red-500">{errors.brandId}</p>}
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Supplier <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <SearchableSelect
                    options={suppliers.map((s) => ({
                      value: s.id,
                      label: s.name,
                    }))}
                    value={formData.supplierId}
                    onChange={(value) => handleChange('supplierId', value)}
                    placeholder="Select a supplier..."
                    searchPlaceholder="Search suppliers..."
                    onAddNew={onAddSupplier}
                    addNewLabel="+ Add New Supplier"
                    className={errors.supplierId ? 'border-red-500' : ''}
                  />
                  {errors.supplierId && <p className="mt-1 text-xs text-red-500">{errors.supplierId}</p>}
                </div>
              </div>
            </section>

            {/* Amazon Identifiers */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Amazon Identifiers</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ASIN
                  </label>
                  <input
                    type="text"
                    value={formData.asin || ''}
                    onChange={(e) => handleChange('asin', e.target.value)}
                    placeholder="e.g., B09K3NXMPL"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    FNSKU
                  </label>
                  <input
                    type="text"
                    value={formData.fnsku || ''}
                    onChange={(e) => handleChange('fnsku', e.target.value)}
                    placeholder="e.g., X001ABC123"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
                  />
                </div>
              </div>
            </section>

            {/* Product Type */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Product Type</h3>
              <div className="relative">
                <select
                  value={formData.productType}
                  onChange={(e) => handleChange('productType', e.target.value as ProductType)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none pr-10"
                >
                  <option value="simple">Simple Product</option>
                  <option value="component">Component (for assembly)</option>
                  <option value="finished_good">Finished Good (assembled product)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                {formData.productType === 'simple' && 'Standard product - not used in assembly'}
                {formData.productType === 'component' && 'Used as a component in Bill of Materials'}
                {formData.productType === 'finished_good' && 'Assembled from components via work orders'}
              </p>
            </section>

            {/* Status */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Status</h3>
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value as ProductFormData['status'])}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none pr-10"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {isEditing ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
