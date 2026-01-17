# Test Instructions: Inventory Intelligence

These test-writing instructions are **framework-agnostic**.

## Overview

Test the replenishment suggestion system and sales forecasting workbench. Focus on urgency classification, suggestion acceptance workflows, forecast model comparison, and blackout day management.

## User Flow Tests

### Flow 1: View Dashboard

**Scenario:** User views the intelligence dashboard

#### Success Path

**Setup:** System has products with various stock levels across locations

**Steps:**
1. Navigate to Inventory Intelligence section
2. View dashboard tab (default)
3. Review summary stat cards (Total SKUs, Critical, Pending, Healthy)
4. View urgency distribution chart
5. View location health cards
6. Review top 5 urgent suggestions
7. Click "View All" for transfer suggestions

**Expected Results:**
- [ ] Summary cards show accurate counts
- [ ] Urgency distribution visualizes critical/warning/planned/monitor breakdown
- [ ] Location health shows per-Amazon-location status
- [ ] Top urgent suggestions sorted by urgency
- [ ] Last calculated timestamp displays with refresh button

---

### Flow 2: Review Transfer Suggestions

**Scenario:** User reviews and accepts a transfer suggestion

#### Success Path

**Setup:** Transfer suggestions exist with various urgency levels

**Steps:**
1. Navigate to Transfer Suggestions tab
2. Filter by "Critical" urgency
3. Locate suggestion showing stockout in 5 days
4. Expand row to see reasoning breakdown
5. Click "Accept" button
6. Verify navigation to pre-filled Transfer form

**Expected Results:**
- [ ] Suggestions filter correctly by urgency
- [ ] Each suggestion shows: product, urgency badge, current stock, days remaining, recommended qty, source location, route, estimated arrival
- [ ] Expanded view shows reasoning items (warnings, calculations)
- [ ] `onAcceptTransferSuggestion` callback fires
- [ ] `onNavigateToTransferForm` called with correct prefill data

---

### Flow 3: Review PO Suggestions

**Scenario:** User reviews PO suggestions where transfers are insufficient

#### Success Path

**Setup:** PO suggestions exist for products with insufficient warehouse stock

**Steps:**
1. Navigate to PO Suggestions tab
2. Sort by urgency descending
3. Expand a suggestion
4. Review reasoning explaining why transfer isn't sufficient
5. Adjust recommended quantity in detail view
6. Click "Accept PO"

**Expected Results:**
- [ ] PO suggestions show when warehouse stock insufficient
- [ ] Reasoning explains gap after transfers
- [ ] Supplier name and lead time display
- [ ] Quantity adjustment updates totals
- [ ] `onNavigateToPOForm` called with adjusted quantity

---

### Flow 4: Dismiss or Snooze Suggestion

**Scenario:** User dismisses or snoozes a suggestion

#### Success Path

**Setup:** Suggestion exists that user wants to defer

**Steps:**
1. Click actions menu on suggestion row
2. Select "Dismiss" with reason
3. Observe suggestion removed from list
4. On another suggestion, select "Snooze"
5. Select snooze duration (1 day, 1 week, custom)

**Expected Results:**
- [ ] Dismiss requires reason input
- [ ] Dismissed suggestions hidden from default view
- [ ] `onDismissSuggestion` callback fires with reason
- [ ] Snooze sets `snoozedUntil` date
- [ ] `onSnoozeSuggestion` callback fires with date

---

### Flow 5: Forecasting Workbench - Generate Forecast

**Scenario:** User generates a new forecast in the workbench

#### Success Path

**Setup:** Product has 90+ days of sales history

**Steps:**
1. Navigate to Forecasts tab
2. Select product and location
3. Click "Open in Workbench" or expand forecast row
4. Select time horizon (30d, 90d, 6mo, 12mo)
5. System loads history and runs anomaly detection
6. View model comparison (SMA, Exponential, Seasonal, Holt-Winters)
7. Review MAPE scores for each model
8. Note "BEST" indicator on recommended model
9. Review flagged spike days
10. Click "Apply Forecast"

**Expected Results:**
- [ ] Sales history chart displays with anomaly highlighting
- [ ] All 4 models calculate and display
- [ ] MAPE scores show with color coding (Excellent <10%, Good 10-20%, etc.)
- [ ] Best model is indicated
- [ ] Forecast applies to replenishment calculations

---

### Flow 6: Manage Blackout Days

**Scenario:** User manages blackout days for forecast accuracy

#### Success Path

**Setup:** Sales history includes anomalies (stockouts, spikes)

**Steps:**
1. Open blackout management panel in workbench
2. View calendar with color-coded days (red=excluded, orange=flagged)
3. Click on auto-excluded day to toggle inclusion
4. Click on flagged spike day to exclude it
5. View forecast impact preview for each toggle
6. Changes auto-save

**Expected Results:**
- [ ] Calendar shows excluded days in red, flagged in orange
- [ ] Toggle updates forecast preview instantly
- [ ] Stockout days are auto-excluded with "stockout" reason
- [ ] Spike days show "review" flag
- [ ] Impact preview shows units/day change

---

### Flow 7: Add Manual Adjustment

**Scenario:** User adds a seasonal adjustment to forecast

