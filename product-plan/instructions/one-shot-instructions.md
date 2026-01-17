# InventoryOps — Complete Implementation Instructions

---

## About These Instructions

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Data model definitions (TypeScript types and sample data)
- UI/UX specifications (user flows, requirements, screenshots)
- Design system tokens (colors, typography, spacing)
- Test-writing instructions for each section (for TDD approach)

**What you need to build:**
- Backend API endpoints and database schema
- Authentication and authorization
- Data fetching and state management
- Business logic and validation
- Integration of the provided UI components with real data

**Important guidelines:**
- **DO NOT** redesign or restyle the provided components — use them as-is
- **DO** wire up the callback props to your routing and API calls
- **DO** replace sample data with real data from your backend
- **DO** implement proper error handling and loading states
- **DO** implement empty states when no records exist (first-time users, after deletions)
- **DO** use test-driven development — write tests first using `tests.md` instructions
- The components are props-based and ready to integrate — focus on the backend and data layer

---

## Test-Driven Development

Each section includes a `tests.md` file with detailed test-writing instructions. These are **framework-agnostic** — adapt them to your testing setup (Jest, Vitest, Playwright, Cypress, RSpec, Minitest, PHPUnit, etc.).

**For each section:**
1. Read `product-plan/sections/[section-id]/tests.md`
2. Write failing tests for key user flows (success and failure paths)
3. Implement the feature to make tests pass
4. Refactor while keeping tests green

The test instructions include:
- Specific UI elements, button labels, and interactions to verify
- Expected success and failure behaviors
- Empty state handling (when no records exist yet)
- Data assertions and state validations

---

# Product Overview

## Summary

An operations management system for Amazon FBA businesses that tracks inventory from purchase order through to Amazon, with full cost allocation, batch tracking, and quality control.

### Problems Solved
- **Tracking inventory across stages** — Track each batch through configurable stages (ordered → at factory → inspected → in transit → at warehouse → at Amazon) with real-time visibility
- **Managing supplier orders** — Centralized PO management with supplier details, order status, expected dates, and linked documentation
- **Quality control tracking** — Record post-production inspection results, defect rates, and pass/fail decisions tied to specific batches
- **True landed cost calculation** — Capture all costs (PO, shipping, inspections, duties) and distribute them across units for accurate per-unit landed cost
- **FIFO batch tracking** — First-in-first-out inventory tracking to know which batch is selling and trace issues back to specific orders
- **Amazon reconciliation** — Compare internal records against Amazon FBA inventory to catch discrepancies

### Key Features
- Purchase order management with supplier tracking
- Multi-stage inventory pipeline (configurable per product flow)
- Batch/lot tracking with FIFO logic
- Cost capture and allocation (PO, freight, inspection, duties)
- Inspection records and QC reporting
- Payment tracking across cost categories
- Amazon FBA inventory sync/reconciliation
- External stakeholder forms via magic links
- Intelligent inventory replenishment suggestions

## Data Model

**Core Entities:**
- Brand, AmazonConnection, Product, Supplier
- PurchaseOrder, Shipment, Batch, Cost, Payment
- Inspection, InspectionAgent, Location
- Transfer, TransferLineItem, StockLedgerEntry, Stock
- ShippingAgent, MagicLink, MagicLinkEvent
- SupplierInvoice, SupplierInvoiceLineItem, SupplierInvoiceCost
- POLineItemPriceHistory, GeneratedDocument, ProductSpecSheet

## Design System

**Colors:**
- Primary: `indigo` — Used for buttons, links, key accents
- Secondary: `amber` — Used for tags, highlights, secondary elements
- Neutral: `slate` — Used for backgrounds, text, borders

**Typography:**
- Heading: Inter
- Body: Inter
- Mono: IBM Plex Mono

---

# Milestone 1: Foundation

## Goal

Set up the foundational elements: design tokens, data model types, routing structure, and application shell.

## What to Implement

### 1. Design Tokens

Configure your styling system with these tokens:

- See `product-plan/design-system/tokens.css` for CSS custom properties
- See `product-plan/design-system/tailwind-colors.md` for Tailwind configuration
- See `product-plan/design-system/fonts.md` for Google Fonts setup

**Colors:**
- Primary: `indigo` — buttons, links, key accents
- Secondary: `amber` — tags, highlights, warnings
- Neutral: `slate` — backgrounds, text, borders

