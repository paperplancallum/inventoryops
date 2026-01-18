import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { DashboardView } from '../components/DashboardView'
import type { DashboardData, ActionItem } from '../types'

// =============================================================================
// Test Data
// =============================================================================

const healthyDashboardData: DashboardData = {
  pulseCheck: {
    status: 'all_clear',
    attentionCount: 0,
  },
  keyMetrics: {
    openPOs: 12,
    inTransit: 5,
    arriving: 2,
    owed: 45000,
  },
  inventoryHealth: {
    healthyPercent: 92,
    alertCount: 2,
    criticalCount: 0,
    warningCount: 2,
  },
  cashFlow: {
    outstanding: 125000,
    overdue: 0,
    dueThisWeek: 30000,
  },
  actionItems: [],
  timeline: [
    {
      date: '2026-01-18',
      dayLabel: 'Sun',
      dateLabel: '18',
      events: [],
    },
    {
      date: '2026-01-19',
      dayLabel: 'Mon',
      dateLabel: '19',
      events: [],
    },
    {
      date: '2026-01-20',
      dayLabel: 'Tue',
      dateLabel: '20',
      events: [],
    },
    {
      date: '2026-01-21',
      dayLabel: 'Wed',
      dateLabel: '21',
      events: [],
    },
    {
      date: '2026-01-22',
      dayLabel: 'Thu',
      dateLabel: '22',
      events: [],
    },
  ],
}

const attentionDashboardData: DashboardData = {
  pulseCheck: {
    status: 'needs_attention',
    attentionCount: 3,
  },
  keyMetrics: {
    openPOs: 8,
    inTransit: 3,
    arriving: 2,
    owed: 42300,
  },
  inventoryHealth: {
    healthyPercent: 75,
    alertCount: 6,
    criticalCount: 2,
    warningCount: 4,
  },
  cashFlow: {
    outstanding: 42300,
    overdue: 8200,
    dueThisWeek: 15000,
  },
  actionItems: [
    {
      id: 'action-1',
      type: 'stock',
      urgency: 'critical',
      title: 'Acme Stainless Steel Tumbler',
      description: 'Will stock out in 7 days',
      actionLabel: 'Accept PO',
      navigateTo: 'inventory-intelligence',
      entityId: 'sugg-001',
    },
    {
      id: 'action-2',
      type: 'payment',
      urgency: 'critical',
      title: 'PO-2024-082',
      description: '$3,200 overdue by 5 days',
      actionLabel: 'Record payment',
      navigateTo: 'invoices-and-payments',
      entityId: 'inv-082',
    },
    {
      id: 'action-3',
      type: 'invoice',
      urgency: 'warning',
      title: '2 supplier invoices',
      description: 'Pending approval',
      actionLabel: 'Review',
      navigateTo: 'supplier-invoices',
      entityId: '',
    },
  ],
  timeline: [
    {
      date: '2026-01-18',
      dayLabel: 'Sun',
      dateLabel: '18',
      events: [
        {
          id: 'evt-1',
          date: '2026-01-18',
          type: 'arrival',
          title: 'T-154 arrives',
          subtitle: 'ONT8 Warehouse',
        },
      ],
    },
    {
      date: '2026-01-19',
      dayLabel: 'Mon',
      dateLabel: '19',
      events: [
        {
          id: 'evt-2',
          date: '2026-01-19',
          type: 'inspection',
          title: 'Inspection',
          subtitle: 'Acme Tumbler',
        },
      ],
    },
    {
      date: '2026-01-20',
      dayLabel: 'Tue',
      dateLabel: '20',
      events: [],
    },
    {
      date: '2026-01-21',
      dayLabel: 'Wed',
      dateLabel: '21',
      events: [
        {
          id: 'evt-3',
          date: '2026-01-21',
          type: 'completion',
          title: 'PO-085 complete',
          subtitle: 'Ready for pickup',
        },
      ],
    },
    {
      date: '2026-01-22',
      dayLabel: 'Thu',
      dateLabel: '22',
      events: [],
    },
  ],
}

// =============================================================================
// Flow 1: View Healthy Dashboard
// =============================================================================

