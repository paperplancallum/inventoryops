import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const AMAZON_SP_API_BASE = 'https://sellingpartnerapi-na.amazon.com'

interface AmazonInventoryItem {
  asin: string
  fnSku: string
  sellerSku: string
  condition: string
  productName: string
  totalQuantity: number
  inventoryDetails?: {
    fulfillableQuantity?: number
    reservedQuantity?: {
      totalReservedQuantity?: number
    }
    inboundWorkingQuantity?: number
    inboundShippedQuantity?: number
    inboundReceivingQuantity?: number
    unfulfillableQuantity?: {
      totalUnfulfillableQuantity?: number
    }
  }
}

// POST - Sync inventory from Amazon SP-API
export async function POST() {
  try {
    const supabase = await createClient()

    // TODO: Re-enable auth check in production
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!user) {
    //   return NextResponse.json(
    //     { error: 'Not authenticated' },
    //     { status: 401 }
    //   )
    // }

    // Get Amazon connection
    const { data: connection, error: fetchError } = await supabase
      .from('amazon_connections')
      .select('*')
      .limit(1)
      .single()

    if (fetchError || !connection) {
      return NextResponse.json(
        { error: 'No Amazon connection found' },
        { status: 404 }
      )
    }

    if (connection.status !== 'active') {
      return NextResponse.json(
        { error: 'Amazon connection is not active' },
        { status: 400 }
      )
    }

    // Check if token needs refresh
    const tokenExpiresAt = new Date(connection.access_token_expires_at)
    if (tokenExpiresAt <= new Date()) {
      // Token expired, attempt to refresh
      const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/amazon/token/refresh`, {
        method: 'POST',
      })

      if (!refreshResponse.ok) {
        return NextResponse.json(
          { error: 'Token expired and refresh failed' },
          { status: 401 }
        )
      }

      // Refetch connection with new token
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

    // Fetch inventory from Amazon SP-API
    // Using FBA Inventory API
    const marketplaceIds = connection.marketplaces || ['ATVPDKIKX0DER'] // US marketplace
    const granularityType = 'Marketplace'

    const inventoryUrl = new URL(`${AMAZON_SP_API_BASE}/fba/inventory/v1/summaries`)
    inventoryUrl.searchParams.set('granularityType', granularityType)
    inventoryUrl.searchParams.set('granularityId', marketplaceIds[0])
    inventoryUrl.searchParams.set('marketplaceIds', marketplaceIds.join(','))
    inventoryUrl.searchParams.set('details', 'true')

    const inventoryResponse = await fetch(inventoryUrl.toString(), {
      headers: {
        'x-amz-access-token': connection.access_token,
        'Content-Type': 'application/json',
      },
    })

    if (!inventoryResponse.ok) {
      const errorData = await inventoryResponse.json()
      console.error('Amazon inventory API error:', errorData)

      // Handle specific errors
      if (inventoryResponse.status === 401 || inventoryResponse.status === 403) {
        // Mark connection as needing reauth
        await supabase
          .from('amazon_connections')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id)
      }

      return NextResponse.json(
        { error: 'Failed to fetch inventory from Amazon' },
        { status: inventoryResponse.status }
      )
    }

    const inventoryData = await inventoryResponse.json()
    const inventorySummaries: AmazonInventoryItem[] = inventoryData.payload?.inventorySummaries || []

    const syncedAt = new Date().toISOString()
    let syncedCount = 0

    // Upsert inventory items to database
    for (const item of inventorySummaries) {
      const details = item.inventoryDetails || {}

      const inventoryRecord = {
        asin: item.asin,
        fnsku: item.fnSku || null,
        seller_sku: item.sellerSku,
        product_name: item.productName,
        condition: item.condition || 'New',
        marketplace: 'US' as const,
        fba_fulfillable: details.fulfillableQuantity || 0,
        fba_reserved: details.reservedQuantity?.totalReservedQuantity || 0,
        fba_inbound_working: details.inboundWorkingQuantity || 0,
        fba_inbound_shipped: details.inboundShippedQuantity || 0,
        fba_inbound_receiving: details.inboundReceivingQuantity || 0,
        fba_unfulfillable: details.unfulfillableQuantity?.totalUnfulfillableQuantity || 0,
        awd_quantity: 0, // AWD data from separate endpoint if needed
        awd_inbound_quantity: 0,
        last_synced_at: syncedAt,
      }

      // Upsert based on seller_sku and marketplace
      const { error: upsertError } = await supabase
        .from('amazon_inventory')
        .upsert(inventoryRecord, {
          onConflict: 'seller_sku,marketplace',
        })

      if (upsertError) {
        console.error('Error upserting inventory item:', upsertError)
      } else {
        syncedCount++
      }
    }

    // Update connection last_sync_at
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
      lastSyncAt: syncedAt,
    })
  } catch (error) {
    console.error('Error syncing Amazon inventory:', error)
    return NextResponse.json(
      { error: 'Failed to sync inventory' },
      { status: 500 }
    )
  }
}
