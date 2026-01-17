# Activity Log

## Overview

Track and display all changes made by users across the system. Provides a comprehensive audit trail showing who changed what, when, and the before/after values. Essential for compliance, debugging, and understanding system history.

## User Flows

- View chronological list of all activity, newest first
- Filter by entity type (Product, PO, Transfer, Inspection, etc.)
- Filter by action type (Created, Updated, Deleted, Status Changed)
- Filter by user who made the change
- Filter by date range
- Search by entity name or field values
- Group entries by day, entity, or user
- Expand an entry to see full field-by-field change details
- Click entity name to navigate to that entity
- Export activity log to CSV

## Design Decisions

- Expandable rows for field-level change details
- Summary cards for quick stats overview
- Before/after values rendered by type (text, number, currency, boolean, status)
- Date group headers when grouping by day
- Relative timestamps for recent activity

## Data Used

**Entities:** `ActivityLogEntry`, `ActivityUser`, `FieldChange`, `ActivityLogSummary`, `ActivityLogFilters`

**From global model:**
- User (for user avatars and names)
- All trackable entities (Product, Supplier, PurchaseOrder, Batch, Transfer, Inspection, Cost, Payment, Location, Setting)

## Visual Reference

See `screenshot.png` for the target UI design.

## Components Provided

- `ActivityLog` - Main view component with filters and entry list
- `ActivityLogEntryRow` - Individual entry row with expand/collapse
- `FieldChangeDisplay` - Renders field changes with appropriate formatting by type
- `ActivityLogFilters` - Filter bar component

## Callback Props

| Callback | Description |
|----------|-------------|
| `onViewEntity` | Called when user clicks an entity name to navigate to it |
| `onFilterChange` | Called when user updates filter selections |
| `onExport` | Called when user clicks export to CSV |
| `onLoadMore` | Called when user scrolls to load more entries |
