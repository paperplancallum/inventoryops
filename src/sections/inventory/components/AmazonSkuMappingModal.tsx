'use client'

import { useState, useMemo } from 'react'
import { X, Link2, Search, AlertCircle } from 'lucide-react'
import type { AmazonInventoryItem } from '@/lib/supabase/hooks/useAmazonInventory'

interface Product {
  id: string
  name: string
  sku: string
  skus: Array<{
    id: string
    sku: string
  }>
}

interface AmazonSkuMappingModalProps {
  amazonItem: AmazonInventoryItem
  products: Product[]
  isOpen: boolean
  onClose: () => void
  onMap: (amazonSellerSku: string, internalSkuId: string, internalProductId: string) => Promise<boolean>
}

export function AmazonSkuMappingModal({
  amazonItem,
  products,
  isOpen,
  onClose,
  onMap,
}: AmazonSkuMappingModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products

    const query = searchQuery.toLowerCase()
    return products.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.skus.some(s => s.sku.toLowerCase().includes(query))
    )
  }, [products, searchQuery])

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || null
  }, [products, selectedProductId])

  if (!isOpen) return null

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId)
    // Auto-select the first SKU if there's only one
    const product = products.find(p => p.id === productId)
    if (product && product.skus.length === 1) {
      setSelectedSkuId(product.skus[0].id)
    } else {
      setSelectedSkuId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedProductId || !selectedSkuId) {
      setError('Please select a product and SKU')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const success = await onMap(amazonItem.sellerSku, selectedSkuId, selectedProductId)
      if (success) {
        onClose()
      } else {
        setError('Failed to map SKU. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-stone-900 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-lime-100 dark:bg-lime-900/30 rounded-lg">
                <Link2 className="w-5 h-5 text-lime-600 dark:text-lime-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
                  Map Amazon SKU
                </h2>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  Link to internal catalog
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              {/* Amazon Item Info */}
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                <p className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase mb-2">
                  Amazon Item
                </p>
                <p className="text-sm font-medium text-stone-900 dark:text-white line-clamp-2">
                  {amazonItem.productName}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-xs font-mono bg-white dark:bg-stone-800 px-2 py-1 rounded">
                    ASIN: {amazonItem.asin}
                  </span>
                  <span className="text-xs font-mono bg-white dark:bg-stone-800 px-2 py-1 rounded">
                    SKU: {amazonItem.sellerSku}
                  </span>
                </div>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Search Products
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search by name or SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded-lg text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500"
                  />
                </div>
              </div>

              {/* Product List */}
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Select Product ({filteredProducts.length} available)
                </label>
                <div className="max-h-40 overflow-y-auto border border-stone-200 dark:border-stone-700 rounded-lg">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-stone-500 dark:text-stone-400">
                      No products found
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleProductSelect(product.id)}
                        className={`w-full text-left px-4 py-3 border-b border-stone-100 dark:border-stone-800 last:border-b-0 transition-colors ${
                          selectedProductId === product.id
                            ? 'bg-lime-50 dark:bg-lime-900/20'
                            : 'hover:bg-stone-50 dark:hover:bg-stone-800'
                        }`}
                      >
                        <p className="text-sm font-medium text-stone-900 dark:text-white">
                          {product.name}
                        </p>
                        <p className="text-xs text-lime-600 dark:text-lime-400 font-mono">
                          {product.sku}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* SKU Selection (if product has multiple SKUs) */}
              {selectedProduct && selectedProduct.skus.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">
                    Select SKU Variant
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProduct.skus.map((sku) => (
                      <button
                        key={sku.id}
                        type="button"
                        onClick={() => setSelectedSkuId(sku.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-mono border transition-colors ${
                          selectedSkuId === sku.id
                            ? 'bg-lime-100 dark:bg-lime-900/30 border-lime-300 dark:border-lime-700 text-lime-700 dark:text-lime-300'
                            : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-lime-300 dark:hover:border-lime-700'
                        }`}
                      >
                        {sku.sku}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 rounded-b-xl">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedProductId || !selectedSkuId || isSubmitting}
                  className="px-4 py-2 bg-lime-600 hover:bg-lime-700 disabled:bg-stone-300 dark:disabled:bg-stone-600 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Mapping...' : 'Map SKU'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
