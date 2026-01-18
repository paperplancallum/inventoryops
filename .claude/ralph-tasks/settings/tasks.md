# Ralph Tasks: Settings Section

## Parent Task
**ID**: settings-section
**Name**: Implement Settings Section
**Description**: Implement the Settings section with Amazon Accounts, Brands, and Routes tabs for the InventoryOps application.

---

## Subtasks

### Task 1: Database - Create shipping tables
**ID**: settings-db-shipping-tables
**DependsOn**: none
**Status**: pending

**What to implement**:
Create Supabase migration for shipping_legs and shipping_routes tables.

**Files to create**:
- `supabase/migrations/[timestamp]_create_shipping_routes_tables.sql`

**Implementation details**:
1. Create `shipping_method` enum if not exists: `sea`, `air`, `ground`, `express`, `rail`
2. Create `shipping_legs` table:
   - id, name, from_location_type, from_location_name, to_location_type, to_location_name
   - method (shipping_method), transit_days_min/typical/max (INT)
   - cost_per_unit, cost_per_kg, cost_flat_fee (DECIMAL), cost_currency (CHAR(3))
   - is_active (BOOLEAN), notes (TEXT), created_at, updated_at
3. Create `shipping_routes` table:
   - id, name, leg_ids (UUID[]), is_default, is_active, notes, created_at, updated_at
4. Add indexes on location types and is_active
5. Add partial unique constraint: only one default per origin-destination type pair

**Acceptance criteria**:
- [ ] Migration runs without errors
- [ ] Tables created with correct schema
- [ ] Indexes exist for performance
- [ ] Default uniqueness constraint works

**Verification**:
```bash
supabase db push
supabase db diff
```

---

### Task 2: Database - Update brands table
**ID**: settings-db-brands-update
**DependsOn**: none
**Status**: pending

**What to implement**:
Add amazon_connection_ids column to brands table.

**Files to create**:
- `supabase/migrations/[timestamp]_add_brand_amazon_connections.sql`

**Implementation details**:
```sql
ALTER TABLE brands ADD COLUMN IF NOT EXISTS amazon_connection_ids UUID[] DEFAULT '{}';
```

**Acceptance criteria**:
- [ ] Migration runs without errors
- [ ] Column exists with empty array default

**Verification**:
```bash
supabase db push
```

---

### Task 3: Database - Create brand logos storage bucket
**ID**: settings-db-storage-bucket
**DependsOn**: none
**Status**: pending

**What to implement**:
Create Supabase Storage bucket for brand logo uploads with RLS policies.

**Files to create**:
- `supabase/migrations/[timestamp]_create_brand_logos_bucket.sql`

**Implementation details**:
1. Create 'brand-logos' bucket with public access
2. RLS policy: authenticated users can upload
3. RLS policy: anyone can view (public read)
4. RLS policy: authenticated users can delete their uploads

**Acceptance criteria**:
- [ ] Bucket created
- [ ] Authenticated users can upload
- [ ] Public can read images
- [ ] Delete works for authenticated users

**Verification**:
Test upload via Supabase dashboard or test script.

---

### Task 4: Hook - useAmazonConnections
**ID**: settings-hook-amazon
**DependsOn**: none
**Status**: pending

**What to implement**:
Create custom hook for Amazon connections CRUD operations.

**Files to create**:
- `src/lib/supabase/hooks/useAmazonConnections.ts`

**Implementation details**:
1. Define AmazonConnection interface matching database schema
2. Implement fetchConnections() - query amazon_connections table
3. Implement initiateOAuth(region) - call /api/amazon/auth GET
4. Implement refreshToken(id) - call /api/amazon/token/refresh POST
5. Implement updateMarketplaces(id, marketplaces[]) - update DB
6. Implement disconnect(id) - delete from DB
7. Return { connections, loading, error, refetch, ...methods }

**Acceptance criteria**:
- [ ] Hook exports properly
- [ ] Fetch returns connections with correct types
- [ ] OAuth initiation redirects to Amazon
- [ ] Token refresh updates database
- [ ] Marketplace update works
- [ ] Disconnect removes connection

**Verification**:
TypeScript compilation passes, manual test in dev.

---

### Task 5: Hook - useShippingLegs
**ID**: settings-hook-legs
**DependsOn**: settings-db-shipping-tables
**Status**: pending

**What to implement**:
Create custom hook for shipping legs CRUD operations.

**Files to create**:
- `src/lib/supabase/hooks/useShippingLegs.ts`

