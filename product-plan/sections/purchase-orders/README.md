# Purchase Orders

## Overview
Create and track purchase orders with suppliers. Users can create POs by selecting a supplier, adding line items (products + quantities), setting expected dates, and specifying payment terms. Costs auto-calculate from product prices. Includes two tabbed views: Orders (main PO list) and Line Items (aggregated view across all POs).

## User Flows
- View all POs in a table with key columns (PO#, supplier, status, dates, total)
- Filter POs by status, supplier, date range, or search by PO#/SKU
- Create new PO: select supplier, add line items from catalog, set dates and payment terms
- View PO detail with full line items, totals, order history, and messages
- Edit PO details, add/remove line items, update status
- Duplicate an existing PO to create a new one
- Export PO as PDF / Generate PDF with immutable data snapshot
- Send PO to supplier (marks as Sent)
- Schedule inspection directly from PO
- View supplier invoice status and variances
- Message supplier within PO context

## Design Decisions
- Tab navigation between Orders and Line Items views
- Status workflow: Draft > Sent > Confirmed > Partially Received > Received > Cancelled
- Line Items tab provides cross-PO visibility for inventory planning
- Document history tracks all generated PDFs as immutable snapshots
- Supplier messaging integrated into PO detail panel
- Inspection scheduling available for confirmed POs

## Data Used
**Entities:** PurchaseOrder, LineItem, StatusHistoryEntry, Message, Attachment, POLineItemFlat, LineItemsSummary, Supplier

**From global model:** Purchase Orders, Products (for line items), Suppliers, Inspections (for scheduling)

## Visual Reference
See `screenshot.png` for the target UI design.

## Components Provided
- `PurchaseOrdersView` - Main tabbed view with Orders and Line Items
- `POTable` - Sortable, filterable table of purchase orders
- `PODetailPanel` - Slide-over with full PO details, timeline, messages
- `POForm` - Form for creating/editing POs with line item editor
- `LineItemsView` - Aggregated view of all line items across POs
- `MessageThread` - Supplier messaging component
- `DocumentHistory` - List of generated PDF documents

## Callback Props
| Callback | Description |
|----------|-------------|
| `onViewPO` | Called when user clicks PO row to view details |
| `onEditPO` | Called when user wants to edit a PO (receives id) |
| `onDeletePO` | Called when user wants to delete a PO (receives id) |
| `onCreatePO` | Called when user clicks "Create PO" button |
| `onDuplicatePO` | Called when user duplicates a PO (receives id) |
| `onExportPDF` | Called when user exports PO as PDF (receives id) |
| `onSendToSupplier` | Called when user sends PO to supplier (receives id) |
| `onUpdateStatus` | Called when status changes (receives id, newStatus) |
| `onScheduleInspection` | Called when user schedules inspection from PO |
| `onGeneratePDF` | Called when user generates a PDF snapshot |
| `onViewDocumentHistory` | Called when user views past documents |
