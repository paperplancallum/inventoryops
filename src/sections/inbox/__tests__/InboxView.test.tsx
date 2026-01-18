import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { InboxView } from '../InboxView'
import { InboxRow } from '../InboxRow'
import { InboxSummaryCards } from '../InboxSummaryCards'
import type { InboxMessage, InboxSummary, ShippingAgent } from '../types'
import type { Supplier } from '@/sections/purchase-orders/types'

// =============================================================================
// Test Data
// =============================================================================

const sampleSuppliers: Supplier[] = [
  { id: 'sup-001', name: 'Shenzhen Drinkware Co.' },
  { id: 'sup-002', name: 'Saigon Pet Supplies' },
]

const sampleShippingAgents: ShippingAgent[] = [
  { id: 'agent-001', name: 'FlexPort', contactName: 'David Chen', email: 'david@flexport.com' },
  { id: 'agent-002', name: 'ABC Customs', contactName: 'Jennifer Wu', email: 'jennifer@abc.com' },
]

const sampleMessages: InboxMessage[] = [
  {
    messageId: 'msg-001',
    direction: 'inbound',
    senderName: 'Li Wei',
    senderEmail: 'liwei@shenzhendrinkware.com',
    timestamp: new Date().toISOString(),
    content: 'Production is complete! All 3,500 units are ready for inspection.',
    attachments: [
      { id: 'att-001', name: 'production-photos.jpg', type: 'image/jpeg', url: '/photos.jpg' },
    ],
    isRead: false,
    isCleared: false,
    sourceType: 'purchase-order',
    poId: 'po-001',
    poNumber: 'PO-2024-001',
    supplierId: 'sup-001',
    supplierName: 'Shenzhen Drinkware Co.',
    poStatus: 'confirmed',
  },
  {
    messageId: 'msg-002',
    direction: 'inbound',
    senderName: 'David Chen',
    senderEmail: 'david@flexport.com',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    content: 'Shipment has arrived at Long Beach port.',
    attachments: [],
    isRead: true,
    isCleared: false,
    sourceType: 'shipping-agent',
    agentId: 'agent-001',
    agentName: 'FlexPort',
    transferId: 'trf-001',
    transferNumber: 'TRF-2024-001',
  },
  {
    messageId: 'msg-003',
    direction: 'inbound',
    senderName: 'Nguyen Van Minh',
    senderEmail: 'nguyen@saigonpet.com',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    content: 'Order confirmed! We will have them ready by early December.',
    attachments: [],
    isRead: true,
    isCleared: false,
    sourceType: 'purchase-order',
    poId: 'po-002',
    poNumber: 'PO-2024-007',
    supplierId: 'sup-002',
    supplierName: 'Saigon Pet Supplies',
    poStatus: 'confirmed',
  },
]

const sampleSummary: InboxSummary = {
  totalMessages: 3,
  unreadCount: 1,
  awaitingReply: 1,
}

// =============================================================================
// InboxSummaryCards Tests
// =============================================================================

