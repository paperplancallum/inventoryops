# Test Instructions: Purchase Orders

These test-writing instructions are **framework-agnostic**.

## Overview
Test purchase order management including CRUD operations, status workflows, line item management, supplier messaging, inspection scheduling, and document generation.

## User Flow Tests

### Flow 1: View Purchase Orders
**Scenario:** User views all purchase orders

#### Success Path
**Setup:** Database contains POs in various statuses

**Steps:**
1. Navigate to Purchase Orders section
2. Verify "Orders" tab is active by default
3. Observe PO table

**Expected Results:**
- [ ] Table shows columns: PO#, Supplier, Status, Order Date, Expected Date, Total, Actions
- [ ] Status badges display with correct colors per status
- [ ] Totals format as currency
- [ ] Pagination works for large lists

### Flow 2: Create Purchase Order
**Scenario:** User creates a new PO

#### Success Path
**Setup:** Products and suppliers exist in system

**Steps:**
1. Click "Create PO" button
2. Form opens
3. Select supplier: "Shenzhen Manufacturing"
4. Add line item: search for "Water Bottle", quantity 500
5. Add second line item: "Travel Mug", quantity 250
6. Set expected date: 45 days from now
7. Select payment terms
8. Click "Save as Draft"

**Expected Results:**
- [ ] PO number auto-generated (e.g., "PO-2024-0042")
- [ ] Line items calculate subtotals (qty x unit cost)
- [ ] Grand total sums all line items
- [ ] Status set to "draft"
- [ ] PO appears in table

#### Alternative: Save and Send
**Steps:**
1. Complete PO form
2. Click "Save and Send"

**Expected Results:**
- [ ] PO saved with status "sent"
- [ ] Supplier notified (if configured)
- [ ] Status history records transition

### Flow 3: Edit Purchase Order
**Scenario:** User modifies a draft PO

#### Success Path
**Setup:** Draft PO exists

**Steps:**
1. Click on draft PO row
2. Detail panel opens
3. Click "Edit"
4. Change line item quantity from 500 to 600
5. Add notes
6. Save

**Expected Results:**
- [ ] Totals recalculate
- [ ] Changes persist
- [ ] Updated timestamp changes

#### Failure Path: Edit Sent PO
**Setup:** PO in "sent" status

**Steps:**
1. Attempt to edit sent PO

**Expected Results:**
- [ ] Most fields locked
- [ ] Only notes and dates editable
- [ ] Warning explains restrictions

### Flow 4: Update PO Status
**Scenario:** User moves PO through workflow

#### Success Path
**Setup:** PO in "sent" status

**Steps:**
1. Open PO detail
2. Click "Mark as Confirmed"
3. Observe status change

**Expected Results:**
- [ ] Status changes to "confirmed"
- [ ] Status history adds entry with timestamp
- [ ] New actions become available (Schedule Inspection)

### Flow 5: Add Line Items from Catalog
**Scenario:** User adds products to PO

#### Success Path
**Setup:** Catalog has 50+ products

**Steps:**
1. In PO form, click "Add Line Item"
2. Search for product by SKU or name
3. Select product from dropdown
4. Enter quantity: 1000
5. Verify unit cost pre-fills from catalog

**Expected Results:**
- [ ] Search filters products as user types
- [ ] Unit cost from Product.unitCost
- [ ] Subtotal = quantity x unit cost
- [ ] Can add multiple line items

### Flow 6: Schedule Inspection from PO
**Scenario:** User schedules inspection for confirmed PO

#### Success Path
**Setup:** PO in "confirmed" status, inspection agents exist

**Steps:**
1. Open confirmed PO detail
2. Click "Schedule Inspection" action
3. Modal opens
4. Select inspection type: "Pre-shipment"
5. Set date (around expected completion)
6. Select inspector from dropdown
7. Submit

**Expected Results:**
- [ ] Modal shows PO context
- [ ] Date picker defaults to expected date
- [ ] Inspection created and linked to PO
- [ ] PO shows "Inspection Scheduled" badge
- [ ] inspectionStatus changes to "scheduled"

### Flow 7: Supplier Messaging
**Scenario:** User sends message to supplier

#### Success Path
**Setup:** PO exists with supplier

**Steps:**
1. Open PO detail
2. Scroll to Messages section
3. Type message in compose area
4. Click "Send"

**Expected Results:**
- [ ] Message appears in thread with timestamp
- [ ] Sender info shows current user
- [ ] Message styled as "outbound"
- [ ] unreadCount increments for supplier

### Flow 8: View Line Items Aggregation
**Scenario:** User views all line items across POs

#### Success Path
**Setup:** Multiple POs with various line items

**Steps:**
1. Click "Line Items" tab
2. Observe aggregated table

