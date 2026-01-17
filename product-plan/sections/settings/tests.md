# Test Instructions: Settings

These test-writing instructions are **framework-agnostic**.

## Overview

Test the settings section's configuration capabilities including Amazon account connections, brand management, and the shipping routes system (legs and composed routes). Focus on CRUD operations, validation, and calculated totals.

## User Flow Tests

### Flow 1: Connect Amazon Account

**Scenario:** User connects a new Amazon Seller Central account

#### Success Path

**Setup:** No Amazon accounts connected yet

**Steps:**
1. Navigate to Settings > Amazon Accounts tab
2. Click "Connect Account" button
3. Select region (NA, EU, or FE)
4. Initiate OAuth flow
5. Complete authorization (simulated in tests)
6. Account appears in connected list

**Expected Results:**
- [ ] `onConnectAmazon` callback fires
- [ ] OAuth flow redirects appropriately (implementation detail)
- [ ] New account appears with "Connected" status
- [ ] Account shows seller ID and last sync time

---

### Flow 2: Manage Marketplaces

**Scenario:** User enables/disables marketplaces for a connected account

#### Success Path

**Setup:** Connected Amazon NA account

**Steps:**
1. Click "Edit Marketplaces" on account row
2. Modal shows marketplace checkboxes
3. Enable CA, disable MX
4. Save changes

**Expected Results:**
- [ ] `onEditMarketplaces` callback fires with account ID
- [ ] Modal shows all marketplaces for the region (US, CA, MX, BR for NA)
- [ ] Changes persist after save
- [ ] Account row updates to show enabled marketplace count

---

### Flow 3: Refresh/Disconnect Amazon Account

**Scenario:** User refreshes token or disconnects account

#### Success Path - Refresh

**Steps:**
1. Click "Refresh" action on account
2. Token refresh occurs

**Expected Results:**
- [ ] `onRefreshConnection` callback fires
- [ ] Status updates (may show "Refreshing..." then "Connected")
- [ ] Last sync time updates

#### Success Path - Disconnect

**Steps:**
1. Click "Disconnect" action
2. Confirm disconnection

**Expected Results:**
- [ ] `onDisconnectAmazon` callback fires
- [ ] Account removed from list
- [ ] Confirmation required before disconnect

---

### Flow 4: Create Brand

**Scenario:** User creates a new product brand

#### Success Path

**Setup:** Brands tab selected

**Steps:**
1. Click "Add Brand" button
2. Enter brand name: "ProWidget"
3. Enter description: "Professional widget line"
4. Optionally upload logo
5. Click "Save"

**Expected Results:**
- [ ] `onCreateBrand` callback fires with form data
- [ ] New brand appears in list
- [ ] Product count shows 0 initially

#### Failure Path: Duplicate Name

**Steps:**
1. Try to create brand with existing name

**Expected Results:**
- [ ] Validation error: "Brand name already exists"

---

### Flow 5: Edit Brand

**Scenario:** User edits an existing brand

#### Success Path

**Setup:** Brand exists in list

**Steps:**
1. Click "Edit" on brand row
2. Modify description
3. Upload new logo
4. Save changes

**Expected Results:**
- [ ] `onEditBrand` callback fires with brand ID
- [ ] Form pre-populates with existing data
- [ ] Changes persist after save

---

### Flow 6: Archive Brand

**Scenario:** User archives a brand no longer in use

#### Success Path

**Setup:** Brand exists with 0 products

**Steps:**
1. Click "Archive" on brand row
2. Confirm archival

**Expected Results:**
- [ ] `onArchiveBrand` callback fires
- [ ] Brand removed from active list (or shows "Archived" status)

#### Failure Path: Brand Has Products

**Setup:** Brand with products assigned

**Expected Results:**
- [ ] Warning: "Cannot archive brand with assigned products"
- [ ] Or: Prompt to reassign products first

---

### Flow 7: Create Shipping Leg

**Scenario:** User creates a new shipping leg

#### Success Path

**Setup:** Routes tab, Legs sub-section

**Steps:**
1. Click "Add Leg" button
2. Enter leg name: "Shenzhen to LA Ocean"
3. Select from location: Shenzhen Factory
4. Select to location: LA Warehouse
5. Select method: Sea
6. Enter transit days: min=20, typical=25, max=35
7. Enter costs: per unit $2.50
8. Save leg

**Expected Results:**
- [ ] `onCreateLeg` callback fires with form data
- [ ] New leg appears in legs list
- [ ] Transit days show as range "20-35 days (typ. 25)"

#### Failure Path: Missing Required Fields

**Steps:**
1. Leave "From Location" empty
2. Try to save

**Expected Results:**
- [ ] Validation error on required fields

---

### Flow 8: Create Composed Route

**Scenario:** User creates a route by chaining legs

#### Success Path

**Setup:** Multiple legs exist

**Steps:**
1. Click "Add Route" button
2. Route Composer opens
3. Enter route name: "Standard Ocean via LA"
4. Add leg 1: Factory to Port
5. Add leg 2: Port to LA Warehouse
6. Add leg 3: LA Warehouse to Amazon FBA
7. View auto-calculated totals
8. Mark as default for this origin-destination
9. Save route

