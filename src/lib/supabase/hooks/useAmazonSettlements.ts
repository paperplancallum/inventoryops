'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '../client'

// =============================================================================
// TYPES
// =============================================================================

export type AmazonSettlementStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'reconciled'
export type AmazonTransactionType =
  | 'Order'
  | 'Refund'
  | 'ServiceFee'
  | 'Adjustment'
  | 'Transfer'
  | 'FBAInventoryFee'
  | 'FBACustomerReturn'
  | 'Chargeback'
  | 'ChargebackRefund'
  | 'GuaranteeClaim'
  | 'SAFE-TReimbursement'
  | 'Other'

export interface AmazonSettlement {
  id: string
  settlementId: string
  reportId: string | null
  settlementStartDate: string
  settlementEndDate: string
  depositDate: string | null
  totalAmount: number
  currency: string
  marketplace: string
  totalSales: number
  totalRefunds: number
  totalFees: number
  totalOther: number
  orderCount: number
  refundCount: number
  status: AmazonSettlementStatus
  errorMessage: string | null
  createdAt: string
  updatedAt: string
  processedAt: string | null
}

export interface AmazonSettlementTransaction {
  id: string
  settlementId: string
  orderId: string | null
  merchantOrderId: string | null
  adjustmentId: string | null
  shipmentId: string | null
  sku: string | null
  productName: string | null
  quantity: number | null
  transactionType: AmazonTransactionType
  amountType: string
  amountDescription: string | null
  amount: number
  currency: string
  postedDate: string | null
  postedDateTime: string | null
  createdAt: string
}

export interface SettlementFeeBreakdown {
  type: string
  amount: number
}

export interface SettlementSkuBreakdown {
  sku: string
  sales: number
  fees: number
  refunds: number
  net: number
}

export interface SettlementSummary {
  totalSettlements: number
  totalDeposits: number
  totalSales: number
  totalFees: number
  totalRefunds: number
  avgFeePct: number
}

export interface ReportStatus {
  reportId: string
  status: string
  reportDocumentId: string | null
  dataStartTime: string
  dataEndTime: string
}

export interface SyncStatus {
  lastSyncedAt: string | null
  latestSettlementDate: string | null
  totalSettlements: number
}

export interface SyncResult {
  message: string
  synced: number
  skipped: number
  total?: number
  errors?: string[]
}

// =============================================================================
// TRANSFORM FUNCTIONS
// =============================================================================

function transformSettlement(db: any): AmazonSettlement {
  return {
    id: db.id,
    settlementId: db.settlement_id,
    reportId: db.report_id,
    settlementStartDate: db.settlement_start_date,
    settlementEndDate: db.settlement_end_date,
    depositDate: db.deposit_date,
    totalAmount: db.total_amount || 0,
    currency: db.currency || 'USD',
    marketplace: db.marketplace || 'US',
    totalSales: db.total_sales || 0,
    totalRefunds: db.total_refunds || 0,
    totalFees: db.total_fees || 0,
    totalOther: db.total_other || 0,
    orderCount: db.order_count || 0,
    refundCount: db.refund_count || 0,
    status: db.status,
    errorMessage: db.error_message,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    processedAt: db.processed_at,
  }
}

function transformTransaction(db: any): AmazonSettlementTransaction {
  return {
    id: db.id,
    settlementId: db.settlement_id,
    orderId: db.order_id,
    merchantOrderId: db.merchant_order_id,
    adjustmentId: db.adjustment_id,
    shipmentId: db.shipment_id,
    sku: db.sku,
    productName: db.product_name,
    quantity: db.quantity,
    transactionType: db.transaction_type,
    amountType: db.amount_type,
    amountDescription: db.amount_description,
    amount: db.amount || 0,
    currency: db.currency || 'USD',
    postedDate: db.posted_date,
    postedDateTime: db.posted_date_time,
    createdAt: db.created_at,
  }
}

// =============================================================================
// HOOK
// =============================================================================

