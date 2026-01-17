# Milestone 16: Settings

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete, Locations section recommended for route configuration

---

## Goal

Implement application-wide settings for Amazon account connections, brand management, and shipping route configuration.

## Overview

The Settings section provides centralized configuration for key system settings organized into tabs: Amazon Accounts (OAuth connections to Seller Central), Brands (product organization), and Shipping Routes (leg-based shipping path configuration).

**Key Functionality:**
- Connect Amazon Seller Central accounts via OAuth
- Manage marketplaces for each connected account
- Create, edit, and archive brands
- Create shipping legs (origin to destination segments)
- Compose shipping routes from multiple legs
- Set default routes and enable/disable routes

## Recommended Approach: Test-Driven Development

1. Read `product-plan/sections/settings/tests.md` for test specifications
2. Write tests first for: account connection, brand CRUD, leg CRUD, route composition
3. Implement API endpoints to make tests pass
4. Wire up UI components with real data

## What to Implement

### Components

Copy components from `product-plan/sections/settings/components/`:
- Tab navigation (Amazon Accounts, Brands, Routes)
- **Amazon Accounts tab:**
  - Connected accounts list with status badges
  - Connect Account button (initiates OAuth)
  - Account card with marketplaces toggle list
  - Refresh and Disconnect actions
- **Brands tab:**
  - Brands list with product counts
  - Create/Edit brand modal (name, description, logo)
  - Archive confirmation
- **Routes tab:**
  - Legs subtab: list of shipping legs with create/edit modal
  - Routes subtab: route composer with leg selection
  - Route card showing leg sequence with totals

### Data Layer

#### Amazon Accounts
- OAuth flow with Amazon Selling Partner API
- API endpoint: `GET /api/settings/amazon-accounts`
- API endpoint: `POST /api/settings/amazon-accounts/connect` (initiate OAuth)
- API endpoint: `POST /api/settings/amazon-accounts/:id/refresh` (refresh token)
- API endpoint: `DELETE /api/settings/amazon-accounts/:id` (disconnect)
- API endpoint: `PATCH /api/settings/amazon-accounts/:id/marketplaces` (toggle marketplaces)
- Store: account credentials, region, marketplaces, status, lastSyncAt

#### Brands
- API endpoint: `GET /api/settings/brands`
- API endpoint: `POST /api/settings/brands`
- API endpoint: `PATCH /api/settings/brands/:id`
- API endpoint: `PATCH /api/settings/brands/:id/archive`
- Store: name, description, logoUrl, productCount, isArchived

#### Shipping Legs
- API endpoint: `GET /api/settings/shipping-legs`
- API endpoint: `POST /api/settings/shipping-legs`
- API endpoint: `PATCH /api/settings/shipping-legs/:id`
- API endpoint: `DELETE /api/settings/shipping-legs/:id`
- Store: originId, destinationId, carrier, method, transitDays (min/typical/max), costs

#### Shipping Routes
- API endpoint: `GET /api/settings/shipping-routes`
- API endpoint: `POST /api/settings/shipping-routes`
- API endpoint: `PATCH /api/settings/shipping-routes/:id`
- API endpoint: `PATCH /api/settings/shipping-routes/:id/toggle` (enable/disable)
- API endpoint: `PATCH /api/settings/shipping-routes/:id/default` (set as default)
- Store: name, legIds (ordered), totalTransitDays, totalCost, isDefault, isEnabled

### Callbacks to Wire Up

| Callback | Action |
|----------|--------|
| `onTabChange` | Switch between Amazon, Brands, Routes tabs |
| `onConnectAmazon` | Initiate OAuth flow |
| `onRefreshAccount` | Refresh OAuth token |
| `onDisconnectAccount` | Disconnect Amazon account |
| `onToggleMarketplace` | Enable/disable marketplace for account |
| `onCreateBrand` | Open create brand modal |
| `onEditBrand` | Open edit brand modal |
| `onArchiveBrand` | Archive brand with confirmation |
| `onCreateLeg` | Open create leg modal |
| `onEditLeg` | Open edit leg modal |
| `onDeleteLeg` | Delete leg with confirmation |
| `onCreateRoute` | Open route composer |
| `onEditRoute` | Edit existing route |
| `onToggleRoute` | Enable/disable route |
| `onSetDefaultRoute` | Set route as default for origin-destination pair |

### Empty States

- **No Amazon accounts**: "No Amazon accounts connected. Connect your Seller Central account to sync inventory."
- **No brands**: "No brands yet. Create a brand to organize your products."
- **No shipping legs**: "No shipping legs defined. Create legs to build shipping routes."
- **No shipping routes**: "No routes configured. Compose routes from your shipping legs."

## Files to Reference

- `product-plan/sections/settings/README.md` — Section overview
- `product-plan/sections/settings/components/` — React components
- `product-plan/sections/settings/tests.md` — Test specifications
- `product/sections/settings/spec.md` — Full specification
- `product/sections/settings/types.ts` — TypeScript interfaces
- `product/sections/settings/data.json` — Sample data

## Expected User Flows

### Connect Amazon Account
1. User navigates to Settings > Amazon Accounts
2. Clicks "Connect Account" button
3. Redirected to Amazon OAuth consent screen
4. Authorizes access, redirected back
5. Account appears with "Connected" status
6. User toggles marketplaces to enable (US, CA, UK, etc.)

### Manage Brands
1. User navigates to Settings > Brands
2. Clicks "Create Brand" button
3. Fills in name, description, uploads logo
4. Saves brand, appears in list with 0 product count
5. Later, edits brand details or archives unused brand

### Create Shipping Leg
1. User navigates to Settings > Routes > Legs
2. Clicks "Create Leg" button
3. Selects origin location (e.g., Factory in Shenzhen)
4. Selects destination location (e.g., Port of LA)
5. Enters carrier, method (sea), transit times (min/typical/max)
6. Enters costs (per unit, per kg, or flat)
7. Saves leg

### Compose Shipping Route
1. User navigates to Settings > Routes > Routes
2. Clicks "Create Route" button
3. Route composer opens
4. User adds legs in sequence: Factory > Port > Warehouse > Amazon FC
5. System auto-calculates total transit time and cost
6. User names the route and saves
7. Can mark as default for that origin-destination pair

## Done When

- [ ] Tab navigation works (Amazon Accounts, Brands, Routes)
- [ ] Amazon OAuth flow connects accounts
- [ ] Connected accounts show status and last sync time
- [ ] Marketplace toggles work per account
- [ ] Refresh and Disconnect actions work
- [ ] Brand CRUD works (create, edit, archive)
- [ ] Brand list shows product counts
- [ ] Shipping leg CRUD works
- [ ] Leg form captures all fields (origin, destination, carrier, method, transit times, costs)
- [ ] Route composer allows adding legs in sequence
- [ ] Route totals auto-calculate from legs
- [ ] Enable/disable route toggle works
- [ ] Set default route works
- [ ] Empty states display for each section
- [ ] Responsive on mobile and desktop
- [ ] Dark mode support works
