'use client'

import { useState, useCallback } from 'react'
import { createClient } from '../client'
import type { Database } from '../database.types'

// =============================================================================
// Types
// =============================================================================

export interface BatchCOGS {
  batchId: string
  batchNumber: string
  sku: string
  productName: string
  productId: string | null
  originalQuantity: number
  productUnitCost: number
  productTotalCost: number
  orderedDate: string | null
  stage: string
  transferCosts: number
  assemblyCosts: number
  amazonFeesDirect: number
  amazonFeesAllocated: number
  inventoryLosses: number
  unitsSold: number
  unitsLost: number
  unitsRemaining: number
  supplierId: string | null
  supplierName: string | null
  poId: string | null
  createdAt: string
}

export interface MonthlyProductCOGS {
  month: string
  sku: string
  productId: string | null
  productName: string | null
  marketplace: string
  unitsSold: number
  revenueUsd: number
  productCost: number
  avgUnitCost: number
}

export interface BatchFIFOReport {
  batchId: string
  batchNumber: string
  sku: string
  productName: string
  productId: string | null
  originalQuantity: number
  unitCost: number
  orderedDate: string | null
  receivedDate: string | null
  stage: string
  quantitySold: number
  quantityLost: number
  quantityRemaining: number
  cogsRecognized: number
  firstSaleDate: string | null
  lastSaleDate: string | null
  daysToDeplete: number | null
  supplierId: string | null
  supplierName: string | null
}

export interface ProductCOGSCalculation {
  productId: string
  sku: string
  productName: string
  periodStart: string
  periodEnd: string
  unitsSold: number
  productCost: number
  transferCost: number
  inboundFees: number
  fbaFees: number
  storageFees: number
  awdFees: number
  inventoryLosses: number
  totalCogs: number
  avgCogsPerUnit: number
}

export interface COGSMonthlySummary {
  month: string
  marketplace: string
  orderCount: number
  unitsSold: number
  totalRevenue: number
  productCost: number
  grossProfit: number
  grossMarginPct: number
  avgUnitCost: number
}

// =============================================================================
// Hook
// =============================================================================

