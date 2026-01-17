import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/inspections/agent/[token] - Get inspection details via magic link
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = await createClient()

    // Find inspection by magic link token
    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .select(`
        id,
        purchase_order_id,
        purchase_order_number,
        supplier_name,
        scheduled_date,
        confirmed_date,
        agent_id,
        agent_name,
        status,
        notes,
        magic_link_expires_at,
        inspection_line_items (
          id,
          product_name,
          product_sku,
          ordered_quantity,
          sample_size
        )
      `)
      .eq('magic_link_token', token)
      .single()

    if (inspectionError || !inspection) {
      return NextResponse.json(
        { error: 'Inspection not found or invalid token' },
        { status: 404 }
      )
    }

    // Check if token has expired
    if (inspection.magic_link_expires_at) {
      const expiresAt = new Date(inspection.magic_link_expires_at)
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Magic link has expired. Please request a new link.' },
          { status: 410 }
        )
      }
    }

    // Check if inspection is in a valid state for agent access
    const validStatuses = ['scheduled', 'pending-confirmation', 'confirmed', 'paid', 'in-progress']
    if (!validStatuses.includes(inspection.status)) {
      return NextResponse.json(
        { error: 'This inspection is no longer available for agent access.' },
        { status: 403 }
      )
    }

    // Get agent details if assigned
    let agent = null
    if (inspection.agent_id) {
      const { data: agentData } = await supabase
        .from('inspection_agents')
        .select('id, name, email, company')
        .eq('id', inspection.agent_id)
        .single()
      agent = agentData
    }

    return NextResponse.json({
      inspection: {
        id: inspection.id,
        purchaseOrderNumber: inspection.purchase_order_number,
        supplierName: inspection.supplier_name,
        scheduledDate: inspection.scheduled_date,
        confirmedDate: inspection.confirmed_date,
        status: inspection.status,
        notes: inspection.notes,
        lineItems: inspection.inspection_line_items?.map((li: {
          id: string
          product_name: string
          product_sku: string
          ordered_quantity: number
          sample_size: number
        }) => ({
          id: li.id,
          productName: li.product_name,
          productSku: li.product_sku,
          orderedQuantity: li.ordered_quantity,
          sampleSize: li.sample_size,
        })) || [],
      },
      agent,
    })
  } catch (error) {
    console.error('Error fetching inspection:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/inspections/agent/[token] - Agent confirms inspection
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { confirmedDate, invoiceAmount, action } = body

    const supabase = await createClient()

    // Find inspection by magic link token
    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .select('id, status, magic_link_expires_at')
      .eq('magic_link_token', token)
      .single()

    if (inspectionError || !inspection) {
      return NextResponse.json(
        { error: 'Inspection not found or invalid token' },
        { status: 404 }
      )
    }

    // Check if token has expired
    if (inspection.magic_link_expires_at) {
      const expiresAt = new Date(inspection.magic_link_expires_at)
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Magic link has expired. Please request a new link.' },
          { status: 410 }
        )
      }
    }

    // Handle different actions
    if (action === 'confirm') {
      // Validate required fields for confirmation
      if (!confirmedDate || invoiceAmount === undefined) {
        return NextResponse.json(
          { error: 'confirmedDate and invoiceAmount are required for confirmation' },
          { status: 400 }
        )
      }

      // Check if inspection is in correct status
      if (inspection.status !== 'pending-confirmation') {
        return NextResponse.json(
          { error: `Cannot confirm inspection in '${inspection.status}' status` },
          { status: 400 }
        )
      }

      // Update inspection with confirmed details
      const { error: updateError } = await supabase
        .from('inspections')
        .update({
          confirmed_date: confirmedDate,
          invoice_amount: invoiceAmount,
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', inspection.id)

      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        message: 'Inspection confirmed successfully',
      })
    }

    if (action === 'submit-report') {
      // Check if inspection is in correct status (paid or in-progress)
      if (!['paid', 'in-progress'].includes(inspection.status)) {
        return NextResponse.json(
          { error: `Cannot submit report for inspection in '${inspection.status}' status` },
          { status: 400 }
        )
      }

      // Update inspection status to report-submitted
      const { error: updateError } = await supabase
        .from('inspections')
        .update({
          status: 'report-submitted',
          completed_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', inspection.id)

      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        message: 'Inspection report submitted successfully',
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported: confirm, submit-report' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing inspection action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/inspections/agent/[token] - Agent submits inspection results
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { lineItemResults, notes } = body

    const supabase = await createClient()

    // Find inspection by magic link token
    const { data: inspection, error: inspectionError } = await supabase
      .from('inspections')
      .select('id, status, magic_link_expires_at')
      .eq('magic_link_token', token)
      .single()

    if (inspectionError || !inspection) {
      return NextResponse.json(
        { error: 'Inspection not found or invalid token' },
        { status: 404 }
      )
    }

    // Check if token has expired
    if (inspection.magic_link_expires_at) {
      const expiresAt = new Date(inspection.magic_link_expires_at)
      if (expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Magic link has expired. Please request a new link.' },
          { status: 410 }
        )
      }
    }

    // Check if inspection is in correct status
    if (!['paid', 'in-progress'].includes(inspection.status)) {
      return NextResponse.json(
        { error: `Cannot submit results for inspection in '${inspection.status}' status` },
        { status: 400 }
      )
    }

    // Update line item results
    if (lineItemResults && Array.isArray(lineItemResults)) {
      for (const result of lineItemResults) {
        const { lineItemId, sampleSize, defects, measurements, packaging, result: itemResult } = result

        // Update line item
        const updateData: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        }
        if (sampleSize !== undefined) updateData.sample_size = sampleSize
        if (itemResult !== undefined) updateData.result = itemResult

        await supabase
          .from('inspection_line_items')
          .update(updateData)
          .eq('id', lineItemId)
          .eq('inspection_id', inspection.id)

        // Insert defects
        if (defects && Array.isArray(defects)) {
          for (const defect of defects) {
            await supabase.from('inspection_defects').insert({
              line_item_id: lineItemId,
              type: defect.type,
              description: defect.description,
              quantity: defect.quantity || 1,
              severity: defect.severity,
            })
          }
        }

        // Insert measurements
        if (measurements && Array.isArray(measurements)) {
          for (const measurement of measurements) {
            await supabase.from('inspection_measurements').insert({
              line_item_id: lineItemId,
              name: measurement.name,
              spec_value: measurement.specValue,
              actual_value: measurement.actualValue,
              passed: measurement.passed,
            })
          }
        }

        // Update packaging check
        if (packaging) {
          await supabase
            .from('inspection_line_items')
            .update({
              packaging_check: packaging,
            })
            .eq('id', lineItemId)
        }
      }
    }

    // Update inspection notes if provided
    if (notes) {
      await supabase
        .from('inspections')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', inspection.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Inspection results saved',
    })
  } catch (error) {
    console.error('Error saving inspection results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