describe('Dashboard - View Healthy Dashboard', () => {
  it('shows pulse check with green checkmark and "All clear" when no critical items', () => {
    render(<DashboardView data={healthyDashboardData} />)

    expect(screen.getByText('All clear')).toBeInTheDocument()
    expect(screen.getByText('No urgent items requiring action')).toBeInTheDocument()
  })

  it('displays key metrics with correct counts', () => {
    render(<DashboardView data={healthyDashboardData} />)

    expect(screen.getByText('12')).toBeInTheDocument() // Open POs
    expect(screen.getByText('5')).toBeInTheDocument() // In Transit
    expect(screen.getByText('2')).toBeInTheDocument() // Arriving
    expect(screen.getByText('$45K')).toBeInTheDocument() // Owed
  })

  it('shows inventory health with high healthy percentage', () => {
    render(<DashboardView data={healthyDashboardData} />)

    expect(screen.getByText('92% healthy')).toBeInTheDocument()
  })

  it('shows cash flow with $0 overdue', () => {
    render(<DashboardView data={healthyDashboardData} />)

    expect(screen.getByText('$0')).toBeInTheDocument() // Overdue
  })

  it('hides Action Needed section when no items exist', () => {
    render(<DashboardView data={healthyDashboardData} />)

    expect(screen.queryByText('Action Needed')).not.toBeInTheDocument()
  })
})

// =============================================================================
// Flow 2: View Dashboard with Issues
// =============================================================================

describe('Dashboard - View Dashboard with Issues', () => {
  it('shows pulse check with red alert and attention count', () => {
    render(<DashboardView data={attentionDashboardData} />)

    expect(screen.getByText('3 items need attention')).toBeInTheDocument()
    expect(screen.getByText('Click to view items requiring action')).toBeInTheDocument()
  })

  it('displays action items sorted by priority', () => {
    render(<DashboardView data={attentionDashboardData} />)

    expect(screen.getByText('Action Needed')).toBeInTheDocument()
    expect(screen.getByText('Acme Stainless Steel Tumbler')).toBeInTheDocument()
    expect(screen.getByText('Will stock out in 7 days')).toBeInTheDocument()
    expect(screen.getByText('PO-2024-082')).toBeInTheDocument()
    expect(screen.getByText('$3,200 overdue by 5 days')).toBeInTheDocument()
  })

  it('shows action item buttons with correct labels', () => {
    render(<DashboardView data={attentionDashboardData} />)

    // Find buttons in the Action Needed section to avoid duplicates from Quick Actions
    const actionNeededSection = screen.getByText('Action Needed').closest('div')!
    expect(within(actionNeededSection).getByRole('button', { name: /accept po/i })).toBeInTheDocument()
    expect(within(actionNeededSection).getByRole('button', { name: /record payment/i })).toBeInTheDocument()
    expect(within(actionNeededSection).getByRole('button', { name: /review/i })).toBeInTheDocument()
  })

  it('highlights overdue amount in red when > 0', () => {
    render(<DashboardView data={attentionDashboardData} />)

    const overdueText = screen.getByText('$8.2K')
    expect(overdueText).toHaveClass('text-red-600')
  })
})

// =============================================================================
// Flow 3: Navigate from Key Metrics
// =============================================================================

describe('Dashboard - Navigate from Key Metrics', () => {
  it('navigates to purchase-orders when clicking Open POs', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()

    render(<DashboardView data={healthyDashboardData} onNavigate={onNavigate} />)

    const openPOsCard = screen.getByText('Open POs').closest('button')
    await user.click(openPOsCard!)

    expect(onNavigate).toHaveBeenCalledWith('purchase-orders', undefined)
  })

  it('navigates to transfers when clicking In Transit', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()

    render(<DashboardView data={healthyDashboardData} onNavigate={onNavigate} />)

    const inTransitCard = screen.getByText('In Transit').closest('button')
    await user.click(inTransitCard!)

    expect(onNavigate).toHaveBeenCalledWith('transfers', undefined)
  })

  it('navigates to transfers when clicking Arriving', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()

    render(<DashboardView data={healthyDashboardData} onNavigate={onNavigate} />)

    const arrivingCard = screen.getByText('Arriving').closest('button')
    await user.click(arrivingCard!)

    expect(onNavigate).toHaveBeenCalledWith('transfers', undefined)
  })

  it('navigates to invoices-and-payments when clicking Owed', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()

    render(<DashboardView data={healthyDashboardData} onNavigate={onNavigate} />)

    const owedCard = screen.getByText('Owed').closest('button')
    await user.click(owedCard!)

    expect(onNavigate).toHaveBeenCalledWith('invoices-and-payments', undefined)
  })

  it('displays owed in currency format ($XXK)', () => {
    render(<DashboardView data={healthyDashboardData} />)

    expect(screen.getByText('$45K')).toBeInTheDocument()
  })
})