**Typography:**
- Heading: Inter (weights: 600, 700)
- Body: Inter (weights: 400, 500)
- Mono: IBM Plex Mono

### 2. Data Model Types

Create TypeScript interfaces for your core entities:

- See `product-plan/data-model/README.md` for entity descriptions
- See `product-plan/data-model/data-model.md` for relationships

Core entities to define:
- Brand, Product, Supplier
- PurchaseOrder, Shipment, Batch
- Cost, Payment, Inspection, InspectionAgent
- Location, Transfer, TransferLineItem
- StockLedgerEntry, Stock
- ShippingAgent, MagicLink
- SupplierInvoice, GeneratedDocument

### 3. Routing Structure

Create placeholder routes for each section:

```
/                       → Dashboard
/catalog                → Catalog (Products)
/suppliers              → Suppliers
/purchase-orders        → Purchase Orders
/inventory              → Inventory
/invoices-and-payments  → Invoices & Payments
/inspections            → Inspections
/transfers              → Transfers
/locations              → Locations
/activity-log           → Activity Log
/magic-links            → Magic Links
/inventory-intelligence → Inventory Intelligence
/documents              → Documents
/inbox                  → Inbox
/settings               → Settings
/supplier-invoices      → Supplier Invoices
```

### 4. Application Shell

Copy the shell components from `product-plan/shell/components/` to your project:

- `AppShell.tsx` — Main layout wrapper
- `MainNav.tsx` — Navigation component
- `UserMenu.tsx` — User menu with avatar

**Wire Up Navigation:**

Connect navigation to your routing. The shell includes navigation items for all 16 sections.

**User Menu:**

The user menu expects:
- User name
- Avatar URL (optional)
- Logout callback

## Files to Reference

- `product-plan/design-system/` — Design tokens
- `product-plan/data-model/` — Type definitions
- `product-plan/shell/README.md` — Shell design intent
- `product-plan/shell/components/` — Shell React components

## Done When

- [ ] Design tokens are configured (colors, fonts)
- [ ] Data model types are defined
- [ ] Routes exist for all sections (can be placeholder pages)
- [ ] Shell renders with navigation
- [ ] Navigation links to correct routes
- [ ] User menu shows user info
- [ ] Responsive on mobile and desktop
- [ ] Dark mode support works

---

# Milestone 2: Catalog

## Goal

Implement the Catalog section for managing products (SKUs) with supplier relationships, stock tracking, and Amazon identifiers.

## Overview

Users can view, create, edit, and archive products. Each product has SKU variants for different conditions, links to suppliers, and stock breakdowns across locations.

**Key Functionality:**
- View products in filterable, sortable table
- Add/edit products via modal form
- View product details in slide-over panel
- See stock breakdown by location
- Manage SKU variants per product
- Import/export products via CSV

## Files to Reference

- `product-plan/sections/catalog/README.md` — Section overview
- `product-plan/sections/catalog/tests.md` — Test specifications
- `product-plan/sections/catalog/components/` — React components
- `product-plan/sections/catalog/types.ts` — TypeScript interfaces
- `product-plan/sections/catalog/sample-data.json` — Test data

## Done When

- [ ] Products table displays with all columns
- [ ] Filters work (brand, supplier, status, search)
- [ ] Add product modal creates new products
- [ ] Edit product modal updates existing products
- [ ] Product detail panel shows full info
- [ ] Stock breakdown popover shows location details
- [ ] SKU variants table displays and can be modified
- [ ] Empty state displays when no products
- [ ] Responsive and dark mode work

---

# Milestone 3: Suppliers

## Goal

Implement supplier management for vendor relationships with contact info, lead times, and payment terms.

## Overview

Users can manage the vendors they purchase from, tracking contact details, factory locations, and default payment terms.

**Key Functionality:**
- View suppliers in searchable table
- Add/edit suppliers via side panel form
- Link suppliers to factory locations
- Configure payment terms (templates or custom)
- View product count per supplier

## Files to Reference

- `product-plan/sections/suppliers/README.md` — Section overview
- `product-plan/sections/suppliers/tests.md` — Test specifications
- `product-plan/sections/suppliers/components/` — React components
- `product-plan/sections/suppliers/types.ts` — TypeScript interfaces
- `product-plan/sections/suppliers/sample-data.json` — Test data

## Done When

