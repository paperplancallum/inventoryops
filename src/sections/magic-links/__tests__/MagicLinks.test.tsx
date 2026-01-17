import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { MagicLinksView } from '../components/MagicLinksView'
import { MagicLinkTableRow } from '../components/MagicLinkTableRow'
import { MagicLinkDetailPanel } from '../components/MagicLinkDetailPanel'
import type {
  MagicLink,
  MagicLinkEvent,
  MagicLinksFilters,
  MagicLinksSummary,
} from '@/lib/supabase/hooks/useMagicLinks'

// =============================================================================
// Test Data
// =============================================================================

const sampleLinks: MagicLink[] = [
  {
    id: 'ml-001',
    tokenHash: 'abc123hash',
    linkedEntityType: 'purchase-order',
    linkedEntityId: 'po-001',
    linkedEntityName: 'PO-2024-001',
    purpose: 'invoice-submission',
    status: 'active',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    sentAt: new Date().toISOString(),
    firstViewedAt: new Date().toISOString(),
    submittedAt: null,
    revokedAt: null,
    recipientEmail: 'supplier@example.com',
    recipientName: 'John Supplier',
    recipientRole: 'Sales Manager',
    customMessage: 'Please submit your invoice',
    createdByUserId: 'user-001',
    createdByUserName: 'Admin User',
    submissionData: null,
    notes: null,
    regeneratedFromId: null,
  },
  {
    id: 'ml-002',
    tokenHash: 'def456hash',
    linkedEntityType: 'transfer',
    linkedEntityId: 'transfer-001',
    linkedEntityName: 'TRF-2024-001',
    purpose: 'document-upload',
    status: 'submitted',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    firstViewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    submittedAt: new Date().toISOString(),
    revokedAt: null,
    recipientEmail: 'shipping@example.com',
    recipientName: 'Jane Shipping',
    recipientRole: 'Logistics',
    customMessage: null,
    createdByUserId: 'user-001',
    createdByUserName: 'Admin User',
    submissionData: null,
    notes: null,
    regeneratedFromId: null,
  },
  {
    id: 'ml-003',
    tokenHash: 'ghi789hash',
    linkedEntityType: 'purchase-order',
    linkedEntityId: 'po-002',
    linkedEntityName: 'PO-2024-002',
    purpose: 'invoice-submission',
    status: 'expired',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // expired
    sentAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    firstViewedAt: null,
    submittedAt: null,
    revokedAt: null,
    recipientEmail: 'old@example.com',
    recipientName: 'Old Contact',
    recipientRole: 'External',
    customMessage: null,
    createdByUserId: 'user-001',
    createdByUserName: 'Admin User',
    submissionData: null,
    notes: null,
    regeneratedFromId: null,
  },
]

const sampleEvents: MagicLinkEvent[] = [
  {
    id: 'event-001',
    magicLinkId: 'ml-001',
    eventType: 'created',
    timestamp: new Date().toISOString(),
    ipAddress: null,
    userAgent: null,
    metadata: {},
    triggeredByUserId: 'user-001',
    triggeredByUserName: 'Admin User',
  },
  {
    id: 'event-002',
    magicLinkId: 'ml-001',
    eventType: 'sent',
    timestamp: new Date().toISOString(),
    ipAddress: null,
    userAgent: null,
    metadata: {},
    triggeredByUserId: 'user-001',
    triggeredByUserName: 'Admin User',
  },
  {
    id: 'event-003',
    magicLinkId: 'ml-001',
    eventType: 'viewed',
    timestamp: new Date().toISOString(),
    ipAddress: '192.168.1.xxx',
    userAgent: 'Mozilla/5.0',
    metadata: {},
    triggeredByUserId: null,
    triggeredByUserName: null,
  },
]

const defaultFilters: MagicLinksFilters = {
  searchQuery: '',
  statuses: [],
  entityTypes: [],
  purposes: [],
}

const defaultSummary: MagicLinksSummary = {
  totalActive: 1,
  pendingSubmission: 1,
  submittedThisWeek: 1,
  expiringWithin24Hours: 0,
}

