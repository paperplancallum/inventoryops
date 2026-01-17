// =============================================================================
// Data Types
// =============================================================================

// Re-export Amazon marketplace type from settings
import type { AmazonMarketplace } from '../settings/types'
export type { AmazonMarketplace }

// SKU condition types (for Amazon condition variations)
export type SKUCondition =
  | 'new'
  | 'refurbished'
  | 'used-like-new'
  | 'used-very-good'
  | 'used-good'
  | 'used-acceptable'

// Marketplace listing for a SKU (per-marketplace ASIN/FNSKU)
export interface MarketplaceListing {
  /** Amazon marketplace (US, UK, DE, etc.) */
  marketplace: AmazonMarketplace
  /** Amazon ASIN for this marketplace */
  asin: string
  /** Amazon FNSKU for this marketplace (optional) */
  fnsku?: string
  /** Whether actively listed on this marketplace */
  isActive: boolean
}

// Stock location types for categorization
export type StockLocationType =
  | 'factory'
  | 'warehouse'
  | '3pl'
  | 'amazon-fba'
  | 'amazon-awd'

// Stock at a specific location
export interface StockByLocation {
  locationId: string
  locationName: string
  locationType: StockLocationType
  quantity: number
}

// In-transit stock with source and destination
export interface InTransitStock {
  transferId: string
  quantity: number
  sourceLocationName: string
  destinationLocationName: string
  expectedArrival: string | null
}

// Pending PO quantities (ordered but not yet received at factory)
export interface PendingPOStock {
  poNumber: string
  quantity: number
  expectedDate: string
  status: 'sent' | 'confirmed'
}

// Product specification sheet (PDF attachment)
export interface ProductSpecSheet {
  id: string
  /** Original filename of the uploaded PDF */
  fileName: string
  /** URL to access/download the PDF */
  fileUrl: string
  /** File size in bytes */
  fileSize: number
  /** When the spec sheet was uploaded */
  uploadedAt: string
  /** User ID who uploaded it */
  uploadedById: string
  /** User name for display */
  uploadedByName: string
  /** Version identifier (e.g., "v1.0", "v2.1") */
  version: string
  /** Optional notes about this version */
  notes?: string
}

// Complete stock breakdown for a product
export interface StockBreakdown {
  // "In Production" = factory stock + pending POs
  inProduction: {
    total: number
    factoryStock: StockByLocation[]
    pendingPOs: PendingPOStock[]
  }

  // "In Transfer" = stock currently being moved
  inTransfer: {
    total: number
    transfers: InTransitStock[]
  }

  // Warehouse stock (3PL and owned warehouses)
  warehouseStock: {
    total: number
    locations: StockByLocation[]
  }

  // Amazon stock (FBA and AWD)
  amazonStock: {
    fbaTotal: number
    awdTotal: number
    fbaLocations: StockByLocation[]
    awdLocations: StockByLocation[]
  }
}

// Individual SKU variant (child SKU of a product)
export interface ProductSKU {
  id: string
  /** Seller SKU (e.g., "WB-TUMBLER-20-NEW") */
  sku: string
  /** Item condition for Amazon */
  condition: SKUCondition
  /** Amazon ASIN (default/primary marketplace) */
  asin: string
  /** Amazon FNSKU (Fulfillment Network SKU) - optional if using UPC/EAN */
  fnsku?: string
  /** Per-marketplace listings with marketplace-specific ASINs/FNSKUs */
  marketplaceListings?: MarketplaceListing[]
  /** UPC barcode (optional) */
  upc?: string
  /** EAN barcode (optional) */
  ean?: string
  /** Stock level for this SKU variant */
  stockLevel: number
  /** Detailed stock breakdown by location */
  stockBreakdown?: StockBreakdown
  /** Whether this is the default/primary SKU */
  isDefault: boolean
  /** Additional notes (e.g., "Refurb from returns batch") */
  notes?: string
}

export interface Product {
  id: string
  /** Brand this product belongs to */
  brandId: string
  /** Master product name */
  name: string
  /** Product description */
  description?: string
  /** Product category */
  category?: string
  /** Base unit cost */
  unitCost: number
  /** Primary supplier ID */
  supplierId: string
  /** Product status */
  status: 'active' | 'inactive' | 'archived'
  /** Product specification sheet (single source of truth for product specs) */
  specSheet?: ProductSpecSheet
  /** Creation timestamp */
  createdAt?: string
  /** Last update timestamp */
  updatedAt?: string

  // Multi-SKU support
  /** Array of SKU variants (different conditions, barcodes, etc.) */
  skus?: ProductSKU[]

  // Legacy/computed fields (for backward compatibility with existing code)
  /** Default/primary SKU code */
  sku: string
  /** Default/primary ASIN */
  asin: string
  /** Default/primary FNSKU (optional if using UPC/EAN) */
  fnsku?: string
  /** Total stock level across all SKUs */
  stockLevel: number
  /** Aggregated stock breakdown */
  stockBreakdown?: StockBreakdown
}

// Supplier is now in product/sections/suppliers/types.ts
// This import is for reference when looking up supplier names
export interface SupplierReference {
  id: string
  name: string
}

// Brand reference for looking up brand names in the catalog
export interface BrandReference {
  id: string
  name: string
}

// =============================================================================
// Component Props
// =============================================================================

export interface CatalogProps {
  /** List of products to display */
  products: Product[]
  /** List of suppliers for reference (to display supplier names on products) */
  suppliers: SupplierReference[]
  /** List of brands for filtering and display */
  brands: BrandReference[]
  /** Currently selected brand filter (null = all brands) */
  selectedBrandId?: string | null
  /** Called when brand filter changes */
  onBrandFilterChange?: (brandId: string | null) => void

  // Product actions
  /** Called when user wants to add a new product */
  onCreateProduct?: () => void
  /** Called when user wants to edit a product */
  onEditProduct?: (id: string) => void
  /** Called when user wants to archive a product */
  onArchiveProduct?: (id: string) => void
  /** Called when user wants to delete a product */
  onDeleteProduct?: (id: string) => void
  /** Called when user initiates a bulk import */
  onImportProducts?: () => void
  /** Called when user wants to export products to CSV */
  onExportProducts?: () => void
}