export function useAmazonSettlements() {
  const [settlements, setSettlements] = useState<AmazonSettlement[]>([])
  const [selectedSettlement, setSelectedSettlement] = useState<AmazonSettlement | null>(null)
  const [transactions, setTransactions] = useState<AmazonSettlementTransaction[]>([])
  const [feeBreakdown, setFeeBreakdown] = useState<SettlementFeeBreakdown[]>([])
  const [skuBreakdown, setSkuBreakdown] = useState<SettlementSkuBreakdown[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [total, setTotal] = useState(0)

  const supabase = createClient()

  // Fetch all settlements
  const fetchSettlements = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('amazon_settlements')
        .select('*')
        .order('settlement_end_date', { ascending: false })

      if (fetchError) throw fetchError

      setSettlements((data || []).map(transformSettlement))
      setTotal(data?.length || 0)
    } catch (err) {
      console.error('Error fetching settlements:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch settlements'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch settlement detail with transactions
  const fetchSettlementDetail = useCallback(async (id: string) => {
    setLoadingDetail(true)
    setError(null)

    try {
      const response = await fetch(`/api/amazon/settlements/${id}`)

      if (!response.ok) {
        throw new Error('Failed to fetch settlement detail')
      }

      const data = await response.json()

      setSelectedSettlement(transformSettlement(data.settlement))
      setTransactions((data.transactions || []).map(transformTransaction))
      setFeeBreakdown(data.feeBreakdown || [])
      setSkuBreakdown(data.skuBreakdown || [])
    } catch (err) {
      console.error('Error fetching settlement detail:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch settlement detail'))
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  // Request new settlement report from Amazon
  const requestSettlementReport = useCallback(async (
    startDate?: string,
    endDate?: string
  ): Promise<{ success: boolean; reportId?: string; error?: string }> => {
    setRequesting(true)
    setError(null)

    try {
      const response = await fetch('/api/amazon/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || 'Request failed' }
      }

      return { success: true, reportId: data.reportId }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed'
      setError(new Error(message))
      return { success: false, error: message }
    } finally {
      setRequesting(false)
    }
  }, [])

  // Check report status
  const checkReportStatus = useCallback(async (reportId: string): Promise<ReportStatus | null> => {
    try {
      const response = await fetch(`/api/amazon/settlements/status/${reportId}`)

      if (!response.ok) {
        throw new Error('Failed to check report status')
      }

      return await response.json()
    } catch (err) {
      console.error('Error checking report status:', err)
      return null
    }
  }, [])

  // Download and process report
  const downloadReport = useCallback(async (reportDocumentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/amazon/settlements/download/${reportDocumentId}`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Download failed')
      }

      // Refresh settlements list
      await fetchSettlements()
      return true
    } catch (err) {
      console.error('Error downloading report:', err)
      setError(err instanceof Error ? err : new Error('Download failed'))
      return false
    }
  }, [fetchSettlements])

  // Poll for report completion and auto-download
  const pollAndDownload = useCallback(async (reportId: string): Promise<boolean> => {
    const maxAttempts = 30 // 5 minutes with 10s intervals
    let attempts = 0

    while (attempts < maxAttempts) {
      const status = await checkReportStatus(reportId)

      if (!status) {
        return false
      }

      if (status.status === 'DONE' && status.reportDocumentId) {
        return await downloadReport(status.reportDocumentId)
      }

      if (status.status === 'CANCELLED' || status.status === 'FATAL') {
        setError(new Error(`Report ${status.status.toLowerCase()}`))
        return false
      }

      // Wait 10 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 10000))
      attempts++
    }

    setError(new Error('Report processing timeout'))
    return false
  }, [checkReportStatus, downloadReport])

  // Delete settlement
  const deleteSettlement = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/amazon/settlements/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      setSettlements(prev => prev.filter(s => s.id !== id))
      if (selectedSettlement?.id === id) {
        setSelectedSettlement(null)
        setTransactions([])
      }

      return true
    } catch (err) {
      console.error('Error deleting settlement:', err)
      setError(err instanceof Error ? err : new Error('Delete failed'))
      return false
    }
  }, [selectedSettlement])

  // Clear selected settlement
  const clearSelection = useCallback(() => {
    setSelectedSettlement(null)
    setTransactions([])
    setFeeBreakdown([])
    setSkuBreakdown([])
  }, [])

  // Get sync status
  const getSyncStatus = useCallback(async (): Promise<SyncStatus | null> => {
    try {
      const response = await fetch('/api/amazon/settlements/sync')
      if (!response.ok) return null
      const data = await response.json()
      setSyncStatus(data)
      return data
    } catch {
      return null
    }
  }, [])

  // Sync settlements from Amazon (auto-fetch all available reports)
  const syncSettlements = useCallback(async (): Promise<SyncResult> => {
    setSyncing(true)
    setError(null)

    try {
      const response = await fetch('/api/amazon/settlements/sync', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed')
      }

      // Refresh the settlements list
      await fetchSettlements()
      await getSyncStatus()

      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed'
      setError(new Error(message))
      return { message, synced: 0, skipped: 0 }
    } finally {
      setSyncing(false)
    }
  }, [fetchSettlements, getSyncStatus])

  // Initial fetch + sync status
  useEffect(() => {
    fetchSettlements()
    getSyncStatus()
  }, [fetchSettlements, getSyncStatus])

  // Compute summary
  const summary = useMemo((): SettlementSummary => {
    const completed = settlements.filter(s => s.status === 'completed')

    const totalDeposits = completed.reduce((sum, s) => sum + s.totalAmount, 0)
    const totalSales = completed.reduce((sum, s) => sum + s.totalSales, 0)
    const totalFees = completed.reduce((sum, s) => sum + Math.abs(s.totalFees), 0)
    const totalRefunds = completed.reduce((sum, s) => sum + Math.abs(s.totalRefunds), 0)

    const avgFeePct = totalSales > 0 ? (totalFees / totalSales) * 100 : 0

    return {
      totalSettlements: completed.length,
      totalDeposits,
      totalSales,
      totalFees,
      totalRefunds,
      avgFeePct,
    }
  }, [settlements])

  return {
    settlements,
    selectedSettlement,
    transactions,
    feeBreakdown,
    skuBreakdown,
    summary,
    total,
    loading,
    loadingDetail,
    requesting,
    syncing,
    syncStatus,
    error,
    refetch: fetchSettlements,
    fetchSettlementDetail,
    requestSettlementReport,
    checkReportStatus,
    downloadReport,
    pollAndDownload,
    deleteSettlement,
    clearSelection,
    syncSettlements,
    getSyncStatus,
  }
}
