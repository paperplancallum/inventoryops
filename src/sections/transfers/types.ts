// =============================================================================
// Transfer Types
// =============================================================================

import type { Location } from '@/sections/suppliers/types'

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

export type TransferDocumentType =
  | 'bill-of-lading'
  | 'proof-of-delivery'
  | 'customs-form'
  | 'commercial-invoice'
  | 'packing-list'
  | 'certificate-of-origin'
  | 'insurance-certificate'
  | 'shipping-manifest'
  | 'other'

export type CustomsStatus = 'pending' | 'in-progress' | 'cleared' | 'held'

export type AmazonReceivingStatus = 'checked-in' | 'receiving' | 'received' | 'closed'

export type TransferLineItemStatus =
  | 'pending'
  | 'in_transit'
  | 'received'
  | 'partial'
  | 'cancelled'

// =============================================================================
// Tracking & Documents
// =============================================================================

export interface TrackingNumber {
  id: string
  carrier: string
  trackingNumber: string
  trackingUrl: string | null
  createdAt: string
}

export interface TransferDocument {
  id: string
  documentType: TransferDocumentType
  name: string
  url: string
  storagePath?: string
  size?: number
  uploadedBy?: string
  uploadedByName?: string
  createdAt: string
}

// =============================================================================
// Transfer Costs
// =============================================================================

export interface TransferCosts {
  freight: number
  insurance: number
  duties: number
  taxes: number
  handling: number
  other: number
  currency: string
}

// =============================================================================
// Customs Info
// =============================================================================

export interface CustomsInfo {
  hsCode: string
  broker: string
  status: CustomsStatus
  entryNumber: string
  clearanceDate: string | null
  notes: string
}

// =============================================================================
// Amazon Receiving
// =============================================================================

export interface AmazonReceiving {
  status: AmazonReceivingStatus
  checkedInDate: string | null
  receivingStartedDate: string | null
  receivedDate: string | null
  closedDate: string | null
  discrepancy: number
  notes: string
}

// =============================================================================
// Transfer Line Items
// =============================================================================

export interface TransferLineItem {
  id: string
  transferId: string
  batchId: string
  sku: string
  productName: string
  quantity: number
  unitCost: number
  totalCost: number
  status: TransferLineItemStatus
  receivedQuantity: number | null
  discrepancy: number | null
  receivedAt: string | null
  receivedNotes: string
  debitLedgerEntryId: string | null
  creditLedgerEntryId: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// =============================================================================
// Status History
// =============================================================================

export interface TransferStatusHistoryEntry {
  id: string
  status: TransferStatus
  note: string
  changedBy?: string
  changedByName?: string
  createdAt: string
}

// =============================================================================
// Main Transfer Type
// =============================================================================

export interface Transfer {
  id: string
  transferNumber: string
  status: TransferStatus

  // Locations
  sourceLocationId: string
  sourceLocationName?: string
  sourceLocationType?: string
  destinationLocationId: string
  destinationLocationName?: string
  destinationLocationType?: string

  // Shipping agent
  shippingAgentId?: string
  shippingAgentName?: string

  // Carrier info
  carrier: string
  carrierAccountNumber: string
  shippingMethod: ShippingMethod | null

  // Container numbers (ocean freight)
  containerNumbers: string[]

  // Dates
  scheduledDepartureDate: string | null
  actualDepartureDate: string | null
  scheduledArrivalDate: string | null
  actualArrivalDate: string | null

  // Incoterms
  incoterms: string

  // Costs
  costs: TransferCosts
  totalCost: number

  // Customs
  customsInfo: CustomsInfo

  // Amazon receiving
  amazonReceiving: AmazonReceiving | null
  amazonShipmentId: string | null

  // Line items
  lineItems: TransferLineItem[]
  totalUnits: number
  totalValue: number

  // Tracking and documents
  trackingNumbers: TrackingNumber[]
  documents: TransferDocument[]

  // Status history
  statusHistory: TransferStatusHistoryEntry[]

  // Notes
  notes: string

  // Quote tracking
  quoteConfirmedAt: string | null

  // Audit
  createdBy?: string
  createdByName?: string
  createdAt: string
  updatedAt: string
}

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
  content: string
  isRead: boolean
  attachments?: {
    id: string
    name: string
    type: string
    url: string
  }[]
  createdAt: string
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
  paymentTerms?: string
  paymentTermsTemplateId?: string
  isActive: boolean
  messages?: ShippingAgentMessage[]
  unreadCount?: number
  createdAt: string
  updatedAt: string
}

// =============================================================================
// Amazon Shipment Types (SP-API)
// =============================================================================

export type AmazonShipmentStatus =
  | 'WORKING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CHECKED_IN'
  | 'RECEIVING'
  | 'CLOSED'
  | 'CANCELLED'
  | 'DELETED'
  | 'ERROR'

