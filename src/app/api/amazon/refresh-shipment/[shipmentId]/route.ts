import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const AMAZON_SP_API_BASE = 'https://sellingpartnerapi-na.amazon.com'

interface SpApiShipmentItem {
  SellerSKU: string
  FulfillmentNetworkSKU: string
  ASIN?: string
  QuantityShipped: number
  QuantityReceived: number
  QuantityInCase?: number
  PrepDetailsList?: { PrepInstruction: string }[]
}

function mapShipmentStatus(spApiStatus: string): string {
  const statusMap: Record<string, string> = {
    'WORKING': 'WORKING',
    'READY_TO_SHIP': 'READY_TO_SHIP',
    'SHIPPED': 'SHIPPED',
    'IN_TRANSIT': 'IN_TRANSIT',
    'DELIVERED': 'DELIVERED',
    'CHECKED_IN': 'CHECKED_IN',
    'RECEIVING': 'RECEIVING',
    'CLOSED': 'CLOSED',
    'CANCELLED': 'CANCELLED',
    'DELETED': 'DELETED',
    'ERROR': 'ERROR',
  }
  return statusMap[spApiStatus] || 'WORKING'
}

// POST - Refresh a single shipment from Amazon SP-API
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const { shipmentId } = await params
    const supabase = await createClient()

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
    let accessToken = connection.access_token
    const tokenExpiresAt = new Date(connection.access_token_expires_at)

    if (tokenExpiresAt <= new Date()) {
      const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/amazon/token/refresh`, {
        method: 'POST',
      })

      if (!refreshResponse.ok) {
        return NextResponse.json(
          { error: 'Token expired and refresh failed' },
          { status: 401 }
        )
      }

      const { data: refreshedConnection } = await supabase
        .from('amazon_connections')
        .select('*')
        .limit(1)
        .single()

      if (refreshedConnection) {
        accessToken = refreshedConnection.access_token
      }
    }

    const marketplaceIds = connection.marketplaces || ['ATVPDKIKX0DER']

    // Fetch specific shipment from Amazon
    const shipmentUrl = new URL(`${AMAZON_SP_API_BASE}/fba/inbound/v0/shipments`)
    shipmentUrl.searchParams.set('MarketplaceId', marketplaceIds[0])
    shipmentUrl.searchParams.set('QueryType', 'SHIPMENT')
    shipmentUrl.searchParams.set('ShipmentIdList', shipmentId)

    const shipmentResponse = await fetch(shipmentUrl.toString(), {
      headers: {
        'x-amz-access-token': accessToken,
        'Content-Type': 'application/json',
      },
    })

    if (!shipmentResponse.ok) {
      const errorData = await shipmentResponse.json().catch(() => ({}))
      console.error('Amazon shipment API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to fetch shipment from Amazon' },
        { status: shipmentResponse.status }
      )
    }

    const shipmentData = await shipmentResponse.json()
    const shipmentInfo = shipmentData.payload?.ShipmentData?.[0]

    if (!shipmentInfo) {
      return NextResponse.json(
        { error: 'Shipment not found in Amazon' },
        { status: 404 }
      )
    }

    // Fetch shipment items
    const itemsUrl = new URL(`${AMAZON_SP_API_BASE}/fba/inbound/v0/shipments/${shipmentId}/items`)
    itemsUrl.searchParams.set('MarketplaceId', marketplaceIds[0])

    const itemsResponse = await fetch(itemsUrl.toString(), {
      headers: {
        'x-amz-access-token': accessToken,
        'Content-Type': 'application/json',
      },
    })

    let items: SpApiShipmentItem[] = []
    if (itemsResponse.ok) {
      const itemsData = await itemsResponse.json()
      items = itemsData.payload?.ItemData || []
    }

    const syncedAt = new Date().toISOString()
    const totalUnits = items.reduce((sum, item) => sum + (item.QuantityShipped || 0), 0)
    const totalSkus = items.length

    // Update shipment in database
    const shipmentRecord = {
      shipment_name: shipmentInfo.ShipmentName || `Shipment ${shipmentId}`,
      status: mapShipmentStatus(shipmentInfo.ShipmentStatus),
      last_updated_date: new Date().toISOString().split('T')[0],
      destination_fc_id: shipmentInfo.DestinationFulfillmentCenterId,
      labels_prep_type: shipmentInfo.LabelPrepType || null,
      are_cases_required: shipmentInfo.AreCasesRequired || false,
      total_units: totalUnits,
      total_skus: totalSkus,
      last_synced_at: syncedAt,
      updated_at: syncedAt,
    }

    // Find existing shipment
    const { data: existingShipment } = await supabase
      .from('amazon_shipments')
      .select('id')
      .eq('shipment_id', shipmentId)
      .single()

    if (!existingShipment) {
      return NextResponse.json(
        { error: 'Shipment not found in database' },
        { status: 404 }
      )
    }

    // Update shipment
    const { error: updateError } = await supabase
      .from('amazon_shipments')
      .update(shipmentRecord)
      .eq('id', existingShipment.id)

    if (updateError) {
      console.error('Error updating shipment:', updateError)
      return NextResponse.json(
        { error: 'Failed to update shipment' },
        { status: 500 }
      )
    }

    // Update items - delete and re-insert
    await supabase
      .from('amazon_shipment_items')
      .delete()
      .eq('amazon_shipment_id', existingShipment.id)

    if (items.length > 0) {
      const itemRecords = items.map(item => ({
        amazon_shipment_id: existingShipment.id,
        seller_sku: item.SellerSKU,
        fn_sku: item.FulfillmentNetworkSKU || item.SellerSKU,
        asin: item.ASIN || null,
        product_name: item.SellerSKU,
        quantity_shipped: item.QuantityShipped || 0,
        quantity_received: item.QuantityReceived || 0,
        quantity_in_case: item.QuantityInCase || null,
        prep_details: item.PrepDetailsList?.map(p => p.PrepInstruction) || [],
      }))

      await supabase
        .from('amazon_shipment_items')
        .insert(itemRecords)
    }

    return NextResponse.json({
      success: true,
      shipmentId,
      lastSyncAt: syncedAt,
    })
  } catch (error) {
    console.error('Error refreshing shipment:', error)
    return NextResponse.json(
      { error: 'Failed to refresh shipment' },
      { status: 500 }
    )
  }
}
