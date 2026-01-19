/**
 * Mock Data Seeding Script for InventoryOps
 *
 * This script:
 * 1. Clears all existing data from the database
 * 2. Seeds 12 months of realistic mock data for COGS report testing
 *
 * Usage: npx tsx scripts/seed-mock-data.ts
 */

import { createClient } from '@supabase/supabase-js'

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qgxnrvexwqcjyygczzxm.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFneG5ydmV4d3Fjanl5Z2N6enhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODUxNTg2NSwiZXhwIjoyMDg0MDkxODY1fQ.hlzd6QQGoCX-t-NPw02YEPvJIZBzsbI6ZBF5H6JEW3U'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// =============================================================================
// CONFIGURATION
// =============================================================================

const PAYMENT_TERMS_TEMPLATE_30_70 = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
const PAYMENT_TERMS_TEMPLATE_NET_30 = 'f47ac10b-58cc-4372-a567-0e02b2c3d480'
const PAYMENT_TERMS_TEMPLATE_50_50 = 'f47ac10b-58cc-4372-a567-0e02b2c3d481'

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function uuid(): string {
  return crypto.randomUUID()
}

// =============================================================================
// CLEAR ALL DATA
// =============================================================================

async function clearAllData() {
  console.log('🗑️  Clearing all existing data...')

  // Order matters due to foreign key constraints
  // Delete from child tables first, then parent tables
  const tablesToClear = [
    // Stock and Inventory
    'stock_ledger_entries',
    'batch_stage_history',
    'batch_attachments',
    'batches',

    // Transfers
    'transfer_line_items',
    'transfers',

    // Invoices and Payments
    'invoice_payment_attachments',
    'invoice_payments',
    'invoice_payment_schedule_items',
    'invoices',

    // Shipping
    'shipping_invoice_line_items',
    'shipping_invoices',
    'shipping_quote_line_items',
    'shipping_quote_transfers',
    'shipping_quotes',

    // Inspections
    'inspection_pos',
    'inspections',

    // Work Orders and BOMs
    'work_order_items',
    'work_orders',
    'bom_expense_items',
    'bom_items',
    'boms',

    // Supplier Invoice Submissions
    'supplier_invoice_submission_attachments',
    'supplier_invoice_submissions',

    // Purchase Orders
    'po_attachments',
    'po_messages',
    'po_documents',
    'po_status_history',
    'po_line_items',
    'purchase_orders',

    // Products and Catalog
    'marketplace_listings',
    'product_images',
    'product_spec_sheets',
    'product_skus',
    'products',
    'brands',

    // Suppliers
    'suppliers',

    // Locations (keep some, clear user-created ones)
    'locations',

    // Amazon data
    'amazon_inventory',
    'amazon_inbound_shipment_items',
    'amazon_inbound_shipments',
    'amazon_connections',

    // Activity Log
    'activity_log',

    // Magic Links
    'magic_links',
  ]

  for (const table of tablesToClear) {
    try {
      const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (error) {
        // Some tables might not exist or have RLS issues, continue
        console.log(`  ⚠️  Could not clear ${table}: ${error.message}`)
      } else {
        console.log(`  ✅ Cleared ${table}`)
      }
    } catch (e) {
      console.log(`  ⚠️  Could not clear ${table}: ${e}`)
    }
  }

  console.log('✅ Data cleared successfully!\n')
}

// =============================================================================
// SEED DATA GENERATORS
// =============================================================================

interface Location {
  id: string
  name: string
  type: string
  country: string
  country_code: string
  city?: string
}

interface Supplier {
  id: string
  name: string
  country: string
  country_code: string
  contact_name: string
  contact_email: string
  lead_time_days: number
  payment_terms_template_id: string
  factory_location_id?: string
}

interface Brand {
  id: string
  name: string
  // Internal code for SKU generation (not stored in DB)
  _code?: string
}

interface Product {
  id: string
  sku: string
  name: string
  brand_id: string
  supplier_id: string
  unit_cost: number
}

interface PurchaseOrder {
  id: string
  supplier_id: string
  status: string
  order_date: string
  expected_date: string
  total: number
  payment_terms_template_id: string
}

interface POLineItem {
  id: string
  purchase_order_id: string
  product_id: string
  sku: string
  product_name: string
  quantity: number
  unit_cost: number
}

