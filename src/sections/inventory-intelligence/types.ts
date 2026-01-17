// Re-export types from hooks for convenience
import type {
  ShippingMethod as _ShippingMethod,
  TransitDays as _TransitDays,
  RouteCosts as _RouteCosts,
} from '@/lib/supabase/hooks/useShippingRouteLegs'

export type ShippingMethod = _ShippingMethod
export type TransitDays = _TransitDays
export type RouteCosts = _RouteCosts

import type {
  ShippingRoute as _ShippingRoute,
  ShippingRouteExpanded as _ShippingRouteExpanded,
} from '@/lib/supabase/hooks/useShippingRoutes'

export type ShippingRoute = _ShippingRoute
export type ShippingRouteExpanded = _ShippingRouteExpanded

import type {
  SafetyStockRule as _SafetyStockRule,
  ThresholdType as _ThresholdType,
  SeasonalMultiplier as _SeasonalMultiplier,
} from '@/lib/supabase/hooks/useSafetyStockRules'

export type SafetyStockRule = _SafetyStockRule
export type ThresholdType = _ThresholdType
export type SeasonalMultiplier = _SeasonalMultiplier

export type {
  SalesForecast,
  ConfidenceLevel,
} from '@/lib/supabase/hooks/useSalesForecasts'

import type {
  ReplenishmentSuggestion as _ReplenishmentSuggestion,
  SuggestionType as _SuggestionType,
  SuggestionUrgency as _SuggestionUrgency,
  SuggestionStatus as _SuggestionStatus,
  ReasoningItem as _ReasoningItem,
  ReasoningItemType as _ReasoningItemType,
  UrgencyCounts as _UrgencyCounts,
} from '@/lib/supabase/hooks/useReplenishmentSuggestions'

export type ReplenishmentSuggestion = _ReplenishmentSuggestion
export type SuggestionType = _SuggestionType
export type SuggestionUrgency = _SuggestionUrgency
export type SuggestionStatus = _SuggestionStatus
export type ReasoningItem = _ReasoningItem
export type ReasoningItemType = _ReasoningItemType
export type UrgencyCounts = _UrgencyCounts

export type {
  SalesHistoryEntry,
  SalesHistorySource,
} from '@/lib/supabase/hooks/useSalesHistory'

export type {
  AccountForecastAdjustment,
  ProductForecastAdjustment,
  AdjustmentEffect,
} from '@/lib/supabase/hooks/useForecastAdjustments'

export type {
  IntelligenceSettings,
  UrgencyThresholds,
} from '@/lib/supabase/hooks/useIntelligenceSettings'

export type {
  InventoryNotification,
  NotificationType,
  NotificationStatus,
} from '@/lib/supabase/hooks/useInventoryNotifications'

// View types
export type InventoryIntelligenceTab =
  | 'dashboard'
  | 'transfer-suggestions'
  | 'po-suggestions'
  | 'forecasts'

// Reference types (from other sections)
export interface LocationReference {
  id: string
  name: string
  type: string
}

export interface ProductReference {
  id: string
  sku: string
  name: string
  supplierId?: string
}

export interface SupplierReference {
  id: string
  name: string
  leadTimeDays: number
}

// Dashboard types
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

// Option types for UI
export interface UrgencyOption {
  id: SuggestionUrgency
  label: string
  color: string
}

export interface ShippingMethodOption {
  id: ShippingMethod
  label: string
  icon?: string
}

export interface ThresholdTypeOption {
  id: ThresholdType
  label: string
}

// Prefill data types
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

// Stockout gap metric for PO timeline
export interface StockoutGapMetric {
  stockoutDate: Date | null
  arrivalDate: Date
  gapDays: number
  willStockOut: boolean
  totalLeadTimeDays: number
  projectedStockOnArrival: number
  coverageAfterArrival: number
}

// Component prop types
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

export interface ReasoningListProps {
  items: ReasoningItem[]
}

export interface TransferTimelineProps {
  suggestion: ReplenishmentSuggestion
}

export interface POTimelineProps {
  suggestion: ReplenishmentSuggestion
  routes?: ShippingRouteExpanded[]
}

// Default urgency options
export const URGENCY_OPTIONS: UrgencyOption[] = [
  { id: 'critical', label: 'Critical', color: 'red' },
  { id: 'warning', label: 'Warning', color: 'amber' },
  { id: 'planned', label: 'Planned', color: 'indigo' },
  { id: 'monitor', label: 'Monitor', color: 'slate' },
]

// Default shipping method options
export const SHIPPING_METHOD_OPTIONS: ShippingMethodOption[] = [
  { id: 'sea', label: 'Ocean Freight' },
  { id: 'air', label: 'Air Freight' },
  { id: 'ground', label: 'Ground' },
  { id: 'express', label: 'Express' },
  { id: 'rail', label: 'Rail' },
]

// Default threshold type options
export const THRESHOLD_TYPE_OPTIONS: ThresholdTypeOption[] = [
  { id: 'units', label: 'Units' },
  { id: 'days-of-cover', label: 'Days of Cover' },
]
