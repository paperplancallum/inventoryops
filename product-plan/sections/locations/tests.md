# Test Instructions: Locations

These test-writing instructions are **framework-agnostic**.

## Overview
Test location management including CRUD operations, type filtering, status toggling, and integration with transfers and inventory.

## User Flow Tests

### Flow 1: View Locations List
**Scenario:** User views all locations

#### Success Path
**Setup:** Locations exist of various types

**Steps:**
1. Navigate to Locations section
2. Observe locations table and stats bar

**Expected Results:**
- [ ] Stats bar shows: Total Locations, Active, By Type breakdown
- [ ] Table columns: Name, Type, City, Country, Contact, Status, Actions
- [ ] Type badges display with correct colors
- [ ] Status toggle (Active/Inactive) in each row

### Flow 2: Add New Location
**Scenario:** User creates a new warehouse location

#### Success Path
**Steps:**
1. Click "Add Location" button
2. Side panel form opens
3. Enter name: "Chicago Distribution Center"
4. Select type: "Warehouse" (button group)
5. Enter address fields:
   - Street: "1234 Industrial Blvd"
   - City: "Chicago"
   - State: "IL"
   - Country: "US"
   - Postal Code: "60601"
6. Enter contact info:
   - Name: "John Smith"
   - Email: "john@warehouse.com"
   - Phone: "+1 312 555 0100"
7. Add notes
8. Click "Save"

**Expected Results:**
- [ ] Form validates required fields (name, type)
- [ ] Type selector shows all 7 types as button group
- [ ] Location created with "Active" status by default
- [ ] Appears in locations table
- [ ] Stats update

### Flow 3: Edit Location
**Scenario:** User modifies location details

#### Success Path
**Setup:** Location exists

**Steps:**
1. Click edit action on location row
2. Side panel opens with pre-filled data
3. Update contact email
4. Add notes
5. Save

**Expected Results:**
- [ ] All current data pre-populated
- [ ] Changes persist to database
- [ ] Table row updates

### Flow 4: Toggle Location Status
**Scenario:** User deactivates a location

#### Success Path
**Setup:** Active location exists

**Steps:**
1. Find active location in table
2. Click status toggle (Active -> Inactive)
3. Confirm if prompted

**Expected Results:**
- [ ] Status changes immediately
- [ ] Visual indicator updates (badge color)
- [ ] Location excluded from transfer dropdowns
- [ ] Stats update (active count decreases)

### Flow 5: Filter by Type
**Scenario:** User filters to see only Amazon locations

#### Success Path
**Setup:** Locations of multiple types exist

**Steps:**
1. Click type filter dropdown
2. Select "Amazon FBA"
3. Observe filtered results

**Expected Results:**
- [ ] Only Amazon FBA locations display
- [ ] Filter dropdown shows all 7 types plus "All"
- [ ] Clear filter option available
- [ ] Can select multiple types (optional)

### Flow 6: Search Locations
**Scenario:** User searches for location by city

#### Success Path
**Setup:** Locations in different cities

**Steps:**
1. Type "Los Angeles" in search box
2. Observe results

**Expected Results:**
- [ ] Results filter as user types
- [ ] Matches on name, city, country
- [ ] Case-insensitive search
- [ ] Clear search returns all

### Flow 7: Delete Location
**Scenario:** User removes unused location

#### Success Path: No Dependencies
**Setup:** Location with no transfers or stock

**Steps:**
1. Click delete action on location
2. Confirmation dialog appears
3. Confirm deletion

**Expected Results:**
- [ ] Confirmation asks "Are you sure?"
- [ ] Location removed from table
- [ ] Stats update

#### Failure Path: Location Has Transfers
**Setup:** Location referenced by transfers

**Steps:**
1. Click delete on location with transfers

**Expected Results:**
- [ ] Warning shows: "This location has X transfers"
- [ ] Cannot delete without resolving
- [ ] Suggests deactivating instead

### Flow 8: Add Factory with Supplier Link
**Scenario:** User adds factory linked to supplier

#### Success Path
**Setup:** Supplier exists with factoryLocationId empty

**Steps:**
1. Add new location
2. Select type: "Factory"
3. Fill details matching supplier's country
4. Note shows linked supplier info (if coming from supplier)

**Expected Results:**
- [ ] Factory type selected
- [ ] If creating from supplier context, supplier info shown
- [ ] Location can be linked to supplier after creation

## Empty State Tests

### No Locations
**Setup:** No locations in system

**Steps:**
1. Navigate to Locations

**Expected Results:**
- [ ] Empty state illustration with map pin icon
- [ ] Title: "No locations yet"
- [ ] Description: "Add your first location to start tracking your supply chain network"
- [ ] "Add Location" CTA button prominent
- [ ] Stats bar shows zeros or hidden

