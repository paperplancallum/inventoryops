// =============================================================================
// View Types
// =============================================================================

import type { PaymentMilestone, PaymentTermsTemplate } from '../invoices-and-payments/types'

export type TransfersViewTab = 'transfers' | 'shipping-agents' | 'amazon-shipments'

// =============================================================================
// Shipping Agent Types
// =============================================================================

export type ShippingService = 'ocean' | 'air' | 'trucking' | 'rail' | 'courier'

export interface ShippingAgentAddress {
  street?: string
  city: string
  state?: string
  country: string
  postalCode?: string
}

export interface ShippingAgentMessage {
  id: string
  direction: 'outbound' | 'inbound' | 'note'
  senderName: string
  senderEmail?: string
  timestamp: string
  content: string
  attachments?: {
    id: string
    name: string
    type: string
    url: string
  }[]
}

export interface ShippingAgent {
  id: string
  name: string
  contactName: string
  email: string
  phone: string
  services: ShippingService[]
  address?: ShippingAgentAddress
  accountNumber?: string
  website?: string
  notes?: string
  isActive: boolean
  messages?: ShippingAgentMessage[]
  unreadCount?: number
  createdAt?: string
  updatedAt?: string
  /** Payment terms string for display */
  paymentTerms?: string
  /** ID of the payment terms template to use */
  paymentTermsTemplateId?: string
  /** Custom payment milestones (overrides template if provided) */
  customPaymentMilestones?: PaymentMilestone[]
}

export interface ShippingServiceOption {
  id: ShippingService
  label: string
  icon?: string
}

// =============================================================================
// Location Types
// =============================================================================

export type LocationType =
  | 'factory'
  | 'warehouse'
  | '3pl'
  | 'amazon-fba'
  | 'amazon-awd'
  | 'port'
  | 'customs'

export interface Location {
  id: string
  name: string
  type: LocationType
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  contactName: string
  contactEmail: string
  contactPhone: string
  notes: string
  isActive: boolean
}

// =============================================================================
// Transfer Types
// =============================================================================

export type TransferStatus =
  | 'draft'
  | 'booked'
  | 'in-transit'
  | 'delivered'
  | 'completed'
  | 'cancelled'

export type ShippingMethod =
  | 'ocean-fcl'
  | 'ocean-lcl'
  | 'air-freight'
  | 'air-express'
  | 'ground'
  | 'rail'
  | 'courier'

export type DocumentType =
  | 'bill-of-lading'
  | 'proof-of-delivery'
  | 'customs-form'
  | 'commercial-invoice'
  | 'packing-list'
  | 'certificate-of-origin'
  | 'insurance-certificate'
  | 'other'

export type CustomsStatus = 'pending' | 'in-progress' | 'cleared' | 'held'

export type AmazonReceivingStatus = 'checked-in' | 'receiving' | 'received' | 'closed'

export interface TrackingNumber {
  id: string
  carrier: string
  number: string
  url: string | null
}

export interface TransferDocument {
  id: string
  type: DocumentType
  name: string
  uploadedAt: string
}

export interface TransferCosts {
  freight: number
  insurance: number
  duties: number
  taxes: number
  handling: number
  other: number
  currency: string
}

export interface CustomsInfo {
  hsCode: string
  customsBroker: string
  customsStatus: CustomsStatus
  entryNumber: string
  clearanceDate: string | null
  notes: string
}

export interface AmazonReceiving {
  status: AmazonReceivingStatus
  checkedInDate: string | null
  receivingStartedDate: string | null
  receivedDate: string | null
  closedDate: string | null
  discrepancy: number
  notes: string
}

export type InvoiceCostCategory = 'freight' | 'duties' | 'insurance' | 'handling' | 'taxes' | 'other'

export interface TransferInvoice {
  id: string
  fileName: string
  fileUrl: string  // In real app, would be S3/storage URL
  uploadedAt: string
  amount: number
  currency: string
  allocatedTo: InvoiceCostCategory
  notes?: string
}

export interface StatusHistoryEntry {
  status: TransferStatus
  date: string
  note: string
}

/** @deprecated Use TransferLineItem instead for partial transfer support */
export interface TransferBatch {
  id: string
  sku: string
  productName: string
  quantity: number
}

export type TransferLineItemStatus =
  | 'pending'          // Not yet shipped
  | 'in_transit'       // Shipped but not received
  | 'received'         // Received at destination
  | 'partial'          // Partially received (discrepancy)
  | 'cancelled'        // Line item cancelled

