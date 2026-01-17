// =============================================================================
// Data Types
// =============================================================================

export interface Brand {
  id: string
  name: string
}

export type InvoiceType = 'product' | 'shipping' | 'duties' | 'inspection' | 'storage'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overdue'
export type LinkedEntityType = 'purchase-order' | 'shipment' | 'batch' | 'inspection'
export type PaymentMethod = 'wire-transfer' | 'credit-card' | 'paypal' | 'check' | 'other'
export type InvoiceCreationMethod = 'manual' | 'automatic'

// =============================================================================
// Payment Terms & Milestones
// =============================================================================

/** Trigger events for payment milestone due dates */
export type PaymentMilestoneTrigger =
  | 'po-confirmed'        // When PO status becomes confirmed
  | 'inspection-passed'   // When inspection result is pass
  | 'customs-cleared'     // When customs status becomes cleared
  | 'shipment-departed'   // When transfer status becomes in-transit
  | 'goods-received'      // When transfer status becomes delivered
  | 'manual'              // User manually triggers payment due
  | 'upfront'             // Due immediately upon invoice creation

/** Status of a milestone trigger */
export type PaymentTriggerStatus = 'pending' | 'triggered' | 'overdue'

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
}

// =============================================================================
// Invoice & Payment Types
// =============================================================================

export interface PaymentScheduleItem {
  id: string
  /** Legacy field for backward compatibility */
  description?: string
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
  /** When this item was paid */
  paidDate: string | null
  /** Amount paid against this item */
  paidAmount: number
}

export interface Payment {
  id: string
  date: string
  amount: number
  method: PaymentMethod
  reference: string
  scheduleItemId: string | null
}

/** Payment with invoice context for the Payments tab display */
export interface PaymentWithInvoice extends Payment {
  invoiceId: string
  invoiceDescription: string
}

/** Attachment metadata for uploaded files */
export interface PaymentAttachment {
  id: string
  name: string
  size: number
  type: string
}

/** New payment data for creating a payment */
export interface NewPayment {
  amount: number
  date: string
  method: PaymentMethod
  reference: string
  attachments: PaymentAttachment[]
}

export interface Invoice {
  id: string
  date: string
  description: string
  type: InvoiceType
  linkedEntityType: LinkedEntityType
  linkedEntityId: string
  linkedEntityName: string
  amount: number
  paidAmount: number
  balance: number
  status: PaymentStatus
  paymentSchedule: PaymentScheduleItem[]
  payments: Payment[]
  notes: string
  /** How this invoice was created */
  creationMethod?: InvoiceCreationMethod
  /** ID of the payment terms template used (for reference) */
  paymentTermsTemplateId?: string
  /** Brand ID (denormalized from linked entity) */
  brandId?: string
  /** Brand name (denormalized from linked entity) */
  brandName?: string
}

export interface InvoiceTypeOption {
  id: InvoiceType
  label: string
}

export interface PaymentMethodOption {
  id: PaymentMethod
  label: string
}

export interface PaymentTermsTemplateOption {
  id: string
  name: string
  description: string
}

export interface FinancialSummary {
  totalInvoices: number
  totalPaid: number
  outstanding: number
  upcomingThisWeek: number
  overdueCount: number
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
  /** Available payment terms templates */
  paymentTermsTemplates: PaymentTermsTemplate[]
  /** Financial summary data */
  summary: FinancialSummary
  /** Called when user wants to record a payment */
  onRecordPayment?: (invoiceId: string, payment: NewPayment) => void
  /** Called when user wants to view linked entity */
  onViewLinkedEntity?: (type: LinkedEntityType, id: string) => void
  /** Called when user wants to view invoice details */
  onViewInvoice?: (id: string) => void
}

export interface InvoiceDetailPanelProps {
  invoice: Invoice
  invoiceTypes: InvoiceTypeOption[]
  paymentMethods: PaymentMethodOption[]
  isOpen: boolean
  onClose: () => void
  onRecordPayment?: (payment: NewPayment) => void
  onViewLinkedEntity?: () => void
}