export type AmazonShipmentType = 'SP' | 'LTL' | 'FTL'

export type AmazonInboundType = 'FBA' | 'AWD'

export interface AmazonShipmentItem {
  id: string
  sellerSku: string
  fnSku: string
  asin?: string
  productName: string
  quantityShipped: number
  quantityReceived: number
  quantityInCase?: number
  prepDetails?: string[]
}

export interface AmazonShipment {
  id: string
  shipmentId: string
  shipmentConfirmationId?: string
  shipmentName: string
  inboundType: AmazonInboundType
  status: AmazonShipmentStatus
  createdDate: string
  lastUpdatedDate: string
  destinationFcId: string
  destinationAddressName?: string
  destinationAddressLine1?: string
  destinationAddressCity?: string
  destinationAddressState?: string
  destinationAddressPostalCode?: string
  destinationAddressCountry?: string
  shipmentType?: AmazonShipmentType
  carrierName?: string
  trackingIds: string[]
  boxCount: number
  estimatedBoxContentsFee?: number
  deliveryWindowStart?: string
  deliveryWindowEnd?: string
  freightReadyDate?: string
  labelsPrepType?: string
  areCasesRequired: boolean
  totalUnits: number
  totalSkus: number
  items: AmazonShipmentItem[]
  linkedTransferId?: string
  lastSyncedAt: string
  createdAt: string
  updatedAt: string
}

// =============================================================================
// Available Stock (for transfer form)
// =============================================================================

export interface AvailableStock {
  id: string
  batchId: string
  sku: string
  productName: string
  locationId: string
  locationName: string
  availableQuantity: number
  allocatedQuantity?: number  // Units allocated to draft transfers
  totalQuantity?: number      // Total units at location (before allocations)
  unitCost: number
  totalValue: number
  poNumber: string
  supplierName: string
}

// =============================================================================
// Form Data Types
// =============================================================================

export interface TransferLineItemInput {
  stockId?: string
  batchId: string
  sku: string
  productName: string
  quantity: number
  availableQuantity: number
  unitCost: number
}

export interface TransferFormData {
  sourceLocationId: string
  destinationLocationId: string
  lineItems: TransferLineItemInput[]
  shippingAgentId?: string
  carrier: string
  carrierAccountNumber: string
  shippingMethod: ShippingMethod | null
  containerNumbers: string[]
  scheduledDepartureDate: string | null
  scheduledArrivalDate: string | null
  incoterms: string
  costs: TransferCosts
  customsInfo: Partial<CustomsInfo>
  amazonShipmentId?: string
  notes: string
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
}

// =============================================================================
// Option Types for UI
// =============================================================================

export interface TransferStatusOption {
  id: TransferStatus
  label: string
  order: number
  color: string
}

export interface ShippingMethodOption {
  id: ShippingMethod
  label: string
}

export interface DocumentTypeOption {
  id: TransferDocumentType
  label: string
}

export interface ShippingServiceOption {
  id: ShippingService
  label: string
}

// =============================================================================
// View/Tab Types
// =============================================================================

export type TransfersViewTab = 'transfers' | 'line-items' | 'shipping-agents' | 'amazon-shipments'

// =============================================================================
// Summary Types
// =============================================================================

export interface TransfersSummary {
  total: number
  draft: number
  booked: number
  inTransit: number
  delivered: number
  completed: number
  cancelled: number
  monthlyFreightCost: number
}

// =============================================================================
// Component Props
// =============================================================================

export interface TransfersViewProps {
  transfers: Transfer[]
  locations: Location[]
  shippingAgents: ShippingAgent[]
  amazonShipments: AmazonShipment[]
  availableStock: AvailableStock[]
  transferStatuses: TransferStatusOption[]
  shippingMethods: ShippingMethodOption[]
  shippingServices: ShippingServiceOption[]
  loading?: boolean
  onViewTransfer?: (id: string) => void
  onEditTransfer?: (id: string) => void
  onDeleteTransfer?: (id: string) => void
  onCreateTransfer?: () => void
  onUpdateStatus?: (id: string, newStatus: TransferStatus) => void
  onAddDocument?: (transferId: string, file: File, type: TransferDocumentType) => void
  onRemoveDocument?: (transferId: string, documentId: string) => void
  onAddTrackingNumber?: (transferId: string, tracking: Omit<TrackingNumber, 'id' | 'createdAt'>) => void
  onRemoveTrackingNumber?: (transferId: string, trackingId: string) => void
  onGenerateManifest?: (id: string) => void
  onViewAgent?: (id: string) => void
  onEditAgent?: (id: string) => void
  onDeleteAgent?: (id: string) => void
  onCreateAgent?: () => void
  onToggleAgentActive?: (id: string) => void
  onViewAmazonShipment?: (shipmentId: string) => void
  onLinkAmazonShipment?: (shipmentId: string, transferId: string) => void
  onSyncAmazonShipments?: () => void
}