/**
 * A line item within a Transfer specifying stock to move.
 * Enables partial transfers (e.g., transferring 500 of 1000 units from a batch).
 */
export interface TransferLineItem {
  id: string
  transferId: string
  // Source stock identification
  batchId: string
  sku: string
  productName: string
  // Quantity to transfer (can be less than available)
  quantity: number
  // Cost (proportionally allocated from batch)
  unitCost: number
  totalCost: number
  // Status tracking
  status: TransferLineItemStatus
  // Receiving information
  receivedQuantity: number | null
  discrepancy: number | null
  receivedAt: string | null
  receivedNotes: string
  // Ledger entry references (created when transfer processes)
  debitLedgerEntryId: string | null
  creditLedgerEntryId: string | null
}

export interface Transfer {
  id: string
  transferNumber: string
  status: TransferStatus
  sourceLocationId: string
  sourceLocationName: string
  destinationLocationId: string
  destinationLocationName: string
  // Shipping agent reference
  shippingAgentId?: string
  shippingAgentName?: string
  // Line items for partial transfer support (replaces batches)
  lineItems: TransferLineItem[]
  // Computed totals from line items
  totalUnits: number
  totalValue: number
  // Legacy field for backwards compatibility
  /** @deprecated Use lineItems instead */
  batches?: TransferBatch[]
  carrier: string
  carrierAccountNumber: string
  shippingMethod: ShippingMethod
  trackingNumbers: TrackingNumber[]
  containerNumbers: string[]
  scheduledDepartureDate: string
  actualDepartureDate: string | null
  scheduledArrivalDate: string
  actualArrivalDate: string | null
  incoterms: string
  costs: TransferCosts
  invoices: TransferInvoice[]
  documents: TransferDocument[]
  customsInfo: CustomsInfo
  amazonReceiving: AmazonReceiving | null
  /** Amazon Shipment ID (e.g., "FBA17ABC1234") - links to Amazon inbound shipment */
  amazonShipmentId: string | null
  notes: string
  statusHistory: StatusHistoryEntry[]
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

// =============================================================================
// Option Types for UI
// =============================================================================

export interface TransferStatusOption {
  id: TransferStatus
  label: string
  order: number
}

export interface ShippingMethodOption {
  id: ShippingMethod
  label: string
}

export interface LocationTypeOption {
  id: LocationType
  label: string
}

export interface DocumentTypeOption {
  id: DocumentType
  label: string
}

// =============================================================================
// Component Props
// =============================================================================

export interface TransfersProps {
  transfers: Transfer[]
  locations: Location[]
  transferStatuses: TransferStatusOption[]
  shippingMethods: ShippingMethodOption[]
  // Shipping agents data
  shippingAgents?: ShippingAgent[]
  shippingServices?: ShippingServiceOption[]
  // Transfer callbacks
  onViewTransfer?: (id: string) => void
  onEditTransfer?: (id: string) => void
  onDeleteTransfer?: (id: string) => void
  onCreateTransfer?: () => void
  onUpdateStatus?: (id: string, newStatus: TransferStatus) => void
  onAddDocument?: (transferId: string, file: File) => void
  onRemoveDocument?: (transferId: string, documentId: string) => void
  onManageLocations?: () => void
  // Shipping agent callbacks
  onViewAgent?: (id: string) => void
  onEditAgent?: (id: string) => void
  onDeleteAgent?: (id: string) => void
  onCreateAgent?: () => void
  onToggleAgentActive?: (id: string) => void
  /** Called when user wants to generate a shipping manifest PDF */
  onGenerateManifest?: (id: string) => void
  /** Called when user wants to view document history for a transfer */
  onViewDocumentHistory?: (id: string) => void
}

export interface TransferDetailProps {
  transfer: Transfer
  locations: Location[]
  /** Whether an invoice already exists for this transfer */
  hasInvoice?: boolean
  /** Invoice ID if it exists (for viewing) */
  invoiceId?: string | null
  onEdit?: () => void
  onClose?: () => void
  onUpdateStatus?: (newStatus: TransferStatus) => void
  onAddDocument?: (file: File) => void
  onRemoveDocument?: (documentId: string) => void
  onAddTrackingNumber?: (tracking: Omit<TrackingNumber, 'id'>) => void
  onRemoveTrackingNumber?: (trackingId: string) => void
  onUpdateAmazonReceiving?: (update: Partial<AmazonReceiving>) => void
  /** Called when user updates the Amazon Shipment ID */
  onUpdateAmazonShipmentId?: (shipmentId: string | null) => void
  /** Called when user wants to create an invoice */
  onCreateInvoice?: (transferId: string) => void
  /** Called when user wants to view the existing invoice */
  onViewInvoice?: (invoiceId: string) => void
  /** Called when user wants to generate a shipping manifest PDF */
  onGenerateManifest?: () => void
  /** Called when user wants to view document history */
  onViewDocumentHistory?: () => void
}

/** Stock data for the transfer form (imported from inventory types) */
export interface AvailableStock {
  id: string
  batchId: string
  sku: string
  productName: string
  locationId: string
  locationName: string
  availableQuantity: number
  unitCost: number
  poNumber: string
  supplierName: string
}

/** Line item input for the transfer form */
export interface TransferLineItemInput {
  stockId: string
  batchId: string
  sku: string
  productName: string
  quantity: number              // Quantity to transfer (up to availableQuantity)
  availableQuantity: number     // Max available
  unitCost: number
}

/** Initial line item data when coming from Inventory page */
export interface InitialTransferLineItem {
  stockId: string
  batchId: string
  sku: string
  productName: string
  availableQuantity: number
  unitCost: number
  sourceLocationId: string
  sourceLocationName: string
}

export interface TransferFormProps {
  transfer?: Transfer
  locations: Location[]
  /** Available stock to select from (filtered by source location) */
  availableStock: AvailableStock[]
  shippingMethods: ShippingMethodOption[]
  /** Pre-selected stock IDs (from inventory page multi-select) */
  preSelectedStockIds?: string[]
  /** Initial line items when opening from Inventory page */
  initialLineItems?: InitialTransferLineItem[]
  /** Initial source location (from selected stock) */
  initialSourceLocationId?: string
  /** Whether the form is open (for modal usage) */
  isOpen?: boolean
  onSubmit?: (data: TransferFormData) => void
  onCancel?: () => void
  onClose?: () => void
  /** Location types for the "Add New Location" form */
  locationTypes?: LocationTypeOption[]
  /** Callback when a new location is created from within the form */
  onLocationCreated?: (location: Location) => void
  /** @deprecated Use availableStock instead */
  availableBatches?: TransferBatch[]
}

export interface TransferFormData {
  sourceLocationId: string
  destinationLocationId: string
  /** Line items with quantities (replaces batchIds) */
  lineItems: {
    stockId: string
    batchId: string
    quantity: number
  }[]
  /** @deprecated Use lineItems instead */
  batchIds?: string[]
  carrier: string
  carrierAccountNumber: string
  shippingMethod: ShippingMethod
  scheduledDepartureDate: string
  scheduledArrivalDate: string
  incoterms: string
  costs: TransferCosts
  invoices: Omit<TransferInvoice, 'id' | 'uploadedAt'>[]
  customsInfo: Partial<CustomsInfo>
  /** Amazon Shipment ID (optional, for Amazon FBA/AWD destinations) */
  amazonShipmentId?: string
  notes: string
}

export interface LocationsProps {
  locations: Location[]
  locationTypes: LocationTypeOption[]
  onViewLocation?: (id: string) => void
  onEditLocation?: (id: string) => void
  onDeleteLocation?: (id: string) => void
  onCreateLocation?: () => void
  onToggleActive?: (id: string) => void
}

export interface LocationFormProps {
  location?: Location
  locationTypes: LocationTypeOption[]
  onSubmit?: (data: LocationFormData) => void
  onCancel?: () => void
}

export interface LocationFormData {
  name: string
  type: LocationType
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  contactName: string
  contactEmail: string
  contactPhone: string
  notes: string
}

// =============================================================================
// Shipping Agent Component Props
// =============================================================================

export interface ShippingAgentsViewProps {
  shippingAgents: ShippingAgent[]
  shippingServices: ShippingServiceOption[]
  onViewAgent?: (id: string) => void
  onEditAgent?: (id: string) => void
  onDeleteAgent?: (id: string) => void
  onCreateAgent?: () => void
  onToggleActive?: (id: string) => void
}

export interface ShippingAgentDetailProps {
  agent: ShippingAgent
  onEdit?: () => void
  onClose?: () => void
  onSendMessage?: (agentId: string, content: string, attachments: File[]) => void
  onAddNote?: (agentId: string, content: string) => void
}

export interface ShippingAgentFormProps {
  agent?: ShippingAgent
  shippingServices: ShippingServiceOption[]
  /** Available payment terms templates */
  paymentTermsTemplates?: PaymentTermsTemplate[]
  isOpen?: boolean
  onSubmit?: (data: ShippingAgentFormData) => void
  onCancel?: () => void
}

export interface ShippingAgentFormData {
  name: string
  contactName: string
  email: string
  phone: string
  services: ShippingService[]
  address?: ShippingAgentAddress
  accountNumber?: string
  website?: string
  notes?: string
  paymentTerms?: string
  paymentTermsTemplateId?: string
  customPaymentMilestones?: PaymentMilestone[]
}

// =============================================================================
// Amazon Shipments Types (SP-API Inbound Shipments)
// =============================================================================

export type AmazonShipmentStatus =
  | 'WORKING'           // Being created
  | 'READY_TO_SHIP'     // Ready for pickup
  | 'SHIPPED'           // In transit to Amazon
  | 'IN_TRANSIT'        // With carrier
  | 'DELIVERED'         // At FC, not checked in
  | 'CHECKED_IN'        // At FC, checked in
  | 'RECEIVING'         // Being processed
  | 'CLOSED'            // Fully received
  | 'CANCELLED'
  | 'DELETED'
  | 'ERROR'

export type AmazonShipmentType = 'SP' | 'LTL' | 'FTL'  // Small Parcel, LTL, Full Truck

export type AmazonInboundType = 'FBA' | 'AWD'  // FBA = Fulfillment by Amazon, AWD = Amazon Warehousing & Distribution

export type AmazonLabelsPrepType = 'SELLER_LABEL' | 'AMAZON_LABEL_ONLY' | 'AMAZON_LABEL_PREFERRED'

export interface AmazonShipmentAddress {
  name: string
  addressLine1: string
  city: string
  stateOrRegion: string
  postalCode: string
  countryCode: string
}

export interface AmazonShipmentItem {
  sellerSku: string
  fnSku: string                         // Amazon's internal SKU
  asin?: string
  productName: string
  quantityShipped: number
  quantityReceived: number
  quantityInCase?: number               // Units per case
  prepDetailsList?: string[]            // e.g., ["Polybagging", "Labeling"]
}

export interface AmazonShipment {
  // Core identifiers
  shipmentId: string                    // Amazon's FBA shipment ID (FBA...)
  shipmentConfirmationId?: string       // Reference ID
  shipmentName: string                  // User-created name

