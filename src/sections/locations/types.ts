// =============================================================================
// Location Types
// Uses database enum values (amazon_fba, amazon_awd with underscores)
// =============================================================================

export type LocationType =
  | 'factory'
  | 'warehouse'
  | '3pl'
  | 'amazon_fba'
  | 'amazon_awd'
  | 'port'
  | 'customs'

export interface Location {
  id: string
  name: string
  type: LocationType
  addressLine1?: string
  addressLine2?: string
  city?: string
  stateProvince?: string
  postalCode?: string
  country: string
  countryCode?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  isActive: boolean
  notes?: string
  createdAt: string
  updatedAt: string
  // Reverse lookup: which supplier owns this factory
  ownerSupplier?: {
    id: string
    name: string
  }
}

// =============================================================================
// Option Types for UI
// =============================================================================

export interface LocationTypeOption {
  id: LocationType
  label: string
  color: string
}

export const LOCATION_TYPES: LocationTypeOption[] = [
  { id: 'factory', label: 'Factory', color: 'orange' },
  { id: 'warehouse', label: 'Warehouse', color: 'blue' },
  { id: '3pl', label: '3PL', color: 'purple' },
  { id: 'amazon_fba', label: 'Amazon FBA', color: 'amber' },
  { id: 'amazon_awd', label: 'Amazon AWD', color: 'yellow' },
  { id: 'port', label: 'Port', color: 'cyan' },
  { id: 'customs', label: 'Customs', color: 'slate' },
]

export const TYPE_COLORS: Record<LocationType, string> = {
  factory: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  warehouse: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  '3pl': 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  amazon_fba: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  amazon_awd: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
  port: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
  customs: 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300',
}

// =============================================================================
// Component Props
// =============================================================================

export interface LocationsViewProps {
  locations: Location[]
  locationTypes?: LocationTypeOption[]
  onViewLocation?: (id: string) => void
  onEditLocation?: (id: string) => void
  onArchiveLocation?: (id: string) => void
  onUnarchiveLocation?: (id: string, confirmName: string) => void
  onCreateLocation?: () => void
  onRefresh?: () => void
  loading?: boolean
}

export interface LocationDetailProps {
  location: Location
  onEdit?: () => void
  onClose?: () => void
  onArchive?: () => void
  onUnarchive?: (confirmName: string) => void
}

export interface LocationFormProps {
  location?: Location
  locationTypes?: LocationTypeOption[]
  onSubmit?: (data: LocationFormData) => void | Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
}

export interface LocationFormData {
  name: string
  type: LocationType
  addressLine1: string
  addressLine2: string
  city: string
  stateProvince: string
  country: string
  countryCode: string
  postalCode: string
  contactName: string
  contactEmail: string
  contactPhone: string
  notes: string
}

export interface ArchiveConfirmationDialogProps {
  isOpen: boolean
  locationName: string
  onConfirm: (confirmName: string) => void
  onCancel: () => void
  isArchiving?: boolean // true for archive, false for unarchive
}

// =============================================================================
// Location References (for checking before archiving)
// =============================================================================

export interface LocationReferences {
  stockLedgerEntries: number
  suppliers: number
  hasReferences: boolean
}
