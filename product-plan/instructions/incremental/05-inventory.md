# Milestone 5: Inventory

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation), Milestone 2 (Catalog), Milestone 4 (Purchase Orders) complete

---

## Goal

Enable users to track inventory batches through pipeline stages from ordering through to Amazon, with full movement history and stock ledger tracking.

## Overview

The Inventory section tracks batches of inventory through the supply chain pipeline. Batches progress through stages (Ordered -> Factory -> Inspected -> In Transit -> Warehouse -> Amazon). Users can view inventory in a kanban pipeline or table view, track stock quantities at each location via the stock ledger, and reconcile with Amazon inventory.

**Key Functionality:**
- View batches in pipeline (kanban) or table view
- Move batches between pipeline stages
- Track stock quantities at each location
- View batch detail with full movement history
- Receive inventory from Purchase Orders (creates batches)
- Split or merge batches
- Attach documents and photos to batches
- Reconcile internal quantities with Amazon
- Initiate transfers from selected stock
- Sync and view Amazon inventory from SP-API

## Recommended Approach: Test-Driven Development

Before implementing this section, **write tests first** based on the test specifications provided.

See `product-plan/sections/inventory/tests.md` for detailed test-writing instructions.

**TDD Workflow:**
1. Read `tests.md` and write failing tests for the key user flows
2. Implement the feature to make tests pass
3. Refactor while keeping tests green

## What to Implement

### Components

Copy the section components from `product-plan/sections/inventory/components/`

### Data Layer

The components expect these data shapes:

```typescript
type BatchStage = 'ordered' | 'factory' | 'inspected' | 'in-transit' | 'warehouse' | 'amazon'

interface Batch {
  id: string
  sku: string
  productName: string
  quantity: number              // Original ordered (immutable)
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
  totalUnitsReceived?: number   // From stock ledger
  totalUnitsRemaining?: number  // From stock ledger
}

interface Stock {
  id: string
  batchId: string
  sku: string
  productName: string
  locationId: string
  locationName: string
  locationType: string
  totalQuantity: number
  availableQuantity: number
  reservedQuantity: number
  unitCost: number
  totalValue: number
  firstReceivedAt: string
  poNumber: string
  supplierName: string
}

interface StockLedgerEntry {
  id: string
  batchId: string
  sku: string
  locationId: string
  locationName: string
  quantity: number              // +ve = credit/in, -ve = debit/out
  movementType: StockMovementType
  status: 'pending' | 'confirmed' | 'cancelled'
  transferId: string | null
  reason: string
  createdAt: string
  createdBy: string
}

type StockMovementType =
  | 'initial_receipt'    // From PO at factory
  | 'transfer_out'       // Leaving location
  | 'transfer_in'        // Arriving at location
  | 'adjustment_add'     // Manual add
  | 'adjustment_remove'  // Manual remove
  | 'amazon_reconcile'   // Amazon sync adjustment
```

See `product-plan/sections/inventory/types.ts` for full type definitions.

### Callbacks

Wire up these user actions:

- `onViewBatch(id)` - Opens batch detail panel
- `onEditBatch(id)` - Opens batch edit form
- `onDeleteBatch(id)` - Deletes batch (with confirmation)
- `onMoveBatch(id, newStage)` - Moves batch to new pipeline stage
- `onSplitBatch(id)` - Opens split batch dialog
- `onMergeBatches(ids)` - Merges selected batches
- `onAddAttachment(batchId, file)` - Uploads file to batch
- `onRemoveAttachment(batchId, attachmentId)` - Removes attachment
- `onInitiateTransfer(stockIds)` - Opens transfer form with selected stock
- `onViewStockHistory(batchId)` - Shows stock ledger entries for batch
- `onReconcileBatch(batchId)` - Reconciles with Amazon quantity
- `onSyncAmazonInventory` - Triggers Amazon SP-API sync
- `onMapSku(amazonSku, internalSkuId)` - Links Amazon SKU to catalog
- `onImportAmazonData` - Imports Amazon inventory data

### Tabbed Views

The Inventory section has two tabs:
1. **Pipeline** - Kanban/table view of batches by stage
2. **Amazon** - Amazon inventory sync and reconciliation

### Empty States

Implement empty state UI for:
- No batches yet (first-time user)
- No batches in a pipeline stage (kanban column)
- No stock at location
- No Amazon inventory synced yet

## Files to Reference

- `product-plan/sections/inventory/README.md` - Section overview
- `product-plan/sections/inventory/components/` - React components
- `product-plan/sections/inventory/types.ts` - TypeScript interfaces
- `product-plan/sections/inventory/data.json` - Sample data
- `product-plan/sections/inventory/tests.md` - Test specifications
- `product-plan/data-model/data-model.md` - Entity relationships (Batch, Stock, StockLedgerEntry)

## Expected User Flows

### View Pipeline (Kanban)
1. User navigates to Inventory
2. System displays kanban board with columns: Ordered, Factory, Inspected, In Transit, Warehouse, Amazon
3. Batch cards show: SKU, quantity, supplier, PO#, expected date
4. User can drag-drop cards between columns
5. User can filter by product, supplier, or date range

### View Pipeline (Table)
1. User toggles to table view
2. System displays batches in sortable table
3. Columns: SKU, Product, Qty, Stage, Supplier, PO#, Dates, Cost
4. Stage dropdown allows status change
5. Row click opens batch detail

### View Batch Details
1. User clicks batch card or table row
2. Detail panel opens showing:
   - Batch header (SKU, product, quantity, stage)
   - Timeline of stage history
   - Stock breakdown by location
   - Cost information
   - Attachments (photos, documents)
3. User can edit details or move stage

### Receive Inventory from PO
1. PO is marked as "Received" or "Partially Received"
2. System creates batch records for line items
3. Stock ledger entry created (initial_receipt at factory location)
4. Batch appears in "Factory" stage of pipeline
5. Stock record created at factory location

### Transfer Batches (Initiate)
1. User enables selection mode in table/kanban
2. User selects one or more stock items
3. "Initiate Transfer" bar appears at bottom
4. Bar shows selected quantity summary
5. User clicks to open Transfer form pre-filled with selected items
6. (Transfer completion handled in Transfers section)

### Amazon Reconciliation
1. User navigates to Amazon tab
2. System shows Amazon inventory (from SP-API sync)
3. Table shows: FNSKU, SKU, Title, FBA Qty, AWD Qty, Internal Qty
4. Discrepancies highlighted in red
5. User can reconcile to adjust internal quantities

## Done When

- [ ] Kanban view displays batches in stage columns
- [ ] Table view displays batches with all columns
- [ ] Toggle between kanban and table works
- [ ] Drag-drop moves batch between stages (kanban)
- [ ] Stage dropdown changes batch stage (table)
- [ ] Stage history records all movements
- [ ] Batch detail panel shows full information
- [ ] Stock breakdown shows quantities by location
- [ ] Attachments can be added and removed
- [ ] Multi-select enables "Initiate Transfer" action
- [ ] Amazon tab shows synced inventory
- [ ] Amazon sync button triggers SP-API fetch
- [ ] Discrepancies highlighted between internal/Amazon quantities
- [ ] SKU mapping links Amazon SKUs to catalog
- [ ] Empty states show appropriately
- [ ] Responsive on mobile and desktop
- [ ] Dark mode support works
