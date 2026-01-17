# Locations

## Overview
Manage the physical locations in your supply chain network. Locations include factories (where products are manufactured), warehouses (your own storage), 3PL facilities (third-party logistics), Amazon FBA and AWD centers, ports, and customs facilities. Each location stores address details, contact information, and operational status. Locations are referenced by Transfers (source/destination) and Inventory (where stock is held).

## User Flows
- View all locations in a list with type badges
- Filter locations by type (Factory, Warehouse, 3PL, Amazon FBA, etc.)
- Search locations by name, city, or country
- Toggle between active and inactive locations
- Add new location with type, address, and contact info
- Edit existing location details
- Toggle location active/inactive status
- Delete location (with warning if location has transfers or stock)

## Design Decisions
- Table view with color-coded type badges for quick scanning
- Active/inactive toggle inline in table for quick status changes
- Location types have distinct colors for visual differentiation
- Form uses side panel for more editing space
- Inactive locations excluded from transfer dropdowns
- Soft delete recommended when location has related data

## Data Used
**Entities:** Location, LocationType, LocationTypeOption, LinkedSupplierInfo

**From global model:** Locations, Suppliers (for factory linking)

## Visual Reference
See `screenshot.png` for the target UI design.

## Components Provided
- `LocationsView` - Main table view of all locations
- `LocationRow` - Individual location row with type badge and actions
- `LocationForm` - Side panel form for add/edit
- `LocationDetailPanel` - Full location details (optional)
- `LocationCard` - Card component for grid view (optional)
- `LocationTypeSelector` - Button group for type selection

## Callback Props
| Callback | Description |
|----------|-------------|
| `onViewLocation` | Called when user views location detail (receives id) |
| `onEditLocation` | Called when user edits location (receives id) |
| `onDeleteLocation` | Called when user deletes location (receives id) |
| `onCreateLocation` | Called when user creates new location |
| `onToggleActive` | Called when user toggles active status (receives id) |
| `onSubmit` | Called when location form is submitted (receives LocationFormData) |
| `onCancel` | Called when form is cancelled |