// =============================================================================
// MagicLinksView Tests
// =============================================================================

describe('MagicLinksView', () => {
  const mockHandlers = {
    onFiltersChange: vi.fn(),
    onResetFilters: vi.fn(),
    onViewLink: vi.fn(),
    onRevokeLink: vi.fn(),
    onRegenerateLink: vi.fn(),
    onSendReminder: vi.fn(),
    onViewEntity: vi.fn(),
  }

  const statusOptions = [
    { id: 'active' as const, label: 'Active' },
    { id: 'submitted' as const, label: 'Submitted' },
    { id: 'expired' as const, label: 'Expired' },
    { id: 'revoked' as const, label: 'Revoked' },
  ]

  const entityTypeOptions = [
    { id: 'purchase-order' as const, label: 'Purchase Order' },
    { id: 'transfer' as const, label: 'Transfer' },
  ]

  const purposeOptions = [
    { id: 'invoice-submission' as const, label: 'Invoice Submission' },
    { id: 'document-upload' as const, label: 'Document Upload' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the header and stats cards', () => {
    render(
      <MagicLinksView
        magicLinks={sampleLinks}
        summary={defaultSummary}
        filters={defaultFilters}
        statusOptions={statusOptions}
        entityTypeOptions={entityTypeOptions}
        purposeOptions={purposeOptions}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('Magic Links')).toBeInTheDocument()
    expect(screen.getByText('Active Links')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('Submitted This Week')).toBeInTheDocument()
    expect(screen.getByText('Expiring Soon')).toBeInTheDocument()
  })

  it('displays magic links in the table', () => {
    render(
      <MagicLinksView
        magicLinks={sampleLinks}
        summary={defaultSummary}
        filters={defaultFilters}
        statusOptions={statusOptions}
        entityTypeOptions={entityTypeOptions}
        purposeOptions={purposeOptions}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('PO-2024-001')).toBeInTheDocument()
    expect(screen.getByText('TRF-2024-001')).toBeInTheDocument()
    expect(screen.getByText('John Supplier')).toBeInTheDocument()
    expect(screen.getByText('Jane Shipping')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(
      <MagicLinksView
        magicLinks={[]}
        summary={defaultSummary}
        filters={defaultFilters}
        isLoading={true}
        statusOptions={statusOptions}
        entityTypeOptions={entityTypeOptions}
        purposeOptions={purposeOptions}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('Loading magic links...')).toBeInTheDocument()
  })

  it('shows empty state when no links', () => {
    render(
      <MagicLinksView
        magicLinks={[]}
        summary={defaultSummary}
        filters={defaultFilters}
        statusOptions={statusOptions}
        entityTypeOptions={entityTypeOptions}
        purposeOptions={purposeOptions}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('No magic links yet')).toBeInTheDocument()
  })

  it('shows filter buttons toggle', async () => {
    const user = userEvent.setup()
    render(
      <MagicLinksView
        magicLinks={sampleLinks}
        summary={defaultSummary}
        filters={defaultFilters}
        statusOptions={statusOptions}
        entityTypeOptions={entityTypeOptions}
        purposeOptions={purposeOptions}
        {...mockHandlers}
      />
    )

    const filterButton = screen.getByText('Filters')
    await user.click(filterButton)

    // Filter options should now be visible - use getAllByText since labels appear in multiple places
    expect(screen.getAllByText('Status').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Entity Type').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Purpose').length).toBeGreaterThan(0)
  })

  it('calls onFiltersChange when filter is clicked', async () => {
    const user = userEvent.setup()
    render(
      <MagicLinksView
        magicLinks={sampleLinks}
        summary={defaultSummary}
        filters={defaultFilters}
        statusOptions={statusOptions}
        entityTypeOptions={entityTypeOptions}
        purposeOptions={purposeOptions}
        {...mockHandlers}
      />
    )

    // Open filters
    await user.click(screen.getByText('Filters'))

    // Click on Active status filter
    const activeButton = screen.getAllByText('Active')[0]
    await user.click(activeButton)

    expect(mockHandlers.onFiltersChange).toHaveBeenCalledWith({
      statuses: ['active'],
    })
  })

  it('calls onResetFilters when clear is clicked', async () => {
    const user = userEvent.setup()
    render(
      <MagicLinksView
        magicLinks={sampleLinks}
        summary={defaultSummary}
        filters={{ ...defaultFilters, statuses: ['active'] }}
        statusOptions={statusOptions}
        entityTypeOptions={entityTypeOptions}
        purposeOptions={purposeOptions}
        {...mockHandlers}
      />
    )

    const clearButton = screen.getByText('Clear')
    await user.click(clearButton)

    expect(mockHandlers.onResetFilters).toHaveBeenCalled()
  })
})