- [ ] Suppliers table displays with all columns
- [ ] Search and sort work
- [ ] Add supplier form creates new suppliers
- [ ] Edit supplier form updates existing
- [ ] Factory location linking works
- [ ] Payment terms configuration works
- [ ] Delete with confirmation works
- [ ] Empty state displays when no suppliers
- [ ] Responsive and dark mode work

---

# Milestone 4: Purchase Orders

## Goal

Implement PO creation and tracking with supplier details, line items, status workflow, and document generation.

## Overview

Users create POs to order products from suppliers, track status through the fulfillment lifecycle, record costs, and generate PDF documents.

**Key Functionality:**
- View POs in list with status badges
- Create PO with line items
- Edit PO details and line items
- Track PO status (Draft → Sent → Confirmed → Shipped → Received)
- Generate and send PO PDF
- Record costs and payments
- Link to batches when received

## Files to Reference

- `product-plan/sections/purchase-orders/README.md` — Section overview
- `product-plan/sections/purchase-orders/tests.md` — Test specifications
- `product-plan/sections/purchase-orders/components/` — React components
- `product-plan/sections/purchase-orders/types.ts` — TypeScript interfaces
- `product-plan/sections/purchase-orders/sample-data.json` — Test data

## Done When

- [ ] PO list displays with status badges
- [ ] Create PO form with line items works
- [ ] Status transitions work correctly
- [ ] PO detail panel shows full information
- [ ] PDF generation works
- [ ] Cost tracking and payment recording work
- [ ] Magic link generation for supplier invoice works
- [ ] Empty state displays when no POs
- [ ] Responsive and dark mode work

---

# Milestone 5: Inventory

## Goal

Implement batch tracking through pipeline stages with FIFO logic, stock ledger, and Amazon reconciliation.

## Overview

Users track inventory batches from creation through Amazon delivery, with real-time stock positions, movement history, and reconciliation against Amazon's reported inventory.

**Key Functionality:**
- View batches in pipeline stage columns
- Filter by product, stage, date range
- View batch details with movement history
- Stock ledger with double-entry transactions
- Amazon reconciliation comparison
- Stage transitions with validation

## Files to Reference

- `product-plan/sections/inventory/README.md` — Section overview
- `product-plan/sections/inventory/tests.md` — Test specifications
- `product-plan/sections/inventory/components/` — React components
- `product-plan/sections/inventory/types.ts` — TypeScript interfaces
- `product-plan/sections/inventory/sample-data.json` — Test data

## Done When

- [ ] Pipeline view shows batches by stage
- [ ] Batch cards display key info
- [ ] Stage transitions work with validation
- [ ] Batch detail panel shows full history
- [ ] Stock ledger displays transactions
- [ ] Amazon reconciliation shows comparison
- [ ] Filters work correctly
- [ ] Empty state displays when no batches
- [ ] Responsive and dark mode work

---

# Milestone 6: Invoices & Payments

## Goal

Implement centralized invoice management for tracking costs across POs, transfers, and inspections, with payment scheduling.

## Overview

Users view all invoices, record payments (partial or full), track payment schedules with milestone triggers, and calculate landed cost.

**Key Functionality:**
- View invoices with financial summary stats
- Filter by type, status, linked entity
- Record payments against invoices
- Track payment schedules with milestones
- View payment history across all invoices
- Calculate landed cost per unit

## Files to Reference

- `product-plan/sections/invoices-and-payments/README.md` — Section overview
- `product-plan/sections/invoices-and-payments/tests.md` — Test specifications
- `product-plan/sections/invoices-and-payments/components/` — React components
- `product-plan/sections/invoices-and-payments/types.ts` — TypeScript interfaces
- `product-plan/sections/invoices-and-payments/sample-data.json` — Test data

## Done When

- [ ] Invoice list displays with financial summary
- [ ] Filters work for type, status, entity
- [ ] Invoice detail shows payment schedule
- [ ] Payment recording works (partial and full)
- [ ] Payment status transitions correctly
- [ ] Overdue detection works
- [ ] Payments tab shows all payments
- [ ] Empty state displays when no invoices
- [ ] Responsive and dark mode work

---

# Milestone 7: Inspections

## Goal

Implement pre-shipment QC inspection management for batches with defect tracking and inspection agent roster.

## Overview

Users schedule inspections, record QC results with line-item detail, manage rework requests, and maintain an inspection agent roster.

