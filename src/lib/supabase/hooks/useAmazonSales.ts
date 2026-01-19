'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '../client'
import type { Database } from '../database.types'

// =============================================================================
// Types
// =============================================================================

type DbAmazonOrder = Database['public']['Tables']['amazon_orders']['Row']
type DbAmazonOrderItem = Database['public']['Tables']['amazon_order_items']['Row']
type DbAmazonOrderInsert = Database['public']['Tables']['amazon_orders']['Insert']
type DbAmazonOrderItemInsert = Database['public']['Tables']['amazon_order_items']['Insert']

export type AmazonSalesChannel = 'FBA' | 'FBM' | 'AWD_TRANSFER'
export type AmazonOrderStatus = 'pending' | 'unshipped' | 'partially_shipped' | 'shipped' | 'delivered' | 'cancelled' | 'unfulfillable'

export interface AmazonOrder {
  id: string
  amazonOrderId: string
  marketplace: string
  salesChannel: AmazonSalesChannel
  purchaseDate: string
  shipDate: string | null
  deliveryDate: string | null
  status: AmazonOrderStatus
  currency: string
  exchangeRateToUsd: number
  orderTotal: number
  orderTotalUsd: number
  lastSyncedAt: string
  syncSource: string
  createdAt: string
  updatedAt: string
  items?: AmazonOrderItem[]
}

export interface AmazonOrderItem {
  id: string
  orderId: string
  orderItemId: string
  sellerSku: string
  asin: string
  quantityOrdered: number
  quantityShipped: number
  itemPrice: number
  itemTax: number
  shippingPrice: number
  shippingTax: number
  itemPriceUsd: number
  totalRevenueUsd: number
  internalSkuId: string | null
  internalProductId: string | null
  cogsCalculated: boolean
  cogsAttributedAt: string | null
  createdAt: string
}

export interface SalesBatchAttribution {
  id: string
  orderItemId: string
  batchId: string
  quantity: number
  unitCost: number
  totalCost: number
  attributedDate: string
  createdAt: string
}

export interface AmazonSalesSummary {
  totalOrders: number
  totalUnitsShipped: number
  totalRevenue: number
  pendingCogsCount: number
}

export interface AmazonSalesFilters {
  marketplace?: string
  status?: AmazonOrderStatus[]
  dateFrom?: string
  dateTo?: string
  cogsCalculated?: boolean
}

// =============================================================================
// Transform Functions
// =============================================================================

function transformOrder(db: DbAmazonOrder, items?: DbAmazonOrderItem[]): AmazonOrder {
  return {
    id: db.id,
    amazonOrderId: db.amazon_order_id,
    marketplace: db.marketplace,
    salesChannel: db.sales_channel as AmazonSalesChannel,
    purchaseDate: db.purchase_date,
    shipDate: db.ship_date,
    deliveryDate: db.delivery_date,
    status: db.status as AmazonOrderStatus,
    currency: db.currency,
    exchangeRateToUsd: db.exchange_rate_to_usd,
    orderTotal: db.order_total || 0,
    orderTotalUsd: db.order_total_usd || 0,
    lastSyncedAt: db.last_synced_at,
    syncSource: db.sync_source,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    items: items?.map(transformOrderItem),
  }
}

function transformOrderItem(db: DbAmazonOrderItem): AmazonOrderItem {
  return {
    id: db.id,
    orderId: db.order_id,
    orderItemId: db.order_item_id,
    sellerSku: db.seller_sku,
    asin: db.asin,
    quantityOrdered: db.quantity_ordered,
    quantityShipped: db.quantity_shipped,
    itemPrice: db.item_price,
    itemTax: db.item_tax,
    shippingPrice: db.shipping_price,
    shippingTax: db.shipping_tax,
    itemPriceUsd: db.item_price_usd || 0,
    totalRevenueUsd: db.total_revenue_usd || 0,
    internalSkuId: db.internal_sku_id,
    internalProductId: db.internal_product_id,
    cogsCalculated: db.cogs_calculated,
    cogsAttributedAt: db.cogs_attributed_at,
    createdAt: db.created_at,
  }
}

// =============================================================================
// Hook
// =============================================================================

