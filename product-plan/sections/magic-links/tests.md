# Test Instructions: Magic Links

These test-writing instructions are **framework-agnostic**.

## Overview

Test the magic link lifecycle from generation through submission, including internal management views and external-facing forms. Focus on security, expiration handling, and form validation.

## User Flow Tests

### Flow 1: Generate Magic Link

**Scenario:** User generates a magic link from a Purchase Order

#### Success Path

**Setup:** PO exists with supplier email/name populated

**Steps:**
1. From PO detail, click "Generate Magic Link"
2. Modal opens with pre-filled recipient email and name
3. Select expiration period (7, 14, or 30 days)
4. Optionally enter custom message
5. Check "Send Immediately" checkbox
6. Click "Generate"
7. View confirmation with link URL

**Expected Results:**
- [ ] Modal pre-fills recipient from supplier data
- [ ] Expiration dropdown shows valid options
- [ ] Generated link URL displays for manual copying
- [ ] `onGenerate` callback fires with correct data
- [ ] Link appears in Magic Links list with "Active" status

#### Failure Path: Missing Required Fields

**Setup:** Modal open without recipient email

**Steps:**
1. Clear recipient email field
2. Click "Generate"

**Expected Results:**
- [ ] Validation error shows for email field
- [ ] Form does not submit

---

### Flow 2: View Magic Links List

**Scenario:** User views and filters all magic links

#### Success Path

**Setup:** Multiple magic links exist with various statuses

**Steps:**
1. Navigate to Magic Links section
2. View stats bar (Active, Pending, Submitted, Expiring Soon)
3. Click "Active" filter chip
4. Observe filtered results
5. Search by recipient email
6. Sort by expiration date

**Expected Results:**
- [ ] Stats cards show accurate counts
- [ ] Filter reduces list to active links only
- [ ] Search finds matching recipient emails
- [ ] Table displays: Entity, Recipient, Purpose, Status, Created, Expires, Actions

---

### Flow 3: Send Reminder

**Scenario:** User sends reminder for a pending link

#### Success Path

**Setup:** Active link exists that was sent but not yet submitted

**Steps:**
1. Locate link in list
2. Click actions menu, select "Send Reminder"
3. Confirm reminder

**Expected Results:**
- [ ] `onSendReminder` callback fires with link ID
- [ ] Event added to link timeline (implementation detail)
- [ ] Success toast/message displays

---

### Flow 4: Revoke Link

**Scenario:** User revokes an active link

#### Success Path

**Setup:** Active magic link exists

**Steps:**
1. Click actions menu for active link
2. Select "Revoke"
3. Confirm revocation in dialog

**Expected Results:**
- [ ] `onRevokeLink` callback fires with link ID
- [ ] Link status changes to "Revoked"
- [ ] Link no longer usable by external party

---

### Flow 5: Regenerate Link

**Scenario:** User regenerates an expired link

#### Success Path

**Setup:** Expired or revoked link exists

**Steps:**
1. Locate expired/revoked link
2. Click "Regenerate"
3. New link created with fresh expiration

**Expected Results:**
- [ ] `onRegenerateLink` callback fires
- [ ] New link created with "Active" status
- [ ] Original link marked as "regenerated"
- [ ] New expiration date set

---

### Flow 6: View Link Detail

**Scenario:** User views full detail and timeline for a link

#### Success Path

**Setup:** Link exists with multiple events (created, sent, viewed)

**Steps:**
1. Click on link to open detail panel
2. View header with entity and recipient info
3. View status and expiration
4. Scroll through event timeline
5. View submission data (if submitted)

**Expected Results:**
- [ ] Detail panel opens with all link information
- [ ] Timeline shows chronological events with timestamps
- [ ] Entity link is clickable to navigate to PO/Transfer
- [ ] Actions available based on link status

---

### Flow 7: External Supplier Invoice Submission

**Scenario:** Supplier submits invoice via magic link

#### Success Path

**Setup:** Valid magic link for invoice submission

**Steps:**
1. Supplier clicks magic link in email
2. Form loads with read-only PO info (products, quantities)
3. Supplier enters unit price for each line item
4. Supplier adds additional cost (e.g., handling fee)
5. Supplier enters name, email, and notes
6. Clicks "Submit Invoice"
7. Confirmation page displays

