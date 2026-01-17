'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../client'

// ============================================================================
// Types
// ============================================================================

export type ProductType = 'simple' | 'component' | 'finished_good'

export interface BOMLineItem {
  id: string
  bomId: string
  componentProductId: string
  componentSku: string
  componentName: string
  quantityRequired: number
  uom: string
  positionNotes: string | null
  sortOrder: number
  componentUnitCost: number
}

export interface BOMExpenseItem {
  id: string
  bomId: string
  name: string
  description: string | null
  amount: number
  isPerUnit: boolean
  sortOrder: number
}

export interface BOM {
  id: string
  finishedProductId: string
  finishedProductSku: string
  finishedProductName: string
  name: string
  version: string
  isActive: boolean
  outputQuantity: number
  expectedScrapPercent: number
  notes: string | null
  lineItems: BOMLineItem[]
  expenseItems: BOMExpenseItem[]
  componentCount: number
  estimatedUnitCost: number
  createdByName: string | null
  createdAt: string
  updatedAt: string
}

export interface BOMFormData {
  finishedProductId: string
  name: string
  version?: string
  outputQuantity?: number
  expectedScrapPercent?: number
  notes?: string
  lineItems: {
    componentProductId: string
    quantityRequired: number
    uom?: string
    positionNotes?: string
  }[]
  expenseItems?: {
    name: string
    description?: string
    amount: number
    isPerUnit: boolean
  }[]
}

export interface ComponentUsage {
  componentId: string
  componentSku: string
  componentName: string
  usedInBomCount: number
  bomUsage: {
    bomId: string
    bomName: string
    finishedProductName: string
    quantityRequired: number
  }[]
}

// ============================================================================
// Transform Functions
// ============================================================================

function transformBOM(dbBOM: any): BOM {
  return {
    id: dbBOM.id,
    finishedProductId: dbBOM.finished_product_id,
    finishedProductSku: dbBOM.finished_product?.sku || '',
    finishedProductName: dbBOM.finished_product?.name || '',
    name: dbBOM.name,
    version: dbBOM.version,
    isActive: dbBOM.is_active,
    outputQuantity: dbBOM.output_quantity,
    expectedScrapPercent: Number(dbBOM.expected_scrap_percent) || 0,
    notes: dbBOM.notes,
    lineItems: (dbBOM.bom_line_items || []).map(transformLineItem),
    expenseItems: (dbBOM.bom_expense_items || []).map(transformExpenseItem),
    componentCount: dbBOM.bom_line_items?.length || 0,
    estimatedUnitCost: 0, // Will be calculated
    createdByName: dbBOM.created_by_name,
    createdAt: dbBOM.created_at,
    updatedAt: dbBOM.updated_at,
  }
}

function transformLineItem(dbItem: any): BOMLineItem {
  return {
    id: dbItem.id,
    bomId: dbItem.bom_id,
    componentProductId: dbItem.component_product_id,
    componentSku: dbItem.component_product?.sku || '',
    componentName: dbItem.component_product?.name || '',
    quantityRequired: Number(dbItem.quantity_required),
    uom: dbItem.uom,
    positionNotes: dbItem.position_notes,
    sortOrder: dbItem.sort_order,
    componentUnitCost: Number(dbItem.component_product?.unit_cost) || 0,
  }
}

