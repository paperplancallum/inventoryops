// Send PO to Supplier Edge Function
// This function sends a purchase order to a supplier via email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.90.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendPORequest {
  poId: string
  pdfBase64?: string  // Optional pre-generated PDF
  customMessage?: string
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse request body
    const { poId, pdfBase64, customMessage }: SendPORequest = await req.json()

    if (!poId) {
      return new Response(
        JSON.stringify({ error: 'Missing poId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch PO with supplier info
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(id, name, contact_name, contact_email),
        po_line_items(*)
      `)
      .eq('id', poId)
      .single()

    if (poError || !po) {
      return new Response(
        JSON.stringify({ error: 'Purchase order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check supplier email
    const supplierEmail = po.supplier?.contact_email
    if (!supplierEmail) {
      return new Response(
        JSON.stringify({ error: 'Supplier has no contact email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get email configuration from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@yourcompany.com'
    const companyName = Deno.env.get('COMPANY_NAME') || 'Your Company'

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare email content
    const subject = `Purchase Order ${po.po_number} from ${companyName}`
    const defaultMessage = `
      <p>Dear ${po.supplier.contact_name || po.supplier.name},</p>

      <p>Please find attached Purchase Order <strong>${po.po_number}</strong>.</p>

      <h3>Order Summary:</h3>
      <ul>
        <li><strong>Order Date:</strong> ${new Date(po.order_date).toLocaleDateString()}</li>
        <li><strong>Expected Date:</strong> ${po.expected_date ? new Date(po.expected_date).toLocaleDateString() : 'TBD'}</li>
        <li><strong>Total Items:</strong> ${po.po_line_items?.length || 0}</li>
        <li><strong>Total Value:</strong> $${po.total.toLocaleString()}</li>
      </ul>

      ${po.payment_terms ? `<p><strong>Payment Terms:</strong> ${po.payment_terms}</p>` : ''}
      ${po.notes ? `<p><strong>Notes:</strong> ${po.notes}</p>` : ''}

      <p>Please confirm receipt of this order and let us know if you have any questions.</p>

      <p>Best regards,<br/>${companyName}</p>
    `

    const htmlContent = customMessage || defaultMessage

    // Build email payload
    // deno-lint-ignore no-explicit-any
    const emailPayload: any = {
      from: fromEmail,
      to: [supplierEmail],
      subject,
      html: htmlContent,
    }

    // Add PDF attachment if provided
    if (pdfBase64) {
      emailPayload.attachments = [
        {
          filename: `${po.po_number}.pdf`,
          content: pdfBase64,
        },
      ]
    }

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('Resend API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailResult = await emailResponse.json()

    // Update PO status to 'sent'
    const { error: updateError } = await supabase
      .from('purchase_orders')
      .update({ status: 'sent' })
      .eq('id', poId)

    if (updateError) {
      console.error('Failed to update PO status:', updateError)
    }

    // Create outbound message record
    const { error: messageError } = await supabase
      .from('po_messages')
      .insert({
        purchase_order_id: poId,
        direction: 'outbound',
        sender_name: companyName,
        sender_email: fromEmail,
        content: `Purchase Order sent to ${supplierEmail}`,
      })

    if (messageError) {
      console.error('Failed to create message record:', messageError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailId: emailResult.id,
        sentTo: supplierEmail,
        poNumber: po.po_number,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in send-po-to-supplier:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
