import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const AMAZON_SP_API_BASE = 'https://sellingpartnerapi-na.amazon.com'

// SP-API Inbound types
interface SpApiShipmentItem {
  SellerSKU: string
  FulfillmentNetworkSKU: string
  ASIN?: string
  QuantityShipped: number
  QuantityReceived: number
  QuantityInCase?: number
  PrepDetailsList?: { PrepInstruction: string }[]
}

interface SpApiShipment {
  ShipmentId: string
  ShipmentName: string
  ShipmentStatus: string
  DestinationFulfillmentCenterId: string
  LabelPrepType?: string
  AreCasesRequired?: boolean
  ShipmentConfirmationId?: string
  BoxContentsSource?: string
  EstimatedBoxContentsFee?: { Value: number; CurrencyCode: string }
}

interface SpApiInboundShipmentInfo {
  ShipmentId: string
  ShipmentName: string
  ShipFromAddress: {
    Name?: string
    AddressLine1?: string
    City?: string
    StateOrProvinceCode?: string
    PostalCode?: string
    CountryCode?: string
  }
  DestinationFulfillmentCenterId: string
  ShipmentStatus: string
  LabelPrepType?: string
  AreCasesRequired?: boolean
}

// Map SP-API status to our status enum
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

// POST - Sync shipments from Amazon SP-API
export async function POST() {
  try {
    const supabase = createServiceClient()

    // Get Amazon connection
    const { data: connection, error: fetchError } = await supabase
      .from('amazon_connections')
      .select('*')
      .limit(1)
      .single()

    if (fetchError || !connection) {
      return NextResponse.json(
        { error: 'No Amazon connection found. Please connect your Amazon Seller account first.' },
        { status: 404 }
      )
    }

    if (connection.status !== 'active') {
      return NextResponse.json(
        { error: 'Amazon connection is not active. Please reconnect your account.' },
        { status: 400 }
      )
    }

    // Check if token needs refresh
    const tokenExpiresAt = new Date(connection.access_token_expires_at)
    let accessToken = connection.access_token

    if (tokenExpiresAt <= new Date()) {
      // Token expired, attempt to refresh
      const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/amazon/token/refresh`, {
        method: 'POST',
      })

      if (!refreshResponse.ok) {
        return NextResponse.json(
          { error: 'Token expired and refresh failed. Please reconnect your Amazon account.' },
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

      accessToken = refreshedConnection.access_token
    }

    const marketplaceIds = connection.marketplaces || ['ATVPDKIKX0DER'] // US marketplace

    // Fetch inbound shipments from Amazon SP-API (Fulfillment Inbound API)
    // Using v0 API for broader compatibility
    const shipmentsUrl = new URL(`${AMAZON_SP_API_BASE}/fba/inbound/v0/shipments`)
    shipmentsUrl.searchParams.set('MarketplaceId', marketplaceIds[0])
    shipmentsUrl.searchParams.set('QueryType', 'SHIPMENT')
    // Get shipments from last 90 days by default
    shipmentsUrl.searchParams.set('ShipmentStatusList', 'WORKING,READY_TO_SHIP,SHIPPED,IN_TRANSIT,DELIVERED,CHECKED_IN,RECEIVING,CLOSED')

    const shipmentsResponse = await fetch(shipmentsUrl.toString(), {
      headers: {
        'x-amz-access-token': accessToken,
        'Content-Type': 'application/json',
      },
    })

    if (!shipmentsResponse.ok) {
      const errorData = await shipmentsResponse.json().catch(() => ({}))
      console.error('Amazon shipments API error:', errorData)

      // Handle auth errors
      if (shipmentsResponse.status === 401 || shipmentsResponse.status === 403) {
        await supabase
          .from('amazon_connections')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id)

        return NextResponse.json(
          { error: 'Amazon authentication expired. Please reconnect your account.' },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to fetch shipments from Amazon', details: errorData },
        { status: shipmentsResponse.status }
      )
    }

    const shipmentsData = await shipmentsResponse.json()
    const shipmentInfoList: SpApiInboundShipmentInfo[] = shipmentsData.payload?.ShipmentData || []

    const syncedAt = new Date().toISOString()
    let syncedCount = 0
    const errors: string[] = []

    // Process each shipment
    for (const shipment of shipmentInfoList) {
      try {
        // Fetch shipment items
        const itemsUrl = new URL(`${AMAZON_SP_API_BASE}/fba/inbound/v0/shipments/${shipment.ShipmentId}/items`)
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

        // Calculate totals
        const totalUnits = items.reduce((sum, item) => sum + (item.QuantityShipped || 0), 0)
        const totalSkus = items.length

        // Upsert shipment
        const shipmentRecord = {
          shipment_id: shipment.ShipmentId,
          shipment_name: shipment.ShipmentName || `Shipment ${shipment.ShipmentId}`,
          inbound_type: 'FBA' as const,
          status: mapShipmentStatus(shipment.ShipmentStatus),
          created_date: new Date().toISOString().split('T')[0],
          last_updated_date: new Date().toISOString().split('T')[0],
          destination_fc_id: shipment.DestinationFulfillmentCenterId,
          destination_address_name: shipment.ShipFromAddress?.Name || null,
          destination_address_line1: shipment.ShipFromAddress?.AddressLine1 || null,
          destination_address_city: shipment.ShipFromAddress?.City || null,
          destination_address_state: shipment.ShipFromAddress?.StateOrProvinceCode || null,
          destination_address_postal_code: shipment.ShipFromAddress?.PostalCode || null,
          destination_address_country: shipment.ShipFromAddress?.CountryCode || null,
          labels_prep_type: shipment.LabelPrepType || null,
          are_cases_required: shipment.AreCasesRequired || false,
          total_units: totalUnits,
          total_skus: totalSkus,
          last_synced_at: syncedAt,
        }

        // Check if shipment exists
        const { data: existingShipment } = await supabase
          .from('amazon_shipments')
          .select('id')
          .eq('shipment_id', shipment.ShipmentId)
          .single()

        let shipmentDbId: string

        if (existingShipment) {
          // Update existing
          const { data: updated, error: updateError } = await supabase
            .from('amazon_shipments')
            .update({
              ...shipmentRecord,
              updated_at: syncedAt,
            })
            .eq('id', existingShipment.id)
            .select('id')
            .single()

          if (updateError) {
            console.error('Error updating shipment:', updateError)
            errors.push(`Failed to update shipment ${shipment.ShipmentId}`)
            continue
          }
          shipmentDbId = updated.id
        } else {
          // Insert new
          const { data: inserted, error: insertError } = await supabase
            .from('amazon_shipments')
            .insert(shipmentRecord)
            .select('id')
            .single()

          if (insertError) {
            console.error('Error inserting shipment:', insertError)
            errors.push(`Failed to insert shipment ${shipment.ShipmentId}`)
            continue
          }
          shipmentDbId = inserted.id
        }

        // Sync shipment items
        // First, delete existing items for this shipment
        await supabase
          .from('amazon_shipment_items')
          .delete()
          .eq('amazon_shipment_id', shipmentDbId)

        // Insert items
        if (items.length > 0) {
          const itemRecords = items.map(item => ({
            amazon_shipment_id: shipmentDbId,
            seller_sku: item.SellerSKU,
            fn_sku: item.FulfillmentNetworkSKU || item.SellerSKU,
            asin: item.ASIN || null,
            product_name: item.SellerSKU, // SP-API doesn't return product name, would need catalog lookup
            quantity_shipped: item.QuantityShipped || 0,
            quantity_received: item.QuantityReceived || 0,
            quantity_in_case: item.QuantityInCase || null,
            prep_details: item.PrepDetailsList?.map(p => p.PrepInstruction) || [],
          }))

          const { error: itemsError } = await supabase
            .from('amazon_shipment_items')
            .insert(itemRecords)

          if (itemsError) {
            console.error('Error inserting shipment items:', itemsError)
            errors.push(`Failed to insert items for shipment ${shipment.ShipmentId}`)
          }
        }

        syncedCount++
      } catch (err) {
        console.error(`Error processing shipment ${shipment.ShipmentId}:`, err)
        errors.push(`Error processing shipment ${shipment.ShipmentId}`)
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
      totalFound: shipmentInfoList.length,
      lastSyncAt: syncedAt,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error syncing Amazon shipments:', error)
    return NextResponse.json(
      { error: 'Failed to sync shipments' },
      { status: 500 }
    )
  }
}
