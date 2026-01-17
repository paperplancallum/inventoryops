# Test Instructions: Suppliers

These test-writing instructions are **framework-agnostic**.

## Overview
Test supplier management functionality including CRUD operations, search/filter, validation, and integration with products and factory locations.

## User Flow Tests

### Flow 1: View Suppliers List
**Scenario:** User navigates to suppliers and views all vendors

#### Success Path
**Setup:** Database contains 5+ suppliers from different countries

**Steps:**
1. Navigate to Suppliers section
2. Observe suppliers table
3. Verify stats bar displays correctly

**Expected Results:**
- [ ] Table shows columns: Name, Contact, Country, Products, Lead Time, Payment Terms, Actions
- [ ] Stats bar shows: Total Suppliers, Countries, Avg Lead Time, Total Products
- [ ] Each row displays correct supplier data
- [ ] Products column shows count badge

### Flow 2: Add New Supplier
**Scenario:** User creates a new supplier

#### Success Path
**Setup:** Payment terms templates exist in system

**Steps:**
1. Click "Add Supplier" button
2. Side panel form opens
3. Enter company name: "Shanghai Electronics Co."
4. Select country: "China"
5. Enter contact name: "Wei Zhang"
6. Enter email: "wei@shanghai-elec.com"
7. Enter lead time: 45 days
8. Select payment terms template: "Standard 30/70"
9. Click "Save"

**Expected Results:**
- [ ] Form opens with all sections visible
- [ ] Country dropdown shows all countries
- [ ] Payment terms template dropdown populates
- [ ] Form validates required fields (name, country)
- [ ] On save, panel closes
- [ ] New supplier appears in table
- [ ] Stats update with new counts

#### Failure Path: Missing Required Fields
**Steps:**
1. Open Add Supplier form
2. Leave company name empty
3. Click "Save"

**Expected Results:**
- [ ] Validation error shows on name field
- [ ] Form does not submit
- [ ] Panel remains open

### Flow 3: Edit Supplier
**Scenario:** User modifies supplier details

#### Success Path
**Setup:** Supplier "Acme Manufacturing" exists

**Steps:**
1. Find "Acme Manufacturing" in table
2. Click edit action button
3. Side panel opens with pre-filled data
4. Change lead time from 30 to 25 days
5. Add phone number
6. Click "Save"

**Expected Results:**
- [ ] Form shows current supplier data
- [ ] Changes persist to database
- [ ] Table row updates with new values
- [ ] Success notification displays

### Flow 4: Delete Supplier
**Scenario:** User removes a supplier

#### Success Path: Supplier with No Products
**Setup:** Supplier exists with 0 products

**Steps:**
1. Click delete action on supplier row
2. Confirmation dialog appears
3. Click "Delete"

**Expected Results:**
- [ ] Confirmation asks "Are you sure?"
- [ ] After confirm, supplier removed from table
- [ ] Stats update (total count decreases)

#### Failure Path: Supplier with Products
**Setup:** Supplier has 5 products linked

**Steps:**
1. Click delete action on supplier row
2. Observe warning

**Expected Results:**
- [ ] Warning shows: "This supplier has 5 products"
- [ ] Option to reassign products or cancel
- [ ] Cannot delete without addressing products

### Flow 5: Search Suppliers
**Scenario:** User searches for specific supplier

#### Success Path
**Setup:** Suppliers include "Shenzhen Tech", "Shanghai Manufacturing", "Beijing Parts"

**Steps:**
1. Type "Shen" in search box
2. Observe filtered results

**Expected Results:**
- [ ] Only "Shenzhen Tech" displays
- [ ] Search is case-insensitive
- [ ] Matches on name, contact, email, or country

### Flow 6: Link Factory Location
**Scenario:** User links supplier to factory location

#### Success Path
**Setup:** Factory locations exist in Locations section

**Steps:**
1. Edit existing supplier
2. In Factory Location section, click "Link Location"
3. Select factory from dropdown
4. Save supplier

**Expected Results:**
- [ ] Available factories show in dropdown
- [ ] Selected factory displays with address
- [ ] Link persists on save

#### Alternative: Create New Factory
**Steps:**
1. Edit supplier
2. Check "Create factory location" checkbox
3. Factory fields appear (city, country, address)
4. Fill factory details
5. Save

**Expected Results:**
- [ ] New Location created with type "factory"
- [ ] Location linked to supplier automatically
- [ ] Location appears in Locations section

## Empty State Tests

### Primary Empty State
**Scenario:** No suppliers exist

**Setup:** Empty suppliers table

**Steps:**
1. Navigate to Suppliers section

**Expected Results:**
- [ ] Empty state illustration with Building icon
- [ ] Title: "No suppliers yet"
- [ ] Description: "Add your first supplier to start tracking your vendor relationships"
- [ ] "Add Supplier" CTA button prominent
- [ ] Stats bar shows zeros or hidden

## Component Interaction Tests

### Sort by Column
**Setup:** 10 suppliers with varying lead times

**Steps:**
1. Click "Lead Time" column header
2. Observe sort order
3. Click again

**Expected Results:**
- [ ] First click: ascending (shortest first)
- [ ] Second click: descending (longest first)
- [ ] Sort indicator visible

### Country Filter
**Setup:** Suppliers from China, Vietnam, USA

**Steps:**
1. Use country filter dropdown
2. Select "China"
3. Observe results

**Expected Results:**
- [ ] Only Chinese suppliers display
- [ ] Clear filter option available
- [ ] Stats update to reflect filter

## Edge Cases

### Supplier with Long Company Name
**Setup:** Company name 100+ characters

**Expected Results:**
- [ ] Name truncates in table with ellipsis
- [ ] Full name in form and detail view
- [ ] Tooltip shows full name

### Special Characters in Contact Info
**Setup:** Contact name with non-ASCII characters (Chinese, accents)

**Expected Results:**
- [ ] Characters display correctly
- [ ] Search works with special characters
- [ ] Database stores correctly

### Custom Payment Milestones
**Setup:** Supplier with custom milestones (not from template)

**Steps:**
1. Edit supplier
2. Select "Custom" payment terms
3. Add milestones: 20% deposit, 50% after inspection, 30% on delivery
4. Save

**Expected Results:**
- [ ] Custom milestones UI displays
- [ ] Percentages must sum to 100%
- [ ] Each milestone has trigger event
- [ ] Custom terms persist on save

## Sample Test Data

```typescript
const sampleSupplier: Supplier = {
  id: 'sup-001',
  name: 'Shenzhen Manufacturing Co.',
  contactName: 'Li Wei',
  contactEmail: 'liwei@szmfg.com',
  contactPhone: '+86 755 1234 5678',
  country: 'CN',
  productCount: 12,
  leadTimeDays: 45,
  paymentTerms: 'Net 30',
  paymentTermsTemplateId: 'template-net30',
  factoryLocationId: 'loc-factory-001',
  notes: 'Primary supplier for drinkware'
}

const sampleFormData: SupplierFormData = {
  name: 'New Supplier Inc.',
  contactName: 'John Doe',
  contactEmail: 'john@newsupplier.com',
  contactPhone: '+1 555 0123',
  country: 'US',
  leadTimeDays: 14,
  paymentTerms: 'Net 30',
  paymentTermsTemplateId: 'template-net30',
  createFactoryLocation: false,
  notes: ''
}

const sampleFactoryOption: FactoryLocationOption = {
  id: 'loc-001',
  name: 'Shenzhen Factory #1',
  city: 'Shenzhen',
  country: 'China'
}
```
