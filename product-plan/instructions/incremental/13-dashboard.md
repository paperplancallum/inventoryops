# Milestone 13: Dashboard

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete, Purchase Orders section, Transfers section, Inventory section, Invoices & Payments section, Inspections section, Inventory Intelligence section

---

## Goal

Implement the unified business health dashboard that answers "Am I okay?" at a glance while surfacing urgent actions and upcoming operations.

## Overview

The Dashboard serves as the home screen for the application, aggregating key metrics from all sections into a single view. It highlights items needing attention, shows the weekly timeline of events, and provides quick actions for common tasks.

**Key Functionality:**

- Pulse Check hero showing overall health status
- Key metrics strip (Open POs, In Transit, Arriving, Owed)
- Inventory Health and Cash Flow cards
- Prioritized Action Needed list with inline actions
- 5-day timeline showing upcoming events
- Quick action buttons for common tasks

## Recommended Approach: Test-Driven Development

Before implementing, write tests based on `product-plan/sections/dashboard/tests.md`:

1. Write tests for metric calculations and aggregations
2. Write tests for pulse check state determination
3. Write tests for action item prioritization
4. Write tests for timeline event aggregation
5. Implement components to pass tests

## What to Implement

### Components

Copy from `product-plan/sections/dashboard/components/`:

- Pulse Check hero with status indicator
- Key Metrics strip (4 compact cards)
- Inventory Health card with progress bar
- Cash Flow card with outstanding/overdue
- Action Needed list with inline action buttons
- This Week Timeline (5-day horizontal view)
- Quick Actions bar

### Data Layer

Create API endpoints to aggregate data from multiple sections:

- **Pulse Check**: Count of critical items (stock alerts, overdue payments, pending approvals)
- **Key Metrics**:
  - Open POs: Count where status in (draft, sent, confirmed, partially_received)
  - In Transit: Transfer count where status = 'in_transit'
  - Arriving: Transfers with estimatedArrival within 7 days
  - Owed: Sum of invoice balance where status in ('unpaid', 'partial')
- **Inventory Health**: Percentage of SKUs at healthy stock, alert count
- **Cash Flow**: Outstanding balance, overdue amount
- **Action Items**: Aggregated from stock suggestions, payments, invoices, inspections
- **Timeline Events**: Transfer arrivals, inspections, PO completions for next 5 days

### Callbacks

Wire up these callback props:

- `onNavigate(section, params)` - Navigate to any section
- `onQuickAction(action)` - Handle quick action button clicks
- `onActionItemClick(itemId)` - Handle action item inline buttons
- `onRefresh()` - Refresh all dashboard data

### Navigation Targets

Map navigation callbacks to sections:

- `inventory-intelligence` - For stock suggestions
- `invoices-and-payments` - For payments and invoices
- `purchase-orders` - For PO actions (with optional create modal)
- `transfers` - For transfer actions (with optional create modal)
- `inspections` - For inspection actions (with optional create modal)
- `supplier-invoices` - For supplier invoice reviews

### Action Item Types

Implement prioritized action items:

1. **Critical stock suggestions** - "SKU-001 will stock out in 3 days" + Accept PO button
2. **Overdue payments** - "Invoice #123 overdue by 5 days" + Record payment button
3. **Pending supplier invoices** - "2 supplier invoices pending approval" + Review button
4. **Today's inspections** - "Inspection scheduled for today" + View button

### Empty/Hidden States

- **Action Needed section**: Hidden entirely when no action items exist (no empty state)
- **Timeline**: Show "--" for days with no events

## Files to Reference

- `product-plan/sections/dashboard/README.md` - Design intent
- `product-plan/sections/dashboard/components/` - React components
- `product-plan/sections/dashboard/types.ts` - TypeScript interfaces
- `product-plan/sections/dashboard/data.json` - Sample data
- `product-plan/sections/dashboard/tests.md` - Test specifications

## Expected User Flows

### 1. See Pulse Check Status
User opens dashboard. Pulse Check shows either: green checkmark with "All clear" when no critical items, or red alert icon with "X items need attention". Clicking scrolls to Action Needed section if visible.

### 2. View Key Metrics
User sees 4 metric cards: Open POs (count), In Transit (count), Arriving (count in next 7 days), Owed (currency total). Clicking any card navigates to the relevant section.

### 3. See Action Items Needing Attention
User sees prioritized list of items requiring action. Each shows: icon, description, inline action button. Clicking "Accept PO" navigates to PO form prefilled. Clicking "Record payment" opens payment modal. Maximum 5 items shown with "View all" link.

### 4. View Weekly Timeline
User sees 5-day horizontal timeline (Today + 4 days). Each day shows label (e.g., "Thu 9") and event summaries below (e.g., "T-154 arrives", "Inspection: INSP-42"). Empty days show "--".

### 5. Use Quick Actions
User clicks "+ New PO" button. Navigates to Purchase Orders section with create modal open. Similarly for "+ Transfer", "Log Inspection", "Record Payment".

## Done When

- [ ] Pulse Check shows correct state (All Clear vs Needs Attention)
- [ ] Pulse Check count matches actual critical items
- [ ] Key Metrics show accurate counts from database
- [ ] Metric cards are clickable and navigate correctly
- [ ] Owed displays in currency format ($X,XXX or $XXK)
- [ ] Inventory Health card shows correct percentage and alert count
- [ ] Cash Flow card shows outstanding and overdue amounts
- [ ] Overdue amount highlighted red when > 0
- [ ] Action Needed list shows prioritized items
- [ ] Action item inline buttons trigger correct actions
- [ ] Action Needed section hidden when no items exist
- [ ] Maximum 5 action items with "View all" link
- [ ] Timeline shows correct 5-day range
- [ ] Timeline events grouped correctly by day
- [ ] Empty timeline days show "--"
- [ ] Quick Actions navigate to correct sections with modals
- [ ] Quick Actions sticky on mobile
- [ ] Desktop: Health cards side by side, metrics in row
- [ ] Tablet: Health cards side by side, metrics 2x2
- [ ] Mobile: Stacked layout, sticky quick actions
- [ ] Dark mode support works
