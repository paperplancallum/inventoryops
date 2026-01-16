// =============================================================================
// Shipping Quote Types
// =============================================================================

export type ShippingQuoteStatus =
  | 'pending'    // Quote requested, awaiting agent response
  | 'submitted'  // Agent has submitted their quote
  | 'selected'   // This quote was selected as the winner
  | 'rejected'   // Quote was not selected (another was chosen)

// =============================================================================
// Shipping Quote Line Item
// =============================================================================

export interface ShippingQuoteLineItem {
  id: string
  shippingQuoteId: string
  description: string
  amount: number
  sortOrder: number
  createdAt: string
}

// =============================================================================
// Shipping Quote Transfer (Junction)
// =============================================================================

export interface ShippingQuoteTransfer {
  shippingQuoteId: string
  transferId: string
  createdAt: string
  // Joined data
  transfer?: {
    id: string
    transferNumber: string
    sourceLocationName?: string
    destinationLocationName?: string
  }
}

// =============================================================================
// Shipping Quote
// =============================================================================

export interface ShippingQuote {
  id: string
  shippingAgentId: string
  shippingAgentName?: string
  shippingAgentEmail?: string
  magicLinkToken: string | null
  tokenExpiresAt: string | null
  status: ShippingQuoteStatus
  submittedAt: string | null
  validUntil: string | null
  currency: string
  totalAmount: number | null
  notes: string | null
  pdfPath: string | null
  pdfUrl?: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
  // Related data
  lineItems: ShippingQuoteLineItem[]
  transfers: ShippingQuoteTransfer[]
}

// =============================================================================
// Shipping Quote with Details (Full View)
// =============================================================================

export interface ShippingQuoteWithDetails extends ShippingQuote {
  shippingAgent: {
    id: string
    name: string
    email: string
    phone: string
    contactName: string
  }
  transferDetails: Array<{
    id: string
    transferNumber: string
    status: string
    sourceLocationName: string
    destinationLocationName: string
    totalUnits: number
    totalValue: number
  }>
}

// =============================================================================
// Form Types
// =============================================================================

export interface CreateShippingQuoteInput {
  shippingAgentId: string
  transferIds: string[]
  // Optional if creating with magic link (agent will fill these)
  totalAmount?: number
  currency?: string
  validUntil?: string
  notes?: string
  lineItems?: Array<{
    description: string
    amount: number
  }>
}

export interface UpdateShippingQuoteInput {
  totalAmount?: number
  currency?: string
  validUntil?: string
  notes?: string
  pdfPath?: string
  lineItems?: Array<{
    id?: string // If updating existing
    description: string
    amount: number
  }>
}

export interface SubmitQuoteViaPortalInput {
  totalAmount: number
  currency: string
  validUntil?: string
  notes?: string
  pdfPath?: string
  lineItems?: Array<{
    description: string
    amount: number
  }>
}

// =============================================================================
// Quote Request (for magic link generation)
// =============================================================================

export interface QuoteRequestResult {
  quoteId: string
  shippingAgentId: string
  shippingAgentName: string
  magicLinkToken: string
  magicLinkUrl: string
  tokenExpiresAt: string
}

// =============================================================================
// Quote Comparison
// =============================================================================

export interface QuoteComparison {
  quotes: ShippingQuote[]
  lowestQuoteId: string | null
  selectedQuoteId: string | null
  averageAmount: number | null
  transfers: Array<{
    id: string
    transferNumber: string
  }>
}

// =============================================================================
// Transfer Quote Status (for transfer list/detail)
// =============================================================================

export type TransferQuoteStatusType =
  | 'no_quotes'
  | 'awaiting_quotes'
  | 'quotes_received'
  | 'confirmed'

export interface TransferQuoteStatus {
  transferId: string
  transferNumber: string
  quoteStatus: TransferQuoteStatusType
  quoteConfirmedAt: string | null
  selectedQuoteId: string | null
  selectedQuoteAmount: number | null
  totalQuotes: number
  submittedQuotes: number
}
