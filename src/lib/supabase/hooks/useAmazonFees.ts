'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '../client'
import type { Database } from '../database.types'

// =============================================================================
// Types
// =============================================================================

type DbAmazonFee = Database['public']['Tables']['amazon_fees']['Row']
type DbAmazonFeeInsert = Database['public']['Tables']['amazon_fees']['Insert']

export type AmazonFeeType =
  | 'fba_fulfillment'
  | 'fba_storage_monthly'
  | 'fba_storage_long_term'
  | 'fba_removal'
  | 'fba_disposal'
  | 'fba_prep'
  | 'fba_labeling'
  | 'inbound_placement'
  | 'inbound_defect'
  | 'inbound_transportation'
  | 'awd_storage'
  | 'awd_processing'
  | 'awd_transportation'
  | 'referral_fee'
  | 'sponsored_products'
  | 'sponsored_brands'
  | 'sponsored_display'
  | 'reimbursement'
  | 'refund_admin'
  | 'other'

export type FeeAttributionLevel = 'order_item' | 'shipment' | 'product' | 'account'

export interface AmazonFee {
  id: string
  feeType: AmazonFeeType
  description: string | null
  amount: number
  originalCurrency: string
  originalAmount: number | null
  exchangeRateToUsd: number
  attributionLevel: FeeAttributionLevel
  orderId: string | null
  orderItemId: string | null
  amazonShipmentId: string | null
  internalProductId: string | null
  batchId: string | null
  feeDate: string
  periodStart: string | null
  periodEnd: string | null
  marketplace: string | null
  source: string
  sourceReference: string | null
  includeInCogs: boolean
  createdAt: string
  updatedAt: string
}

export interface AmazonFeeFormData {
  feeType: AmazonFeeType
  description?: string
  amount: number
  originalCurrency?: string
  originalAmount?: number
  exchangeRateToUsd?: number
  attributionLevel: FeeAttributionLevel
  orderId?: string
  orderItemId?: string
  amazonShipmentId?: string
  internalProductId?: string
  batchId?: string
  feeDate: string
  periodStart?: string
  periodEnd?: string
  marketplace?: string
  source?: string
  sourceReference?: string
  includeInCogs?: boolean
}

export interface AmazonFeeSummary {
  totalFees: number
  totalCharges: number
  totalReimbursements: number
  cogsAmount: number
  feeCount: number
}

export interface AmazonFeeFilters {
  feeTypes?: AmazonFeeType[]
  attributionLevel?: FeeAttributionLevel
  marketplace?: string
  dateFrom?: string
  dateTo?: string
  includeInCogs?: boolean
  source?: string
}

// =============================================================================
// Transform Functions
// =============================================================================

function transformFee(db: DbAmazonFee): AmazonFee {
  return {
    id: db.id,
    feeType: db.fee_type as AmazonFeeType,
    description: db.description,
    amount: db.amount,
    originalCurrency: db.original_currency,
    originalAmount: db.original_amount,
    exchangeRateToUsd: db.exchange_rate_to_usd,
    attributionLevel: db.attribution_level as FeeAttributionLevel,
    orderId: db.order_id,
    orderItemId: db.order_item_id,
    amazonShipmentId: db.amazon_shipment_id,
    internalProductId: db.internal_product_id,
    batchId: db.batch_id,
    feeDate: db.fee_date,
    periodStart: db.period_start,
    periodEnd: db.period_end,
    marketplace: db.marketplace,
    source: db.source,
    sourceReference: db.source_reference,
    includeInCogs: db.include_in_cogs,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  }
}

function toDbInsert(data: AmazonFeeFormData): DbAmazonFeeInsert {
  return {
    fee_type: data.feeType,
    description: data.description,
    amount: data.amount,
    original_currency: data.originalCurrency || 'USD',
    original_amount: data.originalAmount,
    exchange_rate_to_usd: data.exchangeRateToUsd || 1.0,
    attribution_level: data.attributionLevel,
    order_id: data.orderId,
    order_item_id: data.orderItemId,
    amazon_shipment_id: data.amazonShipmentId,
    internal_product_id: data.internalProductId,
    batch_id: data.batchId,
    fee_date: data.feeDate,
    period_start: data.periodStart,
    period_end: data.periodEnd,
    marketplace: data.marketplace as Database['public']['Enums']['amazon_marketplace'] | undefined,
    source: data.source || 'manual',
    source_reference: data.sourceReference,
    include_in_cogs: data.includeInCogs ?? true,
  }
}

// =============================================================================
// Hook
// =============================================================================

