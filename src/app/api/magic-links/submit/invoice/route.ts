import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create anonymous Supabase client for public access
function createAnonClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Create service role client for database operations (bypasses RLS)
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

interface LineItemSubmission {
  // Support both field name conventions
  lineItemId?: string
  purchaseOrderLineItemId?: string
  submittedUnitCost?: number
  actualUnitCost?: number
  notes?: string | null
}

interface AdditionalCost {
  type?: 'handling' | 'rush' | 'tooling' | 'shipping' | 'inspection' | 'packaging' | 'other'
  category?: string
  description?: string
  amount: number
  notes?: string | null
}

// POST /api/magic-links/submit/invoice - Submit supplier invoice (public)
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

    // Handle both FormData (with files) and JSON requests
    const contentType = request.headers.get('content-type') || ''
    let body: {
      token: string
      lineItems: LineItemSubmission[]
      additionalCosts?: AdditionalCost[]
      supplierNotes?: string
      notes?: string
      submittedByName?: string
      submittedByEmail?: string
      invoiceNumber?: string
      invoiceDate?: string
      confirmedByName?: string
    }
    let uploadedFiles: File[] = []

    if (contentType.includes('multipart/form-data')) {
      // Parse FormData
      const formData = await request.formData()
      const dataString = formData.get('data') as string
      if (!dataString) {
        return NextResponse.json(
          { error: 'Missing form data' },
          { status: 400 }
        )
      }
      body = JSON.parse(dataString)

      // Extract files
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('file-') && value instanceof File) {
          uploadedFiles.push(value)
        }
      }
    } else {
      // Parse JSON
      body = await request.json()
    }

    const {
      token,
      lineItems,
      additionalCosts,
      supplierNotes,
      notes, // Alternative field name for supplierNotes
      submittedByName,
      submittedByEmail,
      invoiceNumber,
      invoiceDate,
      confirmedByName,
    } = body

    // Validate required fields (name/email will come from magic link if not provided)
    if (!token || !lineItems) {
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
    if (magicLink.purpose !== 'invoice-submission') {
      return NextResponse.json(
        { error: 'Invalid link type for invoice submission' },
        { status: 400 }
      )
    }

    // Get PO data for creating submission using service client to bypass RLS
    const serviceClient = createServiceClient()
    const { data: poData, error: poError } = await serviceClient
      .from('purchase_orders')
      .select(`
        id,
        po_number,
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
          unit_cost
        )
      `)
      .eq('id', magicLink.linked_entity_id)
      .single()

    if (poError || !poData) {
      console.error('Error fetching PO for submission:', poError)
      return NextResponse.json(
        { error: 'Purchase order not found' },
        { status: 404 }
      )
    }

    // Get supplier name from the joined suppliers table
    const supplierArray = poData.suppliers as { name: string }[] | null
    const supplierData = supplierArray?.[0]
    const supplierName = supplierData?.name || 'Unknown Supplier'

    // Log form_started event
    const userAgent = request.headers.get('user-agent') || null
    const anonymizedIp = anonymizeIp(clientIp)

    await serviceClient.from('magic_link_events').insert({
      magic_link_id: magicLink.id,
      event_type: 'form_started',
      ip_address: anonymizedIp,
      user_agent: userAgent,
    })

    // Normalize line items to handle both field name conventions
    const normalizedLineItems = lineItems.map(item => ({
      lineItemId: item.lineItemId || item.purchaseOrderLineItemId || '',
      unitCost: item.submittedUnitCost ?? item.actualUnitCost ?? 0,
      notes: item.notes || null,
    }))

    // Validate line items exist in PO
    const poLineItemIds = new Set(poData.po_line_items?.map((li: { id: string }) => li.id) || [])
    for (const item of normalizedLineItems) {
      if (!poLineItemIds.has(item.lineItemId)) {
        // Log validation error
        await serviceClient.from('magic_link_events').insert({
          magic_link_id: magicLink.id,
          event_type: 'validation_error',
          ip_address: anonymizedIp,
          user_agent: userAgent,
          metadata: { error: `Invalid line item ID: ${item.lineItemId}` },
        })

        return NextResponse.json(
          { error: `Invalid line item ID: ${item.lineItemId}` },
          { status: 400 }
        )
      }

      if (typeof item.unitCost !== 'number' || item.unitCost < 0) {
        return NextResponse.json(
          { error: 'Invalid unit cost value' },
          { status: 400 }
        )
      }
    }

    // Use confirmed name as primary, then magic link recipient info as fallback
    const finalSubmittedByName = confirmedByName || submittedByName || magicLink.recipient_name || 'Supplier'
    const finalSubmittedByEmail = submittedByEmail || magicLink.recipient_email || ''
    const finalNotes = supplierNotes || notes || null

    // Create supplier invoice submission
    const { data: submission, error: submissionError } = await serviceClient
      .from('supplier_invoice_submissions')
      .insert({
        magic_link_id: magicLink.id,
        purchase_order_id: poData.id,
        po_number: poData.po_number,
        supplier_id: poData.supplier_id,
        supplier_name: supplierName,
        submitted_by_name: finalSubmittedByName,
        submitted_by_email: finalSubmittedByEmail,
        supplier_notes: finalNotes,
        // Note: supplier_invoice_number and supplier_invoice_date could be stored in supplier_notes
        // if we need them, or add columns via migration
      })
      .select()
      .single()

    if (submissionError) {
      console.error('Failed to create submission:', submissionError)
      return NextResponse.json(
        { error: 'Failed to create submission' },
        { status: 500 }
      )
    }

    // Create line items
    const poLineItemMap = new Map(
      (poData.po_line_items || []).map((li: {
        id: string
        product_id: string
        product_name: string
        sku: string
        quantity: number
        unit_cost: number
      }) => [li.id, li])
    )

    let sortOrder = 0
    for (const item of normalizedLineItems) {
      const poLineItem = poLineItemMap.get(item.lineItemId) as {
        id: string
        product_id: string
        product_name: string
        sku: string
        quantity: number
        unit_cost: number
      }
      if (!poLineItem) continue

      sortOrder++
      await serviceClient.from('supplier_invoice_submission_line_items').insert({
        submission_id: submission.id,
        po_line_item_id: item.lineItemId,
        product_id: poLineItem.product_id,
        product_name: poLineItem.product_name,
        sku: poLineItem.sku,
        quantity: poLineItem.quantity,
        expected_unit_cost: poLineItem.unit_cost,
        submitted_unit_cost: item.unitCost,
        notes: item.notes || null,
        sort_order: sortOrder,
      })
    }

    // Create additional costs
    if (additionalCosts && additionalCosts.length > 0) {
      let costSortOrder = 0
      for (const cost of additionalCosts) {
        costSortOrder++
        await serviceClient.from('supplier_invoice_submission_costs').insert({
          submission_id: submission.id,
          cost_type: cost.type || cost.category || 'other',
          description: cost.description || cost.notes || '',
          amount: cost.amount,
          sort_order: costSortOrder,
        })
      }
    }

    // Upload files to storage and create attachment records
    if (uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
        // Generate unique file path
        const timestamp = Date.now()
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filePath = `${submission.id}/${timestamp}-${sanitizedName}`

        // Upload to storage
        const { error: uploadError } = await serviceClient.storage
          .from('supplier-invoice-attachments')
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false,
          })

        if (uploadError) {
          console.error('Error uploading file:', uploadError)
          // Continue with other files even if one fails
          continue
        }

        // Create attachment record
        await serviceClient.from('supplier_invoice_submission_attachments').insert({
          submission_id: submission.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
        })
      }
    }

    // Update magic link status to submitted
    await serviceClient
      .from('magic_links')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        submission_data: {
          submissionId: submission.id,
          lineItemCount: normalizedLineItems.length,
          additionalCostCount: additionalCosts?.length || 0,
          attachmentCount: uploadedFiles.length,
          submittedByName: finalSubmittedByName,
          submittedByEmail: finalSubmittedByEmail,
          confirmedByName: confirmedByName || null,
        },
      })
      .eq('id', magicLink.id)

    // Log submitted event
    await serviceClient.from('magic_link_events').insert({
      magic_link_id: magicLink.id,
      event_type: 'submitted',
      ip_address: anonymizedIp,
      user_agent: userAgent,
      metadata: {
        submissionId: submission.id,
        lineItemCount: normalizedLineItems.length,
      },
    })

    // Update PO status to invoice_received
    await serviceClient
      .from('purchase_orders')
      .update({
        status: 'invoice_received',
        invoice_received_at: new Date().toISOString(),
        supplier_invoice_status: 'pending-review',
      })
      .eq('id', poData.id)

    // Add status history entry
    await serviceClient.from('po_status_history').insert({
      purchase_order_id: poData.id,
      status: 'invoice_received',
      note: `Invoice submitted by ${finalSubmittedByName}`,
    })

    return NextResponse.json({
      success: true,
      message: 'Invoice submitted successfully',
      submissionId: submission.id,
    })
  } catch (error) {
    console.error('Error submitting invoice:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
