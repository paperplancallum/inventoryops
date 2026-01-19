import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gunzipSync } from 'zlib'

const AMAZON_SP_API_BASE = 'https://sellingpartnerapi-na.amazon.com'

interface SettlementRow {
  settlementId: string
  settlementStartDate: string
  settlementEndDate: string
  depositDate: string
  totalAmount: string
  currency: string
  transactionType: string
  orderId: string
  merchantOrderId: string
  adjustmentId: string
  shipmentId: string
  marketplaceName: string
  amountType: string
  amountDescription: string
  amount: string
  postedDate: string
  postedDateTime: string
  orderItemCode: string
  merchantOrderItemId: string
  merchantAdjustmentItemId: string
  sku: string
  quantityPurchased: string
  promotionId: string
}

// Map transaction type strings to enum values
function mapTransactionType(type: string): string {
  const typeMap: Record<string, string> = {
    'Order': 'Order',
    'Refund': 'Refund',
    'Service Fee': 'ServiceFee',
    'ServiceFee': 'ServiceFee',
    'Adjustment': 'Adjustment',
    'Transfer': 'Transfer',
    'FBA Inventory Fee': 'FBAInventoryFee',
    'FBAInventoryFee': 'FBAInventoryFee',
    'FBA Customer Return Fee': 'FBACustomerReturn',
    'FBACustomerReturn': 'FBACustomerReturn',
    'Chargeback': 'Chargeback',
    'Chargeback Refund': 'ChargebackRefund',
    'A-to-z Guarantee Claim': 'GuaranteeClaim',
    'SAFE-T Reimbursement': 'SAFE-TReimbursement',
  }
  return typeMap[type] || 'Other'
}

