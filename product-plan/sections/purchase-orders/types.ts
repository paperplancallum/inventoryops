// =============================================================================
// Data Types
// =============================================================================

export type POStatus = 'draft' | 'sent' | 'confirmed' | 'partially-received' | 'received' | 'cancelled'

export type InspectionDecisionStatus = 'pending' | 'scheduled' | 'not-needed'

export type SupplierInvoiceStatus = 'none' | 'pending-submission' | 'pending-review' | 'approved' | 'rejected'

export interface LineItem {
  id: string
  sku: string
  productName: string
  quantity: number
  unitCost: number
  subtotal: number
}

export interface StatusHistoryEntry {
  status: POStatus
  date: string
  note: string
}

export interface Attachment {
  id: string
  name: string
  type: string
  url: string
  size?: number
}

export type MessageDirection = 'outbound' | 'inbound' | 'note'

export interface Message {
  id: string
  direction: MessageDirection
  senderName: string
  /** Email address (not used for notes) */
  senderEmail?: string
  timestamp: string
  content: string
  attachments?: Attachment[]
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  supplierName: string
  status: POStatus
  orderDate: string
  expectedDate: string
  receivedDate: string | null
  paymentTerms: string
  notes: string
  subtotal: number
  total: number
  lineItems: LineItem[]
  statusHistory: StatusHistoryEntry[]
  /** Whether this PO requires a pre-shipment inspection */
  requiresInspection?: boolean
  /** Inspection decision status (only relevant when requiresInspection is true) */
  inspectionStatus?: InspectionDecisionStatus
  /** Reference to created inspection record (when status is 'scheduled') */
  inspectionId?: string | null
  /** Conversation thread with supplier */
  messages?: Message[]
  /** Number of unread messages from supplier */
  unreadCount?: number

  // Supplier Invoice fields
  /** Status of supplier invoice/price confirmation */
  supplierInvoiceStatus?: SupplierInvoiceStatus
  /** ID of the active supplier invoice (if any) */
  supplierInvoiceId?: string | null
  /** When the magic link was sent to supplier */
  invoiceLinkSentAt?: string | null
  /** When the supplier submitted their prices */
  invoiceSubmittedAt?: string | null
  /** When the invoice was reviewed */
  invoiceReviewedAt?: string | null
  /** Variance amount from submitted invoice (if reviewed) */
  invoiceVariance?: number | null
  /** Variance percentage from submitted invoice (if reviewed) */
  invoiceVariancePercent?: number | null
}

export interface POStatusOption {
  id: POStatus
  label: string
  order: number
}

export interface Supplier {
  id: string
  name: string
}

/** Flattened line item with parent PO context for the Line Items view */
export interface POLineItemFlat {
  // Line item fields
  lineItemId: string
  sku: string
  productName: string
  quantity: number
  unitCost: number
  subtotal: number

  // Parent PO context
  poId: string
  poNumber: string
  supplierId: string
  supplierName: string
  status: POStatus
  orderDate: string
  expectedDate: string
}

export interface LineItemsSummary {
  totalLineItems: number
  totalUnits: number
  totalValue: number
  uniqueProducts: number
}

export type POViewTab = 'purchase-orders' | 'line-items'

// =============================================================================
// Component Props
// =============================================================================

export interface PurchaseOrdersProps {
  /** The list of purchase orders to display */
  purchaseOrders: PurchaseOrder[]
  /** Available PO status options */
  poStatuses: POStatusOption[]
  /** Available suppliers for filtering */
  suppliers: Supplier[]
  /** Called when user wants to view a PO's details */
  onViewPO?: (id: string) => void
  /** Called when user wants to edit a PO */
  onEditPO?: (id: string) => void
  /** Called when user wants to delete a PO */
  onDeletePO?: (id: string) => void
  /** Called when user wants to create a new PO */
  onCreatePO?: () => void
  /** Called when user wants to duplicate a PO */
  onDuplicatePO?: (id: string) => void
  /** Called when user wants to export a PO as PDF */
  onExportPDF?: (id: string) => void
  /** Called when user wants to send a PO to the supplier */
  onSendToSupplier?: (id: string) => void
  /** Called when user updates a PO's status */
  onUpdateStatus?: (id: string, newStatus: POStatus) => void
  /** Called when user wants to schedule an inspection for a PO */
  onScheduleInspection?: (id: string) => void
  /** Called when user wants to generate a PDF (captures data snapshot) */
  onGeneratePDF?: (id: string) => void
  /** Called when user wants to view document history for a PO */
  onViewDocumentHistory?: (id: string) => void
}

export interface LineItemsViewProps {
  /** Flattened line items from all POs */
  lineItems: POLineItemFlat[]
  /** Available PO status options for filtering */
  poStatuses: POStatusOption[]
  /** Available suppliers for filtering */
  suppliers: Supplier[]
  /** Summary statistics */
  summary: LineItemsSummary
  /** Called when user clicks on a PO number to view it */
  onViewPO?: (poId: string) => void
}
