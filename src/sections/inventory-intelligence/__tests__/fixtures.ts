import type {
  ReplenishmentSuggestion,
  ReasoningItem,
  UrgencyCounts,
  LocationHealth,
  DashboardSummary,
  SalesForecast,
  SalesHistoryEntry,
  LocationReference,
  UrgencyOption,
} from '../types'

// =============================================================================
// Reasoning Items
// =============================================================================

export const sampleReasoningItems: ReasoningItem[] = [
  { type: 'calculation', message: 'Current stock: 150 units', value: 150 },
  { type: 'info', message: 'In transit: 50 units', value: 50 },
  { type: 'calculation', message: 'Daily sales rate: 12.5 units/day', value: 12.5 },
  { type: 'calculation', message: 'Days of stock remaining: 12', value: 12 },
  { type: 'warning', message: 'WARNING: Stock below 14-day threshold' },
  { type: 'calculation', message: 'Safety stock threshold: 175 units', value: 175 },
  { type: 'info', message: 'Recommended replenishment: 200 units', value: 200 },
  { type: 'info', message: 'Transfer from Perth Warehouse (500 available)' },
]

// =============================================================================
// Replenishment Suggestions
// =============================================================================

export const sampleTransferSuggestion: ReplenishmentSuggestion = {
  id: 'sug-001',
  type: 'transfer',
  urgency: 'warning',
  status: 'pending',
  productId: 'prod-001',
  sku: 'WB-500-BLK',
  productName: 'Water Bottle 500ml Black',
  destinationLocationId: 'loc-fba-001',
  destinationLocationName: 'Amazon FBA - US East',
  currentStock: 150,
  inTransitQuantity: 50,
  reservedQuantity: 0,
  availableStock: 150,
  dailySalesRate: 12.5,
  weeklySalesRate: 87.5,
  daysOfStockRemaining: 12,
  stockoutDate: '2024-02-15',
  safetyStockThreshold: 175,
  recommendedQty: 200,
  estimatedArrival: '2024-02-20',
  sourceLocationId: 'loc-wh-001',
  sourceLocationName: 'Perth Warehouse',
  sourceAvailableQty: 500,
  supplierId: null,
  supplierName: null,
  supplierLeadTimeDays: null,
  routeId: 'route-001',
  routeName: 'Perth to US East',
  routeMethod: 'sea',
  routeTransitDays: 14,
  reasoning: sampleReasoningItems,
  generatedAt: '2024-02-01T10:00:00Z',
  snoozedUntil: null,
  dismissedReason: null,
  acceptedAt: null,
  linkedEntityId: null,
  linkedEntityType: null,
}

export const samplePOSuggestion: ReplenishmentSuggestion = {
  id: 'sug-002',
  type: 'purchase-order',
  urgency: 'critical',
  status: 'pending',
  productId: 'prod-002',
  sku: 'YM-PRO-GRY',
  productName: 'Yoga Mat Pro Grey',
  destinationLocationId: 'loc-fba-002',
  destinationLocationName: 'Amazon FBA - US West',
  currentStock: 25,
  inTransitQuantity: 0,
  reservedQuantity: 0,
  availableStock: 25,
  dailySalesRate: 8.3,
  weeklySalesRate: 58.1,
  daysOfStockRemaining: 3,
  stockoutDate: '2024-02-04',
  safetyStockThreshold: 120,
  recommendedQty: 500,
  estimatedArrival: '2024-03-10',
  sourceLocationId: null,
  sourceLocationName: null,
  sourceAvailableQty: null,
  supplierId: 'sup-001',
  supplierName: 'Shenzhen Yoga Supplies',
  supplierLeadTimeDays: 30,
  routeId: 'route-002',
  routeName: 'China to US West',
  routeMethod: 'sea',
  routeTransitDays: 21,
  reasoning: [
    { type: 'calculation', message: 'Current stock: 25 units', value: 25 },
    { type: 'calculation', message: 'Daily sales rate: 8.3 units/day', value: 8.3 },
    { type: 'warning', message: 'CRITICAL: Stock will run out in 3 days' },
    { type: 'info', message: 'No warehouse stock available - purchase order required' },
    { type: 'info', message: 'Purchase from Shenzhen Yoga Supplies (30 day lead time)' },
  ],
  generatedAt: '2024-02-01T10:00:00Z',
  snoozedUntil: null,
  dismissedReason: null,
  acceptedAt: null,
  linkedEntityId: null,
  linkedEntityType: null,
}