**Expected Results:**
- [ ] `onCreateRoute` callback fires with legIds array
- [ ] Total transit days calculated as sum of legs
- [ ] Total costs calculated as sum of legs
- [ ] Route shows origin (first leg's from) and destination (last leg's to)
- [ ] Default indicator shows if marked

---

### Flow 9: Edit Route

**Scenario:** User modifies an existing route's legs

#### Success Path

**Setup:** Route exists with 3 legs

**Steps:**
1. Click "Edit" on route row
2. Route Composer opens with existing legs
3. Remove middle leg
4. Add different leg
5. View updated totals
6. Save changes

**Expected Results:**
- [ ] `onEditRoute` callback fires
- [ ] Legs can be reordered by drag-drop (if supported)
- [ ] Totals recalculate with each change
- [ ] Cannot save route with disconnected legs (to must match next from)

---

### Flow 10: Set Default Route

**Scenario:** User marks a route as the default for its origin-destination

#### Success Path

**Setup:** Multiple routes exist for same origin-destination

**Steps:**
1. Click "Set Default" on route row
2. Route marked as default

**Expected Results:**
- [ ] `onSetRouteDefault` callback fires
- [ ] Previous default for same pair is unset
- [ ] Default indicator shows on new default

## Empty State Tests

### No Amazon Accounts

**Scenario:** No Amazon accounts connected

**Steps:**
1. Navigate to Amazon Accounts tab

**Expected Results:**
- [ ] "Connect your Amazon account to sync inventory"
- [ ] "Connect Account" button prominent

### No Brands

**Scenario:** No brands created yet

**Steps:**
1. Navigate to Brands tab

**Expected Results:**
- [ ] "Create brands to organize your products"
- [ ] "Add Brand" button prominent

### No Legs/Routes

**Scenario:** No shipping legs or routes configured

**Steps:**
1. Navigate to Routes tab

**Expected Results:**
- [ ] "Configure shipping legs and routes"
- [ ] "Add Leg" button as first step

## Component Interaction Tests

### Connection Status Badge

**Test:** Status badges show correct colors

**Expected Results:**
- [ ] Connected: Green badge
- [ ] Disconnected: Gray badge
- [ ] Expired: Red badge
- [ ] Pending: Amber badge

### Transit Days Display

**Test:** Transit days show range format

**Expected Results:**
- [ ] Displays as "min-max days (typ. typical)"
- [ ] Example: "20-35 days (typ. 25)"

### Route Leg Validation

**Test:** Routes validate leg connectivity

**Expected Results:**
- [ ] Cannot save route where leg N's "to" differs from leg N+1's "from"
- [ ] Validation message: "Legs must connect end-to-end"

### Calculated Totals

**Test:** Route totals update in real-time

**Steps:**
1. Add/remove legs in route composer

**Expected Results:**
- [ ] Transit days total updates immediately
- [ ] Cost total updates immediately
- [ ] Shows breakdown: "Total: 45 days ($8.50/unit)"

## Edge Cases

- Leg with only flat fee cost (no per-unit or per-kg)
- Route with single leg (valid, just not composed)
- Marketplace with no products (should still be enabled/disabled)
- Brand name with special characters
- Very long route name (truncation)
- Delete leg that is used in a route (should warn or prevent)

## Sample Test Data

```typescript
const sampleAmazonConnection: AmazonConnection = {
  id: 'amz-001',
  connectionName: 'Main NA Account',
  region: 'NA',
  sellerId: 'A1B2C3D4E5',
  sellerName: 'Acme Corp',
  enabledMarketplaces: ['US', 'CA'],
  status: 'connected',
  lastSyncAt: '2026-01-15T08:00:00Z',
  createdAt: '2025-06-01T00:00:00Z',
}

const sampleBrand: Brand = {
  id: 'brand-001',
  name: 'ProWidget',
  description: 'Professional widget product line',
  logoUrl: 'https://...',
  status: 'active',
  productCount: 24,
  createdAt: '2025-01-01T00:00:00Z',
}

const sampleLeg: RouteLeg = {
  id: 'leg-001',
  name: 'Shenzhen to LA Ocean',
  fromLocationId: 'loc-sz-factory',
  fromLocationName: 'Shenzhen Factory',
  toLocationId: 'loc-la-wh',
  toLocationName: 'LA Warehouse',
  method: 'sea',
  transitDays: { min: 20, typical: 25, max: 35 },
  costs: { perUnit: 2.50, perKg: null, flatFee: null, currency: 'USD' },
  isActive: true,
  notes: 'Standard ocean freight',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
}

const sampleRoute: ShippingRoute = {
  id: 'route-001',
  name: 'Standard Ocean via LA',
  legIds: ['leg-001', 'leg-002', 'leg-003'],
  isDefault: true,
  isActive: true,
  notes: 'Default route for factory to FBA',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-15T00:00:00Z',
}
```
