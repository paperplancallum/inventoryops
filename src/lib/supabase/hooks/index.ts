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

// COGS Module
export { useCOGSSettings } from './useCOGSSettings'
export type {
  COGSSettings,
  COGSSettingsFormData,
} from './useCOGSSettings'

export { useInventoryLosses } from './useInventoryLosses'
export type {
  InventoryLoss,
  InventoryLossFormData,
  InventoryLossSummary,
  InventoryLossFilters,
  InventoryLossType,
  ReimbursementStatus,
  ReimbursementData,
} from './useInventoryLosses'

export { useAmazonFees } from './useAmazonFees'
export type {
  AmazonFee,
  AmazonFeeFormData,
  AmazonFeeSummary,
  AmazonFeeFilters,
  AmazonFeeType,
  FeeAttributionLevel,
} from './useAmazonFees'

export { useAmazonSales } from './useAmazonSales'
export type {
  AmazonOrder,
  AmazonOrderItem,
  SalesBatchAttribution,
  AmazonSalesSummary,
  AmazonSalesFilters,
  AmazonSalesChannel,
  AmazonOrderStatus,
} from './useAmazonSales'

export { useCOGS } from './useCOGS'
export type {
  BatchCOGS,
  MonthlyProductCOGS,
  BatchFIFOReport,
  ProductCOGSCalculation,
  COGSMonthlySummary,
} from './useCOGS'
