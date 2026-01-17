'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { RefreshCw, Layers } from 'lucide-react'
import type { CatalogProps, Product, SupplierReference, ProductSKU, ProductFormData, ProductSpecSheet } from './types'
import { ProductsTable } from './ProductsTable'
import { ProductForm } from './ProductForm'
import { ProductDetailPanel } from './ProductDetailPanel'
import { AddSKUModal } from './AddSKUModal'
import { useBOMs, type BOM } from '@/lib/supabase/hooks/useBOMs'

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
  onFormSubmit,
  onRefresh,
  loading = false,
  onUpdateProductImage,
  onRemoveProductImage,
}: CatalogProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [suppliers, setSuppliers] = useState<SupplierReference[]>(initialSuppliers)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [showSKUModal, setShowSKUModal] = useState(false)
  const [addingSKUToProductId, setAddingSKUToProductId] = useState<string | null>(null)
  const [specSheetVersions, setSpecSheetVersions] = useState<ProductSpecSheet[]>([])

  // Sync products when parent props change
  useEffect(() => {
    setProducts(initialProducts)
  }, [initialProducts])

  // BOM state
  const [selectedProductBom, setSelectedProductBom] = useState<BOM | null>(null)
  const [availableComponents, setAvailableComponents] = useState<{ id: string; sku: string; name: string; unit_cost: number }[]>([])

  // BOM hook
  const { boms, fetchBOMs, fetchBOMByProduct, fetchComponents, createBOM, updateBOM, fetchComponentUsage } = useBOMs()

  // Parent product info for component brand restriction
  const [editingProductParentInfo, setEditingProductParentInfo] = useState<{
    finishedProductName: string
    brandId: string
    brandName: string
  } | null>(null)

  // Get the selected product for the detail panel
  const selectedProduct = selectedProductId
    ? products.find((p) => p.id === selectedProductId)
    : null

  // Fetch BOM when a finished_good product is selected
  useEffect(() => {
    if (selectedProduct?.productType === 'finished_good') {
      // Fetch BOM for this product
      fetchBOMByProduct(selectedProduct.id).then((bom) => {
        setSelectedProductBom(bom)
      })
      // Fetch available components - filter by the product's brand
      fetchComponents(selectedProduct.brandId).then((comps) => {
        setAvailableComponents(comps)
      })
    } else {
      setSelectedProductBom(null)
      setAvailableComponents([])
    }
  }, [selectedProduct?.id, selectedProduct?.productType, selectedProduct?.brandId, fetchBOMByProduct, fetchComponents])

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

  // Build BOM component mappings for grouped table view
  const bomMappings = useMemo(() => {
    const mappings: { finishedProductId: string; componentProductId: string; quantityRequired: number }[] = []
    boms.forEach((bom) => {
      bom.lineItems.forEach((item) => {
        mappings.push({
          finishedProductId: bom.finishedProductId,
          componentProductId: item.componentProductId,
          quantityRequired: item.quantityRequired,
        })
      })
    })
    return mappings
  }, [boms])

  const handleCreate = () => {
    setEditingProduct(undefined)
    setShowForm(true)
    onCreateProduct?.()
  }

  const handleEdit = async (id: string) => {
    const product = products.find((p) => p.id === id)
    setEditingProduct(product)
    setEditingProductParentInfo(null)

    // If editing a component, check if it's used in any BOMs with branded finished products
    if (product?.productType === 'component') {
      const usage = await fetchComponentUsage(id)
      if (usage && usage.bomUsage.length > 0) {
        // Get the first finished product's brand info
        // In practice, all finished products using this component should have the same brand
        const firstBomUsage = usage.bomUsage[0]
        // We need to look up the finished product to get its brand
        const finishedProduct = products.find((p) => p.name === firstBomUsage.finishedProductName)
        if (finishedProduct?.brandId) {
          setEditingProductParentInfo({
            finishedProductName: firstBomUsage.finishedProductName,
            brandId: finishedProduct.brandId,
            brandName: getBrandName(finishedProduct.brandId),
          })
        }
      }
    }

    setShowForm(true)
  }

  const handleFormSubmit = async (data: ProductFormData) => {
    // Call the database persistence handler if provided
    if (onFormSubmit) {
      await onFormSubmit(data, editingProduct?.id)
    } else {
      // Fallback to local state only (for testing/demo)
      if (editingProduct) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id
              ? { ...p, ...data, updatedAt: new Date().toISOString() }
              : p
          )
        )
        onEditProduct?.(editingProduct.id)
      } else {
        const newProduct: Product = {
          id: `prod-${Date.now()}`,
          ...data,
          asin: data.asin || '',
          stockLevel: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setProducts((prev) => [...prev, newProduct])
      }
    }
    setShowForm(false)
    setEditingProduct(undefined)
    setEditingProductParentInfo(null)
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingProduct(undefined)
    setEditingProductParentInfo(null)
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
          sku: defaultSku?.sku || product.sku,
          asin: defaultSku?.asin || product.asin,
          fnsku: defaultSku?.fnsku || product.fnsku,
          updatedAt: new Date().toISOString(),
        }
      })
    )

    setShowSKUModal(false)
    setAddingSKUToProductId(null)
  }

  const handleEditSKU = (productId: string, skuId: string) => {
    // Future: Open edit SKU modal
    console.log(`Edit SKU ${skuId} for product ${productId}`)
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
            updatedAt: new Date().toISOString(),
          }
        })
      )
    }
  }

  // Spec sheet handlers
  const handleUploadSpecSheet = (productId: string, file: File) => {
    const product = products.find((p) => p.id === productId)
    const currentVersion = product?.specSheet?.version
    const newVersion = currentVersion
      ? `v${(parseFloat(currentVersion.replace('v', '')) + 0.1).toFixed(1)}`
      : 'v1.0'

    const specSheet = {
      id: `spec-${productId}-${Date.now()}`,
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedById: 'current-user',
      uploadedByName: 'Current User',
      version: newVersion,
    }

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, specSheet, updatedAt: new Date().toISOString() }
          : p
      )
    )
  }

  const handleDownloadSpecSheet = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (product?.specSheet?.fileUrl) {
      window.open(product.specSheet.fileUrl, '_blank')
    }
  }

  const handleDeleteSpecSheet = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? { ...p, specSheet: undefined, updatedAt: new Date().toISOString() }
          : p
      )
    )
  }

  const handleLoadVersionHistory = (productId: string) => {
    // In a real implementation, this would fetch from the database
    // For now, mock with the current spec sheet as the only version
    const product = products.find((p) => p.id === productId)
    if (product?.specSheet) {
      // Mock multiple versions for demonstration
      const mockVersions: ProductSpecSheet[] = [
        product.specSheet,
        // Add a mock older version if current isn't v1.0
        ...(product.specSheet.version !== 'v1.0' ? [{
          ...product.specSheet,
          id: `${product.specSheet.id}-old`,
          version: 'v1.0',
          uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        }] : []),
      ]
      setSpecSheetVersions(mockVersions)
    } else {
      setSpecSheetVersions([])
    }
  }

  // BOM component handlers
  const handleAddComponent = useCallback(async (productId: string, componentId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    try {
      if (selectedProductBom) {
        // Update existing BOM - add new line item
        const existingLineItems = selectedProductBom.lineItems.map((item) => ({
          componentProductId: item.componentProductId,
          quantityRequired: item.quantityRequired,
        }))

        await updateBOM(selectedProductBom.id, {
          lineItems: [
            ...existingLineItems,
            { componentProductId: componentId, quantityRequired: quantity },
          ],
        })
      } else {
        // Create new BOM
        await createBOM({
          finishedProductId: productId,
          name: `BOM for ${product.name}`,
          lineItems: [{ componentProductId: componentId, quantityRequired: quantity }],
        })
      }

      // Refresh the BOM
      const updatedBom = await fetchBOMByProduct(productId)
      setSelectedProductBom(updatedBom)
    } catch (error) {
      console.error('Failed to add component:', error)
    }
  }, [products, selectedProductBom, updateBOM, createBOM, fetchBOMByProduct])

  const handleRemoveComponent = useCallback(async (productId: string, bomLineItemId: string) => {
    if (!selectedProductBom) return

    try {
      // Filter out the removed line item
      const updatedLineItems = selectedProductBom.lineItems
        .filter((item) => item.id !== bomLineItemId)
        .map((item) => ({
          componentProductId: item.componentProductId,
          quantityRequired: item.quantityRequired,
        }))

      await updateBOM(selectedProductBom.id, { lineItems: updatedLineItems })

      // Refresh the BOM
      const updatedBom = await fetchBOMByProduct(productId)
      setSelectedProductBom(updatedBom)
    } catch (error) {
      console.error('Failed to remove component:', error)
    }
  }, [selectedProductBom, updateBOM, fetchBOMByProduct])

  const handleUpdateComponentQuantity = useCallback(async (productId: string, bomLineItemId: string, quantity: number) => {
    if (!selectedProductBom) return

    try {
      // Update the quantity for the specific line item
      const updatedLineItems = selectedProductBom.lineItems.map((item) => ({
        componentProductId: item.componentProductId,
        quantityRequired: item.id === bomLineItemId ? quantity : item.quantityRequired,
      }))

      await updateBOM(selectedProductBom.id, { lineItems: updatedLineItems })

      // Refresh the BOM
      const updatedBom = await fetchBOMByProduct(productId)
      setSelectedProductBom(updatedBom)
    } catch (error) {
      console.error('Failed to update component quantity:', error)
    }
  }, [selectedProductBom, updateBOM, fetchBOMByProduct])

  const handleAddExpense = useCallback(async (productId: string, name: string, amount: number, isPerUnit: boolean) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    try {
      if (selectedProductBom) {
        // Get existing expense items
        const existingExpenses = selectedProductBom.expenseItems.map((item) => ({
          name: item.name,
          description: item.description || undefined,
          amount: item.amount,
          isPerUnit: item.isPerUnit,
        }))

        // Add the new expense
        await updateBOM(selectedProductBom.id, {
          expenseItems: [
            ...existingExpenses,
            { name, amount, isPerUnit },
          ],
        })
      } else {
        // Create new BOM with expense
        await createBOM({
          finishedProductId: productId,
          name: `BOM for ${product.name}`,
          lineItems: [],
          expenseItems: [{ name, amount, isPerUnit }],
        })
      }

      // Refresh the BOM
      const updatedBom = await fetchBOMByProduct(productId)
      setSelectedProductBom(updatedBom)
    } catch (error) {
      console.error('Failed to add expense:', error)
    }
  }, [products, selectedProductBom, updateBOM, createBOM, fetchBOMByProduct])

  const handleRemoveExpense = useCallback(async (productId: string, expenseItemId: string) => {
    if (!selectedProductBom) return

    try {
      // Filter out the removed expense item
      const updatedExpenses = selectedProductBom.expenseItems
        .filter((item) => item.id !== expenseItemId)
        .map((item) => ({
          name: item.name,
          description: item.description || undefined,
          amount: item.amount,
          isPerUnit: item.isPerUnit,
        }))

      await updateBOM(selectedProductBom.id, { expenseItems: updatedExpenses })

      // Refresh the BOM
      const updatedBom = await fetchBOMByProduct(productId)
      setSelectedProductBom(updatedBom)
    } catch (error) {
      console.error('Failed to remove expense:', error)
    }
  }, [selectedProductBom, updateBOM, fetchBOMByProduct])

  const handleUpdateExpense = useCallback(async (productId: string, expenseItemId: string, amount: number, isPerUnit: boolean) => {
    if (!selectedProductBom) return

    try {
      // Update the specific expense item
      const updatedExpenses = selectedProductBom.expenseItems.map((item) => ({
        name: item.name,
        description: item.description || undefined,
        amount: item.id === expenseItemId ? amount : item.amount,
        isPerUnit: item.id === expenseItemId ? isPerUnit : item.isPerUnit,
      }))

      await updateBOM(selectedProductBom.id, { expenseItems: updatedExpenses })

      // Refresh the BOM
      const updatedBom = await fetchBOMByProduct(productId)
      setSelectedProductBom(updatedBom)
    } catch (error) {
      console.error('Failed to update expense:', error)
    }
  }, [selectedProductBom, updateBOM, fetchBOMByProduct])

  // Get product for SKU modal
  const addingSKUToProduct = addingSKUToProductId
    ? products.find((p) => p.id === addingSKUToProductId)
    : null

  return (
    <div className="min-h-full bg-stone-50 dark:bg-stone-900">
      {/* Header */}
      <div className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-stone-900 dark:text-white">
                Catalog
              </h1>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                Manage your products
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/catalog/bom"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              >
                <Layers className="w-4 h-4" />
                Bills of Materials
              </Link>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className="p-2 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <ProductsTable
          products={filteredByBrand}
          suppliers={suppliers}
          brands={brands}
          selectedBrandId={selectedBrandId}
          onBrandFilterChange={onBrandFilterChange}
          getSupplierName={getSupplierName}
          getBrandName={getBrandName}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onArchive={onArchiveProduct}
          onDelete={onDeleteProduct}
          onImport={onImportProducts}
          onExport={onExportProducts}
          onSelectProduct={setSelectedProductId}
          bomMappings={bomMappings}
        />
      </div>

      {/* Product Form Side Panel */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          suppliers={suppliers}
          brands={brands}
          parentProductInfo={editingProductParentInfo}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}

      {/* Product Detail Panel */}
      {selectedProduct && (
        <ProductDetailPanel
          product={selectedProduct}
          supplierName={getSupplierName(selectedProduct.supplierId)}
          brandName={getBrandName(selectedProduct.brandId)}
          bom={selectedProductBom}
          availableComponents={availableComponents}
          onAddComponent={handleAddComponent}
          onRemoveComponent={handleRemoveComponent}
          onUpdateComponentQuantity={handleUpdateComponentQuantity}
          onAddExpense={handleAddExpense}
          onRemoveExpense={handleRemoveExpense}
          onUpdateExpense={handleUpdateExpense}
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
          onDeleteSpecSheet={handleDeleteSpecSheet}
          specSheetVersions={specSheetVersions}
          onLoadVersionHistory={handleLoadVersionHistory}
          onUpdateProductImage={onUpdateProductImage}
          onRemoveProductImage={onRemoveProductImage}
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
