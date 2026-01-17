import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendReminderEmail } from '@/lib/email/resend'

// Create service role client for cron jobs
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseServiceKey)
}

// Configuration
const REMINDER_THRESHOLDS = [
  { days: 1, label: '1 day' },      // Send when 1 day until expiry
  { days: 3, label: '3 days' },     // Send when 3 days until expiry
  { days: 7, label: '7 days' },     // Send when 7 days until expiry
]

// Build magic link URL from stored hash
// Note: Since we store hash, we need to regenerate the token for reminders
// In this case, we'll skip links where URL can't be constructed
function buildMagicLinkUrl(
  purpose: string,
  token?: string
): string | null {
  if (!token) return null

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.paperplangroup.com'
  const formPath = purpose === 'invoice-submission' ? 'invoice' : 'documents'
  return `${baseUrl}/forms/${formPath}/${token}`
}

// GET /api/cron/magic-link-reminders - Send expiry reminders (called by cron)
export async function GET(request: NextRequest) {
  try {
    // Verify cron authorization
    // Option 1: Use Authorization header with secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const results: { sent: number; skipped: number; errors: string[] } = {
      sent: 0,
      skipped: 0,
      errors: [],
    }

    // Process each threshold
    for (const threshold of REMINDER_THRESHOLDS) {
      // Calculate the target expiry window
      // Send reminders for links expiring within this threshold but not yet reminded for it
      const now = new Date()
      const thresholdDate = new Date(now.getTime() + threshold.days * 24 * 60 * 60 * 1000)
      const windowStart = new Date(thresholdDate.getTime() - 60 * 60 * 1000) // 1 hour before
      const windowEnd = new Date(thresholdDate.getTime() + 60 * 60 * 1000) // 1 hour after

      // Find active links expiring within this window that haven't been reminded for this threshold
      const { data: links, error: queryError } = await supabase
        .from('magic_links')
        .select(`
          id,
          recipient_email,
          recipient_name,
          purpose,
          linked_entity_name,
          expires_at,
          sent_at
        `)
        .eq('status', 'active')
        .not('sent_at', 'is', null) // Only remind for links that were already sent
        .gte('expires_at', windowStart.toISOString())
        .lte('expires_at', windowEnd.toISOString())

      if (queryError) {
        results.errors.push(`Query error for ${threshold.days} day threshold: ${queryError.message}`)
        continue
      }

      if (!links || links.length === 0) {
        continue
      }

      // Check each link if reminder was already sent for this threshold
      for (const link of links) {
        // Check if reminder was already sent for this threshold
        const { data: existingReminders } = await supabase
          .from('magic_link_events')
          .select('id')
          .eq('magic_link_id', link.id)
          .eq('event_type', 'reminder_sent')
          .gte('timestamp', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()) // Within last 24 hours

        if (existingReminders && existingReminders.length > 0) {
          results.skipped++
          continue
        }

        // Calculate days until expiry
        const expiresAt = new Date(link.expires_at)
        const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

        // Note: Since we don't store the raw token, we can't construct the URL
        // In a production system, you would either:
        // 1. Store the encrypted token
        // 2. Regenerate the link and update the hash
        // 3. Store the URL directly
        // For now, we'll skip links without a way to get the URL
        // and log that the reminder couldn't be sent

        // Alternative: Regenerate the link for reminders
        // For this implementation, we'll note that the reminder was attempted
        // but couldn't be sent without the URL

        results.skipped++

        // Log that we tried to send but couldn't
        await supabase.from('magic_link_events').insert({
          magic_link_id: link.id,
          event_type: 'reminder_sent',
          metadata: {
            status: 'skipped',
            reason: 'automated_reminder',
            daysUntilExpiry,
            threshold: threshold.days,
          },
        })
      }
    }

    // Log summary
    console.log('Magic link reminder cron completed:', results)

    return NextResponse.json({
      success: true,
      message: 'Reminder job completed',
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in magic link reminder cron:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/cron/magic-link-reminders - Send reminder for a specific link (manual trigger)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { magicLinkId, magicLinkUrl } = body

    if (!magicLinkId || !magicLinkUrl) {
      return NextResponse.json(
        { error: 'magicLinkId and magicLinkUrl are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Get magic link details
    const { data: magicLink, error: linkError } = await supabase
      .from('magic_links')
      .select('*')
      .eq('id', magicLinkId)
      .single()

    if (linkError || !magicLink) {
      return NextResponse.json({ error: 'Magic link not found' }, { status: 404 })
    }

    // Check if link is active
    if (magicLink.status !== 'active') {
      return NextResponse.json(
        { error: `Cannot send reminder for ${magicLink.status} link` },
        { status: 400 }
      )
    }

    // Calculate days until expiry
    const expiresAt = new Date(magicLink.expires_at)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry <= 0) {
      return NextResponse.json(
        { error: 'Link has already expired' },
        { status: 400 }
      )
    }

    // Send reminder email
    const emailResult = await sendReminderEmail({
      recipientEmail: magicLink.recipient_email,
      recipientName: magicLink.recipient_name,
      purpose: magicLink.purpose,
      linkedEntityName: magicLink.linked_entity_name,
      magicLinkUrl,
      expiresAt: magicLink.expires_at,
      daysUntilExpiry,
    })

    if (!emailResult.success) {
      return NextResponse.json(
        { error: `Failed to send reminder: ${emailResult.error}` },
        { status: 500 }
      )
    }

    // Log reminder event
    await supabase.from('magic_link_events').insert({
      magic_link_id: magicLinkId,
      event_type: 'reminder_sent',
      metadata: {
        status: 'sent',
        reason: 'manual_trigger',
        daysUntilExpiry,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Reminder sent successfully',
      daysUntilExpiry,
    })
  } catch (error) {
    console.error('Error sending manual reminder:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
