# Milestone 2: Catalog

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete

---

## Goal

Enable users to manage their product catalog with SKUs, Amazon identifiers, cost information, and stock visibility.

## Overview

The Catalog section is the central product database. Users can view, add, edit, and organize products (SKUs) with their Amazon identifiers (ASIN, FNSKU), cost information, supplier links, and stock levels. Products can be organized into Brands for multi-brand sellers.

**Key Functionality:**
- View all products in a searchable, sortable table
- Add new products with Amazon identifiers and cost info
- Edit existing product details
- View product details in slide-over panel
- Filter products by brand, status, or supplier
- See stock breakdown by location (popover)
- Manage brands for product organization
- Import/export products via CSV

## Recommended Approach: Test-Driven Development

Before implementing this section, **write tests first** based on the test specifications provided.

See `product-plan/sections/catalog/tests.md` for detailed test-writing instructions.

**TDD Workflow:**
1. Read `tests.md` and write failing tests for the key user flows
2. Implement the feature to make tests pass
3. Refactor while keeping tests green

## What to Implement

### Components

Copy the section components from `product-plan/sections/catalog/components/`

### Data Layer

The components expect these data shapes:

```typescript
interface Product {
  id: string
  brandId: string
  name: string
  description?: string
  category?: string
  unitCost: number
  supplierId: string
  status: 'active' | 'inactive' | 'archived'
  specSheet?: ProductSpecSheet

  // SKU variants support
  skus?: ProductSKU[]

  // Primary/default identifiers
  sku: string
  asin: string
  fnsku?: string
  stockLevel: number
  stockBreakdown?: StockBreakdown
}

interface ProductSKU {
  id: string
  sku: string
  condition: SKUCondition
  asin: string
  fnsku?: string
  marketplaceListings?: MarketplaceListing[]
  stockLevel: number
  isDefault: boolean
}

interface BrandReference {
  id: string
  name: string
}

interface SupplierReference {
  id: string
  name: string
}
```

See `product-plan/sections/catalog/types.ts` for full type definitions.

### Callbacks

Wire up these user actions:

- `onCreateProduct` - Opens form/modal to add new product
- `onEditProduct(id)` - Opens form/modal to edit product
- `onArchiveProduct(id)` - Archives the product (soft delete)
- `onDeleteProduct(id)` - Permanently removes product
- `onImportProducts` - Opens CSV import dialog
- `onExportProducts` - Triggers CSV download
- `onBrandFilterChange(brandId | null)` - Filters by brand

### Empty States

Implement empty state UI for:
- No products yet (first-time user)
- No products match filter criteria
- No brands yet (when brand management is accessed)

## Files to Reference

- `product-plan/sections/catalog/README.md` - Section overview
- `product-plan/sections/catalog/components/` - React components
- `product-plan/sections/catalog/types.ts` - TypeScript interfaces
- `product-plan/sections/catalog/data.json` - Sample data
- `product-plan/sections/catalog/tests.md` - Test specifications
- `product-plan/data-model/data-model.md` - Entity relationships

## Expected User Flows

### View Products List
1. User navigates to Catalog
2. System displays products table with columns: SKU, Name, ASIN, Supplier, Unit Cost, Stock, Status
3. User can search by SKU, name, or ASIN
4. User can sort by any column
5. User can filter by brand, status, or supplier

### Add New Product
1. User clicks "Add Product" button
2. Form opens with fields: name, SKU, ASIN, FNSKU, brand, supplier, unit cost, status
3. User fills required fields and saves
4. Product appears in catalog table

### View Product Details
1. User clicks a product row
2. Slide-over panel opens showing full details
3. Panel shows: header with image/name/SKU, Amazon identifiers, supplier info, cost, stock breakdown
4. User can click "Edit" to modify product

### Stock Breakdown Popover
1. User hovers/clicks stock cell in table
2. Popover shows quantity at each location (factories, warehouses, Amazon FCs)
3. Shows in-transit quantities
4. Click navigates to Inventory section filtered by this product

## Done When

- [ ] Products table displays with all columns
- [ ] Search filters products by SKU, name, or ASIN
- [ ] Brand filter shows products for selected brand
- [ ] "Add Product" opens form and creates product
- [ ] "Edit Product" opens form with existing data
- [ ] Product detail slide-over shows full information
- [ ] Stock breakdown popover shows location quantities
- [ ] Empty state shows when no products exist
- [ ] Import/export buttons functional
- [ ] Responsive on mobile and desktop
- [ ] Dark mode support works
