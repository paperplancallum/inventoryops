// =============================================================================
// Status Types
// =============================================================================

export type POStatus = 'draft' | 'sent' | 'awaiting_invoice' | 'invoice_received' | 'confirmed' | 'production_complete' | 'ready-to-ship' | 'partially-received' | 'received' | 'cancelled'

export type InspectionDecisionStatus = 'pending' | 'scheduled' | 'not-needed'

export type SupplierInvoiceStatus = 'none' | 'pending-submission' | 'pending-review' | 'approved' | 'rejected'

export type MessageDirection = 'outbound' | 'inbound' | 'note'

// =============================================================================
// Core Data Types
// =============================================================================

export interface LineItem {
  id: string
  productId?: string
  sku: string
  productName: string
  quantity: number
  unitCost: number
  subtotal: number
  sortOrder?: number
}

export interface StatusHistoryEntry {
  id: string
  status: POStatus
  date: string
  note: string
  changedById?: string
  changedByName?: string
}

export interface Attachment {
  id: string
  name: string
  type: string
  url: string
  size?: number
  storagePath?: string
}

export interface Message {
  id: string
  direction: MessageDirection
  senderName: string
  senderEmail?: string
  content: string
  attachments: Attachment[]
  createdAt: string
}

export interface PODocument {
  id: string
  fileName: string
  fileUrl: string
  storagePath?: string
  fileSize?: number
  version: number
  snapshotData?: Record<string, unknown>
  generatedById?: string
  generatedByName?: string
  createdAt: string
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
  paymentTermsTemplateId?: string
  notes: string
  subtotal: number
  total: number
  lineItems: LineItem[]
  statusHistory: StatusHistoryEntry[]

  // Inspection fields
  requiresInspection?: boolean
  inspectionStatus?: InspectionDecisionStatus
  inspectionId?: string

  // Supplier Invoice fields
  supplierInvoiceStatus?: SupplierInvoiceStatus
  supplierInvoiceId?: string
  invoiceLinkSentAt?: string
  invoiceSubmittedAt?: string
  invoiceReviewedAt?: string
  invoiceVariance?: number
  invoiceVariancePercent?: number

  // Message tracking
  unreadCount?: number
  messages?: Message[]

  // Documents
  documents?: PODocument[]

  // Audit
  createdById?: string
  createdByName?: string
  createdAt?: string
  updatedAt?: string
}

export interface POStatusOption {
  id: POStatus
  label: string
  order: number
}

export interface Supplier {
  id: string
  name: string
  contactEmail?: string
  leadTimeDays?: number
  paymentTerms?: string
  paymentTermsTemplateId?: string
}

export interface PaymentTermsOption {
  id: string
  name: string
  description: string
}

export interface Product {
  id: string
  sku: string
  name: string
  unitCost: number
}

// =============================================================================
// Aggregated Line Items View Types
// =============================================================================

/** Flat line item with PO context for aggregated view */
export interface POLineItemFlat {
  id: string
  poId: string
  poNumber: string
  supplierId: string
  supplierName: string
  poStatus: POStatus
  productId?: string
  sku: string
  productName: string
  quantity: number
  unitCost: number
  subtotal: number
  orderDate: string
  expectedDate: string
}

export interface LineItemsSummary {
  totalItems: number
  totalUnits: number
  totalValue: number
  uniqueProducts: number
  bySupplier: { supplierId: string; supplierName: string; count: number; value: number }[]
  byStatus: { status: POStatus; count: number; value: number }[]
}

// =============================================================================
// Form Types
// =============================================================================

export interface POFormData {
  supplierId: string
  orderDate: string
  expectedDate: string
  paymentTerms: string
  paymentTermsTemplateId?: string
  notes: string
  lineItems: POLineItemFormData[]
}

export interface POLineItemFormData {
  id?: string
  productId?: string
  sku: string
  productName: string
  quantity: number
  unitCost: number
}

// =============================================================================
// Component Props
// =============================================================================

export interface PurchaseOrdersProps {
  purchaseOrders: PurchaseOrder[]
  poStatuses: POStatusOption[]
  suppliers: Supplier[]
  products?: Product[]
  onViewPO?: (id: string) => void
  onEditPO?: (id: string) => void
  onDeletePO?: (id: string) => void
  onCreatePO?: () => void
  onDuplicatePO?: (id: string) => void
  onExportPDF?: (id: string) => void
  onSendToSupplier?: (id: string) => void
  onUpdateStatus?: (id: string, newStatus: POStatus) => void
  onScheduleInspection?: (id: string) => void
  onAddToInspection?: (poIds: string[]) => void
  onViewInspection?: (inspectionId: string) => void
  onFormSubmit?: (data: POFormData, poId?: string) => void | Promise<void>
  onRefresh?: () => void
  loading?: boolean
}

export interface LineItemsViewProps {
  lineItems: POLineItemFlat[]
  summary: LineItemsSummary
  poStatuses: POStatusOption[]
  suppliers: Supplier[]
  onViewPO?: (poId: string) => void
}

export interface PODetailPanelProps {
  purchaseOrder: PurchaseOrder | null
  isOpen: boolean
  onClose: () => void
  poStatuses: POStatusOption[]
  onEdit?: () => void
  onExportPDF?: () => void
  onSendToSupplier?: () => void
  onSendMessage?: (content: string, attachments?: File[]) => void | Promise<void>
  onScheduleInspection?: () => void
  onUpdateInspectionStatus?: (status: InspectionDecisionStatus) => void
}

export interface POViewTabsProps {
  activeTab: 'orders' | 'line-items'
  onTabChange: (tab: 'orders' | 'line-items') => void
  orderCount: number
  lineItemCount: number
}

export interface MessageThreadProps {
  messages: Message[]
  onSendMessage?: (content: string, attachments?: File[]) => void | Promise<void>
  sending?: boolean
}
