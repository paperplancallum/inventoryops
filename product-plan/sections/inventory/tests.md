# Test Instructions: Inventory

These test-writing instructions are **framework-agnostic**.

## Overview
Test inventory management including pipeline views, batch operations, stock tracking, Amazon integration, and transfer initiation.

## User Flow Tests

### Flow 1: View Pipeline Kanban
**Scenario:** User views batches in kanban format

#### Success Path
**Setup:** Batches exist in multiple pipeline stages

**Steps:**
1. Navigate to Inventory section
2. Verify Pipeline tab is active
3. Toggle to "Kanban" view if not default

**Expected Results:**
- [ ] Columns display for each stage: Ordered, Factory, Inspected, In Transit, Warehouse, Amazon
- [ ] Batch cards appear in correct columns
- [ ] Cards show: SKU, quantity, supplier, PO#, ETA
- [ ] Column headers show count of batches

### Flow 2: Move Batch via Drag-Drop
**Scenario:** User moves batch to next stage

#### Success Path
**Setup:** Batch in "Factory" stage

**Steps:**
1. In kanban view, find batch card
2. Drag card from "Factory" column
3. Drop into "Inspected" column

**Expected Results:**
- [ ] Card moves to new column
- [ ] Stage history entry added with timestamp
- [ ] Visual feedback during drag
- [ ] onMoveBatch callback fired

#### Failure Path: Invalid Stage Transition
**Setup:** Batch in "Ordered" stage

**Steps:**
1. Try to drag from "Ordered" to "Amazon"

