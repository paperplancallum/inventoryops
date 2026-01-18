import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPOToSupplier } from '@/lib/email/resend'
import { generateAndSaveDocument } from '@/lib/documents/generateDocument'

// Token generation utilities (same as magic-links route)
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

// POST /api/purchase-orders/[id]/send-to-supplier
// Creates magic link, sends email, updates PO status
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

    // Get optional custom message from request body
    const body = await request.json().catch(() => ({}))
    const { customMessage } = body

    // Fetch PO with supplier and line items
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        suppliers:supplier_id (
          id,
          name,
          contact_name,
          contact_email
        ),
        po_line_items (
          id,
          sku,
          product_name,
          quantity,
          unit_cost,
          subtotal
        )
      `)
      .eq('id', poId)
      .single()

    if (poError || !po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Validate supplier has email
    const supplier = po.suppliers as { id: string; name: string; contact_name: string; contact_email: string }
    if (!supplier?.contact_email) {
      return NextResponse.json(
        { error: 'Supplier does not have an email address configured' },
        { status: 400 }
      )
    }

    // Check if there's already an active magic link
    const { data: existingLinks } = await supabase
      .from('magic_links')
      .select('id, status, expires_at')
      .eq('linked_entity_id', poId)
      .eq('linked_entity_type', 'purchase-order')
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())

    // If active link exists, we could either resend or create new
    // For now, let's create a new one and revoke old ones
    if (existingLinks && existingLinks.length > 0) {
      // Revoke existing active links
      await supabase
        .from('magic_links')
        .update({ status: 'revoked', revoked_at: new Date().toISOString() })
        .in('id', existingLinks.map(l => l.id))
    }

    // Generate secure token
    const rawToken = generateSecureToken()
    const tokenHash = await hashToken(rawToken)

    // Calculate expiration (30 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Get user name for audit
    const { data: userInfo } = await supabase.rpc('get_current_user_info')
    const userName = userInfo?.[0]?.user_name || user.email || 'Unknown'

    // Create magic link
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
        custom_message: customMessage || null,
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
        event_type: 'created',
        triggered_by_user_id: user.id,
        triggered_by_user_name: userName,
      },
      {
        magic_link_id: magicLink.id,
        event_type: 'sent',
        triggered_by_user_id: user.id,
        triggered_by_user_name: userName,
      },
    ])

    // Build the magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const magicLinkUrl = `${baseUrl}/forms/invoice/${rawToken}`

    // Calculate total
    const lineItems = po.po_line_items as Array<{
      sku: string
      product_name: string
      quantity: number
      unit_cost: number
    }>
    const totalAmount = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0)

    // Send email via Resend
    try {
      await sendPOToSupplier({
        supplierEmail: supplier.contact_email,
        supplierName: supplier.contact_name || supplier.name,
        poNumber: po.po_number,
        poId: poId,
        magicLinkUrl,
        lineItems: lineItems.map(item => ({
          sku: item.sku,
          productName: item.product_name,
          quantity: item.quantity,
          unitCost: item.unit_cost,
        })),
        totalAmount,
        customMessage,
        expiresAt: expiresAt.toISOString(),
      })
    } catch (emailError) {
      console.error('Failed to send email:', emailError)
      // Even if email fails, we've created the magic link
      // Mark as created but not sent
      await supabase
        .from('magic_links')
        .update({ sent_at: null })
        .eq('id', magicLink.id)

      return NextResponse.json(
        { 
          error: 'Magic link created but email failed to send',
          magicLinkUrl,
          magicLinkId: magicLink.id,
        },
        { status: 500 }
      )
    }

    // Update PO status to awaiting_invoice
    const { error: updateError } = await supabase
      .from('purchase_orders')
      .update({
        status: 'awaiting_invoice',
        sent_to_supplier_at: new Date().toISOString(),
      })
      .eq('id', poId)

    if (updateError) {
      console.error('Failed to update PO status:', updateError)
      // Non-fatal - email was sent
    }

    // Add status history entry
    await supabase.from('po_status_history').insert({
      purchase_order_id: poId,
      status: 'awaiting_invoice',
      note: `Sent to supplier ${supplier.name} via email`,
      changed_by_id: user.id,
      changed_by_name: userName,
    })

    // Auto-generate PO PDF document (direct call, no HTTP roundtrip)
    try {
      await generateAndSaveDocument(supabase, user.id, userName, {
        sourceEntityType: 'purchase-order',
        sourceEntityId: poId,
        documentType: 'purchase-order-pdf',
        trigger: 'auto',
        notes: `Auto-generated when sent to supplier ${supplier.name}`,
      })
    } catch (docError) {
      // Non-fatal - log but don't fail the request
      console.error('Failed to auto-generate PO PDF:', docError)
    }

    return NextResponse.json({
      success: true,
      message: `Purchase order sent to ${supplier.contact_email}`,
      magicLinkId: magicLink.id,
      expiresAt: expiresAt.toISOString(),
    })

  } catch (error) {
    console.error('Error sending to supplier:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
