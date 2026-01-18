// =============================================================================
// Document Types
// =============================================================================

export type DocumentSourceType = 'purchase-order' | 'inspection' | 'transfer'

export type GeneratedDocumentType =
  | 'purchase-order-pdf'
  | 'inspection-brief'
  | 'shipping-manifest'
  | 'packing-list'

export interface GeneratedDocument {
  id: string
  /** Type of source entity */
  sourceEntityType: DocumentSourceType
  /** ID of the source entity (PO, Inspection, or Transfer) */
  sourceEntityId: string
  /** Display reference (e.g., "PO-2024-001", "INS-001", "TRF-001") */
  sourceEntityRef: string
  /** Document type for display and filtering */
  documentType: GeneratedDocumentType
  /** Human-readable document name */
  documentName: string
  /** When the PDF was generated */
  generatedAt: string
  /** User ID who generated it */
  generatedById: string | null
  /** User name for display */
  generatedByName: string | null
  /** URL/path to the stored PDF file */
  pdfUrl: string
  /** Storage path in bucket */
  storagePath: string
  /** File size in bytes */
  fileSize: number
  /** JSON snapshot of source data at generation time */
  dataSnapshot: Record<string, unknown>
  /** How this document was generated */
  generationTrigger: 'auto' | 'manual'
  /** Optional notes about this generation */
  notes: string | null
  /** Brand ID for multi-tenant filtering */
  brandId: string | null
}

// =============================================================================
// Snapshot Types (immutable data captured at PDF generation)
// =============================================================================

export interface PODocumentSnapshot {
  poNumber: string
  supplierName: string
  supplierAddress?: string
  orderDate: string
  expectedDate: string
  paymentTerms: string
  lineItems: Array<{
    sku: string
    productName: string
    quantity: number
    unitCost: number
    subtotal: number
  }>
  subtotal: number
  total: number
  notes: string
}

/**
 * Inspection Brief Snapshot
 * This is the document WE generate to send TO the inspection agency.
 * It contains what they need to know to perform the inspection.
 */
export interface InspectionBriefSnapshot {
  inspectionNumber: string
  purchaseOrderNumber: string
  /** Supplier details for the inspector to visit */
  supplierName: string
  supplierAddress?: string
  supplierPhone?: string
  supplierContactPerson?: string
  /** When the inspection is scheduled */
  scheduledDate: string
  /** Type of inspection requested */
  inspectionType: string
  /** Inspection agency/agent details */
  agentName: string
  agentCompany?: string
  agentEmail?: string
  agentPhone?: string
  /** Line items to be inspected */
  lineItems: Array<{
    productSku: string
    productName: string
    orderedQuantity: number
    sampleSize?: number
    /** Specific inspection criteria for this product */
    inspectionCriteria?: string
  }>
  /** Special instructions for the inspector */
  specialInstructions?: string
  notes: string
}

export interface TransferDocumentSnapshot {
  transferNumber: string
  sourceLocationName: string
  sourceLocationAddress?: string
  destinationLocationName: string
  destinationLocationAddress?: string
  carrier: string
  shippingMethod: string
  scheduledDepartureDate: string
  scheduledArrivalDate: string
  incoterms?: string
  lineItems: Array<{
    sku: string
    productName: string
    quantity: number
    unitWeight?: number
    totalWeight?: number
    dimensions?: string
    packagingType?: string
    cartonCount?: number
    unitCost?: number
    totalCost?: number
  }>
  totalUnits: number
  totalValue: number
  totalWeight?: number
  totalVolume?: number
  palletCount?: number
  totalCartonCount?: number
  specialInstructions?: string
  trackingNumbers: Array<{ carrier: string; number: string }>
  containerNumbers: string[]
  notes: string
}

/**
 * Packing List Snapshot
 * Detailed list of contents for the receiver - what's in each box/pallet.
 */
export interface PackingListDocumentSnapshot {
  transferNumber: string
  sourceLocationName: string
  destinationLocationName: string
  destinationAddress?: string
  scheduledArrivalDate: string
  carrier?: string
  trackingNumber?: string
  /** Detailed packing breakdown by line item */
  lineItems: Array<{
    sku: string
    productName: string
    quantity: number
    cartonCount?: number
    weight?: number
  }>
  /** Summary totals */
  totalCartons: number
  totalUnits: number
  totalWeight?: number
  /** Receiver instructions */
  receivingInstructions?: string
  notes: string
}

// =============================================================================
// Summary & Filter Types
// =============================================================================

export interface DocumentsSummary {
  total: number
  purchaseOrders: number
  inspections: number
  transfers: number
  thisMonth: number
}

export interface DocumentsFilters {
  sourceType?: DocumentSourceType
  documentType?: GeneratedDocumentType
  dateRange?: { from: string; to: string }
  searchQuery?: string
}

// =============================================================================
// Component Props
// =============================================================================

export interface DocumentsViewProps {
  documents: GeneratedDocument[]
  summary: DocumentsSummary
  filters?: DocumentsFilters
  loading?: boolean
  onViewDocument?: (id: string) => void
  onDownloadDocument?: (id: string) => void
  onDeleteDocument?: (id: string) => void
  onViewSourceRecord?: (sourceType: DocumentSourceType, sourceId: string) => void
  onFilterChange?: (filters: DocumentsFilters) => void
}

export interface DocumentHistoryProps {
  documents: GeneratedDocument[]
  sourceType: DocumentSourceType
  sourceId: string
  sourceRef: string
  onViewDocument?: (id: string) => void
  onDownloadDocument?: (id: string) => void
  onGenerateNew?: () => void
}

export interface GenerateDocumentModalProps {
  isOpen: boolean
  sourceType: DocumentSourceType
  sourceId: string
  sourceRef: string
  documentType: GeneratedDocumentType
  onClose: () => void
  onGenerate: (notes?: string) => void
}

export interface DocumentRowProps {
  document: GeneratedDocument
  onView?: () => void
  onDownload?: () => void
  onDelete?: () => void
  onViewSource?: () => void
}

export interface DocumentsSummaryCardsProps {
  summary: DocumentsSummary
}

// =============================================================================
// Document Type Metadata
// =============================================================================

export interface DocumentTypeInfo {
  id: GeneratedDocumentType
  label: string
  icon: string
  color: string
}

export const DOCUMENT_TYPES: DocumentTypeInfo[] = [
  { id: 'purchase-order-pdf', label: 'Purchase Order', icon: 'document-text', color: 'indigo' },
  { id: 'inspection-brief', label: 'Inspection Brief', icon: 'clipboard-check', color: 'cyan' },
  { id: 'shipping-manifest', label: 'Shipping Manifest', icon: 'truck', color: 'amber' },
  { id: 'packing-list', label: 'Packing List', icon: 'package', color: 'emerald' },
]

export interface SourceTypeInfo {
  id: DocumentSourceType
  label: string
}

export const SOURCE_TYPES: SourceTypeInfo[] = [
  { id: 'purchase-order', label: 'Purchase Order' },
  { id: 'inspection', label: 'Inspection' },
  { id: 'transfer', label: 'Transfer' },
]

// =============================================================================
// API Request/Response Types
// =============================================================================

export interface GenerateDocumentRequest {
  sourceEntityType: DocumentSourceType
  sourceEntityId: string
  documentType: GeneratedDocumentType
  trigger: 'auto' | 'manual'
  notes?: string
}

export interface GenerateDocumentResponse {
  success: boolean
  document?: GeneratedDocument
  error?: string
}
