# Settings Section - Feature Implementation Plan

## Overview
Implement the Settings section with three tabs: Amazon Accounts, Brands, and Routes (Legs + Routes).

## Key Architecture Decisions
- **Scope**: Organization-level (shared across all users in account)
- **Routes**: Use location TYPES (not specific locations) for routing
- **Marketplaces**: North America only (US, CA, MX, BR)
- **Route Validation**: Enforce leg endpoint connectivity (leg N's to-type = leg N+1's from-type)
- **Default Routes**: Unique constraint per origin-destination type pair

## Dependencies
- ✅ Amazon OAuth API routes already implemented
- ✅ Locations table with 7 types exists
- ✅ Brands table exists (needs amazon_connection_ids column)
- ❌ shipping_legs table needs creating
- ❌ shipping_routes table needs creating

---

## Task Breakdown

### Task 1: Database - Create shipping_legs and shipping_routes tables
**Description**: Create Supabase migration for shipping legs and routes tables with proper indexes and constraints.

**Files to create**:
- `supabase/migrations/YYYYMMDDHHMMSS_create_shipping_routes_tables.sql`

**Schema - shipping_legs**:
```sql
- id UUID PRIMARY KEY
- name VARCHAR(255) NOT NULL
- from_location_type location_type NOT NULL
- from_location_name VARCHAR(255) -- display name for the type
- to_location_type location_type NOT NULL
- to_location_name VARCHAR(255)
- method shipping_method NOT NULL (sea|air|ground|express|rail)
- transit_days_min INT NOT NULL
- transit_days_typical INT NOT NULL
- transit_days_max INT NOT NULL
- cost_per_unit DECIMAL(10,2)
- cost_per_kg DECIMAL(10,2)
- cost_flat_fee DECIMAL(10,2)
- cost_currency CHAR(3) DEFAULT 'USD'
- is_active BOOLEAN DEFAULT true
- notes TEXT
- created_at, updated_at TIMESTAMPTZ
```

**Schema - shipping_routes**:
```sql
- id UUID PRIMARY KEY
- name VARCHAR(255) NOT NULL
- leg_ids UUID[] NOT NULL (ordered array)
- is_default BOOLEAN DEFAULT false
- is_active BOOLEAN DEFAULT true
- notes TEXT
- created_at, updated_at TIMESTAMPTZ
- UNIQUE constraint on (origin_type, destination_type) WHERE is_default = true
```

**Acceptance Criteria**:
- [ ] Migration runs successfully
- [ ] Tables created with proper constraints
- [ ] Indexes on location types and is_active
- [ ] shipping_method enum created if not exists

---

### Task 2: Database - Update brands table with amazon_connection_ids
**Description**: Add amazon_connection_ids column to brands table to track which Amazon accounts sell each brand.

**Files to modify**:
- Create `supabase/migrations/YYYYMMDDHHMMSS_add_brand_amazon_connections.sql`

**Changes**:
```sql
ALTER TABLE brands ADD COLUMN amazon_connection_ids UUID[] DEFAULT '{}';
```

**Acceptance Criteria**:
- [ ] Migration runs successfully
- [ ] Column added with empty array default

---

### Task 3: Setup - Create Supabase Storage bucket for brand logos
**Description**: Create storage bucket and RLS policies for brand logo uploads.

**Files to create**:
- `supabase/migrations/YYYYMMDDHHMMSS_create_brand_logos_bucket.sql`

**Schema**:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-logos', 'brand-logos', true);

-- RLS policies for authenticated users
CREATE POLICY "Authenticated users can upload brand logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'brand-logos');

CREATE POLICY "Anyone can view brand logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'brand-logos');

