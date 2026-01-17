// =============================================================================
// Data Types
// =============================================================================

import type { PaymentMilestone, PaymentTermsTemplate } from '../invoices-and-payments/types'

export type InspectionStatus = 'scheduled' | 'in-progress' | 'passed' | 'failed' | 'pending-rework' | 're-inspection'
export type DefectSeverity = 'minor' | 'major' | 'critical'
export type DefectType = 'cosmetic' | 'functional' | 'dimensional' | 'packaging' | 'labeling'

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
  boxCondition: 'good' | 'damaged' | 'acceptable'
  labelingAccuracy: boolean
  barcodeScans: boolean
  notes: string
}

export interface InspectionPhoto {
  id: string
  url: string
  caption: string
  type: 'defect' | 'product' | 'packaging'
}

export interface ReworkRequest {
  id: string
  createdDate: string
  instructions: string
  supplierResponse: string | null
  completedDate: string | null
  status: 'pending' | 'in-progress' | 'completed'
}

// =============================================================================
// Messaging Types (compatible with purchase-orders/MessageThread)
// =============================================================================

export type MessageDirection = 'outbound' | 'inbound' | 'note'

export interface Attachment {
  id: string
  name: string
  type: string
  url: string
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
  productName: string
  productSku: string
  orderedQuantity: number
  sampleSize: number
  defectsFound: number
  defectRate: number
  result: 'pass' | 'fail' | 'pending'
  defects: Defect[]
  measurements: MeasurementCheck[]
  packaging: PackagingCheck | null
  photos: InspectionPhoto[]
}

export interface Inspection {
  id: string
  /** Linked purchase order */
  purchaseOrderId: string
  purchaseOrderNumber: string
  supplierName: string
  scheduledDate: string
  completedDate: string | null
  /** ID of the assigned inspection agent (null if unassigned) */
  agentId: string | null
  /** Agent name for display (or "Unassigned") */
  agentName: string
  status: InspectionStatus
  /** Inspection results for each line item on the PO */
  lineItems: InspectionLineItem[]
  /** Overall result (derived from line items) */
  result: 'pass' | 'fail' | 'pending'
  /** Overall defect rate across all line items */
  overallDefectRate: number
  /** Total sample size across all line items */
  totalSampleSize: number
  reworkRequest: ReworkRequest | null
  notes: string
  /** Message thread for this inspection */
  messages?: InspectionMessage[]
}

export interface InspectionStatusOption {
  id: InspectionStatus
  label: string
}

export interface InspectionSummary {
  total: number
  scheduled: number
  passed: number
  failed: number
  pendingRework: number
  avgDefectRate: number
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
  /** Called when user wants to start recording results */
  onStartInspection?: (id: string) => void
  /** Called when user wants to create a rework request */
  onCreateRework?: (id: string) => void
  /** Called when user wants to schedule re-inspection */
  onScheduleReinspection?: (id: string) => void
  /** Called when user wants to view the linked batch */
  onViewBatch?: (batchId: string) => void
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
  onViewBatch?: (batchId: string) => void
  onCreateRework?: () => void
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