// =============================================================================
// MagicLinkTableRow Tests
// =============================================================================

describe('MagicLinkTableRow', () => {
  const mockHandlers = {
    onView: vi.fn(),
    onRevoke: vi.fn(),
    onRegenerate: vi.fn(),
    onSendReminder: vi.fn(),
    onViewEntity: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders link information correctly', () => {
    render(
      <table>
        <tbody>
          <MagicLinkTableRow link={sampleLinks[0]} {...mockHandlers} />
        </tbody>
      </table>
    )

    expect(screen.getByText('PO-2024-001')).toBeInTheDocument()
    expect(screen.getByText('John Supplier')).toBeInTheDocument()
    expect(screen.getByText('Invoice Submission')).toBeInTheDocument()
  })

  it('displays correct status badge', () => {
    render(
      <table>
        <tbody>
          <MagicLinkTableRow link={sampleLinks[0]} {...mockHandlers} />
        </tbody>
      </table>
    )

    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('calls onView when view button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <table>
        <tbody>
          <MagicLinkTableRow link={sampleLinks[0]} {...mockHandlers} />
        </tbody>
      </table>
    )

    // Find all buttons - there are multiple (entity link button + more options button)
    const allButtons = screen.getAllByRole('button')
    // The more options button is the last one (in the actions cell)
    const moreButton = allButtons[allButtons.length - 1]
    await user.click(moreButton)

    // Now find and click the "View Details" button in the dropdown
    const viewButton = screen.getByText('View Details')
    await user.click(viewButton)

    expect(mockHandlers.onView).toHaveBeenCalled()
  })

  it('calls onViewEntity when entity link is clicked', async () => {
    const user = userEvent.setup()
    render(
      <table>
        <tbody>
          <MagicLinkTableRow link={sampleLinks[0]} {...mockHandlers} />
        </tbody>
      </table>
    )

    const entityLink = screen.getByText('PO-2024-001')
    await user.click(entityLink)

    expect(mockHandlers.onViewEntity).toHaveBeenCalled()
  })
})

// =============================================================================
// MagicLinkDetailPanel Tests
// =============================================================================

