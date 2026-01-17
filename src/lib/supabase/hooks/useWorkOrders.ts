'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '../client'

// ============================================================================
// Types
// ============================================================================

export type WorkOrderStatus = 'draft' | 'planned' | 'in_progress' | 'completed' | 'cancelled'
export type WorkOrderCostType = 'kitting_per_unit' | 'kitting_flat' | 'assembly_per_unit' | 'assembly_flat' | 'packaging' | 'labor' | 'other'

export interface WorkOrderComponent {
  id: string
  workOrderId: string
  bomLineItemId: string
  componentBatchId: string
  componentBatchNumber: string
  componentSku: string
  componentName: string
  quantityAllocated: number
  quantityConsumed: number | null
  unitCost: number
  totalCost: number
  sortOrder: number
}

export interface WorkOrderCost {
  id: string
  workOrderId: string
  costType: WorkOrderCostType
  description: string
  amount: number
  isPerUnit: boolean
  perUnitRate: number | null
  quantity: number | null
  invoiceId: string | null
}

export interface WorkOrderStatusHistory {
  id: string
  status: WorkOrderStatus
  note: string | null
  changedByName: string | null
  createdAt: string
}

export interface WorkOrder {
  id: string
  workOrderNumber: string
  bomId: string
  bomName: string
  finishedProductId: string
  finishedProductSku: string
  finishedProductName: string
  status: WorkOrderStatus
  assemblyLocationId: string
  assemblyLocationName: string
  plannedOutputQuantity: number
  actualOutputQuantity: number | null
  scrapQuantity: number
  scheduledStartDate: string | null
  scheduledEndDate: string | null
  actualStartDate: string | null
  actualEndDate: string | null
  outputBatchId: string | null
  outputBatchNumber: string | null
  outputUnitCost: number | null
  notes: string | null
  components: WorkOrderComponent[]
  costs: WorkOrderCost[]
  statusHistory: WorkOrderStatusHistory[]
  totalComponentCost: number
  totalAssemblyCost: number
  createdByName: string | null
  createdAt: string
  updatedAt: string
}

export interface WorkOrderFormData {
  bomId: string
  assemblyLocationId: string
  plannedOutputQuantity: number
  scheduledStartDate?: string
  scheduledEndDate?: string
  notes?: string
  components: {
    bomLineItemId: string
    componentBatchId: string
    quantityAllocated: number
    unitCost: number
  }[]
  costs?: {
    costType: WorkOrderCostType
    description: string
    amount: number
    isPerUnit?: boolean
    perUnitRate?: number
    quantity?: number
  }[]
}

export interface WorkOrdersByStatus {
  draft: WorkOrder[]
  planned: WorkOrder[]
  in_progress: WorkOrder[]
  completed: WorkOrder[]
  cancelled: WorkOrder[]
}

export interface AvailableComponentStock {
  batchId: string
  batchNumber: string
  sku: string
  productName: string
  productId: string
  locationId: string
  locationName: string
  availableQuantity: number
  unitCost: number
}

// ============================================================================
// Transform Functions
// ============================================================================

function transformWorkOrder(dbWO: any): WorkOrder {
  return {
    id: dbWO.id,
    workOrderNumber: dbWO.work_order_number,
    bomId: dbWO.bom_id,
    bomName: dbWO.bom?.name || '',
    finishedProductId: dbWO.bom?.finished_product_id || '',
    finishedProductSku: dbWO.bom?.finished_product?.sku || '',
    finishedProductName: dbWO.bom?.finished_product?.name || '',
    status: dbWO.status,
    assemblyLocationId: dbWO.assembly_location_id,
    assemblyLocationName: dbWO.assembly_location?.name || '',
    plannedOutputQuantity: dbWO.planned_output_quantity,
    actualOutputQuantity: dbWO.actual_output_quantity,
    scrapQuantity: dbWO.scrap_quantity || 0,
    scheduledStartDate: dbWO.scheduled_start_date,
    scheduledEndDate: dbWO.scheduled_end_date,
    actualStartDate: dbWO.actual_start_date,
    actualEndDate: dbWO.actual_end_date,
    outputBatchId: dbWO.output_batch_id,
    outputBatchNumber: dbWO.output_batch?.batch_number || null,
    outputUnitCost: dbWO.output_batch?.unit_cost || null,
    notes: dbWO.notes,
    components: (dbWO.work_order_components || []).map(transformComponent),
    costs: (dbWO.work_order_costs || []).map(transformCost),
    statusHistory: (dbWO.work_order_status_history || []).map(transformStatusHistory),
    totalComponentCost: (dbWO.work_order_components || []).reduce(
      (sum: number, c: any) => sum + Number(c.total_cost || 0),
      0
    ),
    totalAssemblyCost: (dbWO.work_order_costs || []).reduce(
      (sum: number, c: any) => sum + Number(c.amount || 0),
      0
    ),
    createdByName: dbWO.created_by_name,
    createdAt: dbWO.created_at,
    updatedAt: dbWO.updated_at,
  }
}

