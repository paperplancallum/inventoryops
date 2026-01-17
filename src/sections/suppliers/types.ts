// =============================================================================
// Payment Types (for suppliers payment terms)
// =============================================================================

export type PaymentMilestoneTrigger =
  | 'po_confirmed'
  | 'inspection_passed'
  | 'customs_cleared'
  | 'shipment_departed'
  | 'goods_received'
  | 'manual'
  | 'upfront'

export interface PaymentMilestone {
  id: string
  name: string
  percentage: number
  trigger: PaymentMilestoneTrigger
  offsetDays: number
}

export interface PaymentTermsTemplate {
  id: string
  name: string
  description: string
  milestones: PaymentMilestone[]
  isActive: boolean
}

// =============================================================================
// Location Types
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

/** Simplified location type for factory selector dropdown */
export interface FactoryLocationOption {
  id: string
  name: string
  city: string
  country: string
}

// =============================================================================
// Supplier Types
// =============================================================================

export type SupplierStatus = 'active' | 'inactive' | 'archived'

export interface Supplier {
  id: string
  name: string
  contactName: string
  contactEmail: string
  contactPhone?: string
  country: string
  countryCode?: string
  productCount: number
  leadTimeDays: number
  /** Legacy payment terms string for display */
  paymentTerms: string
  /** ID of the payment terms template to use */
  paymentTermsTemplateId?: string
  /** Custom payment milestones (overrides template if provided) */
  customPaymentMilestones?: PaymentMilestone[]
  /** Reference to the factory Location where this supplier manufactures */
  factoryLocationId?: string
  status: SupplierStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

// =============================================================================
// Component Props
// =============================================================================

export interface SuppliersViewProps {
  /** List of suppliers to display */
  suppliers: Supplier[]
  /** Called when user clicks on a supplier to view details */
  onViewSupplier?: (id: string) => void
  /** Called when user wants to edit a supplier */
  onEditSupplier?: (id: string) => void
  /** Called when user wants to delete/archive a supplier */
  onDeleteSupplier?: (id: string) => void
  /** Called when user wants to add a new supplier */
  onCreateSupplier?: () => void
  /** Called to refresh data */
  onRefresh?: () => void
  /** Loading state */
  loading?: boolean
}

export interface SupplierFormProps {
  /** Existing supplier data for editing, undefined for new */
  supplier?: Supplier
  /** Available payment terms templates */
  paymentTermsTemplates?: PaymentTermsTemplate[]
  /** Available factory locations for linking */
  factoryLocations?: FactoryLocationOption[]
  /** Called when form is submitted */
  onSubmit?: (data: SupplierFormData) => void | Promise<void>
  /** Called when form is cancelled */
  onCancel?: () => void
}

export interface SupplierFormData {
  name: string
  contactName: string
  contactEmail: string
  contactPhone: string
  country: string
  leadTimeDays: number
  paymentTerms: string
  paymentTermsTemplateId?: string
  customPaymentMilestones?: PaymentMilestone[]
  factoryLocationId?: string
  /** For new suppliers: auto-create a factory location */
  createFactoryLocation?: boolean
  notes: string
}