**Implementation details**:
1. Define RouteLeg interface (use types from product-plan)
2. Define LegFormData interface for create/update
3. Transform function: DB snake_case → frontend camelCase
4. fetchLegs() - query shipping_legs table
5. createLeg(data) - insert with validation
6. updateLeg(id, data) - update existing
7. deleteLeg(id) - check if used in routes, prevent if yes
8. toggleActive(id) - flip is_active
9. getLegsUsingRoute(legId) - helper to find routes using a leg

**Acceptance criteria**:
- [ ] All CRUD operations work
- [ ] Deletion prevented if leg used in routes (returns error with route names)
- [ ] Transform correctly converts DB format
- [ ] Toggle active updates database

**Verification**:
TypeScript compilation, test create/read/update/delete.

---

### Task 6: Hook - useShippingRoutes
**ID**: settings-hook-routes
**DependsOn**: settings-db-shipping-tables, settings-hook-legs
**Status**: pending

**What to implement**:
Create custom hook for shipping routes with computed totals.

**Files to create**:
- `src/lib/supabase/hooks/useShippingRoutes.ts`

**Implementation details**:
1. Define ShippingRoute and ShippingRouteExpanded interfaces
2. Define RouteFormData for create/update
3. fetchRoutes() - query with leg expansion
4. createRoute(data) - validate leg connectivity, insert
5. updateRoute(id, data) - validate, update
6. deleteRoute(id) - delete from DB
7. setDefault(id) - unset other defaults for same origin-dest, set this one
8. toggleActive(id) - flip is_active
9. validateLegConnectivity(legIds, allLegs) - ensure leg N's to_type = leg N+1's from_type
10. expandRoute(route, legs) - compute totalTransitDays, totalCosts

**Acceptance criteria**:
- [ ] Routes fetch with expanded leg data
- [ ] Computed totals are correct
- [ ] Leg connectivity validation works
- [ ] Setting default unsets other defaults for same pair
- [ ] Invalid routes rejected with clear error

**Verification**:
Test with sample data, verify computed totals match expected values.

---

### Task 7: Hook - Update useBrands for logo upload
**ID**: settings-hook-brands-update
**DependsOn**: settings-db-brands-update, settings-db-storage-bucket
**Status**: pending

**What to implement**:
Extend useBrands hook with logo upload and amazon_connection_ids support.

**Files to modify**:
- `src/lib/supabase/hooks/useBrands.ts`

**Implementation details**:
1. Update Brand interface to include amazonConnectionIds, logoUrl
2. Add uploadLogo(brandId, file: File) - upload to storage, get URL, update brand
3. Add deleteLogo(brandId) - remove from storage, clear logo_url
4. Update createBrand to accept amazonConnectionIds
5. Update updateBrand to accept amazonConnectionIds and handle logo

**Acceptance criteria**:
- [ ] Logo upload stores file in brand-logos bucket
- [ ] Logo URL saved to brand record
- [ ] Delete logo removes file and clears URL
- [ ] Amazon connection IDs can be set

**Verification**:
Upload test image, verify URL stored, verify delete removes file.

---

### Task 8: UI - Settings page layout with tabs
**ID**: settings-ui-layout
**DependsOn**: none
**Status**: pending

**What to implement**:
Create Settings page shell with tab navigation.

**Files to create**:
- `src/sections/settings/SettingsView.tsx` - Main container
- `src/sections/settings/index.ts` - Exports

**Files to modify**:
- `src/app/(app)/settings/page.tsx` - Wire up SettingsView

**Implementation details**:
1. Tab navigation: Amazon Accounts | Brands | Routes
2. Routes tab has sub-navigation: Legs | Routes
3. Use existing UI patterns from other sections
4. Responsive: tabs stack on mobile
5. Dark mode support

**Acceptance criteria**:
- [ ] Tab switching works
- [ ] Active tab highlighted
- [ ] Responsive on mobile
- [ ] Dark mode colors correct
- [ ] Sub-tabs work in Routes

**Verification**:
Visual inspection in browser, test all screen sizes.

---

### Task 9: UI - Amazon Accounts tab
**ID**: settings-ui-amazon
**DependsOn**: settings-hook-amazon, settings-ui-layout
**Status**: pending

**What to implement**:
Build Amazon Accounts management UI.

**Files to create**:
- `src/sections/settings/AmazonAccountsTab.tsx`
- `src/sections/settings/ConnectAmazonModal.tsx`
- `src/sections/settings/MarketplacesModal.tsx`

