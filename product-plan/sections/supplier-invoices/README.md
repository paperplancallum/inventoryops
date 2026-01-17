# Supplier Invoices

## Overview

Supplier Invoices capture price submissions from suppliers via magic link forms. When a Purchase Order is sent to a supplier, they may respond with actual prices that differ from the original quotes. This section provides a review workflow where users can compare submitted prices against original PO prices, approve or reject submissions, and automatically update PO line items upon approval while maintaining a complete revision history.

## User Flows

- View pending invoices awaiting review
- Filter by status (Pending, Approved, Rejected)
- Search by PO number or supplier name
- Open invoice review panel with price comparison
- Compare original vs submitted prices per line item
- Review additional costs (handling, rush, tooling, etc.)
- Approve invoice (updates PO line items automatically)
- Reject for revision (creates new magic link for supplier)
- Reject final (closes without further revision)
- View revision history for invoices
- View price history for line items

## Design Decisions

- Side-by-side price comparison for quick review
- Variance displayed as both amount and percentage
- Approval automatically creates price history records
- Rejection for revision generates new magic link with fresh expiration
- Color coding: green for lower prices, red for higher prices
- Multiple revisions tracked with chain of previousInvoiceId references

## Data Used

**Entities:** `SupplierInvoice`, `SupplierInvoiceLineItem`, `SupplierInvoiceCost`, `POLineItemPriceHistory`, `SupplierInvoiceSummary`

**From global model:**
- PurchaseOrder (linked PO)
- Supplier (supplier info)
- MagicLink (submission link)

## Visual Reference

See `screenshot.png` for the target UI design.

## Components Provided

- `SupplierInvoicesView` - Main list view with filters and stats
- `SupplierInvoiceReview` - Slide-out panel for reviewing submissions
- `PriceHistoryModal` - Modal showing price change timeline for a line item

## Callback Props

| Callback | Description |
|----------|-------------|
| `onViewInvoice` | Called when user clicks to view invoice details |
| `onViewPurchaseOrder` | Called when user clicks PO number to navigate |
| `onApproveInvoice` | Called when user approves an invoice with optional notes |
| `onRejectForRevision` | Called when user rejects with revision request (notes required) |
| `onRejectFinal` | Called when user rejects finally (notes required) |
| `onViewPriceHistory` | Called when user clicks to view line item price history |