### Filtered Empty State
**Setup:** Locations exist but none match filter

**Steps:**
1. Filter by type with no matches
2. Or search for non-existent term

**Expected Results:**
- [ ] "No locations match your filters" message
- [ ] Clear filters button
- [ ] Add Location still available

## Component Interaction Tests

### Sort by Column
**Setup:** Multiple locations

**Steps:**
1. Click "Name" column header
2. Observe sort order
3. Click again for reverse

**Expected Results:**
- [ ] Alphabetical sort ascending
- [ ] Click again for descending
- [ ] Sort indicator visible

### Status Filter Toggle
**Steps:**
1. Click "Active only" toggle
2. Observe results
3. Click "Inactive only"
4. Click "All"

**Expected Results:**
- [ ] Each toggle filters appropriately
- [ ] Active only: hides inactive
- [ ] Inactive only: hides active
- [ ] All: shows everything

### Type Badge Colors
**Expected Results:**
- [ ] Factory: orange
- [ ] Warehouse: blue
- [ ] 3PL: purple
- [ ] Amazon FBA: amber
- [ ] Amazon AWD: yellow
- [ ] Port: cyan
- [ ] Customs: slate

## Edge Cases

### Long Address
**Setup:** Location with long street address

**Expected Results:**
- [ ] Address truncates in table with ellipsis
- [ ] Full address in form and detail view
- [ ] Tooltip shows full address on hover

### International Characters
**Setup:** Location name with non-ASCII (Chinese, etc.)

**Expected Results:**
- [ ] Characters display correctly in table
- [ ] Search works with international characters
- [ ] Sorts correctly

### All Amazon Locations
**Setup:** Multiple Amazon FBA and AWD locations

**Steps:**
1. Filter to Amazon types

**Expected Results:**
- [ ] Both FBA and AWD locations display
- [ ] Can differentiate by type badge
- [ ] FC codes visible (PHX7, ONT8, etc.)

### Location with Stock
**Setup:** Location holding inventory

**Steps:**
1. View location detail
2. Check for stock summary

**Expected Results:**
- [ ] Shows count of SKUs at location
- [ ] Total units displayed
- [ ] Link to Inventory filtered by location

### Reactivate Location
**Setup:** Inactive location

**Steps:**
1. Find inactive location
2. Toggle to Active

**Expected Results:**
- [ ] Location reactivated
- [ ] Appears in transfer dropdowns again
- [ ] No data loss from inactive period

## Sample Test Data

```typescript
const sampleLocation: Location = {
  id: 'loc-001',
  name: 'Los Angeles 3PL',
  type: '3pl',
  address: '5678 Logistics Way',
  city: 'Los Angeles',
  state: 'CA',
  country: 'US',
  postalCode: '90001',
  contactName: 'Maria Garcia',
  contactEmail: 'maria@la3pl.com',
  contactPhone: '+1 310 555 0199',
  notes: 'Main 3PL partner for West Coast distribution',
  isActive: true
}

const sampleAmazonLocation: Location = {
  id: 'loc-fba-phx7',
  name: 'Amazon FBA - PHX7',
  type: 'amazon-fba',
  address: '6000 W Van Buren St',
  city: 'Phoenix',
  state: 'AZ',
  country: 'US',
  postalCode: '85043',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  notes: 'Amazon Fulfillment Center Phoenix',
  isActive: true
}

const sampleFactoryLocation: Location = {
  id: 'loc-factory-001',
  name: 'Shenzhen Factory #1',
  type: 'factory',
  address: '123 Manufacturing Road',
  city: 'Shenzhen',
  state: 'Guangdong',
  country: 'CN',
  postalCode: '518000',
  contactName: 'Wei Zhang',
  contactEmail: 'wei@factory.cn',
  contactPhone: '+86 755 1234 5678',
  notes: 'Primary manufacturing facility',
  isActive: true
}

const sampleFormData: LocationFormData = {
  name: 'New Warehouse',
  type: 'warehouse',
  address: '100 Storage Blvd',
  city: 'Dallas',
  state: 'TX',
  country: 'US',
  postalCode: '75201',
  contactName: 'Bob Johnson',
  contactEmail: 'bob@warehouse.com',
  contactPhone: '+1 214 555 0100',
  notes: 'New warehouse for central distribution'
}

const locationTypes: LocationTypeOption[] = [
  { id: 'factory', label: 'Factory' },
  { id: 'warehouse', label: 'Warehouse' },
  { id: '3pl', label: '3PL' },
  { id: 'amazon-fba', label: 'Amazon FBA' },
  { id: 'amazon-awd', label: 'Amazon AWD' },
  { id: 'port', label: 'Port' },
  { id: 'customs', label: 'Customs' }
]
```