**Implementation details**:
1. AmazonAccountsTab - list connected accounts, empty state
2. Account row: seller name, seller ID, region, status badge, marketplace count, last sync, actions
3. Status badges: connected (green), expired (red), pending (amber)
4. Actions: Refresh, Edit Marketplaces, Disconnect
5. ConnectAmazonModal - select region (NA only for now), initiate OAuth
6. MarketplacesModal - checkbox list of NA marketplaces (US, CA, MX, BR)
7. Disconnect confirmation dialog

**Acceptance criteria**:
- [ ] Empty state shows when no accounts
- [ ] Connect button initiates OAuth flow
- [ ] Account list displays correctly
- [ ] Status badges show correct colors
- [ ] Marketplace edit modal works
- [ ] Refresh action works
- [ ] Disconnect with confirmation works

**Verification**:
Full flow test: connect account, edit marketplaces, refresh, disconnect.

---

### Task 10: UI - Brands tab with logo upload
**ID**: settings-ui-brands
**DependsOn**: settings-hook-brands-update, settings-ui-layout
**Status**: pending

**What to implement**:
Build Brands management UI with logo upload.

**Files to create**:
- `src/sections/settings/BrandsTab.tsx`
- `src/sections/settings/BrandForm.tsx`

**Implementation details**:
1. BrandsTab - list brands, empty state, create button
2. Brand row: logo thumbnail, name, description, product count, status, actions
3. Actions: Edit, Archive
4. BrandForm modal - name, description, logo upload, amazon connection multi-select
5. Logo upload: drag-drop or click, preview, remove
6. Archive confirmation (prevent if products assigned)
7. Validation: name required, unique name

**Acceptance criteria**:
- [ ] Empty state shows when no brands
- [ ] Create brand works
- [ ] Logo upload with preview works
- [ ] Edit brand pre-fills form
- [ ] Archive with confirmation
- [ ] Cannot archive brand with products (show warning)
- [ ] Duplicate name validation

**Verification**:
Create brand with logo, edit, archive.

---

### Task 11: UI - Legs subtab
**ID**: settings-ui-legs
**DependsOn**: settings-hook-legs, settings-ui-layout
**Status**: pending

**What to implement**:
Build shipping legs management UI.

**Files to create**:
- `src/sections/settings/LegsTab.tsx`
- `src/sections/settings/LegForm.tsx`

**Implementation details**:
1. LegsTab - list legs, empty state, create button
2. Leg row: name, from→to types, method icon, transit range, cost summary, active toggle, actions
3. Transit display: "18-28 days (typ. 22)"
4. Cost display: "$0.85/unit + $2,800 flat"
5. Actions: Edit, Delete
6. LegForm modal:
   - Name input
   - From location type dropdown (7 types)
   - To location type dropdown
   - Shipping method dropdown (sea, air, ground, express, rail)
   - Transit days: min, typical, max inputs
   - Costs: per unit, per kg, flat fee inputs
   - Notes textarea
7. Delete: check if used in routes, show warning with route names

**Acceptance criteria**:
- [ ] Empty state shows when no legs
- [ ] Create leg works with all fields
- [ ] Transit days display as range
- [ ] Costs display correctly
- [ ] Edit pre-fills form
- [ ] Delete blocked if used in routes (shows warning)
- [ ] Toggle active works
- [ ] Required field validation

**Verification**:
Create leg, edit, try delete when used in route, toggle active.

---

### Task 12: UI - Routes subtab with composer
**ID**: settings-ui-routes
**DependsOn**: settings-hook-routes, settings-ui-legs, settings-ui-layout
**Status**: pending

**What to implement**:
Build shipping routes UI with route composer.

**Files to create**:
- `src/sections/settings/RoutesTab.tsx`
- `src/sections/settings/RouteComposer.tsx`

**Implementation details**:
1. RoutesTab - list routes, empty state, create button
2. Route row: name, origin→dest, leg count, total transit, total cost, default badge, active toggle, actions
3. Total display: "23-33 days (typ. 25) | $1.00/unit + $2,950"
4. Actions: Edit, Set Default, Delete
5. RouteComposer modal:
   - Name input
   - Leg sequence builder (add leg dropdown, reorder via drag or up/down buttons)
   - Visual chain: Factory → 3PL → FBA with connecting arrows
   - Real-time totals calculation
   - Connectivity validation (highlight errors)
   - Default checkbox
   - Notes textarea
6. Set Default: confirms, unsets other defaults for same origin-dest pair

