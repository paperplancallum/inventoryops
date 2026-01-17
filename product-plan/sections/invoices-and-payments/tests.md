# Test Instructions: Invoices & Payments

These test-writing instructions are **framework-agnostic**.

## Overview
Test invoice management, payment recording, milestone tracking, and financial reporting functionality.

## User Flow Tests

### Flow 1: View Invoices List
**Scenario:** User views all invoices

#### Success Path
**Setup:** Invoices exist with various types and statuses

**Steps:**
1. Navigate to Invoices & Payments section
2. Observe invoice list and summary cards

**Expected Results:**
- [ ] Summary cards show: Total Invoices, Paid, Outstanding, Upcoming This Week, Overdue
- [ ] Table shows: Date, Description, Type, Linked Entity, Amount, Paid, Balance, Status
- [ ] Type badges colored by invoice type
- [ ] Status indicators: Unpaid, Partial, Paid, Overdue
- [ ] Rows expandable to show payment schedule

### Flow 2: Record Full Payment
**Scenario:** User pays an invoice in full

#### Success Path
**Setup:** Unpaid invoice with balance $5,000

**Steps:**
1. Click on invoice row
2. Detail panel opens
3. Click "Record Payment"
4. Modal opens
5. Enter amount: 5000
6. Select payment method: "Wire Transfer"
7. Enter reference: "WT-2024-0123"
8. Set date: today
9. Submit

**Expected Results:**
- [ ] Amount pre-filled with balance
- [ ] Payment method dropdown shows options
- [ ] After submit, invoice status changes to "Paid"
- [ ] Balance shows $0.00
- [ ] Payment appears in history

### Flow 3: Record Partial Payment
**Scenario:** User makes partial payment (milestone payment)

#### Success Path
**Setup:** Invoice with 30/70 payment terms, $10,000 total

**Steps:**
1. Open invoice detail
2. View payment schedule showing "30% Deposit" milestone
3. Click "Record Payment"
4. Enter amount: 3000 (30% of total)
5. Link to milestone "30% Deposit"
6. Submit

**Expected Results:**
- [ ] Invoice status changes to "Partial"
- [ ] Balance shows $7,000 remaining
- [ ] Milestone "30% Deposit" marked as paid
- [ ] Next milestone highlighted

### Flow 4: View Payment Schedule
**Scenario:** User reviews upcoming payment milestones

#### Success Path
**Setup:** Invoice with multi-milestone schedule

**Steps:**
1. Open invoice detail
2. View Payment Schedule section

**Expected Results:**
- [ ] Each milestone shows: name, percentage, trigger event, due date, status
- [ ] Pending milestones show trigger conditions
- [ ] Triggered milestones show calculated due date
- [ ] Paid milestones show payment date and checkmark

### Flow 5: Navigate to Linked Entity
**Scenario:** User opens source entity from invoice

#### Success Path
**Setup:** Product invoice linked to PO

**Steps:**
1. View invoice detail
2. Click linked entity link (e.g., "PO-2024-0042")

**Expected Results:**
- [ ] Navigates to Purchase Order detail
- [ ] PO shows this invoice in its invoices section
- [ ] Back navigation returns to Invoices

### Flow 6: Filter Invoices by Type
**Scenario:** User filters to see only shipping invoices

#### Success Path
**Setup:** Invoices of multiple types exist

**Steps:**
1. Click type filter dropdown
2. Select "Shipping/Freight"
3. Observe filtered results

**Expected Results:**
- [ ] Only shipping invoices display
- [ ] Summary cards update to reflect filter
- [ ] Filter chip shows selection

### Flow 7: View Overdue Invoices
**Scenario:** User checks overdue payments

#### Success Path
**Setup:** Some invoices past due date

**Steps:**
1. Click "Overdue" count in summary cards
2. Or filter by status "Overdue"

**Expected Results:**
- [ ] List filters to overdue invoices only
- [ ] Invoices sorted by how overdue (oldest first)
- [ ] Visual indicator of days overdue
- [ ] Total overdue amount shown

## Empty State Tests

### No Invoices
**Setup:** No invoices in system

**Steps:**
1. Navigate to Invoices & Payments

**Expected Results:**
- [ ] Empty state illustration
- [ ] "No invoices yet" message
- [ ] Explains invoices created from POs/Transfers
- [ ] Summary cards show zeros

### No Payments on Invoice
**Setup:** Invoice with zero payments

