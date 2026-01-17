// =============================================================================
// Location Types
// =============================================================================

export type LocationType =
  | 'factory'
  | 'warehouse'
  | '3pl'
  | 'amazon-fba'
  | 'amazon-awd'
  | 'port'
  | 'customs'

export interface Location {
  id: string
  name: string
  type: LocationType
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  contactName: string
  contactEmail: string
  contactPhone: string
  notes: string
  isActive: boolean
}

// =============================================================================
// Option Types for UI
// =============================================================================

export interface LocationTypeOption {
  id: LocationType
  label: string
}

// =============================================================================
// Component Props
// =============================================================================

export interface LocationsViewProps {
  locations: Location[]
  locationTypes: LocationTypeOption[]
  onViewLocation?: (id: string) => void
  onEditLocation?: (id: string) => void
  onDeleteLocation?: (id: string) => void
  onCreateLocation?: () => void
  onToggleActive?: (id: string) => void
}

export interface LocationDetailProps {
  location: Location
  onEdit?: () => void
  onClose?: () => void
  onToggleActive?: () => void
  onDelete?: () => void
}

/** Simplified supplier info for display in location form */
export interface LinkedSupplierInfo {
  id: string
  name: string
  contactName: string
  country: string
}

export interface LocationFormProps {
  location?: Location
  locationTypes: LocationTypeOption[]
  /** Supplier linked to this factory location (if any) */
  linkedSupplier?: LinkedSupplierInfo
  onSubmit?: (data: LocationFormData) => void
  onCancel?: () => void
}

export interface LocationFormData {
  name: string
  type: LocationType
  address: string
  city: string
  state: string
  country: string
  postalCode: string
  contactName: string
  contactEmail: string
  contactPhone: string
  notes: string
}

export interface LocationCardProps {
  location: Location
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onToggleActive?: () => void
}
