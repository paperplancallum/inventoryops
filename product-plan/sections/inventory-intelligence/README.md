# Inventory Intelligence

## Overview

Intelligent inventory planning and replenishment system that analyzes current stock positions, sales forecasts, and supply chain lead times to generate actionable suggestions for transfers and purchase orders. Includes a comprehensive sales forecasting workbench with model comparison, anomaly detection, and manual adjustments.

## User Flows

### Replenishment Suggestions
- View dashboard with urgency distribution and location health
- Review transfer suggestions from warehouses to Amazon locations
- Review PO suggestions for new purchase orders
- Accept suggestions to pre-fill Transfer or PO forms
- Dismiss or snooze suggestions with reasons
- Expand suggestions to see full reasoning breakdown

### Sales Forecasting Workbench
- Visualize sales history with anomaly highlighting
- Compare 4 forecasting models (SMA, Exponential, Seasonal, Holt-Winters)
- Manage blackout days (exclude/include specific dates)
- Apply manual adjustments (percentage, absolute, seasonal)
- Generate forecasts for multiple time horizons
- Manage account-level blackout days in settings

## Design Decisions

- Urgency classification: Critical, Warning, Planned, Monitor
- Four forecasting models with MAPE accuracy metrics
- Asymmetric anomaly treatment (dips auto-excluded, spikes flagged for review)
- Account-level and product-level blackout inheritance
- Simplified PO timeline showing stockout gap as hero metric
- Target quantity calculation includes safety stock and case pack rounding

## Data Used

**Entities:** `ReplenishmentSuggestion`, `DashboardSummary`, `SalesForecast`, `SafetyStockRule`, `ShippingRoute`, `SalesHistoryEntry`, `ForecastAdjustment`

**From global model:**
- Product (SKU, name, supplier)
- Location (warehouses, Amazon FBA/AWD)
- Supplier (lead times)
- Stock (current inventory positions)
- Transfer (in-transit quantities)

## Visual Reference

See `screenshot.png` for the target UI design.

## Components Provided

### Dashboard & Suggestions
- `InventoryIntelligence` - Main container with tab navigation
- `DashboardView` - Summary metrics and top urgent suggestions
- `SuggestionsView` - Filterable list of transfer or PO suggestions
- `SuggestionRow` - Individual suggestion with expand/collapse
- `SuggestionDetail` - Full breakdown modal with quantity adjustment

### Forecasting Workbench
- `ForecastsView` - Main forecasts list with edit capabilities
- `ForecastRowExpanded` - In-line forecast editing with chart
- `SimpleForecastChart` - Sales history and forecast visualization
- `ForecastAdjustmentModal` - Create/edit adjustments
- `ForecastAdjustmentsList` - Display account and product adjustments

### Shared Components
- `UrgencyBadge` - Color-coded urgency indicator
- `StockIndicator` - Visual stock level bar
- `DaysRemainingBadge` - Days until stockout display
- `POTimelineProps` - Simplified timeline with stockout gap

## Callback Props

| Callback | Description |
|----------|-------------|
| `onAcceptTransferSuggestion` | Called when user accepts a transfer suggestion |
| `onAcceptPOSuggestion` | Called when user accepts a PO suggestion |
| `onDismissSuggestion` | Called when user dismisses with optional reason |
| `onSnoozeSuggestion` | Called when user snoozes until a specific date |
| `onViewSuggestionDetail` | Called to open detailed suggestion view |
| `onRefreshSuggestions` | Called to recalculate all suggestions |
| `onUpdateForecast` | Called when user updates forecast parameters |
| `onNavigateToTransferForm` | Called with prefill data for new transfer |
| `onNavigateToPOForm` | Called with prefill data for new PO |
