// =============================================================================
// Data Types
// =============================================================================

import type { PaymentMilestone, PaymentTermsTemplate } from '../invoices-and-payments/types'

// Re-export for use in hooks
export type { PaymentMilestone, PaymentTermsTemplate }

// Status matches the database enum
export type InspectionStatus =
  | 'scheduled'           // Inspection created, awaiting agent confirmation
  | 'pending-confirmation' // Sent to agent, awaiting their response
  | 'confirmed'           // Agent confirmed date and submitted invoice
  | 'paid'                // Invoice paid, ready for inspection
  | 'in-progress'         // Agent is conducting inspection
  | 'report-submitted'    // Agent submitted report, awaiting review
  | 'passed'              // Internal review: passed
  | 'failed'              // Internal review: failed
  | 'pending-rework'      // Failed, rework requested
  | 're-inspection'       // Re-inspection scheduled after rework

export type DefectSeverity = 'minor' | 'major' | 'critical'
export type DefectType = 'cosmetic' | 'functional' | 'dimensional' | 'packaging' | 'labeling'
export type LineItemResult = 'pass' | 'fail' | 'pending'
export type BoxCondition = 'good' | 'damaged' | 'acceptable'
export type ReworkStatus = 'pending' | 'in-progress' | 'completed'
export type MessageDirection = 'outbound' | 'inbound' | 'note'
export type InspectionPhotoType = 'defect' | 'product' | 'packaging'

export interface InspectionAgent {
  id: string
  name: string
  email: string
  phone: string
  company: string
  /** Region or city where the agent operates */
  location: string
  /** Hourly rate in USD */
  hourlyRate: number
  /** Areas of expertise (e.g., electronics, textiles, packaging) */
  specialties: string[]
  notes: string
  /** Whether the agent is currently available for new inspections */
  isActive: boolean
  /** Payment terms string for display (e.g., "Payment required before inspection") */
  paymentTerms?: string
  /** ID of the payment terms template to use */
  paymentTermsTemplateId?: string
  /** Custom payment milestones (overrides template if provided) */
  customPaymentMilestones?: PaymentMilestone[]
}

export interface Defect {
  id: string
  type: DefectType
  description: string
  quantity: number
  severity: DefectSeverity
  photoIds: string[]
}

export interface MeasurementCheck {
  id: string
  name: string
  specValue: string
  actualValue: string
  passed: boolean
}

export interface PackagingCheck {
  boxCondition: BoxCondition
  labelingAccuracy: boolean
  barcodeScans: boolean
  notes: string
}

export interface InspectionPhoto {
  id: string
  url: string
  storagePath?: string
  caption: string
  type: InspectionPhotoType
}

export interface ReworkRequest {
  id: string
  createdDate: string
  instructions: string
  supplierResponse: string | null
  completedDate: string | null
  status: ReworkStatus
}

// =============================================================================
// Messaging Types (compatible with purchase-orders/MessageThread)
// =============================================================================

export interface Attachment {
  id: string
  name: string
  type: string
  url: string
  storagePath?: string
  size?: number
}

export interface InspectionMessage {
  id: string
  direction: MessageDirection
  senderName: string
  senderEmail?: string
  timestamp: string
  content: string
  attachments?: Attachment[]
}

export interface InspectionLineItem {
  id: string
  productId?: string
  poLineItemId?: string
  productName: string
  productSku: string
  orderedQuantity: number
  sampleSize: number
  defectsFound: number
  defectRate: number
  result: LineItemResult
  defects: Defect[]
  measurements: MeasurementCheck[]
  packaging: PackagingCheck | null
  photos: InspectionPhoto[]
}

export interface InspectionPurchaseOrder {
  id: string
  poNumber: string
  supplierName: string
}

export interface Inspection {
  id: string
  /** Display number (e.g., INS-26-0001) */
  inspectionNumber: string
  /** Linked purchase order (legacy single-PO) */
  purchaseOrderId?: string | null
  purchaseOrderNumber?: string | null
  supplierName?: string | null
  /** Multiple linked purchase orders */
  purchaseOrders?: InspectionPurchaseOrder[]

  // Dates
  scheduledDate: string
  confirmedDate: string | null
  completedDate: string | null

  /** ID of the assigned inspection agent (null if unassigned) */
  agentId: string | null
  /** Agent name for display (or "Unassigned") */
  agentName: string

  status: InspectionStatus

  /** Inspection results for each line item on the PO */
  lineItems: InspectionLineItem[]

  /** Overall result (derived from line items) */
  result: LineItemResult
  /** Overall defect rate across all line items */
  overallDefectRate: number
  /** Total sample size across all line items */
  totalSampleSize: number

  reworkRequest: ReworkRequest | null
  notes: string

  // Invoice tracking
  invoiceId: string | null
  invoiceAmount: number | null

  // Magic link for agent access
  magicLinkToken?: string
  magicLinkExpiresAt?: string

  // Re-inspection tracking
  originalInspectionId?: string

  /** Message thread for this inspection */
  messages?: InspectionMessage[]

  createdAt?: string
  updatedAt?: string
}

export interface InspectionStatusOption {
  id: InspectionStatus
  label: string
}

export interface InspectionSummary {
  total: number
  scheduled: number
  pendingConfirmation: number
  confirmed: number
  paid: number
  inProgress: number
  reportSubmitted: number
  passed: number
  failed: number
  pendingRework: number
  reInspection: number
  avgDefectRate: number
}

// =============================================================================
// Form Data Types
// =============================================================================

export interface InspectionAgentFormData {
  name: string
  email: string
  phone: string
  company: string
  location: string
  hourlyRate: number
  specialties: string[]
  notes: string
  paymentTerms?: string
  paymentTermsTemplateId?: string
  customPaymentMilestones?: PaymentMilestone[]
}

