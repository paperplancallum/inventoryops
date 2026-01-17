# Milestone 3: Suppliers

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete

---

## Goal

Enable users to manage vendor relationships with manufacturers and suppliers for their product sourcing.

## Overview

The Suppliers section is the vendor relationship database. Users can manage their supplier contacts, lead times, payment terms, and see which products come from each supplier. Suppliers are referenced by Products and Purchase Orders throughout the system.

**Key Functionality:**
- View all suppliers in a searchable, sortable table
- Add new suppliers with contact info and terms
- Edit existing supplier details
- View supplier details with linked products and POs
- Track lead times and payment terms
- Link suppliers to factory locations
- Delete suppliers (with protection for suppliers with active products)

## Recommended Approach: Test-Driven Development

Before implementing this section, **write tests first** based on the test specifications provided.

See `product-plan/sections/suppliers/tests.md` for detailed test-writing instructions.

**TDD Workflow:**
1. Read `tests.md` and write failing tests for the key user flows
2. Implement the feature to make tests pass
3. Refactor while keeping tests green

## What to Implement

### Components

Copy the section components from `product-plan/sections/suppliers/components/`

### Data Layer

The components expect these data shapes:

```typescript
interface Supplier {
  id: string
  name: string
  contactName: string
  contactEmail: string
  contactPhone?: string
  country: string
  productCount: number  // computed
  leadTimeDays: number
  paymentTerms: string
  paymentTermsTemplateId?: string
  customPaymentMilestones?: PaymentMilestone[]
  factoryLocationId?: string
  notes?: string
}

interface SupplierFormData {
  name: string
  contactName: string
  contactEmail: string
  contactPhone: string
  country: string
  leadTimeDays: number
  paymentTerms: string
  paymentTermsTemplateId?: string
  factoryLocationId?: string
  createFactoryLocation?: boolean
  notes: string
}

interface FactoryLocationOption {
  id: string
  name: string
  city: string
  country: string
}
```

See `product-plan/sections/suppliers/types.ts` for full type definitions.

### Callbacks

Wire up these user actions:

- `onCreateSupplier` - Opens form/panel to add new supplier
- `onEditSupplier(id)` - Opens form/panel to edit supplier
- `onDeleteSupplier(id)` - Deletes supplier (with confirmation)
- `onViewSupplier(id)` - Opens supplier detail view
- `onSubmit(data)` - Form submission handler

### Empty States

Implement empty state UI for:
- No suppliers yet (first-time user) - show building icon, "No suppliers yet" title, "Add your first supplier..." description, "Add Supplier" CTA

## Files to Reference

- `product-plan/sections/suppliers/README.md` - Section overview
- `product-plan/sections/suppliers/components/` - React components
- `product-plan/sections/suppliers/types.ts` - TypeScript interfaces
- `product-plan/sections/suppliers/data.json` - Sample data
- `product-plan/sections/suppliers/tests.md` - Test specifications
- `product-plan/data-model/data-model.md` - Entity relationships

## Expected User Flows

### View Suppliers List
1. User navigates to Suppliers
2. System displays suppliers table with columns: Name, Contact, Country, Products (count), Lead Time, Payment Terms, Actions
3. Stats bar shows: Total Suppliers, Countries represented, Avg Lead Time, Total Products
4. User can search by name, contact, email, or country
5. User can sort by any column

### Add New Supplier
1. User clicks "Add Supplier" button
2. Side panel opens with form sections: Company Info, Contact, Terms, Notes
3. User fills required fields (name, country) and optional fields
4. User saves
5. Supplier appears in table

### Edit Supplier
1. User clicks edit action on supplier row
2. Side panel opens with form pre-filled
3. User modifies fields
4. User saves changes
5. Table updates with new data

### Delete Supplier
1. User clicks delete action on supplier row
2. Confirmation dialog appears (with warning if supplier has products)
3. User confirms deletion
4. Supplier removed from table (or blocked if has active products/POs)

## Done When

- [ ] Suppliers table displays with all columns
- [ ] Stats bar shows aggregate metrics
- [ ] Search filters suppliers by name, contact, email, country
- [ ] "Add Supplier" opens side panel form
- [ ] Form validates required fields (name, country)
- [ ] "Edit Supplier" opens form with existing data
- [ ] "Delete Supplier" shows confirmation dialog
- [ ] Empty state shows when no suppliers exist
- [ ] Product count displays correctly per supplier
- [ ] Factory location can be linked (optional)
- [ ] Responsive on mobile and desktop
- [ ] Dark mode support works