interface Batch {
  id: string
  po_id: string
  po_line_item_id: string
  product_id: string
  sku: string
  product_name: string
  quantity: number
  unit_cost: number
  stage: string
  supplier_id: string
  ordered_date: string
}

// =============================================================================
// SEED LOCATIONS
// =============================================================================

async function seedLocations(): Promise<Location[]> {
  console.log('📍 Seeding locations...')

  const locations: Location[] = [
    // Factories in China
    { id: uuid(), name: 'Shenzhen Factory', type: 'factory', country: 'China', country_code: 'CN', city: 'Shenzhen' },
    { id: uuid(), name: 'Guangzhou Factory', type: 'factory', country: 'China', country_code: 'CN', city: 'Guangzhou' },
    { id: uuid(), name: 'Dongguan Factory', type: 'factory', country: 'China', country_code: 'CN', city: 'Dongguan' },

    // Warehouses
    { id: uuid(), name: 'Sydney Warehouse', type: 'warehouse', country: 'Australia', country_code: 'AU', city: 'Sydney' },
    { id: uuid(), name: 'Melbourne 3PL', type: '3pl', country: 'Australia', country_code: 'AU', city: 'Melbourne' },
    { id: uuid(), name: 'Los Angeles Warehouse', type: 'warehouse', country: 'United States', country_code: 'US', city: 'Los Angeles' },

    // Amazon FBA
    { id: uuid(), name: 'Amazon FBA - SYD1', type: 'amazon_fba', country: 'Australia', country_code: 'AU', city: 'Sydney' },
    { id: uuid(), name: 'Amazon FBA - LAX1', type: 'amazon_fba', country: 'United States', country_code: 'US', city: 'Los Angeles' },
    { id: uuid(), name: 'Amazon AWD - US', type: 'amazon_awd', country: 'United States', country_code: 'US', city: 'Ontario' },
  ]

  const { error } = await supabase.from('locations').insert(locations)
  if (error) throw new Error(`Failed to seed locations: ${error.message}`)

  console.log(`  ✅ Created ${locations.length} locations`)
  return locations
}

// =============================================================================
// SEED SUPPLIERS
// =============================================================================

async function seedSuppliers(locations: Location[]): Promise<Supplier[]> {
  console.log('🏭 Seeding suppliers...')

  const factories = locations.filter(l => l.type === 'factory')

  const suppliers: Supplier[] = [
    {
      id: uuid(),
      name: 'TechParts Manufacturing Co.',
      country: 'China',
      country_code: 'CN',
      contact_name: 'David Chen',
      contact_email: 'david@techparts.cn',
      lead_time_days: 30,
      payment_terms_template_id: PAYMENT_TERMS_TEMPLATE_30_70,
      factory_location_id: factories[0]?.id,
    },
    {
      id: uuid(),
      name: 'Premium Electronics Ltd.',
      country: 'China',
      country_code: 'CN',
      contact_name: 'Lisa Wang',
      contact_email: 'lisa@premiumelec.cn',
      lead_time_days: 45,
      payment_terms_template_id: PAYMENT_TERMS_TEMPLATE_50_50,
      factory_location_id: factories[1]?.id,
    },
    {
      id: uuid(),
      name: 'Global Gadgets Supply',
      country: 'China',
      country_code: 'CN',
      contact_name: 'Michael Zhang',
      contact_email: 'michael@globalgadgets.cn',
      lead_time_days: 25,
      payment_terms_template_id: PAYMENT_TERMS_TEMPLATE_30_70,
      factory_location_id: factories[2]?.id,
    },
    {
      id: uuid(),
      name: 'Quality Home Products',
      country: 'China',
      country_code: 'CN',
      contact_name: 'Sarah Liu',
      contact_email: 'sarah@qualityhome.cn',
      lead_time_days: 35,
      payment_terms_template_id: PAYMENT_TERMS_TEMPLATE_NET_30,
    },
  ]

  const { error } = await supabase.from('suppliers').insert(suppliers)
  if (error) throw new Error(`Failed to seed suppliers: ${error.message}`)

  console.log(`  ✅ Created ${suppliers.length} suppliers`)
  return suppliers
}

