import { useState, useMemo } from 'react'
import type { CatalogProps, Product, SupplierReference, ProductSKU } from '@/../product/sections/catalog/types'
import { ProductsTable } from './ProductsTable'
import { ProductForm, type ProductFormData } from './ProductForm'
import { ProductDetailPanel } from './ProductDetailPanel'
import { AddSKUModal } from './AddSKUModal'

// Icons
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const TagIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

interface SupplierFormData {
  name: string
  country: string
  contactName: string
  contactEmail: string
  leadTimeDays: number
}

// Full slide-out panel for adding supplier
function AddSupplierPanel({
  onSubmit,
  onCancel,
}: {
  onSubmit: (supplier: SupplierReference) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    country: '',
    contactName: '',
    contactEmail: '',
    leadTimeDays: 30,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof SupplierFormData, string>>>({})

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SupplierFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required'
    }
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required'
    }
    if (!formData.contactName.trim()) {
      newErrors.contactName = 'Contact name is required'
    }
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email format'
    }
    if (formData.leadTimeDays < 0) {
      newErrors.leadTimeDays = 'Lead time must be positive'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      const newSupplier: SupplierReference = {
        id: `sup-new-${Date.now()}`,
        name: formData.name.trim(),
      }
      onSubmit(newSupplier)
    }
  }

  const handleChange = (field: keyof SupplierFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      {/* Backdrop - lighter to show product form beneath */}
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />

      {/* Panel - narrower to show it's an overlay */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl overflow-y-auto border-l border-slate-200 dark:border-slate-700">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Add New Supplier
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Create a supplier to assign to this product
                </p>
              </div>
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
            {/* Company Info */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                Company Info
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Shenzhen Drinkware Co."
                    autoFocus
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="e.g., China"
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.country ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country}</p>}
                </div>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Contact</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => handleChange('contactName', e.target.value)}
                    placeholder="e.g., Li Wei"
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.contactName ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.contactName && (
                    <p className="mt-1 text-xs text-red-500">{errors.contactName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                    placeholder="e.g., contact@supplier.com"
                    className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                      errors.contactEmail ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                    }`}
                  />
                  {errors.contactEmail && (
                    <p className="mt-1 text-xs text-red-500">{errors.contactEmail}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Terms */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Terms</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Lead Time (days) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.leadTimeDays}
                  onChange={(e) => handleChange('leadTimeDays', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                    errors.leadTimeDays ? 'border-red-500' : 'border-slate-200 dark:border-slate-600'
                  }`}
                />
                {errors.leadTimeDays && (
                  <p className="mt-1 text-xs text-red-500">{errors.leadTimeDays}</p>
                )}
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Average time from order to delivery
                </p>
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
                Add Supplier
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Catalog({
  products: initialProducts,
  suppliers: initialSuppliers,
  brands = [],
  selectedBrandId,
  onBrandFilterChange,
  onCreateProduct,
  onEditProduct,
  onArchiveProduct,
  onDeleteProduct,
  onImportProducts,
  onExportProducts,
}: CatalogProps) {
  const [showForm, setShowForm] = useState(false)
  const [showSupplierModal, setShowSupplierModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  // Local suppliers state to allow adding new ones during the session
  const [suppliers, setSuppliers] = useState<SupplierReference[]>(initialSuppliers)
  // Local products state for adding SKUs during session
  const [products, setProducts] = useState<Product[]>(initialProducts)
  // SKU modal state
  const [showSKUModal, setShowSKUModal] = useState(false)
  const [addingSKUToProductId, setAddingSKUToProductId] = useState<string | null>(null)

  // Get the selected product for the detail panel
  const selectedProduct = selectedProductId
    ? products.find((p) => p.id === selectedProductId)
    : null

  // Helper to get supplier name by ID
  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId)
    return supplier?.name ?? 'Unknown'
  }

  // Helper to get brand name by ID
  const getBrandName = (brandId: string) => {
    const brand = brands.find((b) => b.id === brandId)
    return brand?.name ?? 'Unknown'
  }

  // Filter products by selected brand
  const filteredByBrand = useMemo(() => {
    if (!selectedBrandId) return products
    return products.filter((p) => p.brandId === selectedBrandId)
  }, [products, selectedBrandId])

  const handleCreate = () => {
    setEditingProduct(undefined)
    setShowForm(true)
  }

  const handleEdit = (id: string) => {
    const product = products.find((p) => p.id === id)
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleFormSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      onEditProduct?.(editingProduct.id)
    } else {
      onCreateProduct?.()
    }
    setShowForm(false)
    setEditingProduct(undefined)
    alert(editingProduct ? `Product "${data.name}" updated` : `Product "${data.name}" created`)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingProduct(undefined)
  }

  const handleAddSupplier = () => {
    setShowSupplierModal(true)
  }

  const handleSupplierCreated = (newSupplier: SupplierReference) => {
    setSuppliers((prev) => [...prev, newSupplier])
    setShowSupplierModal(false)
  }

  // SKU handlers
  const handleOpenAddSKU = (productId: string) => {
    setAddingSKUToProductId(productId)
    setShowSKUModal(true)
  }

  const handleAddSKU = (newSku: ProductSKU) => {
    if (!addingSKUToProductId) return

    setProducts((prev) =>
      prev.map((product) => {
        if (product.id !== addingSKUToProductId) return product

        // If new SKU is default, unset previous default
        const updatedSkus = newSku.isDefault
          ? (product.skus || []).map((s) => ({ ...s, isDefault: false }))
          : product.skus || []

        // Add new SKU
        const skusWithNew = [...updatedSkus, newSku]

        // Recalculate total stock
        const totalStock = skusWithNew.reduce((sum, s) => sum + s.stockLevel, 0)

        // Update default SKU fields if this is the new default
        const defaultSku = newSku.isDefault ? newSku : skusWithNew.find((s) => s.isDefault) || skusWithNew[0]

        return {
          ...product,
          skus: skusWithNew,
          stockLevel: totalStock,
          sku: defaultSku.sku,
          asin: defaultSku.asin,
          fnsku: defaultSku.fnsku,
        }
      })
    )

    setShowSKUModal(false)
    setAddingSKUToProductId(null)
  }

  const handleEditSKU = (productId: string, skuId: string) => {
    alert(`Edit SKU ${skuId} for product ${productId} - edit modal would open here`)
  }

  const handleDeleteSKU = (productId: string, skuId: string) => {
    const product = products.find((p) => p.id === productId)
    const sku = product?.skus?.find((s) => s.id === skuId)

    if (sku?.isDefault) {
      alert('Cannot delete the default SKU. Set another SKU as default first.')
      return
    }

    if (confirm(`Are you sure you want to delete SKU "${sku?.sku}"?`)) {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p
          const updatedSkus = (p.skus || []).filter((s) => s.id !== skuId)
          const totalStock = updatedSkus.reduce((sum, s) => sum + s.stockLevel, 0)
          return {
            ...p,
            skus: updatedSkus,
            stockLevel: totalStock,
          }
        })
      )
    }
  }

  // Spec sheet handlers
  const handleUploadSpecSheet = (productId: string, file: File) => {
    // In a real implementation, this would upload to a server
    // For now, we'll create a local representation
    const product = products.find((p) => p.id === productId)
    const currentVersion = product?.specSheet?.version
    const newVersion = currentVersion
      ? `v${(parseFloat(currentVersion.replace('v', '')) + 0.1).toFixed(1)}`
      : 'v1.0'

    const specSheet = {
      id: `spec-${productId}-${Date.now()}`,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file), // Local blob URL for demo
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedById: 'current-user', // In real app, get from auth context
      uploadedByName: 'Current User', // In real app, get from auth context
      version: newVersion,
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, specSheet, updatedAt: new Date().toISOString() }
          : p
      )
    )

    alert(`Spec sheet "${file.name}" uploaded successfully!`)
  }

  const handleDownloadSpecSheet = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product?.specSheet?.fileUrl) {
      // In a real implementation, this would download from server
      // For demo, we'll open the blob URL or show alert
      window.open(product.specSheet.fileUrl, '_blank')
    } else {
      alert('No spec sheet available to download')
    }
  }

  // Get product for SKU modal
  const addingSKUToProduct = addingSKUToProductId
    ? products.find((p) => p.id === addingSKUToProductId)
    : null

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Catalog
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Manage your products
              </p>
            </div>

            {/* Brand Filter */}
            {brands.length > 0 && (
              <div className="relative">
                <div className="flex items-center gap-2">
                  <TagIcon />
                  <select
                    value={selectedBrandId || ''}
                    onChange={(e) => onBrandFilterChange?.(e.target.value || null)}
                    className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[160px]"
                  >
                    <option value="">All Brands</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDownIcon />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <ProductsTable
          products={filteredByBrand}
          getSupplierName={getSupplierName}
          getBrandName={getBrandName}
          suppliers={suppliers}
          brands={brands}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onArchive={onArchiveProduct}
          onDelete={onDeleteProduct}
          onImport={onImportProducts}
          onExport={onExportProducts}
          onSelectProduct={setSelectedProductId}
        />
      </div>

      {/* Product Form Side Panel */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          suppliers={suppliers}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          onAddSupplier={handleAddSupplier}
        />
      )}

      {/* Add Supplier Panel */}
      {showSupplierModal && (
        <AddSupplierPanel
          onSubmit={handleSupplierCreated}
          onCancel={() => setShowSupplierModal(false)}
        />
      )}

      {/* Product Detail Panel */}
      {selectedProduct && (
        <ProductDetailPanel
          product={selectedProduct}
          supplierName={getSupplierName(selectedProduct.supplierId)}
          onClose={() => setSelectedProductId(null)}
          onEdit={() => {
            handleEdit(selectedProduct.id)
            setSelectedProductId(null)
          }}
          onAddSKU={handleOpenAddSKU}
          onEditSKU={handleEditSKU}
          onDeleteSKU={handleDeleteSKU}
          onUploadSpecSheet={handleUploadSpecSheet}
          onDownloadSpecSheet={handleDownloadSpecSheet}
        />
      )}

      {/* Add SKU Modal */}
      {showSKUModal && addingSKUToProduct && (
        <AddSKUModal
          productId={addingSKUToProduct.id}
          productName={addingSKUToProduct.name}
          existingSkus={addingSKUToProduct.skus || []}
          onSubmit={handleAddSKU}
          onCancel={() => {
            setShowSKUModal(false)
            setAddingSKUToProductId(null)
          }}
        />
      )}
    </div>
  )
}
