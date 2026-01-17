// =============================================================================
// Status Types
// =============================================================================

export type SupplierInvoiceStatus =
  | 'pending'      // Submitted by supplier, awaiting review
  | 'approved'     // User approved, PO updated
  | 'rejected'     // User rejected submission
  | 'revised'      // Supplier submitted a revision (supersedes previous)
  | 'expired'      // Magic link expired before submission

export type AdditionalCostType =
  | 'handling'      // Handling/packaging fee
  | 'rush'          // Rush/expedited fee
  | 'tooling'       // Tooling/setup fee
  | 'shipping'      // Shipping to port
  | 'inspection'    // Supplier's own QC
  | 'other'         // Other miscellaneous

export type PriceChangeReason =
  | 'initial'           // Initial price when line item created
  | 'supplier_invoice'  // Changed via supplier invoice approval
  | 'manual_edit'       // Manual edit by user

// =============================================================================
// Entity Types
// =============================================================================

export interface SupplierInvoice {
  id: string

  // Link to Purchase Order
  purchaseOrderId: string
  poNumber: string

  // Supplier context (denormalized for display)
  supplierId: string
  supplierName: string
  supplierEmail: string

  // Magic link details
  magicLinkId: string
  magicLinkExpiresAt: string
  magicLinkCreatedAt: string

  // Submission details
  submittedAt: string | null
  submittedByName: string | null
  submittedByEmail: string | null

  // Review details
  status: SupplierInvoiceStatus
  reviewedAt: string | null
  reviewedByUserId: string | null
  reviewedByUserName: string | null
  reviewNotes: string | null

  // Line items with price comparison
  lineItems: SupplierInvoiceLineItem[]

  // Additional costs
  additionalCosts: SupplierInvoiceCost[]

  // Totals
  originalSubtotal: number      // Sum of original PO line items
  submittedSubtotal: number     // Sum of supplier-submitted line items
  additionalCostsTotal: number  // Sum of additional costs
  submittedTotal: number        // submittedSubtotal + additionalCostsTotal
  variance: number              // submittedTotal - originalSubtotal
  variancePercent: number       // (variance / originalSubtotal) * 100

  // Supplier notes
  supplierNotes: string | null

  // Revision tracking
  revisionNumber: number        // Starts at 1, increments on revision
  previousInvoiceId: string | null  // Link to superseded invoice

  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface SupplierInvoiceLineItem {
  id: string
  supplierInvoiceId: string

  // Reference to original PO line item
  poLineItemId: string

  // Product info (denormalized for display)
  sku: string
  productName: string

  // Quantity (read-only, from PO)
  quantity: number

  // Pricing comparison
  originalUnitCost: number      // From PO at time of submission
  submittedUnitCost: number     // Supplier's actual price

  // Computed values
  originalSubtotal: number      // quantity * originalUnitCost
  submittedSubtotal: number     // quantity * submittedUnitCost
  variance: number              // submittedSubtotal - originalSubtotal
  variancePercent: number       // (variance / originalSubtotal) * 100

  // Supplier notes per line (optional)
  notes: string | null
}

export interface SupplierInvoiceCost {
  id: string
  supplierInvoiceId: string

  // Cost details
  type: AdditionalCostType
  description: string
  amount: number

  // Optional breakdown per unit
  perUnit: boolean              // If true, amount is per unit
  calculatedTotal: number | null // If perUnit, this is amount * total units

  // Notes
  notes: string | null
}

/**
 * Audit trail entry for price changes on PO line items.
 */
export interface POLineItemPriceHistory {
  id: string
  poLineItemId: string
  purchaseOrderId: string

  // Snapshot of values at change time
  unitCost: number
  subtotal: number

  // Change metadata
  changedAt: string
  changedByUserId: string | null      // null for supplier-initiated
  changedByUserName: string | null
  changeReason: PriceChangeReason

  // Link to supplier invoice (if applicable)
  supplierInvoiceId: string | null
}

// =============================================================================
// Component Props
// =============================================================================

export interface SupplierInvoicesViewProps {
  /** List of supplier invoices to display */
  invoices: SupplierInvoice[]
  /** Status options for filtering */
  statuses: { id: SupplierInvoiceStatus; label: string }[]
  /** Called when user wants to view invoice details */
  onViewInvoice?: (id: string) => void
  /** Called when user wants to view the associated PO */
  onViewPurchaseOrder?: (poId: string) => void
  /** Called when user approves an invoice */
  onApproveInvoice?: (id: string, notes?: string) => void
  /** Called when user rejects with revision request */
  onRejectForRevision?: (id: string, notes: string) => void
  /** Called when user rejects finally */
  onRejectFinal?: (id: string, notes: string) => void
}

export interface SupplierInvoiceReviewProps {
  /** The submitted invoice to review */
  invoice: SupplierInvoice
  /** Original PO for context */
  purchaseOrder: {
    poNumber: string
    supplierName: string
    orderDate: string
    status: string
  }
  /** Called when panel is closed */
  onClose?: () => void
  /** Called when user approves */
  onApprove?: (notes: string | null) => void
  /** Called when user rejects with revision request */
  onRejectForRevision?: (notes: string) => void
  /** Called when user rejects finally */
  onRejectFinal?: (notes: string) => void
  /** Called when user wants to view price history */
  onViewPriceHistory?: (lineItemId: string) => void
}

export interface PriceHistoryModalProps {
  /** History entries for a line item */
  history: POLineItemPriceHistory[]
  /** Product context */
  productName: string
  sku: string
  /** Called when modal is closed */
  onClose?: () => void
  /** Called when user clicks to view supplier invoice */
  onViewSupplierInvoice?: (invoiceId: string) => void
}

export interface SupplierInvoiceSummary {
  /** Total pending invoices awaiting review */
  pendingCount: number
  /** Total approved this month */
  approvedThisMonth: number
  /** Total variance (approved invoices) */
  totalVariance: number
  /** Average variance percentage */
  avgVariancePercent: number
}

// =============================================================================
// Additional Cost Option Types
// =============================================================================

export interface AdditionalCostTypeOption {
  id: AdditionalCostType
  label: string
  description: string
}

export const ADDITIONAL_COST_TYPES: AdditionalCostTypeOption[] = [
  { id: 'handling', label: 'Handling Fee', description: 'Packaging and handling charges' },
  { id: 'rush', label: 'Rush Fee', description: 'Expedited production or shipping' },
  { id: 'tooling', label: 'Tooling', description: 'Molds, dies, or setup costs' },
  { id: 'shipping', label: 'Shipping', description: 'Shipping to port or warehouse' },
  { id: 'inspection', label: 'Inspection', description: 'Supplier quality control' },
  { id: 'other', label: 'Other', description: 'Other miscellaneous costs' },
]