export const samplePlannedSuggestion: ReplenishmentSuggestion = {
  id: 'sug-003',
  type: 'transfer',
  urgency: 'planned',
  status: 'pending',
  productId: 'prod-003',
  sku: 'RB-1L-BLU',
  productName: 'Reusable Bottle 1L Blue',
  destinationLocationId: 'loc-fba-001',
  destinationLocationName: 'Amazon FBA - US East',
  currentStock: 300,
  inTransitQuantity: 100,
  reservedQuantity: 0,
  availableStock: 300,
  dailySalesRate: 20,
  weeklySalesRate: 140,
  daysOfStockRemaining: 10,
  stockoutDate: '2024-02-11',
  safetyStockThreshold: 280,
  recommendedQty: 400,
  estimatedArrival: '2024-02-18',
  sourceLocationId: 'loc-wh-001',
  sourceLocationName: 'Perth Warehouse',
  sourceAvailableQty: 1200,
  supplierId: null,
  supplierName: null,
  supplierLeadTimeDays: null,
  routeId: 'route-001',
  routeName: 'Perth to US East',
  routeMethod: 'air',
  routeTransitDays: 5,
  reasoning: [
    { type: 'calculation', message: 'Current stock: 300 units', value: 300 },
    { type: 'info', message: 'In transit: 100 units', value: 100 },
    { type: 'calculation', message: 'Daily sales rate: 20 units/day', value: 20 },
    { type: 'calculation', message: 'Days of stock remaining: 10', value: 10 },
    { type: 'info', message: 'Transfer from Perth Warehouse (1,200 available)' },
  ],
  generatedAt: '2024-02-01T10:00:00Z',
  snoozedUntil: null,
  dismissedReason: null,
  acceptedAt: null,
  linkedEntityId: null,
  linkedEntityType: null,
}

export const sampleMonitorSuggestion: ReplenishmentSuggestion = {
  id: 'sug-004',
  type: 'transfer',
  urgency: 'monitor',
  status: 'pending',
  productId: 'prod-004',
  sku: 'FB-500-RED',
  productName: 'Fitness Bottle 500ml Red',
  destinationLocationId: 'loc-fba-001',
  destinationLocationName: 'Amazon FBA - US East',
  currentStock: 800,
  inTransitQuantity: 200,
  reservedQuantity: 0,
  availableStock: 800,
  dailySalesRate: 15,
  weeklySalesRate: 105,
  daysOfStockRemaining: 53,
  stockoutDate: null,
  safetyStockThreshold: 210,
  recommendedQty: 0,
  estimatedArrival: null,
  sourceLocationId: 'loc-wh-001',
  sourceLocationName: 'Perth Warehouse',
  sourceAvailableQty: 2000,
  supplierId: null,
  supplierName: null,
  supplierLeadTimeDays: null,
  routeId: null,
  routeName: null,
  routeMethod: null,
  routeTransitDays: null,
  reasoning: [
    { type: 'calculation', message: 'Current stock: 800 units', value: 800 },
    { type: 'info', message: 'In transit: 200 units', value: 200 },
    { type: 'calculation', message: 'Days of stock remaining: 53', value: 53 },
    { type: 'info', message: 'Stock levels healthy - monitoring' },
  ],
  generatedAt: '2024-02-01T10:00:00Z',
  snoozedUntil: null,
  dismissedReason: null,
  acceptedAt: null,
  linkedEntityId: null,
  linkedEntityType: null,
}

export const sampleSuggestions: ReplenishmentSuggestion[] = [
  sampleTransferSuggestion,
  samplePOSuggestion,
  samplePlannedSuggestion,
  sampleMonitorSuggestion,
]

// =============================================================================
// Dashboard Data
// =============================================================================

export const sampleUrgencyCounts: UrgencyCounts = {
  critical: 2,
  warning: 5,
  planned: 8,
  monitor: 15,
}

export const sampleLocationHealth: LocationHealth[] = [
  {
    locationId: 'loc-fba-001',
    locationName: 'Amazon FBA - US East',
    locationType: 'amazon_fba',
    totalProducts: 25,
    healthyCount: 18,
    warningCount: 5,
    criticalCount: 2,
    totalValue: 45000,
  },
  {
    locationId: 'loc-fba-002',
    locationName: 'Amazon FBA - US West',
    locationType: 'amazon_fba',
    totalProducts: 20,
    healthyCount: 15,
    warningCount: 3,
    criticalCount: 2,
    totalValue: 32000,
  },
  {
    locationId: 'loc-awd-001',
    locationName: 'Amazon AWD - LA',
    locationType: 'amazon_awd',
    totalProducts: 15,
    healthyCount: 12,
    warningCount: 2,
    criticalCount: 1,
    totalValue: 28000,
  },
]

export const sampleDashboardSummary: DashboardSummary = {
  totalActiveProducts: 60,
  totalSuggestions: 30,
  urgencyCounts: sampleUrgencyCounts,
  locationHealth: sampleLocationHealth,
  recentlyDismissed: 3,
  recentlySnoozed: 2,
  lastCalculatedAt: '2024-02-01T10:42:00Z',
}