export interface TransferDetailPanelProps {
  transfer: Transfer
  locations: Location[]
  isOpen: boolean
  hasInvoice?: boolean
  invoiceId?: string | null
  onClose: () => void
  onEdit?: () => void
  onUpdateStatus?: (newStatus: TransferStatus) => void
  onAddDocument?: (file: File, type: TransferDocumentType) => void
  onRemoveDocument?: (documentId: string) => void
  onAddTrackingNumber?: (tracking: Omit<TrackingNumber, 'id' | 'createdAt'>) => void
  onRemoveTrackingNumber?: (trackingId: string) => void
  onUpdateAmazonReceiving?: (update: Partial<AmazonReceiving>) => void
  onUpdateAmazonShipmentId?: (shipmentId: string | null) => void
  onCreateInvoice?: (transferId: string) => void
  onViewInvoice?: (invoiceId: string) => void
  onGenerateManifest?: () => void
}

export interface TransferFormProps {
  transfer?: Transfer
  locations: Location[]
  availableStock: AvailableStock[]
  shippingMethods: ShippingMethodOption[]
  shippingAgents?: ShippingAgent[]
  isOpen: boolean
  preSelectedBatchIds?: string[]
  initialSourceLocationId?: string
  onSubmit: (data: TransferFormData) => Promise<void>
  onCancel: () => void
  onClose: () => void
}

export interface ShippingAgentsViewProps {
  shippingAgents: ShippingAgent[]
  shippingServices: ShippingServiceOption[]
  loading?: boolean
  onViewAgent?: (id: string) => void
  onEditAgent?: (id: string) => void
  onDeleteAgent?: (id: string) => void
  onCreateAgent?: () => void
  onToggleActive?: (id: string) => void
  onSendMessage?: (agentId: string, content: string, attachments?: File[]) => void
  onAddNote?: (agentId: string, content: string) => void
}

export interface ShippingAgentFormProps {
  agent?: ShippingAgent
  shippingServices: ShippingServiceOption[]
  isOpen: boolean
  onSubmit: (data: ShippingAgentFormData) => Promise<void>
  onCancel: () => void
}

export interface AmazonShipmentsViewProps {
  shipments: AmazonShipment[]
  loading?: boolean
  syncing?: boolean
  lastSyncAt?: string | null
  onRefreshShipment?: (shipmentId: string) => void
  onViewShipmentDetails?: (shipmentId: string) => void
  onLinkToTransfer?: (shipmentId: string) => void
  onSync?: () => void
}

// =============================================================================
// Constants
// =============================================================================

export const TRANSFER_STATUS_OPTIONS: TransferStatusOption[] = [
  { id: 'draft', label: 'Draft', order: 1, color: 'stone' },
  { id: 'booked', label: 'Booked', order: 2, color: 'blue' },
  { id: 'in-transit', label: 'In Transit', order: 3, color: 'amber' },
  { id: 'delivered', label: 'Delivered', order: 4, color: 'emerald' },
  { id: 'completed', label: 'Completed', order: 5, color: 'lime' },
  { id: 'cancelled', label: 'Cancelled', order: 6, color: 'red' },
]

export const SHIPPING_METHOD_OPTIONS: ShippingMethodOption[] = [
  { id: 'ocean-fcl', label: 'Ocean FCL' },
  { id: 'ocean-lcl', label: 'Ocean LCL' },
  { id: 'air-freight', label: 'Air Freight' },
  { id: 'air-express', label: 'Air Express' },
  { id: 'ground', label: 'Ground/Truck' },
  { id: 'rail', label: 'Rail' },
  { id: 'courier', label: 'Courier' },
]

export const DOCUMENT_TYPE_OPTIONS: DocumentTypeOption[] = [
  { id: 'bill-of-lading', label: 'Bill of Lading' },
  { id: 'proof-of-delivery', label: 'Proof of Delivery' },
  { id: 'customs-form', label: 'Customs Form' },
  { id: 'commercial-invoice', label: 'Commercial Invoice' },
  { id: 'packing-list', label: 'Packing List' },
  { id: 'certificate-of-origin', label: 'Certificate of Origin' },
  { id: 'insurance-certificate', label: 'Insurance Certificate' },
  { id: 'shipping-manifest', label: 'Shipping Manifest' },
  { id: 'other', label: 'Other' },
]

export const SHIPPING_SERVICE_OPTIONS: ShippingServiceOption[] = [
  { id: 'ocean', label: 'Ocean Freight' },
  { id: 'air', label: 'Air Freight' },
  { id: 'trucking', label: 'Trucking' },
  { id: 'rail', label: 'Rail' },
  { id: 'courier', label: 'Courier' },
]
