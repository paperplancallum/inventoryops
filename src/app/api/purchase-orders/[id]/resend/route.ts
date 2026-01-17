import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPOReminder } from '@/lib/email/resend'

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

// POST /api/purchase-orders/[id]/resend
// Regenerates magic link and sends reminder email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: poId } = await params
    const supabase = await createClient()

    // Verify authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch PO with supplier
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        suppliers:supplier_id (
          id,
          name,
          contact_name,
          contact_email
        )
      `)
      .eq('id', poId)
      .single()

    if (poError || !po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Validate PO is in awaiting_invoice status
    if (po.status !== 'awaiting_invoice') {
      return NextResponse.json(
        { error: 'Can only resend for orders awaiting invoice' },
        { status: 400 }
      )
    }

    const supplier = po.suppliers as { id: string; name: string; contact_name: string; contact_email: string }
    if (!supplier?.contact_email) {
      return NextResponse.json(
        { error: 'Supplier does not have an email address' },
        { status: 400 }
      )
    }

    // Revoke existing active links and create a new one
    const { data: existingLinks } = await supabase
      .from('magic_links')
      .select('id')
      .eq('linked_entity_id', poId)
      .eq('linked_entity_type', 'purchase-order')
      .eq('status', 'active')

    if (existingLinks && existingLinks.length > 0) {
      await supabase
        .from('magic_links')
        .update({ status: 'revoked', revoked_at: new Date().toISOString() })
        .in('id', existingLinks.map(l => l.id))
    }

    // Generate new secure token
    const rawToken = generateSecureToken()
    const tokenHash = await hashToken(rawToken)

    // Calculate expiration (30 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Get user name for audit
    const { data: userInfo } = await supabase.rpc('get_current_user_info')
    const userName = userInfo?.[0]?.user_name || user.email || 'Unknown'

    // Create new magic link
    const { data: magicLink, error: insertError } = await supabase
      .from('magic_links')
      .insert({
        token_hash: tokenHash,
        linked_entity_type: 'purchase-order',
        linked_entity_id: poId,
        linked_entity_name: po.po_number,
        purpose: 'invoice-submission',
        recipient_email: supplier.contact_email,
        recipient_name: supplier.contact_name || supplier.name,
        recipient_role: 'Supplier',
        expires_at: expiresAt.toISOString(),
        created_by_user_id: user.id,
        created_by_user_name: userName,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create magic link:', insertError)
      return NextResponse.json({ error: 'Failed to create magic link' }, { status: 500 })
    }

    // Log events
    await supabase.from('magic_link_events').insert([
      {
        magic_link_id: magicLink.id,
        event_type: 'regenerated',
        triggered_by_user_id: user.id,
        triggered_by_user_name: userName,
      },
      {
        magic_link_id: magicLink.id,
        event_type: 'reminder_sent',
        triggered_by_user_id: user.id,
        triggered_by_user_name: userName,
      },
    ])

    // Build the magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const magicLinkUrl = `${baseUrl}/forms/invoice/${rawToken}`

    // Calculate days remaining
    const daysRemaining = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    // Send reminder email via Resend
    try {
      await sendPOReminder({
        supplierEmail: supplier.contact_email,
        supplierName: supplier.contact_name || supplier.name,
        poNumber: po.po_number,
        magicLinkUrl,
        expiresAt: expiresAt.toISOString(),
        daysRemaining,
      })
    } catch (emailError) {
      console.error('Failed to send reminder email:', emailError)
      return NextResponse.json(
        { 
          error: 'Magic link created but email failed to send',
          magicLinkUrl,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Reminder sent to ${supplier.contact_email}`,
      magicLinkId: magicLink.id,
      expiresAt: expiresAt.toISOString(),
    })

  } catch (error) {
    console.error('Error resending to supplier:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
