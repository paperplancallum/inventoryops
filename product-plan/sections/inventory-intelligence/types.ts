// =============================================================================
// View Types
// =============================================================================

export type InventoryIntelligenceTab =
  | 'dashboard'
  | 'transfer-suggestions'
  | 'po-suggestions'
  | 'forecasts'

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
  notes: string
  createdAt: string
  updatedAt: string
}

// =============================================================================
// Forecast Adjustment Types
// =============================================================================

export type AdjustmentEffect = 'exclude' | 'multiply'

export interface ForecastAdjustment {
  id: string
  name: string                    // "Black Friday", "Christmas Week"
  startDate: string               // YYYY-MM-DD
  endDate: string                 // YYYY-MM-DD
  effect: AdjustmentEffect
  multiplier?: number             // Required if effect='multiply', e.g., 1.5 = +50%
  isRecurring: boolean            // Repeats yearly
  notes?: string
  createdAt: string
}

// Account-level adjustments (applied to all products by default)
export interface AccountForecastAdjustment extends ForecastAdjustment {
  // Same as base, applied to all products by default
}

// Product-level adjustments (can reference/override account adjustments)
export interface ProductForecastAdjustment extends ForecastAdjustment {
  productId: string
  accountAdjustmentId?: string    // If overriding an account adjustment
  isOptedOut?: boolean            // If true, this product ignores the account adjustment
}

// =============================================================================
// Sales Forecast Types (Simplified)
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
  lastUpdatedAt: string
  // Seasonal and trend adjustments
  seasonalMultipliers: number[]  // 12 values, index 0 = Jan, default all 1.0
  trendRate: number              // Monthly growth rate, e.g., 0.02 = 2% growth
  // Forecast adjustments
  productAdjustments: ProductForecastAdjustment[]  // Product-specific adjustments (includes opt-outs)
  /** @deprecated Use productAdjustments instead */
  optOutAccountDates?: string[]   // Account date IDs this product opts out of
}

// =============================================================================
// DEPRECATED: Excluded Date Types (kept for backward compatibility)
// =============================================================================

export type ExcludedDateReason = 'stockout' | 'holiday' | 'promotion' | 'outlier' | 'other'

/** @deprecated Use AccountForecastAdjustment instead */
export interface AccountExcludedDate {
  id: string
  date: string           // YYYY-MM-DD
  reason: ExcludedDateReason
  notes?: string
  isRecurring: boolean   // e.g., Christmas every year
  createdAt: string
}

/** @deprecated Use ProductForecastAdjustment instead */
export interface ExcludedDate {
  id: string
  productId: string
  date: string  // YYYY-MM-DD
  reason?: ExcludedDateReason
  notes?: string
  isAutoDetected: boolean
  isFromAccount?: boolean    // True if inherited from account-level date
  accountDateId?: string     // Reference to the account date if inherited
  createdAt: string
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
  multiplier: number // e.g., 1.5 for 50% increase
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
  daysOfStockRemaining: number
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
  urgencyThresholds: UrgencyThresholds
  autoRefreshIntervalMinutes: number
  defaultSafetyStockDays: number
  includeInTransitInCalculations: boolean
  notifyOnCritical: boolean
  notifyOnWarning: boolean
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

export interface ProductReference {
  id: string
  sku: string
  name: string
  supplierId: string
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
// Component Props
// =============================================================================

export interface InventoryIntelligenceProps {
  // Dashboard data
  dashboardSummary: DashboardSummary

  // Suggestions
  transferSuggestions: ReplenishmentSuggestion[]
  poSuggestions: ReplenishmentSuggestion[]

  // Configuration data
  routes: ShippingRoute[]
  forecasts: SalesForecast[]
  safetyStockRules: SafetyStockRule[]
  settings: IntelligenceSettings

  // Reference data
  locations: LocationReference[]
  products: ProductReference[]
  suppliers: SupplierReference[]

  // Options for dropdowns
  shippingMethods: ShippingMethodOption[]
  urgencyOptions: UrgencyOption[]
  thresholdTypes: ThresholdTypeOption[]

  // Suggestion callbacks
  onAcceptTransferSuggestion?: (id: string) => void
  onAcceptPOSuggestion?: (id: string) => void
  onDismissSuggestion?: (id: string, reason?: string) => void
  onSnoozeSuggestion?: (id: string, until: string) => void
  onViewSuggestionDetail?: (id: string) => void
  onRefreshSuggestions?: () => void

  // Route callbacks
  onCreateRoute?: () => void
  onEditRoute?: (id: string) => void
  onDeleteRoute?: (id: string) => void
  onSetDefaultRoute?: (id: string) => void
  onToggleRouteActive?: (id: string) => void

  // Forecast callbacks
  onUpdateForecast?: (id: string, data: Partial<SalesForecast>) => void
  onDeleteForecast?: (id: string) => void