function transformComponent(dbComp: any): WorkOrderComponent {
  return {
    id: dbComp.id,
    workOrderId: dbComp.work_order_id,
    bomLineItemId: dbComp.bom_line_item_id,
    componentBatchId: dbComp.component_batch_id,
    componentBatchNumber: dbComp.component_batch?.batch_number || '',
    componentSku: dbComp.component_batch?.sku || dbComp.sku || '',
    componentName: dbComp.component_batch?.product_name || dbComp.product_name || '',
    quantityAllocated: dbComp.quantity_allocated,
    quantityConsumed: dbComp.quantity_consumed,
    unitCost: Number(dbComp.unit_cost),
    totalCost: Number(dbComp.total_cost),
    sortOrder: dbComp.sort_order,
  }
}

function transformCost(dbCost: any): WorkOrderCost {
  return {
    id: dbCost.id,
    workOrderId: dbCost.work_order_id,
    costType: dbCost.cost_type,
    description: dbCost.description,
    amount: Number(dbCost.amount),
    isPerUnit: dbCost.is_per_unit,
    perUnitRate: dbCost.per_unit_rate ? Number(dbCost.per_unit_rate) : null,
    quantity: dbCost.quantity,
    invoiceId: dbCost.invoice_id,
  }
}

function transformStatusHistory(dbHistory: any): WorkOrderStatusHistory {
  return {
    id: dbHistory.id,
    status: dbHistory.status,
    note: dbHistory.note,
    changedByName: dbHistory.changed_by_name,
    createdAt: dbHistory.created_at,
  }
}

// ============================================================================
// Status Transition Validation
// ============================================================================

const VALID_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  draft: ['planned', 'cancelled'],
  planned: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

export function canTransitionTo(currentStatus: WorkOrderStatus, targetStatus: WorkOrderStatus): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(targetStatus) || false
}

export function getAvailableTransitions(currentStatus: WorkOrderStatus): WorkOrderStatus[] {
  return VALID_TRANSITIONS[currentStatus] || []
}

// ============================================================================
// Hook
// ============================================================================

