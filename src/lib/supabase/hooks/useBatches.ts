'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '../client'
import type { Database } from '../database.types'
import type {
  Batch,
  StageHistoryEntry,
  Attachment,
} from '@/sections/inventory/types'

// Derive types from Database
type DbBatch = Database['public']['Tables']['batches']['Row']
type DbBatchStageHistory = Database['public']['Tables']['batch_stage_history']['Row']
type DbBatchAttachment = Database['public']['Tables']['batch_attachments']['Row']
export type BatchStage = Database['public']['Enums']['batch_stage']

// Transform database batch to frontend batch
function transformBatch(
  dbBatch: DbBatch & {
    supplier?: { name: string } | null
    purchase_order?: { po_number: string } | null
    batch_stage_history?: DbBatchStageHistory[]
    batch_attachments?: DbBatchAttachment[]
  }
): Batch {
  return {
    id: dbBatch.id,
    batchNumber: dbBatch.batch_number,
    sku: dbBatch.sku,
    productName: dbBatch.product_name,
    quantity: dbBatch.quantity,
    stage: dbBatch.stage,
    supplierName: dbBatch.supplier?.name || 'Unknown Supplier',
    poNumber: dbBatch.purchase_order?.po_number || dbBatch.batch_number,
    shipmentId: dbBatch.shipment_id,
    unitCost: dbBatch.unit_cost,
    totalCost: dbBatch.total_cost,
    orderedDate: dbBatch.ordered_date,
    expectedArrival: dbBatch.expected_arrival || '',
    actualArrival: dbBatch.actual_arrival,
    notes: dbBatch.notes || '',
    stageHistory: (dbBatch.batch_stage_history || []).map(transformStageHistory),
    attachments: (dbBatch.batch_attachments || []).map(transformAttachment),
  }
}

function transformStageHistory(dbHistory: DbBatchStageHistory): StageHistoryEntry {
  return {
    stage: dbHistory.stage,
    date: dbHistory.created_at,
    note: dbHistory.note || '',
  }
}

function transformAttachment(dbAttachment: DbBatchAttachment): Attachment {
  return {
    id: dbAttachment.id,
    type: dbAttachment.type.startsWith('image/') ? 'photo' : 'document',
    name: dbAttachment.name,
    uploadedAt: dbAttachment.created_at,
  }
}

export interface BatchFormData {
  sku: string
  productName: string
  productId?: string
  quantity: number
  stage?: BatchStage
  supplierId?: string
  poId?: string
  unitCost?: number
  orderedDate?: string
  expectedArrival?: string
  notes?: string
}

export interface BatchesByStage {
  ordered: Batch[]
  factory: Batch[]
  inspected: Batch[]
  'ready_to_ship': Batch[]
  'in-transit': Batch[]
  warehouse: Batch[]
  amazon: Batch[]
}