// Parse the flat file settlement report
function parseSettlementReport(content: string): SettlementRow[] {
  const lines = content.split('\n')
  if (lines.length < 2) return []

  // First line is headers
  const headers = lines[0].split('\t').map(h => h.trim().replace(/"/g, ''))

  // Map header names to our expected format
  const headerMap: Record<string, keyof SettlementRow> = {
    'settlement-id': 'settlementId',
    'settlement-start-date': 'settlementStartDate',
    'settlement-end-date': 'settlementEndDate',
    'deposit-date': 'depositDate',
    'total-amount': 'totalAmount',
    'currency': 'currency',
    'transaction-type': 'transactionType',
    'order-id': 'orderId',
    'merchant-order-id': 'merchantOrderId',
    'adjustment-id': 'adjustmentId',
    'shipment-id': 'shipmentId',
    'marketplace-name': 'marketplaceName',
    'amount-type': 'amountType',
    'amount-description': 'amountDescription',
    'amount': 'amount',
    'posted-date': 'postedDate',
    'posted-date-time': 'postedDateTime',
    'order-item-code': 'orderItemCode',
    'merchant-order-item-id': 'merchantOrderItemId',
    'merchant-adjustment-item-id': 'merchantAdjustmentItemId',
    'sku': 'sku',
    'quantity-purchased': 'quantityPurchased',
    'promotion-id': 'promotionId',
  }

  const rows: SettlementRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = line.split('\t').map(v => v.trim().replace(/"/g, ''))
    const row: Partial<SettlementRow> = {}

    headers.forEach((header, index) => {
      const key = headerMap[header.toLowerCase()]
      if (key && values[index] !== undefined) {
        row[key] = values[index]
      }
    })

    if (row.settlementId) {
      rows.push(row as SettlementRow)
    }
  }

  return rows
}

// POST - Download and parse settlement report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportDocumentId: string }> }
) {
  try {
    const { reportDocumentId } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get Amazon connection
    const { data: connection, error: connError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('status', 'active')
      .limit(1)
      .single()

    if (connError || !connection) {
      return NextResponse.json(
        { error: 'No active Amazon connection found' },
        { status: 404 }
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
        connection.access_token = refreshedConnection.access_token
      }
    }

    // Get report document details (includes download URL)
    const documentUrl = `${AMAZON_SP_API_BASE}/reports/2021-06-30/documents/${reportDocumentId}`

    const documentResponse = await fetch(documentUrl, {
      headers: {
        'x-amz-access-token': connection.access_token,
        'Content-Type': 'application/json',
      },
    })

    if (!documentResponse.ok) {
      const errorData = await documentResponse.json().catch(() => ({}))
      console.error('Amazon document fetch error:', errorData)

      return NextResponse.json(
        { error: 'Failed to get report document', details: errorData },
        { status: documentResponse.status }
      )
    }

    const documentData = await documentResponse.json()
    const downloadUrl = documentData.url
    const compressionAlgorithm = documentData.compressionAlgorithm

    // Download the actual report content
    const contentResponse = await fetch(downloadUrl)

    if (!contentResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to download report content' },
        { status: 500 }
      )
    }

    let reportContent: string

    if (compressionAlgorithm === 'GZIP') {
      const buffer = await contentResponse.arrayBuffer()
      const decompressed = gunzipSync(Buffer.from(buffer))
      reportContent = decompressed.toString('utf-8')
    } else {
      reportContent = await contentResponse.text()
    }

    // Parse the report
    const rows = parseSettlementReport(reportContent)

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No data found in settlement report' },
        { status: 400 }
      )
    }

    // Group rows by settlement ID
    const settlementGroups = new Map<string, SettlementRow[]>()
    for (const row of rows) {
      const existing = settlementGroups.get(row.settlementId) || []
      existing.push(row)
      settlementGroups.set(row.settlementId, existing)
    }

    const processedSettlements: string[] = []

    // Process each settlement
    for (const [settlementId, settlementRows] of settlementGroups) {
      // Check if settlement already exists
      const { data: existing } = await supabase
        .from('amazon_settlements')
        .select('id')
        .eq('settlement_id', settlementId)
        .single()

      if (existing) {
        // Already processed, skip
        continue
      }

      // Get settlement metadata from first row
      const firstRow = settlementRows[0]

      // Calculate aggregates
      let totalSales = 0
      let totalRefunds = 0
      let totalFees = 0
      let totalOther = 0
      let orderCount = 0
      let refundCount = 0

      const orderIds = new Set<string>()
      const refundIds = new Set<string>()

      for (const row of settlementRows) {
        const amount = parseFloat(row.amount) || 0

        if (row.transactionType === 'Order') {
          if (row.amountType === 'ItemPrice' || row.amountType === 'ItemWithheldTax') {
            totalSales += amount
          } else if (row.amountType === 'ItemFees' || row.amountType === 'FBAFees' || row.amountType === 'Commission') {
            totalFees += amount
          } else {
            totalOther += amount
          }
          if (row.orderId) orderIds.add(row.orderId)
        } else if (row.transactionType === 'Refund') {
          totalRefunds += amount
          if (row.orderId) refundIds.add(row.orderId)
        } else if (row.transactionType.includes('Fee') || row.transactionType === 'ServiceFee') {
          totalFees += amount
        } else {
          totalOther += amount
        }
      }

      orderCount = orderIds.size
      refundCount = refundIds.size

      // Insert settlement record
      const { data: settlement, error: settlementError } = await supabase
        .from('amazon_settlements')
        .insert({
          settlement_id: settlementId,
          report_id: reportDocumentId,
          settlement_start_date: firstRow.settlementStartDate,
          settlement_end_date: firstRow.settlementEndDate,
          deposit_date: firstRow.depositDate || null,
          total_amount: parseFloat(firstRow.totalAmount) || 0,
          currency: firstRow.currency || 'USD',
          marketplace: firstRow.marketplaceName || 'US',
          total_sales: totalSales,
          total_refunds: totalRefunds,
          total_fees: totalFees,
          total_other: totalOther,
          order_count: orderCount,
          refund_count: refundCount,
          status: 'completed',
          processed_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (settlementError) {
        console.error('Error inserting settlement:', settlementError)
        continue
      }

      // Insert transactions in batches
      const transactions = settlementRows.map(row => ({
        settlement_id: settlement.id,
        order_id: row.orderId || null,
        merchant_order_id: row.merchantOrderId || null,
        adjustment_id: row.adjustmentId || null,
        shipment_id: row.shipmentId || null,
        sku: row.sku || null,
        product_name: null, // Could be enriched later
        quantity: row.quantityPurchased ? parseInt(row.quantityPurchased) : null,
        transaction_type: mapTransactionType(row.transactionType),
        amount_type: row.amountType || 'Other',
        amount_description: row.amountDescription || null,
        amount: parseFloat(row.amount) || 0,
        currency: row.currency || 'USD',
        posted_date: row.postedDate || null,
        posted_date_time: row.postedDateTime || null,
      }))

      // Insert in batches of 100
      for (let i = 0; i < transactions.length; i += 100) {
        const batch = transactions.slice(i, i + 100)
        const { error: txnError } = await supabase
          .from('amazon_settlement_transactions')
          .insert(batch)

        if (txnError) {
          console.error('Error inserting transactions batch:', txnError)
        }
      }

      processedSettlements.push(settlementId)
    }

    return NextResponse.json({
      success: true,
      settlementsProcessed: processedSettlements.length,
      settlementIds: processedSettlements,
      totalRows: rows.length,
    })
  } catch (error) {
    console.error('Error downloading settlement report:', error)
    return NextResponse.json(
      { error: 'Failed to download and process settlement report' },
      { status: 500 }
    )
  }
}
