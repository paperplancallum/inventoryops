import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const AMAZON_TOKEN_URL = 'https://api.amazon.com/auth/o2/token'

// GET - Handle OAuth callback from Amazon
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('spapi_oauth_code')
    const state = searchParams.get('state')
    const sellingPartnerId = searchParams.get('selling_partner_id')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    console.log('Amazon OAuth callback received:', { code: code?.substring(0, 20) + '...', state, sellingPartnerId, error })

    // Handle error from Amazon
    if (error) {
      console.error('Amazon OAuth error:', error, errorDescription)
      const redirectUrl = new URL('/inventory', request.nextUrl.origin)
      redirectUrl.searchParams.set('error', errorDescription || error)
      return NextResponse.redirect(redirectUrl)
    }

    // Validate required parameters
    if (!code) {
      const redirectUrl = new URL('/inventory', request.nextUrl.origin)
      redirectUrl.searchParams.set('error', 'Missing authorization code')
      return NextResponse.redirect(redirectUrl)
    }

    // Exchange code for tokens
    const clientId = process.env.AMAZON_CLIENT_ID
    const clientSecret = process.env.AMAZON_CLIENT_SECRET
    const redirectUri = process.env.AMAZON_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing Amazon OAuth configuration')
      const redirectUrl = new URL('/inventory', request.nextUrl.origin)
      redirectUrl.searchParams.set('error', 'Server configuration error')
      return NextResponse.redirect(redirectUrl)
    }

    console.log('Exchanging code for tokens...')
    const tokenResponse = await fetch(AMAZON_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Token exchange error:', errorData)
      const redirectUrl = new URL('/inventory', request.nextUrl.origin)
      redirectUrl.searchParams.set('error', 'Failed to exchange authorization code')
      return NextResponse.redirect(redirectUrl)
    }

    const tokens = await tokenResponse.json()
    const { access_token, refresh_token, expires_in } = tokens
    console.log('Tokens received, expires_in:', expires_in)

    // Calculate token expiry
    const accessTokenExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString()

    // Store tokens in database
    const supabase = await createClient()

    const { error: upsertError } = await supabase
      .from('amazon_connections')
      .upsert({
        seller_id: sellingPartnerId || 'AUTHORIZED_SELLER',
        refresh_token,
        access_token,
        access_token_expires_at: accessTokenExpiresAt,
        client_id: clientId,
        client_secret: clientSecret,
        status: 'active',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'seller_id',
      })

    if (upsertError) {
      console.error('Error storing tokens:', upsertError)
      // Try update instead
      const { error: updateError } = await supabase
        .from('amazon_connections')
        .update({
          seller_id: sellingPartnerId || 'AUTHORIZED_SELLER',
          refresh_token,
          access_token,
          access_token_expires_at: accessTokenExpiresAt,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .not('id', 'is', null)

      if (updateError) {
        console.error('Error updating tokens:', updateError)
      }
    }

    console.log('Amazon connection saved successfully')

    // Redirect to inventory page with success
    const redirectUrl = new URL('/inventory', request.nextUrl.origin)
    redirectUrl.searchParams.set('amazon_connected', 'true')
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Error in Amazon callback:', error)
    const redirectUrl = new URL('/inventory', request.nextUrl.origin)
    redirectUrl.searchParams.set('error', 'Callback processing failed')
    return NextResponse.redirect(redirectUrl)
  }
}
