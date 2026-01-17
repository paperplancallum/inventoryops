// =============================================================================
// Core Types
// =============================================================================

/**
 * The type of entity a magic link is associated with.
 * Uses polymorphic approach for flexibility.
 */
export type MagicLinkEntityType = 'purchase-order' | 'transfer'

/**
 * The purpose/intent of the magic link.
 * Determines what the external user can do when they access the link.
 */
export type MagicLinkPurpose =
  | 'invoice-submission'      // Supplier submits invoice with actual costs
  | 'document-upload'         // Shipping partner uploads BOL, POD, insurance docs

/**
 * The current status of a magic link.
 */
export type MagicLinkStatus =
  | 'active'      // Link is valid and can be used
  | 'submitted'   // Form was successfully submitted (terminal)
  | 'expired'     // Link passed its expiration date (terminal)
  | 'revoked'     // Link was manually revoked (terminal)

/**
 * Types of events that can occur on a magic link.
 */
export type MagicLinkEventType =
  | 'created'           // Link was generated
  | 'sent'              // Link was sent via email
  | 'viewed'            // Link was accessed (page loaded)
  | 'form_started'      // User began filling the form
  | 'validation_error'  // Form submission failed validation
  | 'submitted'         // Form was successfully submitted
  | 'expired'           // System marked as expired
  | 'revoked'           // User manually revoked the link
  | 'regenerated'       // New link created to replace this one

// =============================================================================
// Entity Types
// =============================================================================

/**
 * An immutable event record tracking magic link activity.
 */
export interface MagicLinkEvent {
  id: string
  magicLinkId: string
  eventType: MagicLinkEventType
  timestamp: string               // ISO 8601 datetime

  // Request context (captured when event occurs)
  ipAddress: string | null        // Anonymized for privacy
  userAgent: string | null        // Browser/client identification

  // Optional metadata (varies by event type)
  metadata: Record<string, unknown>

  // For 'sent' events: who initiated the send
  triggeredByUserId: string | null
  triggeredByUserName: string | null
}

/**
 * Core magic link entity.
 * Represents a secure, tokenized URL for external stakeholder interaction.
 */
export interface MagicLink {
  id: string

  // Token (stored as hash for security, actual token shown only once)
  tokenHash: string

  // Polymorphic relationship to parent entity
  linkedEntityType: MagicLinkEntityType
  linkedEntityId: string
  linkedEntityName: string        // Denormalized for display (e.g., "PO-2024-0042")

  // Purpose and permissions
  purpose: MagicLinkPurpose

  // Status tracking
  status: MagicLinkStatus

  // Lifecycle timestamps
  createdAt: string               // ISO 8601 datetime
  expiresAt: string               // ISO 8601 datetime

  // Tracking timestamps (derived from events, denormalized for queries)
  sentAt: string | null           // When first sent
  firstViewedAt: string | null    // When first accessed
  submittedAt: string | null      // When form submitted
  revokedAt: string | null        // When revoked (if applicable)

  // External party context
  recipientEmail: string          // Who this link was sent to
  recipientName: string           // Display name for the recipient
  recipientRole: string           // e.g., "Supplier", "Freight Forwarder"

  // Audit trail
  createdByUserId: string
  createdByUserName: string

  // Submission data (populated after submission)
  submissionData: Record<string, unknown> | null

  // The events for this link (for detail views)
  events?: MagicLinkEvent[]

  // Internal notes (not visible to external party)
  notes: string
}

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * Configuration for magic link generation.
 */
export interface MagicLinkConfig {
  purpose: MagicLinkPurpose
  defaultExpirationDays: number
  maxExpirationDays: number
  sendEmailOnCreate: boolean
  reminderDaysBeforeExpiry: number[]
}

export const MAGIC_LINK_CONFIGS: Record<MagicLinkPurpose, MagicLinkConfig> = {
  'invoice-submission': {
    purpose: 'invoice-submission',
    defaultExpirationDays: 30,
    maxExpirationDays: 90,
    sendEmailOnCreate: true,
    reminderDaysBeforeExpiry: [7, 3, 1],
  },
  'document-upload': {
    purpose: 'document-upload',
    defaultExpirationDays: 7,
    maxExpirationDays: 30,
    sendEmailOnCreate: true,
    reminderDaysBeforeExpiry: [2, 1],
  },
}

