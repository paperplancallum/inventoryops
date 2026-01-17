// =============================================================================
// Data Types
// =============================================================================

import type { POStatus, Attachment, MessageDirection, Supplier, POStatusOption } from '../purchase-orders/types'

export type InboxSourceType = 'purchase-order' | 'shipping-agent'

/** Flattened message with parent context for the Inbox view */
export interface InboxMessage {
  // Message fields
  messageId: string
  direction: MessageDirection
  senderName: string
  senderEmail?: string
  timestamp: string
  content: string
  attachments?: Attachment[]
  isRead: boolean
  isCleared: boolean  // Whether message has been cleared from inbox

  // Source type
  sourceType: InboxSourceType

  // Parent PO context (when sourceType === 'purchase-order')
  poId?: string
  poNumber?: string
  supplierId?: string
  supplierName?: string
  poStatus?: POStatus

  // Parent Shipping Agent context (when sourceType === 'shipping-agent')
  agentId?: string
  agentName?: string
  // Transfer context (when shipping agent message is about a specific transfer)
  transferId?: string
  transferNumber?: string
}

export interface InboxSummary {
  totalMessages: number
  unreadCount: number
  /** Inbound messages without a subsequent outbound reply */
  awaitingReply: number
}


// =============================================================================
// Component Props
// =============================================================================

export interface InboxViewProps {
  /** All messages aggregated from POs */
  messages: InboxMessage[]
  /** Summary statistics */
  summary: InboxSummary
  /** Available suppliers for filtering */
  suppliers: Supplier[]
  /** Available PO status options for filtering */
  poStatuses: POStatusOption[]
  /** Called when user clicks on a PO number to view it */
  onViewPO?: (poId: string) => void
  /** Called when user clicks on a transfer number to view it */
  onViewTransfer?: (transferId: string) => void
  /** Called when user marks a message as read */
  onMarkRead?: (messageId: string) => void
  /** Called when user marks a message as unread */
  onMarkUnread?: (messageId: string) => void
  /** Called when user clears a message from inbox */
  onClearMessage?: (messageId: string) => void
}

export interface InboxRowProps {
  message: InboxMessage
  isExpanded: boolean
  onToggleExpand: () => void
  onViewPO?: () => void
  onViewTransfer?: () => void
  onMarkRead?: () => void
  onMarkUnread?: () => void
  onClear?: () => void
}

export interface InboxSummaryCardsProps {
  summary: InboxSummary
}
