# Invoices & Payments

## Overview
Track all invoices generated from purchase orders, shipments, transfers, and inspections. Invoices are created manually from source entities with conditional enabling based on entity status. This section provides a central view for managing payment schedules and recording payments. Calculate landed cost per unit by distributing costs across batches.

## User Flows
- View all invoices in a chronological list with filters by type, entity, and payment status
- View invoice details including payment terms and milestone status
- Record payments against invoices (partial or full)
- View upcoming payment schedule with due dates and trigger status
- See financial summary: total invoices, paid, outstanding, overdue
- Create invoices from source entities (PO, Transfer, Inspection)
- Track payment milestones with event-driven triggers
- View landed cost per unit for any product/batch

## Design Decisions
- Invoices created manually from source entities (not automatic)
- Payment terms use reusable templates with milestone-based schedules
- Milestones triggered by events (po-confirmed, inspection-passed, shipment-departed, etc.)
- Invoice types: Product, Shipping/Freight, Customs/Duties, Inspection, Storage
- Each source entity shows invoice creation button when eligible
- Expandable rows show payment schedule within list view

## Data Used
**Entities:** Invoice, Payment, PaymentWithInvoice, PaymentScheduleItem, PaymentMilestone, PaymentTermsTemplate, FinancialSummary

**From global model:** Invoices, Payments, Purchase Orders, Transfers, Inspections, Payment Terms Templates

## Visual Reference
See `screenshot.png` for the target UI design.

## Components Provided
- `InvoicesPaymentsView` - Main view with invoice list and summary
- `InvoiceTable` - Expandable table of all invoices
- `InvoiceDetailPanel` - Full invoice detail with payment schedule
- `RecordPaymentModal` - Form for recording payments
- `PaymentScheduleDisplay` - Visual milestone progress
- `FinancialSummaryCards` - Stats cards for totals

## Callback Props
| Callback | Description |
|----------|-------------|
| `onRecordPayment` | Called when user records payment (receives invoiceId, NewPayment) |
| `onViewLinkedEntity` | Called when user clicks linked entity (receives type, id) |
| `onViewInvoice` | Called when user views invoice detail (receives id) |
| `onClose` | Called when detail panel is closed |
