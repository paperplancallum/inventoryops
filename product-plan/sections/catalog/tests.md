# Test Instructions: Catalog

These test-writing instructions are **framework-agnostic**.

## Overview
Test the catalog management functionality including product CRUD operations, filtering, sorting, multi-SKU support, and stock breakdown display.

## User Flow Tests

### Flow 1: View Products List
**Scenario:** User navigates to catalog and views all products

#### Success Path
**Setup:** Database contains 10+ products with various statuses (active, inactive, archived)

**Steps:**
1. Navigate to Catalog section
2. Verify Products tab is active by default
3. Observe product table with columns: SKU, Name, Cost, Supplier, Stock, ASIN, Status
4. Verify pagination controls appear when products exceed page size

**Expected Results:**
- [ ] Products table renders with all expected columns
- [ ] Each product row shows correct data from database
- [ ] Status badges display with correct colors (active=green, inactive=gray, archived=red)
- [ ] Pagination shows correct page count

### Flow 2: Add New Product
**Scenario:** User creates a new product

#### Success Path
**Setup:** At least one supplier exists in the system

**Steps:**
1. Click "Add Product" button
2. Modal form opens with empty fields
3. Enter product name: "Test Widget"
4. Enter SKU: "TW-001"
5. Select supplier from dropdown
6. Enter unit cost: 15.99
7. Enter ASIN: "B0TEST12345"
8. Click "Save"

**Expected Results:**
- [ ] Modal opens with all required fields
- [ ] Supplier dropdown populates from database
- [ ] Form validates required fields (name, SKU, supplier)
- [ ] On save, modal closes
- [ ] New product appears in table
- [ ] Success toast notification shows

#### Failure Path: Duplicate SKU
**Setup:** Product with SKU "EXISTING-001" already exists

**Steps:**
1. Open Add Product modal
2. Enter SKU: "EXISTING-001"
3. Fill other required fields
4. Click "Save"

**Expected Results:**
- [ ] Form shows validation error on SKU field
- [ ] Error message: "SKU already exists"
- [ ] Modal remains open
- [ ] No duplicate created

### Flow 3: Edit Product
**Scenario:** User edits an existing product

#### Success Path
**Setup:** Product "Widget A" exists with id "prod-123"

**Steps:**
1. Find "Widget A" in product table
2. Click row or edit action button
3. Modal opens with pre-filled data
4. Change unit cost from 10.00 to 12.50
5. Click "Save"

**Expected Results:**
- [ ] Modal shows current product data
- [ ] All fields are editable
- [ ] On save, table updates with new cost
- [ ] Updated timestamp changes

### Flow 4: Filter Products by Supplier
**Scenario:** User filters products to show only those from a specific supplier

#### Success Path
**Setup:** Products exist from multiple suppliers

**Steps:**
1. Click supplier filter dropdown
2. Select "Acme Manufacturing"
3. Observe table updates

**Expected Results:**
- [ ] Filter dropdown shows all suppliers
- [ ] Table shows only products with selected supplier
- [ ] Product count updates to reflect filter
- [ ] Clear filter button appears

### Flow 5: View Stock Breakdown
**Scenario:** User views detailed stock information for a product

#### Success Path
**Setup:** Product has stock at multiple locations (warehouse, Amazon FBA, in-transit)

**Steps:**
1. Find product with stock in table
2. Click stock quantity cell to open popover
3. View stock breakdown

**Expected Results:**
- [ ] Popover shows stock grouped by location type
- [ ] Factory stock section shows pending POs
- [ ] In-transit section shows transfer details with ETAs
- [ ] Warehouse section lists each warehouse with quantities
- [ ] Amazon section shows FBA and AWD separately
- [ ] Totals sum correctly

## Empty State Tests

### Primary Empty State
**Scenario:** No products exist in the catalog

**Setup:** Empty products table

**Steps:**
1. Navigate to Catalog section

**Expected Results:**
- [ ] Empty state illustration displays
- [ ] Title: "No products yet"
- [ ] Description text explains next steps
- [ ] "Add Product" CTA button is prominent
- [ ] Clicking CTA opens Add Product modal

### Filtered Empty State
**Scenario:** Filter returns no results

**Setup:** Products exist but none match filter criteria

**Steps:**
1. Apply filter that matches no products
2. Observe table state

**Expected Results:**
- [ ] "No products match your filters" message
- [ ] "Clear filters" button available
- [ ] Clicking clear filters resets to all products

## Component Interaction Tests

### Search Functionality
**Setup:** Products with names "Blue Widget", "Red Widget", "Blue Gadget"

**Steps:**
1. Type "Blue" in search box
2. Observe filtered results
3. Clear search
4. Type "xyz" (no matches)

**Expected Results:**
- [ ] Results filter as user types (debounced)
- [ ] Only "Blue Widget" and "Blue Gadget" show
- [ ] Clearing search shows all products
- [ ] No-match search shows empty state

### Column Sorting
**Setup:** Multiple products with varying costs and names

**Steps:**
1. Click "Cost" column header
2. Observe sort order
3. Click again to reverse
4. Click "Name" column header

**Expected Results:**
- [ ] First click sorts ascending
- [ ] Second click sorts descending
- [ ] Sort indicator arrow shows direction
- [ ] Sorting persists through other interactions

### Brand Filter
**Setup:** Products exist across multiple brands

**Steps:**
1. Select brand from brand filter dropdown
2. Observe filtered products
3. Change to different brand
4. Select "All Brands"

**Expected Results:**
- [ ] Only products from selected brand display
- [ ] Brand filter persists with other filters
- [ ] "All Brands" shows complete list

## Edge Cases

### Long Product Names
**Setup:** Product with 200+ character name

**Expected Results:**
- [ ] Name truncates with ellipsis in table
- [ ] Full name shows in detail panel
- [ ] Tooltip shows full name on hover

### Products with No Supplier
**Setup:** Product where supplier was deleted

**Expected Results:**
- [ ] Row displays without crashing
- [ ] Supplier column shows "No supplier" or similar
- [ ] Edit modal prompts to select supplier

### Multi-SKU Products
**Setup:** Product with 5+ SKU variants

**Steps:**
1. Open product detail panel
2. View SKU Variants section

**Expected Results:**
- [ ] All variants display in table
- [ ] Each variant shows condition, ASIN, FNSKU, stock
- [ ] "Add Variant" button available
- [ ] Default variant marked with badge

## Sample Test Data

```typescript
const sampleProduct: Product = {
  id: 'prod-001',
  brandId: 'brand-001',
  name: 'Premium Water Bottle',
  description: '20oz insulated tumbler',
  category: 'Drinkware',
  unitCost: 8.50,
  supplierId: 'sup-001',
  status: 'active',
  sku: 'WB-20OZ-BLK',
  asin: 'B0ABC12345',
  fnsku: 'X00ABC1234',
  stockLevel: 1500,
  skus: [
    {
      id: 'sku-001',
      sku: 'WB-20OZ-BLK-NEW',
      condition: 'new',
      asin: 'B0ABC12345',
      fnsku: 'X00ABC1234',
      stockLevel: 1200,
      isDefault: true
    },
    {
      id: 'sku-002',
      sku: 'WB-20OZ-BLK-REFURB',
      condition: 'refurbished',
      asin: 'B0ABC12346',
      stockLevel: 300,
      isDefault: false
    }
  ]
}

const sampleSupplierRef: SupplierReference = {
  id: 'sup-001',
  name: 'Shenzhen Manufacturing Co.'
}

const sampleBrandRef: BrandReference = {
  id: 'brand-001',
  name: 'HydroMax'
}
```
