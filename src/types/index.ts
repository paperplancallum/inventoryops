// =============================================================================
// InventoryOps - Complete Type Definitions
// =============================================================================

// -----------------------------------------------------------------------------
// Catalog Types
// -----------------------------------------------------------------------------

export interface Product {
  id: string
  sku: string
  name: string
  unitCost: number
  supplierId: string
  stockLevel: number
  asin: string
  fnsku: string
  status: 'active' | 'inactive' | 'archived'
}

export interface Supplier {
  id: string
  name: string
  contactName: string
  contactEmail: string
  country: string
  productCount: number
  leadTimeDays: number
  paymentTerms: string
}

// -----------------------------------------------------------------------------
// Purchase Order Types
// -----------------------------------------------------------------------------

export type POStatus = 'draft' | 'sent' | 'awaiting_invoice' | 'invoice_received' | 'confirmed' | 'production_complete' | 'ready-to-ship' | 'partially-received' | 'received' | 'cancelled'

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
}

export interface POStatusOption {
  id: POStatus
  label: string
  order: number
}

// -----------------------------------------------------------------------------
// Inventory/Batch Types
// -----------------------------------------------------------------------------

export type BatchStage = 'ordered' | 'factory' | 'inspected' | 'in-transit' | 'warehouse' | 'amazon'

export interface StageHistoryEntry {
  stage: BatchStage
  date: string
  note: string
}

export interface Attachment {
  id: string
  type: 'photo' | 'document'
  name: string
  uploadedAt: string
}

export interface Batch {
  id: string
  sku: string
  productName: string
  quantity: number
  stage: BatchStage
  supplierName: string
  poNumber: string
  shipmentId: string | null
  unitCost: number
  totalCost: number
  orderedDate: string
  expectedArrival: string
  actualArrival: string | null
  notes: string
  stageHistory: StageHistoryEntry[]
  attachments: Attachment[]
}

export type ReconciliationStatus = 'matched' | 'discrepancy'

export interface AmazonReconciliation {
  id: string
  batchId: string
  sku: string
  expectedQuantity: number
  amazonQuantity: number
  discrepancy: number
  status: ReconciliationStatus
  reconciledAt: string
  notes: string
}

export interface PipelineStage {
  id: BatchStage
  label: string
  order: number
}

// -----------------------------------------------------------------------------
// Cost & Payment Types
// -----------------------------------------------------------------------------

export type CostType = 'product' | 'shipping' | 'duties' | 'inspection' | 'storage'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overdue'
export type LinkedEntityType = 'purchase-order' | 'shipment' | 'batch'

export interface PaymentScheduleItem {
  id: string
  description: string
  percentage: number
  amount: number
  dueDate: string
  paidDate: string | null
  paidAmount: number
}

export interface Payment {
  id: string
  date: string
  amount: number
  method: string
  reference: string
  scheduleItemId: string | null
}

export interface Cost {
  id: string
  date: string
  description: string
  type: CostType
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
}

export interface CostTypeOption {
  id: CostType
  label: string
}

export interface FinancialSummary {
  totalCosts: number
  totalPaid: number
  outstanding: number
  upcomingThisWeek: number
  overdueCount: number
}

// -----------------------------------------------------------------------------
// Inspection Types
// -----------------------------------------------------------------------------

export type InspectionStatus = 'scheduled' | 'in-progress' | 'passed' | 'failed' | 'pending-rework' | 're-inspection'
export type DefectSeverity = 'minor' | 'major' | 'critical'
export type DefectType = 'cosmetic' | 'functional' | 'dimensional' | 'packaging' | 'labeling'

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

