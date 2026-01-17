# Test Instructions: Dashboard

These test-writing instructions are **framework-agnostic**.

## Overview

Test the dashboard's ability to aggregate and display business health metrics, surface urgent actions, and provide navigation to relevant sections. Focus on state transitions, click interactions, and responsive behavior.

## User Flow Tests

### Flow 1: View Healthy Dashboard

**Scenario:** User views dashboard with no critical issues

#### Success Path

**Setup:** No critical stock alerts, no overdue payments, no pending approvals

**Steps:**
1. Navigate to Dashboard
2. View Pulse Check widget
3. Review Key Metrics strip
4. View Health Cards
5. Confirm Action Needed section is hidden

**Expected Results:**
- [ ] Pulse Check shows green checkmark with "All clear"
- [ ] Key Metrics show current counts (Open POs, In Transit, Arriving, Owed)
- [ ] Inventory Health card shows high healthy percentage
- [ ] Cash Flow card shows $0 overdue
- [ ] Action Needed section is completely hidden (not showing empty state)

---

### Flow 2: View Dashboard with Issues

**Scenario:** User views dashboard with critical items needing attention

#### Success Path

**Setup:** Critical stock alerts, overdue payments, and pending supplier invoices exist

**Steps:**
1. Navigate to Dashboard
2. View Pulse Check widget
3. Click Pulse Check to scroll to actions
4. Review Action Needed list
5. Click an action item button

**Expected Results:**
- [ ] Pulse Check shows red alert with "X items need attention"
- [ ] Clicking Pulse Check scrolls to Action Needed section
- [ ] Action items sorted by priority (critical stock, overdue, pending approvals, inspections)
- [ ] Each item shows icon, description, and action button
- [ ] Maximum 5 items shown with "View all" link if more exist

---

### Flow 3: Navigate from Key Metrics

**Scenario:** User clicks metric cards to navigate to sections

#### Success Path

**Setup:** Dashboard loaded with metric data

**Steps:**
1. Click "Open POs" metric card
2. Verify navigation to Purchase Orders
3. Return to Dashboard
4. Click "In Transit" metric card
5. Verify navigation to Transfers
6. Click "Owed" metric card
7. Verify navigation to Invoices

**Expected Results:**
- [ ] `onNavigate` callback fires with 'purchase-orders' for Open POs
- [ ] `onNavigate` callback fires with 'transfers' for In Transit/Arriving
- [ ] `onNavigate` callback fires with 'invoices-and-payments' for Owed
- [ ] "Owed" displays in currency format ($X,XXX or $XXK)

---

### Flow 4: Navigate from Health Cards

**Scenario:** User clicks health card links to navigate

#### Success Path

**Setup:** Dashboard with inventory and cash flow data

**Steps:**
1. Click "View Suggestions" on Inventory Health card
2. Verify navigation
3. Return and click "View Invoices" on Cash Flow card

**Expected Results:**
- [ ] "View Suggestions" navigates to 'inventory-intelligence'
- [ ] "View Invoices" navigates to 'invoices-and-payments'
- [ ] Inventory Health shows alert count with breakdown (critical + warning)
- [ ] Cash Flow shows outstanding and overdue amounts

---

### Flow 5: Execute Action Item

**Scenario:** User executes an inline action from the action list

#### Success Path

**Setup:** Action items exist for various types

**Steps:**
1. Locate critical stock action item
2. Click "Accept PO" button
3. Locate overdue payment action item
4. Click "Record payment" button
5. Locate pending invoice action item
6. Click "Review" button

**Expected Results:**
- [ ] `onAction` callback fires with correct action item data
- [ ] Navigation target matches action type (PO, Invoices, Supplier Invoices)
- [ ] Entity ID passed for direct navigation

---

### Flow 6: View Week Timeline

**Scenario:** User reviews upcoming events in the timeline

#### Success Path

**Setup:** Events scheduled for next 5 days

**Steps:**
1. Scroll to Week Timeline section
2. Review day labels (e.g., "Thu 9")
3. View events under each day
4. Note empty days showing "--"

