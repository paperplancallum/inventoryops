# Test Instructions: Transfers

These test-writing instructions are **framework-agnostic**.

## Overview
Test transfer management including CRUD operations, status workflow, line item handling, document management, customs tracking, Amazon receiving, shipping agents, and manifest generation.

## User Flow Tests

### Flow 1: View Transfers List
**Scenario:** User views all transfers

#### Success Path
**Setup:** Transfers exist in various statuses

**Steps:**
1. Navigate to Transfers section
2. Verify "Transfers" tab is active
3. Observe transfer table and summary stats

**Expected Results:**
- [ ] Summary shows: Total Transfers, In Transit, Pending Delivery, Monthly Freight Costs
- [ ] Table columns: Transfer#, Status, Source, Destination, Items, Carrier, Method, Depart Date, Arrive Date, Cost, Actions
- [ ] Status badges colored appropriately
- [ ] Source -> Destination shows as arrow format

### Flow 2: Create Transfer
**Scenario:** User creates new transfer from warehouse to Amazon

#### Success Path
**Setup:** Stock exists at warehouse, locations configured

**Steps:**
1. Click "Create Transfer" button
2. Form opens
3. Select source location: "Los Angeles 3PL"
4. Select destination: "Amazon FBA - PHX7"
5. Add line items:
   - Search for stock at source location
   - Select "Water Bottle" batch (1000 available)
   - Enter quantity to transfer: 500
6. Select carrier: "UPS Freight"
7. Set shipping method: "Ground"
8. Set scheduled departure and arrival dates
9. Enter tracking number
10. Save as "Draft" or "Booked"

**Expected Results:**
- [ ] Stock filtered by source location
- [ ] Quantity limited to available
- [ ] Totals calculate from line items
- [ ] Transfer created with chosen status
- [ ] Stock ledger entries created (if booked)

### Flow 3: Partial Transfer
**Scenario:** User transfers only part of available stock

#### Success Path
**Setup:** Batch with 1000 units at location

**Steps:**
1. Create transfer
2. Add line item from 1000-unit stock
3. Enter quantity: 400 (partial)
4. Complete transfer

**Expected Results:**
- [ ] Original stock reduced by 400
- [ ] New stock position at destination: 400
- [ ] Remaining at source: 600
- [ ] Ledger shows debit at source, credit at destination

### Flow 4: Update Transfer Status
**Scenario:** User moves transfer through workflow

#### Success Path
**Setup:** Transfer in "booked" status

**Steps:**
1. Open transfer detail
2. Click "Mark as Departed"
3. Enter actual departure date
4. Later, click "Mark as Delivered"
5. Enter actual arrival date
6. Click "Complete Transfer"

**Expected Results:**
- [ ] Status progresses: Booked > In Transit > Delivered > Completed
- [ ] Each transition adds history entry
- [ ] Dates recorded at each stage
- [ ] Stock moves to destination on completion

### Flow 5: Upload Documents
**Scenario:** User uploads shipping documents

#### Success Path
**Setup:** Transfer exists

**Steps:**
1. Open transfer detail
2. Navigate to Documents section
3. Click "Upload Document"
4. Select file (BOL PDF)
5. Choose document type: "Bill of Lading"
6. Upload

**Expected Results:**
- [ ] File uploads successfully
- [ ] Document appears in list with type badge
- [ ] Download link functional
- [ ] Can remove document

### Flow 6: Add Tracking Numbers
**Scenario:** User adds multiple tracking numbers

#### Success Path
**Setup:** Transfer with carrier

**Steps:**
1. Open transfer detail
2. In Tracking section, click "Add Tracking"
3. Enter carrier: "UPS"
4. Enter tracking number
5. System auto-generates tracking URL
6. Add another tracking number

**Expected Results:**
- [ ] Multiple tracking numbers supported
- [ ] Each has carrier and number
- [ ] Tracking URL clickable to carrier site
- [ ] Can remove tracking numbers

### Flow 7: Track Customs Clearance
**Scenario:** User tracks customs status

#### Success Path
**Setup:** International transfer (ocean freight)

**Steps:**
1. Open transfer detail
2. Navigate to Customs section
3. Enter customs broker
4. Enter HS code
5. Update status: "In Progress"
6. Later, update to "Cleared"
7. Enter clearance date and entry number

**Expected Results:**
- [ ] Customs info saved
- [ ] Status options: Pending, In Progress, Cleared, Held
- [ ] Clearance date enables when cleared
- [ ] Entry number recorded

### Flow 8: Track Amazon Receiving
**Scenario:** User tracks FBA receiving progress