export function useAmazonSales(filters?: AmazonSalesFilters) {
  const [orders, setOrders] = useState<AmazonOrder[]>([])
  const [summary, setSummary] = useState<AmazonSalesSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Fetch orders with items
  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    let query = supabase
      .from('amazon_orders')
      .select(`
        *,
        amazon_order_items (*)
      `)
      .order('purchase_date', { ascending: false })

    // Apply filters
    if (filters?.marketplace) {
      query = query.eq('marketplace', filters.marketplace)
    }
    if (filters?.status?.length) {
      query = query.in('status', filters.status)
    }
    if (filters?.dateFrom) {
      query = query.gte('ship_date', filters.dateFrom)
    }
    if (filters?.dateTo) {
      query = query.lte('ship_date', filters.dateTo)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
      setIsLoading(false)
      return
    }

    const transformed = (data || []).map(order =>
      transformOrder(order, order.amazon_order_items)
    )
    setOrders(transformed)

    // Calculate summary
    const allItems = transformed.flatMap(o => o.items || [])
    const summaryData: AmazonSalesSummary = {
      totalOrders: transformed.length,
      totalUnitsShipped: allItems.reduce((sum, i) => sum + i.quantityShipped, 0),
      totalRevenue: allItems.reduce((sum, i) => sum + i.totalRevenueUsd, 0),
      pendingCogsCount: allItems.filter(i => !i.cogsCalculated).length,
    }
    setSummary(summaryData)

    setIsLoading(false)
  }, [supabase, filters])

  // Create order (for manual entry)
  const createOrder = useCallback(async (
    orderData: Omit<DbAmazonOrderInsert, 'id'>,
    items: Omit<DbAmazonOrderItemInsert, 'id' | 'order_id'>[]
  ): Promise<AmazonOrder | null> => {
    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('amazon_orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      setError(orderError.message)
      return null
    }

    // Insert items
    if (items.length > 0) {
      const itemsWithOrderId = items.map(item => ({
        ...item,
        order_id: order.id,
      }))

      const { error: itemsError } = await supabase
        .from('amazon_order_items')
        .insert(itemsWithOrderId)

      if (itemsError) {
        setError(itemsError.message)
        // Still return the order even if items failed
      }
    }

    // Fetch complete order with items
    const { data: completeOrder } = await supabase
      .from('amazon_orders')
      .select(`
        *,
        amazon_order_items (*)
      `)
      .eq('id', order.id)
      .single()

    if (completeOrder) {
      const transformed = transformOrder(completeOrder, completeOrder.amazon_order_items)
      setOrders(prev => [transformed, ...prev])
      return transformed
    }

    return transformOrder(order)
  }, [supabase])

  // Process pending COGS attribution
  const processPendingCogs = useCallback(async (): Promise<{ processed: number; unattributed: number }> => {
    const { data, error: rpcError } = await supabase
      .rpc('process_pending_sales_attribution')

    if (rpcError) {
      setError(rpcError.message)
      return { processed: 0, unattributed: 0 }
    }

    const results = data || []
    const processed = results.length
    const unattributed = results.reduce((sum: number, r: { unattributed_quantity: number }) => sum + (r.unattributed_quantity || 0), 0)

    // Refresh orders to show updated COGS status
    await fetchOrders()

    return { processed, unattributed }
  }, [supabase, fetchOrders])

  // Get batch attributions for an order item
  const getAttributions = useCallback(async (orderItemId: string): Promise<SalesBatchAttribution[]> => {
    const { data, error: fetchError } = await supabase
      .from('sales_batch_attributions')
      .select('*')
      .eq('order_item_id', orderItemId)
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      return []
    }

    return (data || []).map(attr => ({
      id: attr.id,
      orderItemId: attr.order_item_id,
      batchId: attr.batch_id,
      quantity: attr.quantity,
      unitCost: attr.unit_cost,
      totalCost: attr.total_cost,
      attributedDate: attr.attributed_date,
      createdAt: attr.created_at,
    }))
  }, [supabase])

  // Get monthly sales summary from view
  const getMonthlySummary = useCallback(async (month: string): Promise<Database['public']['Views']['monthly_product_cogs']['Row'][]> => {
    const { data, error: fetchError } = await supabase
      .from('monthly_product_cogs')
      .select('*')
      .eq('month', month)

    if (fetchError) {
      setError(fetchError.message)
      return []
    }

    return data || []
  }, [supabase])

  // Orders pending COGS calculation
  const pendingOrders = useMemo(() => {
    return orders.filter(o => o.items?.some(i => !i.cogsCalculated))
  }, [orders])

  // Orders by month
  const ordersByMonth = useMemo(() => {
    return orders.reduce((acc, order) => {
      if (order.shipDate) {
        const month = order.shipDate.substring(0, 7)
        if (!acc[month]) {
          acc[month] = []
        }
        acc[month].push(order)
      }
      return acc
    }, {} as Record<string, AmazonOrder[]>)
  }, [orders])

  // Initial fetch
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return {
    orders,
    summary,
    pendingOrders,
    ordersByMonth,
    isLoading,
    error,
    fetchOrders,
    createOrder,
    processPendingCogs,
    getAttributions,
    getMonthlySummary,
  }
}
