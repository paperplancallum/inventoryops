'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '../client'

// =============================================================================
// Types
// =============================================================================

export type MagicLinkEntityType = 'purchase-order' | 'transfer'
export type MagicLinkPurpose = 'invoice-submission' | 'document-upload'
export type MagicLinkStatus = 'active' | 'submitted' | 'expired' | 'revoked'
export type MagicLinkEventType =
  | 'created'
  | 'sent'
  | 'reminder_sent'
  | 'viewed'
  | 'form_started'
  | 'validation_error'
  | 'submitted'
  | 'expired'
  | 'revoked'
  | 'regenerated'

export interface MagicLinkEvent {
  id: string
  magicLinkId: string
  eventType: MagicLinkEventType
  timestamp: string
  ipAddress: string | null
  userAgent: string | null
  metadata: Record<string, unknown>
  triggeredByUserId: string | null
  triggeredByUserName: string | null
}

export interface MagicLink {
  id: string
  tokenHash: string
  linkedEntityType: MagicLinkEntityType
  linkedEntityId: string
  linkedEntityName: string
  purpose: MagicLinkPurpose
  status: MagicLinkStatus
  createdAt: string
  expiresAt: string
  sentAt: string | null
  firstViewedAt: string | null
  submittedAt: string | null
  revokedAt: string | null
  recipientEmail: string
  recipientName: string
  recipientRole: string
  customMessage: string | null
  createdByUserId: string | null
  createdByUserName: string | null
  submissionData: Record<string, unknown> | null
  notes: string | null
  regeneratedFromId: string | null
  events?: MagicLinkEvent[]
}

export interface MagicLinksSummary {
  totalActive: number
  pendingSubmission: number
  submittedThisWeek: number
  expiringWithin24Hours: number
}

export interface MagicLinksFilters {
  searchQuery: string
  statuses: MagicLinkStatus[]
  entityTypes: MagicLinkEntityType[]
  purposes: MagicLinkPurpose[]
}

export interface CreateMagicLinkData {
  linkedEntityType: MagicLinkEntityType
  linkedEntityId: string
  linkedEntityName: string
  purpose: MagicLinkPurpose
  recipientEmail: string
  recipientName: string
  recipientRole?: string
  expirationDays: number
  customMessage?: string
  sendImmediately?: boolean
}

// =============================================================================
// Database Row Types
// =============================================================================

interface DbMagicLinkRow {
  id: string
  token_hash: string
  linked_entity_type: MagicLinkEntityType
  linked_entity_id: string
  linked_entity_name: string
  purpose: MagicLinkPurpose
  status: MagicLinkStatus
  created_at: string
  expires_at: string
  sent_at: string | null
  first_viewed_at: string | null
  submitted_at: string | null
  revoked_at: string | null
  recipient_email: string
  recipient_name: string
  recipient_role: string
  custom_message: string | null
  created_by_user_id: string | null
  created_by_user_name: string | null
  submission_data: Record<string, unknown> | null
  notes: string | null
  regenerated_from_id: string | null
}

interface DbMagicLinkEventRow {
  id: string
  magic_link_id: string
  event_type: MagicLinkEventType
  timestamp: string
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, unknown>
  triggered_by_user_id: string | null
  triggered_by_user_name: string | null
}

// =============================================================================
// Constants
// =============================================================================

export const STATUS_OPTIONS: { id: MagicLinkStatus; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'expired', label: 'Expired' },
  { id: 'revoked', label: 'Revoked' },
]

export const ENTITY_TYPE_OPTIONS: { id: MagicLinkEntityType; label: string }[] = [
  { id: 'purchase-order', label: 'Purchase Order' },
  { id: 'transfer', label: 'Transfer' },
]

export const PURPOSE_OPTIONS: { id: MagicLinkPurpose; label: string }[] = [
  { id: 'invoice-submission', label: 'Invoice Submission' },
  { id: 'document-upload', label: 'Document Upload' },
]

export const EVENT_TYPE_LABELS: Record<MagicLinkEventType, string> = {
  created: 'Link Created',
  sent: 'Email Sent',
  reminder_sent: 'Reminder Sent',
  viewed: 'Link Viewed',
  form_started: 'Form Started',
  validation_error: 'Validation Error',
  submitted: 'Form Submitted',
  expired: 'Link Expired',
  revoked: 'Link Revoked',
  regenerated: 'Link Regenerated',
}

// =============================================================================
// Transform Functions
// =============================================================================

function transformMagicLink(row: DbMagicLinkRow): MagicLink {
  return {
    id: row.id,
    tokenHash: row.token_hash,
    linkedEntityType: row.linked_entity_type,
    linkedEntityId: row.linked_entity_id,
    linkedEntityName: row.linked_entity_name,
    purpose: row.purpose,
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    sentAt: row.sent_at,
    firstViewedAt: row.first_viewed_at,
    submittedAt: row.submitted_at,
    revokedAt: row.revoked_at,
    recipientEmail: row.recipient_email,
    recipientName: row.recipient_name,
    recipientRole: row.recipient_role,
    customMessage: row.custom_message,
    createdByUserId: row.created_by_user_id,
    createdByUserName: row.created_by_user_name,
    submissionData: row.submission_data,
    notes: row.notes,
    regeneratedFromId: row.regenerated_from_id,
  }
}