// =============================================================================
// SEED BRANDS
// =============================================================================

async function seedBrands(): Promise<Brand[]> {
  console.log('🏷️  Seeding brands...')

  const brandData = [
    { name: 'TechFlow', _code: 'TF' },
    { name: 'HomeEssentials', _code: 'HE' },
    { name: 'GadgetPro', _code: 'GP' },
    { name: 'SmartLife', _code: 'SL' },
  ]

  const brands: Brand[] = brandData.map(b => ({
    id: uuid(),
    name: b.name,
    _code: b._code,
  }))

  // Insert only the fields that exist in the DB schema
  const dbBrands = brands.map(b => ({
    id: b.id,
    name: b.name,
    description: `${b.name} brand products`,
  }))

  const { error } = await supabase.from('brands').insert(dbBrands)
  if (error) throw new Error(`Failed to seed brands: ${error.message}`)

  console.log(`  ✅ Created ${brands.length} brands`)
  return brands
}

// =============================================================================
// SEED PRODUCTS
// =============================================================================

async function seedProducts(brands: Brand[], suppliers: Supplier[]): Promise<Product[]> {
  console.log('📦 Seeding products...')

  const productTemplates = [
    // TechFlow products
    { name: 'Wireless Earbuds Pro', baseCost: 15.50 },
    { name: 'Bluetooth Speaker Mini', baseCost: 22.00 },
    { name: 'USB-C Hub 7-in-1', baseCost: 18.75 },
    { name: 'Laptop Stand Adjustable', baseCost: 12.00 },
    { name: 'Wireless Charging Pad', baseCost: 8.50 },

    // HomeEssentials products
    { name: 'LED Desk Lamp Smart', baseCost: 14.25 },
    { name: 'Kitchen Scale Digital', baseCost: 6.50 },
    { name: 'Air Purifier Compact', baseCost: 35.00 },
    { name: 'Smart Power Strip', baseCost: 11.00 },
    { name: 'Storage Containers Set', baseCost: 9.25 },

    // GadgetPro products
    { name: 'Action Camera 4K', baseCost: 45.00 },
    { name: 'Drone Mini HD', baseCost: 65.00 },
    { name: 'Smart Watch Band', baseCost: 4.50 },
    { name: 'Phone Gimbal Stabilizer', baseCost: 28.00 },
    { name: 'VR Headset Basic', baseCost: 32.00 },

    // SmartLife products
    { name: 'Smart Plug WiFi', baseCost: 5.75 },
    { name: 'Motion Sensor Light', baseCost: 7.25 },
    { name: 'Door Lock Smart', baseCost: 42.00 },
    { name: 'Temperature Sensor', baseCost: 8.00 },
    { name: 'Smart Button Remote', baseCost: 3.50 },
  ]

  const products: Product[] = []
  let skuCounter = 1000

  for (const template of productTemplates) {
    const brandIndex = Math.floor(products.length / 5)
    const brand = brands[brandIndex % brands.length]
    const supplier = suppliers[brandIndex % suppliers.length]

    // Add some cost variation
    const costVariation = randomFloat(0.9, 1.1)

    products.push({
      id: uuid(),
      sku: `${brand._code || 'XX'}-${skuCounter++}`,
      name: template.name,
      brand_id: brand.id,
      supplier_id: supplier.id,
      unit_cost: parseFloat((template.baseCost * costVariation).toFixed(2)),
    })
  }

  const { error } = await supabase.from('products').insert(products)
  if (error) throw new Error(`Failed to seed products: ${error.message}`)

  console.log(`  ✅ Created ${products.length} products`)
  return products
}

// =============================================================================
// SEED PURCHASE ORDERS (12 months of data)
// =============================================================================

