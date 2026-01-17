import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create anonymous Supabase client for public access (magic link validation)
function createAnonClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Create service role client for fetching entity data (bypasses RLS)
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceRoleKey)
}

// Hash token for lookup
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Anonymize IP address (mask last octet)
function anonymizeIp(ip: string): string {
  if (!ip) return ''
  const parts = ip.split('.')
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`
  }
  // IPv6 - just return masked version
  return ip.replace(/:[^:]+$/, ':xxxx')
}

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10 // requests
const RATE_WINDOW = 60 * 1000 // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT) {
    return false
  }

  record.count++
  return true
}

// GET /api/magic-links/validate/[token] - Validate token and get link data (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Hash the token for lookup
    const tokenHash = await hashToken(token)

    const supabase = createAnonClient()

    // Find magic link by token hash
    const { data: magicLink, error: linkError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('token_hash', tokenHash)
      .single()

    if (linkError || !magicLink) {
      return NextResponse.json(
        { error: 'Invalid or expired link' },
        { status: 404 }
      )
    }

    // Check status
    if (magicLink.status === 'revoked') {
      return NextResponse.json(
        { error: 'This link has been revoked', status: 'revoked' },
        { status: 410 }
      )
    }

    if (magicLink.status === 'submitted') {
      return NextResponse.json(
        {
          error: 'This form has already been submitted',
          status: 'submitted',
          submittedAt: magicLink.submitted_at,
        },
        { status: 410 }
      )
    }

    // Check expiration
    const expiresAt = new Date(magicLink.expires_at)
    if (expiresAt < new Date()) {
      // Update status to expired if not already
      if (magicLink.status === 'active') {
        await supabase
          .from('magic_links')
          .update({ status: 'expired' })
          .eq('id', magicLink.id)
      }

      return NextResponse.json(
        { error: 'This link has expired', status: 'expired' },
        { status: 410 }
      )
    }

    // Log view event if first view
    const userAgent = request.headers.get('user-agent') || null
    const anonymizedIp = anonymizeIp(clientIp)

    if (!magicLink.first_viewed_at) {
      await supabase
        .from('magic_links')
        .update({ first_viewed_at: new Date().toISOString() })
        .eq('id', magicLink.id)
    }

    await supabase.from('magic_link_events').insert({
      magic_link_id: magicLink.id,
      event_type: 'viewed',
      ip_address: anonymizedIp,
      user_agent: userAgent,
    })

    // Fetch related entity data based on purpose
    // Use service client to bypass RLS (magic link has already been validated)
    const serviceClient = createServiceClient()
    let entityData = null

    if (magicLink.purpose === 'invoice-submission' && magicLink.linked_entity_type === 'purchase-order') {
      // Fetch PO with line items for invoice submission
      const { data: poData, error: poError } = await serviceClient
        .from('purchase_orders')
        .select(`
          id,
          po_number,
          order_date,
          notes,
          supplier_id,
          suppliers:supplier_id (
            name
          ),
          po_line_items (
            id,
            product_id,
            product_name,
            sku,
            quantity,
            unit_cost,
            products:product_id (
              image_url
            )
          )
        `)
        .eq('id', magicLink.linked_entity_id)
        .single()

      if (poError) {
        console.error('Error fetching PO for magic link:', poError)
      }

      if (poData) {
        // Get supplier name from the joined suppliers table
        const supplierArray = poData.suppliers as { name: string }[] | null
        const supplierData = supplierArray?.[0]
        entityData = {
          poNumber: poData.po_number,
          supplierName: supplierData?.name || 'Unknown Supplier',
          orderDate: poData.order_date,
          currency: 'USD', // Default currency
          notes: poData.notes || '',
          lineItems: poData.po_line_items?.map((li: {
            id: string
            product_id: string
            product_name: string
            sku: string
            quantity: number
            unit_cost: number
            products: { image_url: string | null }[] | null
          }) => ({
            id: li.id,
            productId: li.product_id,
            productName: li.product_name,
            sku: li.sku,
            quantity: li.quantity,
            estimatedUnitCost: li.unit_cost,
            productImageUrl: li.products?.[0]?.image_url || undefined,
          })) || [],
        }
      }
    } else if (magicLink.purpose === 'document-upload' && magicLink.linked_entity_type === 'transfer') {
      // Fetch Transfer with line items for document upload
      const { data: transferData } = await serviceClient
        .from('transfers')
        .select(`
          id,
          transfer_number,
          source_location_name,
          destination_location_name,
          carrier,
          scheduled_departure,
          scheduled_arrival,
          notes,
          transfer_line_items (
            id,
            product_name,
            product_sku,
            quantity
          )
        `)
        .eq('id', magicLink.linked_entity_id)
        .single()

      if (transferData) {
        entityData = {
          transferNumber: transferData.transfer_number,
          sourceLocation: transferData.source_location_name,
          destinationLocation: transferData.destination_location_name,
          carrier: transferData.carrier,
          scheduledDeparture: transferData.scheduled_departure,
          scheduledArrival: transferData.scheduled_arrival,
          notes: transferData.notes || '',
          lineItems: transferData.transfer_line_items?.map((li: {
            id: string
            product_name: string
            product_sku: string
            quantity: number
          }) => ({
            id: li.id,
            productName: li.product_name,
            sku: li.product_sku,
            quantity: li.quantity,
          })) || [],
        }
      }
    }

    return NextResponse.json({
      valid: true,
      magicLink: {
        id: magicLink.id,
        purpose: magicLink.purpose,
        linkedEntityType: magicLink.linked_entity_type,
        linkedEntityName: magicLink.linked_entity_name,
        recipientName: magicLink.recipient_name,
        recipientEmail: magicLink.recipient_email,
        expiresAt: magicLink.expires_at,
        customMessage: magicLink.custom_message,
        metadata: magicLink.metadata || {},
      },
      entityData,
    })
  } catch (error) {
    console.error('Error validating magic link:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
