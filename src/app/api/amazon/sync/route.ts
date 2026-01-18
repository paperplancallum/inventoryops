import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const AMAZON_SP_API_BASE = 'https://sellingpartnerapi-na.amazon.com'

// Map country codes to Amazon marketplace IDs
const MARKETPLACE_ID_MAP: Record<string, string> = {
  'US': 'ATVPDKIKX0DER',
  'CA': 'A2EUQ1WTGCTBG2',
  'MX': 'A1AM78C64UM0Y8',
  'BR': 'A2Q3Y263D00KWC',
  // EU
  'UK': 'A1F83G8C2ARO7P',
  'DE': 'A1PA6795UKMFR9',
  'FR': 'A13V1IB3VIYBER',
  'IT': 'APJ6JRA9NG5V4',
  'ES': 'A1RKKUPIHCS9HS',
  // Asia-Pacific
  'JP': 'A1VC38T7YXB528',
  'AU': 'A39IBJ37TRP1C6',
  'IN': 'A21TJRUUN4KGV',
}

// Map Amazon condition values to database enum values
const CONDITION_MAP: Record<string, string> = {
  'NewItem': 'New',
  'New': 'New',
  'Refurbished': 'Refurbished',
  'UsedLikeNew': 'UsedLikeNew',
  'UsedVeryGood': 'UsedVeryGood',
  'UsedGood': 'UsedGood',
  'UsedAcceptable': 'UsedAcceptable',
}

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

// AWD (Amazon Warehousing & Distribution) inventory item
interface AWDInventoryItem {
  sku: string
  totalOnhandQuantity?: number
  totalInboundQuantity?: number
  inventoryDetails?: {
    availableDistributableQuantity?: number
    reservedDistributableQuantity?: number
    replenishmentQuantity?: number
  }
}

interface AWDInventoryResponse {
  inventory?: AWDInventoryItem[]
  nextToken?: string
}

interface FBAInventoryResponse {
  payload?: {
    inventorySummaries?: AmazonInventoryItem[]
  }
  pagination?: {
    nextToken?: string
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
    // Using FBA Inventory API with pagination
    // Convert country codes to Amazon marketplace IDs
    const countryCodes = connection.marketplaces || ['US']
    const marketplaceIds = countryCodes.map(
      (code: string) => MARKETPLACE_ID_MAP[code] || MARKETPLACE_ID_MAP['US']
    )
    const granularityType = 'Marketplace'

    const inventorySummaries: AmazonInventoryItem[] = []
    let fbaNextToken: string | undefined

    do {
      const inventoryUrl = new URL(`${AMAZON_SP_API_BASE}/fba/inventory/v1/summaries`)
      inventoryUrl.searchParams.set('granularityType', granularityType)
      inventoryUrl.searchParams.set('granularityId', marketplaceIds[0])
      inventoryUrl.searchParams.set('marketplaceIds', marketplaceIds.join(','))
      inventoryUrl.searchParams.set('details', 'true')

      if (fbaNextToken) {
        inventoryUrl.searchParams.set('nextToken', fbaNextToken)
      }

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

      const inventoryData: FBAInventoryResponse = await inventoryResponse.json()
      const pageItems = inventoryData.payload?.inventorySummaries || []
      inventorySummaries.push(...pageItems)

      fbaNextToken = inventoryData.pagination?.nextToken
    } while (fbaNextToken)

    // Fetch AWD (Amazon Warehousing & Distribution) inventory
    // This is a separate service - gracefully handle if not enabled
    const awdInventoryMap = new Map<string, { onhand: number; inbound: number }>()
    let awdSynced = false

    try {
      const awdUrl = new URL(`${AMAZON_SP_API_BASE}/awd/2024-05-09/inventory`)
      awdUrl.searchParams.set('details', 'SHOW')

      let nextToken: string | undefined
      do {
        if (nextToken) {
          awdUrl.searchParams.set('nextToken', nextToken)
        }

        const awdResponse = await fetch(awdUrl.toString(), {
          headers: {
            'x-amz-access-token': connection.access_token,
            'Content-Type': 'application/json',
          },
        })

        if (!awdResponse.ok) {
          // AWD might not be enabled for this seller - that's OK
          if (awdResponse.status === 403 || awdResponse.status === 404) {
            console.log('AWD not available for this seller (status:', awdResponse.status, ')')
            break
          }
          console.error('AWD API error:', awdResponse.status, await awdResponse.text())
          break
        }

        const awdData: AWDInventoryResponse = await awdResponse.json()

        if (awdData.inventory) {
          for (const item of awdData.inventory) {
            awdInventoryMap.set(item.sku, {
              onhand: item.totalOnhandQuantity || 0,
              inbound: item.totalInboundQuantity || 0,
            })
          }
          awdSynced = true
        }

        nextToken = awdData.nextToken
      } while (nextToken)
    } catch (awdError) {
      // Don't fail the entire sync if AWD fails
      console.error('Error fetching AWD inventory (continuing with FBA only):', awdError)
    }

    const syncedAt = new Date().toISOString()
    let syncedCount = 0

    // Upsert inventory items to database
    for (const item of inventorySummaries) {
      const details = item.inventoryDetails || {}

      // Get AWD data for this SKU (if available)
      const awdData = awdInventoryMap.get(item.sellerSku) || { onhand: 0, inbound: 0 }

      const inventoryRecord = {
        asin: item.asin,
        fnsku: item.fnSku || null,
        seller_sku: item.sellerSku,
        product_name: item.productName,
        condition: CONDITION_MAP[item.condition] || 'New',
        marketplace: 'US' as const,
        fba_fulfillable: details.fulfillableQuantity || 0,
        fba_reserved: details.reservedQuantity?.totalReservedQuantity || 0,
        fba_inbound_working: details.inboundWorkingQuantity || 0,
        fba_inbound_shipped: details.inboundShippedQuantity || 0,
        fba_inbound_receiving: details.inboundReceivingQuantity || 0,
        fba_unfulfillable: details.unfulfillableQuantity?.totalUnfulfillableQuantity || 0,
        awd_quantity: awdData.onhand,
        awd_inbound_quantity: awdData.inbound,
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
      awdSynced,
      awdSkuCount: awdInventoryMap.size,
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