CREATE POLICY "Authenticated users can delete brand logos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'brand-logos');
```

**Acceptance Criteria**:
- [ ] Bucket created
- [ ] Upload works for authenticated users
- [ ] Public read access works

---

### Task 4: Hook - Create useAmazonConnections hook
**Description**: Create custom hook for managing Amazon connections with CRUD operations.

**Files to create**:
- `src/lib/supabase/hooks/useAmazonConnections.ts`

**Functions needed**:
- `fetchConnections()` - Get all connections
- `initiateOAuth(region)` - Start OAuth flow via /api/amazon/auth
- `refreshToken(id)` - Refresh via /api/amazon/token/refresh
- `updateMarketplaces(id, marketplaces[])` - Update enabled marketplaces
- `disconnect(id)` - Remove connection

**Acceptance Criteria**:
- [ ] Hook returns connections, loading, error states
- [ ] All CRUD operations work
- [ ] Optimistic updates for better UX

---

### Task 5: Hook - Create useShippingLegs hook
**Description**: Create custom hook for shipping legs CRUD operations.

**Files to create**:
- `src/lib/supabase/hooks/useShippingLegs.ts`

**Functions needed**:
- `fetchLegs()` - Get all active legs
- `createLeg(data)` - Create new leg
- `updateLeg(id, data)` - Update leg
- `deleteLeg(id)` - Soft delete (set is_active = false)
- `toggleActive(id)` - Toggle is_active

**Acceptance Criteria**:
- [ ] Hook returns legs, loading, error states
- [ ] Transforms DB format to frontend format
- [ ] All CRUD operations work

---

### Task 6: Hook - Create useShippingRoutes hook
**Description**: Create custom hook for shipping routes with computed totals from legs.

**Files to create**:
- `src/lib/supabase/hooks/useShippingRoutes.ts`

**Functions needed**:
- `fetchRoutes()` - Get all routes with expanded leg data
- `createRoute(data)` - Create new route
- `updateRoute(id, data)` - Update route
- `deleteRoute(id)` - Soft delete
- `setDefault(id)` - Set as default (unset others for same origin-dest)
- `toggleActive(id)` - Toggle is_active
- `expandRoute(route, legs)` - Compute totals from legs

**Acceptance Criteria**:
- [ ] Hook returns routes with computed totals
- [ ] Default uniqueness enforced
- [ ] Route validation (leg connectivity) enforced

---

### Task 7: Hook - Update useBrands hook for logo upload
**Description**: Extend existing useBrands hook with Supabase Storage logo upload.

**Files to modify**:
- `src/lib/supabase/hooks/useBrands.ts`

**Functions to add**:
- `uploadLogo(brandId, file)` - Upload to storage, update brand.logo_url
- `deleteLogo(brandId)` - Remove from storage, clear logo_url
- Update `createBrand` and `updateBrand` to handle amazon_connection_ids

**Acceptance Criteria**:
- [ ] Logo upload works
- [ ] Logo URL stored in brand record
- [ ] Amazon connection IDs can be set

---

### Task 8: UI - Create Settings page layout with tab navigation
**Description**: Create the main Settings page structure with tab navigation between Amazon Accounts, Brands, and Routes.

**Files to create/modify**:
- `src/app/(app)/settings/page.tsx` - Main page
- `src/sections/settings/SettingsView.tsx` - Container with tabs
- `src/sections/settings/index.ts` - Exports

**UI Structure**:
```
Settings
├── Tab Bar: [Amazon Accounts] [Brands] [Routes]
├── Tab Content Area
│   ├── Amazon Accounts Tab (default)
│   ├── Brands Tab
│   └── Routes Tab
│       ├── Sub-tabs: [Legs] [Routes]
```

**Acceptance Criteria**:
- [ ] Tab navigation works
- [ ] URL updates with tab (optional)
- [ ] Responsive design
- [ ] Dark mode support

---

### Task 9: UI - Implement Amazon Accounts tab
**Description**: Build the Amazon Accounts management UI with connect modal, list view, and actions.

**Files to create**:
- `src/sections/settings/AmazonAccountsTab.tsx`
- `src/sections/settings/ConnectAmazonModal.tsx`
- `src/sections/settings/MarketplacesModal.tsx`

**Features**:
- Connected accounts list with status badges
- "Connect Account" button → OAuth flow
- Per-account actions: Refresh, Edit Marketplaces, Disconnect
- Empty state when no accounts

**Acceptance Criteria**:
- [ ] Can initiate Amazon OAuth
- [ ] Connected accounts display correctly
- [ ] Marketplace toggles work
- [ ] Refresh and disconnect work
- [ ] Status badges show correct colors

---

### Task 10: UI - Implement Brands tab with logo upload
**Description**: Build the Brands management UI with logo upload to Supabase Storage.

**Files to create**:
- `src/sections/settings/BrandsTab.tsx`
- `src/sections/settings/BrandForm.tsx`

**Features**:
- Brands list with product count
- Create/Edit brand modal
- Logo upload with preview
- Archive brand (with confirmation)
- Amazon connection assignment

**Acceptance Criteria**:
- [ ] Brand CRUD works
- [ ] Logo upload to Supabase Storage works
- [ ] Product count displays
- [ ] Archive with confirmation
- [ ] Amazon connections can be assigned

---

### Task 11: UI - Implement Legs subtab
**Description**: Build the shipping legs management UI.

**Files to create**:
- `src/sections/settings/LegsTab.tsx`
- `src/sections/settings/LegForm.tsx`

**Features**:
- Legs list showing origin/dest types, method, transit time, cost
- Create/Edit leg modal
- Location type dropdowns (not specific locations)
- Transit days (min/typical/max) inputs
- Cost inputs (per unit, per kg, flat fee)
- Toggle active/inactive

**Acceptance Criteria**:
- [ ] Leg CRUD works
- [ ] Location type selection (7 types)
- [ ] Transit days display as range
- [ ] Costs display correctly
- [ ] Toggle active works

---

### Task 12: UI - Implement Routes subtab with route composer
**Description**: Build the shipping routes UI with route composer for chaining legs.

**Files to create**:
- `src/sections/settings/RoutesTab.tsx`
- `src/sections/settings/RouteComposer.tsx`

**Features**:
- Routes list showing origin→dest, total time, total cost
- Route composer modal
- Add legs in sequence
- Validation: leg endpoints must connect
- Auto-calculated totals
- Set as default toggle
- Enable/disable route

**Acceptance Criteria**:
- [ ] Route CRUD works
- [ ] Composer allows adding/removing/reordering legs
- [ ] Validation prevents disconnected legs
- [ ] Totals auto-calculate
- [ ] Default route constraint works
- [ ] Toggle active works

---

### Task 13: Tests - Write tests for Settings section
**Description**: Write comprehensive tests based on tests.md specifications.

**Files to create**:
- `src/sections/settings/__tests__/AmazonAccounts.test.tsx`
- `src/sections/settings/__tests__/Brands.test.tsx`
- `src/sections/settings/__tests__/Legs.test.tsx`
- `src/sections/settings/__tests__/Routes.test.tsx`

**Test Coverage**:
- Amazon: Connect flow, marketplace toggles, refresh, disconnect
- Brands: Create, edit, archive, logo upload, duplicate name validation
- Legs: Create, edit, delete, required field validation
- Routes: Compose, edit, leg connectivity validation, set default

**Acceptance Criteria**:
- [ ] All user flows from tests.md covered
- [ ] Empty states tested
- [ ] Edge cases tested
- [ ] Tests pass

---

## Implementation Order

```
1. Database migrations (Tasks 1-3)
   └── 2. Custom hooks (Tasks 4-7)
       └── 3. UI shell (Task 8)
           └── 4. Tab implementations (Tasks 9-12) [can be parallel]
               └── 5. Tests (Task 13)
```

## Resolved Decisions

1. **Leg deletion**: Prevent deletion if leg is used in routes. Show warning listing affected routes.

2. **Route default scope**: One default per origin-destination type pair (e.g., one default Factory→FBA, one default Factory→AWD).

3. **Marketplace selection**: All manual - user must explicitly select each marketplace after connecting account.
