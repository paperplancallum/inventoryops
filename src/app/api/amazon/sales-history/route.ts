import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const AMAZON_SP_API_BASE = 'https://sellingpartnerapi-na.amazon.com'

interface AmazonSalesMetric {
  interval: string
  unitCount: number
  orderItemCount: number
  orderCount: number
  totalSales: {
    amount: number
    currencyCode: string
  }
  averageUnitPrice?: {
    amount: number
    currencyCode: string
  }
  asin?: string
  sku?: string
}

// POST - Sync sales history from Amazon SP-API
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get request body for optional date range
    const body = await request.json().catch(() => ({}))
    const { startDate, endDate, locationId } = body

    // Get Amazon connection
    const { data: connection, error: fetchError } = await supabase
      .from('amazon_connections')
      .select('*')
      .limit(1)
      .single()

    if (fetchError || !connection) {
      return NextResponse.json(
        { error: 'No Amazon connection found', message: 'Connect your Amazon account first in Settings' },
        { status: 404 }
      )
    }

    if (connection.status !== 'active') {
      return NextResponse.json(
        { error: 'Amazon connection is not active', message: 'Please re-authenticate your Amazon account' },
        { status: 400 }
      )
    }

    // Check if token needs refresh
    const tokenExpiresAt = new Date(connection.access_token_expires_at)
    if (tokenExpiresAt <= new Date()) {
      const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/amazon/token/refresh`, {
        method: 'POST',
      })

      if (!refreshResponse.ok) {
        return NextResponse.json(
          { error: 'Token expired and refresh failed', message: 'Please re-authenticate your Amazon account' },
          { status: 401 }
        )
      }

      const { data: refreshedConnection } = await supabase
        .from('amazon_connections')
        .select('*')
        .limit(1)
        .single()

      if (!refreshedConnection) {
        return NextResponse.json(
          { error: 'Failed to get refreshed connection' },
          { status: 500 }
        )
      }

      connection.access_token = refreshedConnection.access_token
    }

    // Calculate date range (default to last 30 days)
    const endDateStr = endDate || new Date().toISOString().split('T')[0]
    const startDateObj = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const startDateStr = startDateObj.toISOString().split('T')[0]

    // Fetch sales metrics from Amazon SP-API
    // Using Sales API - GET /sales/v1/orderMetrics
    const marketplaceIds = connection.marketplaces || ['ATVPDKIKX0DER'] // US marketplace

    const salesUrl = new URL(`${AMAZON_SP_API_BASE}/sales/v1/orderMetrics`)
    salesUrl.searchParams.set('marketplaceIds', marketplaceIds.join(','))
    salesUrl.searchParams.set('interval', `${startDateStr}T00:00:00-00:00--${endDateStr}T23:59:59-00:00`)
    salesUrl.searchParams.set('granularity', 'Day')
    salesUrl.searchParams.set('granularityTimeZone', 'America/Los_Angeles')

    const salesResponse = await fetch(salesUrl.toString(), {
      headers: {
        'x-amz-access-token': connection.access_token,
        'Content-Type': 'application/json',
      },
    })

    if (!salesResponse.ok) {
      const errorData = await salesResponse.json().catch(() => ({}))
      console.error('Amazon Sales API error:', errorData)

      if (salesResponse.status === 401 || salesResponse.status === 403) {
        await supabase
          .from('amazon_connections')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id)
      }

      return NextResponse.json(
        { error: 'Failed to fetch sales data from Amazon', details: errorData },
        { status: salesResponse.status }
      )
    }

    const salesData = await salesResponse.json()
    const orderMetrics: AmazonSalesMetric[] = salesData.payload || []

    // Get the Amazon FBA location (or use provided locationId)
    let amazonLocationId = locationId
    if (!amazonLocationId) {
      const { data: amazonLocation } = await supabase
        .from('locations')
        .select('id')
        .eq('type', 'amazon_fba')
        .limit(1)
        .single()

      amazonLocationId = amazonLocation?.id
    }

    if (!amazonLocationId) {
      return NextResponse.json(
        { error: 'No Amazon FBA location found', message: 'Please create an Amazon FBA location first' },
        { status: 404 }
      )
    }

    // Get product mapping (seller_sku to product_id)
    const { data: products } = await supabase
      .from('products')
      .select('id, sku, amazon_sku')

    const productMap = new Map<string, string>()
    products?.forEach(p => {
      if (p.amazon_sku) productMap.set(p.amazon_sku, p.id)
      productMap.set(p.sku, p.id)
    })

    let syncedCount = 0
    const errors: string[] = []

    // Process each day's sales data
    for (const metric of orderMetrics) {
      // Parse date from interval (format: "2024-01-15T00:00:00-08:00--2024-01-15T23:59:59-08:00")
      const dateMatch = metric.interval.match(/^(\d{4}-\d{2}-\d{2})/)
      if (!dateMatch) continue

      const date = dateMatch[1]

      // For aggregate metrics without SKU breakdown, we need to use Reports API
      // For now, just store aggregate data per day
      // TODO: Use Reports API to get per-ASIN/SKU breakdown

      // If we have SKU-level data
      if (metric.sku) {
        const productId = productMap.get(metric.sku)
        if (!productId) {
          errors.push(`Product not found for SKU: ${metric.sku}`)
          continue
        }

        const salesRecord = {
          product_id: productId,
          location_id: amazonLocationId,
          date,
          units_sold: metric.unitCount,
          revenue: metric.totalSales.amount,
          currency: metric.totalSales.currencyCode,
          source: 'amazon-api' as const,
        }

        const { error: upsertError } = await supabase
          .from('sales_history')
          .upsert(salesRecord, {
            onConflict: 'product_id,location_id,date',
          })

        if (upsertError) {
          console.error('Error upserting sales history:', upsertError)
          errors.push(`Failed to save sales for ${date}: ${upsertError.message}`)
        } else {
          syncedCount++
        }
      }
    }

    // Update connection last_sync_at
    const syncedAt = new Date().toISOString()
    await supabase
      .from('amazon_connections')
      .update({
        last_sync_at: syncedAt,
        updated_at: syncedAt,
      })
      .eq('id', connection.id)

    return NextResponse.json({
      success: true,
      syncedCount,
      totalRecords: orderMetrics.length,
      dateRange: { startDate: startDateStr, endDate: endDateStr },
      lastSyncAt: syncedAt,
      errors: errors.length > 0 ? errors : undefined,
      note: 'Aggregate sales data synced. Per-SKU breakdown requires Amazon Reports API integration.',
    })
  } catch (error) {
    console.error('Error syncing Amazon sales history:', error)
    return NextResponse.json(
      { error: 'Failed to sync sales history', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET - Check sync status
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: connection } = await supabase
      .from('amazon_connections')
      .select('id, status, last_sync_at')
      .limit(1)
      .single()

    if (!connection) {
      return NextResponse.json({
        connected: false,
        message: 'No Amazon connection found',
      })
    }

    // Get latest sales history entry
    const { data: latestSale } = await supabase
      .from('sales_history')
      .select('date, created_at')
      .eq('source', 'amazon-api')
      .order('date', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      connected: connection.status === 'active',
      lastConnectionSync: connection.last_sync_at,
      latestSalesDate: latestSale?.date,
      latestSyncedAt: latestSale?.created_at,
    })
  } catch (error) {
    console.error('Error checking sync status:', error)
    return NextResponse.json(
      { error: 'Failed to check sync status' },
      { status: 500 }
    )
  }
}
