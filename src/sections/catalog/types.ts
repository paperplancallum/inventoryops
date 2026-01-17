// =============================================================================
// Catalog Types
// =============================================================================

// Product type for BOM/assembly classification
export type ProductType = 'simple' | 'component' | 'finished_good'

// Amazon marketplace type
export type AmazonMarketplace =
  | 'US' | 'CA' | 'MX' | 'BR'
  | 'UK' | 'DE' | 'FR' | 'IT' | 'ES' | 'NL' | 'SE' | 'PL' | 'BE' | 'TR'
  | 'JP' | 'AU' | 'SG' | 'IN' | 'AE' | 'SA'

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
  marketplace: AmazonMarketplace
  asin: string
  fnsku?: string
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
  fileName: string
  fileUrl: string
  storagePath?: string  // For deletion from storage
  fileSize: number
  uploadedAt: string
  uploadedById: string
  uploadedByName: string
  version: string
  notes?: string
}

// Complete stock breakdown for a product
export interface StockBreakdown {
  inProduction: {
    total: number
    factoryStock: StockByLocation[]
    pendingPOs: PendingPOStock[]
  }
  inTransfer: {
    total: number
    transfers: InTransitStock[]
  }
  warehouseStock: {
    total: number
    locations: StockByLocation[]
  }
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
  productId?: string
  sku: string
  condition: SKUCondition
  asin?: string
  fnsku?: string
  marketplaceListings?: MarketplaceListing[]
  upc?: string
  ean?: string
  stockLevel: number
  stockBreakdown?: StockBreakdown
  isDefault: boolean
  unitCostOverride?: number
  notes?: string
  createdAt?: string
  updatedAt?: string
}

// Main Product interface
export interface Product {
  id: string
  brandId: string
  name: string
  description?: string
  category?: string
  unitCost: number
  supplierId: string
  status: 'active' | 'inactive' | 'archived'
  productType: ProductType
  specSheet?: ProductSpecSheet
  createdAt?: string
  updatedAt?: string

  // Product image
  imageUrl?: string
  imageStoragePath?: string

  // Multi-SKU support
  skus?: ProductSKU[]

  // Primary/default identifiers (for backward compatibility)
  sku: string
  asin: string
  fnsku?: string
  stockLevel: number
  stockBreakdown?: StockBreakdown
}

// Supplier reference for display (minimal supplier data)
export interface SupplierReference {
  id: string
  name: string
}

// Brand reference for filtering and display
export interface BrandReference {
  id: string
  name: string
}

// =============================================================================
// Form Data Types
// =============================================================================

export interface ProductFormData {
  name: string
  description?: string
  category?: string
  brandId: string
  supplierId: string
  unitCost: number
  sku: string
  asin?: string
  fnsku?: string
  status: 'active' | 'inactive' | 'archived'
  productType: ProductType
}

export interface SKUFormData {
  sku: string
  condition: SKUCondition
  asin: string
  fnsku?: string
  upc?: string
  ean?: string
  isDefault: boolean
  notes?: string
}

// =============================================================================
// Component Props
// =============================================================================

export interface CatalogProps {
  products: Product[]
  suppliers: SupplierReference[]
  brands: BrandReference[]
  selectedBrandId?: string | null
  onBrandFilterChange?: (brandId: string | null) => void

  // Product actions
  onCreateProduct?: () => void
  onEditProduct?: (id: string) => void
  onArchiveProduct?: (id: string) => void
  onDeleteProduct?: (id: string) => void
  onImportProducts?: () => void
  onExportProducts?: () => void

  // Form submission (for database persistence)
  onFormSubmit?: (data: ProductFormData, productId?: string) => Promise<void>

  // Refresh
  onRefresh?: () => void
  loading?: boolean

  // Product image actions
  onUpdateProductImage?: (productId: string, imageUrl: string, storagePath: string) => void
  onRemoveProductImage?: (productId: string) => void
}

export interface ProductsTableProps {
  products: Product[]
  suppliers: SupplierReference[]
  brands: BrandReference[]
  selectedBrandId?: string | null
  onBrandFilterChange?: (brandId: string | null) => void
  getSupplierName: (supplierId: string) => string
  getBrandName: (brandId: string) => string
  onCreate?: () => void
  onEdit?: (id: string) => void
  onArchive?: (id: string) => void
  onDelete?: (id: string) => void
  onImport?: () => void
  onExport?: () => void
  onSelectProduct?: (productId: string | null) => void
}

export interface ProductDetailPanelProps {
  product: Product
  supplierName: string
  brandName: string
  specSheetVersions?: ProductSpecSheet[]
  onClose: () => void
  onEdit?: () => void
  onAddSKU?: (productId: string) => void
  onEditSKU?: (productId: string, skuId: string) => void
  onDeleteSKU?: (productId: string, skuId: string) => void
  onUploadSpecSheet?: (productId: string, file: File) => void
  onDownloadSpecSheet?: (productId: string) => void
  onDeleteSpecSheet?: (productId: string) => void
  onLoadVersionHistory?: (productId: string) => void
}

export interface ProductFormProps {
  product?: Product
  suppliers: SupplierReference[]
  brands: BrandReference[]
  onSubmit?: (data: ProductFormData) => void
  onCancel?: () => void
  onAddSupplier?: () => void
}

export interface StockBreakdownPopoverProps {
  stockBreakdown: StockBreakdown
  totalStock: number
  trigger: React.ReactNode
}

export interface SKUVariantsTableProps {
  skus: ProductSKU[]
  onAddSKU?: () => void
  onEditSKU?: (skuId: string) => void
  onDeleteSKU?: (skuId: string) => void
}

export interface AddSKUModalProps {
  productId: string
  productName: string
  existingSkus: ProductSKU[]
  onSubmit: (sku: ProductSKU) => void
  onCancel: () => void
}

// =============================================================================
// Utility Types
// =============================================================================

export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  key: keyof Product | 'supplierName' | 'brandName'
  direction: SortDirection
}

export type ProductFilterStatus = 'all' | 'active' | 'inactive' | 'archived'