export function useWorkOrders() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Group work orders by status
  const workOrdersByStatus = useMemo<WorkOrdersByStatus>(() => {
    return {
      draft: workOrders.filter(wo => wo.status === 'draft'),
      planned: workOrders.filter(wo => wo.status === 'planned'),
      in_progress: workOrders.filter(wo => wo.status === 'in_progress'),
      completed: workOrders.filter(wo => wo.status === 'completed'),
      cancelled: workOrders.filter(wo => wo.status === 'cancelled'),
    }
  }, [workOrders])

  // Fetch all work orders
  const fetchWorkOrders = useCallback(async (excludeCompleted: boolean = false) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('work_orders')
        .select(`
          *,
          bom:boms(
            id,
            name,
            finished_product_id,
            finished_product:products!finished_product_id(id, sku, name)
          ),
          assembly_location:locations(id, name),
          output_batch:batches(id, batch_number, unit_cost),
          work_order_components(
            *,
            component_batch:batches(id, batch_number, sku, product_name, unit_cost)
          ),
          work_order_costs(*),
          work_order_status_history(*)
        `)
        .order('created_at', { ascending: false })

      if (excludeCompleted) {
        query = query.not('status', 'in', '("completed","cancelled")')
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      const transformedWOs = (data || []).map(transformWorkOrder)
      setWorkOrders(transformedWOs)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch work orders'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch single work order
  const fetchWorkOrder = useCallback(async (id: string): Promise<WorkOrder | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('work_orders')
        .select(`
          *,
          bom:boms(
            id,
            name,
            finished_product_id,
            finished_product:products!finished_product_id(id, sku, name)
          ),
          assembly_location:locations(id, name),
          output_batch:batches(id, batch_number, unit_cost),
          work_order_components(
            *,
            component_batch:batches(id, batch_number, sku, product_name, unit_cost)
          ),
          work_order_costs(*),
          work_order_status_history(*)
        `)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      return transformWorkOrder(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch work order'))
      return null
    }
  }, [supabase])

  // Create work order
  const createWorkOrder = useCallback(async (data: WorkOrderFormData): Promise<WorkOrder | null> => {
    try {
      // Create work order
      const { data: newWO, error: woError } = await supabase
        .from('work_orders')
        .insert({
          bom_id: data.bomId,
          assembly_location_id: data.assemblyLocationId,
          planned_output_quantity: data.plannedOutputQuantity,
          scheduled_start_date: data.scheduledStartDate,
          scheduled_end_date: data.scheduledEndDate,
          notes: data.notes,
        })
        .select()
        .single()

      if (woError) throw woError

      // Add components
      if (data.components.length > 0) {
        const componentsToInsert = data.components.map((comp, index) => ({
          work_order_id: newWO.id,
          bom_line_item_id: comp.bomLineItemId,
          component_batch_id: comp.componentBatchId,
          quantity_allocated: comp.quantityAllocated,
          unit_cost: comp.unitCost,
          sort_order: index,
        }))

        const { error: compError } = await supabase
          .from('work_order_components')
          .insert(componentsToInsert)

        if (compError) throw compError
      }

      // Add costs
      if (data.costs && data.costs.length > 0) {
        const costsToInsert = data.costs.map(cost => ({
          work_order_id: newWO.id,
          cost_type: cost.costType,
          description: cost.description,
          amount: cost.amount,
          is_per_unit: cost.isPerUnit || false,
          per_unit_rate: cost.perUnitRate,
          quantity: cost.quantity,
        }))

        const { error: costError } = await supabase
          .from('work_order_costs')
          .insert(costsToInsert)

        if (costError) throw costError
      }

      return await fetchWorkOrder(newWO.id)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create work order'))
      return null
    }
  }, [supabase, fetchWorkOrder])

  // Update work order
  const updateWorkOrder = useCallback(async (
    id: string,
    data: Partial<WorkOrderFormData>
  ): Promise<WorkOrder | null> => {
    try {
      const updateData: Record<string, unknown> = {}
      if (data.bomId) updateData.bom_id = data.bomId
      if (data.assemblyLocationId) updateData.assembly_location_id = data.assemblyLocationId
      if (data.plannedOutputQuantity !== undefined) updateData.planned_output_quantity = data.plannedOutputQuantity
      if (data.scheduledStartDate !== undefined) updateData.scheduled_start_date = data.scheduledStartDate
      if (data.scheduledEndDate !== undefined) updateData.scheduled_end_date = data.scheduledEndDate
      if (data.notes !== undefined) updateData.notes = data.notes

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('work_orders')
          .update(updateData)
          .eq('id', id)

        if (updateError) throw updateError
      }

      // Update components if provided
      if (data.components !== undefined) {
        // Delete existing
        await supabase.from('work_order_components').delete().eq('work_order_id', id)

        // Insert new
        if (data.components.length > 0) {
          const componentsToInsert = data.components.map((comp, index) => ({
            work_order_id: id,
            bom_line_item_id: comp.bomLineItemId,
            component_batch_id: comp.componentBatchId,
            quantity_allocated: comp.quantityAllocated,
            unit_cost: comp.unitCost,
            sort_order: index,
          }))

          const { error: compError } = await supabase
            .from('work_order_components')
            .insert(componentsToInsert)

          if (compError) throw compError
        }
      }

      // Update costs if provided
      if (data.costs !== undefined) {
        // Delete existing
        await supabase.from('work_order_costs').delete().eq('work_order_id', id)

        // Insert new
        if (data.costs.length > 0) {
          const costsToInsert = data.costs.map(cost => ({
            work_order_id: id,
            cost_type: cost.costType,
            description: cost.description,
            amount: cost.amount,
            is_per_unit: cost.isPerUnit || false,
            per_unit_rate: cost.perUnitRate,
            quantity: cost.quantity,
          }))

          const { error: costError } = await supabase
            .from('work_order_costs')
            .insert(costsToInsert)

          if (costError) throw costError
        }
      }

      return await fetchWorkOrder(id)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update work order'))
      return null
    }
  }, [supabase, fetchWorkOrder])

  // Update status
  const updateStatus = useCallback(async (
    id: string,
    newStatus: WorkOrderStatus,
    note?: string
  ): Promise<boolean> => {
    try {
      // Get current status
      const { data: currentWO, error: fetchError } = await supabase
        .from('work_orders')
        .select('status')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      if (!canTransitionTo(currentWO.status, newStatus)) {
        throw new Error(`Cannot transition from ${currentWO.status} to ${newStatus}`)
      }

      const { error: updateError } = await supabase
        .from('work_orders')
        .update({ status: newStatus })
        .eq('id', id)

      if (updateError) throw updateError

      // Add note to history if provided
      if (note) {
        await supabase
          .from('work_order_status_history')
          .update({ note })
          .eq('work_order_id', id)
          .eq('status', newStatus)
          .order('created_at', { ascending: false })
          .limit(1)
      }

      await fetchWorkOrders()
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update status'))
      return false
    }
  }, [supabase, fetchWorkOrders])

  // Complete work order (calls database function)
  const completeWorkOrder = useCallback(async (
    id: string,
    actualOutputQuantity: number,
    scrapQuantity: number = 0,
    notes?: string
  ): Promise<string | null> => {
    try {
      const { data: outputBatchId, error: completeError } = await supabase
        .rpc('complete_work_order', {
          p_work_order_id: id,
          p_actual_output_quantity: actualOutputQuantity,
          p_scrap_quantity: scrapQuantity,
          p_notes: notes,
        })

      if (completeError) throw completeError

      await fetchWorkOrders()
      return outputBatchId
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to complete work order'))
      return null
    }
  }, [supabase, fetchWorkOrders])

  // Cancel work order
  const cancelWorkOrder = useCallback(async (id: string, reason?: string): Promise<boolean> => {
    return updateStatus(id, 'cancelled', reason)
  }, [updateStatus])

  // Delete work order (only draft)
  const deleteWorkOrder = useCallback(async (id: string): Promise<boolean> => {
    try {
      // Check status
      const { data: wo, error: fetchError } = await supabase
        .from('work_orders')
        .select('status')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      if (wo.status !== 'draft') {
        throw new Error('Can only delete draft work orders')
      }

      const { error: deleteError } = await supabase
        .from('work_orders')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setWorkOrders(prev => prev.filter(w => w.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete work order'))
      return false
    }
  }, [supabase])

  // Add cost to work order
  const addCost = useCallback(async (
    workOrderId: string,
    cost: {
      costType: WorkOrderCostType
      description: string
      amount: number
      isPerUnit?: boolean
      perUnitRate?: number
      quantity?: number
    }
  ): Promise<boolean> => {
    try {
      const { error: insertError } = await supabase
        .from('work_order_costs')
        .insert({
          work_order_id: workOrderId,
          cost_type: cost.costType,
          description: cost.description,
          amount: cost.amount,
          is_per_unit: cost.isPerUnit || false,
          per_unit_rate: cost.perUnitRate,
          quantity: cost.quantity,
        })

      if (insertError) throw insertError

      await fetchWorkOrders()
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add cost'))
      return false
    }
  }, [supabase, fetchWorkOrders])

  // Remove cost
  const removeCost = useCallback(async (costId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('work_order_costs')
        .delete()
        .eq('id', costId)

      if (deleteError) throw deleteError

      await fetchWorkOrders()
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to remove cost'))
      return false
    }
  }, [supabase, fetchWorkOrders])

  // Fetch available component stock at a location
  const fetchAvailableStock = useCallback(async (
    locationId: string,
    productId?: string
  ): Promise<AvailableComponentStock[]> => {
    try {
      let query = supabase
        .from('stock_by_location')
        .select('*')
        .eq('location_id', locationId)
        .gt('total_quantity', 0)

      if (productId) {
        // Get product SKU first
        const { data: product } = await supabase
          .from('products')
          .select('sku')
          .eq('id', productId)
          .single()

        if (product) {
          query = query.eq('sku', product.sku)
        }
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      return (data || []).map(stock => ({
        batchId: stock.batch_id,
        batchNumber: stock.batch_number,
        sku: stock.sku,
        productName: stock.product_name,
        productId: '', // Would need to join to get this
        locationId: stock.location_id,
        locationName: stock.location_name,
        availableQuantity: Number(stock.total_quantity),
        unitCost: Number(stock.unit_cost),
      }))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch available stock'))
      return []
    }
  }, [supabase])

  // Split batch (calls database function)
  const splitBatch = useCallback(async (
    batchId: string,
    splitQuantity: number,
    locationId: string,
    reason?: string
  ): Promise<string | null> => {
    try {
      const { data: newBatchId, error: splitError } = await supabase
        .rpc('split_batch', {
          p_batch_id: batchId,
          p_split_quantity: splitQuantity,
          p_location_id: locationId,
          p_reason: reason || 'Split for work order allocation',
        })

      if (splitError) throw splitError

      return newBatchId
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to split batch'))
      return null
    }
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    fetchWorkOrders()
  }, [fetchWorkOrders])

  return {
    // State
    workOrders,
    workOrdersByStatus,
    loading,
    error,

    // Actions
    fetchWorkOrders,
    fetchWorkOrder,
    createWorkOrder,
    updateWorkOrder,
    updateStatus,
    completeWorkOrder,
    cancelWorkOrder,
    deleteWorkOrder,
    addCost,
    removeCost,
    fetchAvailableStock,
    splitBatch,

    // Helpers
    canTransitionTo,
    getAvailableTransitions,
  }
}
