# Milestone 17: Supplier Invoices

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete, Purchase Orders and Magic Links sections required

---

## Goal

Implement a review workflow for supplier price submissions, allowing users to compare submitted prices against original PO prices, approve or reject submissions, and maintain price history.

## Overview

Supplier Invoices capture price submissions from suppliers via magic link forms. When a PO is sent to a supplier, they respond with actual prices that may differ from quotes. This section provides a review workflow where users compare submitted vs. original prices, approve (which updates PO line items), reject for revision (sends new magic link), or reject final.

**Key Functionality:**
- View pending supplier invoices awaiting review
- Review invoice with line-by-line price comparison
- See variance calculations (amount and percentage)
- Approve invoice (updates PO prices and creates price history)
- Reject for revision (creates new invoice with fresh magic link)
- Reject final (closes without update)
- View revision history and price change history

## Recommended Approach: Test-Driven Development

1. Read `product-plan/sections/supplier-invoices/tests.md` for test specifications
2. Write tests first for: invoice listing, review workflow, approve, reject, price history
3. Implement API endpoints to make tests pass
4. Wire up UI components with real data

## What to Implement

### Components

Copy components from `product-plan/sections/supplier-invoices/components/`:
- Stats bar (Pending Review, Approved This Month, Total Variance, Avg Variance)
- Filter tabs (All, Pending, Approved, Rejected)
- Filter bar with status, date range, search
- Invoices table with variance highlighting
- Invoice review slide-out panel:
  - Header with PO info and status
  - Line items comparison table (original vs. submitted)
  - Additional costs table
  - Totals summary with variance
  - Supplier notes
  - Revision history timeline
  - Action buttons (Approve, Reject for Revision, Reject Final)
- Confirmation dialogs for each action
- Price history modal
- Empty states

### Data Layer

#### Supplier Invoice Management
- API endpoint: `GET /api/supplier-invoices` with filters (status, dateFrom, dateTo, search, page)
- API endpoint: `GET /api/supplier-invoices/:id` for detail
- API endpoint: `POST /api/supplier-invoices/:id/approve` (approve and update PO)
- API endpoint: `POST /api/supplier-invoices/:id/reject-revision` (create new invoice)
- API endpoint: `POST /api/supplier-invoices/:id/reject-final` (final rejection)
- Store: SupplierInvoice with lineItems, additionalCosts, variance calculations

#### Approval Process (backend logic)
When approved:
1. For each line item: create POLineItemPriceHistory record
2. Update PO line item unitCost to submitted value
3. Recalculate PO line item subtotals and PO totals
4. Create Cost records for additional costs
5. Update invoice status to "approved"
6. Log activity

#### Rejection for Revision (backend logic)
When rejected for revision:
1. Update current invoice status to "rejected"
2. Save rejection notes
3. Create new SupplierInvoice with incremented revisionNumber
4. Generate new magic link with fresh expiration
5. Send email to supplier with new link and notes

### Callbacks to Wire Up

| Callback | Action |
|----------|--------|
| `onStatusFilterChange` | Filter by status (All, Pending, Approved, Rejected) |
| `onDateRangeChange` | Filter by submitted date range |
| `onSearch` | Search by PO number or supplier name |
| `onSort` | Sort by date, variance, PO number |
| `onReviewClick` | Open review panel for invoice |
| `onApprove` | Show confirmation, then approve invoice |
| `onRejectRevision` | Show dialog requiring notes, create revision |
| `onRejectFinal` | Show dialog requiring notes, final reject |
| `onViewPO` | Navigate to Purchase Order detail |
| `onViewPriceHistory` | Open price history modal for line item |
| `onViewRevision` | View previous revision in chain |
| `onClosePanel` | Close review panel |

### Empty States

- **No invoices**: "No supplier invoices yet. Invoices will appear when suppliers respond to your purchase orders."
- **No pending**: "All caught up! No invoices pending review."
- **No results**: "No invoices match your filters." with clear filters button

## Files to Reference

- `product-plan/sections/supplier-invoices/README.md` — Section overview
- `product-plan/sections/supplier-invoices/components/` — React components
- `product-plan/sections/supplier-invoices/tests.md` — Test specifications
- `product/sections/supplier-invoices/spec.md` — Full specification
- `product/sections/supplier-invoices/types.ts` — TypeScript interfaces
- `product/sections/supplier-invoices/data.json` — Sample data

## Expected User Flows

### View Pending Invoices
1. User navigates to Supplier Invoices page
2. Default filter shows "Pending" status
3. Sees stats bar with pending count and variance metrics
4. Views table of invoices awaiting review
5. Can sort by submitted date, variance, or PO number

### Review and Approve Invoice
1. User clicks Review on a pending invoice
2. Review panel slides open
3. Sees PO context (number, supplier, date)
4. Reviews line items comparison (original vs. submitted prices)
5. Reviews additional costs (handling, rush, etc.)
6. Sees total variance amount and percentage
7. Reads supplier notes
8. Clicks Approve button
9. Confirmation dialog appears (optional notes)
10. Confirms approval
11. PO prices are updated, invoice marked approved

### Reject for Revision
1. User reviews invoice and finds unacceptable variance
2. Clicks "Reject for Revision" button
3. Dialog requires rejection notes
4. User enters notes explaining required changes
5. Confirms rejection
6. New invoice created with fresh magic link
7. Supplier receives email with link and revision notes

### View Price History
1. From invoice review or PO detail, user clicks line item
2. Price history modal opens
3. Shows timeline: initial price, supplier invoice changes, manual edits
4. Each entry shows date, price, reason, who made change
5. Links to supplier invoice (if price came from invoice)

## Done When

- [ ] Invoice list displays with variance highlighting
- [ ] Stats bar shows correct metrics (Pending, Approved, Variance)
- [ ] Status filter tabs work (All, Pending, Approved, Rejected)
- [ ] Date range and search filters work
- [ ] Review panel opens with full invoice details
- [ ] Line items comparison shows original vs. submitted prices
- [ ] Additional costs display correctly
- [ ] Variance calculations are accurate (amount and percentage)
- [ ] Approve workflow updates PO prices and creates history
- [ ] Reject for Revision creates new invoice with magic link
- [ ] Reject Final closes invoice without further action
- [ ] Revision history shows full chain of submissions
- [ ] Price history modal shows line item price changes
- [ ] Navigation to PO works from review panel
- [ ] Empty states display appropriately
- [ ] Responsive on mobile and desktop
- [ ] Dark mode support works
