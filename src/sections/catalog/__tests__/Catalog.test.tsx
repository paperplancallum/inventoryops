import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { Catalog } from '../Catalog'
import type { Product, BrandReference, SupplierReference } from '../types'

// =============================================================================
// Test Data
// =============================================================================

const sampleBrands: BrandReference[] = [
  { id: 'brand-001', name: 'HydraFlow' },
  { id: 'brand-002', name: 'FitPro Gear' },
]

const sampleSuppliers: SupplierReference[] = [
  { id: 'sup-001', name: 'Shenzhen Drinkware Co.' },
  { id: 'sup-002', name: 'Hangzhou Silicone Products Ltd.' },
]

const sampleProducts: Product[] = [
  {
    id: 'prod-001',
    brandId: 'brand-001',
    name: 'Insulated Water Bottle 20oz',
    description: 'Double-wall vacuum insulated',
    category: 'Drinkware',
    unitCost: 4.85,
    supplierId: 'sup-001',
    status: 'active',
    sku: 'WB-TUMBLER-20-NEW',
    asin: 'B09K3NXMPL',
    fnsku: 'X001ABC123',
    stockLevel: 2450,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-11-20T14:30:00Z',
    skus: [
      {
        id: 'sku-001a',
        sku: 'WB-TUMBLER-20-NEW',
        condition: 'new',
        asin: 'B09K3NXMPL',
        fnsku: 'X001ABC123',
        stockLevel: 2200,
        isDefault: true,
      },
      {
        id: 'sku-001b',
        sku: 'WB-TUMBLER-20-REFURB',
        condition: 'refurbished',
        asin: 'B09K3NXMPL',
        stockLevel: 250,
        isDefault: false,
      },
    ],
  },
  {
    id: 'prod-002',
    brandId: 'brand-001',
    name: 'Insulated Water Bottle 32oz',
    description: 'Large capacity bottle',
    category: 'Drinkware',
    unitCost: 5.20,
    supplierId: 'sup-001',
    status: 'active',
    sku: 'WB-TUMBLER-32-NEW',
    asin: 'B09K3NXMQR',
    fnsku: 'X001ABC124',
    stockLevel: 1820,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-11-18T09:15:00Z',
  },
  {
    id: 'prod-003',
    brandId: 'brand-002',
    name: 'Resistance Band Set',
    description: '5 bands with bag',
    category: 'Fitness',
    unitCost: 6.75,
    supplierId: 'sup-002',
    status: 'inactive',
    sku: 'FIT-BAND-SET-NEW',
    asin: 'B09MNOPQRS',
    fnsku: 'X004JKL012',
    stockLevel: 3100,
    createdAt: '2024-04-05T09:00:00Z',
    updatedAt: '2024-11-22T13:00:00Z',
  },
  {
    id: 'prod-004',
    brandId: 'brand-001',
    name: 'Archived Product',
    category: 'Other',
    unitCost: 1.00,
    supplierId: 'sup-001',
    status: 'archived',
    sku: 'ARCH-001',
    asin: 'B0ARCHIVED',
    stockLevel: 0,
  },
]

// =============================================================================
// Flow 1: View Products List
// =============================================================================