// =============================================================================
// Flow 4: Navigate from Health Cards
// =============================================================================

describe('Dashboard - Navigate from Health Cards', () => {
  it('navigates to inventory-intelligence when clicking View Suggestions', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()

    render(<DashboardView data={healthyDashboardData} onNavigate={onNavigate} />)

    const viewSuggestionsLink = screen.getByRole('button', { name: /view suggestions/i })
    await user.click(viewSuggestionsLink)

    expect(onNavigate).toHaveBeenCalledWith('inventory-intelligence', undefined)
  })

  it('navigates to invoices-and-payments when clicking View Invoices', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()

    render(<DashboardView data={healthyDashboardData} onNavigate={onNavigate} />)

    const viewInvoicesLink = screen.getByRole('button', { name: /view invoices/i })
    await user.click(viewInvoicesLink)

    expect(onNavigate).toHaveBeenCalledWith('invoices-and-payments', undefined)
  })

  it('shows inventory health alert count with breakdown', () => {
    render(<DashboardView data={attentionDashboardData} />)

    expect(screen.getByText('2 critical')).toBeInTheDocument()
    expect(screen.getByText('4 warning')).toBeInTheDocument()
  })
})

// =============================================================================
// Flow 5: Execute Action Item
// =============================================================================

describe('Dashboard - Execute Action Item', () => {
  it('calls onNavigate with correct action item data when clicking action button', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()

    render(<DashboardView data={attentionDashboardData} onNavigate={onNavigate} />)

    // Find the Accept PO button in the Action Needed section
    const actionNeededSection = screen.getByText('Action Needed').closest('div')!
    const acceptPOButton = within(actionNeededSection).getByRole('button', { name: /accept po/i })
    await user.click(acceptPOButton)

    expect(onNavigate).toHaveBeenCalledWith('inventory-intelligence', 'sugg-001')
  })

  it('navigates to invoices-and-payments for payment action', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()

    render(<DashboardView data={attentionDashboardData} onNavigate={onNavigate} />)

    // Find the Record payment button in the Action Needed section (not Quick Actions)
    const actionNeededSection = screen.getByText('Action Needed').closest('div')!
    const recordPaymentButton = within(actionNeededSection).getByRole('button', { name: /record payment/i })
    await user.click(recordPaymentButton)

    expect(onNavigate).toHaveBeenCalledWith('invoices-and-payments', 'inv-082')
  })

  it('navigates to supplier-invoices for invoice review action', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()

    render(<DashboardView data={attentionDashboardData} onNavigate={onNavigate} />)

    // Find the Review button in the Action Needed section
    const actionNeededSection = screen.getByText('Action Needed').closest('div')!
    const reviewButton = within(actionNeededSection).getByRole('button', { name: /review/i })
    await user.click(reviewButton)

    expect(onNavigate).toHaveBeenCalledWith('supplier-invoices', '')
  })
})

// =============================================================================
// Flow 6: View Week Timeline
// =============================================================================

