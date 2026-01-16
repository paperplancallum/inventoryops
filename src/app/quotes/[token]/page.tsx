'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ShippingQuote } from '@/sections/shipping-quotes/types'
import { QuoteSubmissionForm } from '@/sections/agent-portal/QuoteSubmissionForm'
import { PortalStates } from '@/sections/agent-portal/PortalStates'

type PortalState =
  | 'loading'
  | 'valid'
  | 'expired'
  | 'invalid'
  | 'already_submitted'

interface TransferDetail {
  id: string
  transferNumber: string
  sourceLocationName: string
  destinationLocationName: string
  totalUnits: number
  totalValue: number
  shippingMethod: string | null
}

export default function QuotePortalPage() {
  const params = useParams()
  const token = params.token as string

  const [state, setState] = useState<PortalState>('loading')
  const [quote, setQuote] = useState<ShippingQuote | null>(null)
  const [transfers, setTransfers] = useState<TransferDetail[]>([])
  const [agentName, setAgentName] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    async function validateAndFetchQuote() {
      try {
        // Fetch quote by token
        const { data: quoteData, error: quoteError } = await supabase
          .from('shipping_quotes')
          .select(`
            *,
            shipping_agent:shipping_agents(id, name, email),
            shipping_quote_transfers(
              transfer_id,
              transfer:transfers(
                id,
                transfer_number,
                shipping_method,
                source_location:locations!transfers_source_location_id_fkey(name),
                destination_location:locations!transfers_destination_location_id_fkey(name),
                transfer_line_items(quantity, total_cost)
              )
            ),
            shipping_quote_line_items(*)
          `)
          .eq('magic_link_token', token)
          .single()

        if (quoteError || !quoteData) {
          setState('invalid')
          setError('This quote link is not valid.')
          return
        }

        // Check if token is expired
        if (quoteData.token_expires_at && new Date(quoteData.token_expires_at) < new Date()) {
          setState('expired')
          setError('This quote link has expired. Please contact the requester for a new link.')
          setQuote(transformQuote(quoteData))
          return
        }

        // Check if already submitted
        if (quoteData.status !== 'pending') {
          setState('already_submitted')
          setQuote(transformQuote(quoteData))
          setAgentName(quoteData.shipping_agent?.name || '')
          return
        }

        // Valid token - set up form
        setState('valid')
        setQuote(transformQuote(quoteData))
        setAgentName(quoteData.shipping_agent?.name || '')

        // Extract transfer details
        const transferDetails: TransferDetail[] = (quoteData.shipping_quote_transfers || []).map((sqt: {
          transfer_id: string
          transfer: {
            id: string
            transfer_number: string
            shipping_method: string | null
            source_location: { name: string } | null
            destination_location: { name: string } | null
            transfer_line_items: Array<{ quantity: number; total_cost: number }>
          } | null
        }) => {
          const t = sqt.transfer
          if (!t) return null

          const totalUnits = (t.transfer_line_items || []).reduce(
            (sum: number, li: { quantity: number }) => sum + li.quantity,
            0
          )
          const totalValue = (t.transfer_line_items || []).reduce(
            (sum: number, li: { total_cost: number }) => sum + li.total_cost,
            0
          )

          return {
            id: t.id,
            transferNumber: t.transfer_number,
            sourceLocationName: t.source_location?.name || 'Unknown',
            destinationLocationName: t.destination_location?.name || 'Unknown',
            totalUnits,
            totalValue,
            shippingMethod: t.shipping_method,
          }
        }).filter(Boolean) as TransferDetail[]

        setTransfers(transferDetails)
      } catch (err) {
        console.error('Error validating quote:', err)
        setState('invalid')
        setError('An error occurred while loading the quote form.')
      }
    }

    validateAndFetchQuote()
  }, [token, supabase])

  const handleSubmitSuccess = () => {
    setState('already_submitted')
  }

  // Loading state
  if (state === 'loading') {
    return <PortalStates state="loading" />
  }

  // Invalid token
  if (state === 'invalid') {
    return <PortalStates state="invalid" message={error || undefined} />
  }

  // Expired token
  if (state === 'expired') {
    return (
      <PortalStates
        state="expired"
        message={error || undefined}
        agentName={agentName}
      />
    )
  }

  // Already submitted - show read-only view
  if (state === 'already_submitted' && quote) {
    return (
      <PortalStates
        state="already_submitted"
        quote={quote}
        agentName={agentName}
      />
    )
  }

  // Valid - show submission form
  if (state === 'valid' && quote) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Submit Shipping Quote
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Welcome, {agentName}. Please provide your quote for the shipment details below.
          </p>
        </div>

        {/* Transfer Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
            Shipment Details
          </h2>
          <div className="space-y-3">
            {transfers.map((transfer) => (
              <div
                key={transfer.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {transfer.transferNumber}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {transfer.sourceLocationName} → {transfer.destinationLocationName}
                  </p>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 sm:mt-0 sm:text-right">
                  <p>{transfer.totalUnits.toLocaleString()} units</p>
                  {transfer.shippingMethod && (
                    <p className="capitalize">{transfer.shippingMethod.replace('-', ' ')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quote Form */}
        <QuoteSubmissionForm
          token={token}
          quoteId={quote.id}
          onSuccess={handleSubmitSuccess}
        />
      </div>
    )
  }

  return null
}

// Helper to transform DB quote to our type
function transformQuote(db: {
  id: string
  shipping_agent_id: string
  magic_link_token: string | null
  token_expires_at: string | null
  status: string
  submitted_at: string | null
  valid_until: string | null
  currency: string
  total_amount: number | null
  notes: string | null
  pdf_path: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  shipping_quote_line_items?: Array<{
    id: string
    shipping_quote_id: string
    description: string
    amount: number
    sort_order: number
    created_at: string
  }>
}): ShippingQuote {
  return {
    id: db.id,
    shippingAgentId: db.shipping_agent_id,
    magicLinkToken: db.magic_link_token,
    tokenExpiresAt: db.token_expires_at,
    status: db.status as ShippingQuote['status'],
    submittedAt: db.submitted_at,
    validUntil: db.valid_until,
    currency: db.currency,
    totalAmount: db.total_amount,
    notes: db.notes,
    pdfPath: db.pdf_path,
    createdBy: db.created_by,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    lineItems: (db.shipping_quote_line_items || []).map((li) => ({
      id: li.id,
      shippingQuoteId: li.shipping_quote_id,
      description: li.description,
      amount: li.amount,
      sortOrder: li.sort_order,
      createdAt: li.created_at,
    })),
    transfers: [],
  }
}