export interface ScheduleInspectionFormData {
  purchaseOrderId: string
  agentId: string | null
  scheduledDate: string
  notes?: string
  /** Selected line item IDs (empty = all) */
  selectedLineItemIds?: string[]
}

export interface AgentConfirmationData {
  confirmedDate: string
  invoiceAmount: number
}

export interface InspectionResultData {
  lineItems: {
    lineItemId: string
    sampleSize: number
    defects: Omit<Defect, 'id' | 'photoIds'>[]
    measurements: Omit<MeasurementCheck, 'id'>[]
    packaging: PackagingCheck | null
  }[]
  notes?: string
}

// =============================================================================
// Component Props
// =============================================================================

export interface InspectionsProps {
  /** List of all inspections */
  inspections: Inspection[]
  /** List of inspection agents */
  agents: InspectionAgent[]
  /** Available status options */
  statusOptions: InspectionStatusOption[]
  /** Summary statistics */
  summary: InspectionSummary
  /** Called when user wants to view inspection details */
  onViewInspection?: (id: string) => void
  /** Called when user wants to edit an inspection */
  onEditInspection?: (id: string) => void
  /** Called when user wants to delete an inspection */
  onDeleteInspection?: (id: string) => void
  /** Called when user wants to schedule a new inspection */
  onScheduleInspection?: () => void
  /** Called when user sends request to agent */
  onSendToAgent?: (id: string) => void
  /** Called when user marks inspection as paid */
  onMarkPaid?: (id: string) => void
  /** Called when user marks result as pass/fail */
  onMarkResult?: (id: string, result: 'pass' | 'fail') => void
  /** Called when user wants to start recording results */
  onStartInspection?: (id: string) => void
  /** Called when user wants to create a rework request */
  onCreateRework?: (id: string) => void
  /** Called when user wants to mark rework as completed */
  onCompleteRework?: (id: string) => void
  /** Called when user wants to schedule re-inspection */
  onScheduleReinspection?: (id: string) => void
  /** Called when user wants to view the linked PO */
  onViewPurchaseOrder?: (poId: string) => void
  /** Called when user wants to generate a report */
  onGenerateReport?: (id: string) => void
  /** Called when user wants to add a new agent */
  onAddAgent?: () => void
  /** Called when user wants to edit an agent */
  onEditAgent?: (id: string) => void
  /** Called when user wants to delete an agent */
  onDeleteAgent?: (id: string) => void
  /** Called when user toggles an agent's active status */
  onToggleAgentStatus?: (id: string) => void
  /** Called when user sends a message on an inspection */
  onSendMessage?: (inspectionId: string, content: string, attachments?: File[]) => void
  /** Called when user adds an internal note on an inspection */
  onAddNote?: (inspectionId: string, content: string) => void
  /** Called when user wants to view document history for an inspection */
  onViewDocumentHistory?: (id: string) => void
}

export interface InspectionDetailPanelProps {
  inspection: Inspection
  isOpen: boolean
  /** Whether an inspection invoice already exists for this inspection */
  hasInspectionInvoice?: boolean
  /** Inspection invoice ID if it exists (for viewing) */
  inspectionInvoiceId?: string | null
  onClose: () => void
  onEdit?: () => void
  onSendMessage?: (inspectionId: string, content: string, attachments?: File[]) => void
  onAddNote?: (inspectionId: string, content: string) => void
  onViewPurchaseOrder?: (poId: string) => void
  onSendToAgent?: () => void
  onMarkPaid?: () => void
  onMarkResult?: (result: 'pass' | 'fail') => void
  onCreateRework?: () => void
  onCompleteRework?: () => void
  onScheduleReinspection?: () => void
  /** Called when user wants to create an inspection invoice */
  onCreateInspectionInvoice?: (inspectionId: string) => void
  /** Called when user wants to view the existing inspection invoice */
  onViewInspectionInvoice?: (invoiceId: string) => void
  /** Called when user wants to generate an inspection report PDF */
  onGenerateReport?: () => void
  /** Called when user wants to view document history */
  onViewDocumentHistory?: () => void
}

export interface InspectionAgentFormProps {
  /** Existing agent data for editing, undefined for new */
  agent?: InspectionAgent
  /** Available payment terms templates */
  paymentTermsTemplates?: PaymentTermsTemplate[]
  /** Whether the form is open (for modal usage) */
  isOpen?: boolean
  /** Called when form is submitted */
  onSubmit?: (data: InspectionAgentFormData) => void
  /** Called when form is cancelled */
  onCancel?: () => void
}

export interface ScheduleInspectionFormProps {
  /** Available purchase orders that need inspection */
  purchaseOrders: { id: string; poNumber: string; supplierName: string }[]
  /** Available agents */
  agents: InspectionAgent[]
  /** Pre-selected PO ID (if scheduling from PO detail) */
  preselectedPoId?: string
  /** Whether the form is open */
  isOpen?: boolean
  /** Called when form is submitted */
  onSubmit?: (data: ScheduleInspectionFormData) => void
  /** Called when form is cancelled */
  onCancel?: () => void
}

// Status options for the UI
export const INSPECTION_STATUS_OPTIONS: InspectionStatusOption[] = [
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'pending-confirmation', label: 'Pending Confirmation' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'paid', label: 'Paid' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'report-submitted', label: 'Report Submitted' },
  { id: 'passed', label: 'Passed' },
  { id: 'failed', label: 'Failed' },
  { id: 'pending-rework', label: 'Pending Rework' },
  { id: 're-inspection', label: 'Re-inspection' },
]
