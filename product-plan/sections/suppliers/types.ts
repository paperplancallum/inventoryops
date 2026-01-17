// =============================================================================
// Data Types
// =============================================================================

import type { PaymentMilestone, PaymentTermsTemplate } from '../invoices-and-payments/types'

/** Simplified location type for factory selector dropdown */
export interface FactoryLocationOption {
  id: string
  name: string
  city: string
  country: string
}

export interface Supplier {
  id: string
  name: string
  contactName: string
  contactEmail: string
  contactPhone?: string
  country: string
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
  notes?: string
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
  /** Called when user wants to delete a supplier */
  onDeleteSupplier?: (id: string) => void
  /** Called when user wants to add a new supplier */
  onCreateSupplier?: () => void
}

export interface SupplierFormProps {
  /** Existing supplier data for editing, undefined for new */
  supplier?: Supplier
  /** Available payment terms templates */
  paymentTermsTemplates?: PaymentTermsTemplate[]
  /** Available factory locations for linking */
  factoryLocations?: FactoryLocationOption[]
  /** Called when form is submitted */
  onSubmit?: (data: SupplierFormData) => void
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
