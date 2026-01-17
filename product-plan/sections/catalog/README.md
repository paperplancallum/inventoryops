# Catalog

## Overview
The Catalog section manages products (SKUs) and suppliers as the foundational data for InventoryOps. It provides two tabbed views - Products and Suppliers - with rich list displays, quick add/edit via modal forms, and bulk operations.

## User Flows
- View and browse all products in a filterable table (SKU, name, cost, supplier, stock, ASIN/FNSKU, status)
- Add a new product via modal form, linking it to a primary supplier
- Edit an existing product's details via modal
- Archive or delete inactive products
- Search and filter products by supplier, status, or other criteria
- Bulk import products from CSV
- Export products to CSV
- View product detail panel with full info, SKU variants, and stock breakdown

## Design Decisions
- Tab navigation between Products and Suppliers views within the same section
- Product detail via slide-over panel (not separate page)
- Multi-SKU support with variants for different conditions (new, refurbished, used)
- Stock breakdown popover shows quantities across all locations
- Per-marketplace ASIN/FNSKU support for multi-marketplace selling

## Data Used
**Entities:** Product, ProductSKU, MarketplaceListing, StockBreakdown, StockByLocation, InTransitStock, PendingPOStock, ProductSpecSheet, SupplierReference, BrandReference

**From global model:** Products, Suppliers, Brands, Locations (for stock breakdown)

## Visual Reference
See `screenshot.png` for the target UI design.

## Components Provided
- `CatalogView` - Main tabbed view with Products and Suppliers tables
- `ProductTable` - Sortable, filterable table of products
- `ProductDetailPanel` - Slide-over panel showing full product details
- `ProductForm` - Modal form for creating/editing products
- `StockBreakdownPopover` - Popover showing stock by location
- `SKUVariantsTable` - Table of SKU variants within product detail

## Callback Props
| Callback | Description |
|----------|-------------|
| `onCreateProduct` | Called when user clicks "Add Product" button |
| `onEditProduct` | Called when user wants to edit a product (receives id) |
| `onArchiveProduct` | Called when user archives a product (receives id) |
| `onDeleteProduct` | Called when user deletes a product (receives id) |
| `onImportProducts` | Called when user initiates CSV import |
| `onExportProducts` | Called when user exports products to CSV |
| `onBrandFilterChange` | Called when user changes brand filter (receives brandId or null) |
