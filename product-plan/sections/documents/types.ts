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
  generatedById: string
  /** User name for display */
  generatedByName: string
  /** URL/path to the stored PDF file */
  pdfUrl: string
  /** File size in bytes */
  fileSize: number
  /** JSON snapshot of source data at generation time */
  dataSnapshot: Record<string, unknown>
  /** Optional notes about this generation */
  notes?: string
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
 * The inspection report/results come FROM the agency afterward.
 */
export interface InspectionBriefSnapshot {
  inspectionId: string
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
  /** Line items to be inspected */
  lineItems: Array<{
    productSku: string
    productName: string
    orderedQuantity: number
    /** URL to product specification sheet */
    specSheetUrl?: string
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
    /** Weight per unit in kg */
    unitWeight?: number
    /** Total weight in kg */
    totalWeight?: number
    /** Dimensions (LxWxH in cm) */
    dimensions?: string
    /** Packaging type */
    packagingType?: string
    /** Number of cartons */
    cartonCount?: number
  }>
  totalUnits: number
  totalValue: number
  /** Total weight of shipment in kg */
  totalWeight?: number
  /** Total volume in cbm */
  totalVolume?: number
  /** Number of pallets */
  palletCount?: number
  /** Total carton count */
  totalCartonCount?: number
  /** Special handling instructions */
  specialInstructions?: string
  /** Hazmat classification if applicable */
  hazmatClass?: string
  /** Temperature requirements if applicable */
  temperatureRequirements?: string
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
  /** Detailed packing breakdown */
  packages: Array<{
    packageId: string
    packageType: 'carton' | 'pallet' | 'crate' | 'other'
    packageNumber: string  // e.g., "1 of 10"
    weight?: number
    dimensions?: string
    contents: Array<{
      sku: string
      productName: string
      quantity: number
    }>
  }>
  /** Summary totals */
  totalPackages: number
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