**Expected Results:**
- [ ] Drop rejected (can't skip stages)
- [ ] Card returns to original column
- [ ] Error toast explains valid transitions

### Flow 3: View Batch Detail
**Scenario:** User views full batch information

#### Success Path
**Setup:** Batch with complete history

**Steps:**
1. Click on batch card or row
2. Detail panel opens

**Expected Results:**
- [ ] Header shows SKU, product name, status badge
- [ ] Timeline shows all stage transitions with dates
- [ ] Costs section shows unit cost, total cost
- [ ] Attachments section shows uploaded files
- [ ] Stock ledger entries display

### Flow 4: Split Batch
**Scenario:** User splits batch into multiple

#### Success Path
**Setup:** Batch with 1000 units at warehouse

**Steps:**
1. Open batch detail
2. Click "Split Batch" action
3. Modal opens
4. Enter split: 400 units to new batch
5. Confirm split

**Expected Results:**
- [ ] Original batch reduced to 600 units
- [ ] New batch created with 400 units
- [ ] Both batches share same origin PO
- [ ] Stock ledger records the split
- [ ] Total units preserved (no loss)

### Flow 5: Multi-Select for Transfer
**Scenario:** User selects multiple stock items to transfer

#### Success Path
**Setup:** Stock exists at same location

**Steps:**
1. Switch to table view in Pipeline
2. Enable selection mode (checkbox column appears)
3. Select 3 stock items at same location
4. "Initiate Transfer" bar appears at bottom
5. Click "Initiate Transfer"

**Expected Results:**
- [ ] Selection checkboxes functional
- [ ] Bar shows: "3 items selected (1,500 units)"
- [ ] Transfer form opens pre-filled with selected items
- [ ] Source location auto-set from selection

### Flow 6: View Amazon Inventory
**Scenario:** User views synced Amazon data

#### Success Path
**Setup:** Amazon SP-API connected, inventory synced

**Steps:**
1. Click "Amazon" tab
2. Observe inventory table

**Expected Results:**
- [ ] Sync status banner shows last sync time
- [ ] Table shows: FNSKU, SKU, Title, Fulfillable, Reserved, Inbound, Unfulfillable
- [ ] Marketplace filter (US, CA, MX)
- [ ] Unmapped SKUs highlighted

### Flow 7: Map Amazon SKU
**Scenario:** User links Amazon SKU to internal catalog

#### Success Path
**Setup:** Unmapped Amazon SKU exists

**Steps:**
1. In Amazon tab, find unmapped item
2. Click "Map SKU" action
3. Modal opens
4. Search internal catalog
5. Select matching product SKU
6. Confirm mapping

**Expected Results:**
- [ ] Modal shows Amazon item details
- [ ] Search filters internal catalog
- [ ] After mapping, item shows as "mapped"
- [ ] Reconciliation possible after mapping

### Flow 8: Reconcile with Amazon
**Scenario:** User compares internal vs Amazon quantities

#### Success Path
**Setup:** Mapped SKUs with quantity differences

**Steps:**
1. View batch at Amazon stage
2. Click "Reconcile" action
3. Compare quantities

**Expected Results:**
- [ ] Side-by-side comparison display
- [ ] Discrepancies highlighted in red
- [ ] Can create adjustment entries
- [ ] Reconciliation record created

### Flow 9: View Stock Ledger
**Scenario:** User audits stock movements

#### Success Path
**Setup:** Batch with multiple movements

**Steps:**
1. Open batch detail
2. Click "View History" or expand ledger section

**Expected Results:**
- [ ] Chronological list of ledger entries
- [ ] Each entry shows: type, quantity, location, date, user
- [ ] Credit entries (positive) vs debit entries (negative)
- [ ] Running total visible

## Empty State Tests

### No Batches
**Setup:** No batches in system

**Steps:**
1. Navigate to Inventory

**Expected Results:**
- [ ] Empty state in kanban (empty columns)
- [ ] Message: "No inventory batches yet"
- [ ] Explains batches created from POs

### No Amazon Connection
**Setup:** Amazon SP-API not connected

**Steps:**
1. Click Amazon tab

**Expected Results:**
- [ ] Empty state with connection prompt
- [ ] "Connect to Amazon" CTA
- [ ] Instructions for API setup

### No SKU Mappings
**Setup:** Amazon data exists but nothing mapped

**Expected Results:**
- [ ] Warning banner about unmapped SKUs
- [ ] Count of unmapped items
- [ ] Link to bulk mapping tool

## Component Interaction Tests

### Toggle View Mode
**Steps:**
1. Start in kanban view
2. Click table view toggle
3. Observe view change

**Expected Results:**
- [ ] Data preserved between views
- [ ] Table shows sortable columns
- [ ] Toggle remembers preference

### Filter by Stage
**Setup:** Batches in all stages

**Steps:**
1. In table view, filter by stage "In Transit"
2. Observe results

**Expected Results:**
- [ ] Only in-transit batches display
- [ ] Filter chip shows selection
- [ ] Clear filter returns all

### Amazon Sync
**Steps:**
1. Click "Sync Now" button
2. Observe sync status

**Expected Results:**
- [ ] Loading indicator during sync
- [ ] Last sync time updates
- [ ] New items appear if added in Amazon
- [ ] Error handling if sync fails

## Edge Cases

### Batch with Zero Quantity
**Setup:** Batch fully transferred out

**Expected Results:**
- [ ] Batch still visible in history
- [ ] Marked as "depleted" or similar
- [ ] Cannot be selected for new transfers

### Amazon Discrepancy Over Threshold
**Setup:** Internal shows 1000, Amazon shows 800

**Expected Results:**
- [ ] Red highlight on discrepancy
- [ ] Warning badge on batch
- [ ] Discrepancy amount shown clearly
- [ ] Investigation action available

### Large Inventory Dataset
**Setup:** 10,000+ stock positions

**Expected Results:**
- [ ] Pagination or virtual scrolling
- [ ] Filters improve performance
- [ ] Aggregation views load efficiently

### Stock at Multiple Locations
**Setup:** Same SKU at warehouse, FBA, and AWD

**Steps:**
1. View by Product aggregation

**Expected Results:**
- [ ] Product row expandable
- [ ] Child rows show each location
- [ ] Totals sum across locations

## Sample Test Data

```typescript
const sampleBatch: Batch = {
  id: 'batch-001',
  sku: 'WB-20OZ-BLK',
  productName: 'Water Bottle 20oz Black',
  quantity: 1000,
  stage: 'warehouse',
  supplierName: 'Shenzhen Manufacturing',
  poNumber: 'PO-2024-0042',
  shipmentId: 'TRF-2024-0015',
  unitCost: 8.50,
  totalCost: 8500.00,
  orderedDate: '2024-01-15',
  expectedArrival: '2024-03-10',
  actualArrival: '2024-03-08',
  notes: 'Received in good condition',
  stageHistory: [
    { stage: 'ordered', date: '2024-01-15', note: 'PO created' },
    { stage: 'factory', date: '2024-01-20', note: 'Production started' },
    { stage: 'inspected', date: '2024-02-15', note: 'QC passed' },
    { stage: 'in-transit', date: '2024-02-20', note: 'Shipped via ocean' },
    { stage: 'warehouse', date: '2024-03-08', note: 'Received at LA 3PL' }
  ],
  attachments: [],
  totalUnitsReceived: 1000,
  totalUnitsRemaining: 850
}

const sampleStock: Stock = {
  id: 'stock-001',
  batchId: 'batch-001',
  sku: 'WB-20OZ-BLK',
  productName: 'Water Bottle 20oz Black',
  locationId: 'loc-warehouse-001',
  locationName: 'Los Angeles 3PL',
  locationType: 'warehouse',
  totalQuantity: 850,
  availableQuantity: 800,
  reservedQuantity: 50,
  unitCost: 8.50,
  totalValue: 7225.00,
  firstReceivedAt: '2024-03-08',
  lastReceivedAt: '2024-03-08',
  poNumber: 'PO-2024-0042',
  supplierName: 'Shenzhen Manufacturing'
}

const sampleAmazonItem: AmazonInventoryItem = {
  asin: 'B0ABC12345',
  fnsku: 'X00ABC1234',
  sellerSku: 'WB-20OZ-BLK',
  productName: 'Water Bottle 20oz Black',
  condition: 'New',
  marketplace: 'US',
  fbaFulfillable: 450,
  fbaReserved: 25,
  fbaInboundWorking: 0,
  fbaInboundShipped: 200,
  fbaInboundReceiving: 0,
  fbaUnfulfillable: 5,
  awdQuantity: 0,
  awdInboundQuantity: 0,
  internalSkuId: 'sku-001',
  internalProductId: 'prod-001',
  mappingStatus: 'mapped',
  lastSyncedAt: '2024-03-10T14:30:00Z'
}
```
