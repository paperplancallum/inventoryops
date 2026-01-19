import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const AMAZON_SP_API_BASE = 'https://sellingpartnerapi-na.amazon.com'

// Settlement report type (V2 - the non-deprecated version)
const SETTLEMENT_REPORT_TYPE = 'GET_V2_SETTLEMENT_REPORT_DATA_FLAT_FILE_V2'

// GET - List all settlements
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const marketplace = searchParams.get('marketplace')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('amazon_settlements')
      .select('*', { count: 'exact' })
      .order('settlement_end_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }
    if (marketplace) {
      query = query.eq('marketplace', marketplace)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching settlements:', error)
      return NextResponse.json(
        { error: 'Failed to fetch settlements' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      settlements: data || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error in settlements GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Request settlement reports from Amazon
export async function POST(request: NextRequest) {
  try {
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

      // Refetch connection with new token
      const { data: refreshedConnection } = await supabase
        .from('amazon_connections')
        .select('*')
        .limit(1)
        .single()

      if (refreshedConnection) {
        connection.access_token = refreshedConnection.access_token
      }
    }

    // Get request body for optional date filters
    const body = await request.json().catch(() => ({}))
    const { startDate, endDate } = body

    // Build report request parameters
    // If no dates provided, get reports from last 90 days
    const reportEndDate = endDate ? new Date(endDate) : new Date()
    const reportStartDate = startDate
      ? new Date(startDate)
      : new Date(reportEndDate.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Request report from Amazon Reports API
    const reportsUrl = `${AMAZON_SP_API_BASE}/reports/2021-06-30/reports`

    const reportRequest = {
      reportType: SETTLEMENT_REPORT_TYPE,
      marketplaceIds: connection.marketplaces || ['ATVPDKIKX0DER'], // US marketplace
      dataStartTime: reportStartDate.toISOString(),
      dataEndTime: reportEndDate.toISOString(),
    }

    const reportResponse = await fetch(reportsUrl, {
      method: 'POST',
      headers: {
        'x-amz-access-token': connection.access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportRequest),
    })

    if (!reportResponse.ok) {
      const errorData = await reportResponse.json().catch(() => ({}))
      console.error('Amazon report request error:', errorData)

      // Handle auth errors
      if (reportResponse.status === 401 || reportResponse.status === 403) {
        await supabase
          .from('amazon_connections')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id)
      }

      return NextResponse.json(
        { error: 'Failed to request report from Amazon', details: errorData },
        { status: reportResponse.status }
      )
    }

    const reportData = await reportResponse.json()

    return NextResponse.json({
      success: true,
      reportId: reportData.reportId,
      message: 'Report requested successfully. Poll status endpoint to check when ready.',
    })
  } catch (error) {
    console.error('Error requesting settlement report:', error)
    return NextResponse.json(
      { error: 'Failed to request settlement report' },
      { status: 500 }
    )
  }
}