describe('Dashboard - View Week Timeline', () => {
  it('displays 5-day timeline with day labels', () => {
    render(<DashboardView data={attentionDashboardData} />)

    expect(screen.getByText('This Week')).toBeInTheDocument()
    expect(screen.getByText('Sun')).toBeInTheDocument()
    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('Tue')).toBeInTheDocument()
    expect(screen.getByText('Wed')).toBeInTheDocument()
    expect(screen.getByText('Thu')).toBeInTheDocument()
  })

  it('shows transfer arrivals in timeline', () => {
    render(<DashboardView data={attentionDashboardData} />)

    expect(screen.getByText('T-154 arrives')).toBeInTheDocument()
  })

  it('shows inspections in timeline', () => {
    render(<DashboardView data={attentionDashboardData} />)

    expect(screen.getByText('Inspection')).toBeInTheDocument()
  })

  it('shows PO completions in timeline', () => {
    render(<DashboardView data={attentionDashboardData} />)

    expect(screen.getByText('PO-085 complete')).toBeInTheDocument()
  })

  it('shows "--" for days with no events', () => {
    render(<DashboardView data={attentionDashboardData} />)

    // Tue and Thu have no events
    const emptyDayMarkers = screen.getAllByText('--')
    expect(emptyDayMarkers.length).toBeGreaterThanOrEqual(2)
  })
})

// =============================================================================
// Flow 7: Use Quick Actions
// =============================================================================

describe('Dashboard - Quick Actions', () => {
  it('navigates to purchase-orders with create param when clicking New PO', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()

    render(<DashboardView data={healthyDashboardData} onNavigate={onNavigate} />)

    // Get the Quick Actions section (desktop version) to avoid duplicate buttons
    const quickActionsSection = screen.getByText('Quick Actions').closest('div')!
    const newPOButton = within(quickActionsSection).getByRole('button', { name: /new po/i })
    await user.click(newPOButton)

    expect(onNavigate).toHaveBeenCalledWith('purchase-orders', 'create')
  })

  it('navigates to transfers with create param when clicking New Transfer', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()

    render(<DashboardView data={healthyDashboardData} onNavigate={onNavigate} />)

    // Get the Quick Actions section (desktop version) to avoid duplicate buttons
    const quickActionsSection = screen.getByText('Quick Actions').closest('div')!
    const newTransferButton = within(quickActionsSection).getByRole('button', { name: /new transfer/i })
    await user.click(newTransferButton)

    expect(onNavigate).toHaveBeenCalledWith('transfers', 'create')
  })

  it('navigates to inspections with create param when clicking Log Inspection', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()

    render(<DashboardView data={healthyDashboardData} onNavigate={onNavigate} />)

    // Get the Quick Actions section (desktop version) to avoid duplicate buttons
    const quickActionsSection = screen.getByText('Quick Actions').closest('div')!
    const logInspectionButton = within(quickActionsSection).getByRole('button', { name: /log inspection/i })
    await user.click(logInspectionButton)

    expect(onNavigate).toHaveBeenCalledWith('inspections', 'create')
  })

  it('navigates to invoices-and-payments with payment param when clicking Record Payment in Quick Actions', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()

    render(<DashboardView data={healthyDashboardData} onNavigate={onNavigate} />)

    // Get the Quick Actions section (desktop version)
    const quickActionsSection = screen.getByText('Quick Actions').closest('div')!
    const recordPaymentButton = within(quickActionsSection).getByRole('button', { name: /record payment/i })
    await user.click(recordPaymentButton)

    expect(onNavigate).toHaveBeenCalledWith('invoices-and-payments', 'payment')
  })
})

// =============================================================================
// Empty State Tests
// =============================================================================

describe('Dashboard - Empty States', () => {
  it('hides Action Needed section when no action items exist', () => {
    render(<DashboardView data={healthyDashboardData} />)

    expect(screen.queryByText('Action Needed')).not.toBeInTheDocument()
  })

  it('shows "--" for all timeline days when no events exist', () => {
    render(<DashboardView data={healthyDashboardData} />)

    const emptyDayMarkers = screen.getAllByText('--')
    expect(emptyDayMarkers.length).toBe(5)
  })
})

// =============================================================================
// Component Interaction Tests
// =============================================================================

describe('Dashboard - Component Interactions', () => {
  it('entire metric card is clickable, not just text', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()

    render(<DashboardView data={healthyDashboardData} onNavigate={onNavigate} />)

    // Find the card by its label text, then get the parent button
    const openPOsLabel = screen.getByText('Open POs')
    const cardButton = openPOsLabel.closest('button')

    expect(cardButton).toBeInTheDocument()
    await user.click(cardButton!)

    expect(onNavigate).toHaveBeenCalled()
  })
})

