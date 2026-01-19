import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Create a mock Amazon connection for development/testing
// This bypasses OAuth when the SP-API app isn't published yet
export async function POST() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_MOCK_CONNECTION) {
      return NextResponse.json(
        { error: 'Mock connections not allowed in production' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Check for existing connection
    const { data: existing } = await supabase
      .from('amazon_connections')
      .select('id')
      .limit(1)
      .single()

    if (existing) {
      // Update existing to active
      const { error: updateError } = await supabase
        .from('amazon_connections')
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        message: 'Existing connection activated',
        connectionId: existing.id
      })
    }

    // Create mock connection
    const { data, error: insertError } = await supabase
      .from('amazon_connections')
      .insert({
        seller_id: 'MOCK_SELLER_DEV',
        refresh_token: 'mock_refresh_token_for_development',
        access_token: 'mock_access_token_for_development',
        access_token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        client_id: process.env.AMAZON_CLIENT_ID || 'mock_client_id',
        status: 'active',
        marketplaces: ['US'],
      })
      .select('id')
      .single()

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      message: 'Mock connection created for development',
      connectionId: data?.id
    })
  } catch (error) {
    console.error('Error creating mock connection:', error)
    return NextResponse.json(
      { error: 'Failed to create mock connection' },
      { status: 500 }
    )
  }
}