**Expected Results:**
- [ ] Timeline shows Today + next 4 days
- [ ] Transfer arrivals show truck icon with transfer number
- [ ] Inspections show clipboard icon with inspection reference
- [ ] PO completions show package icon
- [ ] Days with no events show "--"

---

### Flow 7: Use Quick Actions

**Scenario:** User uses quick action buttons for common tasks

#### Success Path

**Setup:** Dashboard loaded

**Steps:**
1. Click "+ New PO" button
2. Verify navigation
3. Click "+ Transfer" button
4. Verify navigation
5. Click "Log Inspection" button
6. Click "Record Payment" button

**Expected Results:**
- [ ] "+ New PO" navigates to purchase-orders with create modal
- [ ] "+ Transfer" navigates to transfers with create modal
- [ ] "Log Inspection" navigates to inspections with create modal
- [ ] "Record Payment" navigates to invoices with payment modal

## Empty State Tests

### No Action Items

**Scenario:** No items require user attention

**Steps:**
1. Load dashboard with zero critical/overdue/pending items

**Expected Results:**
- [ ] Action Needed section is completely hidden (not rendered)
- [ ] Pulse Check shows "All clear"

### No Upcoming Events

**Scenario:** No events in next 5 days

**Steps:**
1. Load dashboard with no scheduled events

**Expected Results:**
- [ ] All timeline days show "--"
- [ ] Timeline section still displays (days are always shown)

## Component Interaction Tests

### Pulse Check States

**Test:** Pulse check transitions between states

**Expected Results:**
- [ ] All Clear: Green checkmark, lime accent
- [ ] Needs Attention: Red alert icon, red accent, count displayed

### Metric Card Click Targets

**Test:** Entire card is clickable, not just text

**Steps:**
1. Click anywhere on metric card area

**Expected Results:**
- [ ] Navigation fires regardless of click position within card

### Health Progress Bars

**Test:** Progress bars render correctly

**Expected Results:**
- [ ] Inventory Health: Progress bar shows healthy percentage
- [ ] Bar is lime for >80%, amber for 50-80%, red for <50%

### Overdue Highlight

**Test:** Overdue amount highlighted in Cash Flow card

**Expected Results:**
- [ ] Overdue amount shows in red if > 0
- [ ] Normal styling if overdue is 0

## Edge Cases

- Very large metric numbers (should format as $XXK or $XXM)
- Action item with very long description (should truncate)
- Timeline event title overflow (should truncate)
- All metrics at zero (should display 0, not hide)
- Exactly 5 action items (no "View all" link needed)
- More than 5 action items (show "View all" link)

## Sample Test Data

```typescript
const sampleDashboardData: DashboardData = {
  pulseCheck: {
    status: 'needs_attention',
    attentionCount: 3,
  },
  keyMetrics: {
    openPOs: 12,
    inTransit: 5,
    arriving: 2,
    owed: 45000,
  },
  inventoryHealth: {
    healthyPercent: 78,
    alertCount: 8,
    criticalCount: 3,
    warningCount: 5,
  },
  cashFlow: {
    outstanding: 125000,
    overdue: 15000,
    dueThisWeek: 30000,
  },
  actionItems: [
    {
      id: 'act-1',
      type: 'stock',
      urgency: 'critical',
      title: 'Widget Pro X at FBA',
      description: 'Will stock out in 3 days',
      actionLabel: 'Accept Transfer',
      navigateTo: 'inventory-intelligence',
      entityId: 'sug-123',
    },
    {
      id: 'act-2',
      type: 'payment',
      urgency: 'critical',
      title: 'Invoice INV-2024-089',
      description: '15 days overdue - $5,000',
      actionLabel: 'Record payment',
      navigateTo: 'invoices-and-payments',
      entityId: 'inv-089',
    },
  ],
  timeline: [
    {
      date: '2026-01-15',
      dayLabel: 'Wed',
      dateLabel: '15',
      events: [
        { id: 'ev-1', date: '2026-01-15', type: 'arrival', title: 'T-154 arrives', subtitle: 'Amazon FBA' },
      ],
    },
    {
      date: '2026-01-16',
      dayLabel: 'Thu',
      dateLabel: '16',
      events: [],
    },
  ],
}
```
