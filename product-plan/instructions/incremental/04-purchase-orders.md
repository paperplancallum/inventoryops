# Milestone 4: Purchase Orders

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation), Milestone 2 (Catalog), Milestone 3 (Suppliers) complete

---

## Goal

Enable users to create, track, and manage purchase orders with suppliers, including status tracking, PDF generation, and supplier communication.

## Overview

The Purchase Orders section handles ordering from suppliers. Users create POs by selecting a supplier, adding line items from their catalog, setting dates and payment terms. POs progress through statuses (Draft -> Sent -> Confirmed -> Received) and can generate PDF documents for supplier communication.

**Key Functionality:**
- View all POs in a filterable, sortable table
- Create new PO with supplier, line items, dates, and terms
- Edit PO details and line items
- Track PO status changes with history
- Generate PO as PDF (captures immutable snapshot)
- Send PO to supplier (via email or magic link)
- View aggregated line items across all POs
- Schedule inspections from PO
- Track supplier invoice status

## Recommended Approach: Test-Driven Development

Before implementing this section, **write tests first** based on the test specifications provided.

See `product-plan/sections/purchase-orders/tests.md` for detailed test-writing instructions.

**TDD Workflow:**
1. Read `tests.md` and write failing tests for the key user flows
2. Implement the feature to make tests pass
3. Refactor while keeping tests green

## What to Implement

### Components

Copy the section components from `product-plan/sections/purchase-orders/components/`

### Data Layer

The components expect these data shapes:

```typescript
type POStatus = 'draft' | 'sent' | 'confirmed' | 'partially-received' | 'received' | 'cancelled'

interface LineItem {
  id: string
  sku: string
  productName: string
  quantity: number
  unitCost: number
  subtotal: number
}

interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  supplierName: string
  status: POStatus
  orderDate: string
  expectedDate: string
  receivedDate: string | null
  paymentTerms: string
  notes: string
  subtotal: number
  total: number
  lineItems: LineItem[]
  statusHistory: StatusHistoryEntry[]

  // Optional fields
  requiresInspection?: boolean
  inspectionStatus?: 'pending' | 'scheduled' | 'not-needed'
  inspectionId?: string | null
  messages?: Message[]
  unreadCount?: number
  supplierInvoiceStatus?: SupplierInvoiceStatus
}

interface POLineItemFlat {
  lineItemId: string
  sku: string
  productName: string
  quantity: number
  unitCost: number
  subtotal: number
  poId: string
  poNumber: string
  supplierName: string
  status: POStatus
  orderDate: string
  expectedDate: string
}
```

See `product-plan/sections/purchase-orders/types.ts` for full type definitions.

### Callbacks

Wire up these user actions:

- `onCreatePO` - Opens form to create new PO
- `onViewPO(id)` - Opens PO detail view
- `onEditPO(id)` - Opens form to edit PO
- `onDeletePO(id)` - Deletes PO (with confirmation)
- `onDuplicatePO(id)` - Creates copy of PO as draft
- `onUpdateStatus(id, newStatus)` - Changes PO status
- `onExportPDF(id)` - Downloads current PO as PDF
- `onGeneratePDF(id)` - Generates PDF snapshot (saves to document history)
- `onSendToSupplier(id)` - Sends PO to supplier, marks as "Sent"
- `onViewDocumentHistory(id)` - Shows list of generated PDFs
- `onScheduleInspection(id)` - Opens inspection scheduling modal

### Tabbed Views

The PO section has two tabs:
1. **Purchase Orders** - Main PO list view
2. **Line Items** - Aggregated view of all line items across POs

### Empty States

Implement empty state UI for:
- No POs yet (first-time user)
- No POs match filter criteria
- No line items (Line Items tab)
- No documents generated yet (Document History)

## Files to Reference

- `product-plan/sections/purchase-orders/README.md` - Section overview
- `product-plan/sections/purchase-orders/components/` - React components
- `product-plan/sections/purchase-orders/types.ts` - TypeScript interfaces
- `product-plan/sections/purchase-orders/data.json` - Sample data
- `product-plan/sections/purchase-orders/tests.md` - Test specifications
- `product-plan/data-model/data-model.md` - Entity relationships

## Expected User Flows

### View PO List
1. User navigates to Purchase Orders
2. System displays PO table with columns: PO#, Supplier, Status, Order Date, Expected Date, Total, Actions
3. Status badges show current state (Draft, Sent, Confirmed, etc.)
4. User can search by PO# or SKU
5. User can filter by status, supplier, or date range
6. User can sort by any column

### Create New PO
1. User clicks "Create PO" button
2. Form opens with: supplier dropdown, line items editor, date pickers, payment terms
3. User selects supplier
4. User adds line items (select product, enter quantity)
5. System calculates subtotals and total
6. User saves as Draft or sends directly
7. PO number auto-generated

### Edit PO
1. User clicks edit on a PO row (or from detail view)
2. Form opens with existing data
3. User can modify supplier, line items, dates, terms
4. User saves changes
5. Status history records change

### Update PO Status
1. User opens PO detail or uses row action
2. User selects new status from dropdown
3. System prompts for optional note
4. Status history entry created
5. If marking as "Received", sets received date

### Generate PO PDF
1. User clicks "Generate PDF" button on PO
2. System creates PDF document with current data snapshot
3. Document saved to PO's document history
4. User can download the PDF
5. Previous PDFs remain accessible in history

### Send to Supplier
1. User clicks "Send to Supplier" on a Draft PO
2. System generates PDF (if not exists)
3. Email sent to supplier contact (from linked Supplier)
4. PO status changes to "Sent"
5. Status history records send action

## Done When

- [ ] PO table displays with all columns
- [ ] Status badges render correctly with colors
- [ ] Search filters by PO# and SKU
- [ ] Filter by status, supplier, date range works
- [ ] "Create PO" opens form with supplier and line items
- [ ] Line items editor: add, edit, remove items
- [ ] Totals calculate correctly from line items
- [ ] "Edit PO" opens form with existing data
- [ ] Status dropdown updates PO status
- [ ] Status history displays timeline
- [ ] "Generate PDF" creates downloadable PDF
- [ ] Document history shows all generated PDFs
- [ ] "Send to Supplier" changes status and sends
- [ ] Line Items tab shows aggregated view
- [ ] Empty states show appropriately
- [ ] Responsive on mobile and desktop
- [ ] Dark mode support works
