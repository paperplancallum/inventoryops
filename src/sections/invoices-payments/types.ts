// =============================================================================
// Invoices & Payments - Frontend Types
// =============================================================================

// Re-export enum types from database.types.ts
export type {
  InvoiceType,
  PaymentStatus,
  LinkedEntityType,
  PaymentMethod,
  InvoiceCreationMethod,
  PaymentTriggerStatus,
  PaymentMilestoneTrigger,
} from '@/lib/supabase/database.types'

// Import for type checking
import type {
  InvoiceType,
  PaymentStatus,
  LinkedEntityType,
  PaymentMethod,
  PaymentMilestoneTrigger,
  PaymentTriggerStatus,
  InvoiceCreationMethod,
} from '@/lib/supabase/database.types'

// =============================================================================
// Brand Type (used for filtering)
// =============================================================================

export interface Brand {
  id: string
  name: string
}

// =============================================================================
// Payment Terms & Milestones
// =============================================================================

/** A single payment milestone within a payment terms template */
export interface PaymentMilestone {
  id: string
  /** Display name (e.g., "Deposit", "Balance", "Final Payment") */
  name: string
  /** Percentage of total invoice (e.g., 30, 40, 30) */
  percentage: number
  /** Event that triggers this milestone becoming due */
  trigger: PaymentMilestoneTrigger
  /** Days after trigger event (0 = immediately, 7 = 1 week after, 30 = net 30) */
  offsetDays: number
}

/** Reusable payment terms template that can be assigned to stakeholders */
export interface PaymentTermsTemplate {
  id: string
  /** Display name (e.g., "Standard 30/70", "30/40/30 Split", "Net 30") */
  name: string
  /** Description of the payment schedule */
  description: string
  /** The milestones that make up this payment schedule */
  milestones: PaymentMilestone[]
  /** Whether the template is active */
  isActive: boolean
}

// =============================================================================
// Invoice & Payment Types
// =============================================================================

export interface PaymentScheduleItem {
  id: string
  /** Milestone name (e.g., "Deposit", "Balance After Inspection") */
  milestoneName: string
  /** Percentage of total invoice */
  percentage: number
  /** Calculated amount based on percentage */
  amount: number
  /** Event that triggers this payment becoming due */
  trigger: PaymentMilestoneTrigger
  /** Has the trigger event occurred? */
  triggerStatus: PaymentTriggerStatus
  /** When the trigger event occurred */
  triggerDate: string | null
  /** Calculated due date (triggerDate + offsetDays) */
  dueDate: string | null
  /** Days offset from trigger date */
  offsetDays: number
  /** When this item was paid */
  paidDate: string | null
  /** Amount paid against this item */
  paidAmount: number
  /** Sort order for display */
  sortOrder: number
}

export interface PaymentAttachment {
  id: string
  name: string
  type: string
  url: string
  storagePath: string | null
  size: number
}

export interface Payment {
  id: string
  date: string
  amount: number
  method: PaymentMethod
  reference: string | null
  notes: string | null
  scheduleItemId: string | null
  attachments: PaymentAttachment[]
}

/** Payment with invoice context for the Payments tab display */
export interface PaymentWithInvoice extends Payment {
  invoiceId: string
  invoiceNumber: string
  invoiceDescription: string
}

/** New payment data for creating a payment */
export interface NewPayment {
  amount: number
  date: string
  method: PaymentMethod
  /** Transaction reference (e.g., wire transfer ID, check number) */
  reference?: string
  notes?: string
  /** Single schedule item ID (legacy) */
  scheduleItemId?: string | null
  /** Multiple schedule item IDs for paying multiple milestones at once */
  scheduleItemIds?: string[]
  attachments: File[]
}

/** Editable milestone item for the edit modal */
export interface EditableScheduleItem {
  /** Existing ID or temporary ID for new items (starts with 'new-') */
  id: string
  milestoneName: string
  percentage: number
  amount: number
  trigger: PaymentMilestoneTrigger
  offsetDays: number
  /** Whether this is a new item to be created */
  isNew?: boolean
  /** Whether this item should be deleted */
  isDeleted?: boolean
}

/** Data for updating schedule items in bulk */
export interface UpdateScheduleItemsData {
  invoiceId: string
  items: EditableScheduleItem[]
}

export interface Invoice {
  id: string
  invoiceNumber: string
  invoiceDate: string
  description: string
  type: InvoiceType
  linkedEntityType: LinkedEntityType
  linkedEntityId: string
  linkedEntityName: string
  amount: number
  paidAmount: number
  balance: number
  status: PaymentStatus
  dueDate: string | null
  paymentSchedule: PaymentScheduleItem[]
  payments: Payment[]
  notes: string | null
  /** How this invoice was created */
  creationMethod: InvoiceCreationMethod
  /** ID of the payment terms template used (for reference) */
  paymentTermsTemplateId: string | null
  /** Brand ID (denormalized from linked entity) */
  brandId: string | null
  /** Brand name (denormalized from linked entity) */
  brandName: string | null
  createdAt: string
  updatedAt: string
}

// =============================================================================
// Form Data Types
// =============================================================================