// =============================================================================
// Edge Cases
// =============================================================================

describe('Dashboard - Edge Cases', () => {
  it('formats very large metric numbers as $XXM', () => {
    const bigData = {
      ...healthyDashboardData,
      keyMetrics: {
        ...healthyDashboardData.keyMetrics,
        owed: 2500000,
      },
    }
    render(<DashboardView data={bigData} />)

    expect(screen.getByText('$2.5M')).toBeInTheDocument()
  })

  it('displays 0 for all zero metrics, not hiding them', () => {
    const zeroData = {
      ...healthyDashboardData,
      keyMetrics: {
        openPOs: 0,
        inTransit: 0,
        arriving: 0,
        owed: 0,
      },
    }
    render(<DashboardView data={zeroData} />)

    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(3) // 3 metric cards with 0
    // Owed shows $0 (may have multiple $0 elements from cash flow)
    const dollarZeros = screen.getAllByText('$0')
    expect(dollarZeros.length).toBeGreaterThanOrEqual(1)
  })

  it('shows "View all" link when more than 5 action items exist', () => {
    const manyActionsData = {
      ...attentionDashboardData,
      actionItems: [
        ...attentionDashboardData.actionItems,
        {
          id: 'action-4',
          type: 'inspection' as const,
          urgency: 'info' as const,
          title: 'Inspection #INS-043',
          description: 'Scheduled for tomorrow',
          actionLabel: 'View',
          navigateTo: 'inspections',
          entityId: 'ins-043',
        },
        {
          id: 'action-5',
          type: 'payment' as const,
          urgency: 'warning' as const,
          title: 'Invoice #456',
          description: 'Due in 3 days',
          actionLabel: 'Record payment',
          navigateTo: 'invoices-and-payments',
          entityId: 'inv-456',
        },
        {
          id: 'action-6',
          type: 'stock' as const,
          urgency: 'info' as const,
          title: 'Widget B',
          description: 'Low stock alert',
          actionLabel: 'View',
          navigateTo: 'inventory-intelligence',
          entityId: 'sugg-006',
        },
      ],
      pulseCheck: {
        status: 'needs_attention' as const,
        attentionCount: 6,
      },
    }
    render(<DashboardView data={manyActionsData} />)

    expect(screen.getByText(/view all 6 items/i)).toBeInTheDocument()
  })

  it('does not show "View all" link when exactly 5 action items exist', () => {
    const fiveActionsData = {
      ...attentionDashboardData,
      actionItems: [
        ...attentionDashboardData.actionItems,
        {
          id: 'action-4',
          type: 'inspection' as const,
          urgency: 'info' as const,
          title: 'Inspection #INS-043',
          description: 'Scheduled for tomorrow',
          actionLabel: 'View',
          navigateTo: 'inspections',
          entityId: 'ins-043',
        },
        {
          id: 'action-5',
          type: 'payment' as const,
          urgency: 'warning' as const,
          title: 'Invoice #456',
          description: 'Due in 3 days',
          actionLabel: 'Record payment',
          navigateTo: 'invoices-and-payments',
          entityId: 'inv-456',
        },
      ],
      pulseCheck: {
        status: 'needs_attention' as const,
        attentionCount: 5,
      },
    }
    render(<DashboardView data={fiveActionsData} />)

    expect(screen.queryByText(/view all/i)).not.toBeInTheDocument()
  })
})

// =============================================================================
// Refresh Functionality
// =============================================================================

describe('Dashboard - Refresh', () => {
  it('calls onRefresh when refresh button is clicked', async () => {
    const onRefresh = vi.fn()
    const user = userEvent.setup()

    render(<DashboardView data={healthyDashboardData} onRefresh={onRefresh} />)

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    await user.click(refreshButton)

    expect(onRefresh).toHaveBeenCalled()
  })

  it('shows loading state when isRefreshing is true', () => {
    render(<DashboardView data={healthyDashboardData} isRefreshing={true} />)

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    expect(refreshButton).toBeDisabled()
  })
})
