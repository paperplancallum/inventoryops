# Settings

## Overview

Application-wide configuration and settings management. Provides a central location for users to configure Amazon account connections, manage brands, set up shipping routes (legs and composed routes), and configure system preferences.

## User Flows

### Amazon Accounts
- Connect Amazon Seller Central account via OAuth
- Manage enabled marketplaces per account (US, CA, UK, DE, etc.)
- View connection status and last sync time
- Refresh token or disconnect account

### Brands
- Create new brand with name, description, and logo
- Edit existing brand details
- Archive brands no longer in use
- View product count per brand

### Shipping Routes (Legs & Routes)
- Create individual shipping legs (point-to-point segments)
- Configure transit times (min/typical/max) and costs per leg
- Compose routes by chaining multiple legs
- Set default routes for origin-destination pairs
- Enable/disable routes and legs

## Design Decisions

- Tab-based navigation within Settings
- Legs are atomic shipping segments; routes are composed from legs
- Amazon OAuth credentials stored securely on backend only
- Brands are organizational groupings, not 1:1 with Amazon accounts
- Route totals auto-calculated from constituent legs

## Data Used

**Entities:** `AmazonConnection`, `Brand`, `RouteLeg`, `ShippingRoute`, `ShippingRouteExpanded`

**From global model:**
- Location (for leg origin/destination)
- Product (linked to brands)

## Visual Reference

See `screenshot.png` for the target UI design.

## Components Provided

### Amazon Accounts
- `AmazonAccountsView` - List of connected accounts with actions

### Brands
- `BrandsView` - List of brands with create/edit/archive
- `BrandForm` - Form for creating/editing brands

### Routes
- `LegsView` - List of individual shipping legs
- `LegForm` - Form for creating/editing legs
- `RoutesView` - List of composed routes
- `RouteComposer` - Visual interface to build routes from legs

### Main
- `SettingsView` - Main container with tab navigation

## Callback Props

| Callback | Description |
|----------|-------------|
| `onConnectAmazon` | Called to initiate Amazon OAuth flow |
| `onRefreshConnection` | Called to refresh Amazon token |
| `onEditMarketplaces` | Called to edit enabled marketplaces |
| `onDisconnectAmazon` | Called to disconnect Amazon account |
| `onCreateBrand` | Called to create a new brand |
| `onEditBrand` | Called to edit an existing brand |
| `onArchiveBrand` | Called to archive a brand |
| `onCreateLeg` | Called to create a new shipping leg |
| `onEditLeg` | Called to edit an existing leg |
| `onDeleteLeg` | Called to delete a leg |
| `onToggleLegActive` | Called to enable/disable a leg |
| `onCreateRoute` | Called to create a new composed route |
| `onEditRoute` | Called to edit an existing route |
| `onDeleteRoute` | Called to delete a route |
| `onSetRouteDefault` | Called to mark a route as default |
| `onToggleRouteActive` | Called to enable/disable a route |
