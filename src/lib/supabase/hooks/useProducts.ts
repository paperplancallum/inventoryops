'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../client'
import type { Database } from '../database.types'
import type { Product, ProductSKU, ProductFormData } from '@/sections/catalog/types'

// Derive types from Database
type DbProduct = Database['public']['Tables']['products']['Row']
type DbProductSKU = Database['public']['Tables']['product_skus']['Row']
type ProductStatus = Database['public']['Enums']['product_status']
type ProductType = Database['public']['Enums']['product_type']

// Transform database product to frontend product
function transformProduct(
  dbProduct: DbProduct & { image_url?: string | null; image_storage_path?: string | null },
  skus: DbProductSKU[] = []
): Product {
  const defaultSku = skus.find(s => s.is_default) || skus[0]

  return {
    id: dbProduct.id,
    brandId: dbProduct.brand_id || '',
    sku: defaultSku?.sku || dbProduct.sku,
    name: dbProduct.name,
    description: dbProduct.description || undefined,
    category: dbProduct.category || undefined,
    unitCost: dbProduct.unit_cost,
    supplierId: dbProduct.supplier_id || '',
    status: dbProduct.status,
    productType: (dbProduct.product_type as ProductType) || 'simple',
    asin: defaultSku?.asin || '',
    fnsku: defaultSku?.fnsku || '',
    stockLevel: 0, // Computed from inventory - will be populated when inventory is implemented
    skus: skus.map(transformSKU),
    createdAt: dbProduct.created_at,
    updatedAt: dbProduct.updated_at,
    imageUrl: dbProduct.image_url || undefined,
    imageStoragePath: dbProduct.image_storage_path || undefined,
  }
}

// Map database condition to frontend condition
// Note: DB enum now uses hyphens, so this is a 1:1 mapping
function mapCondition(dbCondition: DbProductSKU['condition']): ProductSKU['condition'] {
  return dbCondition
}

// Map frontend condition to database condition
// Note: DB enum now uses hyphens, so this is a 1:1 mapping
function mapConditionToDb(condition: ProductSKU['condition']): DbProductSKU['condition'] {
  return condition
}