export function useAmazonFees(filters?: AmazonFeeFilters) {
  const [fees, setFees] = useState<AmazonFee[]>([])
  const [summary, setSummary] = useState<AmazonFeeSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch fees with filters
  const fetchFees = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    let query = supabase
      .from('amazon_fees')
      .select('*')
      .order('fee_date', { ascending: false })

    // Apply filters
    if (filters?.feeTypes?.length) {
      query = query.in('fee_type', filters.feeTypes)
    }
    if (filters?.attributionLevel) {
      query = query.eq('attribution_level', filters.attributionLevel)
    }
    if (filters?.marketplace) {
      query = query.eq('marketplace', filters.marketplace)
    }
    if (filters?.dateFrom) {
      query = query.gte('fee_date', filters.dateFrom)
    }
    if (filters?.dateTo) {
      query = query.lte('fee_date', filters.dateTo)
    }
    if (filters?.includeInCogs !== undefined) {
      query = query.eq('include_in_cogs', filters.includeInCogs)
    }
    if (filters?.source) {
      query = query.eq('source', filters.source)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
      setIsLoading(false)
      return
    }

    const transformed = (data || []).map(transformFee)
    setFees(transformed)

    // Calculate summary
    const summaryData: AmazonFeeSummary = {
      totalFees: transformed.reduce((sum, f) => sum + f.amount, 0),
      totalCharges: transformed.filter(f => f.amount > 0).reduce((sum, f) => sum + f.amount, 0),
      totalReimbursements: transformed.filter(f => f.amount < 0).reduce((sum, f) => sum + Math.abs(f.amount), 0),
      cogsAmount: transformed.filter(f => f.includeInCogs).reduce((sum, f) => sum + f.amount, 0),
      feeCount: transformed.length,
    }
    setSummary(summaryData)

    setIsLoading(false)
  }, [supabase, filters])

  // Create fee
  const createFee = useCallback(async (data: AmazonFeeFormData): Promise<AmazonFee | null> => {
    const { data: created, error: createError } = await supabase
      .from('amazon_fees')
      .insert(toDbInsert(data))
      .select()
      .single()

    if (createError) {
      setError(createError.message)
      return null
    }

    const transformed = transformFee(created)
    setFees(prev => [transformed, ...prev])
    return transformed
  }, [supabase])

  // Create multiple fees (for import)
  const createFeesBatch = useCallback(async (dataList: AmazonFeeFormData[]): Promise<AmazonFee[]> => {
    const { data: created, error: createError } = await supabase
      .from('amazon_fees')
      .insert(dataList.map(toDbInsert))
      .select()

    if (createError) {
      setError(createError.message)
      return []
    }

    const transformed = (created || []).map(transformFee)
    setFees(prev => [...transformed, ...prev])
    return transformed
  }, [supabase])

  // Update fee
  const updateFee = useCallback(async (id: string, data: Partial<AmazonFeeFormData>): Promise<AmazonFee | null> => {
    const update: Partial<DbAmazonFee> = {}
    if (data.feeType !== undefined) update.fee_type = data.feeType
    if (data.description !== undefined) update.description = data.description
    if (data.amount !== undefined) update.amount = data.amount
    if (data.feeDate !== undefined) update.fee_date = data.feeDate
    if (data.includeInCogs !== undefined) update.include_in_cogs = data.includeInCogs
    if (data.batchId !== undefined) update.batch_id = data.batchId
    if (data.internalProductId !== undefined) update.internal_product_id = data.internalProductId

    const { data: updated, error: updateError } = await supabase
      .from('amazon_fees')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
      return null
    }

    const transformed = transformFee(updated)
    setFees(prev => prev.map(f => f.id === id ? transformed : f))
    return transformed
  }, [supabase])

  // Delete fee
  const deleteFee = useCallback(async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('amazon_fees')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    setFees(prev => prev.filter(f => f.id !== id))
    return true
  }, [supabase])

  // Allocate fee by inventory (for storage fees)
  const allocateFeeByInventory = useCallback(async (feeId: string, periodStart: string, periodEnd: string): Promise<number> => {
    const { data, error: rpcError } = await supabase
      .rpc('allocate_fee_by_inventory', {
        p_fee_id: feeId,
        p_period_start: periodStart,
        p_period_end: periodEnd,
      })

    if (rpcError) {
      setError(rpcError.message)
      return 0
    }

    return data || 0
  }, [supabase])

  // Allocate fee by sales (for fulfillment fees)
  const allocateFeeBySales = useCallback(async (feeId: string, startDate: string, endDate: string): Promise<number> => {
    const { data, error: rpcError } = await supabase
      .rpc('allocate_fee_by_sales', {
        p_fee_id: feeId,
        p_start_date: startDate,
        p_end_date: endDate,
      })

    if (rpcError) {
      setError(rpcError.message)
      return 0
    }

    return data || 0
  }, [supabase])

  // Grouped by type
  const feesByType = useMemo(() => {
    return fees.reduce((acc, fee) => {
      if (!acc[fee.feeType]) {
        acc[fee.feeType] = []
      }
      acc[fee.feeType].push(fee)
      return acc
    }, {} as Record<AmazonFeeType, AmazonFee[]>)
  }, [fees])

  // Grouped by month
  const feesByMonth = useMemo(() => {
    return fees.reduce((acc, fee) => {
      const month = fee.feeDate.substring(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = []
      }
      acc[month].push(fee)
      return acc
    }, {} as Record<string, AmazonFee[]>)
  }, [fees])

  // Initial fetch
  useEffect(() => {
    fetchFees()
  }, [fetchFees])

  return {
    fees,
    summary,
    feesByType,
    feesByMonth,
    isLoading,
    error,
    fetchFees,
    createFee,
    createFeesBatch,
    updateFee,
    deleteFee,
    allocateFeeByInventory,
    allocateFeeBySales,
  }
}
