# Milestone 6: Invoices & Payments

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete, Milestone 4 (Purchase Orders) recommended

---

## Goal

Implement a centralized invoice management system for tracking all costs across purchase orders, transfers, and inspections, with payment scheduling and landed cost calculation.

## Overview

Users can view all invoices generated from various source entities (POs, transfers, inspections), record payments against invoices, track payment schedules with milestone-based triggers, and calculate landed cost per unit by distributing costs across batches.

**Key Functionality:**
- View invoices list with financial summary stats
- Filter invoices by type (product, shipping, duties, inspection, storage)
- View invoice details with payment schedule and milestone status
- Record partial or full payments against invoices
- View payment history across all invoices
- Calculate landed cost per unit

---

## Recommended Approach: Test-Driven Development

Before implementing each component, write tests based on the user flows below:

1. **Write failing tests** for the expected behavior
2. **Implement** the minimum code to pass tests
3. **Refactor** while keeping tests green

Focus tests on:
- Invoice list filtering and sorting
- Payment recording (partial and full)
- Milestone trigger status calculations
- Financial summary calculations
- Payment status transitions (unpaid -> partial -> paid, overdue detection)

---

## What to Implement

### 1. Components

Copy the provided components from `product-plan/sections/invoices-and-payments/components/`:
- `InvoicesPayments.tsx` — Main view with tabs for Invoices and Payments
- `InvoiceDetailPanel.tsx` — Slide-over panel for invoice details
- `PaymentSchedule.tsx` — Display payment milestones with trigger status
- `RecordPaymentModal.tsx` — Modal for recording payments

### 2. Data Layer

**API Endpoints:**
```
GET    /api/invoices                    # List all invoices with filters
GET    /api/invoices/:id                # Get invoice details
POST   /api/invoices/:id/payments       # Record a payment
GET    /api/payments                    # List all payments (for Payments tab)
GET    /api/invoices/summary            # Get financial summary stats
GET    /api/payment-terms-templates     # List available payment terms templates
```

**Database Schema:**
- `invoices` table with type, linked entity reference, amount fields
- `payments` table linked to invoices
- `payment_schedule_items` table for milestone tracking
- `payment_terms_templates` table for reusable templates

### 3. Callbacks

Wire up these callback props:
- `onRecordPayment` — POST payment, update invoice balance/status
- `onViewLinkedEntity` — Navigate to source entity (PO, Transfer, Inspection)
- `onViewInvoice` — Open invoice detail panel

### 4. Empty States

Handle these empty states:
- No invoices yet (new account)
- No invoices matching current filters
- No payments recorded on an invoice
- No payment schedule items (simple invoice)

---

## Files to Reference

- `product-plan/sections/invoices-and-payments/README.md` — Section overview
- `product-plan/sections/invoices-and-payments/spec.md` — Detailed specification
- `product-plan/sections/invoices-and-payments/types.ts` — TypeScript interfaces
- `product-plan/sections/invoices-and-payments/data.json` — Sample data
- `product-plan/sections/invoices-and-payments/components/` — React components

---

## Expected User Flows

### View Invoice List with Filters
1. User navigates to Invoices & Payments
2. Financial summary cards show totals (Total, Paid, Outstanding, Overdue)
3. User filters by invoice type (e.g., "Shipping")
4. Table updates to show only shipping invoices
5. User can expand row to see payment schedule milestones

### View Invoice Details
1. User clicks on an invoice row
2. Detail panel slides open showing full invoice info
3. Payment schedule displays each milestone with:
   - Milestone name and percentage
   - Trigger event and status (pending/triggered/overdue)
   - Due date (if triggered)
   - Payment status
4. Payment history shows all recorded payments

### Record Payment
1. User clicks "Record Payment" on an invoice
2. Modal opens with payment form
3. User enters amount, date, method, reference
4. User optionally uploads payment confirmation
5. User submits payment
6. Invoice balance updates, status changes if fully paid

### View Payment History
1. User clicks "Payments" tab
2. Chronological list of all payments across invoices
3. Each payment shows invoice reference, amount, date, method
4. User can click to navigate to source invoice

### View Landed Cost
1. User views an invoice linked to a batch/PO
2. System displays cost allocation showing:
   - Product cost from PO
   - Proportional shipping costs
   - Duties and taxes
   - Inspection fees
   - Total landed cost per unit

---

## Done When

- [ ] Invoice list displays with financial summary stats
- [ ] Filters work for invoice type, status, linked entity
- [ ] Invoice detail panel shows payment schedule with milestone status
- [ ] Payments can be recorded (partial and full)
- [ ] Payment status updates correctly (unpaid -> partial -> paid)
- [ ] Overdue detection works based on due dates
- [ ] Payments tab shows all payments with invoice context
- [ ] Navigation to linked entities works (PO, Transfer, Inspection)
- [ ] Empty states display appropriately
- [ ] Responsive on mobile and desktop
- [ ] Dark mode support works
