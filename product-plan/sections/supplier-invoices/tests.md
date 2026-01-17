# Test Instructions: Supplier Invoices

These test-writing instructions are **framework-agnostic**.

## Overview

Test the supplier invoice review workflow including price comparison, approval/rejection flows, and price history tracking. Focus on variance calculations, PO updates on approval, and revision chain management.

## User Flow Tests

### Flow 1: View Pending Invoices

**Scenario:** User views list of invoices awaiting review

#### Success Path

**Setup:** Multiple invoices in various statuses

**Steps:**
1. Navigate to Supplier Invoices section
2. View stats bar (Pending, Approved This Month, Total Variance, Avg Variance)
3. Filter to "Pending" status (default)
4. Review invoices table
5. Sort by variance amount

**Expected Results:**
- [ ] Stats show accurate counts and calculations
- [ ] Pending filter shows only pending invoices
- [ ] Table columns: PO Number, Supplier, Submitted, Original Total, Submitted Total, Variance, Status, Actions
- [ ] Variance shows color (green negative, red positive)
- [ ] "Review" button visible for pending invoices

---

### Flow 2: Review Invoice

**Scenario:** User opens and reviews a pending invoice

#### Success Path

**Setup:** Pending invoice with multiple line items and additional costs

**Steps:**
1. Click "Review" on pending invoice row
2. Review panel opens
3. View header (PO Number, Supplier, Submitted By, Date)
4. Review line items comparison table
5. Review additional costs table
6. View totals summary with variance
7. Read supplier notes

**Expected Results:**
- [ ] Panel shows all invoice details
- [ ] Line items show: Product (SKU+name), Qty, Original Price, Submitted Price, Variance
- [ ] Per-line variance calculated correctly
- [ ] Additional costs show: Type badge, Description, Amount
- [ ] Totals show: Original Subtotal, Submitted Subtotal, Additional Costs, Total, Variance %

---

### Flow 3: Approve Invoice

**Scenario:** User approves a submitted invoice

#### Success Path

**Setup:** Pending invoice with acceptable prices

**Steps:**
1. Open invoice review panel
2. Click "Approve" button
3. Confirmation dialog appears
4. Optionally enter notes
5. Confirm approval

**Expected Results:**
- [ ] `onApproveInvoice` callback fires with invoice ID and notes
- [ ] PO line items update to submitted prices (implementation detail)
- [ ] POLineItemPriceHistory records created for each line
- [ ] Cost records created for additional costs
- [ ] Invoice status changes to "Approved"
- [ ] Activity logged

#### Failure Path: Missing Required Review

**Scenario:** System requires review of each variance before approval (if implemented)

**Expected Results:**
- [ ] Warning if any line item has significant variance unacknowledged

---

### Flow 4: Reject for Revision

**Scenario:** User requests supplier to revise and resubmit

#### Success Path

**Setup:** Pending invoice with unacceptable prices

**Steps:**
1. Open invoice review panel
2. Click "Reject for Revision" button
3. Dialog opens requiring notes
4. Enter revision request notes: "Please confirm pricing for line items 2 and 3"
5. Confirm rejection

**Expected Results:**
- [ ] `onRejectForRevision` callback fires with invoice ID and notes
- [ ] Notes are required (cannot submit empty)
- [ ] Current invoice status changes to "Rejected"
- [ ] New invoice created with revisionNumber + 1
- [ ] New magic link generated with fresh expiration
- [ ] previousInvoiceId links to rejected invoice

---

### Flow 5: Reject Final

**Scenario:** User rejects without allowing revision

#### Success Path

**Setup:** Pending invoice that should be closed

**Steps:**
1. Open invoice review panel
2. Click "Reject Final" button
3. Dialog opens requiring notes
4. Enter reason: "Pricing too high, will source elsewhere"
5. Confirm rejection

**Expected Results:**
- [ ] `onRejectFinal` callback fires with invoice ID and notes
- [ ] Notes are required
- [ ] Invoice status changes to "Rejected"
- [ ] No new invoice or magic link created

---

### Flow 6: View Price History

**Scenario:** User views price history for a line item

#### Success Path

**Setup:** Line item with multiple price changes

**Steps:**
1. In review panel, click on a line item
2. Price History modal opens
3. View timeline of price changes
4. Click link to view associated supplier invoice

**Expected Results:**
- [ ] Modal shows product info (SKU, name)
- [ ] Timeline shows each price change with: date, price, reason, who, invoice link
- [ ] Reasons include: "initial", "supplier_invoice", "manual_edit"
- [ ] `onViewSupplierInvoice` callback fires if clicking invoice link

---

### Flow 7: View Revision History

**Scenario:** User views chain of invoice revisions

#### Success Path

**Setup:** Invoice that has been revised multiple times

**Steps:**
1. Open invoice that shows "Revision 3"
2. View revision history section
3. Click to view Revision 1

**Expected Results:**
- [ ] Revision history shows chain: Revision 1 -> Revision 2 -> Revision 3
- [ ] Each revision shows status (rejected, revised, current pending)
- [ ] Can view any past revision's submitted data

---

