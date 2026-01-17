# Milestone 8: Transfers

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete, Milestone 9 (Locations) recommended

---

## Goal

Implement inventory transfer tracking for physical movement of batches between locations, with carrier/tracking management, cost tracking, customs handling, and shipping document management.

## Overview

Users can create transfers to move inventory between locations (factories, warehouses, 3PLs, Amazon FBA/AWD), track shipment status through the logistics chain, manage tracking numbers and shipping documents, record costs for landed cost calculation, and handle customs clearance for international shipments.

**Key Functionality:**
- View transfers list with status tracking
- Create transfers with line items specifying quantities
- Track transfer status (Draft -> Booked -> In Transit -> Delivered -> Completed)
- Manage tracking numbers and carrier info
- Upload shipping documents (BOL, customs forms, packing lists)
- Record freight, duties, insurance, and other costs
- Generate shipping manifest PDFs
- Track Amazon receiving status for FBA/AWD destinations

---

## Recommended Approach: Test-Driven Development

Before implementing each component, write tests based on the user flows below:

1. **Write failing tests** for the expected behavior
2. **Implement** the minimum code to pass tests
3. **Refactor** while keeping tests green

Focus tests on:
- Transfer creation with line items
- Status transitions and validation
- Cost calculations (total from itemized)
- Customs status workflow
- Amazon receiving status progression

---

## What to Implement

### 1. Components

Copy the provided components from `product-plan/sections/transfers/components/`:
- `Transfers.tsx` — Main view with tabs (Transfers, Shipping Agents, Amazon Shipments)
- `TransferDetailPanel.tsx` — Slide-over with full transfer details
- `TransferForm.tsx` — Create/edit transfer with line items
- `TransferStatusTimeline.tsx` — Visual status history
- `ShippingAgentsTab.tsx` — Shipping agent management
- `ShippingAgentForm.tsx` — Add/edit shipping agent
- `AmazonShipmentsTab.tsx` — Amazon SP-API shipments view

### 2. Data Layer

**API Endpoints:**
```
GET    /api/transfers                    # List transfers with filters
GET    /api/transfers/:id                # Get transfer details
POST   /api/transfers                    # Create transfer
PATCH  /api/transfers/:id                # Update transfer
DELETE /api/transfers/:id                # Cancel/delete transfer
PATCH  /api/transfers/:id/status         # Update status
POST   /api/transfers/:id/documents      # Upload document
DELETE /api/transfers/:id/documents/:did # Remove document
POST   /api/transfers/:id/manifest       # Generate shipping manifest PDF

GET    /api/shipping-agents              # List shipping agents
POST   /api/shipping-agents              # Create shipping agent
PATCH  /api/shipping-agents/:id          # Update shipping agent

GET    /api/amazon-shipments             # List Amazon SP-API shipments
POST   /api/amazon-shipments/sync        # Trigger sync from Amazon
```

**Database Schema:**
- `transfers` table with source/destination locations, carrier, dates, costs
- `transfer_line_items` table for batch quantities
- `transfer_tracking_numbers` table
- `transfer_documents` table for uploaded files
- `transfer_status_history` table for audit trail
- `shipping_agents` table for logistics providers
- `amazon_shipments` table for SP-API sync

### 3. Callbacks

Wire up these callback props:
- `onCreateTransfer` — Open transfer creation form
- `onViewTransfer` — Open detail panel
- `onEditTransfer` — Open edit form
- `onUpdateStatus` — Update transfer status
- `onAddDocument`, `onRemoveDocument` — Document management
- `onAddTrackingNumber`, `onRemoveTrackingNumber` — Tracking management
- `onGenerateManifest` — Generate shipping manifest PDF
- `onUpdateAmazonReceiving` — Update Amazon receiving status
- `onCreateAgent`, `onEditAgent`, `onDeleteAgent` — Shipping agent CRUD

### 4. Empty States

Handle these empty states:
- No transfers yet
- No transfers matching current filters
- No documents uploaded on a transfer
- No tracking numbers added
- No shipping agents configured
- No Amazon shipments synced

---

## Files to Reference

- `product-plan/sections/transfers/README.md` — Section overview
- `product-plan/sections/transfers/spec.md` — Detailed specification
- `product-plan/sections/transfers/types.ts` — TypeScript interfaces
- `product-plan/sections/transfers/data.json` — Sample data
- `product-plan/sections/transfers/components/` — React components

---

## Expected User Flows

### Create Transfer with Line Items
1. User clicks "New Transfer"
2. Form opens with location pickers
3. User selects source location (e.g., "Shenzhen Factory")
4. User selects destination location (e.g., "Los Angeles 3PL")
5. User adds line items:
   - Select batch/SKU from available stock at source
   - Specify quantity to transfer (can be partial)
6. User enters carrier, shipping method, dates
7. User enters cost estimates (freight, insurance, etc.)
8. User saves transfer (status: Draft)

### View Transfers List
1. User navigates to Transfers
2. Summary stats show Total, In-Transit, Pending Delivery, Monthly Freight Cost
3. Table displays transfers with number, status, source/destination, carrier, dates, cost
4. Status badges indicate current state
5. User can filter by status, shipping method, date range, location

### Track Transfer Status
1. User clicks on a transfer row
2. Detail panel shows full transfer info
3. Status timeline shows history (Draft -> Booked -> In Transit -> ...)
4. User clicks "Mark as Departed" when ship sails
5. Status updates to "In Transit"
6. Timeline records the change with timestamp

### Update Tracking Info
1. From transfer detail, user goes to Tracking section
2. User clicks "Add Tracking Number"
3. User enters carrier, tracking number, optional URL
4. Tracking number appears in list
5. User can click external link to view carrier tracking page

### Complete/Receive Transfer
1. Transfer arrives at destination
2. User clicks "Mark as Delivered"
3. For Amazon destinations:
   - Amazon Receiving section appears
   - User updates status through stages (Checked In -> Receiving -> Received -> Closed)
   - User records any quantity discrepancies
4. User clicks "Complete Transfer"
5. Batches update to new location in inventory

### Generate Shipping Manifest
1. From transfer detail, user clicks "Generate Manifest"
2. System creates PDF with:
   - All line items with SKU, quantity, weight, dimensions
   - Total shipment weight and value
   - Carrier and tracking info
   - Container numbers
   - Special handling instructions
3. Manifest appears in Document History
4. User can download and share with carrier/customs

---

## Done When

- [ ] Transfers list displays with summary stats
- [ ] Filters work for status, method, date range, location
- [ ] New transfers can be created with line items
- [ ] Partial quantity transfers work (transfer some units from a batch)
- [ ] Status transitions work correctly with validation
- [ ] Status history timeline displays accurately
- [ ] Tracking numbers can be added/removed
- [ ] Documents can be uploaded and downloaded
- [ ] Costs calculate correctly from itemized entries
- [ ] Customs info can be recorded and status tracked
- [ ] Amazon receiving status works for FBA/AWD destinations
- [ ] Shipping manifest PDF can be generated
- [ ] Shipping Agents tab allows CRUD operations
- [ ] Amazon Shipments tab shows synced shipments
- [ ] Empty states display appropriately
- [ ] Responsive on mobile and desktop
- [ ] Dark mode support works
