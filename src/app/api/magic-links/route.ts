import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Token generation utilities
function generateSecureToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// POST /api/magic-links - Create a new magic link
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      linkedEntityType,
      linkedEntityId,
      linkedEntityName,
      purpose,
      recipientEmail,
      recipientName,
      recipientRole = 'External User',
      expirationDays = 30,
      customMessage,
      sendImmediately = false,
    } = body

    // Validate required fields
    if (!linkedEntityType || !linkedEntityId || !linkedEntityName || !purpose || !recipientEmail || !recipientName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate entity type and purpose combinations
    const validCombinations: Record<string, string[]> = {
      'purchase-order': ['invoice-submission'],
      'transfer': ['document-upload'],
    }

    if (!validCombinations[linkedEntityType]?.includes(purpose)) {
      return NextResponse.json(
        { error: `Invalid purpose '${purpose}' for entity type '${linkedEntityType}'` },
        { status: 400 }
      )
    }

    // Generate secure token
    const rawToken = generateSecureToken()
    const tokenHash = await hashToken(rawToken)

    // Calculate expiration
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expirationDays)

    // Get user name for audit
    const { data: userInfo } = await supabase.rpc('get_current_user_info')
    const userName = userInfo?.[0]?.user_name || user.email || 'Unknown'

    // Create magic link
    const { data: magicLink, error: insertError } = await supabase
      .from('magic_links')
      .insert({
        token_hash: tokenHash,
        linked_entity_type: linkedEntityType,
        linked_entity_id: linkedEntityId,
        linked_entity_name: linkedEntityName,
        purpose,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        recipient_role: recipientRole,
        expires_at: expiresAt.toISOString(),
        custom_message: customMessage || null,
        created_by_user_id: user.id,
        created_by_user_name: userName,
        sent_at: sendImmediately ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create magic link:', insertError)
      return NextResponse.json(
        { error: 'Failed to create magic link' },
        { status: 500 }
      )
    }

    // Log created event
    await supabase.from('magic_link_events').insert({
      magic_link_id: magicLink.id,
      event_type: 'created',
      triggered_by_user_id: user.id,
      triggered_by_user_name: userName,
    })

    // Log sent event if sendImmediately
    if (sendImmediately) {
      await supabase.from('magic_link_events').insert({
        magic_link_id: magicLink.id,
        event_type: 'sent',
        triggered_by_user_id: user.id,
        triggered_by_user_name: userName,
      })
    }

    // Build the magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const formPath = purpose === 'invoice-submission' ? 'invoice' : 'documents'
    const magicLinkUrl = `${baseUrl}/forms/${formPath}/${rawToken}`

    return NextResponse.json({
      magicLink: {
        id: magicLink.id,
        linkedEntityType: magicLink.linked_entity_type,
        linkedEntityId: magicLink.linked_entity_id,
        linkedEntityName: magicLink.linked_entity_name,
        purpose: magicLink.purpose,
        status: magicLink.status,
        recipientEmail: magicLink.recipient_email,
        recipientName: magicLink.recipient_name,
        expiresAt: magicLink.expires_at,
        createdAt: magicLink.created_at,
      },
      // Only return raw token once - it won't be stored
      rawToken,
      url: magicLinkUrl,
    })
  } catch (error) {
    console.error('Error creating magic link:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/magic-links - List magic links (authenticated)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')

    let query = supabase
      .from('magic_links')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }
    if (entityType) {
      query = query.eq('linked_entity_type', entityType)
    }
    if (entityId) {
      query = query.eq('linked_entity_id', entityId)
    }

    const { data: magicLinks, error: fetchError } = await query

    if (fetchError) {
      console.error('Failed to fetch magic links:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch magic links' },
        { status: 500 }
      )
    }

    // Get summary
    const { data: summary } = await supabase
      .from('magic_links_summary')
      .select('*')
      .single()

    return NextResponse.json({
      magicLinks: magicLinks || [],
      summary: summary || {
        total_active: 0,
        pending_submission: 0,
        submitted_this_week: 0,
        expiring_within_24_hours: 0,
      },
    })
  } catch (error) {
    console.error('Error fetching magic links:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
