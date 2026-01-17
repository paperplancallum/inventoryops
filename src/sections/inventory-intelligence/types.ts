// =============================================================================
// View Types
// =============================================================================

export type InventoryIntelligenceTab =
  | 'dashboard'
  | 'transfer-suggestions'
  | 'po-suggestions'
  | 'forecasts'
  | 'settings'

// =============================================================================
// Shipping Route Types
// =============================================================================

export type ShippingMethod = 'sea' | 'air' | 'ground' | 'express' | 'rail'

export interface TransitDays {
  min: number
  typical: number
  max: number
}

export interface RouteCosts {
  perUnit: number | null
  perKg: number | null
  flatFee: number | null
  currency: string
}

export interface ShippingRoute {
  id: string
  name: string
  fromLocationId: string
  fromLocationName: string
  toLocationId: string
  toLocationName: string
  method: ShippingMethod
  transitDays: TransitDays
  costs: RouteCosts
  isDefault: boolean
  isActive: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

// =============================================================================
// Forecast Adjustment Types
// =============================================================================

export type AdjustmentEffect = 'exclude' | 'multiply'

export interface ForecastAdjustment {
  id: string
  name: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  effect: AdjustmentEffect
  multiplier?: number // Required if effect='multiply'
  isRecurring: boolean
  notes?: string
  createdAt: string
}

export interface AccountForecastAdjustment extends ForecastAdjustment {
  updatedAt: string
}

export interface ProductForecastAdjustment extends ForecastAdjustment {
  forecastId: string
  accountAdjustmentId?: string
  isOptedOut?: boolean
  updatedAt: string
}

// =============================================================================
// Sales Forecast Types
// =============================================================================

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface SalesForecast {
  id: string
  productId: string
  sku: string
  productName: string
  locationId: string
  locationName: string
  dailyRate: number
  confidence: ConfidenceLevel
  accuracyMAPE?: number
  manualOverride?: number | null
  isEnabled: boolean
  lastCalculatedAt: string | null
  seasonalMultipliers: number[] // 12 values, index 0 = Jan
  trendRate: number // Monthly growth rate
  productAdjustments: ProductForecastAdjustment[]
  createdAt: string
  updatedAt: string
}

// =============================================================================
// Sales History Types
// =============================================================================

export type SalesHistorySource = 'amazon-api' | 'manual' | 'imported'

export interface SalesHistoryEntry {
  id: string
  productId: string
  sku: string
  productName: string
  locationId: string
  locationName: string
  date: string // YYYY-MM-DD
  unitsSold: number
  revenue: number
  currency: string
  source: SalesHistorySource
  createdAt: string
}

// =============================================================================
// Safety Stock Rule Types
// =============================================================================

export type ThresholdType = 'units' | 'days-of-cover'

export interface SeasonalMultiplier {
  month: number // 1-12
  multiplier: number
}

export interface SafetyStockRule {
  id: string
  productId: string
  sku: string
  productName: string
  locationId: string
  locationName: string
  thresholdType: ThresholdType
  thresholdValue: number
  seasonalMultipliers: SeasonalMultiplier[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// =============================================================================
// Replenishment Suggestion Types
// =============================================================================

export type SuggestionType = 'transfer' | 'purchase-order'
export type SuggestionUrgency = 'critical' | 'warning' | 'planned' | 'monitor'
export type SuggestionStatus = 'pending' | 'accepted' | 'dismissed' | 'snoozed'
export type ReasoningItemType = 'info' | 'warning' | 'calculation'

export interface ReasoningItem {
  type: ReasoningItemType
  message: string
  value?: string | number
}

export interface ReplenishmentSuggestion {
  id: string
  type: SuggestionType
  urgency: SuggestionUrgency
  status: SuggestionStatus

  // Product information
  productId: string
  sku: string
  productName: string

  // Destination (usually Amazon location)
  destinationLocationId: string
  destinationLocationName: string

  // Current state at destination
  currentStock: number
  inTransitQuantity: number
  reservedQuantity: number
  availableStock: number

  // Sales and coverage
  dailySalesRate: number
  weeklySalesRate: number
  daysOfStockRemaining: number | null
  stockoutDate: string | null
  safetyStockThreshold: number

  // Recommendation
  recommendedQty: number
  estimatedArrival: string | null

  // Source (for transfers)
  sourceLocationId: string | null
  sourceLocationName: string | null
  sourceAvailableQty: number | null

  // Supplier (for POs)
  supplierId: string | null
  supplierName: string | null
  supplierLeadTimeDays: number | null

  // Route information
  routeId: string | null
  routeName: string | null
  routeMethod: ShippingMethod | null
  routeTransitDays: number | null

  // Reasoning
  reasoning: ReasoningItem[]

  // Metadata
  generatedAt: string
  snoozedUntil: string | null
  dismissedReason: string | null
  acceptedAt: string | null
  linkedEntityId: string | null
  linkedEntityType: 'transfer' | 'purchase-order' | null
}

// =============================================================================
// Dashboard Summary Types
// =============================================================================

export interface UrgencyCounts {
  critical: number
  warning: number
  planned: number
  monitor: number
}

export interface LocationHealth {
  locationId: string
  locationName: string
  locationType: string
  totalProducts: number
  healthyCount: number
  warningCount: number
  criticalCount: number
  totalValue: number
}

export interface DashboardSummary {
  totalActiveProducts: number
  totalSuggestions: number
  urgencyCounts: UrgencyCounts
  locationHealth: LocationHealth[]
  recentlyDismissed: number
  recentlySnoozed: number
  lastCalculatedAt: string
}

// =============================================================================
// Settings Types
// =============================================================================

export interface UrgencyThresholds {
  criticalDays: number
  warningDays: number
  plannedDays: number
}

export interface IntelligenceSettings {
  id: string
  urgencyThresholds: UrgencyThresholds
  autoRefreshIntervalMinutes: number
  defaultSafetyStockDays: number
  includeInTransitInCalculations: boolean
  notifyOnCritical: boolean
  notifyOnWarning: boolean
  createdAt: string
  updatedAt: string
}

// =============================================================================
// Option Types for UI
// =============================================================================

export interface ShippingMethodOption {
  id: ShippingMethod
  label: string
  icon?: string
}

export interface UrgencyOption {
  id: SuggestionUrgency
  label: string
  color: string
}

export interface ThresholdTypeOption {
  id: ThresholdType
  label: string
}

// =============================================================================
// Reference Types (from other sections)
// =============================================================================

export interface LocationReference {
  id: string
  name: string
  type: string
}

// Simple location type for UI components
export interface Location {
  id: string
  name: string
}

export interface ProductReference {
  id: string
  sku: string
  name: string
  supplierId: string | null
}

export interface SupplierReference {
  id: string
  name: string
  leadTimeDays: number
}

// =============================================================================
// Prefill Data Types (for Accept actions)
// =============================================================================

export interface TransferPrefillData {
  sourceLocationId: string
  destinationLocationId: string
  lineItems: {
    productId: string
    sku: string
    quantity: number
  }[]
  routeId?: string
  suggestionId: string
}

export interface POPrefillData {
  supplierId: string
  lineItems: {
    productId: string
    sku: string
    quantity: number
  }[]
  suggestionId: string
}

// =============================================================================
// Form Data Types
// =============================================================================

export interface ShippingRouteFormData {
  name: string
  fromLocationId: string
  toLocationId: string
  method: ShippingMethod
  transitDays: TransitDays
  costs: RouteCosts
  isDefault: boolean
  notes?: string
}

export interface SafetyStockRuleFormData {
  productId: string
  locationId: string
  thresholdType: ThresholdType
  thresholdValue: number
  seasonalMultipliers: SeasonalMultiplier[]
}

export interface ForecastAdjustmentFormData {
  name: string
  startDate: string
  endDate: string
  effect: AdjustmentEffect
  multiplier?: number
  isRecurring: boolean
  notes?: string
}

// =============================================================================
// Static Options
// =============================================================================

export const SHIPPING_METHOD_OPTIONS: ShippingMethodOption[] = [
  { id: 'sea', label: 'Sea Freight' },
  { id: 'air', label: 'Air Freight' },
  { id: 'ground', label: 'Ground' },
  { id: 'express', label: 'Express' },
  { id: 'rail', label: 'Rail' },
]

export const URGENCY_OPTIONS: UrgencyOption[] = [
  { id: 'critical', label: 'Critical', color: 'red' },
  { id: 'warning', label: 'Warning', color: 'amber' },
  { id: 'planned', label: 'Planned', color: 'blue' },
  { id: 'monitor', label: 'Monitor', color: 'slate' },
]

export const THRESHOLD_TYPE_OPTIONS: ThresholdTypeOption[] = [
  { id: 'units', label: 'Units' },
  { id: 'days-of-cover', label: 'Days of Cover' },
]
