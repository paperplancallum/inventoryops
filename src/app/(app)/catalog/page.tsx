'use client'

import { useState, useCallback, useMemo } from 'react'
import { Catalog } from '@/sections/catalog/Catalog'
import { useProducts, useBrands, useProductSpecSheets, useSuppliers } from '@/lib/supabase/hooks'
import type { ProductFormData, ProductSKU, SupplierReference } from '@/sections/catalog/types'

export default function CatalogPage() {
  const {
    products,
    loading: productsLoading,
    createProduct,
    updateProduct,
    archiveProduct,
    deleteProduct,
    addSKU,
    deleteSKU,
    exportProductsCSV,
    refetch: refetchProducts,
    updateProductImage,
  } = useProducts()

  const { brandReferences, loading: brandsLoading } = useBrands()
  const { uploadSpecSheet, downloadSpecSheet } = useProductSpecSheets()
  const { suppliers, loading: suppliersLoading } = useSuppliers()

  // Convert suppliers to SupplierReference format for catalog
  const supplierReferences: SupplierReference[] = useMemo(() =>
    suppliers.map(s => ({ id: s.id, name: s.name })),
    [suppliers]
  )

  // Brand filter state
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)

  const handleBrandFilterChange = useCallback((brandId: string | null) => {
    setSelectedBrandId(brandId)
  }, [])

  // Product handlers
  const handleCreateProduct = useCallback(() => {
    // Form will handle the actual creation
  }, [])

  const handleEditProduct = useCallback((id: string) => {
    // Form will handle the actual update
  }, [])

  const handleArchiveProduct = useCallback(async (id: string) => {
    await archiveProduct(id)
  }, [archiveProduct])

  const handleDeleteProduct = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id)
    }
  }, [deleteProduct])

  const handleImportProducts = useCallback(() => {
    // Placeholder for future implementation
    alert('Import functionality coming soon')
  }, [])

  const handleExportProducts = useCallback(() => {
    exportProductsCSV()
  }, [exportProductsCSV])

  // Handle product form submit (create or update)
  const handleFormSubmit = useCallback(async (data: ProductFormData, productId?: string) => {
    if (productId) {
      await updateProduct(productId, data)
    } else {
      await createProduct(data)
    }
  }, [createProduct, updateProduct])

  // SKU handlers
  const handleAddSKU = useCallback(async (productId: string, skuData: ProductSKU) => {
    const { id, stockLevel, ...rest } = skuData
    await addSKU(productId, rest)
  }, [addSKU])

  const handleDeleteSKU = useCallback(async (productId: string, skuId: string) => {
    await deleteSKU(productId, skuId)
  }, [deleteSKU])

  // Spec sheet handlers
  const handleUploadSpecSheet = useCallback(async (productId: string, file: File) => {
    const product = products.find(p => p.id === productId)
    await uploadSpecSheet(productId, file, product?.specSheet?.version)
  }, [products, uploadSpecSheet])

  const handleDownloadSpecSheet = useCallback(async (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product?.specSheet) {
      await downloadSpecSheet(product.specSheet)
    }
  }, [products, downloadSpecSheet])

  // Product image handlers
  const handleUpdateProductImage = useCallback(async (productId: string, imageUrl: string, storagePath: string) => {
    await updateProductImage(productId, imageUrl, storagePath)
  }, [updateProductImage])

  const handleRemoveProductImage = useCallback(async (productId: string) => {
    await updateProductImage(productId, null, null)
  }, [updateProductImage])

  // Loading state
  if (productsLoading || brandsLoading || suppliersLoading) {
    return (
      <div className="min-h-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading catalog...</p>
        </div>
      </div>
    )
  }

  return (
    <Catalog
      products={products}
      suppliers={supplierReferences}
      brands={brandReferences}
      selectedBrandId={selectedBrandId}
      onBrandFilterChange={handleBrandFilterChange}
      onCreateProduct={handleCreateProduct}
      onEditProduct={handleEditProduct}
      onArchiveProduct={handleArchiveProduct}
      onDeleteProduct={handleDeleteProduct}
      onImportProducts={handleImportProducts}
      onExportProducts={handleExportProducts}
      onFormSubmit={handleFormSubmit}
      onRefresh={refetchProducts}
      loading={productsLoading}
      onUpdateProductImage={handleUpdateProductImage}
      onRemoveProductImage={handleRemoveProductImage}
    />
  )
}