**Steps:**
1. Open invoice detail
2. View Payments section

**Expected Results:**
- [ ] "No payments recorded" message
- [ ] "Record Payment" button prominent

## Component Interaction Tests

### Expand Invoice Row
**Setup:** Invoice with payment schedule

**Steps:**
1. Click expand arrow on invoice row
2. Observe expanded content

**Expected Results:**
- [ ] Payment schedule milestones display inline
- [ ] Shows trigger status for each milestone
- [ ] Compact format suitable for list view

### Sort by Amount
**Steps:**
1. Click "Amount" column header
2. Observe sort order
3. Click again

**Expected Results:**
- [ ] First click: ascending
- [ ] Second click: descending
- [ ] Sort indicator visible

### Payment Method Selection
**Steps:**
1. In Record Payment modal
2. View payment method options

**Expected Results:**
- [ ] Options: Wire Transfer, Credit Card, PayPal, Check, Other
- [ ] Each option has clear label
- [ ] Selected method stored with payment

## Edge Cases

### Payment Exceeds Balance
**Setup:** Invoice with $1,000 balance

**Steps:**
1. Try to record payment of $1,500

**Expected Results:**
- [ ] Validation error or warning
- [ ] Cannot overpay invoice
- [ ] Suggests correct amount

### Payment with Attachments
**Setup:** Need to attach proof of payment

**Steps:**
1. Record Payment modal
2. Attach file (receipt, wire confirmation)
3. Submit

**Expected Results:**
- [ ] File upload functional
- [ ] Attachment stored with payment
- [ ] Viewable in payment history

### Milestone Trigger Events
**Setup:** Invoice with untriggered milestones

**Steps:**
1. Trigger event occurs (e.g., PO confirmed)
2. Observe milestone update

**Expected Results:**
- [ ] Milestone status changes to "triggered"
- [ ] Due date calculated (trigger date + offset days)
- [ ] Payment now due

### Invoice Currency
**Setup:** Invoices in different currencies

**Expected Results:**
- [ ] Currency symbol displays correctly
- [ ] Amounts format appropriately (decimals)
- [ ] Summary totals handle currency

## Sample Test Data

```typescript
const sampleInvoice: Invoice = {
  id: 'inv-001',
  date: '2024-01-20',
  description: 'Water Bottle Production - PO-2024-0042',
  type: 'product',
  linkedEntityType: 'purchase-order',
  linkedEntityId: 'po-001',
  linkedEntityName: 'PO-2024-0042',
  amount: 10000.00,
  paidAmount: 3000.00,
  balance: 7000.00,
  status: 'partial',
  paymentSchedule: [
    {
      id: 'ps-001',
      milestoneName: '30% Deposit',
      percentage: 30,
      amount: 3000.00,
      trigger: 'po-confirmed',
      triggerStatus: 'triggered',
      triggerDate: '2024-01-16',
      dueDate: '2024-01-16',
      paidDate: '2024-01-18',
      paidAmount: 3000.00
    },
    {
      id: 'ps-002',
      milestoneName: '70% Balance',
      percentage: 70,
      amount: 7000.00,
      trigger: 'inspection-passed',
      triggerStatus: 'pending',
      triggerDate: null,
      dueDate: null,
      paidDate: null,
      paidAmount: 0
    }
  ],
  payments: [
    {
      id: 'pmt-001',
      date: '2024-01-18',
      amount: 3000.00,
      method: 'wire-transfer',
      reference: 'WT-2024-0123',
      scheduleItemId: 'ps-001'
    }
  ],
  notes: 'Deposit paid on time',
  creationMethod: 'manual',
  paymentTermsTemplateId: 'template-30-70'
}

const samplePaymentTermsTemplate: PaymentTermsTemplate = {
  id: 'template-30-70',
  name: 'Standard 30/70',
  description: '30% deposit on confirmation, 70% after inspection',
  milestones: [
    {
      id: 'ms-001',
      name: '30% Deposit',
      percentage: 30,
      trigger: 'po-confirmed',
      offsetDays: 0
    },
    {
      id: 'ms-002',
      name: '70% Balance',
      percentage: 70,
      trigger: 'inspection-passed',
      offsetDays: 7
    }
  ]
}

const sampleNewPayment: NewPayment = {
  amount: 7000.00,
  date: '2024-02-20',
  method: 'wire-transfer',
  reference: 'WT-2024-0456',
  attachments: []
}
```