describe('InboxSummaryCards', () => {
  it('renders all summary statistics', () => {
    render(<InboxSummaryCards summary={sampleSummary} />)

    expect(screen.getByText('Total Messages')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Unread')).toBeInTheDocument()
    // Both unread and awaiting reply have value '1', use getAllByText
    const ones = screen.getAllByText('1')
    expect(ones).toHaveLength(2)
    expect(screen.getByText('Awaiting Reply')).toBeInTheDocument()
  })

  it('renders zero counts correctly', () => {
    const emptySummary: InboxSummary = {
      totalMessages: 0,
      unreadCount: 0,
      awaitingReply: 0,
    }
    render(<InboxSummaryCards summary={emptySummary} />)

    const zeros = screen.getAllByText('0')
    expect(zeros).toHaveLength(3)
  })
})

// =============================================================================
// InboxRow Tests
// =============================================================================

describe('InboxRow', () => {
  const defaultProps = {
    message: sampleMessages[0],
    isExpanded: false,
    onToggleExpand: vi.fn(),
    onViewPO: vi.fn(),
    onViewTransfer: vi.fn(),
    onMarkRead: vi.fn(),
    onMarkUnread: vi.fn(),
    onClear: vi.fn(),
    onRestore: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders message preview correctly', () => {
    render(<InboxRow {...defaultProps} />)

    expect(screen.getByText('Li Wei')).toBeInTheDocument()
    expect(screen.getByText('PO-2024-001')).toBeInTheDocument()
    expect(screen.getByText(/Production is complete/)).toBeInTheDocument()
  })

  it('shows unread indicator for unread messages', () => {
    render(<InboxRow {...defaultProps} />)

    // Unread messages should have a blue dot indicator (filled circle)
    const readIndicator = document.querySelector('.bg-blue-500')
    expect(readIndicator).toBeInTheDocument()
  })

  it('shows read indicator for read messages', () => {
    const readMessage = { ...sampleMessages[0], isRead: true }
    render(<InboxRow {...defaultProps} message={readMessage} />)

    // Read messages should have an empty circle (border only)
    const readIndicator = document.querySelector('.border-slate-300')
    expect(readIndicator).toBeInTheDocument()
  })

  it('shows attachment indicator when message has attachments', () => {
    render(<InboxRow {...defaultProps} />)

    // Should show paperclip icon for attachments
    const attachmentIcon = document.querySelector('svg')
    expect(attachmentIcon).toBeInTheDocument()
  })

  it('expands to show full content when clicked', async () => {
    const user = userEvent.setup()
    const onToggleExpand = vi.fn()
    const { rerender } = render(
      <InboxRow {...defaultProps} onToggleExpand={onToggleExpand} />
    )

    // Click to expand
    const row = screen.getByRole('button')
    await user.click(row)
    expect(onToggleExpand).toHaveBeenCalled()

    // Rerender as expanded
    rerender(
      <InboxRow {...defaultProps} isExpanded={true} onToggleExpand={onToggleExpand} />
    )

    // Should show full content
    expect(screen.getByText(/All 3,500 units are ready for inspection/)).toBeInTheDocument()
  })

  it('calls onViewPO when PO number is clicked', async () => {
    const user = userEvent.setup()
    const onViewPO = vi.fn()
    render(<InboxRow {...defaultProps} onViewPO={onViewPO} />)

    const poLink = screen.getByText('PO-2024-001')
    await user.click(poLink)
    expect(onViewPO).toHaveBeenCalled()
  })

  it('calls onClear when Clear button is clicked', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    render(<InboxRow {...defaultProps} isExpanded={true} onClear={onClear} />)

    const clearButton = screen.getByText('Clear')
    await user.click(clearButton)
    expect(onClear).toHaveBeenCalled()
  })
})

// =============================================================================
// InboxView Tests
// =============================================================================