  // Safety stock callbacks
  onUpdateSafetyRule?: (id: string, data: Partial<SafetyStockRule>) => void
  onCreateSafetyRule?: () => void
  onDeleteSafetyRule?: (id: string) => void

  // Settings callbacks
  onUpdateSettings?: (settings: Partial<IntelligenceSettings>) => void

  // Navigation callbacks
  onNavigateToTransferForm?: (prefillData: TransferPrefillData) => void
  onNavigateToPOForm?: (prefillData: POPrefillData) => void
}

// =============================================================================
// Dashboard Component Props
// =============================================================================

export interface DashboardViewProps {
  summary: DashboardSummary
  topSuggestions: ReplenishmentSuggestion[]
  onViewAllSuggestions?: (type: SuggestionType) => void
  onAcceptSuggestion?: (id: string, type: SuggestionType) => void
  onRefresh?: () => void
}

// =============================================================================
// Suggestions Component Props
// =============================================================================

export interface SuggestionsViewProps {
  suggestions: ReplenishmentSuggestion[]
  type: SuggestionType
  locations: LocationReference[]
  urgencyOptions: UrgencyOption[]
  routes?: ShippingRoute[]
  onAccept?: (id: string, adjustedQty?: number) => void
  onDismiss?: (id: string, reason?: string) => void
  onSnooze?: (id: string, until: string) => void
  onViewDetail?: (id: string) => void
}

export interface SuggestionRowProps {
  suggestion: ReplenishmentSuggestion
  onAccept?: () => void
  onDismiss?: () => void
  onSnooze?: () => void
  onViewDetail?: () => void
  isExpanded?: boolean
  onToggleExpand?: () => void
}

export interface SuggestionDetailProps {
  suggestion: ReplenishmentSuggestion
  route?: ShippingRoute
  onAccept?: (adjustedQty?: number) => void
  onDismiss?: (reason?: string) => void
  onSnooze?: (until: string) => void
  onClose?: () => void
}

export interface ReasoningListProps {
  items: ReasoningItem[]
}

// =============================================================================
// Forecasts Component Props
// =============================================================================

export interface ForecastsViewProps {
  forecasts: SalesForecast[]
  salesHistory: SalesHistoryEntry[]
  accountAdjustments: AccountForecastAdjustment[]
  products: ProductReference[]
  locations: LocationReference[]
  onUpdateForecast?: (id: string, data: Partial<SalesForecast>) => void
  onToggleEnabled?: (id: string, enabled: boolean) => void
  onRecalculateForecast?: (productId: string) => void
  // Account adjustments
  onAddAccountAdjustment?: (adjustment: Omit<AccountForecastAdjustment, 'id' | 'createdAt'>) => void
  onUpdateAccountAdjustment?: (id: string, data: Partial<AccountForecastAdjustment>) => void
  onRemoveAccountAdjustment?: (id: string) => void
  // Product adjustments
  onAddProductAdjustment?: (forecastId: string, adjustment: Omit<ProductForecastAdjustment, 'id' | 'createdAt' | 'productId'>) => void
  onUpdateProductAdjustment?: (forecastId: string, adjustmentId: string, data: Partial<ProductForecastAdjustment>) => void
  onRemoveProductAdjustment?: (forecastId: string, adjustmentId: string) => void
  onOptOutAccountAdjustment?: (forecastId: string, accountAdjustmentId: string) => void
  onOptInAccountAdjustment?: (forecastId: string, accountAdjustmentId: string) => void
}

export interface ForecastRowExpandedProps {
  forecast: SalesForecast
  salesHistory: SalesHistoryEntry[]
  accountAdjustments: AccountForecastAdjustment[]
  onClose: () => void
  onUpdateRate: (rate: number) => void
  onUpdateSeasonalMultipliers: (multipliers: number[]) => void
  onUpdateTrendRate: (rate: number) => void
  // Product adjustments
  onAddProductAdjustment: (adjustment: Omit<ProductForecastAdjustment, 'id' | 'createdAt' | 'productId'>) => void
  onUpdateProductAdjustment: (adjustmentId: string, data: Partial<ProductForecastAdjustment>) => void
  onRemoveProductAdjustment: (adjustmentId: string) => void
  onOptOutAccountAdjustment: (accountAdjustmentId: string) => void
  onOptInAccountAdjustment: (accountAdjustmentId: string) => void
  onApply: () => void
}

export interface SimpleForecastChartProps {
  salesHistory: SalesHistoryEntry[]
  forecastDailyRate: number
  seasonalMultipliers: number[]  // 12 values, index 0 = Jan
  trendRate: number              // Monthly growth rate
  adjustments: ForecastAdjustment[]  // Active adjustments to show on chart
  height?: number
}

export interface ForecastAdjustmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (adjustment: Omit<ForecastAdjustment, 'id' | 'createdAt'>) => void
  editingAdjustment?: ForecastAdjustment | null
  title?: string
}

export interface ForecastAdjustmentsListProps {
  accountAdjustments: AccountForecastAdjustment[]
  productAdjustments: ProductForecastAdjustment[]
  optedOutAccountIds: string[]
  onAddProductAdjustment: () => void
  onEditProductAdjustment: (id: string) => void
  onRemoveProductAdjustment: (id: string) => void
  onOverrideAccountAdjustment: (accountAdjustmentId: string) => void
  onOptOutAccountAdjustment: (accountAdjustmentId: string) => void
  onOptInAccountAdjustment: (accountAdjustmentId: string) => void
}

// =============================================================================
// DEPRECATED: Excluded Dates Props (kept for backward compatibility)
// =============================================================================

/** @deprecated Use ForecastAdjustmentsListProps instead */
export interface ExcludedDatesListProps {
  dates: ExcludedDate[]
  accountDates: AccountExcludedDate[]
  optedOutAccountDateIds: string[]
  onAdd: (date: string, reason?: ExcludedDateReason, notes?: string) => void
  onRemove: (id: string) => void
  onOptOutAccountDate: (accountDateId: string) => void
  onOptInAccountDate: (accountDateId: string) => void
  maxVisible?: number
}

// =============================================================================
// Shared Component Props
// =============================================================================

export interface UrgencyBadgeProps {
  urgency: SuggestionUrgency
  size?: 'sm' | 'md' | 'lg'
}

export interface StockIndicatorProps {
  current: number
  threshold: number
  max?: number
  showLabel?: boolean
}

export interface DaysRemainingBadgeProps {
  days: number
  stockoutDate?: string | null
  urgency?: SuggestionUrgency
}

// =============================================================================
// Timeline Component Props
// =============================================================================

export interface TransferTimelineProps {
  suggestion: ReplenishmentSuggestion
}

export interface POTimelineProps {
  suggestion: ReplenishmentSuggestion
  routes?: ShippingRoute[]
}

// =============================================================================
// Stockout Gap Metric (Simplified PO Timeline)
// =============================================================================

export interface StockoutGapMetric {
  stockoutDate: Date | null
  arrivalDate: Date
  gapDays: number
  willStockOut: boolean
  totalLeadTimeDays: number
  projectedStockOnArrival: number
  coverageAfterArrival: number
}

// =============================================================================
// Form Types
// =============================================================================

export type ForecastSource = 'amazon-api' | 'manual' | 'imported'

export interface ForecastFormData {
  productId: string
  locationId: string
  dailyRate: number
  source: ForecastSource
  confidence: ConfidenceLevel
  seasonalMultipliers: SeasonalMultiplier[]  // Sparse array of month overrides
  notes: string
}

export interface ForecastSourceOption {
  id: ForecastSource
  label: string
}

export interface ForecastFormProps {
  forecast?: SalesForecast & { source?: ForecastSource; notes?: string }
  products: ProductReference[]
  locations: LocationReference[]
  forecastSources: ForecastSourceOption[]
  onSubmit?: (data: ForecastFormData) => void
  onCancel?: () => void
}

export interface RouteFormData {
  name: string
  fromLocationId: string
  toLocationId: string
  method: ShippingMethod
  transitDays: TransitDays
  costs: RouteCosts
  isDefault: boolean
  notes: string
}

export interface RouteFormProps {
  route?: ShippingRoute
  locations: LocationReference[]
  shippingMethods: ShippingMethodOption[]
  existingRoutes: ShippingRoute[]
  onSubmit?: (data: RouteFormData) => void
  onCancel?: () => void
}

export interface SafetyStockFormData {
  productId: string
  locationId: string
  thresholdType: ThresholdType
  thresholdValue: number
  seasonalMultipliers: SeasonalMultiplier[]
}

export interface SafetyStockFormProps {
  rule?: SafetyStockRule
  products: ProductReference[]
  locations: LocationReference[]
  thresholdTypes: ThresholdTypeOption[]
  onSubmit?: (data: SafetyStockFormData) => void
  onCancel?: () => void
}

export interface SafetyStockViewProps {
  rules: SafetyStockRule[]
  products: ProductReference[]
  locations: LocationReference[]
  thresholdTypes: ThresholdTypeOption[]
  onCreateRule?: () => void
  onEditRule?: (id: string) => void
  onDeleteRule?: (id: string) => void
  onToggleActive?: (id: string, active: boolean) => void
  // Aliases for backward compatibility
  onUpdate?: (id: string, data: Partial<SafetyStockRule>) => void
  onCreate?: () => void
  onDelete?: (id: string) => void
}

// =============================================================================
// Routes View Props
// =============================================================================

export interface RoutesViewProps {
  routes: ShippingRoute[]
  locations: LocationReference[]
  shippingMethods: ShippingMethodOption[]
  onCreateRoute?: () => void
  onEditRoute?: (id: string) => void
  onDeleteRoute?: (id: string) => void
  onSetDefault?: (id: string) => void
  onToggleActive?: (id: string) => void
}