**Key Functionality:**
- View inspections with summary stats
- Schedule inspections for batches
- Record results with defects, measurements, photos
- Create rework requests for failed inspections
- Schedule re-inspections after rework
- Manage inspection agents

## Files to Reference

- `product-plan/sections/inspections/README.md` — Section overview
- `product-plan/sections/inspections/tests.md` — Test specifications
- `product-plan/sections/inspections/components/` — React components
- `product-plan/sections/inspections/types.ts` — TypeScript interfaces
- `product-plan/sections/inspections/sample-data.json` — Test data

## Done When

- [ ] Inspections list with summary stats
- [ ] Scheduling works for batches
- [ ] Results recording with defects, photos
- [ ] Pass/fail calculation from line items
- [ ] Rework requests can be created
- [ ] Re-inspections can be scheduled
- [ ] Agents tab with CRUD operations
- [ ] Empty state displays when no inspections
- [ ] Responsive and dark mode work

---

# Milestone 8: Transfers

## Goal

Implement inventory transfer tracking for physical movement between locations with carrier management and document handling.

## Overview

Users create transfers to move batches, track shipment status, manage tracking numbers and documents, and handle customs for international shipments.

**Key Functionality:**
- View transfers with status tracking
- Create transfers with line items
- Track status through logistics chain
- Manage tracking numbers and carriers
- Upload shipping documents
- Record freight, duties, insurance costs
- Generate shipping manifests
- Track Amazon receiving for FBA destinations

## Files to Reference

- `product-plan/sections/transfers/README.md` — Section overview
- `product-plan/sections/transfers/tests.md` — Test specifications
- `product-plan/sections/transfers/components/` — React components
- `product-plan/sections/transfers/types.ts` — TypeScript interfaces
- `product-plan/sections/transfers/sample-data.json` — Test data

## Done When

- [ ] Transfers list with summary stats
- [ ] Create transfer with line items
- [ ] Status transitions work correctly
- [ ] Tracking numbers can be added/removed
- [ ] Documents can be uploaded
- [ ] Costs calculate correctly
- [ ] Amazon receiving status works
- [ ] Shipping manifest PDF generation
- [ ] Empty state displays when no transfers
- [ ] Responsive and dark mode work

---

# Milestone 9: Locations

## Goal

Implement location management for all physical locations in the supply chain network.

## Overview

Users manage factories, warehouses, 3PL facilities, Amazon centers, ports, and customs facilities that form their supply chain.

**Key Functionality:**
- View locations with type badges
- Add/edit locations with type, address, contact
- Toggle active/inactive status
- Delete with protection for referenced locations
- Filter and search locations

## Files to Reference

- `product-plan/sections/locations/README.md` — Section overview
- `product-plan/sections/locations/tests.md` — Test specifications
- `product-plan/sections/locations/components/` — React components
- `product-plan/sections/locations/types.ts` — TypeScript interfaces
- `product-plan/sections/locations/sample-data.json` — Test data

## Done When

- [ ] Locations list with type badges
- [ ] Add location form with type selector
- [ ] Edit location details
- [ ] Active/inactive toggle works
- [ ] Delete with confirmation
- [ ] Delete protection warns about references
- [ ] Filters work for type, status
- [ ] Empty state displays when no locations
- [ ] Responsive and dark mode work

---

# Milestone 10: Activity Log

## Goal

Implement comprehensive audit trail showing all changes made by users across the system.

## Overview

Users can view, filter, and explore system-wide change history with expandable entries showing field-level details and before/after values.

**Key Functionality:**
- View chronological activity list
- Filter by entity type, action type, user, date
- Search by entity name or field values
- Group entries by day, entity, or user
- Expand entries to see field changes
- Export to CSV

## Files to Reference

- `product-plan/sections/activity-log/README.md` — Section overview
- `product-plan/sections/activity-log/tests.md` — Test specifications
- `product-plan/sections/activity-log/components/` — React components
- `product-plan/sections/activity-log/types.ts` — TypeScript interfaces
- `product-plan/sections/activity-log/sample-data.json` — Test data

## Done When

- [ ] Activity list displays chronologically
- [ ] Filters work for all criteria
- [ ] Search finds entries
- [ ] Grouping works correctly
- [ ] Entry expansion shows field changes
- [ ] Values render by type
- [ ] CSV export works
- [ ] Empty state displays when no activity
- [ ] Responsive and dark mode work

