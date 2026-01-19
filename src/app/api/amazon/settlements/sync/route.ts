import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const SETTLEMENT_REPORT_TYPE = 'GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE_V2'

interface AmazonConnection {
  id: string
  seller_id: string
  marketplace_id: string
  access_token: string
  refresh_token: string
  token_expires_at: string
}

interface ReportDocument {
  reportDocumentId: string
  url: string
  compressionAlgorithm?: string
}

// Transaction type mapping
const TRANSACTION_TYPE_MAP: Record<string, string> = {
  'Order': 'order',
  'Refund': 'refund',
  'Service Fee': 'service_fee',
  'Adjustment': 'adjustment',
  'Transfer': 'transfer',
  'FBA Inventory Fee': 'fba_fee',
  'FBA Customer Return Fee': 'fba_fee',
  'FBA Inventory Reimbursement': 'reimbursement',
  'Liquidations': 'other',
  'Lightning Deal Fee': 'service_fee',
  'Subscription Fee': 'service_fee',
  'SAFE-T Reimbursement': 'reimbursement',
  'Chargeback': 'chargeback',
  'Chargeback Refund': 'chargeback',
  'A-to-z Guarantee Claim': 'guarantee_claim',
}

function mapTransactionType(amazonType: string): string {
  return TRANSACTION_TYPE_MAP[amazonType] || 'other'
}

async function refreshAccessToken(connection: AmazonConnection, supabase: any): Promise<string> {
  const tokenResponse = await fetch('https://api.amazon.com/auth/o2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: connection.refresh_token,
      client_id: process.env.AMAZON_CLIENT_ID!,
      client_secret: process.env.AMAZON_CLIENT_SECRET!,
    }),
  })

  if (!tokenResponse.ok) {
    throw new Error('Failed to refresh Amazon token')
  }

  const tokenData = await tokenResponse.json()
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

  await supabase
    .from('amazon_connections')
    .update({
      access_token: tokenData.access_token,
      token_expires_at: expiresAt,
    })
    .eq('id', connection.id)

  return tokenData.access_token
}

async function getValidAccessToken(connection: AmazonConnection, supabase: any): Promise<string> {
  const expiresAt = new Date(connection.token_expires_at)
  const now = new Date()

  if (expiresAt <= new Date(now.getTime() + 5 * 60 * 1000)) {
    return refreshAccessToken(connection, supabase)
  }

  return connection.access_token
}