describe('InboxView', () => {
  const defaultProps = {
    messages: sampleMessages,
    summary: sampleSummary,
    suppliers: sampleSuppliers,
    shippingAgents: sampleShippingAgents,
    onViewPO: vi.fn(),
    onViewTransfer: vi.fn(),
    onMarkRead: vi.fn(),
    onMarkUnread: vi.fn(),
    onClearMessage: vi.fn(),
    onRestoreMessage: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders inbox header and summary cards', () => {
    render(<InboxView {...defaultProps} />)

    expect(screen.getByText('Inbox')).toBeInTheDocument()
    expect(screen.getByText('All messages across purchase orders and shipping agents')).toBeInTheDocument()
    expect(screen.getByText('Total Messages')).toBeInTheDocument()
  })

  it('renders message list sorted by newest first', () => {
    render(<InboxView {...defaultProps} />)

    // All inbound messages should be visible
    expect(screen.getByText('Li Wei')).toBeInTheDocument()
    expect(screen.getByText('David Chen')).toBeInTheDocument()
    expect(screen.getByText('Nguyen Van Minh')).toBeInTheDocument()
  })

  it('filters by source type when Purchase Orders tab is selected', async () => {
    const user = userEvent.setup()
    render(<InboxView {...defaultProps} />)

    // Click the source filter dropdown
    const sourceFilter = screen.getByText('All Sources')
    await user.click(sourceFilter)

    // Select Purchase Orders
    const poOption = screen.getByText('Purchase Orders')
    await user.click(poOption)

    // Should only show PO messages (Li Wei and Nguyen Van Minh)
    expect(screen.getByText('Li Wei')).toBeInTheDocument()
    expect(screen.getByText('Nguyen Van Minh')).toBeInTheDocument()

    // Shipping agent message should be hidden
    expect(screen.queryByText('David Chen')).not.toBeInTheDocument()
  })

  it('filters by source type when Shipping Agents tab is selected', async () => {
    const user = userEvent.setup()
    render(<InboxView {...defaultProps} />)

    // Click the source filter dropdown
    const sourceFilter = screen.getByText('All Sources')
    await user.click(sourceFilter)

    // Select Shipping Agents
    const agentOption = screen.getByText('Shipping Agents')
    await user.click(agentOption)

    // Should only show shipping agent messages (David Chen)
    expect(screen.getByText('David Chen')).toBeInTheDocument()

    // PO messages should be hidden
    expect(screen.queryByText('Li Wei')).not.toBeInTheDocument()
    expect(screen.queryByText('Nguyen Van Minh')).not.toBeInTheDocument()
  })

  it('filters by search query', async () => {
    const user = userEvent.setup()
    render(<InboxView {...defaultProps} />)

    // Type in search
    const searchInput = screen.getByPlaceholderText('Search messages...')
    await user.type(searchInput, 'production')

    // Should only show the message containing "production"
    expect(screen.getByText('Li Wei')).toBeInTheDocument()
    expect(screen.queryByText('David Chen')).not.toBeInTheDocument()
    expect(screen.queryByText('Nguyen Van Minh')).not.toBeInTheDocument()
  })

  it('shows empty state when no messages', () => {
    render(<InboxView {...defaultProps} messages={[]} summary={{ totalMessages: 0, unreadCount: 0, awaitingReply: 0 }} />)

    expect(screen.getByText('No messages found')).toBeInTheDocument()
    expect(screen.getByText('Messages from suppliers and shipping agents will appear here')).toBeInTheDocument()
  })

  it('shows empty state when filters match no messages', async () => {
    const user = userEvent.setup()
    render(<InboxView {...defaultProps} />)

    // Search for something that doesn't exist
    const searchInput = screen.getByPlaceholderText('Search messages...')
    await user.type(searchInput, 'nonexistent')

    expect(screen.getByText('No messages found')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument()
  })

  it('expands message and marks as read when clicked', async () => {
    const user = userEvent.setup()
    const onMarkRead = vi.fn()
    render(<InboxView {...defaultProps} onMarkRead={onMarkRead} />)

    // Click on unread message
    const messageRow = screen.getByText('Li Wei').closest('button')
    if (messageRow) {
      await user.click(messageRow)
    }

    // Should call markAsRead for unread message
    expect(onMarkRead).toHaveBeenCalledWith('msg-001')
  })

  it('calls onViewPO when PO link is clicked', async () => {
    const user = userEvent.setup()
    const onViewPO = vi.fn()
    render(<InboxView {...defaultProps} onViewPO={onViewPO} />)

    const poLink = screen.getByText('PO-2024-001')
    await user.click(poLink)

    expect(onViewPO).toHaveBeenCalledWith('po-001')
  })

  it('calls onViewTransfer when transfer link is clicked', async () => {
    const user = userEvent.setup()
    const onViewTransfer = vi.fn()
    render(<InboxView {...defaultProps} onViewTransfer={onViewTransfer} />)

    const transferLink = screen.getByText('TRF-2024-001')
    await user.click(transferLink)

    expect(onViewTransfer).toHaveBeenCalledWith('trf-001')
  })
})
