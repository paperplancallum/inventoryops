'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../client'
import type {
  ShippingQuote,
  ShippingQuoteLineItem,
  ShippingQuoteTransfer,
  ShippingQuoteStatus,
  CreateShippingQuoteInput,
  UpdateShippingQuoteInput,
  SubmitQuoteViaPortalInput,
  QuoteRequestResult,
  QuoteComparison,
  TransferQuoteStatus,
} from '@/sections/shipping-quotes/types'

// Database row types (snake_case)
interface DbShippingQuote {
  id: string
  shipping_agent_id: string
  magic_link_token: string | null
  token_expires_at: string | null
  status: ShippingQuoteStatus
  submitted_at: string | null
  valid_until: string | null
  currency: string
  total_amount: number | null
  notes: string | null
  pdf_path: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined data
  shipping_agent?: { id: string; name: string; email: string; phone: string; contact_name: string } | null
  shipping_quote_line_items?: DbShippingQuoteLineItem[]
  shipping_quote_transfers?: DbShippingQuoteTransfer[]
}

interface DbShippingQuoteLineItem {
  id: string
  shipping_quote_id: string
  description: string
  amount: number
  sort_order: number
  created_at: string
}

interface DbShippingQuoteTransfer {
  shipping_quote_id: string
  transfer_id: string
  created_at: string
  transfer?: {
    id: string
    transfer_number: string
    source_location?: { name: string } | null
    destination_location?: { name: string } | null
  } | null
}

// Transform functions
function transformQuote(db: DbShippingQuote): ShippingQuote {
  return {
    id: db.id,
    shippingAgentId: db.shipping_agent_id,
    shippingAgentName: db.shipping_agent?.name,
    shippingAgentEmail: db.shipping_agent?.email,
    magicLinkToken: db.magic_link_token,
    tokenExpiresAt: db.token_expires_at,
    status: db.status,
    submittedAt: db.submitted_at,
    validUntil: db.valid_until,
    currency: db.currency,
    totalAmount: db.total_amount,
    notes: db.notes,
    pdfPath: db.pdf_path,
    createdBy: db.created_by,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    lineItems: (db.shipping_quote_line_items || []).map(transformLineItem),
    transfers: (db.shipping_quote_transfers || []).map(transformQuoteTransfer),
  }
}

function transformLineItem(db: DbShippingQuoteLineItem): ShippingQuoteLineItem {
  return {
    id: db.id,
    shippingQuoteId: db.shipping_quote_id,
    description: db.description,
    amount: db.amount,
    sortOrder: db.sort_order,
    createdAt: db.created_at,
  }
}

function transformQuoteTransfer(db: DbShippingQuoteTransfer): ShippingQuoteTransfer {
  return {
    shippingQuoteId: db.shipping_quote_id,
    transferId: db.transfer_id,
    createdAt: db.created_at,
    transfer: db.transfer ? {
      id: db.transfer.id,
      transferNumber: db.transfer.transfer_number,
      sourceLocationName: db.transfer.source_location?.name,
      destinationLocationName: db.transfer.destination_location?.name,
    } : undefined,
  }
}