export interface InvoiceFormData {
  invoiceDate: string
  description: string
  type: InvoiceType
  linkedEntityType: LinkedEntityType
  linkedEntityId: string
  linkedEntityName: string
  amount: number
  dueDate?: string | null
  notes?: string
  paymentTermsTemplateId?: string | null
  brandId?: string | null
  brandName?: string | null
}

// =============================================================================
// Option Types for Select/Dropdown
// =============================================================================

export interface InvoiceTypeOption {
  id: InvoiceType
  label: string
}

export interface PaymentMethodOption {
  id: PaymentMethod
  label: string
}

export interface PaymentStatusOption {
  id: PaymentStatus
  label: string
}

export interface LinkedEntityTypeOption {
  id: LinkedEntityType
  label: string
}

// =============================================================================
// Summary Types
// =============================================================================

export interface FinancialSummary {
  totalInvoices: number
  totalPaid: number
  outstanding: number
  upcomingThisWeek: number
  overdueCount: number
}

// =============================================================================
// Filter Types
// =============================================================================

export interface InvoiceFilters {
  types: InvoiceType[]
  statuses: PaymentStatus[]
  brands: string[]
  dateRange?: {
    start: string
    end: string
  }
}

// =============================================================================
// Component Props
// =============================================================================

export interface InvoicesPaymentsProps {
  /** List of all invoices */
  invoices: Invoice[]
  /** Flattened list of all payments with invoice context */
  payments: PaymentWithInvoice[]
  /** Available invoice type options */
  invoiceTypes: InvoiceTypeOption[]
  /** Available payment method options */
  paymentMethods: PaymentMethodOption[]
  /** Available payment status options */
  paymentStatuses: PaymentStatusOption[]
  /** Available brands for filtering */
  brands: Brand[]
  /** Payment terms templates */
  paymentTermsTemplates: PaymentTermsTemplate[]
  /** Financial summary data */
  summary: FinancialSummary
  /** Loading state */
  loading?: boolean
  /** Error state */
  error?: Error | null
  /** Called when user wants to record a payment */
  onRecordPayment?: (invoiceId: string, payment: NewPayment) => Promise<void>
  /** Called when user wants to view linked entity */
  onViewLinkedEntity?: (type: LinkedEntityType, id: string) => void
  /** Called when user wants to view invoice details */
  onViewInvoice?: (id: string) => void
  /** Called when invoices need to be refreshed */
  onRefresh?: () => void
}

export interface InvoiceDetailPanelProps {
  invoice: Invoice
  invoiceTypes: InvoiceTypeOption[]
  paymentMethods: PaymentMethodOption[]
  isOpen: boolean
  onClose: () => void
  onRecordPayment?: (payment: NewPayment) => Promise<void>
  onViewLinkedEntity?: () => void
}

export interface RecordPaymentModalProps {
  invoice: Invoice
  paymentMethods: PaymentMethodOption[]
  isOpen: boolean
  onClose: () => void
  onSubmit: (payment: NewPayment) => Promise<void>
  loading?: boolean
}

export interface InvoiceTableRowProps {
  invoice: Invoice
  invoiceTypes: InvoiceTypeOption[]
  isExpanded: boolean
  onToggleExpand: () => void
  onViewDetails: () => void
  onRecordPayment: () => void
  onViewLinkedEntity: () => void
}

export interface PaymentsTableProps {
  payments: PaymentWithInvoice[]
  paymentMethods: PaymentMethodOption[]
  onViewInvoice: (invoiceId: string) => void
}

// =============================================================================
// Static Data
// =============================================================================

export const INVOICE_TYPES: InvoiceTypeOption[] = [
  { id: 'product', label: 'Product' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'duties', label: 'Duties & Taxes' },
  { id: 'inspection', label: 'Inspection' },
  { id: 'storage', label: 'Storage' },
]

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: 'wire-transfer', label: 'Wire Transfer' },
  { id: 'credit-card', label: 'Credit Card' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'check', label: 'Check' },
  { id: 'other', label: 'Other' },
]

export const PAYMENT_STATUSES: PaymentStatusOption[] = [
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'partial', label: 'Partial' },
  { id: 'paid', label: 'Paid' },
  { id: 'overdue', label: 'Overdue' },
]

export const LINKED_ENTITY_TYPES: LinkedEntityTypeOption[] = [
  { id: 'purchase-order', label: 'Purchase Order' },
  { id: 'shipment', label: 'Shipment' },
  { id: 'batch', label: 'Batch' },
  { id: 'inspection', label: 'Inspection' },
]

export interface MilestoneTriggerOption {
  id: PaymentMilestoneTrigger
  label: string
}

export const MILESTONE_TRIGGERS: MilestoneTriggerOption[] = [
  { id: 'upfront', label: 'Upfront (Immediate)' },
  { id: 'po_confirmed', label: 'PO Confirmed' },
  { id: 'inspection_passed', label: 'Inspection Passed' },
  { id: 'shipment_departed', label: 'Shipment Departed' },
  { id: 'customs_cleared', label: 'Customs Cleared' },
  { id: 'goods_received', label: 'Goods Received' },
  { id: 'manual', label: 'Manual' },
]
