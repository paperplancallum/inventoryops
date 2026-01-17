# Milestone 1: Foundation

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** None

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

Connect navigation to your routing. The shell includes navigation items for:
- Dashboard
- Catalog
- Suppliers
- Purchase Orders
- Inventory
- Invoices & Payments
- Inspections
- Transfers
- Locations
- Activity Log
- Magic Links
- Inventory Intelligence
- Documents
- Inbox
- Settings
- Supplier Invoices

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
