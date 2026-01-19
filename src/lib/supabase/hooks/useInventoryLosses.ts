'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '../client'
import type { Database } from '../database.types'

// =============================================================================
// Types
// =============================================================================

type DbInventoryLoss = Database['public']['Tables']['inventory_losses']['Row']
type DbInventoryLossInsert = Database['public']['Tables']['inventory_losses']['Insert']
type DbInventoryLossUpdate = Database['public']['Tables']['inventory_losses']['Update']

export type InventoryLossType =
  | 'damaged_inbound'
  | 'damaged_warehouse'
  | 'damaged_customer'
  | 'lost_inbound'
  | 'lost_warehouse'
  | 'disposed'
  | 'expired'
  | 'recalled'
  | 'write_off'

export type ReimbursementStatus = 'none' | 'pending' | 'partial' | 'complete' | 'denied'

export interface InventoryLoss {
  id: string
  lossType: InventoryLossType
  description: string | null
  batchId: string | null
  productId: string | null
  sellerSku: string
  fnsku: string | null
  marketplace: string | null
  quantity: number
  unitCost: number
  totalCost: number
  reimbursementStatus: ReimbursementStatus
  reimbursementAmount: number
  reimbursementDate: string | null
  reimbursementReference: string | null
  netLoss: number
  lossDate: string
  source: string
  sourceReference: string | null
  amazonCaseId: string | null
  includeInCogs: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface InventoryLossFormData {
  lossType: InventoryLossType
  description?: string
  batchId?: string
  productId?: string
  sellerSku: string
  fnsku?: string
  marketplace?: string
  quantity: number
  unitCost: number
  lossDate: string
  source?: string
  sourceReference?: string
  amazonCaseId?: string
  includeInCogs?: boolean
  notes?: string
}

export interface ReimbursementData {
  amount: number
  date: string
  reference?: string
}

export interface InventoryLossSummary {
  totalLosses: number
  totalUnits: number
  totalCost: number
  totalReimbursed: number
  totalNetLoss: number
  pendingReimbursements: number
}

export interface InventoryLossFilters {
  lossTypes?: InventoryLossType[]
  marketplace?: string
  dateFrom?: string
  dateTo?: string
  reimbursementStatus?: ReimbursementStatus[]
  includeInCogs?: boolean
}

// =============================================================================
// Transform Functions
// =============================================================================

function transformLoss(db: DbInventoryLoss): InventoryLoss {
  return {
    id: db.id,
    lossType: db.loss_type as InventoryLossType,
    description: db.description,
    batchId: db.batch_id,
    productId: db.product_id,
    sellerSku: db.seller_sku,
    fnsku: db.fnsku,
    marketplace: db.marketplace,
    quantity: db.quantity,
    unitCost: db.unit_cost,
    totalCost: db.total_cost ?? db.quantity * db.unit_cost,
    reimbursementStatus: db.reimbursement_status as ReimbursementStatus,
    reimbursementAmount: db.reimbursement_amount || 0,
    reimbursementDate: db.reimbursement_date,
    reimbursementReference: db.reimbursement_reference,
    netLoss: db.net_loss ?? (db.total_cost ?? db.quantity * db.unit_cost) - (db.reimbursement_amount || 0),
    lossDate: db.loss_date,
    source: db.source,
    sourceReference: db.source_reference,
    amazonCaseId: db.amazon_case_id,
    includeInCogs: db.include_in_cogs,
    notes: db.notes,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

function toDbInsert(data: InventoryLossFormData): DbInventoryLossInsert {
  return {
    loss_type: data.lossType,
    description: data.description,
    batch_id: data.batchId,
    product_id: data.productId,
    seller_sku: data.sellerSku,
    fnsku: data.fnsku,
    marketplace: data.marketplace as Database['public']['Enums']['amazon_marketplace'] | undefined,
    quantity: data.quantity,
    unit_cost: data.unitCost,
    loss_date: data.lossDate,
    source: data.source || 'manual',
    source_reference: data.sourceReference,
    amazon_case_id: data.amazonCaseId,
    include_in_cogs: data.includeInCogs ?? true,
    notes: data.notes,
  }
}

// =============================================================================
// Hook
// =============================================================================

export function useInventoryLosses(filters?: InventoryLossFilters) {
  const [losses, setLosses] = useState<InventoryLoss[]>([])
  const [summary, setSummary] = useState<InventoryLossSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch losses with filters
  const fetchLosses = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    let query = supabase
      .from('inventory_losses')
      .select('*')
      .order('loss_date', { ascending: false })

    // Apply filters
    if (filters?.lossTypes?.length) {
      query = query.in('loss_type', filters.lossTypes)
    }
    if (filters?.marketplace) {
      query = query.eq('marketplace', filters.marketplace)
    }
    if (filters?.dateFrom) {
      query = query.gte('loss_date', filters.dateFrom)
    }
    if (filters?.dateTo) {
      query = query.lte('loss_date', filters.dateTo)
    }
    if (filters?.reimbursementStatus?.length) {
      query = query.in('reimbursement_status', filters.reimbursementStatus)
    }
    if (filters?.includeInCogs !== undefined) {
      query = query.eq('include_in_cogs', filters.includeInCogs)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
      setIsLoading(false)
      return
    }

    const transformed = (data || []).map(transformLoss)
    setLosses(transformed)

    // Calculate summary
    const summaryData: InventoryLossSummary = {
      totalLosses: transformed.length,
      totalUnits: transformed.reduce((sum, l) => sum + l.quantity, 0),
      totalCost: transformed.reduce((sum, l) => sum + l.totalCost, 0),
      totalReimbursed: transformed.reduce((sum, l) => sum + l.reimbursementAmount, 0),
      totalNetLoss: transformed.reduce((sum, l) => sum + l.netLoss, 0),
      pendingReimbursements: transformed.filter(l => l.reimbursementStatus === 'pending').length,
    }
    setSummary(summaryData)

    setIsLoading(false)
  }, [supabase, filters])

  // Create loss
  const createLoss = useCallback(async (data: InventoryLossFormData): Promise<InventoryLoss | null> => {
    const { data: created, error: createError } = await supabase
      .from('inventory_losses')
      .insert(toDbInsert(data))
      .select()
      .single()

    if (createError) {
      setError(createError.message)
      return null
    }

    const transformed = transformLoss(created)
    setLosses(prev => [transformed, ...prev])
    return transformed
  }, [supabase])

  // Update loss
  const updateLoss = useCallback(async (id: string, data: Partial<InventoryLossFormData>): Promise<InventoryLoss | null> => {
    const update: DbInventoryLossUpdate = {}
    if (data.lossType !== undefined) update.loss_type = data.lossType
    if (data.description !== undefined) update.description = data.description
    if (data.quantity !== undefined) update.quantity = data.quantity
    if (data.unitCost !== undefined) update.unit_cost = data.unitCost
    if (data.lossDate !== undefined) update.loss_date = data.lossDate
    if (data.includeInCogs !== undefined) update.include_in_cogs = data.includeInCogs
    if (data.notes !== undefined) update.notes = data.notes
    if (data.amazonCaseId !== undefined) update.amazon_case_id = data.amazonCaseId

    const { data: updated, error: updateError } = await supabase
      .from('inventory_losses')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
      return null
    }

    const transformed = transformLoss(updated)
    setLosses(prev => prev.map(l => l.id === id ? transformed : l))
    return transformed
  }, [supabase])