// Transform database SKU to frontend SKU
function transformSKU(dbSku: DbProductSKU): ProductSKU {
  return {
    id: dbSku.id,
    productId: dbSku.product_id,
    sku: dbSku.sku,
    condition: mapCondition(dbSku.condition),
    asin: dbSku.asin || undefined,
    fnsku: dbSku.fnsku || undefined,
    upc: dbSku.upc || undefined,
    ean: dbSku.ean || undefined,
    isDefault: dbSku.is_default,
    notes: dbSku.notes || undefined,
    stockLevel: 0, // Will be computed from stock breakdown
    createdAt: dbSku.created_at,
    updatedAt: dbSku.updated_at,
  }
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch all products with their SKUs
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (productsError) throw productsError

      if (!productsData || productsData.length === 0) {
        setProducts([])
        return
      }

      // Fetch SKUs for all products
      const productIds = productsData.map(p => p.id)
      const { data: skusData, error: skusError } = await supabase
        .from('product_skus')
        .select('*')
        .in('product_id', productIds)

      if (skusError) throw skusError

      // Group SKUs by product
      const skusByProduct = (skusData || []).reduce((acc, sku) => {
        if (!acc[sku.product_id]) acc[sku.product_id] = []
        acc[sku.product_id].push(sku)
        return acc
      }, {} as Record<string, DbProductSKU[]>)

      // Transform products
      const transformedProducts = productsData.map(p =>
        transformProduct(p, skusByProduct[p.id] || [])
      )

      setProducts(transformedProducts)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch products'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Helper to validate UUID format
  const isValidUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  // Create product
  const createProduct = useCallback(async (data: ProductFormData): Promise<Product | null> => {
    try {
      // Validate supplier_id - set to null if not a valid UUID (mock suppliers)
      const supplierId = data.supplierId && isValidUUID(data.supplierId) ? data.supplierId : null

      // Insert product
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          brand_id: data.brandId,
          sku: data.sku,
          name: data.name,
          description: data.description || null,
          category: data.category || null,
          unit_cost: data.unitCost,
          supplier_id: supplierId,
          status: data.status as ProductStatus,
          product_type: data.productType as ProductType,
        })
        .select()
        .single()

      if (productError) throw productError

      // Create default SKU
      const { data: newSku, error: skuError } = await supabase
        .from('product_skus')
        .insert({
          product_id: newProduct.id,
          sku: data.sku,
          condition: 'new',
          asin: data.asin || null,
          fnsku: data.fnsku || null,
          is_default: true,
        })
        .select()
        .single()

      if (skuError) throw skuError

      const product = transformProduct(newProduct, [newSku])
      setProducts(prev => [product, ...prev])
      return product
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create product'))
      return null
    }
  }, [supabase])

  // Update product
  const updateProduct = useCallback(async (id: string, data: Partial<ProductFormData>): Promise<Product | null> => {
    try {
      const updateData: Record<string, unknown> = {}
      if (data.brandId !== undefined) updateData.brand_id = data.brandId
      if (data.sku !== undefined) updateData.sku = data.sku
      if (data.name !== undefined) updateData.name = data.name
      if (data.description !== undefined) updateData.description = data.description || null
      if (data.category !== undefined) updateData.category = data.category || null
      if (data.unitCost !== undefined) updateData.unit_cost = data.unitCost
      if (data.supplierId !== undefined) {
        // Validate supplier_id - set to null if not a valid UUID
        updateData.supplier_id = data.supplierId && isValidUUID(data.supplierId) ? data.supplierId : null
      }
      if (data.status !== undefined) updateData.status = data.status
      if (data.productType !== undefined) updateData.product_type = data.productType

      const { data: updatedProduct, error: productError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (productError) throw productError

      // Update default SKU if ASIN/FNSKU changed
      if (data.asin !== undefined || data.fnsku !== undefined) {
        const skuUpdate: Record<string, unknown> = {}
        if (data.asin !== undefined) skuUpdate.asin = data.asin || null
        if (data.fnsku !== undefined) skuUpdate.fnsku = data.fnsku || null

        await supabase
          .from('product_skus')
          .update(skuUpdate)
          .eq('product_id', id)
          .eq('is_default', true)
      }

      // Fetch updated SKUs
      const { data: skusData } = await supabase
        .from('product_skus')
        .select('*')
        .eq('product_id', id)

      const product = transformProduct(updatedProduct, skusData || [])
      setProducts(prev => prev.map(p => p.id === id ? product : p))
      return product
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update product'))
      return null
    }
  }, [supabase])

  // Archive product
  const archiveProduct = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'archived' as ProductStatus })
        .eq('id', id)

      if (error) throw error

      setProducts(prev => prev.map(p =>
        p.id === id ? { ...p, status: 'archived' as ProductStatus } : p
      ))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to archive product'))
      return false
    }
  }, [supabase])

  // Delete product
  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    try {
      // SKUs will cascade delete due to foreign key constraint
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) throw error

      setProducts(prev => prev.filter(p => p.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete product'))
      return false
    }
  }, [supabase])

  // Add SKU to product
  const addSKU = useCallback(async (productId: string, skuData: Omit<ProductSKU, 'id' | 'productId' | 'stockLevel' | 'createdAt' | 'updatedAt'>): Promise<ProductSKU | null> => {
    try {
      // If this is the new default, unset current default
      if (skuData.isDefault) {
        await supabase
          .from('product_skus')
          .update({ is_default: false })
          .eq('product_id', productId)
          .eq('is_default', true)
      }

      const { data: newSku, error } = await supabase
        .from('product_skus')
        .insert({
          product_id: productId,
          sku: skuData.sku,
          condition: mapConditionToDb(skuData.condition),
          asin: skuData.asin || null,
          fnsku: skuData.fnsku || null,
          upc: skuData.upc || null,
          ean: skuData.ean || null,
          is_default: skuData.isDefault,
          unit_cost_override: skuData.unitCostOverride || null,
          notes: skuData.notes || null,
        })
        .select()
        .single()

      if (error) throw error

      const transformedSku = transformSKU(newSku)

      // Update local products state
      setProducts(prev => prev.map(p => {
        if (p.id !== productId) return p

        const updatedSkus = skuData.isDefault
          ? (p.skus || []).map(s => ({ ...s, isDefault: false }))
          : (p.skus || [])

        return {
          ...p,
          skus: [...updatedSkus, transformedSku],
          sku: skuData.isDefault ? skuData.sku : p.sku,
          asin: skuData.isDefault ? (skuData.asin || '') : p.asin,
          fnsku: skuData.isDefault ? (skuData.fnsku || '') : p.fnsku,
        }
      }))

      return transformedSku
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add SKU'))
      return null
    }
  }, [supabase])

  // Delete SKU
  const deleteSKU = useCallback(async (productId: string, skuId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('product_skus')
        .delete()
        .eq('id', skuId)

      if (error) throw error

      setProducts(prev => prev.map(p => {
        if (p.id !== productId) return p
        return {
          ...p,
          skus: (p.skus || []).filter(s => s.id !== skuId),
        }
      }))

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete SKU'))
      return false
    }
  }, [supabase])

  // Export products to CSV
  const exportProductsCSV = useCallback(() => {
    const headers = [
      'SKU',
      'Name',
      'Description',
      'Category',
      'Brand ID',
      'Supplier ID',
      'Unit Cost',
      'ASIN',
      'FNSKU',
      'Status',
      'Stock Level',
      'Created At',
    ]

    const rows = products.map(p => [
      p.sku,
      p.name,
      p.description || '',
      p.category || '',
      p.brandId,
      p.supplierId,
      p.unitCost.toString(),
      p.asin || '',
      p.fnsku || '',
      p.status,
      p.stockLevel.toString(),
      p.createdAt || '',
    ])

    // Escape CSV values
    const escapeCSV = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }

    const csv = [headers, ...rows]
      .map(row => row.map(escapeCSV).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [products])

  // Update product image
  const updateProductImage = useCallback(async (
    productId: string,
    imageUrl: string | null,
    imageStoragePath: string | null
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('products')
        .update({
          image_url: imageUrl,
          image_storage_path: imageStoragePath,
        })
        .eq('id', productId)

      if (error) throw error

      // Update local state
      setProducts(prev => prev.map(p =>
        p.id === productId
          ? { ...p, imageUrl: imageUrl || undefined, imageStoragePath: imageStoragePath || undefined }
          : p
      ))

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update product image'))
      return false
    }
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    archiveProduct,
    deleteProduct,
    addSKU,
    deleteSKU,
    exportProductsCSV,
    updateProductImage,
  }
}
