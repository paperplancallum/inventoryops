# Milestone 10: Activity Log

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete

---

## Goal

Implement a comprehensive audit trail system that tracks and displays all changes made by users across the system, showing who changed what, when, and the before/after values.

## Overview

The Activity Log provides essential compliance and debugging capabilities by maintaining a complete history of all system changes. Users can filter, search, and explore changes with expandable entries showing field-level details.

**Key Functionality:**

- View chronological list of all activity with newest entries first
- Filter by entity type, action type, user, and date range
- Search by entity name or field values
- Group entries by day, entity, or user
- Expand entries to see field-by-field change details with old/new values
- Export activity log to CSV for external analysis

## Recommended Approach: Test-Driven Development

Before implementing, write tests based on `product-plan/sections/activity-log/tests.md`:

1. Write tests for activity data fetching and filtering
2. Write tests for entry expansion and field change display
3. Write tests for CSV export functionality
4. Write tests for empty state and "no results" scenarios
5. Implement components to pass tests

## What to Implement

### Components

Copy from `product-plan/sections/activity-log/components/`:

- Activity list with expandable entries
- Filter bar (search, entity type dropdown, action type dropdown, date range picker)
- Summary cards (Total Entries, This Week, Most Active User, Most Changed Entity)
- Entry detail view with field-level changes

### Data Layer

Create API endpoints and database schema for:

- **ActivityEntry**: timestamp, userId, entityType, entityId, action, changes array
- **ActivityChange**: fieldName, label, oldValue, newValue, valueType
- Metadata: IP address, user agent (for security audits)
- Optional notes field

### Callbacks

Wire up these callback props:

- `onFilter(filters)` - Apply filter criteria
- `onSearch(query)` - Search activity entries
- `onExpandEntry(entryId)` - Load full change details
- `onNavigateToEntity(entityType, entityId)` - Navigate to source entity
- `onExportCSV()` - Generate and download CSV export
- `onGroupBy(grouping)` - Change entry grouping

### Empty States

Implement empty states for:

- No activity logged yet (first-time use)
- No results matching current filters
- No changes in selected date range

## Files to Reference

- `product-plan/sections/activity-log/README.md` - Design intent
- `product-plan/sections/activity-log/components/` - React components
- `product-plan/sections/activity-log/types.ts` - TypeScript interfaces
- `product-plan/sections/activity-log/data.json` - Sample data
- `product-plan/sections/activity-log/tests.md` - Test specifications

## Expected User Flows

### 1. View Chronological Activity
User opens Activity Log and sees newest entries first. Each entry shows timestamp (relative), user avatar and name, action badge, entity type icon and name. User can scroll to load more entries.

### 2. Filter by Entity/Action Type
User selects "Purchase Order" from entity type dropdown and "Updated" from action type dropdown. List updates to show only PO update entries. User can combine multiple filters.

### 3. Expand Entry to See Changes
User clicks on an entry row. Entry expands to reveal field-level changes with before/after values. Values are rendered appropriately by type (text, number, currency, boolean, status badges).

### 4. Export to CSV
User clicks "Export" button. System generates CSV file containing all activity matching current filters. File downloads automatically with appropriate filename (e.g., `activity-log-2024-01-15.csv`).

## Done When

- [ ] Activity entries display in chronological order (newest first)
- [ ] Filter bar works for entity type, action type, user, and date range
- [ ] Search finds entries by entity name or field values
- [ ] Grouping by day, entity, or user works correctly
- [ ] Entry expansion shows field-level changes with old/new values
- [ ] Values render correctly by type (currency, boolean, status, etc.)
- [ ] Summary cards show accurate counts
- [ ] Entity names are clickable and navigate to the entity
- [ ] CSV export generates correct file with filtered data
- [ ] Empty states display appropriately
- [ ] Results count footer shows accurate count
- [ ] Responsive on mobile and desktop
- [ ] Dark mode support works
