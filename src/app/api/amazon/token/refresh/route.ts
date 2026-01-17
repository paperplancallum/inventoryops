import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const AMAZON_TOKEN_URL = 'https://api.amazon.com/auth/o2/token'

// POST - Refresh access token
export async function POST() {
  try {
    const clientId = process.env.AMAZON_CLIENT_ID
    const clientSecret = process.env.AMAZON_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Amazon OAuth not configured' },
        { status: 500 }
      )
    }

    const supabase = await createClient()

    // TODO: Re-enable auth check in production
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!user) {
    //   return NextResponse.json(
    //     { error: 'Not authenticated' },
    //     { status: 401 }
    //   )
    // }

    // Get existing connection
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

    if (!connection.refresh_token) {
      return NextResponse.json(
        { error: 'No refresh token available' },
        { status: 400 }
      )
    }

    // Refresh the token
    const tokenResponse = await fetch(AMAZON_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Token refresh error:', errorData)

      // Update connection status to expired
      await supabase
        .from('amazon_connections')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', connection.id)

      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: 400 }
      )
    }

    const tokens = await tokenResponse.json()
    const { access_token, refresh_token: newRefreshToken, expires_in } = tokens

    // Calculate token expiry
    const accessTokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    // Update connection with new tokens
    const { error: updateError } = await supabase
      .from('amazon_connections')
      .update({
        access_token,
        refresh_token: newRefreshToken || connection.refresh_token,
        access_token_expires_at: accessTokenExpiresAt,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      expiresAt: accessTokenExpiresAt,
    })
  } catch (error) {
    console.error('Error refreshing token:', error)
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    )
  }
}