// =============================================================================
// Helper Functions
// =============================================================================

export function createSuggestion(
  overrides: Partial<ReplenishmentSuggestion>
): ReplenishmentSuggestion {
  return {
    ...sampleTransferSuggestion,
    id: `sug-${Math.random().toString(36).substr(2, 9)}`,
    ...overrides,
  }
}

export function createTransferSuggestions(count: number): ReplenishmentSuggestion[] {
  return Array.from({ length: count }, (_, i) =>
    createSuggestion({
      id: `sug-transfer-${i + 1}`,
      type: 'transfer',
      sku: `SKU-${String(i + 1).padStart(3, '0')}`,
      productName: `Product ${i + 1}`,
    })
  )
}

export function createPOSuggestions(count: number): ReplenishmentSuggestion[] {
  return Array.from({ length: count }, (_, i) =>
    createSuggestion({
      ...samplePOSuggestion,
      id: `sug-po-${i + 1}`,
      sku: `SKU-PO-${String(i + 1).padStart(3, '0')}`,
      productName: `PO Product ${i + 1}`,
    })
  )
}

// =============================================================================
// Location References
// =============================================================================

export const sampleLocations: LocationReference[] = [
  {
    id: 'loc-fba-001',
    name: 'Amazon FBA - US East',
    type: 'amazon_fba',
  },
  {
    id: 'loc-fba-002',
    name: 'Amazon FBA - US West',
    type: 'amazon_fba',
  },
  {
    id: 'loc-wh-001',
    name: 'Perth Warehouse',
    type: 'warehouse',
  },
]

// =============================================================================
// Urgency Options
// =============================================================================

export const sampleUrgencyOptions: UrgencyOption[] = [
  { id: 'critical', label: 'Critical', color: 'red' },
  { id: 'warning', label: 'Warning', color: 'amber' },
  { id: 'planned', label: 'Planned', color: 'indigo' },
  { id: 'monitor', label: 'Monitor', color: 'slate' },
]

// =============================================================================
// Sales Forecasts
// =============================================================================

export const sampleSalesForecasts: SalesForecast[] = [
  {
    id: 'fc-001',
    productId: 'prod-001',
    sku: 'WB-500-BLK',
    productName: 'Water Bottle 500ml Black',
    locationId: 'loc-fba-001',
    locationName: 'Amazon FBA - US East',
    dailyRate: 12.5,
    weeklyRate: 87.5,
    monthlyRate: 375,
    confidence: 'high',
    basedOnDays: 90,
    lastCalculatedAt: '2024-02-01T10:00:00Z',
    manualOverride: null,
    seasonalMultipliers: [1, 1, 1, 1.2, 1.3, 1.5, 1.5, 1.4, 1.2, 1, 0.9, 0.8],
    trendRate: 0.05,
    isEnabled: true,
  },
  {
    id: 'fc-002',
    productId: 'prod-002',
    sku: 'YM-PRO-GRY',
    productName: 'Yoga Mat Pro Grey',
    locationId: 'loc-fba-002',
    locationName: 'Amazon FBA - US West',
    dailyRate: 8.3,
    weeklyRate: 58.1,
    monthlyRate: 249,
    confidence: 'medium',
    basedOnDays: 60,
    lastCalculatedAt: '2024-02-01T10:00:00Z',
    manualOverride: 10,
    seasonalMultipliers: null,
    trendRate: 0,
    isEnabled: true,
  },
  {
    id: 'fc-003',
    productId: 'prod-003',
    sku: 'RB-1L-BLU',
    productName: 'Reusable Bottle 1L Blue',
    locationId: 'loc-fba-001',
    locationName: 'Amazon FBA - US East',
    dailyRate: 20,
    weeklyRate: 140,
    monthlyRate: 600,
    confidence: 'low',
    basedOnDays: 21,
    lastCalculatedAt: '2024-02-01T10:00:00Z',
    manualOverride: null,
    seasonalMultipliers: null,
    trendRate: -0.1,
    isEnabled: false,
  },
]

// =============================================================================
// Sales History
// =============================================================================

export const sampleSalesHistory: SalesHistoryEntry[] = [
  { date: '2024-01-01', unitsSold: 12, productId: 'prod-001', locationId: 'loc-fba-001' },
  { date: '2024-01-02', unitsSold: 15, productId: 'prod-001', locationId: 'loc-fba-001' },
  { date: '2024-01-03', unitsSold: 10, productId: 'prod-001', locationId: 'loc-fba-001' },
  { date: '2024-01-04', unitsSold: 13, productId: 'prod-001', locationId: 'loc-fba-001' },
  { date: '2024-01-05', unitsSold: 11, productId: 'prod-001', locationId: 'loc-fba-001' },
]