async function seedPurchaseOrders(
  suppliers: Supplier[],
  products: Product[],
  locations: Location[]
): Promise<{ pos: PurchaseOrder[], lineItems: POLineItem[], batches: Batch[] }> {
  console.log('📋 Seeding purchase orders (12 months)...')

  const pos: PurchaseOrder[] = []
  const lineItems: POLineItem[] = []
  const batches: Batch[] = []

  // Generate POs for the last 12 months
  const endDate = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 12)

  // Statuses with weights (more completed orders for older dates)
  const statusWeights = {
    'received': 0.5,
    'partially-received': 0.15,
    'confirmed': 0.15,
    'sent': 0.1,
    'draft': 0.1,
  }

  // Generate 3-6 POs per month
  let currentDate = new Date(startDate)
  let poCount = 0

  while (currentDate < endDate) {
    const posThisMonth = randomInt(3, 6)

    for (let i = 0; i < posThisMonth; i++) {
      const supplier = randomElement(suppliers)
      const supplierProducts = products.filter(p => p.supplier_id === supplier.id)

      if (supplierProducts.length === 0) continue

      // Random date within the month
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      const orderDate = randomDate(monthStart, monthEnd)

      // Determine status based on age (older orders more likely to be completed)
      const ageInDays = Math.floor((endDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
      let status: string

      if (ageInDays > 90) {
        status = 'received'
      } else if (ageInDays > 60) {
        status = Math.random() < 0.8 ? 'received' : 'partially-received'
      } else if (ageInDays > 30) {
        status = randomElement(['received', 'partially-received', 'confirmed'])
      } else {
        status = randomElement(['confirmed', 'sent', 'draft'])
      }

      const expectedDate = addDays(orderDate, supplier.lead_time_days + randomInt(-5, 10))

      // Generate 1-5 line items
      const numLineItems = randomInt(1, 5)
      const selectedProducts = [...supplierProducts]
        .sort(() => Math.random() - 0.5)
        .slice(0, numLineItems)

      let poTotal = 0
      const poId = uuid()
      const poLineItems: POLineItem[] = []

      for (const product of selectedProducts) {
        const quantity = randomInt(50, 500) * 10 // Quantities in multiples of 10
        const unitCost = product.unit_cost * randomFloat(0.95, 1.05) // Slight cost variation

        const lineItem: POLineItem = {
          id: uuid(),
          purchase_order_id: poId,
          product_id: product.id,
          sku: product.sku,
          product_name: product.name,
          quantity,
          unit_cost: parseFloat(unitCost.toFixed(2)),
        }

        poLineItems.push(lineItem)
        poTotal += quantity * unitCost

        // Create batch for received/partially-received orders
        if (status === 'received' || status === 'partially-received') {
          const batchStage = status === 'received' ?
            randomElement(['warehouse', 'amazon']) :
            randomElement(['factory', 'in-transit', 'warehouse'])

          batches.push({
            id: uuid(),
            po_id: poId,
            po_line_item_id: lineItem.id,
            product_id: product.id,
            sku: product.sku,
            product_name: product.name,
            quantity,
            unit_cost: parseFloat(unitCost.toFixed(2)),
            stage: batchStage,
            supplier_id: supplier.id,
            ordered_date: formatDate(orderDate),
          })
        }
      }

      lineItems.push(...poLineItems)

      pos.push({
        id: poId,
        supplier_id: supplier.id,
        status,
        order_date: formatDate(orderDate),
        expected_date: formatDate(expectedDate),
        total: parseFloat(poTotal.toFixed(2)),
        payment_terms_template_id: supplier.payment_terms_template_id,
      })

      poCount++
    }

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1)
  }

  // Insert POs
  console.log(`  📝 Inserting ${pos.length} purchase orders...`)
  const { error: poError } = await supabase.from('purchase_orders').insert(pos)
  if (poError) throw new Error(`Failed to seed POs: ${poError.message}`)

  // Insert line items
  console.log(`  📝 Inserting ${lineItems.length} line items...`)
  const { error: liError } = await supabase.from('po_line_items').insert(lineItems)
  if (liError) throw new Error(`Failed to seed line items: ${liError.message}`)

  // Insert batches
  console.log(`  📝 Inserting ${batches.length} batches...`)
  const { error: batchError } = await supabase.from('batches').insert(batches)
  if (batchError) throw new Error(`Failed to seed batches: ${batchError.message}`)

  console.log(`  ✅ Created ${pos.length} POs, ${lineItems.length} line items, ${batches.length} batches`)
  return { pos, lineItems, batches }
}

// =============================================================================
// SEED STOCK LEDGER ENTRIES
// =============================================================================

