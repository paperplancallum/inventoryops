# Milestone 12: Inventory Intelligence

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Foundation) complete, Inventory section, Transfers section, Purchase Orders section, Catalog section (for safety stock), Settings section (for shipping routes)

---

## Goal

Implement an intelligent replenishment planning system that analyzes stock positions, sales forecasts, and lead times to generate actionable transfer and purchase order suggestions.

## Overview

Inventory Intelligence is the decision-support hub for replenishment planning. It prevents stockouts by surfacing urgent situations and providing one-click actions to pre-fill Transfer and PO forms. The system includes a comprehensive Forecasting Workbench for sales prediction and anomaly management.

**Key Functionality:**

- Dashboard with urgency distribution and location health breakdown
- Transfer suggestions with source, quantity, and route recommendations
- Purchase Order suggestions when transfers are insufficient
- Accept suggestions to pre-fill Transfer/PO forms
- Sales Forecasting Workbench with multiple models and accuracy comparison
- Blackout day management for anomaly handling
- Account-level blackout configuration

## Recommended Approach: Test-Driven Development

Before implementing, write tests based on `product-plan/sections/inventory-intelligence/tests.md`:

1. Write tests for urgency classification algorithm
2. Write tests for replenishment quantity calculations
3. Write tests for forecasting models (SMA, Exponential, Holt-Winters)
4. Write tests for anomaly detection and blackout handling
5. Implement components to pass tests

## What to Implement

### Components

Copy from `product-plan/sections/inventory-intelligence/components/`:

- Dashboard view with summary cards and urgency distribution
- Transfer Suggestions list with expandable reasoning
- PO Suggestions list with expandable reasoning
- Suggestion Detail modal with adjustment controls
- Forecasting Workbench with model comparison
- Blackout calendar and management panel
- Account Settings panel for global blackouts

### Data Layer

Create API endpoints and business logic for:

- **ReplenishmentSuggestion**: type, urgency, product, destination, quantities, reasoning
- **DashboardSummary**: totalProducts, urgencyCounts, locationHealth
- **SalesForecast**: productId, locationId, dailyAverage, model, adjustments
- **BlackoutDay**: date, scope, reason, action
- **ForecastAdjustment**: type, value, dateRange, reason

### Callbacks

Wire up these callback props:

- `onAcceptTransfer(suggestionId)` - Navigate to Transfers with prefilled data
- `onAcceptPO(suggestionId)` - Navigate to Purchase Orders with prefilled data
- `onDismissSuggestion(suggestionId, reason)` - Dismiss with optional reason
- `onSnoozeSuggestion(suggestionId, until)` - Snooze until date
- `onRefreshSuggestions()` - Recalculate all suggestions
- `onViewDetails(suggestionId)` - Open suggestion detail modal

### Forecasting Callbacks

- `onGenerateForecast(productId, locationId, horizon)` - Generate new forecast
- `onSelectModel(modelType)` - Choose forecasting model
- `onToggleBlackout(date, action)` - Include/exclude date
- `onAddAdjustment(adjustment)` - Add manual adjustment
- `onApplyForecast(forecastId)` - Save and apply forecast

### Algorithm Implementation

Implement urgency classification:
- **Critical**: Days of stock < minimum lead time (stockout inevitable)
- **Warning**: Days of stock < safety stock threshold
- **Planned**: Days of stock < 2x safety stock threshold
- **Monitor**: Stock levels healthy

Implement forecasting models:
- Simple Moving Average (configurable window)
- Exponential Smoothing (configurable alpha)
- Seasonal Naive (weekly or yearly)
- Holt-Winters (triple exponential smoothing)

### Empty States

Implement empty states for:

- No suggestions (all products healthy)
- No products being monitored
- No forecasts configured yet

## Files to Reference

- `product-plan/sections/inventory-intelligence/README.md` - Design intent
- `product-plan/sections/inventory-intelligence/components/` - React components
- `product-plan/sections/inventory-intelligence/types.ts` - TypeScript interfaces
- `product-plan/sections/inventory-intelligence/data.json` - Sample data
- `product-plan/sections/inventory-intelligence/tests.md` - Test specifications

## Expected User Flows

### 1. View Dashboard with Urgency Distribution
User navigates to Inventory Intelligence. Dashboard shows summary cards: Total SKUs monitored, Critical alerts (red), Pending suggestions, Healthy products (green). Urgency distribution chart shows breakdown. Location health cards show per-location status. Top 5 urgent suggestions display with quick-action buttons.

### 2. See Transfer Suggestions
User clicks "Transfer Suggestions" tab. List shows recommended transfers with: product info, urgency badge, current stock, days remaining, recommended quantity, source location, suggested route, estimated arrival. User expands row to see full reasoning breakdown.

### 3. See PO Suggestions
User clicks "PO Suggestions" tab. List shows recommended purchase orders with: product info, urgency badge, current stock, gap after transfers, recommended quantity, supplier name, lead time, estimated arrival. User expands to see why transfer isn't sufficient.

### 4. Accept Suggestion to Prefill Form
User clicks "Accept" on a transfer suggestion. System navigates to Transfers section with create form pre-filled: source location, destination location, line items with SKU/quantity, suggested shipping method. User reviews and submits.

### 5. Manage Forecasts in Workbench
User selects product and opens Forecasting Workbench. System loads sales history, runs anomaly detection, calculates all 4 models. Comparison shows MAPE scores with "BEST" indicator. User reviews flagged spike days, toggles as needed. User selects preferred model, adds optional adjustments. Preview shows impact. User clicks "Apply Forecast" to save.

### 6. Configure Account-Level Blackouts
User clicks "Account Settings" in Forecasts tab. Panel shows Blackout Days and Product Groups tabs. User adds account-wide blackout for Prime Day. Selects date range, reason (Marketplace Event), action (Exclude). Blackout automatically applies to all products.

## Done When

- [ ] Dashboard shows accurate summary metrics
- [ ] Urgency distribution displays correctly
- [ ] Location health breakdown shows per-location status
- [ ] Transfer suggestions list with filtering and sorting
- [ ] PO suggestions list with filtering and sorting
- [ ] Reasoning sections expand with calculation details
- [ ] Accept routes to correct section with prefilled data
- [ ] Dismiss and snooze work with reason/duration
- [ ] Forecasting Workbench loads sales history
- [ ] All 4 forecasting models calculate correctly
- [ ] MAPE accuracy metrics display with color-coded ratings
- [ ] Blackout calendar toggles dates correctly
- [ ] Manual adjustments apply and preview shows impact
- [ ] Account-level blackouts inherit to all products
- [ ] Product group blackouts work correctly
- [ ] Bulk actions (accept multiple, dismiss multiple) work
- [ ] Auto-refresh on configurable interval
- [ ] Responsive on mobile and desktop
- [ ] Dark mode support works