#### Success Path
**Setup:** Transfer to Amazon FBA destination

**Steps:**
1. Open transfer to Amazon location
2. View Amazon Receiving section
3. Update status as Amazon progresses:
   - Checked In (with date)
   - Receiving (with date)
   - Received (with date, note discrepancy if any)
   - Closed

**Expected Results:**
- [ ] Amazon Receiving section visible for FBA/AWD destinations
- [ ] Progress indicator shows current stage
- [ ] Dates recorded for each stage
- [ ] Discrepancy field available if received qty differs

### Flow 9: Generate Shipping Manifest
**Scenario:** User creates manifest PDF

#### Success Path
**Setup:** Completed transfer details

**Steps:**
1. Open transfer detail
2. Click "Generate Manifest"
3. PDF downloads

**Expected Results:**
- [ ] PDF includes all line items with weights/dimensions
- [ ] Carrier and tracking info included
- [ ] Container numbers if applicable
- [ ] Document saved to manifest history

### Flow 10: Manage Shipping Agents
**Scenario:** User adds new shipping agent

#### Success Path
**Steps:**
1. Click "Shipping Agents" tab
2. Click "Add Shipping Agent"
3. Enter company name: "Pacific Freight"
4. Enter contact details
5. Select services: Ocean, Air
6. Enter payment terms
7. Save

**Expected Results:**
- [ ] Agent created and appears in list
- [ ] Services display as badges
- [ ] Available for selection on transfers
- [ ] Can send messages to agent

### Flow 11: Link Amazon Shipment
**Scenario:** User links internal transfer to Amazon shipment

#### Success Path
**Setup:** Transfer to FBA, Amazon shipment exists

**Steps:**
1. Click "Amazon Shipments" tab
2. Find shipment matching transfer destination
3. Click "Link to Transfer"
4. Select internal transfer from dropdown
5. Confirm link

**Expected Results:**
- [ ] Transfer now shows Amazon Shipment ID
- [ ] Shipment shows linked transfer reference
- [ ] Receiving updates sync between views

## Empty State Tests

### No Transfers
**Setup:** No transfers in system

**Steps:**
1. Navigate to Transfers

**Expected Results:**
- [ ] Empty state illustration
- [ ] "No transfers yet" message
- [ ] "Create Transfer" CTA
- [ ] Summary stats show zeros

### No Shipping Agents
**Setup:** No agents configured

**Steps:**
1. Click Shipping Agents tab

**Expected Results:**
- [ ] Empty state for agents
- [ ] "Add shipping agent" message
- [ ] "Add Agent" button

### No Amazon Connection
**Setup:** SP-API not connected

**Steps:**
1. Click Amazon Shipments tab

**Expected Results:**
- [ ] Connect to Amazon prompt
- [ ] Setup instructions
- [ ] Link to settings/configuration

## Component Interaction Tests

### Filter by Status
**Setup:** Transfers in various statuses

**Steps:**
1. Click status filter
2. Select "In Transit"
3. Observe results

**Expected Results:**
- [ ] Only in-transit transfers display
- [ ] Filter chip shows selection
- [ ] Clear filter available

### Filter by Destination
**Setup:** Transfers to different locations

**Steps:**
1. Click destination filter
2. Select "Amazon FBA"
3. Observe results

**Expected Results:**
- [ ] Only FBA-destined transfers display
- [ ] Can combine with other filters

### Date Range Filter
**Steps:**
1. Set date range for departures
2. Observe filtered results

**Expected Results:**
- [ ] Filters by scheduled or actual departure
- [ ] Within selected range only

## Edge Cases

### Transfer to New Location
**Scenario:** Destination doesn't exist

**Steps:**
1. In transfer form, click "Add New Location"
2. Enter location details
3. Save location
4. Continue with transfer

**Expected Results:**
- [ ] Location form opens inline
- [ ] New location created
- [ ] Available in destination dropdown
- [ ] Transfer continues seamlessly

### Cancel Transfer
**Setup:** Transfer in-transit

**Steps:**
1. Open transfer
2. Click "Cancel Transfer"
3. Confirm

**Expected Results:**
- [ ] Status changes to "Cancelled"
- [ ] Stock reversed to source location
- [ ] Ledger entries show reversal
- [ ] Cannot be un-cancelled

### Multi-Container Shipment
**Setup:** Ocean freight with multiple containers

**Steps:**
1. Create transfer
2. Add multiple container numbers

**Expected Results:**
- [ ] Multiple containers supported
- [ ] Each container number recorded
- [ ] Manifest shows all containers

### Line Item Receiving Discrepancy
**Setup:** Transfer with 500 units shipped

