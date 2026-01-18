import type { Database } from '@/lib/supabase/database.types'
import type { AmazonConnection } from '@/lib/supabase/hooks/useAmazonConnections'
import type { ShippingLeg, TransitDays, RouteCosts } from '@/lib/supabase/hooks/useShippingLegs'
import type { ShippingRoute, ShippingRouteExpanded } from '@/lib/supabase/hooks/useShippingRoutes'
import type { Brand as BrandBase, BrandFormData as BrandFormDataBase } from '@/lib/supabase/hooks/useBrands'

// Re-export types from hooks for convenience
export type { AmazonConnection } from '@/lib/supabase/hooks/useAmazonConnections'
export type { ShippingLeg, TransitDays, RouteCosts, LegFormData } from '@/lib/supabase/hooks/useShippingLegs'
export type { ShippingRoute, ShippingRouteExpanded, RouteFormData } from '@/lib/supabase/hooks/useShippingRoutes'
export type { BrandFormData as BrandFormDataBase } from '@/lib/supabase/hooks/useBrands'

// Database types
export type LocationType = Database['public']['Enums']['location_type']
export type ShippingMethod = Database['public']['Enums']['shipping_method']
export type AmazonMarketplace = Database['public']['Enums']['amazon_marketplace']
export type AmazonConnectionStatus = Database['public']['Enums']['amazon_connection_status']

// Settings tabs
export type SettingsTab = 'amazon-accounts' | 'brands' | 'routes'

export interface SettingsTabOption {
  id: SettingsTab
  label: string
  description: string
}

// Brand with extended fields for settings (extends hook Brand with UI-specific fields)
export interface Brand extends BrandBase {
  productCount: number
}

export interface BrandFormData extends BrandFormDataBase {
  removeLogo?: boolean
}

// Props interfaces
export interface AmazonAccountsTabProps {
  connections: AmazonConnection[]
  loading?: boolean
  onConnect: () => void
  onRefresh: (id: string) => void
  onEditMarketplaces: (id: string) => void
  onDisconnect: (id: string) => void
}

export interface BrandsTabProps {
  brands: Brand[]
  amazonConnections: AmazonConnection[]
  loading?: boolean
  onCreateBrand: () => void
  onEditBrand: (id: string) => void
  onArchiveBrand: (id: string) => void
}

export interface LegsTabProps {
  legs: ShippingLeg[]
  loading?: boolean
  onCreateLeg: () => void
  onEditLeg: (id: string) => void
  onDeleteLeg: (id: string) => void
  onToggleActive: (id: string) => void
}

export interface RoutesTabProps {
  routes: ShippingRouteExpanded[]
  legs: ShippingLeg[]
  loading?: boolean
  onCreateRoute: () => void
  onEditRoute: (id: string) => void
  onDeleteRoute: (id: string) => void
  onSetDefault: (id: string) => void
  onToggleActive: (id: string) => void
}