---

# Milestone 11: Magic Links

## Goal

Implement secure tokenized URLs for external stakeholder interaction without requiring user accounts.

## Overview

Users generate magic links for suppliers (invoice submission) and shipping partners (document upload), with full lifecycle tracking.

**Key Functionality:**
- Generate links from PO or Transfer
- Manage all links from dedicated page
- Send reminders and revoke/regenerate links
- Track link events (created, sent, viewed, submitted)
- External forms for invoice and document submission
- Automatic entity creation on submission

## Files to Reference

- `product-plan/sections/magic-links/README.md` — Section overview
- `product-plan/sections/magic-links/tests.md` — Test specifications
- `product-plan/sections/magic-links/components/` — React components
- `product-plan/sections/magic-links/types.ts` — TypeScript interfaces
- `product-plan/sections/magic-links/sample-data.json` — Test data

## Done When

- [ ] Links generate with secure tokens
- [ ] Links page shows all links
- [ ] Filters work for status, entity type
- [ ] Send reminder works
- [ ] Revoke and regenerate work
- [ ] Event timeline displays
- [ ] External invoice form works
- [ ] External document form works
- [ ] Submission creates entities
- [ ] Empty state displays when no links
- [ ] Responsive and dark mode work

---

# Milestone 12: Inventory Intelligence

## Goal

Implement intelligent replenishment planning with sales forecasting and suggestions for transfers and purchase orders.

## Overview

Users view urgency dashboards, accept transfer and PO suggestions, and manage sales forecasting with anomaly handling.

**Key Functionality:**
- Dashboard with urgency distribution
- Transfer suggestions with reasoning
- PO suggestions when transfers insufficient
- Accept to pre-fill Transfer/PO forms
- Forecasting Workbench with multiple models
- Blackout day management
- Account-level configuration

## Files to Reference

- `product-plan/sections/inventory-intelligence/README.md` — Section overview
- `product-plan/sections/inventory-intelligence/tests.md` — Test specifications
- `product-plan/sections/inventory-intelligence/components/` — React components
- `product-plan/sections/inventory-intelligence/types.ts` — TypeScript interfaces
- `product-plan/sections/inventory-intelligence/sample-data.json` — Test data

## Done When

- [ ] Dashboard shows urgency metrics
- [ ] Transfer suggestions display correctly
- [ ] PO suggestions display correctly
- [ ] Accept pre-fills correct forms
- [ ] Forecasting models calculate correctly
- [ ] Blackout management works
- [ ] Account settings work
- [ ] Empty state displays appropriately
- [ ] Responsive and dark mode work

---

# Milestone 13: Dashboard

## Goal

Implement unified business health dashboard answering "Am I okay?" with urgent actions and upcoming operations.

## Overview

Users see overall health status, key metrics, action items needing attention, and a weekly timeline of events.

**Key Functionality:**
- Pulse Check hero (All Clear vs Needs Attention)
- Key metrics strip (Open POs, In Transit, Arriving, Owed)
- Inventory Health and Cash Flow cards
- Prioritized Action Needed list
- 5-day timeline with events
- Quick action buttons

## Files to Reference

- `product-plan/sections/dashboard/README.md` — Section overview
- `product-plan/sections/dashboard/tests.md` — Test specifications
- `product-plan/sections/dashboard/components/` — React components
- `product-plan/sections/dashboard/types.ts` — TypeScript interfaces
- `product-plan/sections/dashboard/sample-data.json` — Test data

## Done When

- [ ] Pulse Check shows correct state
- [ ] Key Metrics show accurate counts
- [ ] Metric cards navigate correctly
- [ ] Health cards show correct data
- [ ] Action items display prioritized
- [ ] Action item buttons work
- [ ] Timeline shows correct events
- [ ] Quick Actions navigate correctly
- [ ] Responsive and dark mode work

---

# Milestone 14: Documents

## Goal

Implement centralized PDF document management for browsing, searching, and downloading generated documents.

## Overview

Users view all PDFs generated across the system (PO PDFs, Inspection Reports, Shipping Manifests) with filtering and download capabilities.

**Key Functionality:**
- View documents in searchable table
- Filter by type and date range
- Preview and download documents
- Navigate to source records
- Delete documents with confirmation

## Files to Reference

