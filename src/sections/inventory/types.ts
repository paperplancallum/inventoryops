// =============================================================================
// Data Types
// =============================================================================

export interface Brand {
  id: string
  name: string
}

export type BatchStage = 'ordered' | 'factory' | 'inspected' | 'ready_to_ship' | 'in-transit' | 'warehouse' | 'amazon'

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
  batchNumber: string
  sku: string
  productName: string
  quantity: number                    // Original ordered quantity (immutable)
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
  // Computed from Stock Ledger
  totalUnitsReceived?: number         // Sum of all initial_receipt entries
  totalUnitsRemaining?: number        // Sum of all stock across locations
}

// =============================================================================
// Stock Ledger Types
// =============================================================================

export type StockMovementType =
  | 'initial_receipt'      // First receipt from PO at factory
  | 'transfer_out'         // Debit: stock leaving a location
  | 'transfer_in'          // Credit: stock arriving at a location
  | 'adjustment_add'       // Manual adjustment (found units, correction)
  | 'adjustment_remove'    // Manual adjustment (damaged, lost, correction)
  | 'amazon_reconcile'     // Adjustment from Amazon reconciliation
  | 'assembly_consumption' // Debit: components consumed in work order
  | 'assembly_output'      // Credit: finished goods produced
  | 'batch_split_out'      // Debit: batch split for partial allocation
  | 'batch_split_in'       // Credit: new batch created from split

export type LedgerEntryStatus = 'pending' | 'confirmed' | 'cancelled'

/**
 * An immutable record of a stock movement.
 * The current stock at any location is the sum of all confirmed entries.
 */
export interface StockLedgerEntry {
  id: string
  // What stock is moving
  batchId: string
  sku: string
  productName: string
  // Where
  locationId: string
  locationName: string
  // How much (+ve = credit/in, -ve = debit/out)
  quantity: number
  // Movement details
  movementType: StockMovementType
  status: LedgerEntryStatus
  // Cost tracking
  unitCost: number
  totalCost: number
  // Linkage to related entities
  transferId: string | null
  transferLineItemId: string | null
  // Audit trail
  reason: string
  notes: string
  createdAt: string
  createdBy: string
  confirmedAt: string | null
  confirmedBy: string | null
}

/**
 * Current stock position for a batch at a location.
 * Derived from summing StockLedgerEntries.
 */
export interface Stock {
  id: string
  // Identifies the stock position
  batchId: string
  sku: string
  productName: string
  locationId: string
  locationName: string
  locationType: string
  // Quantity breakdown
  totalQuantity: number              // Total units at this location
  availableQuantity: number          // Units available for transfer
  reservedQuantity: number           // Units reserved by pending transfers
  // Cost information
  unitCost: number
  totalValue: number
  // For FIFO
  firstReceivedAt: string
  lastReceivedAt: string
  // Batch metadata (denormalized)
  poNumber: string
  supplierName: string
  // Brand (denormalized from Product)
  brandId?: string
  brandName?: string
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

// =============================================================================
// Amazon Inventory Types (from SP-API)
// =============================================================================

export type AmazonCondition =
  | 'New'
  | 'Refurbished'
  | 'UsedLikeNew'
  | 'UsedVeryGood'
  | 'UsedGood'
  | 'UsedAcceptable'

/** Amazon marketplace identifiers for North America */
export type AmazonMarketplace = 'US' | 'CA' | 'MX'

export type AmazonMappingStatus = 'mapped' | 'unmapped' | 'pending'

/**
 * Amazon inventory item from SP-API.
 * Represents Amazon's view of your inventory (what they report).
 */
export interface AmazonInventoryItem {
  /** Amazon Standard Identification Number */
  asin: string
  /** Fulfillment Network SKU (Amazon's internal barcode) */
  fnsku?: string
  /** Your seller SKU in Amazon */
  sellerSku: string
  /** Product title as shown on Amazon */
  productName: string
  /** Item condition */
  condition: AmazonCondition
  /** Amazon marketplace (US, CA, MX) */
  marketplace: AmazonMarketplace

  // FBA quantities
  /** Units available for fulfillment */
  fbaFulfillable: number
  /** Units reserved (customer orders, FC transfers, etc.) */
  fbaReserved: number
  /** Inbound shipments being created in Seller Central */
  fbaInboundWorking: number
  /** Inbound shipments in transit to fulfillment center */
  fbaInboundShipped: number
  /** Inbound shipments at FC, being processed/received */
  fbaInboundReceiving: number
  /** Unfulfillable units (damaged, defective, expired, etc.) */
  fbaUnfulfillable: number

  // AWD quantities (Amazon Warehousing & Distribution)
  /** Units stored in AWD */
  awdQuantity: number
  /** Units inbound to AWD */
  awdInboundQuantity: number

  // Mapping to internal catalog
  /** Link to internal ProductSKU.id */
  internalSkuId?: string
  /** Link to internal Product.id */
  internalProductId?: string
  /** Whether this Amazon SKU is linked to internal catalog */
  mappingStatus: AmazonMappingStatus

  // Brand (denormalized from Product)
  /** Brand ID from internal catalog */
  brandId?: string
  /** Brand name from internal catalog */
  brandName?: string