async function seedStockLedgerEntries(
  batches: Batch[],
  locations: Location[]
): Promise<void> {
  console.log('📊 Seeding stock ledger entries...')

  const warehouses = locations.filter(l => l.type === 'warehouse' || l.type === '3pl')
  const amazonLocations = locations.filter(l => l.type === 'amazon_fba' || l.type === 'amazon_awd')

  if (warehouses.length === 0 || amazonLocations.length === 0) {
    console.log('  ⚠️  No warehouse or Amazon locations found, skipping stock ledger')
    return
  }

  const ledgerEntries: any[] = []

  for (const batch of batches) {
    if (batch.stage === 'ordered' || batch.stage === 'factory') continue

    // Initial receipt at warehouse
    if (batch.stage === 'warehouse' || batch.stage === 'amazon' || batch.stage === 'in-transit') {
      const warehouse = randomElement(warehouses)

      ledgerEntries.push({
        batch_id: batch.id,
        sku: batch.sku,
        product_name: batch.product_name,
        location_id: warehouse.id,
        quantity: batch.quantity,
        movement_type: 'initial_receipt',
        unit_cost: batch.unit_cost,
        reason: `Received from PO`,
        created_by: 'system',
      })

      // If in Amazon, add transfer out from warehouse and transfer in to Amazon
      if (batch.stage === 'amazon') {
        const amazonLoc = randomElement(amazonLocations)
        const transferQty = Math.floor(batch.quantity * randomFloat(0.7, 1.0))

        // Transfer out
        ledgerEntries.push({
          batch_id: batch.id,
          sku: batch.sku,
          product_name: batch.product_name,
          location_id: warehouse.id,
          quantity: -transferQty,
          movement_type: 'transfer_out',
          unit_cost: batch.unit_cost,
          reason: `Transfer to Amazon FBA`,
          created_by: 'system',
        })

        // Transfer in
        ledgerEntries.push({
          batch_id: batch.id,
          sku: batch.sku,
          product_name: batch.product_name,
          location_id: amazonLoc.id,
          quantity: transferQty,
          movement_type: 'transfer_in',
          unit_cost: batch.unit_cost,
          reason: `Received from warehouse transfer`,
          created_by: 'system',
        })

        // Some sales (removals from Amazon)
        const salesQty = Math.floor(transferQty * randomFloat(0.1, 0.5))
        if (salesQty > 0) {
          ledgerEntries.push({
            batch_id: batch.id,
            sku: batch.sku,
            product_name: batch.product_name,
            location_id: amazonLoc.id,
            quantity: -salesQty,
            movement_type: 'amazon_reconcile',
            unit_cost: batch.unit_cost,
            reason: `Amazon sales reconciliation`,
            created_by: 'system',
          })
        }
      }
    }
  }

  if (ledgerEntries.length > 0) {
    const { error } = await supabase.from('stock_ledger_entries').insert(ledgerEntries)
    if (error) throw new Error(`Failed to seed ledger entries: ${error.message}`)
  }

  console.log(`  ✅ Created ${ledgerEntries.length} stock ledger entries`)
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('🚀 Starting mock data seeding...\n')

  try {
    // Step 1: Clear existing data
    await clearAllData()

    // Step 2: Seed locations
    const locations = await seedLocations()

    // Step 3: Seed suppliers
    const suppliers = await seedSuppliers(locations)

    // Step 4: Seed brands
    const brands = await seedBrands()

    // Step 5: Seed products
    const products = await seedProducts(brands, suppliers)

    // Step 6: Seed POs, line items, and batches
    const { pos, lineItems, batches } = await seedPurchaseOrders(suppliers, products, locations)

    // Step 7: Seed stock ledger entries
    await seedStockLedgerEntries(batches, locations)

    console.log('\n✅ Mock data seeding completed successfully!')
    console.log('\n📈 Summary:')
    console.log(`   - ${locations.length} locations`)
    console.log(`   - ${suppliers.length} suppliers`)
    console.log(`   - ${brands.length} brands`)
    console.log(`   - ${products.length} products`)
    console.log(`   - ${pos.length} purchase orders`)
    console.log(`   - ${lineItems.length} line items`)
    console.log(`   - ${batches.length} batches`)

  } catch (error) {
    console.error('\n❌ Error seeding data:', error)
    process.exit(1)
  }
}

main()