  // Record reimbursement
  const recordReimbursement = useCallback(async (id: string, data: ReimbursementData): Promise<InventoryLoss | null> => {
    const { data: updated, error: updateError } = await supabase
      .from('inventory_losses')
      .update({
        reimbursement_amount: data.amount,
        reimbursement_date: data.date,
        reimbursement_reference: data.reference,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
      return null
    }

    const transformed = transformLoss(updated)
    setLosses(prev => prev.map(l => l.id === id ? transformed : l))
    return transformed
  }, [supabase])

  // Delete loss
  const deleteLoss = useCallback(async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('inventory_losses')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    setLosses(prev => prev.filter(l => l.id !== id))
    return true
  }, [supabase])

  // Grouped by type
  const lossesByType = useMemo(() => {
    return losses.reduce((acc, loss) => {
      if (!acc[loss.lossType]) {
        acc[loss.lossType] = []
      }
      acc[loss.lossType].push(loss)
      return acc
    }, {} as Record<InventoryLossType, InventoryLoss[]>)
  }, [losses])

  // Pending reimbursements
  const pendingReimbursements = useMemo(() => {
    return losses.filter(l => l.reimbursementStatus === 'pending' || l.reimbursementStatus === 'partial')
  }, [losses])

  // Initial fetch
  useEffect(() => {
    fetchLosses()
  }, [fetchLosses])

  return {
    losses,
    summary,
    lossesByType,
    pendingReimbursements,
    isLoading,
    error,
    fetchLosses,
    createLoss,
    updateLoss,
    recordReimbursement,
    deleteLoss,
  }
}