// Generate a secure random token
function generateMagicLinkToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export function useShippingQuotes() {
  const [quotes, setQuotes] = useState<ShippingQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  // Base select query with joins
  const baseSelectQuery = `
    *,
    shipping_agent:shipping_agents(id, name, email, phone, contact_name),
    shipping_quote_line_items(*),
    shipping_quote_transfers(
      *,
      transfer:transfers(
        id,
        transfer_number,
        source_location:locations!transfers_source_location_id_fkey(name),
        destination_location:locations!transfers_destination_location_id_fkey(name)
      )
    )
  `

  // Fetch all quotes
  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('shipping_quotes')
        .select(baseSelectQuery)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setQuotes((data || []).map(transformQuote))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch quotes'))
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Fetch quotes for a specific transfer
  const fetchQuotesForTransfer = useCallback(async (transferId: string): Promise<ShippingQuote[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('shipping_quotes')
        .select(baseSelectQuery)
        .eq('shipping_quote_transfers.transfer_id', transferId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      return (data || []).map(transformQuote)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch quotes for transfer'))
      return []
    }
  }, [supabase])

  // Fetch quotes for multiple transfers (grouped)
  const fetchQuotesForTransfers = useCallback(async (transferIds: string[]): Promise<ShippingQuote[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('shipping_quotes')
        .select(baseSelectQuery)
        .in('shipping_quote_transfers.transfer_id', transferIds)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      return (data || []).map(transformQuote)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch quotes for transfers'))
      return []
    }
  }, [supabase])

  // Fetch single quote by ID
  const fetchQuote = useCallback(async (id: string): Promise<ShippingQuote | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('shipping_quotes')
        .select(baseSelectQuery)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      return transformQuote(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch quote'))
      return null
    }
  }, [supabase])

  // Validate magic link token
  const validateMagicLink = useCallback(async (token: string): Promise<{
    valid: boolean
    quote: ShippingQuote | null
    error?: string
  }> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('shipping_quotes')
        .select(baseSelectQuery)
        .eq('magic_link_token', token)
        .single()

      if (fetchError) {
        return { valid: false, quote: null, error: 'Invalid token' }
      }

      // Check if token is expired
      if (data.token_expires_at && new Date(data.token_expires_at) < new Date()) {
        return { valid: false, quote: transformQuote(data), error: 'Token has expired' }
      }

      // Check if already submitted
      if (data.status !== 'pending') {
        return { valid: false, quote: transformQuote(data), error: 'Quote already submitted' }
      }

      return { valid: true, quote: transformQuote(data) }
    } catch (err) {
      return { valid: false, quote: null, error: 'Failed to validate token' }
    }
  }, [supabase])

  // Create quote request with magic link
  const createQuoteRequest = useCallback(async (
    agentIds: string[],
    transferIds: string[],
    expiryDays: number = 7
  ): Promise<QuoteRequestResult[]> => {
    const results: QuoteRequestResult[] = []

    try {
      for (const agentId of agentIds) {
        const token = generateMagicLinkToken()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + expiryDays)

        // Create quote record
        const { data: quote, error: quoteError } = await supabase
          .from('shipping_quotes')
          .insert({
            shipping_agent_id: agentId,
            magic_link_token: token,
            token_expires_at: expiresAt.toISOString(),
            status: 'pending',
            currency: 'USD',
          })
          .select('id, shipping_agent:shipping_agents(name)')
          .single()

        if (quoteError) throw quoteError

        // Link to transfers
        const transferLinks = transferIds.map(transferId => ({
          shipping_quote_id: quote.id,
          transfer_id: transferId,
        }))

        const { error: linkError } = await supabase
          .from('shipping_quote_transfers')
          .insert(transferLinks)

        if (linkError) throw linkError

        // Build magic link URL
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
        const magicLinkUrl = `${baseUrl}/quotes/${token}`

        results.push({
          quoteId: quote.id,
          shippingAgentId: agentId,
          shippingAgentName: (quote.shipping_agent as { name: string })?.name || '',
          magicLinkToken: token,
          magicLinkUrl,
          tokenExpiresAt: expiresAt.toISOString(),
        })
      }

      // Refresh quotes list
      await fetchQuotes()

      return results
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create quote requests'))
      return []
    }
  }, [supabase, fetchQuotes])

  // Create manual quote (user enters quote received via email)
  const createManualQuote = useCallback(async (input: CreateShippingQuoteInput): Promise<ShippingQuote | null> => {
    try {
      // Create quote record
      const { data: quote, error: quoteError } = await supabase
        .from('shipping_quotes')
        .insert({
          shipping_agent_id: input.shippingAgentId,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          total_amount: input.totalAmount,
          currency: input.currency || 'USD',
          valid_until: input.validUntil || null,
          notes: input.notes || null,
        })
        .select('id')
        .single()

      if (quoteError) throw quoteError

      // Link to transfers
      const transferLinks = input.transferIds.map(transferId => ({
        shipping_quote_id: quote.id,
        transfer_id: transferId,
      }))

      const { error: linkError } = await supabase
        .from('shipping_quote_transfers')
        .insert(transferLinks)

      if (linkError) throw linkError

      // Add line items if provided
      if (input.lineItems && input.lineItems.length > 0) {
        const lineItemsToInsert = input.lineItems.map((li, index) => ({
          shipping_quote_id: quote.id,
          description: li.description,
          amount: li.amount,
          sort_order: index,
        }))

        const { error: lineItemsError } = await supabase
          .from('shipping_quote_line_items')
          .insert(lineItemsToInsert)

        if (lineItemsError) throw lineItemsError
      }

      // Fetch and return the created quote
      const freshQuote = await fetchQuote(quote.id)
      if (freshQuote) {
        setQuotes(prev => [freshQuote, ...prev])
      }

      return freshQuote
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create manual quote'))
      return null
    }
  }, [supabase, fetchQuote])

  // Submit quote via portal (agent submission)
  const submitQuoteViaPortal = useCallback(async (
    token: string,
    input: SubmitQuoteViaPortalInput
  ): Promise<boolean> => {
    try {
      // Get quote ID from token
      const { data: quote, error: fetchError } = await supabase
        .from('shipping_quotes')
        .select('id')
        .eq('magic_link_token', token)
        .eq('status', 'pending')
        .single()

      if (fetchError) throw new Error('Invalid or expired token')

      // Update quote with submitted data
      const { error: updateError } = await supabase
        .from('shipping_quotes')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          total_amount: input.totalAmount,
          currency: input.currency,
          valid_until: input.validUntil || null,
          notes: input.notes || null,
          pdf_path: input.pdfPath || null,
        })
        .eq('id', quote.id)

      if (updateError) throw updateError

      // Add line items if provided
      if (input.lineItems && input.lineItems.length > 0) {
        const lineItemsToInsert = input.lineItems.map((li, index) => ({
          shipping_quote_id: quote.id,
          description: li.description,
          amount: li.amount,
          sort_order: index,
        }))

        const { error: lineItemsError } = await supabase
          .from('shipping_quote_line_items')
          .insert(lineItemsToInsert)

        if (lineItemsError) throw lineItemsError
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to submit quote'))
      return false
    }
  }, [supabase])

  // Update quote
  const updateQuote = useCallback(async (id: string, input: UpdateShippingQuoteInput): Promise<ShippingQuote | null> => {
    try {
      const updateData: Record<string, unknown> = {}

      if (input.totalAmount !== undefined) updateData.total_amount = input.totalAmount
      if (input.currency !== undefined) updateData.currency = input.currency
      if (input.validUntil !== undefined) updateData.valid_until = input.validUntil
      if (input.notes !== undefined) updateData.notes = input.notes
      if (input.pdfPath !== undefined) updateData.pdf_path = input.pdfPath

      const { error: updateError } = await supabase
        .from('shipping_quotes')
        .update(updateData)
        .eq('id', id)

      if (updateError) throw updateError

      // Update line items if provided
      if (input.lineItems) {
        // Delete existing line items
        await supabase
          .from('shipping_quote_line_items')
          .delete()
          .eq('shipping_quote_id', id)

        // Insert new line items
        if (input.lineItems.length > 0) {
          const lineItemsToInsert = input.lineItems.map((li, index) => ({
            shipping_quote_id: id,
            description: li.description,
            amount: li.amount,
            sort_order: index,
          }))

          const { error: lineItemsError } = await supabase
            .from('shipping_quote_line_items')
            .insert(lineItemsToInsert)

          if (lineItemsError) throw lineItemsError
        }
      }

      // Fetch and return updated quote
      const freshQuote = await fetchQuote(id)
      if (freshQuote) {
        setQuotes(prev => prev.map(q => q.id === id ? freshQuote : q))
      }

      return freshQuote
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update quote'))
      return null
    }
  }, [supabase, fetchQuote])

  // Select winning quote
  const selectWinningQuote = useCallback(async (quoteId: string): Promise<boolean> => {
    try {
      // Get the quote and its linked transfers
      const quote = await fetchQuote(quoteId)
      if (!quote) throw new Error('Quote not found')

      const transferIds = quote.transfers.map(t => t.transferId)

      // Get all quotes for these transfers
      const { data: relatedQuotes, error: fetchError } = await supabase
        .from('shipping_quote_transfers')
        .select('shipping_quote_id')
        .in('transfer_id', transferIds)

      if (fetchError) throw fetchError

      const relatedQuoteIds = [...new Set(relatedQuotes?.map(r => r.shipping_quote_id) || [])]

      // Reject all other quotes
      const { error: rejectError } = await supabase
        .from('shipping_quotes')
        .update({ status: 'rejected' })
        .in('id', relatedQuoteIds)
        .neq('id', quoteId)
        .in('status', ['pending', 'submitted'])

      if (rejectError) throw rejectError

      // Select the winning quote
      const { error: selectError } = await supabase
        .from('shipping_quotes')
        .update({ status: 'selected' })
        .eq('id', quoteId)

      if (selectError) throw selectError

      // Update quote_confirmed_at on all linked transfers
      const { error: transferError } = await supabase
        .from('transfers')
        .update({ quote_confirmed_at: new Date().toISOString() })
        .in('id', transferIds)

      if (transferError) throw transferError

      // Refresh quotes list
      await fetchQuotes()

      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to select winning quote'))
      return false
    }
  }, [supabase, fetchQuote, fetchQuotes])

  // Upload quote PDF
  const uploadQuotePdf = useCallback(async (quoteId: string, file: File): Promise<string | null> => {
    try {
      const fileName = `quotes/${quoteId}/${Date.now()}-${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('shipping-documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Update quote with PDF path
      const { error: updateError } = await supabase
        .from('shipping_quotes')
        .update({ pdf_path: fileName })
        .eq('id', quoteId)

      if (updateError) throw updateError

      // Refresh the quote
      const freshQuote = await fetchQuote(quoteId)
      if (freshQuote) {
        setQuotes(prev => prev.map(q => q.id === quoteId ? freshQuote : q))
      }

      return fileName
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to upload PDF'))
      return null
    }
  }, [supabase, fetchQuote])

  // Delete quote
  const deleteQuote = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('shipping_quotes')
        .delete()
        .eq('id', id)

      if (error) throw error

      setQuotes(prev => prev.filter(q => q.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete quote'))
      return false
    }
  }, [supabase])

  // Regenerate expired magic link
  const regenerateMagicLink = useCallback(async (quoteId: string, expiryDays: number = 7): Promise<string | null> => {
    try {
      const token = generateMagicLinkToken()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiryDays)

      const { error } = await supabase
        .from('shipping_quotes')
        .update({
          magic_link_token: token,
          token_expires_at: expiresAt.toISOString(),
          status: 'pending',
        })
        .eq('id', quoteId)

      if (error) throw error

      // Refresh quote
      const freshQuote = await fetchQuote(quoteId)
      if (freshQuote) {
        setQuotes(prev => prev.map(q => q.id === quoteId ? freshQuote : q))
      }

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      return `${baseUrl}/quotes/${token}`
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to regenerate magic link'))
      return null
    }
  }, [supabase, fetchQuote])

  // Get quote comparison for transfers
  const getQuoteComparison = useCallback(async (transferIds: string[]): Promise<QuoteComparison | null> => {
    try {
      const quotes = await fetchQuotesForTransfers(transferIds)

      const submittedQuotes = quotes.filter(q => q.status === 'submitted' || q.status === 'selected')
      const lowestQuote = submittedQuotes.reduce((lowest, q) => {
        if (!q.totalAmount) return lowest
        if (!lowest || (lowest.totalAmount && q.totalAmount < lowest.totalAmount)) return q
        return lowest
      }, null as ShippingQuote | null)

      const selectedQuote = quotes.find(q => q.status === 'selected')
      const amounts = submittedQuotes.map(q => q.totalAmount).filter((a): a is number => a !== null)
      const averageAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : null

      return {
        quotes,
        lowestQuoteId: lowestQuote?.id || null,
        selectedQuoteId: selectedQuote?.id || null,
        averageAmount,
        transfers: quotes[0]?.transfers.map(t => ({
          id: t.transferId,
          transferNumber: t.transfer?.transferNumber || '',
        })) || [],
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get quote comparison'))
      return null
    }
  }, [fetchQuotesForTransfers])

  // Get quote status for a transfer
  const getTransferQuoteStatus = useCallback(async (transferId: string): Promise<TransferQuoteStatus | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('transfer_quote_status')
        .select('*')
        .eq('transfer_id', transferId)
        .single()

      if (fetchError) throw fetchError

      return {
        transferId: data.transfer_id,
        transferNumber: data.transfer_number,
        quoteStatus: data.quote_status,
        quoteConfirmedAt: data.quote_confirmed_at,
        selectedQuoteId: data.selected_quote_id,
        selectedQuoteAmount: data.selected_quote_amount,
        totalQuotes: data.total_quotes,
        submittedQuotes: data.submitted_quotes,
      }
    } catch (err) {
      return null
    }
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    fetchQuotes()
  }, [fetchQuotes])

  return {
    quotes,
    loading,
    error,
    refetch: fetchQuotes,
    fetchQuote,
    fetchQuotesForTransfer,
    fetchQuotesForTransfers,
    validateMagicLink,
    createQuoteRequest,
    createManualQuote,
    submitQuoteViaPortal,
    updateQuote,
    selectWinningQuote,
    uploadQuotePdf,
    deleteQuote,
    regenerateMagicLink,
    getQuoteComparison,
    getTransferQuoteStatus,
  }
}