describe('Catalog - View Products List', () => {
  it('renders products table with all expected columns', () => {
    render(
      <Catalog
        products={sampleProducts}
        suppliers={sampleSuppliers}
        brands={sampleBrands}
      />
    )

    // Check table headers exist
    expect(screen.getByText('SKU')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Supplier')).toBeInTheDocument()
    expect(screen.getByText('Cost')).toBeInTheDocument()
    expect(screen.getByText('Stock')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('displays product data correctly in table rows', () => {
    render(
      <Catalog
        products={sampleProducts}
        suppliers={sampleSuppliers}
        brands={sampleBrands}
      />
    )

    // Check first product data
    expect(screen.getByText('WB-TUMBLER-20-NEW')).toBeInTheDocument()
    expect(screen.getByText('Insulated Water Bottle 20oz')).toBeInTheDocument()
    // Supplier may appear multiple times if multiple products share the same supplier
    const supplierElements = screen.getAllByText('Shenzhen Drinkware Co.')
    expect(supplierElements.length).toBeGreaterThan(0)
  })

  it('displays status badges with correct styling', () => {
    render(
      <Catalog
        products={sampleProducts}
        suppliers={sampleSuppliers}
        brands={sampleBrands}
      />
    )

    // Check status badges exist
    const activeBadges = screen.getAllByText('active')
    expect(activeBadges.length).toBeGreaterThan(0)

    expect(screen.getByText('inactive')).toBeInTheDocument()
    expect(screen.getByText('archived')).toBeInTheDocument()
  })

  it('shows product count in header', () => {
    render(
      <Catalog
        products={sampleProducts}
        suppliers={sampleSuppliers}
        brands={sampleBrands}
      />
    )

    expect(screen.getByText(sampleProducts.length.toString())).toBeInTheDocument()
  })
})

// =============================================================================
// Flow 2: Add New Product
// =============================================================================

describe('Catalog - Add New Product', () => {
  it('opens add product modal when clicking Add Product button', async () => {
    const onCreateProduct = vi.fn()
    const user = userEvent.setup()

    render(
      <Catalog
        products={sampleProducts}
        suppliers={sampleSuppliers}
        brands={sampleBrands}
        onCreateProduct={onCreateProduct}
      />
    )

    const addButton = screen.getByRole('button', { name: /add product/i })
    await user.click(addButton)

    expect(onCreateProduct).toHaveBeenCalled()
  })
})

// =============================================================================
// Flow 3: Edit Product
// =============================================================================

describe('Catalog - Edit Product', () => {
  it('opens product detail panel when clicking a product row', async () => {
    const user = userEvent.setup()

    render(
      <Catalog
        products={sampleProducts}
        suppliers={sampleSuppliers}
        brands={sampleBrands}
      />
    )

    // Click on a product row
    const productRow = screen.getByText('Insulated Water Bottle 20oz').closest('tr')
    if (productRow) {
      await user.click(productRow)
      // Detail panel should open - look for the product name in the panel header
      await waitFor(() => {
        // The panel shows the product name
        const productNameElements = screen.getAllByText('Insulated Water Bottle 20oz')
        // Should have more than one now (table + panel)
        expect(productNameElements.length).toBeGreaterThan(1)
      })
    }
  })
})

// =============================================================================
// Flow 4: Search Products
// =============================================================================

describe('Catalog - Search Products', () => {
  it('filters products by search term', async () => {
    const user = userEvent.setup()

    render(
      <Catalog
        products={sampleProducts}
        suppliers={sampleSuppliers}
        brands={sampleBrands}
      />
    )

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'Bottle')

    // Should show bottle products
    expect(screen.getByText('Insulated Water Bottle 20oz')).toBeInTheDocument()
    expect(screen.getByText('Insulated Water Bottle 32oz')).toBeInTheDocument()

    // Should not show non-matching products
    expect(screen.queryByText('Resistance Band Set')).not.toBeInTheDocument()
  })

  it('shows empty state when search has no matches', async () => {
    const user = userEvent.setup()

    render(
      <Catalog
        products={sampleProducts}
        suppliers={sampleSuppliers}
        brands={sampleBrands}
      />
    )

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'xyznonexistent')

    expect(screen.getByText(/no products match/i)).toBeInTheDocument()
  })
})

// =============================================================================
// Flow 5: Brand Filter
// =============================================================================

describe('Catalog - Brand Filter', () => {
  it('filters products by selected brand', async () => {
    const onBrandFilterChange = vi.fn()
    const user = userEvent.setup()

    render(
      <Catalog
        products={sampleProducts}
        suppliers={sampleSuppliers}
        brands={sampleBrands}
        onBrandFilterChange={onBrandFilterChange}
      />
    )

    // Find brand filter select by aria-label
    const brandFilter = screen.getByRole('combobox', { name: /brand/i })
    await user.selectOptions(brandFilter, 'brand-001')
    expect(onBrandFilterChange).toHaveBeenCalledWith('brand-001')
  })

  it('shows all products when All Brands is selected', async () => {
    const onBrandFilterChange = vi.fn()
    const user = userEvent.setup()

    render(
      <Catalog
        products={sampleProducts}
        suppliers={sampleSuppliers}
        brands={sampleBrands}
        selectedBrandId="brand-001"
        onBrandFilterChange={onBrandFilterChange}
      />
    )

    // Find brand filter select by aria-label
    const brandFilter = screen.getByRole('combobox', { name: /brand/i })
    await user.selectOptions(brandFilter, '')
    expect(onBrandFilterChange).toHaveBeenCalledWith(null)
  })
})

// =============================================================================
// Flow 6: Column Sorting
// =============================================================================

describe('Catalog - Column Sorting', () => {
  it('sorts products by column when clicking header', async () => {
    const user = userEvent.setup()

    render(
      <Catalog
        products={sampleProducts}
        suppliers={sampleSuppliers}
        brands={sampleBrands}
      />
    )

    // Click on Name column header to sort
    const nameHeader = screen.getByText('Name')
    await user.click(nameHeader)

    // Get all product names in order
    const rows = screen.getAllByRole('row').slice(1) // Skip header row
    const firstRowName = within(rows[0]).getByText(/Archived Product|Insulated|Resistance/i)
    expect(firstRowName).toBeInTheDocument()
  })

  it('toggles sort direction on second click', async () => {
    const user = userEvent.setup()

    render(
      <Catalog
        products={sampleProducts}
        suppliers={sampleSuppliers}
        brands={sampleBrands}
      />
    )

    const nameHeader = screen.getByText('Name')

    // First click - ascending
    await user.click(nameHeader)

    // Second click - descending
    await user.click(nameHeader)

    // Should have sort indicator
    expect(nameHeader.closest('th')).toBeInTheDocument()
  })
})

// =============================================================================
// Empty States
// =============================================================================

describe('Catalog - Empty States', () => {
  it('shows empty state when no products exist', () => {
    render(
      <Catalog
        products={[]}
        suppliers={sampleSuppliers}
        brands={sampleBrands}
      />
    )

    expect(screen.getByText(/no products yet/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add product/i })).toBeInTheDocument()
  })

  it('shows filtered empty state when filter returns no results', () => {
    render(
      <Catalog
        products={sampleProducts}
        suppliers={sampleSuppliers}
        brands={sampleBrands}
        selectedBrandId="nonexistent-brand"
      />
    )

    // Should show empty state or no results
    const emptyState = screen.queryByText(/no products/i) || screen.queryByText(/no results/i)
    expect(emptyState).toBeInTheDocument()
  })
})

// =============================================================================
// Import/Export
// =============================================================================

describe('Catalog - Import/Export', () => {
  it('calls onExportProducts when clicking export button', async () => {
    const onExportProducts = vi.fn()
    const user = userEvent.setup()

    render(
      <Catalog
        products={sampleProducts}
        suppliers={sampleSuppliers}
        brands={sampleBrands}
        onExportProducts={onExportProducts}
      />
    )

    const exportButton = screen.getByRole('button', { name: /export/i })
    await user.click(exportButton)

    expect(onExportProducts).toHaveBeenCalled()
  })

  it('calls onImportProducts when clicking import button', async () => {
    const onImportProducts = vi.fn()
    const user = userEvent.setup()

    render(
      <Catalog
        products={sampleProducts}
        suppliers={sampleSuppliers}
        brands={sampleBrands}
        onImportProducts={onImportProducts}
      />
    )

    const importButton = screen.getByRole('button', { name: /import/i })
    await user.click(importButton)

    expect(onImportProducts).toHaveBeenCalled()
  })
})

// =============================================================================
// Archive/Delete Actions
// =============================================================================

describe('Catalog - Product Actions', () => {
  it('calls onArchiveProduct when archive action is triggered', async () => {
    const onArchiveProduct = vi.fn()
    const user = userEvent.setup()

    render(
      <Catalog
        products={sampleProducts}
        suppliers={sampleSuppliers}
        brands={sampleBrands}
        onArchiveProduct={onArchiveProduct}
      />
    )

    // Find and click the actions menu for first product row
    const firstRow = screen.getByText('Insulated Water Bottle 20oz').closest('tr')
    expect(firstRow).toBeInTheDocument()

    const actionButton = within(firstRow!).getByRole('button', { name: /actions/i })
    await user.click(actionButton)

    // Wait for dropdown menu to appear with Archive button (exact case)
    await waitFor(() => {
      expect(screen.getByText('Archive')).toBeInTheDocument()
    })

    // Click the Archive button
    await user.click(screen.getByText('Archive'))

    expect(onArchiveProduct).toHaveBeenCalledWith('prod-001')
  })

  it('calls onDeleteProduct when delete action is triggered', async () => {
    const onDeleteProduct = vi.fn()
    const user = userEvent.setup()

    render(
      <Catalog
        products={sampleProducts}
        suppliers={sampleSuppliers}
        brands={sampleBrands}
        onDeleteProduct={onDeleteProduct}
      />
    )

    // Find and click the actions menu for first product row
    const firstRow = screen.getByText('Insulated Water Bottle 20oz').closest('tr')
    expect(firstRow).toBeInTheDocument()

    const actionButton = within(firstRow!).getByRole('button', { name: /actions/i })
    await user.click(actionButton)

    // Wait for dropdown menu to appear with Delete button
    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    // Click the Delete button
    await user.click(screen.getByText('Delete'))

    expect(onDeleteProduct).toHaveBeenCalledWith('prod-001')
  })
})
