# InventoryOps — Product Overview

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

## Planned Sections

1. **Catalog** — Manage your products (SKUs) as the foundational inventory items with Amazon identifiers (ASIN, FNSKU), cost information, and stock levels
2. **Suppliers** — Manage vendor relationships with manufacturers and suppliers, tracking contact information, lead times, and payment terms
3. **Purchase Orders** — Create and track POs with supplier details, expected dates, and order status
4. **Inventory** — Track batches through pipeline stages with FIFO logic and Amazon reconciliation
5. **Invoices & Payments** — View invoices generated from POs, transfers, and inspections; record payments and calculate true landed cost
6. **Inspections** — Log post-production QC results, defect rates, and pass/fail decisions tied to specific batches
7. **Transfers** — Track physical movement of batches between named locations with carrier details, shipping methods, tracking numbers, costs, and documents
8. **Locations** — Manage physical locations in your supply chain (factories, warehouses, 3PL facilities, Amazon FBA/AWD centers, ports, customs)
9. **Activity Log** — Track and display all changes made by users across the system for compliance and debugging
10. **Magic Links** — Enable external stakeholders to interact via secure, tokenized URLs for invoice submission and document collection
11. **Inventory Intelligence** — Intelligent inventory planning with sales forecasting, safety stock rules, and replenishment suggestions
12. **Dashboard** — Unified view of business health, urgent actions, and upcoming operations
13. **Documents** — Centralized document management for browsing, searching, and downloading all generated PDFs
14. **Inbox** — Aggregated messages across Purchase Orders and Shipping Agents
15. **Settings** — Amazon account connections, brands, shipping routes configuration
16. **Supplier Invoices** — Review workflow for supplier price submissions with variance tracking

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

## Implementation Sequence

Build this product in milestones:

1. **Foundation** — Set up design tokens, data model types, and application shell
2. **Catalog** — Product management
3. **Suppliers** — Vendor relationship management
4. **Purchase Orders** — PO creation and tracking
5. **Inventory** — Batch tracking and pipeline stages
6. **Invoices & Payments** — Financial tracking
7. **Inspections** — Quality control
8. **Transfers** — Logistics and movement
9. **Locations** — Supply chain network
10. **Activity Log** — Audit trail
11. **Magic Links** — External stakeholder forms
12. **Inventory Intelligence** — Replenishment planning
13. **Dashboard** — Business overview
14. **Documents** — PDF management
15. **Inbox** — Message aggregation
16. **Settings** — Configuration
17. **Supplier Invoices** — Price review workflow

Each milestone has a dedicated instruction document in `product-plan/instructions/`.