// =============================================================================
// Component Props
// =============================================================================

export interface MagicLinksViewProps {
  magicLinks: MagicLink[]
  entityTypes: { id: MagicLinkEntityType; label: string }[]
  purposes: { id: MagicLinkPurpose; label: string }[]
  statuses: { id: MagicLinkStatus; label: string }[]
  summary: MagicLinksSummary
  onViewLink?: (id: string) => void
  onRevokeLink?: (id: string) => void
  onRegenerateLink?: (id: string) => void
  onSendReminder?: (id: string) => void
  onViewEntity?: (entityType: MagicLinkEntityType, entityId: string) => void
}

export interface MagicLinksSummary {
  totalActive: number
  pendingSubmission: number       // Sent but not yet submitted
  submittedThisWeek: number
  expiringWithin24Hours: number
}

export interface GenerateMagicLinkModalProps {
  /** Entity type for the link */
  entityType: MagicLinkEntityType
  /** Entity ID */
  entityId: string
  /** Entity display name */
  entityName: string
  /** Purpose of the link */
  purpose: MagicLinkPurpose
  /** Pre-filled recipient email (from supplier/shipping agent) */
  defaultRecipientEmail?: string
  /** Pre-filled recipient name */
  defaultRecipientName?: string
  /** Callback when link is generated */
  onGenerate?: (data: GenerateMagicLinkData) => void
  /** Callback when modal is closed */
  onClose?: () => void
}

export interface GenerateMagicLinkData {
  recipientEmail: string
  recipientName: string
  expirationDays: number
  message?: string
  sendImmediately: boolean
}

export interface MagicLinkDetailProps {
  magicLink: MagicLink
  onClose?: () => void
  onRevoke?: () => void
  onRegenerate?: () => void
  onSendReminder?: () => void
  onViewEntity?: () => void
}

// =============================================================================
// Form Submission Types (for external-facing forms)
// =============================================================================

/**
 * Props for the external-facing invoice submission form.
 * This is what the supplier sees when they click the link.
 */
export interface SupplierInvoiceFormProps {
  purchaseOrder: {
    poNumber: string
    supplierName: string
    orderDate: string
    lineItems: {
      id: string
      sku: string
      productName: string
      quantity: number
      estimatedUnitCost: number
    }[]
    currency: string
    notes: string
  }
  recipientName: string
  expiresAt: string
  onSubmit?: (data: SupplierInvoiceSubmissionData) => void
  isSubmitting?: boolean
  submissionError?: string | null
}

export interface SupplierInvoiceSubmissionData {
  lineItems: {
    lineItemId: string
    submittedUnitCost: number
    notes: string | null
  }[]
  additionalCosts: {
    type: 'handling' | 'rush' | 'tooling' | 'shipping' | 'inspection' | 'other'
    description: string
    amount: number
  }[]
  supplierNotes: string | null
  submittedByName: string
  submittedByEmail: string
}

/**
 * Props for the external-facing document upload form.
 * This is what the shipping partner sees when they click the link.
 */
export interface TransferDocumentFormProps {
  transfer: {
    transferNumber: string
    sourceLocation: string
    destinationLocation: string
    carrier: string
    scheduledDeparture: string
    scheduledArrival: string
    lineItems: {
      sku: string
      productName: string
      quantity: number
    }[]
    notes: string
  }
  requiredDocuments: DocumentRequestType[]
  recipientName: string
  expiresAt: string
  onSubmit?: (data: TransferDocumentSubmissionData) => void
  onUploadFile?: (file: File, type: DocumentRequestType) => Promise<{ url: string }>
  isSubmitting?: boolean
  submissionError?: string | null
}

export type DocumentRequestType =
  | 'bill-of-lading'
  | 'proof-of-delivery'
  | 'insurance-certificate'
  | 'packing-list'
  | 'customs-declaration'
  | 'other'

export interface TransferDocumentSubmissionData {
  documents: {
    type: DocumentRequestType
    fileName: string
    fileUrl: string
    notes: string | null
  }[]
  trackingUpdates?: {
    carrier: string
    trackingNumber: string
    status: string
  }[]
  actualPickupDate?: string
  actualDeliveryDate?: string
  notes: string | null
  submittedByName: string
  submittedByEmail: string
}
