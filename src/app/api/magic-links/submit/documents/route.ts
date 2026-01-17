import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create anonymous Supabase client for public access
function createAnonClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Hash token for lookup
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Anonymize IP address
function anonymizeIp(ip: string): string {
  if (!ip) return ''
  const parts = ip.split('.')
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`
  }
  return ip.replace(/:[^:]+$/, ':xxxx')
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW = 60 * 1000

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

type DocumentType = 'bill_of_lading' | 'proof_of_delivery' | 'insurance_certificate' |
                    'packing_list' | 'customs_declaration' | 'other'

interface DocumentSubmission {
  type: DocumentType
  fileName: string
  fileUrl: string
  notes?: string | null
}

interface TrackingUpdate {
  carrier: string
  trackingNumber: string
  status: string
}

// POST /api/magic-links/submit/documents - Submit transfer documents (public)
export async function POST(request: NextRequest) {
  try {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const {
      token,
      documents,
      trackingUpdates,
      actualPickupDate,
      actualDeliveryDate,
      notes,
      submittedByName,
      submittedByEmail,
    } = body as {
      token: string
      documents: DocumentSubmission[]
      trackingUpdates?: TrackingUpdate[]
      actualPickupDate?: string
      actualDeliveryDate?: string
      notes?: string
      submittedByName: string
      submittedByEmail: string
    }

    // Validate required fields
    if (!token || !documents || documents.length === 0 || !submittedByName || !submittedByEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Hash token for lookup
    const tokenHash = await hashToken(token)

    const supabase = createAnonClient()

    // Find and validate magic link
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

    // Check status and expiration
    if (magicLink.status !== 'active') {
      return NextResponse.json(
        { error: `Link is ${magicLink.status}`, status: magicLink.status },
        { status: 410 }
      )
    }

    if (new Date(magicLink.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Link has expired', status: 'expired' },
        { status: 410 }
      )
    }

    // Verify purpose
    if (magicLink.purpose !== 'document-upload') {
      return NextResponse.json(
        { error: 'Invalid link type for document upload' },
        { status: 400 }
      )
    }

    // Get transfer data
    const { data: transferData, error: transferError } = await supabase
      .from('transfers')
      .select('id, transfer_number')
      .eq('id', magicLink.linked_entity_id)
      .single()

    if (transferError || !transferData) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      )
    }

    // Log form_started event
    const userAgent = request.headers.get('user-agent') || null
    const anonymizedIp = anonymizeIp(clientIp)

    await supabase.from('magic_link_events').insert({
      magic_link_id: magicLink.id,
      event_type: 'form_started',
      ip_address: anonymizedIp,
      user_agent: userAgent,
    })

    // Valid document types
    const validDocTypes = new Set([
      'bill_of_lading', 'proof_of_delivery', 'insurance_certificate',
      'packing_list', 'customs_declaration', 'other'
    ])

    // Validate and insert documents
    for (const doc of documents) {
      if (!validDocTypes.has(doc.type)) {
        return NextResponse.json(
          { error: `Invalid document type: ${doc.type}` },
          { status: 400 }
        )
      }

      if (!doc.fileName || !doc.fileUrl) {
        return NextResponse.json(
          { error: 'Document fileName and fileUrl are required' },
          { status: 400 }
        )
      }

      // Insert document into transfer_documents table
      await supabase.from('transfer_documents').insert({
        transfer_id: transferData.id,
        type: doc.type,
        name: doc.fileName,
        url: doc.fileUrl,
        uploaded_by_name: submittedByName,
        uploaded_by_email: submittedByEmail,
        notes: doc.notes || null,
      })
    }

    // Add tracking updates if provided
    if (trackingUpdates && trackingUpdates.length > 0) {
      for (const tracking of trackingUpdates) {
        await supabase.from('transfer_tracking_numbers').insert({
          transfer_id: transferData.id,
          carrier: tracking.carrier,
          tracking_number: tracking.trackingNumber,
          status: tracking.status,
        })
      }
    }

    // Update transfer with actual dates if provided
    const transferUpdates: Record<string, unknown> = {}
    if (actualPickupDate) {
      transferUpdates.actual_departure = actualPickupDate
    }
    if (actualDeliveryDate) {
      transferUpdates.actual_arrival = actualDeliveryDate
    }
    if (Object.keys(transferUpdates).length > 0) {
      await supabase
        .from('transfers')
        .update(transferUpdates)
        .eq('id', transferData.id)
    }

    // Update magic link status to submitted
    await supabase
      .from('magic_links')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        submission_data: {
          documentCount: documents.length,
          trackingUpdateCount: trackingUpdates?.length || 0,
          submittedByName,
          submittedByEmail,
          notes,
        },
      })
      .eq('id', magicLink.id)

    // Log submitted event
    await supabase.from('magic_link_events').insert({
      magic_link_id: magicLink.id,
      event_type: 'submitted',
      ip_address: anonymizedIp,
      user_agent: userAgent,
      metadata: {
        documentCount: documents.length,
        trackingUpdateCount: trackingUpdates?.length || 0,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Documents submitted successfully',
      documentCount: documents.length,
    })
  } catch (error) {
    console.error('Error submitting documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
