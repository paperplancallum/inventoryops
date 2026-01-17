# Test Instructions: Documents

These test-writing instructions are **framework-agnostic**.

## Overview

Test the document management system's ability to display, filter, and manage generated PDFs. Focus on filtering, document actions, and navigation to source records.

## User Flow Tests

### Flow 1: View Documents List

**Scenario:** User views all generated documents

#### Success Path

**Setup:** Documents exist of various types

**Steps:**
1. Navigate to Documents section
2. View summary cards (Total, POs, Inspections, Transfers, This Month)
3. Review documents table
4. Note document type badges and icons
5. View pagination controls

**Expected Results:**
- [ ] Summary cards show accurate counts
- [ ] Documents sorted by generated date (newest first) by default
- [ ] Each row shows: name, type badge, source reference, date, user, size, actions
- [ ] Type badges: indigo for PO, cyan for Inspection Brief, amber for Manifest, emerald for Packing List
- [ ] Pagination shows correct page count

---

### Flow 2: Filter Documents

**Scenario:** User filters documents by type and date range

#### Success Path

**Setup:** Documents exist across multiple types and dates

**Steps:**
1. Select "Purchase Order" from document type dropdown
2. Observe filtered results
3. Set date range (From: Jan 1, To: Jan 31)
4. Observe further filtered results
5. Enter search query for a reference number
6. Click "Clear Filters" button

**Expected Results:**
- [ ] Type filter reduces list to PO PDFs only
- [ ] Date range filter shows documents within range
- [ ] Search finds documents matching reference number
- [ ] Clear filters resets all filters to defaults
- [ ] `onFilterChange` callback fires on each filter change

---

### Flow 3: Preview Document

**Scenario:** User previews a document

#### Success Path

**Setup:** Generated PDF document exists

**Steps:**
1. Locate document in list
2. Click "Preview" action button
3. Document opens in new tab or modal

**Expected Results:**
- [ ] `onViewDocument` callback fires with document ID
- [ ] Preview shows PDF content (implementation detail)

---

### Flow 4: Download Document

**Scenario:** User downloads a document

#### Success Path

**Setup:** Document with valid PDF URL

**Steps:**
1. Click "Download" action button on document row

**Expected Results:**
- [ ] `onDownloadDocument` callback fires with document ID
- [ ] Browser initiates file download
- [ ] Downloaded filename matches document name

---

### Flow 5: Navigate to Source Record

**Scenario:** User navigates from document to its source entity

#### Success Path

**Setup:** Document generated from a PO

**Steps:**
1. Click source reference link (e.g., "PO-2024-001")
2. Verify navigation to PO detail

**Expected Results:**
- [ ] `onViewSourceRecord` callback fires with sourceType and sourceId
- [ ] Source reference is clickable link styling

---

### Flow 6: Delete Document

**Scenario:** User deletes a document

#### Success Path

**Setup:** Document exists that user wants to remove

**Steps:**
1. Click "Delete" action on document row
2. Confirmation modal appears
3. Review warning message
4. Click "Delete" to confirm

**Expected Results:**
- [ ] Confirmation modal shows document name
- [ ] Warning states deletion is permanent
- [ ] Cancel button closes modal without action
- [ ] Delete button triggers `onDeleteDocument` callback
- [ ] Document removed from list

#### Failure Path: Cancel Deletion

**Steps:**
1. Click "Delete" action
2. Click "Cancel" in confirmation modal

**Expected Results:**
- [ ] Modal closes
- [ ] Document remains in list

---

### Flow 7: View Document History for Entity

**Scenario:** User views all documents generated for a specific PO

#### Success Path

**Setup:** PO has multiple generated documents over time

**Steps:**
1. From PO detail, navigate to Documents tab/section
2. View list of all documents for this PO
3. Note document history shows revisions

**Expected Results:**
- [ ] DocumentHistory component shows documents filtered to this entity
- [ ] Documents sorted by date (newest first)
- [ ] "Generate New" button available

## Empty State Tests

### No Documents Exist

**Scenario:** System has no generated documents

**Steps:**
1. Navigate to Documents section

**Expected Results:**
- [ ] Empty state illustration displays
- [ ] Message: "No documents yet"
- [ ] Helper text explains how to generate documents
- [ ] Links to PO, Inspection, Transfer sections

### No Documents Match Filter

**Scenario:** Filters produce no results

**Steps:**
1. Apply restrictive filter combination

**Expected Results:**
- [ ] "No documents match your filters" message
- [ ] "Clear filters" button prominent

## Component Interaction Tests

### Document Type Badges

**Test:** Badges show correct colors and icons

**Expected Results:**
- [ ] Purchase Order: Indigo badge, document-text icon
- [ ] Inspection Brief: Cyan badge, clipboard-check icon
- [ ] Shipping Manifest: Amber badge, truck icon
- [ ] Packing List: Emerald badge, package icon

### File Size Formatting

**Test:** File sizes display in human-readable format

**Expected Results:**
- [ ] Bytes < 1KB: Show as bytes
- [ ] 1KB - 1MB: Show as "XXX KB"
- [ ] 1MB+: Show as "X.X MB"

### Sortable Columns

**Test:** Column sorting works correctly

**Steps:**
1. Click "Generated Date" column header
2. Click again to reverse sort
3. Click "Size" column header

**Expected Results:**
- [ ] Sort indicator shows on active column
- [ ] Data reorders appropriately
- [ ] Toggle between ascending/descending

## Edge Cases

- Very large document (>10MB) - should display size and allow download
- Document with very long name - should truncate with tooltip
- Source entity deleted - link should show "[Deleted]" or be disabled
- Multiple documents generated same second - should have unique identifiers
- Document generation in progress - loading state if applicable

## Sample Test Data

```typescript
const sampleDocument: GeneratedDocument = {
  id: 'doc-001',
  sourceEntityType: 'purchase-order',
  sourceEntityId: 'po-123',
  sourceEntityRef: 'PO-2024-001',
  documentType: 'purchase-order-pdf',
  documentName: 'PO-2024-001.pdf',
  generatedAt: '2026-01-15T10:30:00Z',
  generatedById: 'user-1',
  generatedByName: 'John Smith',
  pdfUrl: 'https://storage.example.com/docs/po-2024-001.pdf',
  fileSize: 125000, // 125 KB
  dataSnapshot: {
    poNumber: 'PO-2024-001',
    supplierName: 'Acme Supplier Co',
    orderDate: '2026-01-10',
    lineItems: [
      { sku: 'WDG-001', productName: 'Widget Pro', quantity: 500, unitCost: 10.50 },
    ],
    total: 5250,
  },
  notes: 'Sent to supplier via email',
}

const sampleSummary: DocumentsSummary = {
  total: 156,
  purchaseOrders: 89,
  inspections: 34,
  transfers: 33,
  thisMonth: 12,
}

const sampleFilters: DocumentsFilters = {
  sourceType: 'purchase-order',
  documentType: 'purchase-order-pdf',
  dateRange: { from: '2026-01-01', to: '2026-01-31' },
  searchQuery: 'PO-2024',
}
```
