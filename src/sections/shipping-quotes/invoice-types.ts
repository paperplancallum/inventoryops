// =============================================================================
// Shipping Invoice Types
// =============================================================================

export type ShippingInvoiceStatus =
  | 'received'  // Invoice received from agent
  | 'approved'  // Invoice approved for payment
  | 'paid'      // Invoice has been paid

// =============================================================================
// Shipping Invoice Line Item
// =============================================================================

export interface ShippingInvoiceLineItem {
  id: string
  shippingInvoiceId: string
  description: string
  amount: number
  sortOrder: number
  createdAt: string
}

// =============================================================================
// Shipping Invoice
// =============================================================================

export interface ShippingInvoice {
  id: string
  shippingQuoteId: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string | null
  currency: string
  totalAmount: number
  notes: string | null
  pdfPath: string | null
  pdfUrl?: string | null
  status: ShippingInvoiceStatus
  createdAt: string
  updatedAt: string
  // Related data
  lineItems: ShippingInvoiceLineItem[]
}

// =============================================================================
// Shipping Invoice with Variance
// =============================================================================

export interface VarianceInfo {
  quotedAmount: number
  actualAmount: number
  varianceAmount: number      // actual - quoted (positive = over, negative = under)
  variancePercent: number     // percentage change
  isOverBudget: boolean
}

export interface ShippingInvoiceWithVariance extends ShippingInvoice {
  variance: VarianceInfo
  // Quote details for reference
  quote: {
    id: string
    totalAmount: number
    currency: string
    shippingAgentId: string
    shippingAgentName: string
  }
  // Transfer details
  transfers: Array<{
    id: string
    transferNumber: string
  }>
}

// =============================================================================
// Form Types
// =============================================================================

export interface CreateShippingInvoiceInput {
  shippingQuoteId: string  // Must be a selected (winning) quote
  invoiceNumber: string
  invoiceDate: string
  dueDate?: string
  currency: string
  totalAmount: number
  notes?: string
  pdfPath?: string
  lineItems?: Array<{
    description: string
    amount: number
  }>
}

export interface UpdateShippingInvoiceInput {
  invoiceNumber?: string
  invoiceDate?: string
  dueDate?: string
  totalAmount?: number
  notes?: string
  pdfPath?: string
  status?: ShippingInvoiceStatus
  lineItems?: Array<{
    id?: string // If updating existing
    description: string
    amount: number
  }>
}

// =============================================================================
// Invoice Summary (for lists)
// =============================================================================

export interface ShippingInvoiceSummary {
  id: string
  invoiceNumber: string
  invoiceDate: string
  dueDate: string | null
  totalAmount: number
  currency: string
  status: ShippingInvoiceStatus
  varianceAmount: number
  variancePercent: number
  shippingAgentName: string
  transferNumbers: string[]
  isOverdue: boolean
}

// =============================================================================
// Aggregated Stats
// =============================================================================

export interface ShippingInvoiceStats {
  totalInvoices: number
  totalAmount: number
  totalVariance: number
  averageVariancePercent: number
  byStatus: {
    received: number
    approved: number
    paid: number
  }
  overdueCount: number
  overdueAmount: number
}
