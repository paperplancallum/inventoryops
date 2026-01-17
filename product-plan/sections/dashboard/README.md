# Dashboard

## Overview

The dashboard provides a unified view of business health, urgent actions, and upcoming operations. It answers "Am I okay?" at a glance while surfacing items that need immediate attention.

## User Flows

- View pulse check status (All Clear vs Needs Attention)
- Review key metrics strip (Open POs, In Transit, Arriving, Owed)
- Monitor inventory health and cash flow health cards
- Review prioritized action items requiring attention
- View 5-day timeline of upcoming events
- Use quick action buttons for common tasks
- Navigate to relevant sections by clicking metrics or actions

## Design Decisions

- Pulse check as hero element showing overall system health
- Action items hidden entirely when none exist (no empty state)
- Maximum 5 action items shown with "View all" link
- Quick actions sticky at bottom on mobile
- Color coding: lime for healthy, red for critical, amber for warning
- Responsive layout: full on desktop, stacked on mobile

## Data Used

**Entities:** `DashboardData`, `PulseCheckData`, `KeyMetricsData`, `InventoryHealthData`, `CashFlowData`, `ActionItem`, `TimelineDay`, `TimelineEvent`

**From global model:**
- PurchaseOrder (open POs count)
- Transfer (in transit, arriving counts)
- Invoice (outstanding balance)
- ReplenishmentSuggestion (critical stock alerts)
- Inspection (scheduled inspections)
- SupplierInvoice (pending approvals)

## Visual Reference

See `screenshot.png` for the target UI design.

## Components Provided

- `DashboardPreview` - Main dashboard container
- `PulseCheck` - Hero status indicator (All Clear / Needs Attention)
- `KeyMetricsStrip` - Four compact metric cards in a row
- `HealthCards` - Inventory health and cash flow cards side-by-side
- `ActionNeeded` - Prioritized list of action items
- `WeekTimeline` - 5-day horizontal timeline

## Callback Props

| Callback | Description |
|----------|-------------|
| `onNavigate` | Called when user clicks any navigable element (metrics, actions, links) |
| `onAction` | Called when user clicks an inline action button on an action item |
| `onActionClick` | Called when user clicks the Pulse Check to scroll to actions |