async function fetchAvailableReports(accessToken: string): Promise<any[]> {
  // Get reports from the last 90 days (Amazon's max)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 90)

  const params = new URLSearchParams({
    reportTypes: SETTLEMENT_REPORT_TYPE,
    processingStatuses: 'DONE',
    createdSince: startDate.toISOString(),
    pageSize: '100',
  })

  const response = await fetch(
    `https://sellingpartnerapi-na.amazon.com/reports/2021-06-30/reports?${params}`,
    {
      headers: {
        'x-amz-access-token': accessToken,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to fetch reports: ${error}`)
  }

  const data = await response.json()
  return data.reports || []
}

async function getReportDocument(reportDocumentId: string, accessToken: string): Promise<ReportDocument> {
  const response = await fetch(
    `https://sellingpartnerapi-na.amazon.com/reports/2021-06-30/documents/${reportDocumentId}`,
    {
      headers: {
        'x-amz-access-token': accessToken,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to get report document')
  }

  return response.json()
}

async function downloadAndParseReport(
  documentUrl: string,
  compressionAlgorithm?: string
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const response = await fetch(documentUrl)

  if (!response.ok) {
    throw new Error('Failed to download report')
  }

  let content: string

  if (compressionAlgorithm === 'GZIP') {
    const buffer = await response.arrayBuffer()
    const decompressed = await new Response(
      new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'))
    ).text()
    content = decompressed
  } else {
    content = await response.text()
  }

  const lines = content.trim().split('\n')
  if (lines.length < 2) {
    return { headers: [], rows: [] }
  }

  const headers = lines[0].split('\t')
  const rows = lines.slice(1).map(line => {
    const values = line.split('\t')
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    return row
  })

  return { headers, rows }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Amazon connection
    const { data: connections, error: connError } = await supabase
      .from('amazon_connections')
      .select('*')
      .eq('user_id', user.id)
      .limit(1)

    if (connError || !connections?.length) {
      return NextResponse.json({ error: 'No Amazon connection found' }, { status: 400 })
    }

    const connection = connections[0] as AmazonConnection
    const accessToken = await getValidAccessToken(connection, supabase)

    // Fetch all available settlement reports from Amazon
    const reports = await fetchAvailableReports(accessToken)

    if (!reports.length) {
      return NextResponse.json({
        message: 'No settlement reports available',
        synced: 0,
        skipped: 0
      })
    }

    // Get existing report IDs to avoid duplicates
    const { data: existingSettlements } = await supabase
      .from('amazon_settlements')
      .select('amazon_report_id')
      .eq('user_id', user.id)

    const existingReportIds = new Set(
      existingSettlements?.map(s => s.amazon_report_id) || []
    )

    let synced = 0
    let skipped = 0
    const errors: string[] = []

    // Process each report
    for (const report of reports) {
      try {
        // Skip if already imported
        if (existingReportIds.has(report.reportId)) {
          skipped++
          continue
        }

        // Get document info
        const docInfo = await getReportDocument(report.reportDocumentId, accessToken)

        // Download and parse
        const { rows } = await downloadAndParseReport(
          docInfo.url,
          docInfo.compressionAlgorithm
        )

        if (!rows.length) {
          continue
        }

        // Extract settlement info from first row
        const firstRow = rows[0]
        const settlementId = firstRow['settlement-id'] || report.reportId
        const startDate = firstRow['settlement-start-date']
        const endDate = firstRow['settlement-end-date']
        const currency = firstRow['currency'] || 'USD'

        // Calculate totals
        let totalAmount = 0
        let totalFees = 0
        let totalRefunds = 0
        let depositAmount = 0

        rows.forEach(row => {
          const amount = parseFloat(row['total-amount'] || row['amount'] || '0')
          const transactionType = row['transaction-type'] || ''

          if (transactionType === 'Transfer') {
            depositAmount = amount
          } else if (transactionType === 'Refund') {
            totalRefunds += Math.abs(amount)
          } else if (
            transactionType.includes('Fee') ||
            transactionType.includes('Commission')
          ) {
            totalFees += Math.abs(amount)
          }

          totalAmount += amount
        })

        // Insert settlement
        const { data: settlement, error: insertError } = await supabase
          .from('amazon_settlements')
          .insert({
            user_id: user.id,
            amazon_report_id: report.reportId,
            settlement_id: settlementId,
            settlement_start_date: startDate,
            settlement_end_date: endDate,
            deposit_date: report.dataEndTime,
            total_amount: totalAmount,
            currency,
            status: 'completed',
            marketplace_id: connection.marketplace_id,
            fees_total: totalFees,
            refunds_total: totalRefunds,
            deposit_amount: depositAmount,
          })
          .select()
          .single()

        if (insertError) {
          errors.push(`Failed to insert settlement ${settlementId}: ${insertError.message}`)
          continue
        }

        // Insert transactions in batches
        const transactions = rows.map(row => ({
          settlement_id: settlement.id,
          user_id: user.id,
          amazon_transaction_id: row['order-id'] || row['transaction-id'] || null,
          transaction_type: mapTransactionType(row['transaction-type'] || ''),
          amazon_transaction_type: row['transaction-type'] || 'Unknown',
          order_id: row['order-id'] || null,
          sku: row['sku'] || null,
          quantity: parseInt(row['quantity-purchased'] || '0') || null,
          marketplace: row['marketplace-name'] || null,
          posted_date: row['posted-date'] || row['posted-date-time'] || null,
          amount_type: row['amount-type'] || null,
          amount: parseFloat(row['total-amount'] || row['amount'] || '0'),
          amount_description: row['amount-description'] || null,
        }))

        // Insert in batches of 500
        for (let i = 0; i < transactions.length; i += 500) {
          const batch = transactions.slice(i, i + 500)
          await supabase.from('amazon_settlement_transactions').insert(batch)
        }

        synced++
      } catch (err) {
        errors.push(`Error processing report ${report.reportId}: ${err}`)
      }
    }

    return NextResponse.json({
      message: `Sync complete`,
      synced,
      skipped,
      total: reports.length,
      errors: errors.length ? errors : undefined,
    })
  } catch (error) {
    console.error('Settlement sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}

// GET endpoint to check sync status
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the most recent settlement
    const { data: latestSettlement } = await supabase
      .from('amazon_settlements')
      .select('created_at, settlement_end_date')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Get total count
    const { count } = await supabase
      .from('amazon_settlements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    return NextResponse.json({
      lastSyncedAt: latestSettlement?.created_at || null,
      latestSettlementDate: latestSettlement?.settlement_end_date || null,
      totalSettlements: count || 0,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}