- `product-plan/sections/documents/README.md` — Section overview
- `product-plan/sections/documents/tests.md` — Test specifications
- `product-plan/sections/documents/components/` — React components
- `product-plan/sections/documents/types.ts` — TypeScript interfaces
- `product-plan/sections/documents/sample-data.json` — Test data

## Done When

- [ ] Documents list with sorting
- [ ] Summary cards show counts
- [ ] Type filter works
- [ ] Date range filter works
- [ ] Search works
- [ ] Preview opens documents
- [ ] Download triggers file save
- [ ] Source navigation works
- [ ] Delete with confirmation works
- [ ] Empty state displays when no documents
- [ ] Responsive and dark mode work

---

# Milestone 15: Inbox

## Goal

Implement centralized inbox aggregating messages across Purchase Orders and Shipping Agents.

## Overview

Users view all messages from suppliers and shipping partners in one place, with filtering, read/unread management, and navigation to source entities.

**Key Functionality:**
- View messages in reverse chronological order
- Filter by source type and message type
- Search by content
- Expand to read full messages
- Mark as read/unread
- Navigate to source entity
- Clear and restore messages

## Files to Reference

- `product-plan/sections/inbox/README.md` — Section overview
- `product-plan/sections/inbox/tests.md` — Test specifications
- `product-plan/sections/inbox/components/` — React components
- `product-plan/sections/inbox/types.ts` — TypeScript interfaces
- `product-plan/sections/inbox/sample-data.json` — Test data

## Done When

- [ ] Message list displays correctly
- [ ] Summary cards show counts
- [ ] Source filter works
- [ ] Type filter works
- [ ] Search works
- [ ] Message expansion works
- [ ] Read/unread toggle works
- [ ] Source navigation works
- [ ] Clear and restore work
- [ ] Empty state displays when no messages
- [ ] Responsive and dark mode work

---

# Milestone 16: Settings

## Goal

Implement application-wide settings for Amazon connections, brands, and shipping routes.

## Overview

Users connect Amazon accounts via OAuth, manage brands for product organization, and configure shipping routes with leg-based composition.

**Key Functionality:**
- Connect Amazon accounts via OAuth
- Manage marketplaces per account
- Create/edit/archive brands
- Create shipping legs (origin to destination)
- Compose routes from multiple legs
- Set default routes

## Files to Reference

- `product-plan/sections/settings/README.md` — Section overview
- `product-plan/sections/settings/tests.md` — Test specifications
- `product-plan/sections/settings/components/` — React components
- `product-plan/sections/settings/types.ts` — TypeScript interfaces
- `product-plan/sections/settings/sample-data.json` — Test data

## Done When

- [ ] Tab navigation works
- [ ] Amazon OAuth connects accounts
- [ ] Marketplace toggles work
- [ ] Brand CRUD works
- [ ] Shipping leg CRUD works
- [ ] Route composer works
- [ ] Route totals calculate correctly
- [ ] Enable/disable routes works
- [ ] Set default route works
- [ ] Empty states display appropriately
- [ ] Responsive and dark mode work

---

# Milestone 17: Supplier Invoices

## Goal

Implement review workflow for supplier price submissions with variance tracking and approval process.

## Overview

Users review supplier price submissions, compare against original PO prices, approve to update prices, or reject for revision.

**Key Functionality:**
- View pending invoices awaiting review
- Review with line-by-line price comparison
- See variance calculations
- Approve (updates PO prices)
- Reject for revision (sends new magic link)
- Reject final
- View revision and price history

## Files to Reference

- `product-plan/sections/supplier-invoices/README.md` — Section overview
- `product-plan/sections/supplier-invoices/tests.md` — Test specifications
- `product-plan/sections/supplier-invoices/components/` — React components
- `product-plan/sections/supplier-invoices/types.ts` — TypeScript interfaces
- `product-plan/sections/supplier-invoices/sample-data.json` — Test data

## Done When

- [ ] Invoice list with variance highlighting
- [ ] Stats bar shows correct metrics
- [ ] Status filters work
- [ ] Review panel shows full details
- [ ] Price comparison displays correctly
- [ ] Variance calculations accurate
- [ ] Approve updates PO prices
- [ ] Reject for revision creates new invoice
- [ ] Reject final closes invoice
- [ ] Revision history displays
- [ ] Price history modal works
- [ ] Empty state displays when no invoices
- [ ] Responsive and dark mode work
