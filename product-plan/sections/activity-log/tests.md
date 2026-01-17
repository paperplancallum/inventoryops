# Test Instructions: Activity Log

These test-writing instructions are **framework-agnostic**.

## Overview

Test the activity log's ability to display, filter, and navigate system-wide change history. Focus on filter combinations, entry expansion, and entity navigation.

## User Flow Tests

### Flow 1: View Activity Log

**Scenario:** User views the chronological list of all activity

#### Success Path

**Setup:** Activity log has 50+ entries across multiple entity types

**Steps:**
1. Navigate to Activity Log section
2. Observe list loads with entries sorted newest first
3. Verify each entry shows timestamp, user avatar, action badge, entity icon and name
4. Click summary card for "Total Entries"

**Expected Results:**
- [ ] Entries display in reverse chronological order
- [ ] Each entry shows relative timestamp (e.g., "2 hours ago")
- [ ] User avatars display or show initials placeholder
- [ ] Action badges show appropriate colors (green=create, blue=update, red=delete, amber=status_change)
- [ ] Entity type icons distinguish between different entity types

#### Failure Path: Empty State

**Setup:** No activity log entries exist

**Steps:**
1. Navigate to Activity Log section

**Expected Results:**
- [ ] Empty state message displays
- [ ] Summary cards show zero counts

---

### Flow 2: Filter Activity Log

**Scenario:** User filters entries by entity type, action type, user, and date range

#### Success Path

**Setup:** Activity log has entries for Products, POs, Transfers with various action types

**Steps:**
1. Select "Product" from entity type dropdown
2. Observe filtered results
3. Add "Updated" from action type dropdown
4. Observe further filtered results
5. Select a specific user from user dropdown
6. Set date range to last 7 days
7. Verify filter combination

**Expected Results:**
- [ ] Each filter reduces result count appropriately
- [ ] Active filters display as removable chips or indicators
- [ ] Results count updates with each filter change
- [ ] Clear filters button resets all filters

#### Failure Path: No Results Match Filters

**Setup:** Apply filters that match no entries

**Steps:**
1. Select filters that produce zero results

**Expected Results:**
- [ ] "No activity matches filters" message displays
- [ ] Option to clear filters is visible

---

### Flow 3: Expand Entry Details

**Scenario:** User expands an entry to see field-level changes

#### Success Path

**Setup:** Activity log has an "update" entry with multiple field changes

**Steps:**
1. Locate an entry with action type "Updated"
2. Click on entry row to expand
3. Review field-by-field change details
4. Click again to collapse

**Expected Results:**
- [ ] Expansion animation is smooth
- [ ] Each changed field shows: field label, old value, new value
- [ ] Values are formatted by type (currency shows $, dates formatted, booleans show Yes/No)
- [ ] Status fields show colored badges
- [ ] Collapse returns row to compact state

---

### Flow 4: Navigate to Entity

**Scenario:** User clicks entity name to view the source entity

#### Success Path

**Setup:** Entry exists for a Product update

**Steps:**
1. Locate entry for a Product entity
2. Click the entity name link
3. Verify navigation occurs

**Expected Results:**
- [ ] `onViewEntity` callback fires with correct entityType and entityId
- [ ] Entity name is visually styled as a clickable link

---

### Flow 5: Group Entries

**Scenario:** User groups entries by day, entity, or user

#### Success Path

**Setup:** Activity log has entries spanning multiple days from multiple users

**Steps:**
1. Select "Group by Day" option
2. Observe date group headers
3. Switch to "Group by User"
4. Observe user group headers
5. Switch to "Group by Entity"
6. Observe entity group headers

**Expected Results:**
- [ ] Day grouping shows date headers (e.g., "January 15, 2026")
- [ ] User grouping shows user name headers with avatar
- [ ] Entity grouping shows entity type and name headers
- [ ] Entry counts per group are visible

---

### Flow 6: Export Activity Log

**Scenario:** User exports the current filtered view to CSV

#### Success Path

**Setup:** Filters applied to show subset of entries

**Steps:**
1. Apply desired filters
2. Click "Export" button
3. Verify export triggers

**Expected Results:**
- [ ] `onExport` callback fires
- [ ] Export includes only filtered entries (implementation detail)

## Empty State Tests

### Primary Empty State

**Scenario:** No activity log entries exist

**Steps:**
1. Access activity log with zero entries

**Expected Results:**
- [ ] Empty state illustration displays
- [ ] Message: "No activity yet"
- [ ] Helpful text explains activity will appear as changes are made

### Filtered Empty State

**Scenario:** Filters produce no matching results

**Steps:**
1. Apply restrictive filter combination

**Expected Results:**
- [ ] "No matching activity" message displays
- [ ] "Clear filters" button is prominent

## Component Interaction Tests

### Field Change Display

**Test:** Different value types render correctly

**Steps:**
1. Find entries with various field types changed

**Expected Results:**
- [ ] Text values display as plain text
- [ ] Number values display formatted with commas
- [ ] Currency values display with currency symbol
- [ ] Date values display in readable format
- [ ] Boolean values display as "Yes"/"No" or checkmark/x
- [ ] Status values display as colored badges

### Load More / Pagination

**Test:** Infinite scroll or pagination works

**Steps:**
1. Scroll to bottom of entry list
2. Trigger load more

**Expected Results:**
- [ ] Loading indicator appears
- [ ] Additional entries append to list
- [ ] `onLoadMore` callback fires
- [ ] If no more entries, "No more entries" message

## Edge Cases

- Entry with 20+ field changes (should scroll or truncate)
- Entry for deleted entity (entity link should be disabled or show "[Deleted]")
- Entry with null old value (create action)
- Entry with null new value (field cleared)
- Very long field values (should truncate with tooltip)
- Entry from system user (non-human changes)

## Sample Test Data

```typescript
const sampleEntry: ActivityLogEntry = {
  id: 'act-001',
  timestamp: '2026-01-15T10:30:00Z',
  user: {
    id: 'user-1',
    name: 'John Smith',
    email: 'john@example.com',
    avatarUrl: null,
  },
  entityType: 'product',
  entityId: 'prod-123',
  entityName: 'Widget Pro X',
  action: 'update',
  changes: [
    {
      field: 'unitCost',
      fieldLabel: 'Unit Cost',
      oldValue: 10.50,
      newValue: 12.00,
      valueType: 'currency',
    },
    {
      field: 'status',
      fieldLabel: 'Status',
      oldValue: 'active',
      newValue: 'discontinued',
      valueType: 'status',
    },
  ],
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  notes: 'Price adjustment per supplier invoice',
}

const sampleFilters: ActivityLogFilters = {
  searchQuery: '',
  entityTypes: ['product', 'purchase-order'],
  actionTypes: ['update', 'status_change'],
  userIds: [],
  dateFrom: '2026-01-01',
  dateTo: '2026-01-31',
  groupBy: 'day',
}
```
