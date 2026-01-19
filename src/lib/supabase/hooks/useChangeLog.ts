'use client'

import { useState, useEffect, useCallback } from 'react'

export type BatchChangeType = 'split' | 'merge' | 'quantity_adjustment' | 'cost_adjustment' | 'stage_change'

export interface BatchChangeLogEntry {
  id: string
  changeType: BatchChangeType
  batchId: string | null
  batchNumber: string
  relatedBatchIds: string[]
  relatedBatchNumbers: string[]
  quantityBefore: number | null
  quantityAfter: number | null
  quantityChange: number | null
  unitCost: number | null
  totalValueBefore: number | null
  totalValueAfter: number | null
  sku: string
  productName: string
  note: string | null
  stageFrom: string | null
  stageTo: string | null
  createdAt: string
  createdByName: string | null
}

interface DbChangeLogRow {
  id: string
  change_type: BatchChangeType
  batch_id: string | null
  batch_number: string
  related_batch_ids: string[] | null
  related_batch_numbers: string[] | null
  quantity_before: number | null
  quantity_after: number | null
  quantity_change: number | null
  unit_cost: number | null
  total_value_before: number | null
  total_value_after: number | null
  sku: string
  product_name: string
  note: string | null
  stage_from: string | null
  stage_to: string | null
  created_at: string
  created_by_name: string | null
}

function transformChangeLog(row: DbChangeLogRow): BatchChangeLogEntry {
  return {
    id: row.id,
    changeType: row.change_type,
    batchId: row.batch_id,
    batchNumber: row.batch_number,
    relatedBatchIds: row.related_batch_ids || [],
    relatedBatchNumbers: row.related_batch_numbers || [],
    quantityBefore: row.quantity_before,
    quantityAfter: row.quantity_after,
    quantityChange: row.quantity_change,
    unitCost: row.unit_cost,
    totalValueBefore: row.total_value_before,
    totalValueAfter: row.total_value_after,
    sku: row.sku,
    productName: row.product_name,
    note: row.note,
    stageFrom: row.stage_from,
    stageTo: row.stage_to,
    createdAt: row.created_at,
    createdByName: row.created_by_name,
  }
}

/**
 * @deprecated batch_change_log table was removed - use useActivityLog instead
 * This hook returns empty data for backwards compatibility
 */
export function useChangeLog() {
  const [entries, setEntries] = useState<BatchChangeLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error] = useState<Error | null>(null)

  // Note: batch_change_log table was removed and replaced by activity_log
  // This hook is deprecated - use useActivityLog instead for audit trail
  const fetchChangeLog = useCallback(async () => {
    setEntries([])
  }, [])

  // Fetch entries for a specific batch - returns empty for backwards compatibility
  const fetchEntriesForBatch = useCallback(async (_batchId: string): Promise<BatchChangeLogEntry[]> => {
    return []
  }, [])

  useEffect(() => {
    fetchChangeLog()
  }, [fetchChangeLog])

  return {
    entries,
    loading,
    error,
    refetch: fetchChangeLog,
    fetchEntriesForBatch,
  }
}