### Flow 8: Navigate to PO

**Scenario:** User navigates to the associated Purchase Order

#### Success Path

**Setup:** Invoice linked to a PO

**Steps:**
1. Click PO number link in invoice list or review panel

**Expected Results:**
- [ ] `onViewPurchaseOrder` callback fires with poId
- [ ] PO number styled as clickable link

## Empty State Tests

### No Pending Invoices

**Scenario:** All invoices have been reviewed

**Steps:**
1. Filter to "Pending"

**Expected Results:**
- [ ] "All caught up!" message displays
- [ ] Stats show 0 pending

### No Invoices At All

**Scenario:** No supplier invoices exist

**Steps:**
1. Navigate to Supplier Invoices with no data

**Expected Results:**
- [ ] "No supplier invoices yet" message
- [ ] Explanation of how invoices are created (via magic links)

## Component Interaction Tests

### Variance Color Coding

**Test:** Variance displays correct colors

**Expected Results:**
- [ ] Negative variance (submitted < original): Green text/badge
- [ ] Positive variance (submitted > original): Red text/badge
- [ ] Zero variance: Neutral/gray

### Additional Cost Type Badges

**Test:** Cost types show correct labels

**Expected Results:**
- [ ] "handling" -> "Handling Fee"
- [ ] "rush" -> "Rush Fee"
- [ ] "tooling" -> "Tooling"
- [ ] "shipping" -> "Shipping"
- [ ] "inspection" -> "Inspection"
- [ ] "other" -> "Other"

### Status Badges

**Test:** Invoice statuses show correct styling

**Expected Results:**
- [ ] Pending: Amber badge
- [ ] Approved: Green badge
- [ ] Rejected: Red badge
- [ ] Revised: Blue badge (superseded)
- [ ] Expired: Gray badge

### Variance Calculations

**Test:** Variance percentages calculate correctly

**Expected Results:**
- [ ] Line variance = (submitted - original) / original * 100
- [ ] Total variance = submittedTotal - originalSubtotal
- [ ] Variance percent = variance / originalSubtotal * 100

## Edge Cases

- Invoice with $0 original price (division by zero in variance %)
- Invoice with all zero variance (should be easy approval)
- Additional cost marked "per unit" vs flat (calculatedTotal differs)
- Very high variance (>100%) - should be flagged or highlighted
- Invoice for PO that was cancelled (should warn or handle gracefully)
- Rapid approve/reject actions (prevent double-submission)

## Sample Test Data

```typescript
const sampleInvoice: SupplierInvoice = {
  id: 'si-001',
  purchaseOrderId: 'po-042',
  poNumber: 'PO-2024-042',
  supplierId: 'sup-001',
  supplierName: 'Acme Manufacturing',
  supplierEmail: 'sales@acme.com',
  magicLinkId: 'ml-123',
  magicLinkExpiresAt: '2026-02-15T00:00:00Z',
  magicLinkCreatedAt: '2026-01-15T00:00:00Z',
  submittedAt: '2026-01-16T14:30:00Z',
  submittedByName: 'Wang Wei',
  submittedByEmail: 'wang@acme.com',
  status: 'pending',
  reviewedAt: null,
  reviewedByUserId: null,
  reviewedByUserName: null,
  reviewNotes: null,
  lineItems: [
    {
      id: 'sili-1',
      supplierInvoiceId: 'si-001',
      poLineItemId: 'poli-1',
      sku: 'WDG-PRO-001',
      productName: 'Widget Pro X',
      quantity: 500,
      originalUnitCost: 10.00,
      submittedUnitCost: 12.50,
      originalSubtotal: 5000,
      submittedSubtotal: 6250,
      variance: 1250,
      variancePercent: 25,
      notes: 'Material costs increased',
    },
  ],
  additionalCosts: [
    {
      id: 'sic-1',
      supplierInvoiceId: 'si-001',
      type: 'handling',
      description: 'Custom packaging',
      amount: 150,
      perUnit: false,
      calculatedTotal: null,
      notes: null,
    },
  ],
  originalSubtotal: 5000,
  submittedSubtotal: 6250,
  additionalCostsTotal: 150,
  submittedTotal: 6400,
  variance: 1400,
  variancePercent: 28,
  supplierNotes: 'Material costs have increased since quote. Happy to discuss.',
  revisionNumber: 1,
  previousInvoiceId: null,
  createdAt: '2026-01-15T00:00:00Z',
  updatedAt: '2026-01-16T14:30:00Z',
}

const samplePriceHistory: POLineItemPriceHistory = {
  id: 'ph-001',
  poLineItemId: 'poli-1',
  purchaseOrderId: 'po-042',
  unitCost: 10.00,
  subtotal: 5000,
  changedAt: '2026-01-10T00:00:00Z',
  changedByUserId: 'user-1',
  changedByUserName: 'John Smith',
  changeReason: 'initial',
  supplierInvoiceId: null,
}

const sampleSummary: SupplierInvoiceSummary = {
  pendingCount: 5,
  approvedThisMonth: 12,
  totalVariance: 8500,
  avgVariancePercent: 15.2,
}
```
