import { useState } from 'react'
import { X, HelpCircle } from 'lucide-react'
import type { ProductSKU, SKUCondition } from '@/../product/sections/catalog/types'

interface AddSKUModalProps {
  productId: string
  productName: string
  existingSkus: ProductSKU[]
  onSubmit: (sku: ProductSKU) => void
  onCancel: () => void
}

// Tooltip component
function Tooltip({ content }: { content: string }) {
  return (
    <div className="group relative inline-flex ml-1">
      <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-help" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-56 text-center z-50 pointer-events-none">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
      </div>
    </div>
  )
}

// Field tooltips
const fieldTooltips = {
  asin: 'Amazon Standard Identification Number. A unique 10-character alphanumeric identifier assigned by Amazon to products in their catalog.',
  fnsku: 'Fulfillment Network Stock Keeping Unit. Amazon\'s internal barcode for FBA inventory. Optional if you have a UPC or EAN barcode.',
  upc: 'Universal Product Code. A 12-digit barcode used in retail for tracking trade items. Often shared across all conditions of the same product.',
  ean: 'European Article Number. A 13-digit barcode standard used internationally. Similar to UPC but with an extra digit for country code.',
}

interface SKUFormData {
  sku: string
  condition: SKUCondition
  asin: string
  fnsku: string
  upc: string
  ean: string
  stockLevel: number
  notes: string
  isDefault: boolean
}

const conditionOptions: { value: SKUCondition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'refurbished', label: 'Refurbished' },
  { value: 'used-like-new', label: 'Used - Like New' },
  { value: 'used-very-good', label: 'Used - Very Good' },
  { value: 'used-good', label: 'Used - Good' },
  { value: 'used-acceptable', label: 'Used - Acceptable' },
]

export function AddSKUModal({
  productId,
  productName,
  existingSkus,
  onSubmit,
  onCancel,
}: AddSKUModalProps) {
  // Get the default SKU to inherit from
  const defaultSku = existingSkus.find((s) => s.isDefault) || existingSkus[0]

  const [formData, setFormData] = useState<SKUFormData>({
    sku: '',
    condition: 'new',
    asin: '',
    fnsku: '',
    upc: '',
    ean: '',
    stockLevel: 0,
    notes: '',
    isDefault: existingSkus.length === 0, // First SKU is default
  })
  const [errors, setErrors] = useState<Partial<Record<keyof SKUFormData, string>>>({})

  // Inherit a field value from the default SKU
  const inheritFromDefault = (field: 'asin' | 'upc' | 'ean') => {
    if (!defaultSku) return
    const value = defaultSku[field]
    if (value) {
      handleChange(field, value)
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SKUFormData, string>> = {}

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required'
    } else if (existingSkus.some((s) => s.sku === formData.sku.trim())) {
      newErrors.sku = 'SKU already exists for this product'
    }

    if (!formData.asin.trim()) {
      newErrors.asin = 'ASIN is required'
    } else if (!/^B[A-Z0-9]{9}$/.test(formData.asin.trim())) {
      newErrors.asin = 'Invalid ASIN format (should be B followed by 9 alphanumeric characters)'
    }

    if (formData.upc && !/^\d{12}$/.test(formData.upc)) {
      newErrors.upc = 'UPC must be 12 digits'
    }

    if (formData.ean && !/^\d{13}$/.test(formData.ean)) {
      newErrors.ean = 'EAN must be 13 digits'
    }

    if (formData.stockLevel < 0) {
      newErrors.stockLevel = 'Stock level cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      const newSku: ProductSKU = {
        id: `sku-${productId}-${Date.now()}`,
        sku: formData.sku.trim(),
        condition: formData.condition,
        asin: formData.asin.trim().toUpperCase(),
        fnsku: formData.fnsku.trim() || undefined,
        upc: formData.upc.trim() || undefined,
        ean: formData.ean.trim() || undefined,
        stockLevel: formData.stockLevel,
        notes: formData.notes.trim() || undefined,
        isDefault: formData.isDefault,
      }
      onSubmit(newSku)
    }
  }

  const handleChange = (field: keyof SKUFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Add SKU Variant
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {productName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCancel}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6 max-h-[60vh] overflow-y-auto space-y-5">
              {/* SKU Code */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  SKU Code *
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                  placeholder="e.g., WB-TUMBLER-20-REFURB"
                  autoFocus
                  className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.sku ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                  }`}
                />
                {errors.sku && <p className="mt-1 text-xs text-red-500">{errors.sku}</p>}
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Condition *
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) => handleChange('condition', e.target.value as SKUCondition)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {conditionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amazon Identifiers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                      ASIN *
                      <Tooltip content={fieldTooltips.asin} />
                    </label>
                    {defaultSku?.asin && !formData.asin && (
                      <button
                        type="button"
                        onClick={() => inheritFromDefault('asin')}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                      >
                        Use default ({defaultSku.asin})
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.asin}
                    onChange={(e) => handleChange('asin', e.target.value.toUpperCase())}
                    placeholder="e.g., B09K3NXMPL"
                    maxLength={10}
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.asin ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.asin && <p className="mt-1 text-xs text-red-500">{errors.asin}</p>}
                </div>
                <div>
                  <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    FNSKU
                    <Tooltip content={fieldTooltips.fnsku} />
                    <span className="text-slate-400 font-normal ml-1">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fnsku}
                    onChange={(e) => handleChange('fnsku', e.target.value.toUpperCase())}
                    placeholder="e.g., X001ABC123"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Required for FBA, optional if using UPC/EAN
                  </p>
                </div>
              </div>

              {/* Barcodes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                      UPC
                      <Tooltip content={fieldTooltips.upc} />
                      <span className="text-slate-400 font-normal ml-1">(optional)</span>
                    </label>
                    {defaultSku?.upc && !formData.upc && (
                      <button
                        type="button"
                        onClick={() => inheritFromDefault('upc')}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                      >
                        Use default
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.upc}
                    onChange={(e) => handleChange('upc', e.target.value.replace(/\D/g, ''))}
                    placeholder="12 digits"
                    maxLength={12}
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.upc ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.upc && <p className="mt-1 text-xs text-red-500">{errors.upc}</p>}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
                      EAN
                      <Tooltip content={fieldTooltips.ean} />
                      <span className="text-slate-400 font-normal ml-1">(optional)</span>
                    </label>
                    {defaultSku?.ean && !formData.ean && (
                      <button
                        type="button"
                        onClick={() => inheritFromDefault('ean')}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                      >
                        Use default
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.ean}
                    onChange={(e) => handleChange('ean', e.target.value.replace(/\D/g, ''))}
                    placeholder="13 digits"
                    maxLength={13}
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.ean ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.ean && <p className="mt-1 text-xs text-red-500">{errors.ean}</p>}
                </div>
              </div>

              {/* Stock Level */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Initial Stock Level
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stockLevel}
                  onChange={(e) => handleChange('stockLevel', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.stockLevel ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                  }`}
                />
                {errors.stockLevel && (
                  <p className="mt-1 text-xs text-red-500">{errors.stockLevel}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Notes <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="e.g., Refurbished from customer returns batch"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Set as Default */}
              {existingSkus.length > 0 && (
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => handleChange('isDefault', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="isDefault"
                    className="text-sm text-slate-700 dark:text-slate-300"
                  >
                    Set as default SKU for this product
                  </label>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700 px-6 py-4">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Add SKU
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