**Expected Results:**
- [ ] PO info displays as read-only
- [ ] Price inputs accept valid currency amounts
- [ ] Additional costs can be added/removed
- [ ] Validation prevents submission without required fields
- [ ] `onSubmit` callback fires with submission data
- [ ] Confirmation page shows success message

#### Failure Path: Expired Link

**Setup:** Supplier clicks expired magic link

**Steps:**
1. Click expired link

**Expected Results:**
- [ ] Error page displays: "This link has expired"
- [ ] No form access available
- [ ] Contact information provided

#### Failure Path: Already Submitted

**Setup:** Supplier clicks link that was already used

**Steps:**
1. Click previously submitted link

**Expected Results:**
- [ ] Message displays: "This form has already been submitted"
- [ ] Reference to original submission shown

---

### Flow 8: External Transfer Document Upload

**Scenario:** Shipping partner uploads documents via magic link

#### Success Path

**Setup:** Valid magic link for document upload

**Steps:**
1. Partner clicks magic link
2. Form loads with read-only transfer info
3. Partner uploads Bill of Lading (drag-drop or file picker)
4. Partner uploads Proof of Delivery
5. Partner enters tracking update
6. Partner enters name, email, notes
7. Clicks "Submit Documents"

**Expected Results:**
- [ ] Transfer info displays as read-only
- [ ] File upload areas accept valid file types
- [ ] Upload progress indicators show
- [ ] Required documents are enforced
- [ ] `onSubmit` callback fires with document URLs and metadata

## Empty State Tests

### No Magic Links

**Scenario:** No magic links have been created

**Steps:**
1. Navigate to Magic Links section

**Expected Results:**
- [ ] Empty state message displays
- [ ] Prompt to generate first link from a PO or Transfer

### No Active Links

**Scenario:** All links are submitted, expired, or revoked

**Steps:**
1. Filter to "Active" status

**Expected Results:**
- [ ] "No active links" message displays
- [ ] Stats show 0 for Active Links

## Component Interaction Tests

### Expiration Warning

**Test:** Link shows warning when expiring within 24 hours

**Steps:**
1. View link expiring soon

**Expected Results:**
- [ ] Expiring soon badge/indicator displays
- [ ] Stats card "Expiring Soon" count includes this link

### Status Badge Colors

**Test:** Status badges show correct colors

**Expected Results:**
- [ ] Active: Green badge
- [ ] Submitted: Blue badge
- [ ] Expired: Gray badge
- [ ] Revoked: Red badge

## Edge Cases

- Link accessed from different IP (should still work, log IP)
- Very long custom message in generation (should truncate or warn)
- Supplier submits price of $0 (should be valid)
- Additional cost with very high amount (no upper limit enforced)
- Document upload fails mid-upload (retry option)
- Form submission during network issue (retry handling)

## Sample Test Data

```typescript
const sampleMagicLink: MagicLink = {
  id: 'ml-001',
  tokenHash: 'abc123hash',
  linkedEntityType: 'purchase-order',
  linkedEntityId: 'po-456',
  linkedEntityName: 'PO-2024-0042',
  purpose: 'invoice-submission',
  status: 'active',
  createdAt: '2026-01-10T09:00:00Z',
  expiresAt: '2026-01-24T09:00:00Z',
  sentAt: '2026-01-10T09:05:00Z',
  firstViewedAt: '2026-01-10T14:30:00Z',
  submittedAt: null,
  revokedAt: null,
  recipientEmail: 'supplier@example.com',
  recipientName: 'Wang Wei',
  recipientRole: 'Supplier',
  createdByUserId: 'user-1',
  createdByUserName: 'John Smith',
  submissionData: null,
  notes: '',
}

const sampleInvoiceSubmission: SupplierInvoiceSubmissionData = {
  lineItems: [
    { lineItemId: 'li-1', submittedUnitCost: 12.50, notes: null },
    { lineItemId: 'li-2', submittedUnitCost: 8.75, notes: 'Price increased due to material costs' },
  ],
  additionalCosts: [
    { type: 'handling', description: 'Packaging fee', amount: 150 },
  ],
  supplierNotes: 'Please confirm receipt',
  submittedByName: 'Wang Wei',
  submittedByEmail: 'wang@supplier.com',
}
```
