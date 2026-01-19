import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const AMAZON_AUTH_URL = 'https://sellercentral.amazon.com/apps/authorize/consent'
const AMAZON_TOKEN_URL = 'https://api.amazon.com/auth/o2/token'

// GET - Generate OAuth authorization URL
export async function GET() {
  try {
    const clientId = process.env.AMAZON_CLIENT_ID
    const redirectUri = process.env.AMAZON_REDIRECT_URI

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: 'Amazon OAuth not configured' },
        { status: 500 }
      )
    }

    // Generate state for CSRF protection
    const state = crypto.randomUUID()

    // Check if app is in draft/beta mode (not published yet)
    const isDraftApp = process.env.AMAZON_APP_DRAFT === 'true'

    // Build authorization URL
    const params = new URLSearchParams({
      application_id: clientId,
      state,
      redirect_uri: redirectUri,
    })

    // For draft apps, add version=beta to allow authorization before publishing
    if (isDraftApp) {
      params.set('version', 'beta')
    }

    const authUrl = `${AMAZON_AUTH_URL}?${params.toString()}`

    // Store state in a temporary record for verification
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({ authUrl, state })
  } catch (error) {
    console.error('Error generating auth URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    )
  }
}

// POST - Exchange authorization code for tokens
export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      )
    }

    const clientId = process.env.AMAZON_CLIENT_ID
    const clientSecret = process.env.AMAZON_CLIENT_SECRET
    const redirectUri = process.env.AMAZON_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { error: 'Amazon OAuth not configured' },
        { status: 500 }
      )
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(AMAZON_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Token exchange error:', errorData)
      return NextResponse.json(
        { error: 'Failed to exchange authorization code' },
        { status: 400 }
      )
    }

    const tokens = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokens

    // Calculate token expiry
    const accessTokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    // Get seller ID from the tokens (we'd need to call Amazon API for this)
    // For now, we'll use a placeholder that will be updated on first sync
    const sellerId = `SELLER_${Date.now()}`

    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check for existing connection
    const { data: existingConnection } = await supabase
      .from('amazon_connections')
      .select('id')
      .limit(1)
      .single()

    if (existingConnection) {
      // Update existing connection
      const { error: updateError } = await supabase
        .from('amazon_connections')
        .update({
          refresh_token,
          access_token,
          access_token_expires_at: accessTokenExpiresAt,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id)

      if (updateError) throw updateError
    } else {
      // Create new connection
      const { error: insertError } = await supabase
        .from('amazon_connections')
        .insert({
          seller_id: sellerId,
          refresh_token,
          access_token,
          access_token_expires_at: accessTokenExpiresAt,
          client_id: clientId,
          status: 'active',
          marketplaces: ['US'],
        })

      if (insertError) throw insertError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error exchanging code:', error)
    return NextResponse.json(
      { error: 'Failed to exchange authorization code' },
      { status: 500 }
    )
  }
}