export interface Inspection {
  id: string
  batchId: string
  batchName: string
  productName: string
  productSku: string
  scheduledDate: string
  completedDate: string | null
  inspector: string
  status: InspectionStatus
  sampleSize: number
  defectsFound: number
  defectRate: number
  result: 'pass' | 'fail' | 'pending'
  defects: Defect[]
  measurements: MeasurementCheck[]
  packaging: PackagingCheck | null
  photos: InspectionPhoto[]
  reworkRequest: ReworkRequest | null
  notes: string
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

// -----------------------------------------------------------------------------
// Brand & Amazon Connection Types
// -----------------------------------------------------------------------------

export interface Brand {
  id: string
  name: string
  description: string | null
  logoUrl: string | null
  createdAt: string
  updatedAt: string
}

export type AmazonConnectionStatus = 'connected' | 'disconnected' | 'expired' | 'pending'
export type AmazonMarketplace = 'US' | 'CA' | 'UK' | 'DE' | 'FR' | 'IT' | 'ES' | 'JP' | 'AU'

export interface AmazonConnection {
  id: string
  sellerId: string
  refreshToken: string
  clientId: string
  clientSecret: string
  marketplaces: AmazonMarketplace[]
  status: AmazonConnectionStatus
  lastSyncAt: string | null
  createdAt: string
  updatedAt: string
}

// -----------------------------------------------------------------------------
// Location Types
// -----------------------------------------------------------------------------

export type LocationType = 'factory' | 'warehouse' | '3pl' | 'port' | 'customs' | 'amazon-fba' | 'amazon-awd'

export interface Location {
  id: string
  name: string
  type: LocationType
  address: string | null
  city: string | null
  state: string | null
  country: string
  postalCode: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

// -----------------------------------------------------------------------------
// Transfer Types
// -----------------------------------------------------------------------------

export type TransferStatus = 'draft' | 'pending' | 'in-transit' | 'delivered' | 'cancelled'
export type ShippingMode = 'ocean' | 'air' | 'ground' | 'rail' | 'courier' | 'multimodal'

export interface TransferLineItem {
  id: string
  transferId: string
  batchId: string
  batchName: string
  productSku: string
  quantity: number
  receivedQuantity: number | null
  discrepancy: number | null
  notes: string | null
}

export interface Transfer {
  id: string
  referenceNumber: string
  sourceLocationId: string
  sourceLocationName: string
  destinationLocationId: string
  destinationLocationName: string
  shippingAgentId: string | null
  shippingAgentName: string | null
  status: TransferStatus
  shippingMode: ShippingMode | null
  carrierName: string | null
  trackingNumber: string | null
  estimatedDepartureDate: string | null
  actualDepartureDate: string | null
  estimatedArrivalDate: string | null
  actualArrivalDate: string | null
  lineItems: TransferLineItem[]
  notes: string | null
  createdAt: string
  updatedAt: string
}

// -----------------------------------------------------------------------------
// Stock Ledger Types
// -----------------------------------------------------------------------------

export type StockMovementType =
  | 'initial_receipt'
  | 'transfer_out'
  | 'transfer_in'
  | 'adjustment_add'
  | 'adjustment_remove'
  | 'amazon_reconcile'

export interface StockLedgerEntry {
  id: string
  batchId: string
  locationId: string
  movementType: StockMovementType
  quantity: number // positive for credit, negative for debit
  transferId: string | null
  notes: string | null
  confirmedAt: string | null
  createdAt: string
}

export interface Stock {
  id: string
  batchId: string
  locationId: string
  locationName: string
  totalQuantity: number
  availableQuantity: number
  reservedQuantity: number
  firstReceivedAt: string
  updatedAt: string
}

// -----------------------------------------------------------------------------
// Shipping Agent Types
// -----------------------------------------------------------------------------

export interface ShippingAgent {
  id: string
  name: string
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  shippingModes: ShippingMode[]
  serviceRegions: string[]
  paymentTerms: string | null
  creditLimit: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

// -----------------------------------------------------------------------------
// Magic Link Types
// -----------------------------------------------------------------------------

export type MagicLinkPurpose = 'invoice-submission' | 'document-upload'
export type MagicLinkEntityType = 'purchase-order' | 'transfer'
export type MagicLinkEventType =
  | 'created'
  | 'sent'
  | 'viewed'
  | 'form_started'
  | 'validation_error'
  | 'submitted'
  | 'expired'
  | 'revoked'
  | 'regenerated'

export interface MagicLink {
  id: string
  token: string
  linkedEntityType: MagicLinkEntityType
  linkedEntityId: string
  purpose: MagicLinkPurpose
  recipientEmail: string | null
  recipientName: string | null
  expiresAt: string
  sentAt: string | null
  viewedAt: string | null
  submittedAt: string | null
  revokedAt: string | null
  createdAt: string
}

export interface MagicLinkEvent {
  id: string
  magicLinkId: string
  eventType: MagicLinkEventType
  ipAddress: string | null
  userAgent: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

// -----------------------------------------------------------------------------
// Supplier Invoice Types
// -----------------------------------------------------------------------------

export type SupplierInvoiceStatus = 'pending' | 'approved' | 'rejected'
export type SupplierInvoiceCostType = 'handling' | 'rush' | 'tooling' | 'shipping' | 'inspection' | 'other'

export interface SupplierInvoiceLineItem {
  id: string
  supplierInvoiceId: string
  poLineItemId: string
  productSku: string
  productName: string
  quantity: number
  originalUnitPrice: number
  submittedUnitPrice: number
  variance: number
  variancePercent: number
}

export interface SupplierInvoiceCost {
  id: string
  supplierInvoiceId: string
  costType: SupplierInvoiceCostType
  description: string
  amount: number
  isPerUnit: boolean
  unitCount: number | null
}

export interface SupplierInvoice {
  id: string
  purchaseOrderId: string
  purchaseOrderNumber: string
  supplierName: string
  status: SupplierInvoiceStatus
  submittedAt: string
  reviewedAt: string | null
  reviewedBy: string | null
  reviewNotes: string | null
  previousInvoiceId: string | null
  lineItems: SupplierInvoiceLineItem[]
  additionalCosts: SupplierInvoiceCost[]
  totalOriginal: number
  totalSubmitted: number
  totalVariance: number
  createdAt: string
  updatedAt: string
}

// -----------------------------------------------------------------------------
// Price History Types
// -----------------------------------------------------------------------------

export type PriceChangeReason = 'initial' | 'supplier_invoice' | 'manual_edit'

export interface POLineItemPriceHistory {
  id: string
  poLineItemId: string
  oldUnitPrice: number
  newUnitPrice: number
  changeReason: PriceChangeReason
  supplierInvoiceId: string | null
  changedBy: string | null
  notes: string | null
  changedAt: string
}

// -----------------------------------------------------------------------------
// Generated Document Types
// -----------------------------------------------------------------------------

export type GeneratedDocumentType = 'purchase-order-pdf' | 'inspection-brief' | 'shipping-manifest' | 'packing-list'
export type GeneratedDocumentEntityType = 'purchase-order' | 'inspection' | 'transfer'

export interface GeneratedDocument {
  id: string
  sourceEntityType: GeneratedDocumentEntityType
  sourceEntityId: string
  documentType: GeneratedDocumentType
  fileName: string
  fileUrl: string
  fileSize: number
  dataSnapshot: Record<string, unknown>
  generatedBy: string
  generatedAt: string
}

// -----------------------------------------------------------------------------
// Product Spec Sheet Types
// -----------------------------------------------------------------------------

export interface ProductSpecSheet {
  id: string
  productId: string
  version: string
  fileName: string
  fileUrl: string
  fileSize: number
  uploadedBy: string
  uploadedAt: string
  notes: string | null
}

// -----------------------------------------------------------------------------
// Inspection Agent Types
// -----------------------------------------------------------------------------

export interface InspectionAgent {
  id: string
  name: string
  company: string | null
  contactEmail: string
  contactPhone: string | null
  region: string
  specialties: string[]
  hourlyRate: number | null
  currency: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

// -----------------------------------------------------------------------------
// Activity Log Types
// -----------------------------------------------------------------------------

export type ActivityAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'status_change'
  | 'comment'
  | 'upload'
  | 'download'

export interface ActivityLogEntry {
  id: string
  entityType: string
  entityId: string
  entityName: string
  action: ActivityAction
  description: string
  changes: Record<string, { old: unknown; new: unknown }> | null
  userId: string
  userName: string
  userEmail: string
  ipAddress: string | null
  createdAt: string
}