export function useCOGS() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Get batch COGS breakdown
  const getBatchCOGS = useCallback(async (batchId?: string): Promise<BatchCOGS[]> => {
    setIsLoading(true)
    setError(null)

    let query = supabase
      .from('batch_cogs')
      .select('*')
      .order('ordered_date', { ascending: false })

    if (batchId) {
      query = query.eq('batch_id', batchId)
    }

    const { data, error: fetchError } = await query

    setIsLoading(false)

    if (fetchError) {
      setError(fetchError.message)
      return []
    }

    return (data || []).map(row => ({
      batchId: row.batch_id,
      batchNumber: row.batch_number,
      sku: row.sku,
      productName: row.product_name,
      productId: row.product_id,
      originalQuantity: row.original_quantity,
      productUnitCost: row.product_unit_cost,
      productTotalCost: row.product_total_cost,
      orderedDate: row.ordered_date,
      stage: row.stage,
      transferCosts: row.transfer_costs || 0,
      assemblyCosts: row.assembly_costs || 0,
      amazonFeesDirect: row.amazon_fees_direct || 0,
      amazonFeesAllocated: row.amazon_fees_allocated || 0,
      inventoryLosses: row.inventory_losses || 0,
      unitsSold: row.units_sold || 0,
      unitsLost: row.units_lost || 0,
      unitsRemaining: row.units_remaining || 0,
      supplierId: row.supplier_id,
      supplierName: row.supplier_name,
      poId: row.po_id,
      createdAt: row.created_at,
    }))
  }, [supabase])

  // Get monthly product COGS
  const getMonthlyProductCOGS = useCallback(async (month?: string): Promise<MonthlyProductCOGS[]> => {
    setIsLoading(true)
    setError(null)

    let query = supabase
      .from('monthly_product_cogs')
      .select('*')
      .order('month', { ascending: false })

    if (month) {
      query = query.eq('month', month)
    }

    const { data, error: fetchError } = await query

    setIsLoading(false)

    if (fetchError) {
      setError(fetchError.message)
      return []
    }

    return (data || []).map(row => ({
      month: row.month,
      sku: row.sku,
      productId: row.product_id,
      productName: row.product_name,
      marketplace: row.marketplace,
      unitsSold: row.units_sold || 0,
      revenueUsd: row.revenue_usd || 0,
      productCost: row.product_cost || 0,
      avgUnitCost: row.avg_unit_cost || 0,
    }))
  }, [supabase])

  // Get batch FIFO report
  const getBatchFIFOReport = useCallback(async (sku?: string): Promise<BatchFIFOReport[]> => {
    setIsLoading(true)
    setError(null)

    let query = supabase
      .from('batch_fifo_report')
      .select('*')
      .order('ordered_date', { ascending: true })

    if (sku) {
      query = query.eq('sku', sku)
    }

    const { data, error: fetchError } = await query

    setIsLoading(false)

    if (fetchError) {
      setError(fetchError.message)
      return []
    }

    return (data || []).map(row => ({
      batchId: row.batch_id,
      batchNumber: row.batch_number,
      sku: row.sku,
      productName: row.product_name,
      productId: row.product_id,
      originalQuantity: row.original_quantity,
      unitCost: row.unit_cost,
      orderedDate: row.ordered_date,
      receivedDate: row.received_date,
      stage: row.stage,
      quantitySold: row.quantity_sold || 0,
      quantityLost: row.quantity_lost || 0,
      quantityRemaining: row.quantity_remaining || 0,
      cogsRecognized: row.cogs_recognized || 0,
      firstSaleDate: row.first_sale_date,
      lastSaleDate: row.last_sale_date,
      daysToDeplete: row.days_to_deplete,
      supplierId: row.supplier_id,
      supplierName: row.supplier_name,
    }))
  }, [supabase])

  // Calculate COGS for a product and period
  const calculateProductCOGS = useCallback(async (
    productId: string | null,
    startDate: string,
    endDate: string,
    settingsName: string = 'default'
  ): Promise<ProductCOGSCalculation[]> => {
    setIsLoading(true)
    setError(null)

    const { data, error: rpcError } = await supabase
      .rpc('calculate_product_cogs', {
        p_product_id: productId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_settings_name: settingsName,
      })

    setIsLoading(false)

    if (rpcError) {
      setError(rpcError.message)
      return []
    }

    return (data || []).map((row: Database['public']['Functions']['calculate_product_cogs']['Returns'][0]) => ({
      productId: row.product_id,
      sku: row.sku,
      productName: row.product_name,
      periodStart: row.period_start,
      periodEnd: row.period_end,
      unitsSold: Number(row.units_sold) || 0,
      productCost: Number(row.product_cost) || 0,
      transferCost: Number(row.transfer_cost) || 0,
      inboundFees: Number(row.inbound_fees) || 0,
      fbaFees: Number(row.fba_fees) || 0,
      storageFees: Number(row.storage_fees) || 0,
      awdFees: Number(row.awd_fees) || 0,
      inventoryLosses: Number(row.inventory_losses) || 0,
      totalCogs: Number(row.total_cogs) || 0,
      avgCogsPerUnit: Number(row.avg_cogs_per_unit) || 0,
    }))
  }, [supabase])

  // Get monthly summary
  const getMonthlySummary = useCallback(async (): Promise<COGSMonthlySummary[]> => {
    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('cogs_monthly_summary')
      .select('*')
      .order('month', { ascending: false })

    setIsLoading(false)

    if (fetchError) {
      setError(fetchError.message)
      return []
    }

    return (data || []).map(row => ({
      month: row.month,
      marketplace: row.marketplace,
      orderCount: row.order_count || 0,
      unitsSold: row.units_sold || 0,
      totalRevenue: row.total_revenue || 0,
      productCost: row.product_cost || 0,
      grossProfit: row.gross_profit || 0,
      grossMarginPct: row.gross_margin_pct || 0,
      avgUnitCost: row.avg_unit_cost || 0,
    }))
  }, [supabase])

  // Get unattributed sales
  const getUnattributedSales = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from('unattributed_sales')
      .select('*')
      .order('ship_date', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      return []
    }

    return data || []
  }, [supabase])

  // Export monthly report as CSV
  const exportMonthlyReport = useCallback(async (month: string, settingsName: string = 'default'): Promise<string> => {
    // Get the first and last day of the month
    const [year, monthNum] = month.split('-').map(Number)
    const startDate = `${month}-01`
    const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0]

    const data = await calculateProductCOGS(null, startDate, endDate, settingsName)

    // Generate CSV
    const headers = ['SKU', 'Product Name', 'Units Sold', 'Product Cost', 'Transfer Cost', 'Inbound Fees', 'FBA Fees', 'Storage Fees', 'Losses', 'Total COGS', 'Avg COGS/Unit']
    const rows = data.map(row => [
      row.sku,
      row.productName,
      row.unitsSold.toString(),
      row.productCost.toFixed(2),
      row.transferCost.toFixed(2),
      row.inboundFees.toFixed(2),
      row.fbaFees.toFixed(2),
      row.storageFees.toFixed(2),
      row.inventoryLosses.toFixed(2),
      row.totalCogs.toFixed(2),
      row.avgCogsPerUnit.toFixed(2),
    ])

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    return csv
  }, [calculateProductCOGS])

  // Download CSV
  const downloadCSV = useCallback((csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  // Export in SellerBoard format
  const exportSellerBoardFormat = useCallback(async (month: string, settingsName: string = 'default'): Promise<string> => {
    // Get COGS data
    const [year, monthNum] = month.split('-').map(Number)
    const startDate = `${month}-01`
    const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0]

    const cogsData = await calculateProductCOGS(null, startDate, endDate, settingsName)

    // Get SKU to ASIN mapping from product_skus
    const { data: skuData } = await supabase
      .from('product_skus')
      .select('sku, asin, product_id, products(name)')

    // Create SKU lookup map
    const skuMap = new Map<string, { asin: string | null; productName: string | null }>()
    ;(skuData || []).forEach((row) => {
      const product = Array.isArray(row.products) ? row.products[0] : row.products
      skuMap.set(row.sku, {
        asin: row.asin,
        productName: product?.name || null,
      })
    })

    // Format date as MM/DD/YYYY for SellerBoard
    const costPeriodStartDate = `${String(monthNum).padStart(2, '0')}/01/${year}`

    // SellerBoard CSV headers
    const headers = [
      'ASIN',
      'SKU',
      'Title',
      'Labels',
      'CostPeriodStartDate',
      'Cost',
      'DomesticShippingCost',
      'RestofworldShippingCost',
      'ShippingProfile',
      'Value_of_unsellable_returns',
      'VAT',
      'VAT_CATEGORY',
      'Hide',
      'Marketplace',
      'BatchQuantity',
    ]

    // Build rows
    const rows = cogsData.map(row => {
      const skuInfo = skuMap.get(row.sku)
      const asin = skuInfo?.asin || ''
      const title = row.productName || skuInfo?.productName || ''

      // Escape CSV fields that might contain commas or quotes
      const escapeCSV = (val: string) => {
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return val
      }

      return [
        asin,
        row.sku,
        escapeCSV(title),
        '#FBA', // Default label
        costPeriodStartDate,
        row.avgCogsPerUnit.toFixed(2),
        '', // DomesticShippingCost
        '', // RestofworldShippingCost
        '', // ShippingProfile
        '', // Value_of_unsellable_returns
        '', // VAT
        'A_GEN_STANDARD', // VAT_CATEGORY
        'NO', // Hide
        'Amazon.com', // Default marketplace
        '', // BatchQuantity
      ]
    })

    // Generate CSV with BOM for Excel compatibility
    const bom = '\ufeff'
    const csv = bom + [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    return csv
  }, [supabase, calculateProductCOGS])

  return {
    isLoading,
    error,
    getBatchCOGS,
    getMonthlyProductCOGS,
    getBatchFIFOReport,
    calculateProductCOGS,
    getMonthlySummary,
    getUnattributedSales,
    exportMonthlyReport,
    exportSellerBoardFormat,
    downloadCSV,
  }
}
