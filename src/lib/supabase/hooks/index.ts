export { useProducts } from './useProducts'
export { useBrands } from './useBrands'
export { useProductSpecSheets } from './useProductSpecSheets'
export { useSuppliers } from './useSuppliers'
export { useLocations } from './useLocations'
export { usePaymentTermsTemplates } from './usePaymentTermsTemplates'
export { usePurchaseOrders } from './usePurchaseOrders'
export { usePOMessages } from './usePOMessages'
export { useSendPO } from './useSendPO'
export { useBatches } from './useBatches'
export { useTransfers } from './useTransfers'
export { useShippingAgents } from './useShippingAgents'
export { useAmazonShipments } from './useAmazonShipments'
export { useShippingQuotes } from './useShippingQuotes'
export { useShippingInvoices } from './useShippingInvoices'
export { useActivityLog } from './useActivityLog'
export type {
  ActivityLogEntry,
  ActivityLogFilters,
  ActivityLogSummary,
  ActivityEntityType,
  ActivityActionType,
  ActivityUser,
  FieldChange,
  ValueType,
  ChangeValue,
  GroupByOption,
  DatePreset,
} from './useActivityLog'

export { useMagicLinks, generateSecureToken, hashToken } from './useMagicLinks'
export type {
  MagicLink,
  MagicLinkEvent,
  MagicLinkEntityType,
  MagicLinkPurpose,
  MagicLinkStatus,
  MagicLinkEventType,
  MagicLinksSummary,
  MagicLinksFilters,
  CreateMagicLinkData,
} from './useMagicLinks'

export { useSupplierInvoiceSubmissions } from './useSupplierInvoiceSubmissions'
export type {
  SupplierInvoiceSubmission,
  SubmissionLineItem,
  SubmissionAdditionalCost,
  SubmissionAttachment,
  SubmissionReviewStatus,
  AdditionalCostType,
  SubmissionsSummary,
} from './useSupplierInvoiceSubmissions'

export { useInvoices } from './useInvoices'

export { useBOMs } from './useBOMs'
export type {
  BOM,
  BOMLineItem,
  BOMFormData,
  ComponentUsage,
  ProductType,
} from './useBOMs'

export { useWorkOrders, canTransitionTo, getAvailableTransitions } from './useWorkOrders'
export type {
  WorkOrder,
  WorkOrderComponent,
  WorkOrderCost,
  WorkOrderStatusHistory,
  WorkOrderFormData,
  WorkOrdersByStatus,
  WorkOrderStatus,
  WorkOrderCostType,
  AvailableComponentStock,
} from './useWorkOrders'

// Inventory Intelligence hooks
export { useShippingRouteLegs } from './useShippingRouteLegs'
export type {
  ShippingRouteLeg,
  ShippingRouteLegInsert,
  ShippingMethod,
  TransitDays,
  RouteCosts,
} from './useShippingRouteLegs'

export { useShippingRoutes } from './useShippingRoutes'
export type {
  ShippingRoute,
  ShippingRouteExpanded,
  ShippingRouteInsert,
} from './useShippingRoutes'

export { useSafetyStockRules } from './useSafetyStockRules'
export type {
  SafetyStockRule,
  SafetyStockRuleInsert,
  ThresholdType,
  SeasonalMultiplier,
} from './useSafetyStockRules'

export { useSalesForecasts } from './useSalesForecasts'
export type {
  SalesForecast,
  SalesForecastInsert,
  ConfidenceLevel,
} from './useSalesForecasts'

export { useReplenishmentSuggestions } from './useReplenishmentSuggestions'
export type {
  ReplenishmentSuggestion,
  SuggestionType,
  SuggestionUrgency,
  SuggestionStatus,
  ReasoningItem,
  ReasoningItemType,
  UrgencyCounts,
  SuggestionFilters,
} from './useReplenishmentSuggestions'

export { useSalesHistory } from './useSalesHistory'
export type {
  SalesHistoryEntry,
  SalesHistoryInsert,
  SalesHistorySource,
  SalesHistoryFilters,
} from './useSalesHistory'

export { useForecastAdjustments } from './useForecastAdjustments'
export type {
  AccountForecastAdjustment,
  ProductForecastAdjustment,
  AccountAdjustmentInsert,
  ProductAdjustmentInsert,
  AdjustmentEffect,
} from './useForecastAdjustments'

export { useIntelligenceSettings } from './useIntelligenceSettings'
export type {
  IntelligenceSettings,
  IntelligenceSettingsUpdate,
  UrgencyThresholds,
} from './useIntelligenceSettings'

export { useInventoryNotifications } from './useInventoryNotifications'
export type {
  InventoryNotification,
  NotificationInsert,
  NotificationType,
  NotificationStatus,
} from './useInventoryNotifications'