**Steps:**
1. Mark as delivered
2. Enter received quantity: 495
3. Note discrepancy: 5 missing

**Expected Results:**
- [ ] Discrepancy recorded per line item
- [ ] Stock ledger reflects actual received
- [ ] Warning indicator on transfer
- [ ] Notes field for explanation

## Sample Test Data

```typescript
const sampleTransfer: Transfer = {
  id: 'trf-001',
  transferNumber: 'TRF-2024-0015',
  status: 'in-transit',
  sourceLocationId: 'loc-warehouse-001',
  sourceLocationName: 'Los Angeles 3PL',
  destinationLocationId: 'loc-fba-phx7',
  destinationLocationName: 'Amazon FBA - PHX7',
  shippingAgentId: 'agent-001',
  shippingAgentName: 'Pacific Freight',
  lineItems: [
    {
      id: 'tli-001',
      transferId: 'trf-001',
      batchId: 'batch-001',
      sku: 'WB-20OZ-BLK',
      productName: 'Water Bottle 20oz Black',
      quantity: 500,
      unitCost: 8.50,
      totalCost: 4250.00,
      status: 'in_transit',
      receivedQuantity: null,
      discrepancy: null,
      receivedAt: null,
      receivedNotes: '',
      debitLedgerEntryId: 'led-001',
      creditLedgerEntryId: null
    }
  ],
  totalUnits: 500,
  totalValue: 4250.00,
  carrier: 'UPS Freight',
  carrierAccountNumber: 'UPS-12345',
  shippingMethod: 'ground',
  trackingNumbers: [
    {
      id: 'trk-001',
      carrier: 'UPS',
      number: '1Z999AA10123456784',
      url: 'https://ups.com/track?num=1Z999AA10123456784'
    }
  ],
  containerNumbers: [],
  scheduledDepartureDate: '2024-03-01',
  actualDepartureDate: '2024-03-01',
  scheduledArrivalDate: '2024-03-05',
  actualArrivalDate: null,
  incoterms: 'DAP',
  costs: {
    freight: 450.00,
    insurance: 25.00,
    duties: 0,
    taxes: 0,
    handling: 50.00,
    other: 0,
    currency: 'USD'
  },
  invoices: [],
  documents: [
    {
      id: 'doc-001',
      type: 'bill-of-lading',
      name: 'BOL-TRF-2024-0015.pdf',
      uploadedAt: '2024-03-01T10:00:00Z'
    }
  ],
  customsInfo: {
    hsCode: '',
    customsBroker: '',
    customsStatus: 'pending',
    entryNumber: '',
    clearanceDate: null,
    notes: ''
  },
  amazonReceiving: null,
  amazonShipmentId: 'FBA17ABC1234',
  notes: 'Regular replenishment shipment',
  statusHistory: [
    { status: 'draft', date: '2024-02-28', note: 'Created' },
    { status: 'booked', date: '2024-02-28', note: 'Booked with carrier' },
    { status: 'in-transit', date: '2024-03-01', note: 'Departed warehouse' }
  ],
  createdAt: '2024-02-28T09:00:00Z',
  createdBy: 'user-001',
  updatedAt: '2024-03-01T08:30:00Z',
  updatedBy: 'user-001'
}

const sampleShippingAgent: ShippingAgent = {
  id: 'agent-001',
  name: 'Pacific Freight Forwarding',
  contactName: 'Sarah Chen',
  email: 'sarah@pacificfreight.com',
  phone: '+1 310 555 0123',
  services: ['ocean', 'air', 'trucking'],
  address: {
    city: 'Los Angeles',
    country: 'US'
  },
  isActive: true,
  paymentTerms: 'Net 30'
}

const sampleAmazonShipment: AmazonShipment = {
  shipmentId: 'FBA17ABC1234',
  shipmentName: 'March Water Bottle Replenishment',
  inboundType: 'FBA',
  status: 'SHIPPED',
  createdDate: '2024-02-28',
  lastUpdatedDate: '2024-03-01',
  destinationFulfillmentCenterId: 'PHX7',
  shipmentType: 'SP',
  carrierName: 'UPS',
  trackingIds: ['1Z999AA10123456784'],
  boxCount: 25,
  labelsPrepType: 'SELLER_LABEL',
  areCasesRequired: false,
  totalUnits: 500,
  totalSkus: 1,
  items: [
    {
      sellerSku: 'WB-20OZ-BLK',
      fnSku: 'X00ABC1234',
      productName: 'Water Bottle 20oz Black',
      quantityShipped: 500,
      quantityReceived: 0
    }
  ],
  linkedTransferId: 'trf-001'
}
```
