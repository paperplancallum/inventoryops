# Milestone 9: Locations

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete

---

## Goal

Implement location management for tracking all physical locations in the supply chain network, including factories, warehouses, 3PL facilities, Amazon fulfillment centers, ports, and customs facilities.

## Overview

Users can manage the physical locations that form their supply chain network. Each location has a type (factory, warehouse, 3PL, Amazon FBA/AWD, port, customs), address details, and contact information. Locations are referenced by Transfers (source/destination) and Inventory (where stock is held).

**Key Functionality:**
- View all locations with type badges
- Add new locations with type, address, and contact info
- Edit location details
- Toggle locations active/inactive
- Delete locations (with protection for referenced locations)
- Filter and search locations

---

## Recommended Approach: Test-Driven Development

Before implementing each component, write tests based on the user flows below:

1. **Write failing tests** for the expected behavior
2. **Implement** the minimum code to pass tests
3. **Refactor** while keeping tests green

Focus tests on:
- Location CRUD operations
- Type filtering
- Active/inactive toggle behavior
- Validation for required fields
- Delete protection for locations with transfers

---

## What to Implement

### 1. Components

Copy the provided components from `product-plan/sections/locations/components/`:
- `LocationsView.tsx` — Main view with stats, filters, and table
- `LocationCard.tsx` — Card display for location (if using card view)
- `LocationDetailPanel.tsx` — Slide-over with full location details
- `LocationForm.tsx` — Add/edit location form

### 2. Data Layer

**API Endpoints:**
```
GET    /api/locations                    # List all locations with filters
GET    /api/locations/:id                # Get location details
POST   /api/locations                    # Create location
PATCH  /api/locations/:id                # Update location
DELETE /api/locations/:id                # Delete location (soft delete)
PATCH  /api/locations/:id/toggle-active  # Toggle active status
GET    /api/locations/stats              # Get location statistics by type
```

**Database Schema:**
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,  -- factory, warehouse, 3pl, amazon-fba, amazon-awd, port, customs
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(2),         -- ISO 2-letter code
  postal_code VARCHAR(20),
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP        -- Soft delete
);
```

### 3. Callbacks

Wire up these callback props:
- `onCreateLocation` — Open add location form
- `onViewLocation` — Open detail panel
- `onEditLocation` — Open edit form
- `onDeleteLocation` — Delete with confirmation
- `onToggleActive` — Toggle active/inactive status

### 4. Empty States

Handle these empty states:
- No locations yet (first-time setup)
- No locations matching current filters
- No locations of a specific type

---

## Files to Reference

- `product-plan/sections/locations/README.md` — Section overview
- `product-plan/sections/locations/spec.md` — Detailed specification
- `product-plan/sections/locations/types.ts` — TypeScript interfaces
- `product-plan/sections/locations/data.json` — Sample data
- `product-plan/sections/locations/components/` — React components

---

## Expected User Flows

### View Locations List
1. User navigates to Locations
2. Stats bar shows Total, Active, and breakdown by type
3. Table displays locations with name, type badge, city, country, contact, status
4. Type badges are color-coded:
   - Factory: orange
   - Warehouse: blue
   - 3PL: purple
   - Amazon FBA: amber
   - Amazon AWD: yellow
   - Port: cyan
   - Customs: slate
5. User can search by name, city, or country
6. User can filter by type and status

### Add Location with Type
1. User clicks "Add Location"
2. Form opens with sections:
   - Basic Info: Name, Type (button group selector)
   - Address: Street, City, State, Country, Postal Code
   - Contact: Name, Email, Phone
   - Notes: Free text area
3. User selects location type (e.g., "3PL")
4. User fills address and contact details
5. User saves location
6. Location appears in list as Active

### Edit Location Details
1. User clicks edit action on a location row
2. Form opens pre-filled with location data
3. User modifies fields (e.g., updates contact email)
4. User saves changes
5. Location updates in list

### Toggle Active/Inactive
1. User clicks status toggle on a location row
2. Confirmation dialog appears for deactivation
3. User confirms
4. Location status changes to Inactive
5. Inactive locations are excluded from transfer dropdowns
6. User can filter to show/hide inactive locations

### Delete Location
1. User clicks delete action on a location row
2. Confirmation dialog appears
3. If location has transfers:
   - Warning shows that location is referenced
   - Suggest deactivating instead of deleting
4. If no references, user confirms deletion
5. Location is removed (soft delete)

---

## Done When

- [ ] Locations list displays with stats bar
- [ ] Type badges display with correct colors
- [ ] Search works for name, city, country
- [ ] Filter by type works
- [ ] Filter by status (active/inactive) works
- [ ] New locations can be added with all fields
- [ ] Location type selector works (button group)
- [ ] Locations can be edited
- [ ] Active/inactive toggle works
- [ ] Inactive locations excluded from transfer dropdowns
- [ ] Delete works with soft delete
- [ ] Delete protection warns about referenced locations
- [ ] Empty state displays for new accounts
- [ ] Form validation for required fields (name, type)
- [ ] Responsive on mobile and desktop
- [ ] Dark mode support works
