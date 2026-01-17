// Settings Section Types
// Defines Legs & Routes architecture for shipping

// Re-export shared types from inventory-intelligence
export type {
  ShippingMethod,
  TransitDays,
  RouteCosts,
  ShippingMethodOption,
  LocationReference,
} from '../inventory-intelligence/types'

// Import for internal use
import type {
  ShippingMethod,
  TransitDays,
  RouteCosts,
  ShippingMethodOption,
  LocationReference,
} from '../inventory-intelligence/types'

// ============================================================
// LEGS - Individual point-to-point shipping segments
// ============================================================

export type LocationType = 'factory' | 'warehouse' | '3pl' | 'amazon-fba' | 'amazon-awd' | 'port' | 'customs'

export interface RouteLeg {
  id: string
  name: string                    // e.g., "Shenzhen to LA Ocean"
  fromLocationId: string
  fromLocationName: string
  toLocationId: string            // Can be location ID or "type:amazon-fba" for categories
  toLocationName: string          // "Amazon FBA" for category, specific name otherwise
  toLocationType?: LocationType   // Store the type when using a category
  method: ShippingMethod          // sea | air | ground | express | rail
  transitDays: TransitDays        // { min, typical, max }
  costs: RouteCosts               // { perUnit, perKg, flatFee, currency }
  isActive: boolean
  notes: string
  createdAt: string
  updatedAt: string
}

export interface LegFormData {
  name: string
  fromLocationId: string
  toLocationId: string
  method: ShippingMethod
  transitDaysMin: number
  transitDaysTypical: number
  transitDaysMax: number
  costPerUnit: number | null
  costPerKg: number | null
  costFlatFee: number | null
  notes: string
}

export interface LegsViewProps {
  legs: RouteLeg[]
  locations: LocationReference[]
  shippingMethods: ShippingMethodOption[]
  onCreateLeg?: () => void
  onEditLeg?: (id: string) => void
  onDeleteLeg?: (id: string) => void
  onToggleActive?: (id: string) => void
}

export interface LegFormProps {
  leg?: RouteLeg
  locations: LocationReference[]
  shippingMethods: ShippingMethodOption[]
  existingLegs: RouteLeg[]
  onSubmit?: (data: LegFormData) => void
  onCancel?: () => void
}

// ============================================================
// ROUTES - Composed journeys using multiple legs
// ============================================================

export interface ShippingRoute {
  id: string
  name: string                    // e.g., "Standard Ocean via LA"
  legIds: string[]                // Ordered array of leg IDs
  isDefault: boolean              // Default for origin-destination pair
  isActive: boolean
  notes: string
  createdAt: string
  updatedAt: string
}

// Expanded route with resolved leg data (for display)
export interface ShippingRouteExpanded extends ShippingRoute {
  legs: RouteLeg[]
  totalTransitDays: TransitDays   // Computed sum of all leg transit days
  totalCosts: RouteCosts          // Computed sum of all leg costs
  originLocationName: string      // First leg's from location
  destinationLocationName: string // Last leg's to location
}

export interface RouteFormData {
  name: string
  legIds: string[]
  isDefault: boolean
  notes: string
}

export interface RoutesViewProps {
  routes: ShippingRoute[]
  legs: RouteLeg[]                // Needed to expand route details
  onCreateRoute?: () => void
  onEditRoute?: (id: string) => void
  onDeleteRoute?: (id: string) => void
  onSetDefault?: (id: string) => void
  onToggleActive?: (id: string) => void
}

export interface RouteComposerProps {
  route?: ShippingRoute
  legs: RouteLeg[]
  existingRoutes: ShippingRoute[]
  onSubmit?: (data: RouteFormData) => void
  onCancel?: () => void
}

// ============================================================
// AMAZON CONNECTIONS - Seller Central API Access
// ============================================================

export type AmazonRegion = 'NA' | 'EU' | 'FE'

export type AmazonMarketplace =
  // North America
  | 'US' | 'CA' | 'MX' | 'BR'
  // Europe
  | 'UK' | 'DE' | 'FR' | 'IT' | 'ES' | 'NL' | 'SE' | 'PL' | 'BE' | 'TR'
  // Far East
  | 'JP' | 'AU' | 'SG' | 'IN' | 'AE' | 'SA'

export type ConnectionStatus = 'connected' | 'disconnected' | 'expired' | 'pending'

export interface AmazonMarketplaceInfo {
  id: AmazonMarketplace
  name: string
  domain: string
  region: AmazonRegion
}

export const AMAZON_MARKETPLACES: Record<AmazonRegion, AmazonMarketplaceInfo[]> = {
  NA: [
    { id: 'US', name: 'United States', domain: 'amazon.com', region: 'NA' },
    { id: 'CA', name: 'Canada', domain: 'amazon.ca', region: 'NA' },
    { id: 'MX', name: 'Mexico', domain: 'amazon.com.mx', region: 'NA' },
    { id: 'BR', name: 'Brazil', domain: 'amazon.com.br', region: 'NA' },
  ],
  EU: [
    { id: 'UK', name: 'United Kingdom', domain: 'amazon.co.uk', region: 'EU' },
    { id: 'DE', name: 'Germany', domain: 'amazon.de', region: 'EU' },
    { id: 'FR', name: 'France', domain: 'amazon.fr', region: 'EU' },
    { id: 'IT', name: 'Italy', domain: 'amazon.it', region: 'EU' },
    { id: 'ES', name: 'Spain', domain: 'amazon.es', region: 'EU' },
    { id: 'NL', name: 'Netherlands', domain: 'amazon.nl', region: 'EU' },
    { id: 'SE', name: 'Sweden', domain: 'amazon.se', region: 'EU' },
    { id: 'PL', name: 'Poland', domain: 'amazon.pl', region: 'EU' },
    { id: 'BE', name: 'Belgium', domain: 'amazon.com.be', region: 'EU' },
    { id: 'TR', name: 'Turkey', domain: 'amazon.com.tr', region: 'EU' },
  ],
  FE: [
    { id: 'JP', name: 'Japan', domain: 'amazon.co.jp', region: 'FE' },
    { id: 'AU', name: 'Australia', domain: 'amazon.com.au', region: 'FE' },
    { id: 'SG', name: 'Singapore', domain: 'amazon.sg', region: 'FE' },
    { id: 'IN', name: 'India', domain: 'amazon.in', region: 'FE' },
    { id: 'AE', name: 'UAE', domain: 'amazon.ae', region: 'FE' },
    { id: 'SA', name: 'Saudi Arabia', domain: 'amazon.sa', region: 'FE' },
  ],
}

