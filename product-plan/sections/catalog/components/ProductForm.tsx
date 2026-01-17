import { useState } from 'react'
import type { Product, SupplierReference } from '@/../product/sections/catalog/types'
import { SearchableSelect } from '@/components/ui/searchable-select'

// Icons
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

export interface ProductFormData {
  sku: string
  name: string
  unitCost: number
  supplierId: string
  asin: string
  fnsku: string
  status: 'active' | 'inactive' | 'archived'
}

export interface ProductFormProps {
  product?: Product
  suppliers: SupplierReference[]
  onSubmit?: (data: ProductFormData) => void
  onCancel?: () => void
  onAddSupplier?: () => void
}

export function ProductForm({
  product,
  suppliers,
  onSubmit,
  onCancel,
  onAddSupplier,
}: ProductFormProps) {
  const isEditing = !!product

  const [formData, setFormData] = useState<ProductFormData>({
    sku: product?.sku || '',
    name: product?.name || '',
    unitCost: product?.unitCost || 0,
    supplierId: product?.supplierId || '',
    asin: product?.asin || '',
    fnsku: product?.fnsku || '',
    status: product?.status || 'active',
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
    if (!formData.supplierId) {
      newErrors.supplierId = 'Supplier is required'
    }
    if (!formData.asin.trim()) {
      newErrors.asin = 'ASIN is required'
    }
    if (!formData.fnsku.trim()) {
      newErrors.fnsku = 'FNSKU is required'
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
                <XIcon />
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
            </section>

            {/* Supplier */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Supplier</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Supplier *
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
            </section>

            {/* Amazon Identifiers */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Amazon Identifiers</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ASIN *
                  </label>
                  <input
                    type="text"
                    value={formData.asin}
                    onChange={(e) => handleChange('asin', e.target.value)}
                    placeholder="e.g., B09K3NXMPL"
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono ${
                      errors.asin ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.asin && <p className="mt-1 text-xs text-red-500">{errors.asin}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    FNSKU *
                  </label>
                  <input
                    type="text"
                    value={formData.fnsku}
                    onChange={(e) => handleChange('fnsku', e.target.value)}
                    placeholder="e.g., X001ABC123"
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono ${
                      errors.fnsku ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.fnsku && <p className="mt-1 text-xs text-red-500">{errors.fnsku}</p>}
                </div>
              </div>
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
                  <ChevronDownIcon />
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
