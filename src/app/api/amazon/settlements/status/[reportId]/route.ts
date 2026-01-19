import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const AMAZON_SP_API_BASE = 'https://sellingpartnerapi-na.amazon.com'

// GET - Check report status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params
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

    // Check report status with Amazon
    const statusUrl = `${AMAZON_SP_API_BASE}/reports/2021-06-30/reports/${reportId}`

    const statusResponse = await fetch(statusUrl, {
      headers: {
        'x-amz-access-token': connection.access_token,
        'Content-Type': 'application/json',
      },
    })

    if (!statusResponse.ok) {
      const errorData = await statusResponse.json().catch(() => ({}))
      console.error('Amazon report status error:', errorData)

      return NextResponse.json(
        { error: 'Failed to get report status', details: errorData },
        { status: statusResponse.status }
      )
    }

    const statusData = await statusResponse.json()

    return NextResponse.json({
      reportId,
      status: statusData.processingStatus,
      reportDocumentId: statusData.reportDocumentId || null,
      dataStartTime: statusData.dataStartTime,
      dataEndTime: statusData.dataEndTime,
      createdTime: statusData.createdTime,
      processingStartTime: statusData.processingStartTime,
      processingEndTime: statusData.processingEndTime,
    })
  } catch (error) {
    console.error('Error checking report status:', error)
    return NextResponse.json(
      { error: 'Failed to check report status' },
      { status: 500 }
    )
  }
}