  // Metadata
  /** When this data was last synced from Amazon */
  lastSyncedAt: string
}

/**
 * Summary totals for Amazon inventory.
 */
export interface AmazonInventorySummary {
  /** Total FBA fulfillable units */
  fbaFulfillableTotal: number
  /** Total FBA reserved units */
  fbaReservedTotal: number
  /** Total FBA inbound (working + shipped + receiving) */
  fbaInboundTotal: number
  /** Total FBA unfulfillable units */
  fbaUnfulfillableTotal: number
  /** Total AWD units */
  awdTotal: number
  /** Total AWD inbound units */
  awdInboundTotal: number
  /** Count of Amazon SKUs not linked to internal catalog */
  unmappedSkuCount: number
  /** When inventory was last synced from Amazon */
  lastSyncedAt: string
}

/**
 * Mapping between Amazon SKU and internal catalog SKU.
 */
export interface AmazonSkuMapping {
  id: string
  /** Amazon seller SKU */
  amazonSellerSku: string
  /** Amazon ASIN */
  asin: string
  /** Amazon FNSKU (if available) */
  fnsku?: string
  /** Internal ProductSKU.id */
  internalSkuId: string
  /** Internal Product.id */
  internalProductId: string
  /** When the mapping was created */
  createdAt: string
  /** Who created the mapping */
  createdBy: string
}

export interface PipelineStage {
  id: BatchStage
  label: string
  order: number
}

// =============================================================================
// Aggregation Types (for expandable table views)
// =============================================================================

/**
 * Stock grouped by location within a product.
 * Used in the "By Product" table view.
 */
export interface StockLocationGroup {
  locationId: string
  locationName: string
  locationType: string
  totalQuantity: number
  availableQuantity: number
  reservedQuantity: number
  totalValue: number
  stocks: Stock[]
}

/**
 * Product with stock grouped by location.
 * Used as the parent row in the "By Product" table view.
 */
export interface ProductStockGroup {
  sku: string
  productName: string
  brandId?: string
  brandName?: string
  totalQuantity: number
  availableQuantity: number
  reservedQuantity: number
  totalValue: number
  locationsCount: number
  locationGroups: StockLocationGroup[]
}

/**
 * Product with stock at a specific location.
 * Used in the "By Location" table view.
 */
export interface LocationProductGroup {
  sku: string
  productName: string
  brandId?: string
  brandName?: string
  totalQuantity: number
  availableQuantity: number
  reservedQuantity: number
  totalValue: number
  stocks: Stock[]
}

/**
 * Location with products grouped within it.
 * Used as the parent row in the "By Location" table view.
 */
export interface LocationStockGroup {
  locationId: string
  locationName: string
  locationType: string
  totalQuantity: number
  availableQuantity: number
  reservedQuantity: number
  totalValue: number
  productsCount: number
  productGroups: LocationProductGroup[]
}

// =============================================================================
// Component Props
// =============================================================================

export interface InventoryProps {
  /** The list of batches to display */
  batches: Batch[]
  /** Current stock positions (derived from ledger) */
  stock: Stock[]
  /** Stock ledger entries for movement history */
  stockLedgerEntries: StockLedgerEntry[]
  /** Pipeline stage definitions for kanban columns */
  pipelineStages: PipelineStage[]
  /** Amazon reconciliation records */
  amazonReconciliation: AmazonReconciliation[]

  // Amazon inventory (from SP-API)
  /** Amazon inventory items */
  amazonInventory?: AmazonInventoryItem[]
  /** Amazon inventory summary totals */
  amazonSummary?: AmazonInventorySummary
  /** SKU mappings between Amazon and internal catalog */
  skuMappings?: AmazonSkuMapping[]

  /** Called when user wants to view a batch's details */
  onViewBatch?: (id: string) => void
  /** Called when user wants to edit a batch */
  onEditBatch?: (id: string) => void
  /** Called when user wants to delete a batch */
  onDeleteBatch?: (id: string) => void
  /** Called when user wants to create a new batch */
  onCreateBatch?: () => void
  /** Called when user moves a batch to a new stage */
  onMoveBatch?: (batchId: string, newStage: BatchStage) => void
  /** Called when user wants to split a batch */
  onSplitBatch?: (id: string) => void
  /** Called when user wants to merge batches */
  onMergeBatches?: (batchIds: string[]) => void
  /** Called when user uploads an attachment to a batch */
  onAddAttachment?: (batchId: string, file: File) => void
  /** Called when user removes an attachment from a batch */
  onRemoveAttachment?: (batchId: string, attachmentId: string) => void
  /** Called when user imports Amazon inventory data */
  onImportAmazonData?: () => void
  /** Called when user reconciles a batch with Amazon */
  onReconcileBatch?: (batchId: string) => void
  /** Called when user initiates a transfer from selected stock */
  onInitiateTransfer?: (selectedStockIds: string[]) => void
  /** Called when user views stock movement history */
  onViewStockHistory?: (batchId: string) => void

  // Amazon inventory callbacks
  /** Called when user triggers a sync from Amazon */
  onSyncAmazonInventory?: () => void
  /** Called when user maps an Amazon SKU to internal catalog */
  onMapSku?: (amazonSellerSku: string, internalSkuId: string) => void
  /** Called when user unmaps an Amazon SKU */
  onUnmapSku?: (mappingId: string) => void
  /** Called when user clicks to view Amazon item details */
  onViewAmazonItem?: (asin: string) => void
}