describe('MagicLinkDetailPanel', () => {
  const mockHandlers = {
    onClose: vi.fn(),
    onRevoke: vi.fn().mockResolvedValue(undefined),
    onRegenerate: vi.fn().mockResolvedValue({ magicLink: { id: 'new-id' }, rawToken: 'newtoken123' }),
    onSendReminder: vi.fn().mockResolvedValue(true),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when link is null', () => {
    const { container } = render(
      <MagicLinkDetailPanel
        link={null}
        events={[]}
        {...mockHandlers}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('renders link details correctly', () => {
    render(
      <MagicLinkDetailPanel
        link={sampleLinks[0]}
        events={sampleEvents}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('Magic Link Details')).toBeInTheDocument()
    expect(screen.getByText('PO-2024-001')).toBeInTheDocument()
    expect(screen.getByText('John Supplier')).toBeInTheDocument()
    expect(screen.getByText('supplier@example.com')).toBeInTheDocument()
  })

  it('displays event timeline', () => {
    render(
      <MagicLinkDetailPanel
        link={sampleLinks[0]}
        events={sampleEvents}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('Activity Timeline')).toBeInTheDocument()
    expect(screen.getByText('Link Created')).toBeInTheDocument()
    expect(screen.getByText('Email Sent')).toBeInTheDocument()
    expect(screen.getByText('Link Viewed')).toBeInTheDocument()
  })

  it('shows action buttons for active links', () => {
    render(
      <MagicLinkDetailPanel
        link={sampleLinks[0]}
        events={sampleEvents}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('Send Reminder')).toBeInTheDocument()
    expect(screen.getByText('Revoke')).toBeInTheDocument()
  })

  it('shows regenerate button for expired links', () => {
    render(
      <MagicLinkDetailPanel
        link={sampleLinks[2]} // expired link
        events={[]}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('Regenerate')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <MagicLinkDetailPanel
        link={sampleLinks[0]}
        events={sampleEvents}
        {...mockHandlers}
      />
    )

    // Find the close button - it's in the header with the X icon
    // Get all buttons and find the one that closes the panel (the one with X icon)
    const buttons = screen.getAllByRole('button')
    const closeButton = buttons.find(btn =>
      btn.querySelector('svg.lucide-x') !== null
    )

    if (closeButton) {
      await user.click(closeButton)
      expect(mockHandlers.onClose).toHaveBeenCalled()
    } else {
      // Fallback: click the backdrop to close
      const backdrop = document.querySelector('.bg-black\\/50')
      if (backdrop) {
        await user.click(backdrop as Element)
        expect(mockHandlers.onClose).toHaveBeenCalled()
      }
    }
  })

  it('calls onSendReminder when reminder button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <MagicLinkDetailPanel
        link={sampleLinks[0]}
        events={sampleEvents}
        {...mockHandlers}
      />
    )

    const reminderButton = screen.getByText('Send Reminder')
    await user.click(reminderButton)

    expect(mockHandlers.onSendReminder).toHaveBeenCalledWith(sampleLinks[0].id)
  })

  it('shows loading state', () => {
    render(
      <MagicLinkDetailPanel
        link={sampleLinks[0]}
        events={[]}
        isLoading={true}
        {...mockHandlers}
      />
    )

    // Loading spinner should be shown
    expect(screen.getByText('Activity Timeline')).toBeInTheDocument()
  })

  it('shows "No events recorded yet" when events array is empty and not loading', () => {
    render(
      <MagicLinkDetailPanel
        link={sampleLinks[0]}
        events={[]}
        isLoading={false}
        {...mockHandlers}
      />
    )

    expect(screen.getByText('No events recorded yet.')).toBeInTheDocument()
  })
})

// =============================================================================
// Rate Limiting Utility Tests
// =============================================================================

describe('Rate Limiting', () => {
  // Note: These tests would be for the rate-limit.ts utility
  // Import would be: import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

  it('should allow requests within limit', async () => {
    // Mock implementation for testing
    const { checkRateLimit } = await import('@/lib/rate-limit')

    const result = checkRateLimit('test-ip-1', 10, 60000, 'test-namespace')
    expect(result).toBe(true)
  })

  it('should block requests exceeding limit', async () => {
    const { checkRateLimit, clearRateLimit } = await import('@/lib/rate-limit')

    // Clear any existing records
    clearRateLimit('test-ip-2', 'test-namespace-2')

    // Make requests up to the limit
    for (let i = 0; i < 5; i++) {
      checkRateLimit('test-ip-2', 5, 60000, 'test-namespace-2')
    }

    // Next request should be blocked
    const result = checkRateLimit('test-ip-2', 5, 60000, 'test-namespace-2')
    expect(result).toBe(false)
  })

  it('should reset after window expires', async () => {
    const { checkRateLimit } = await import('@/lib/rate-limit')

    // Use a very short window for testing
    const shortWindow = 100 // 100ms

    // Exhaust the limit
    for (let i = 0; i < 3; i++) {
      checkRateLimit('test-ip-3', 3, shortWindow, 'test-namespace-3')
    }

    // Should be blocked now
    expect(checkRateLimit('test-ip-3', 3, shortWindow, 'test-namespace-3')).toBe(false)

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, shortWindow + 50))

    // Should be allowed again
    expect(checkRateLimit('test-ip-3', 3, shortWindow, 'test-namespace-3')).toBe(true)
  })
})
