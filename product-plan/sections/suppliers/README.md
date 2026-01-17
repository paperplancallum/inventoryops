# Suppliers

## Overview
Manage vendor relationships with manufacturers and suppliers. Each supplier has contact information, lead times, and payment terms. Suppliers are referenced by Products (via supplierId) and Purchase Orders (vendor for each order). This is foundational reference data that enables tracking where inventory comes from.

## User Flows
- View all suppliers in a list with key metrics (name, contact, country, product count, lead time, payment terms)
- Search suppliers by name, contact, email, or country
- Sort suppliers by any column
- Add new supplier with company info, contact details, terms, and factory location
- Edit existing supplier details
- Delete supplier with confirmation (warns if supplier has products)
- Link supplier to factory location for inspection coordination

## Design Decisions
- Suppliers displayed in table format with inline status and metrics
- Add/Edit via side panel form (not modal) for more space
- Factory location linking enables automatic location creation for new suppliers
- Payment terms can use templates or custom milestone schedules
- Product count is computed from Products referencing this supplier

## Data Used
**Entities:** Supplier, FactoryLocationOption, PaymentMilestone, PaymentTermsTemplate

**From global model:** Suppliers, Locations (factory type), Payment Terms Templates

## Visual Reference
See `screenshot.png` for the target UI design.

## Components Provided
- `SuppliersView` - Main table view of all suppliers
- `SupplierRow` - Individual supplier row with actions
- `SupplierForm` - Side panel form for add/edit
- `SupplierStats` - Stats bar showing totals and averages

## Callback Props
| Callback | Description |
|----------|-------------|
| `onViewSupplier` | Called when user clicks supplier row to view details |
| `onEditSupplier` | Called when user clicks edit action (receives id) |
| `onDeleteSupplier` | Called when user clicks delete action (receives id) |
| `onCreateSupplier` | Called when user clicks "Add Supplier" button |
| `onSubmit` | Called when supplier form is submitted (receives SupplierFormData) |
| `onCancel` | Called when supplier form is cancelled |