export function useBatches() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Fetch all batches with related data
  const fetchBatches = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('batches')
        .select(`
          *,
          supplier:suppliers(name),
          purchase_order:purchase_orders(po_number),
          batch_stage_history(*),
          batch_attachments(*)
        `)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const transformedBatches = (data || []).map(transformBatch)
      setBatches(transformedBatches)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch batches'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch single batch with full details
  const fetchBatch = useCallback(async (id: string): Promise<Batch | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('batches')
        .select(`
          *,
          supplier:suppliers(name),
          purchase_order:purchase_orders(po_number),
          batch_stage_history(*),
          batch_attachments(*)
        `)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      return transformBatch(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch batch'))
      return null
    }
  }, [supabase])

  // Create batch
  const createBatch = useCallback(async (data: BatchFormData): Promise<Batch | null> => {
    try {
      const { data: newBatch, error: batchError } = await supabase
        .from('batches')
        .insert({
          sku: data.sku,
          product_name: data.productName,
          product_id: data.productId || null,
          quantity: data.quantity,
          stage: data.stage || 'ordered',
          supplier_id: data.supplierId || null,
          po_id: data.poId || null,
          unit_cost: data.unitCost || 0,
          ordered_date: data.orderedDate || new Date().toISOString().split('T')[0],
          expected_arrival: data.expectedArrival || null,
          notes: data.notes || null,
        })
        .select(`
          *,
          supplier:suppliers(name),
          purchase_order:purchase_orders(po_number)
        `)
        .single()

      if (batchError) throw batchError

      // Refetch to get stage history (initial entry created by trigger)
      const freshBatch = await fetchBatch(newBatch.id)
      if (freshBatch) {
        setBatches(prev => [freshBatch, ...prev])
      }

      return freshBatch
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create batch'))
      return null
    }
  }, [supabase, fetchBatch])

  // Update batch
  const updateBatch = useCallback(async (id: string, data: Partial<BatchFormData>): Promise<Batch | null> => {
    try {
      const updateData: Record<string, unknown> = {}
      if (data.sku !== undefined) updateData.sku = data.sku
      if (data.productName !== undefined) updateData.product_name = data.productName
      if (data.productId !== undefined) updateData.product_id = data.productId || null
      if (data.quantity !== undefined) updateData.quantity = data.quantity
      if (data.stage !== undefined) updateData.stage = data.stage
      if (data.supplierId !== undefined) updateData.supplier_id = data.supplierId || null
      if (data.unitCost !== undefined) updateData.unit_cost = data.unitCost
      if (data.orderedDate !== undefined) updateData.ordered_date = data.orderedDate
      if (data.expectedArrival !== undefined) updateData.expected_arrival = data.expectedArrival || null
      if (data.notes !== undefined) updateData.notes = data.notes || null

      const { error: updateError } = await supabase
        .from('batches')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError

      // Refetch to get updated data
      const freshBatch = await fetchBatch(id)
      if (freshBatch) {
        setBatches(prev => prev.map(b => b.id === id ? freshBatch : b))
      }

      return freshBatch
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update batch'))
      return null
    }
  }, [supabase, fetchBatch])

  // Update batch stage (triggers stage history and change log)
  const updateStage = useCallback(async (id: string, newStage: BatchStage, note?: string): Promise<boolean> => {
    // Get current batch info before optimistic update
    const currentBatch = batches.find(b => b.id === id)
    const previousStage = currentBatch?.stage

    // Don't log if stage didn't actually change
    if (previousStage === newStage) return true

    // Optimistic update - immediately update local state to prevent flicker
    const previousBatches = batches
    setBatches(prev => prev.map(b => b.id === id ? { ...b, stage: newStage } : b))

    try {
      const { error: updateError } = await supabase
        .from('batches')
        .update({ stage: newStage })
        .eq('id', id)

      if (updateError) throw updateError

      // Add note to the stage history if provided
      if (note) {
        await supabase
          .from('batch_stage_history')
          .update({ note })
          .eq('batch_id', id)
          .eq('stage', newStage)
          .order('created_at', { ascending: false })
          .limit(1)
      }

      // Log stage change to the change log
      if (currentBatch && previousStage) {
        await supabase
          .from('batch_change_log')
          .insert({
            change_type: 'stage_change',
            batch_id: id,
            batch_number: currentBatch.batchNumber,
            sku: currentBatch.sku,
            product_name: currentBatch.productName,
            quantity_before: currentBatch.quantity,
            quantity_after: currentBatch.quantity,
            quantity_change: 0,
            unit_cost: currentBatch.unitCost,
            total_value_before: currentBatch.totalCost,
            total_value_after: currentBatch.totalCost,
            stage_from: previousStage,
            stage_to: newStage,
            note: note || `Moved from ${previousStage} to ${newStage}`,
          })
      }

      // Refetch to get updated stage history (background refresh)
      const freshBatch = await fetchBatch(id)
      if (freshBatch) {
        setBatches(prev => prev.map(b => b.id === id ? freshBatch : b))
      }

      return true
    } catch (err) {
      // Rollback optimistic update on error
      setBatches(previousBatches)
      setError(err instanceof Error ? err : new Error('Failed to update stage'))
      return false
    }
  }, [supabase, fetchBatch, batches])

  // Delete batch
  const deleteBatch = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', id)

      if (error) throw error

      setBatches(prev => prev.filter(b => b.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete batch'))
      return false
    }
  }, [supabase])

  // Split batch using database function
  const splitBatch = useCallback(async (id: string, splitQuantity: number, note?: string): Promise<string | null> => {
    try {
      const { data, error: rpcError } = await supabase
        .rpc('split_batch', {
          p_batch_id: id,
          p_split_quantity: splitQuantity,
          p_note: note || null,
        })

      if (rpcError) throw rpcError

      // Refetch all batches to get both original and new batch
      await fetchBatches()

      return data as string
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to split batch'))
      return null
    }
  }, [supabase, fetchBatches])

  // Merge batches using database function
  const mergeBatches = useCallback(async (batchIds: string[], note?: string): Promise<string | null> => {
    try {
      const { data, error: rpcError } = await supabase
        .rpc('merge_batches', {
          p_batch_ids: batchIds,
          p_note: note || null,
        })

      if (rpcError) throw rpcError

      // Refetch all batches to get the merged batch
      await fetchBatches()

      return data as string
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to merge batches'))
      return null
    }
  }, [supabase, fetchBatches])

  // Upload attachment
  const addAttachment = useCallback(async (batchId: string, file: File): Promise<boolean> => {
    try {
      // Upload to storage
      const fileName = `${batchId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('batch-attachments')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('batch-attachments')
        .getPublicUrl(fileName)

      // Create attachment record
      const { error: insertError } = await supabase
        .from('batch_attachments')
        .insert({
          batch_id: batchId,
          name: file.name,
          type: file.type,
          url: publicUrl,
          storage_path: fileName,
          size: file.size,
        })

      if (insertError) throw insertError

      // Refetch batch to get updated attachments
      const freshBatch = await fetchBatch(batchId)
      if (freshBatch) {
        setBatches(prev => prev.map(b => b.id === batchId ? freshBatch : b))
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add attachment'))
      return false
    }
  }, [supabase, fetchBatch])

  // Remove attachment
  const removeAttachment = useCallback(async (batchId: string, attachmentId: string): Promise<boolean> => {
    try {
      // Get attachment to find storage path
      const { data: attachment, error: fetchError } = await supabase
        .from('batch_attachments')
        .select('storage_path')
        .eq('id', attachmentId)
        .single()

      if (fetchError) throw fetchError

      // Delete from storage if path exists
      if (attachment?.storage_path) {
        await supabase.storage
          .from('batch-attachments')
          .remove([attachment.storage_path])
      }

      // Delete attachment record
      const { error: deleteError } = await supabase
        .from('batch_attachments')
        .delete()
        .eq('id', attachmentId)

      if (deleteError) throw deleteError

      // Refetch batch to get updated attachments
      const freshBatch = await fetchBatch(batchId)
      if (freshBatch) {
        setBatches(prev => prev.map(b => b.id === batchId ? freshBatch : b))
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to remove attachment'))
      return false
    }
  }, [supabase, fetchBatch])

  // Group batches by stage for Kanban view
  const batchesByStage: BatchesByStage = useMemo(() => {
    const grouped: BatchesByStage = {
      ordered: [],
      factory: [],
      inspected: [],
      'ready_to_ship': [],
      'in-transit': [],
      warehouse: [],
      amazon: [],
    }

    batches.forEach(batch => {
      grouped[batch.stage].push(batch)
    })

    return grouped
  }, [batches])

  // Compute summary statistics
  const summary = useMemo(() => {
    const totalBatches = batches.length
    const totalUnits = batches.reduce((sum: number, b) => sum + b.quantity, 0)
    const totalValue = batches.reduce((sum: number, b) => sum + b.totalCost, 0)
    const byStage = Object.entries(batchesByStage).map(([stage, stageBatches]) => ({
      stage: stage as BatchStage,
      count: stageBatches.length,
      units: (stageBatches as Batch[]).reduce((sum: number, b: Batch) => sum + b.quantity, 0),
      value: (stageBatches as Batch[]).reduce((sum: number, b: Batch) => sum + b.totalCost, 0),
    }))

    return {
      totalBatches,
      totalUnits,
      totalValue,
      byStage,
    }
  }, [batches, batchesByStage])

  // Fetch batches for a specific PO
  const fetchBatchesByPO = useCallback(async (poId: string): Promise<Batch[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('batches')
        .select(`
          *,
          supplier:suppliers(name),
          purchase_order:purchase_orders(po_number),
          batch_stage_history(*),
          batch_attachments(*)
        `)
        .eq('po_id', poId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      return (data || []).map(transformBatch)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch batches for PO'))
      return []
    }
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  return {
    batches,
    batchesByStage,
    summary,
    loading,
    error,
    refetch: fetchBatches,
    fetchBatch,
    fetchBatchesByPO,
    createBatch,
    updateBatch,
    updateStage,
    deleteBatch,
    splitBatch,
    mergeBatches,
    addAttachment,
    removeAttachment,
  }
}