export interface AmazonConnection {
  id: string
  connectionName: string           // User-friendly name, e.g., "Main NA Account"
  region: AmazonRegion
  sellerId: string                 // Amazon Seller ID
  sellerName?: string              // Business name from Amazon
  enabledMarketplaces: AmazonMarketplace[]
  status: ConnectionStatus
  lastSyncAt: string | null
  createdAt: string
  // Note: credentials (refresh_token, client_id, client_secret) are stored
  // securely on the backend and never exposed to the frontend
}

export interface AmazonConnectionFormData {
  connectionName: string
  region: AmazonRegion
  enabledMarketplaces: AmazonMarketplace[]
}

export interface AmazonAccountsViewProps {
  connections: AmazonConnection[]
  onConnect?: () => void           // Initiate OAuth flow
  onRefresh?: (id: string) => void
  onEditMarketplaces?: (id: string) => void
  onDisconnect?: (id: string) => void
}

// ============================================================
// BRANDS - Product Organization
// ============================================================

export interface Brand {
  id: string
  name: string
  description?: string
  logoUrl?: string | null
  status: 'active' | 'inactive'
  /** Amazon connection IDs this brand sells through */
  amazonConnectionIds?: string[]
  productCount?: number            // Computed from catalog
  createdAt: string
  updatedAt?: string
}

export interface BrandFormData {
  name: string
  description?: string
  logoUrl?: string | null
}

export interface BrandsViewProps {
  brands: Brand[]
  amazonConnections?: AmazonConnection[]
  onCreateBrand?: () => void
  onEditBrand?: (id: string) => void
  onArchiveBrand?: (id: string) => void
}

export interface BrandFormProps {
  brand?: Brand
  existingBrands: Brand[]
  onSubmit?: (data: BrandFormData) => void
  onCancel?: () => void
}

// ============================================================
// SETTINGS UI
// ============================================================

export type SettingsTab = 'amazon-accounts' | 'brands' | 'routes' | 'notifications' | 'preferences'

export interface SettingsTabOption {
  id: SettingsTab
  label: string
  description?: string
}

export interface SettingsViewProps {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
  // Amazon Accounts props
  amazonConnections: AmazonConnection[]
  onConnectAmazon?: () => void
  onRefreshConnection?: (id: string) => void
  onEditMarketplaces?: (id: string) => void
  onDisconnectAmazon?: (id: string) => void
  // Brands props
  brands: Brand[]
  onCreateBrand?: () => void
  onEditBrand?: (id: string) => void
  onArchiveBrand?: (id: string) => void
  // Legs props
  legs: RouteLeg[]
  locations: LocationReference[]
  shippingMethods: ShippingMethodOption[]
  onCreateLeg?: () => void
  onEditLeg?: (id: string) => void
  onDeleteLeg?: (id: string) => void
  onToggleLegActive?: (id: string) => void
  // Routes props
  routes: ShippingRoute[]
  onCreateRoute?: () => void
  onEditRoute?: (id: string) => void
  onDeleteRoute?: (id: string) => void
  onSetRouteDefault?: (id: string) => void
  onToggleRouteActive?: (id: string) => void
}

// ============================================================
// UTILITY FUNCTIONS (types for helpers)
// ============================================================

// Helper to compute totals from legs
export function computeRouteTotals(legs: RouteLeg[]): {
  transitDays: TransitDays
  costs: RouteCosts
} {
  const transitDays: TransitDays = {
    min: legs.reduce((sum, leg) => sum + leg.transitDays.min, 0),
    typical: legs.reduce((sum, leg) => sum + leg.transitDays.typical, 0),
    max: legs.reduce((sum, leg) => sum + leg.transitDays.max, 0),
  }

  const costs: RouteCosts = {
    perUnit: legs.reduce((sum, leg) => sum + (leg.costs.perUnit || 0), 0) || null,
    perKg: legs.reduce((sum, leg) => sum + (leg.costs.perKg || 0), 0) || null,
    flatFee: legs.reduce((sum, leg) => sum + (leg.costs.flatFee || 0), 0) || null,
    currency: legs[0]?.costs.currency || 'USD',
  }

  return { transitDays, costs }
}

// Helper to expand a route with its leg data
export function expandRoute(
  route: ShippingRoute,
  allLegs: RouteLeg[]
): ShippingRouteExpanded {
  const legs = route.legIds
    .map(id => allLegs.find(leg => leg.id === id))
    .filter((leg): leg is RouteLeg => leg !== undefined)

  const { transitDays, costs } = computeRouteTotals(legs)

  return {
    ...route,
    legs,
    totalTransitDays: transitDays,
    totalCosts: costs,
    originLocationName: legs[0]?.fromLocationName || '',
    destinationLocationName: legs[legs.length - 1]?.toLocationName || '',
  }
}