**Expected Results:**
- [ ] Shows all line items from all POs
- [ ] Columns: SKU, Product, Qty, Unit Cost, Total, PO#, Supplier, Status
- [ ] Summary cards show: Total items, Total value, Items pending receipt
- [ ] Can filter by PO status, supplier

### Flow 9: Generate PDF Document
**Scenario:** User generates PO document

#### Success Path
**Setup:** Completed PO exists

**Steps:**
1. Open PO detail
2. Click "Generate PDF"
3. PDF downloads or opens

**Expected Results:**
- [ ] PDF contains all PO data (line items, totals, dates)
- [ ] Document saved to history with timestamp
- [ ] "generated by" recorded

## Empty State Tests

### No Purchase Orders
**Setup:** Empty POs table

**Steps:**
1. Navigate to Purchase Orders

**Expected Results:**
- [ ] Empty state with illustration
- [ ] "No purchase orders yet" message
- [ ] "Create PO" CTA button

### No Line Items Tab
**Setup:** No POs exist

**Steps:**
1. Click Line Items tab

**Expected Results:**
- [ ] Empty state specific to line items
- [ ] Explains that line items come from POs

## Component Interaction Tests

### Filter by Status
**Setup:** POs in draft, sent, confirmed, received statuses

**Steps:**
1. Click status filter
2. Select "Confirmed"
3. Observe filtered results

**Expected Results:**
- [ ] Only confirmed POs display
- [ ] Filter chip shows selected status
- [ ] Clear filter option available

### Search by PO Number
**Setup:** POs with numbers PO-2024-0001 through PO-2024-0050

**Steps:**
1. Type "0025" in search
2. Observe results

**Expected Results:**
- [ ] PO-2024-0025 displays
- [ ] Search matches partial PO numbers

### Date Range Filter
**Setup:** POs from different months

**Steps:**
1. Set date range: last 30 days
2. Observe filtered results

**Expected Results:**
- [ ] Only POs within range display
- [ ] Both order date and expected date considered

## Edge Cases

### PO with Many Line Items
**Setup:** PO with 50 line items

**Expected Results:**
- [ ] All line items display in scrollable area
- [ ] Totals calculate correctly
- [ ] Performance acceptable

### Partial Receiving
**Setup:** PO with 1000 units, 600 received

**Steps:**
1. View PO detail
2. Observe receiving status

**Expected Results:**
- [ ] Status shows "Partially Received"
- [ ] Progress indicator shows 60%
- [ ] Can continue receiving remaining units

### Cancelled PO
**Setup:** PO in "cancelled" status

**Expected Results:**
- [ ] Cannot edit or change status
- [ ] Clearly marked as cancelled
- [ ] History preserved

### Supplier Invoice Variance
**Setup:** PO with supplier invoice showing variance

**Steps:**
1. View PO with submitted invoice
2. Observe variance indicator

**Expected Results:**
- [ ] Warning icon if variance exists
- [ ] Shows variance amount and percentage
- [ ] Link to invoice detail

## Sample Test Data

```typescript
const samplePO: PurchaseOrder = {
  id: 'po-001',
  poNumber: 'PO-2024-0042',
  supplierId: 'sup-001',
  supplierName: 'Shenzhen Manufacturing',
  status: 'confirmed',
  orderDate: '2024-01-15',
  expectedDate: '2024-03-01',
  receivedDate: null,
  paymentTerms: '30/70 - 30% deposit, 70% after inspection',
  notes: 'Rush order for Q2 inventory',
  subtotal: 12500.00,
  total: 12500.00,
  lineItems: [
    {
      id: 'li-001',
      sku: 'WB-20OZ-BLK',
      productName: 'Water Bottle 20oz Black',
      quantity: 1000,
      unitCost: 8.50,
      subtotal: 8500.00
    },
    {
      id: 'li-002',
      sku: 'TM-16OZ-WHT',
      productName: 'Travel Mug 16oz White',
      quantity: 500,
      unitCost: 8.00,
      subtotal: 4000.00
    }
  ],
  statusHistory: [
    { status: 'draft', date: '2024-01-15T09:00:00Z', note: 'Created' },
    { status: 'sent', date: '2024-01-15T10:30:00Z', note: 'Sent to supplier' },
    { status: 'confirmed', date: '2024-01-16T08:00:00Z', note: 'Supplier confirmed' }
  ],
  requiresInspection: true,
  inspectionStatus: 'pending',
  messages: []
}

const sampleLineItemFlat: POLineItemFlat = {
  lineItemId: 'li-001',
  sku: 'WB-20OZ-BLK',
  productName: 'Water Bottle 20oz Black',
  quantity: 1000,
  unitCost: 8.50,
  subtotal: 8500.00,
  poId: 'po-001',
  poNumber: 'PO-2024-0042',
  supplierId: 'sup-001',
  supplierName: 'Shenzhen Manufacturing',
  status: 'confirmed',
  orderDate: '2024-01-15',
  expectedDate: '2024-03-01'
}
```
