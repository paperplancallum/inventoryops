import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

// From email - use env variable or Resend testing email
// For production, set RESEND_FROM_EMAIL to your verified domain email
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const FROM_NAME = process.env.RESEND_FROM_NAME || 'InventoryOps'

export interface SendPOToSupplierParams {
  supplierEmail: string
  supplierName: string
  poNumber: string
  poId: string
  magicLinkUrl: string
  lineItems: Array<{
    sku: string
    productName: string
    quantity: number
    unitCost: number
  }>
  totalAmount: number
  customMessage?: string
  expiresAt: string
}

export async function sendPOToSupplier(params: SendPOToSupplierParams) {
  const {
    supplierEmail,
    supplierName,
    poNumber,
    magicLinkUrl,
    lineItems,
    totalAmount,
    customMessage,
    expiresAt,
  } = params

  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  // Build line items HTML
  const lineItemsHtml = lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.sku}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.productName}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.unitCost.toFixed(2)}</td>
      </tr>
    `
    )
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Purchase Order Request</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">${poNumber}</p>
  </div>

  <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">

    <p style="margin: 0 0 20px 0;">Hi ${supplierName},</p>

    <p style="margin: 0 0 20px 0;">We've created a new purchase order and would like you to submit your proforma invoice.</p>

    ${customMessage ? `<div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 0 0 20px 0;"><p style="margin: 0; color: #4b5563;">${customMessage}</p></div>` : ''}

    <h3 style="margin: 24px 0 12px 0; font-size: 16px; color: #374151;">Order Summary</h3>

    <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px 0; font-size: 14px;">
      <thead>
        <tr style="background: #f9fafb;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">SKU</th>
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Product</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Qty</th>
          <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Unit Cost</th>
        </tr>
      </thead>
      <tbody>
        ${lineItemsHtml}
      </tbody>
      <tfoot>
        <tr style="background: #f9fafb;">
          <td colspan="3" style="padding: 12px; font-weight: 600;">Estimated Total</td>
          <td style="padding: 12px; text-align: right; font-weight: 600;">$${totalAmount.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${magicLinkUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Submit Proforma Invoice</a>
    </div>

    <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; text-align: center;">
      This link expires on ${expiryDate}
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

    <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
      If you have any questions, please reply to this email or contact us directly.
    </p>

  </div>

</body>
</html>
`

  const text = `
Purchase Order Request - ${poNumber}

Hi ${supplierName},

We've created a new purchase order and would like you to submit your proforma invoice.

${customMessage ? `Message: ${customMessage}\n` : ''}

Order Summary:
${lineItems.map((item) => `- ${item.sku}: ${item.productName} x ${item.quantity} @ $${item.unitCost.toFixed(2)}`).join('\n')}

Estimated Total: $${totalAmount.toFixed(2)}

Submit your proforma invoice here: ${magicLinkUrl}

This link expires on ${expiryDate}.

If you have any questions, please reply to this email or contact us directly.
`

  const { data, error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: supplierEmail,
    subject: `Purchase Order ${poNumber} - Submit Proforma Invoice`,
    html,
    text,
  })

  if (error) {
    console.error('Failed to send email:', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return data
}

export interface SendReminderParams {
  supplierEmail: string
  supplierName: string
  poNumber: string
  magicLinkUrl: string
  expiresAt: string
  daysRemaining: number
}

export async function sendPOReminder(params: SendReminderParams) {
  const { supplierEmail, supplierName, poNumber, magicLinkUrl, expiresAt, daysRemaining } = params

  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Reminder: Invoice Needed</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">${poNumber}</p>
  </div>

  <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">

    <p style="margin: 0 0 20px 0;">Hi ${supplierName},</p>

    <p style="margin: 0 0 20px 0;">This is a friendly reminder that we're still waiting for your proforma invoice for <strong>${poNumber}</strong>.</p>

    <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 16px; border-radius: 8px; margin: 0 0 24px 0;">
      <p style="margin: 0; color: #92400e; font-weight: 500;">
        ${daysRemaining <= 1 ? 'Your link expires tomorrow!' : `Your link expires in ${daysRemaining} days.`}
      </p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${magicLinkUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Submit Proforma Invoice</a>
    </div>

    <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; text-align: center;">
      This link expires on ${expiryDate}
    </p>

  </div>

</body>
</html>
`

  const { data, error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: supplierEmail,
    subject: `Reminder: Proforma Invoice Needed for ${poNumber}`,
    html,
  })

  if (error) {
    console.error('Failed to send reminder email:', error)
    throw new Error(`Failed to send reminder email: ${error.message}`)
  }

  return data
}

