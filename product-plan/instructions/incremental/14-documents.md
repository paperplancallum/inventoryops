# Milestone 14: Documents

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete

---

## Goal

Implement centralized PDF document management for viewing, searching, downloading, and managing all generated documents across the system.

## Overview

The Documents section provides a unified view of all PDFs generated throughout the application: Purchase Order PDFs, Inspection Reports, and Shipping Manifests. Users can browse, filter, preview, download, and delete documents from a single location.

When a PDF is generated, the system captures a snapshot of the source data at that moment. This ensures historical accuracy—users can always see exactly what data was in the document when it was sent.

**Key Functionality:**
- View all generated documents in a searchable, filterable table
- Filter by document type (Purchase Order, Inspection Report, Shipping Manifest)
- Filter by date range and search by reference number or content
- Preview and download documents
- Navigate to source record (PO, Inspection, or Transfer)
- Delete documents with confirmation
- View summary statistics by type and time period

## Recommended Approach: Test-Driven Development

1. Read `product-plan/sections/documents/tests.md` for test specifications
2. Write tests first for: document listing, filtering, download, preview, delete
3. Implement API endpoints to make tests pass
4. Wire up UI components with real data

## What to Implement

### Components

Copy components from `product-plan/sections/documents/components/`:
- Summary stat cards (Total, PO count, Inspection count, Manifest count, This Month)
- Filter bar with search, type dropdown, date range picker
- Documents table with sorting and pagination
- Document type badges (indigo for PO, cyan for Inspection, amber for Manifest)
- Delete confirmation modal
- Empty state

### Data Layer

- API endpoint: `GET /api/documents` with filters (type, dateFrom, dateTo, search, page, limit, sort)
- API endpoint: `GET /api/documents/:id/download` for file download
- API endpoint: `DELETE /api/documents/:id` for deletion
- Query for summary statistics (counts by type, this month count)
- GeneratedDocument entity with metadata (name, type, size, sourceId, sourceType, createdAt, createdBy)

### Callbacks to Wire Up

| Callback | Action |
|----------|--------|
| `onSearch` | Filter documents by search term |
| `onFilterChange` | Apply type and date filters |
| `onSort` | Sort by column (date, name, type, size) |
| `onPreview` | Open document in new tab or modal |
| `onDownload` | Trigger file download |
| `onViewSource` | Navigate to source record (PO, Inspection, Transfer) |
| `onDelete` | Show delete confirmation, then delete |
| `onPageChange` | Handle pagination |

### Empty States

- **No documents**: "No documents yet. Generate PDFs from Purchase Orders, Inspections, or Transfers to see them here." with links to each section
- **No results**: "No documents match your filters." with clear filters button

## Files to Reference

- `product-plan/sections/documents/README.md` — Section overview
- `product-plan/sections/documents/components/` — React components
- `product-plan/sections/documents/tests.md` — Test specifications
- `product/sections/documents/spec.md` — Full specification
- `product/sections/documents/types.ts` — TypeScript interfaces
- `product/sections/documents/data.json` — Sample data

## Expected User Flows

### View Documents List
1. User navigates to Documents page
2. Sees summary cards with counts
3. Views table of documents sorted by newest first
4. Can search, filter by type, filter by date range

### Preview and Download Document
1. User clicks Preview on a document row
2. Document opens in new tab or preview modal
3. User clicks Download to save to local machine

### Navigate to Source Record
1. User clicks the source reference link in a document row
2. App navigates to the source record (PO detail, Inspection detail, or Transfer detail)

### Delete Document
1. User clicks Delete on a document row
2. Confirmation modal appears with document name
3. User confirms deletion
4. Document is removed from list

## Done When

- [ ] Documents list displays with all columns and sorting
- [ ] Summary cards show correct counts by type
- [ ] Type filter works (All, Purchase Order, Inspection Report, Shipping Manifest)
- [ ] Date range filter works
- [ ] Search filters by reference number and content
- [ ] Preview opens document correctly
- [ ] Download triggers file save
- [ ] Source link navigates to correct record
- [ ] Delete shows confirmation and removes document
- [ ] Pagination works for large lists
- [ ] Empty state displays when no documents exist
- [ ] Responsive on mobile and desktop
- [ ] Dark mode support works