function transformMagicLinkEvent(row: DbMagicLinkEventRow): MagicLinkEvent {
  return {
    id: row.id,
    magicLinkId: row.magic_link_id,
    eventType: row.event_type,
    timestamp: row.timestamp,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    metadata: row.metadata || {},
    triggeredByUserId: row.triggered_by_user_id,
    triggeredByUserName: row.triggered_by_user_name,
  }
}

// =============================================================================
// Token Generation Utilities
// =============================================================================

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

// =============================================================================
// Hook
// =============================================================================

const DEFAULT_FILTERS: MagicLinksFilters = {
  searchQuery: '',
  statuses: [],
  entityTypes: [],
  purposes: [],
}

export function useMagicLinks(initialFilters: Partial<MagicLinksFilters> = {}) {
  const [magicLinks, setMagicLinks] = useState<MagicLink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [filters, setFilters] = useState<MagicLinksFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  })

  const supabase = createClient()

  // Fetch magic links
  const fetchMagicLinks = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('magic_links')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.statuses.length > 0) {
        query = query.in('status', filters.statuses)
      }

      if (filters.entityTypes.length > 0) {
        query = query.in('linked_entity_type', filters.entityTypes)
      }

      if (filters.purposes.length > 0) {
        query = query.in('purpose', filters.purposes)
      }

      if (filters.searchQuery) {
        query = query.or(
          `recipient_email.ilike.%${filters.searchQuery}%,` +
          `recipient_name.ilike.%${filters.searchQuery}%,` +
          `linked_entity_name.ilike.%${filters.searchQuery}%`
        )
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        const isTableMissing = fetchError.code === '42P01' ||
          fetchError.message?.includes('relation') ||
          fetchError.message?.includes('does not exist')

        if (isTableMissing) {
          console.warn('Magic links table not found. Run migrations to create it.')
          setMagicLinks([])
          return
        }
        throw fetchError
      }

      setMagicLinks((data || []).map(transformMagicLink))
    } catch (err) {
      console.error('Magic links fetch error:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch magic links'))
    } finally {
      setLoading(false)
    }
  }, [supabase, filters])

  // Fetch single magic link with events
  const fetchMagicLink = useCallback(async (id: string): Promise<MagicLink | null> => {
    try {
      const { data: linkData, error: linkError } = await supabase
        .from('magic_links')
        .select('*')
        .eq('id', id)
        .single()

      if (linkError) throw linkError

      const { data: eventsData, error: eventsError } = await supabase
        .from('magic_link_events')
        .select('*')
        .eq('magic_link_id', id)
        .order('timestamp', { ascending: true })

      if (eventsError) throw eventsError

      const link = transformMagicLink(linkData)
      link.events = (eventsData || []).map(transformMagicLinkEvent)

      return link
    } catch (err) {
      console.error('Failed to fetch magic link:', err)
      return null
    }
  }, [supabase])

  // Fetch summary
  const fetchSummary = useCallback(async (): Promise<MagicLinksSummary> => {
    try {
      const { data, error } = await supabase
        .from('magic_links_summary')
        .select('*')
        .single()

      if (error) {
        // View may not exist yet
        console.warn('Magic links summary view not found')
        return {
          totalActive: 0,
          pendingSubmission: 0,
          submittedThisWeek: 0,
          expiringWithin24Hours: 0,
        }
      }

      return {
        totalActive: data.total_active || 0,
        pendingSubmission: data.pending_submission || 0,
        submittedThisWeek: data.submitted_this_week || 0,
        expiringWithin24Hours: data.expiring_within_24_hours || 0,
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err)
      return {
        totalActive: 0,
        pendingSubmission: 0,
        submittedThisWeek: 0,
        expiringWithin24Hours: 0,
      }
    }
  }, [supabase])

  // Create magic link
  const createMagicLink = useCallback(async (
    data: CreateMagicLinkData,
    userId?: string,
    userName?: string
  ): Promise<{ magicLink: MagicLink; rawToken: string } | null> => {
    try {
      const rawToken = generateSecureToken()
      const tokenHash = await hashToken(rawToken)

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + data.expirationDays)

      const { data: insertedData, error: insertError } = await supabase
        .from('magic_links')
        .insert({
          token_hash: tokenHash,
          linked_entity_type: data.linkedEntityType,
          linked_entity_id: data.linkedEntityId,
          linked_entity_name: data.linkedEntityName,
          purpose: data.purpose,
          recipient_email: data.recipientEmail,
          recipient_name: data.recipientName,
          recipient_role: data.recipientRole || 'External User',
          expires_at: expiresAt.toISOString(),
          custom_message: data.customMessage || null,
          created_by_user_id: userId || null,
          created_by_user_name: userName || null,
          sent_at: data.sendImmediately ? new Date().toISOString() : null,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Log created event
      await supabase.from('magic_link_events').insert({
        magic_link_id: insertedData.id,
        event_type: 'created',
        triggered_by_user_id: userId || null,
        triggered_by_user_name: userName || null,
      })

      // Log sent event if sendImmediately
      if (data.sendImmediately) {
        await supabase.from('magic_link_events').insert({
          magic_link_id: insertedData.id,
          event_type: 'sent',
          triggered_by_user_id: userId || null,
          triggered_by_user_name: userName || null,
        })
      }

      // Refresh list
      fetchMagicLinks()

      return {
        magicLink: transformMagicLink(insertedData),
        rawToken,
      }
    } catch (err) {
      console.error('Failed to create magic link:', err)
      setError(err instanceof Error ? err : new Error('Failed to create magic link'))
      return null
    }
  }, [supabase, fetchMagicLinks])

  // Revoke magic link
  const revokeMagicLink = useCallback(async (
    id: string,
    userId?: string,
    userName?: string
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('magic_links')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) throw updateError

      // Log revoked event
      await supabase.from('magic_link_events').insert({
        magic_link_id: id,
        event_type: 'revoked',
        triggered_by_user_id: userId || null,
        triggered_by_user_name: userName || null,
      })

      // Update local state
      setMagicLinks(prev =>
        prev.map(link =>
          link.id === id
            ? { ...link, status: 'revoked' as MagicLinkStatus, revokedAt: new Date().toISOString() }
            : link
        )
      )

      return true
    } catch (err) {
      console.error('Failed to revoke magic link:', err)
      return false
    }
  }, [supabase])

  // Regenerate magic link
  const regenerateMagicLink = useCallback(async (
    id: string,
    expirationDays: number = 30,
    userId?: string,
    userName?: string
  ): Promise<{ magicLink: MagicLink; rawToken: string } | null> => {
    try {
      // Get original link
      const original = await fetchMagicLink(id)
      if (!original) throw new Error('Original link not found')

      // Create new link
      const result = await createMagicLink(
        {
          linkedEntityType: original.linkedEntityType,
          linkedEntityId: original.linkedEntityId,
          linkedEntityName: original.linkedEntityName,
          purpose: original.purpose,
          recipientEmail: original.recipientEmail,
          recipientName: original.recipientName,
          recipientRole: original.recipientRole,
          expirationDays,
          customMessage: original.customMessage || undefined,
          sendImmediately: false,
        },
        userId,
        userName
      )

      if (!result) throw new Error('Failed to create new link')

      // Update new link to reference original
      await supabase
        .from('magic_links')
        .update({ regenerated_from_id: id })
        .eq('id', result.magicLink.id)

      // Log regenerated event on original
      await supabase.from('magic_link_events').insert({
        magic_link_id: id,
        event_type: 'regenerated',
        metadata: { newMagicLinkId: result.magicLink.id },
        triggered_by_user_id: userId || null,
        triggered_by_user_name: userName || null,
      })

      return result
    } catch (err) {
      console.error('Failed to regenerate magic link:', err)
      return null
    }
  }, [supabase, fetchMagicLink, createMagicLink])

  // Send reminder
  const sendReminder = useCallback(async (
    id: string,
    userId?: string,
    userName?: string
  ): Promise<boolean> => {
    try {
      // Log reminder_sent event
      await supabase.from('magic_link_events').insert({
        magic_link_id: id,
        event_type: 'reminder_sent',
        triggered_by_user_id: userId || null,
        triggered_by_user_name: userName || null,
      })

      return true
    } catch (err) {
      console.error('Failed to send reminder:', err)
      return false
    }
  }, [supabase])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<MagicLinksFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  // Computed summary from local data
  const summary = useMemo<MagicLinksSummary>(() => {
    const now = new Date()
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    return {
      totalActive: magicLinks.filter(l => l.status === 'active').length,
      pendingSubmission: magicLinks.filter(
        l => l.status === 'active' && l.sentAt && !l.submittedAt
      ).length,
      submittedThisWeek: magicLinks.filter(
        l => l.status === 'submitted' && l.submittedAt && new Date(l.submittedAt) >= weekAgo
      ).length,
      expiringWithin24Hours: magicLinks.filter(
        l => l.status === 'active' && new Date(l.expiresAt) <= in24Hours
      ).length,
    }
  }, [magicLinks])

  // Initial fetch
  useEffect(() => {
    fetchMagicLinks()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when filters change
  useEffect(() => {
    fetchMagicLinks()
  }, [filters]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    magicLinks,
    loading,
    error,
    filters,
    summary,
    statusOptions: STATUS_OPTIONS,
    entityTypeOptions: ENTITY_TYPE_OPTIONS,
    purposeOptions: PURPOSE_OPTIONS,
    eventTypeLabels: EVENT_TYPE_LABELS,
    fetchMagicLink,
    fetchSummary,
    createMagicLink,
    revokeMagicLink,
    regenerateMagicLink,
    sendReminder,
    updateFilters,
    resetFilters,
    refetch: fetchMagicLinks,
  }
}

// =============================================================================
// Export token utilities for API routes
// =============================================================================

export { generateSecureToken, hashToken }