  // Inbound program type
  inboundType: AmazonInboundType        // FBA or AWD

  // Status & dates
  status: AmazonShipmentStatus
  createdDate: string
  lastUpdatedDate: string

  // Destination
  destinationFulfillmentCenterId: string  // e.g., "PHX7", "ONT8"
  destinationAddress?: AmazonShipmentAddress

  // Shipping details
  shipmentType: AmazonShipmentType
  carrierName?: string
  trackingIds?: string[]

  // Box/case info
  boxCount: number
  estimatedBoxContentsFee?: number        // Fee if not providing box contents

  // Appointment (for LTL/FTL)
  deliveryWindow?: {
    start: string
    end: string
  }
  freightReadyDate?: string

  // Labels
  labelsPrepType: AmazonLabelsPrepType
  areCasesRequired: boolean

  // Contents summary
  totalUnits: number
  totalSkus: number

  // Line items (expandable sub-rows)
  items: AmazonShipmentItem[]

  // Link to internal transfer (if mapped)
  linkedTransferId?: string
}

// =============================================================================
// Amazon Shipments Component Props
// =============================================================================

export interface AmazonShipmentsViewProps {
  shipments: AmazonShipment[]
  onRefreshShipment?: (shipmentId: string) => void
  onViewShipmentDetails?: (shipmentId: string) => void
  onLinkToTransfer?: (shipmentId: string) => void
}

export interface AmazonShipmentRowProps {
  shipment: AmazonShipment
  isExpanded: boolean
  onToggleExpand: () => void
  onRefresh?: () => void
  onViewDetails?: () => void
}

export interface AmazonShipmentItemsTableProps {
  items: AmazonShipmentItem[]
}