// Generic magic link email interfaces and functions
export interface SendMagicLinkEmailParams {
  recipientEmail: string
  recipientName: string
  purpose: string
  linkedEntityName: string
  magicLinkUrl: string
  expiresAt: string
  customMessage?: string
  senderName?: string
}

export async function sendMagicLinkEmail(params: SendMagicLinkEmailParams): Promise<{ success: boolean; error?: string }> {
  const {
    recipientEmail,
    recipientName,
    purpose,
    linkedEntityName,
    magicLinkUrl,
    expiresAt,
    customMessage,
    senderName,
  } = params

  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const purposeLabel = purpose === 'invoice-submission' ? 'Submit Invoice' : 'Access Documents'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">${purposeLabel}</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">${linkedEntityName}</p>
  </div>

  <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">

    <p style="margin: 0 0 20px 0;">Hi ${recipientName},</p>

    <p style="margin: 0 0 20px 0;">${senderName ? `${senderName} has` : 'You have been'} given access to ${linkedEntityName}.</p>

    ${customMessage ? `<div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 0 0 20px 0;"><p style="margin: 0; color: #4b5563;">${customMessage}</p></div>` : ''}

    <div style="text-align: center; margin: 32px 0;">
      <a href="${magicLinkUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">${purposeLabel}</a>
    </div>

    <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; text-align: center;">
      This link expires on ${expiryDate}
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

    <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
      If you have any questions, please reply to this email or contact us directly.
    </p>

  </div>

</body>
</html>
`

  try {
    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: recipientEmail,
      subject: `${purposeLabel}: ${linkedEntityName}`,
      html,
    })

    if (error) {
      console.error('Failed to send magic link email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Failed to send magic link email:', err)
    return { success: false, error: errorMessage }
  }
}

export interface SendReminderEmailParams {
  recipientEmail: string
  recipientName: string
  purpose: string
  linkedEntityName: string
  magicLinkUrl: string
  expiresAt: string
  daysUntilExpiry: number
}

export async function sendReminderEmail(params: SendReminderEmailParams): Promise<{ success: boolean; error?: string }> {
  const {
    recipientEmail,
    recipientName,
    purpose,
    linkedEntityName,
    magicLinkUrl,
    expiresAt,
    daysUntilExpiry,
  } = params

  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const purposeLabel = purpose === 'invoice-submission' ? 'Submit Invoice' : 'Access Documents'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Reminder: Action Needed</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">${linkedEntityName}</p>
  </div>

  <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">

    <p style="margin: 0 0 20px 0;">Hi ${recipientName},</p>

    <p style="margin: 0 0 20px 0;">This is a friendly reminder that we're still waiting for you to complete the action for <strong>${linkedEntityName}</strong>.</p>

    <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 16px; border-radius: 8px; margin: 0 0 24px 0;">
      <p style="margin: 0; color: #92400e; font-weight: 500;">
        ${daysUntilExpiry <= 1 ? 'Your link expires tomorrow!' : `Your link expires in ${daysUntilExpiry} days.`}
      </p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${magicLinkUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">${purposeLabel}</a>
    </div>

    <p style="margin: 24px 0 0 0; font-size: 14px; color: #6b7280; text-align: center;">
      This link expires on ${expiryDate}
    </p>

  </div>

</body>
</html>
`

  try {
    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: recipientEmail,
      subject: `Reminder: ${purposeLabel} - ${linkedEntityName}`,
      html,
    })

    if (error) {
      console.error('Failed to send reminder email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Failed to send reminder email:', err)
    return { success: false, error: errorMessage }
  }
}