**Acceptance criteria**:
- [ ] Empty state shows when no routes
- [ ] Create route with leg sequence
- [ ] Composer shows visual leg chain
- [ ] Totals auto-calculate
- [ ] Connectivity validation prevents invalid routes
- [ ] Edit pre-fills composer
- [ ] Set default unsets other defaults
- [ ] Delete works
- [ ] Toggle active works

**Verification**:
Create route with 3 legs, verify totals, try invalid sequence, set as default.

---

### Task 13: Tests - Settings section tests
**ID**: settings-tests
**DependsOn**: settings-ui-amazon, settings-ui-brands, settings-ui-legs, settings-ui-routes
**Status**: pending

**What to implement**:
Write comprehensive tests based on tests.md specifications.

**Files to create**:
- `src/sections/settings/__tests__/AmazonAccounts.test.tsx`
- `src/sections/settings/__tests__/Brands.test.tsx`
- `src/sections/settings/__tests__/Legs.test.tsx`
- `src/sections/settings/__tests__/Routes.test.tsx`

**Test coverage**:
1. Amazon Accounts:
   - Connect flow (OAuth initiation)
   - Marketplace toggles
   - Refresh token
   - Disconnect with confirmation
   - Empty state

2. Brands:
   - Create brand
   - Edit brand
   - Archive brand
   - Logo upload
   - Duplicate name validation
   - Cannot archive with products
   - Empty state

3. Legs:
   - Create leg with all fields
   - Edit leg
   - Delete leg
   - Delete blocked when used in routes
   - Toggle active
   - Required field validation
   - Transit days display format
   - Empty state

4. Routes:
   - Create route with legs
   - Edit route
   - Delete route
   - Leg connectivity validation
   - Auto-calculated totals
   - Set default (unsets others)
   - Toggle active
   - Empty state

**Acceptance criteria**:
- [ ] All tests pass
- [ ] Coverage for all user flows from tests.md
- [ ] Edge cases tested
- [ ] Empty states tested

**Verification**:
```bash
npm test -- --coverage src/sections/settings
```

---

## Dependency Graph

```
                    ┌─────────────────────────────────────┐
                    │ settings-db-shipping-tables (Task 1)│
                    └─────────────────┬───────────────────┘
                                      │
           ┌──────────────────────────┼──────────────────────────┐
           │                          │                          │
           ▼                          ▼                          │
┌─────────────────────┐    ┌─────────────────────┐              │
│ settings-hook-legs  │    │ settings-hook-routes│◄─────────────┘
│     (Task 5)        │◄───│     (Task 6)        │
└─────────────────────┘    └─────────────────────┘


┌────────────────────────────┐    ┌────────────────────────────┐
│ settings-db-brands-update  │    │ settings-db-storage-bucket │
│        (Task 2)            │    │        (Task 3)            │
└────────────┬───────────────┘    └────────────┬───────────────┘
             │                                  │
             └──────────────┬───────────────────┘
                            ▼
               ┌────────────────────────┐
               │ settings-hook-brands   │
               │       (Task 7)         │
               └────────────────────────┘


┌────────────────────────────┐
│ settings-hook-amazon       │
│        (Task 4)            │ (no DB dependencies)
└────────────────────────────┘


                    ┌─────────────────────────────────────┐
                    │    settings-ui-layout (Task 8)      │
                    └─────────────────┬───────────────────┘
                                      │
    ┌─────────────────┬───────────────┼───────────────┬─────────────────┐
    │                 │               │               │                 │
    ▼                 ▼               ▼               ▼                 │
┌────────┐      ┌────────┐      ┌────────┐      ┌────────┐             │
│Task 9  │      │Task 10 │      │Task 11 │      │Task 12 │◄────────────┘
│Amazon  │      │Brands  │      │Legs    │      │Routes  │
└────────┘      └────────┘      └────────┘      └────────┘
    │                 │               │               │
    └─────────────────┴───────────────┴───────────────┘
                                      │
                                      ▼
                         ┌────────────────────────┐
                         │  settings-tests        │
                         │      (Task 13)         │
                         └────────────────────────┘
```

## Execution Order

1. **Parallel**: Tasks 1, 2, 3, 4, 8 (no dependencies)
2. **After Task 1**: Tasks 5, 6
3. **After Tasks 2, 3**: Task 7
4. **After Tasks 4, 5, 6, 7, 8**: Tasks 9, 10, 11, 12 (parallel)
5. **After Tasks 9-12**: Task 13