function transformExpenseItem(dbItem: any): BOMExpenseItem {
  return {
    id: dbItem.id,
    bomId: dbItem.bom_id,
    name: dbItem.name,
    description: dbItem.description,
    amount: Number(dbItem.amount) || 0,
    isPerUnit: dbItem.is_per_unit,
    sortOrder: dbItem.sort_order,
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useBOMs() {
  const [boms, setBOMs] = useState<BOM[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch all BOMs with line items
  const fetchBOMs = useCallback(async (activeOnly: boolean = true) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('boms')
        .select(`
          *,
          finished_product:products!finished_product_id(id, sku, name, unit_cost),
          bom_line_items(
            *,
            component_product:products!component_product_id(id, sku, name, unit_cost)
          ),
          bom_expense_items(*)
        `)
        .order('created_at', { ascending: false })

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      const transformedBOMs = (data || []).map((bom) => {
        const transformed = transformBOM(bom)
        // Calculate estimated cost
        // Calculate component costs
        const componentCost = transformed.lineItems.reduce(
          (sum, item) => sum + (item.quantityRequired * item.componentUnitCost),
          0
        )
        // All expenses are per-unit
        const expenseCost = transformed.expenseItems.reduce((sum, exp) => sum + exp.amount, 0)
        transformed.estimatedUnitCost = (componentCost / (transformed.outputQuantity || 1)) + expenseCost
        return transformed
      })

      setBOMs(transformedBOMs)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch BOMs'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch single BOM
  const fetchBOM = useCallback(async (id: string): Promise<BOM | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('boms')
        .select(`
          *,
          finished_product:products!finished_product_id(id, sku, name, unit_cost),
          bom_line_items(
            *,
            component_product:products!component_product_id(id, sku, name, unit_cost)
          ),
          bom_expense_items(*)
        `)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      const transformed = transformBOM(data)
      transformed.estimatedUnitCost = transformed.lineItems.reduce(
        (sum, item) => sum + (item.quantityRequired * item.componentUnitCost),
        0
      ) / (transformed.outputQuantity || 1)

      return transformed
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch BOM'))
      return null
    }
  }, [supabase])

  // Fetch BOM by finished product ID
  const fetchBOMByProduct = useCallback(async (productId: string): Promise<BOM | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('boms')
        .select(`
          *,
          finished_product:products!finished_product_id(id, sku, name, unit_cost),
          bom_line_items(
            *,
            component_product:products!component_product_id(id, sku, name, unit_cost)
          ),
          bom_expense_items(*)
        `)
        .eq('finished_product_id', productId)
        .eq('is_active', true)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') return null // No rows found
        throw fetchError
      }

      const transformed = transformBOM(data)
      transformed.estimatedUnitCost = transformed.lineItems.reduce(
        (sum, item) => sum + (item.quantityRequired * item.componentUnitCost),
        0
      ) / (transformed.outputQuantity || 1)

      return transformed
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch BOM'))
      return null
    }
  }, [supabase])

  // Create BOM
  const createBOM = useCallback(async (data: BOMFormData): Promise<BOM | null> => {
    try {
      // Create BOM
      const { data: newBOM, error: bomError } = await supabase
        .from('boms')
        .insert({
          finished_product_id: data.finishedProductId,
          name: data.name,
          version: data.version || 'v1.0',
          output_quantity: data.outputQuantity || 1,
          expected_scrap_percent: data.expectedScrapPercent || 0,
          notes: data.notes,
        })
        .select()
        .single()

      if (bomError) throw bomError

      // Create line items
      if (data.lineItems.length > 0) {
        const lineItemsToInsert = data.lineItems.map((item, index) => ({
          bom_id: newBOM.id,
          component_product_id: item.componentProductId,
          quantity_required: item.quantityRequired,
          uom: item.uom || 'each',
          position_notes: item.positionNotes,
          sort_order: index,
        }))

        const { error: lineError } = await supabase
          .from('bom_line_items')
          .insert(lineItemsToInsert)

        if (lineError) throw lineError
      }

      // Create expense items
      if (data.expenseItems && data.expenseItems.length > 0) {
        const expenseItemsToInsert = data.expenseItems.map((item, index) => ({
          bom_id: newBOM.id,
          name: item.name,
          description: item.description,
          amount: item.amount,
          is_per_unit: item.isPerUnit,
          sort_order: index,
        }))

        const { error: expenseError } = await supabase
          .from('bom_expense_items')
          .insert(expenseItemsToInsert)

        if (expenseError) throw expenseError
      }

      // Fetch and return the complete BOM
      return await fetchBOM(newBOM.id)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create BOM'))
      return null
    }
  }, [supabase, fetchBOM])

  // Update BOM
  const updateBOM = useCallback(async (id: string, data: Partial<BOMFormData>): Promise<BOM | null> => {
    try {
      // Update BOM fields
      const updateData: Record<string, unknown> = {}
      if (data.finishedProductId) updateData.finished_product_id = data.finishedProductId
      if (data.name) updateData.name = data.name
      if (data.version) updateData.version = data.version
      if (data.outputQuantity !== undefined) updateData.output_quantity = data.outputQuantity
      if (data.expectedScrapPercent !== undefined) updateData.expected_scrap_percent = data.expectedScrapPercent
      if (data.notes !== undefined) updateData.notes = data.notes

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('boms')
          .update(updateData)
          .eq('id', id)

        if (updateError) throw updateError
      }

      // Update line items if provided
      if (data.lineItems !== undefined) {
        // Delete existing line items
        const { error: deleteError } = await supabase
          .from('bom_line_items')
          .delete()
          .eq('bom_id', id)

        if (deleteError) throw deleteError

        // Insert new line items
        if (data.lineItems.length > 0) {
          const lineItemsToInsert = data.lineItems.map((item, index) => ({
            bom_id: id,
            component_product_id: item.componentProductId,
            quantity_required: item.quantityRequired,
            uom: item.uom || 'each',
            position_notes: item.positionNotes,
            sort_order: index,
          }))

          const { error: lineError } = await supabase
            .from('bom_line_items')
            .insert(lineItemsToInsert)

          if (lineError) throw lineError
        }
      }

      // Update expense items if provided
      if (data.expenseItems !== undefined) {
        // Delete existing expense items
        const { error: deleteExpenseError } = await supabase
          .from('bom_expense_items')
          .delete()
          .eq('bom_id', id)

        if (deleteExpenseError) throw deleteExpenseError

        // Insert new expense items
        if (data.expenseItems.length > 0) {
          const expenseItemsToInsert = data.expenseItems.map((item, index) => ({
            bom_id: id,
            name: item.name,
            description: item.description,
            amount: item.amount,
            is_per_unit: item.isPerUnit,
            sort_order: index,
          }))

          const { error: expenseError } = await supabase
            .from('bom_expense_items')
            .insert(expenseItemsToInsert)

          if (expenseError) throw expenseError
        }
      }

      // Fetch and return updated BOM
      return await fetchBOM(id)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update BOM'))
      return null
    }
  }, [supabase, fetchBOM])

  // Archive/Deactivate BOM
  const archiveBOM = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: archiveError } = await supabase
        .from('boms')
        .update({ is_active: false })
        .eq('id', id)

      if (archiveError) throw archiveError

      setBOMs(prev => prev.filter(b => b.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to archive BOM'))
      return false
    }
  }, [supabase])

  // Delete BOM (hard delete)
  const deleteBOM = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('boms')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setBOMs(prev => prev.filter(b => b.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete BOM'))
      return false
    }
  }, [supabase])

  // Create new version
  const createVersion = useCallback(async (
    bomId: string,
    newVersion: string,
    changeDescription: string
  ): Promise<boolean> => {
    try {
      const { error: versionError } = await supabase
        .rpc('create_bom_version', {
          p_bom_id: bomId,
          p_new_version: newVersion,
          p_change_description: changeDescription,
        })

      if (versionError) throw versionError

      await fetchBOMs()
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create version'))
      return false
    }
  }, [supabase, fetchBOMs])

  // Fetch component usage (which BOMs use a component)
  const fetchComponentUsage = useCallback(async (componentId: string): Promise<ComponentUsage | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('bom_line_items')
        .select(`
          bom_id,
          quantity_required,
          bom:boms!inner(
            id,
            name,
            is_active,
            finished_product:products!finished_product_id(name)
          ),
          component:products!component_product_id(id, sku, name)
        `)
        .eq('component_product_id', componentId)
        .eq('bom.is_active', true)

      if (fetchError) throw fetchError

      if (!data || data.length === 0) return null

      // Handle Supabase's join response format
      const firstItem = data[0] as any
      const component = Array.isArray(firstItem.component)
        ? firstItem.component[0]
        : firstItem.component

      return {
        componentId: component?.id || componentId,
        componentSku: component?.sku || '',
        componentName: component?.name || '',
        usedInBomCount: data.length,
        bomUsage: data.map((item: any) => {
          const bom = Array.isArray(item.bom) ? item.bom[0] : item.bom
          const finishedProduct = bom?.finished_product
          const fpName = Array.isArray(finishedProduct)
            ? finishedProduct[0]?.name
            : finishedProduct?.name
          return {
            bomId: bom?.id || '',
            bomName: bom?.name || '',
            finishedProductName: fpName || '',
            quantityRequired: Number(item.quantity_required),
          }
        }),
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch component usage'))
      return null
    }
  }, [supabase])

  // Fetch products by type
  const fetchProductsByType = useCallback(async (productType: ProductType) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('id, sku, name, unit_cost, product_type')
        .eq('product_type', productType)
        .eq('status', 'active')
        .order('name')

      if (fetchError) throw fetchError

      return data || []
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch products'))
      return []
    }
  }, [supabase])

  // Fetch all active products (used as components or finished goods)
  const fetchAllProducts = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('id, sku, name, unit_cost')
        .eq('status', 'active')
        .order('name')

      if (fetchError) throw fetchError

      return data || []
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch products'))
      return []
    }
  }, [supabase])

  // Fetch components - only products marked as 'component' type
  // Optionally filter by brandId to only show components from the same brand
  const fetchComponents = useCallback(async (brandId?: string) => {
    try {
      let query = supabase
        .from('products')
        .select('id, sku, name, unit_cost, product_type, brand_id')
        .eq('product_type', 'component')
        .eq('status', 'active')

      // Filter by brand if provided
      if (brandId) {
        query = query.eq('brand_id', brandId)
      }

      query = query.order('name')

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      return (data || []).map(item => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        unit_cost: item.unit_cost,
        product_type: item.product_type,
        brandId: item.brand_id,
      }))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch components'))
      return []
    }
  }, [supabase])

  // Fetch finished goods - only products marked as 'finished_good' type
  const fetchFinishedGoods = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('id, sku, name, unit_cost, product_type')
        .eq('product_type', 'finished_good')
        .eq('status', 'active')
        .order('name')

      if (fetchError) throw fetchError
      return data || []
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch finished goods'))
      return []
    }
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    fetchBOMs()
  }, [fetchBOMs])

  return {
    // State
    boms,
    loading,
    error,

    // Actions
    fetchBOMs,
    fetchBOM,
    fetchBOMByProduct,
    createBOM,
    updateBOM,
    archiveBOM,
    deleteBOM,
    createVersion,
    fetchComponentUsage,
    fetchComponents,
    fetchFinishedGoods,
    fetchProductsByType,
  }
}