#### Success Path

**Setup:** Forecast exists for product with known seasonality

**Steps:**
1. Click "Add Adjustment" in workbench
2. Select adjustment type: "Percentage"
3. Enter value: +20%
4. Select date range: December 1-31
5. Enter reason: "Holiday season boost"
6. Preview shows before/after comparison
7. Click "Save Adjustment"

**Expected Results:**
- [ ] Adjustment types available: percentage, absolute-daily, seasonal-override, cap, floor
- [ ] Date range picker works correctly
- [ ] Reason is required
- [ ] Preview shows original vs adjusted forecast lines
- [ ] Summary shows total impact ("+X units total")
- [ ] Multiple adjustments stack with priority

---

### Flow 8: Account-Level Blackouts

**Scenario:** User configures account-wide blackout days

#### Success Path

**Setup:** Company has Prime Day scheduled

**Steps:**
1. Click "Account Settings" in Forecasts tab
2. Navigate to "Blackout Days" tab
3. Click "Add Blackout Day"
4. Select scope: "Account-wide"
5. Enter date range for Prime Day
6. Select reason: "Marketplace Event"
7. Select action: "Exclude from forecasts"
8. Save blackout

**Expected Results:**
- [ ] Account-wide blackouts apply to all products
- [ ] Products can opt-out of inherited blackouts
- [ ] Blackout shows in workbench with "inherited" indicator

## Empty State Tests

### No Suggestions

**Scenario:** All products have healthy stock levels

**Steps:**
1. Navigate to Transfer/PO Suggestions

**Expected Results:**
- [ ] "All products healthy" message displays
- [ ] Dashboard shows high healthy percentage

### No Sales History

**Scenario:** Product has no sales history for forecasting

**Steps:**
1. Open workbench for new product

**Expected Results:**
- [ ] "Insufficient history" message displays
- [ ] Manual forecast entry available

## Component Interaction Tests

### Urgency Badge Colors

**Test:** Urgency badges show correct colors

**Expected Results:**
- [ ] Critical: Red background
- [ ] Warning: Amber background
- [ ] Planned: Blue background
- [ ] Monitor: Gray background

### Days Remaining Display

**Test:** Days remaining shows appropriate formatting

**Expected Results:**
- [ ] Negative days show "Stockout!" in red
- [ ] 0-7 days show in red
- [ ] 8-14 days show in amber
- [ ] 15+ days show in green

### Stock Indicator Bar

**Test:** Visual bar represents stock levels

**Expected Results:**
- [ ] Bar fills proportionally to max
- [ ] Safety threshold line visible
- [ ] Color changes based on status

## Edge Cases

- Product with zero sales rate (division by zero handling)
- Multiple warehouses with stock (should suggest optimal source)
- Route with no transit time configured (should warn)
- Suggestion for product without supplier (PO suggestion should be skipped)
- Forecast adjustment spanning multiple years (recurring)
- Blackout day on day with zero sales anyway (no impact)

## Sample Test Data

```typescript
const sampleSuggestion: ReplenishmentSuggestion = {
  id: 'sug-001',
  type: 'transfer',
  urgency: 'critical',
  status: 'pending',
  productId: 'prod-123',
  sku: 'WDG-PRO-001',
  productName: 'Widget Pro X',
  destinationLocationId: 'loc-amz-fba',
  destinationLocationName: 'Amazon FBA US',
  currentStock: 150,
  inTransitQuantity: 0,
  reservedQuantity: 10,
  availableStock: 140,
  dailySalesRate: 28,
  weeklySalesRate: 196,
  daysOfStockRemaining: 5,
  stockoutDate: '2026-01-20',
  safetyStockThreshold: 200,
  recommendedQty: 500,
  estimatedArrival: '2026-01-25',
  sourceLocationId: 'loc-wh-1',
  sourceLocationName: 'Main Warehouse',
  sourceAvailableQty: 2000,
  supplierId: null,
  supplierName: null,
  supplierLeadTimeDays: null,
  routeId: 'route-1',
  routeName: 'Standard Ground',
  routeMethod: 'ground',
  routeTransitDays: 5,
  reasoning: [
    { type: 'warning', message: 'Will stock out before safety threshold', value: '5 days' },
    { type: 'calculation', message: 'Daily rate', value: '28 units' },
    { type: 'info', message: 'Warehouse has sufficient stock', value: '2000 units' },
  ],
  generatedAt: '2026-01-15T08:00:00Z',
  snoozedUntil: null,
  dismissedReason: null,
  acceptedAt: null,
  linkedEntityId: null,
  linkedEntityType: null,
}

const sampleForecast: SalesForecast = {
  id: 'fc-001',
  productId: 'prod-123',
  sku: 'WDG-PRO-001',
  productName: 'Widget Pro X',
  locationId: 'loc-amz-fba',
  locationName: 'Amazon FBA US',
  dailyRate: 28,
  confidence: 'high',
  accuracyMAPE: 12.5,
  manualOverride: null,
  isEnabled: true,
  lastUpdatedAt: '2026-01-15T08:00:00Z',
  seasonalMultipliers: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.2, 1.5], // Dec boost
  trendRate: 0.02,
  productAdjustments: [],
}
```
