import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@/test/test-utils'
import { InventoryIntelligenceView } from '../components/InventoryIntelligenceView'
import { DashboardView } from '../components/DashboardView'
import { SuggestionsView } from '../components/SuggestionsView'
import { UrgencyBadge } from '../components/UrgencyBadge'
import { DaysRemainingBadge } from '../components/DaysRemainingBadge'
import type {
  DashboardSummary,
  ReplenishmentSuggestion,
  SalesForecast,
  ShippingRoute,
  SafetyStockRule,
  IntelligenceSettings,
  UrgencyOption,
  Location,
} from '../types'

// =============================================================================
// Test Data
// =============================================================================

const mockLocations: Location[] = [
  { id: 'loc-wh-1', name: 'Main Warehouse' },
  { id: 'loc-amz-fba', name: 'Amazon FBA US' },
]

const mockUrgencyOptions: UrgencyOption[] = [
  { id: 'critical', label: 'Critical', color: 'red' },
  { id: 'warning', label: 'Warning', color: 'amber' },
  { id: 'planned', label: 'Planned', color: 'blue' },
  { id: 'monitor', label: 'Monitor', color: 'slate' },
]

const mockDashboardSummary: DashboardSummary = {
  totalActiveProducts: 150,
  totalSuggestions: 12,
  urgencyCounts: {
    critical: 3,
    warning: 5,
    planned: 4,
    monitor: 138,
  },
  locationHealth: [
    {
      locationId: 'loc-amz-fba',
      locationName: 'Amazon FBA US',
      locationType: 'amazon_fba',
      totalProducts: 100,
      healthyCount: 90,
      warningCount: 7,
      criticalCount: 3,
      totalValue: 500000,
    },
    {
      locationId: 'loc-wh-1',
      locationName: 'Main Warehouse',
      locationType: 'warehouse',
      totalProducts: 50,
      healthyCount: 48,
      warningCount: 2,
      criticalCount: 0,
      totalValue: 250000,
    },
  ],
  recentlyDismissed: 2,
  recentlySnoozed: 1,
  lastCalculatedAt: '2026-01-15T08:00:00Z',
}

const mockTransferSuggestion: ReplenishmentSuggestion = {
  id: 'sug-001',
  type: 'transfer',
  urgency: 'critical',
  status: 'pending',
  productId: 'prod-123',
  sku: 'WDG-PRO-001',
  productName: 'Widget Pro X',
  destinationLocationId: 'loc-amz-fba',
  destinationLocationName: 'Amazon FBA US',
  currentStock: 150,
  inTransitQuantity: 0,
  reservedQuantity: 10,
  availableStock: 140,
  dailySalesRate: 28,
  weeklySalesRate: 196,
  daysOfStockRemaining: 5,
  stockoutDate: '2026-01-20',
  safetyStockThreshold: 200,
  recommendedQty: 500,
  estimatedArrival: '2026-01-25',
  sourceLocationId: 'loc-wh-1',
  sourceLocationName: 'Main Warehouse',
  sourceAvailableQty: 2000,
  supplierId: null,
  supplierName: null,
  supplierLeadTimeDays: null,
  routeId: 'route-1',
  routeName: 'Standard Ground',
  routeMethod: 'ground',
  routeTransitDays: 5,
  reasoning: [
    { type: 'warning', message: 'Will stock out before safety threshold', value: '5 days' },
    { type: 'calculation', message: 'Daily rate', value: '28 units' },
    { type: 'info', message: 'Warehouse has sufficient stock', value: '2000 units' },
  ],
  generatedAt: '2026-01-15T08:00:00Z',
  snoozedUntil: null,
  dismissedReason: null,
  acceptedAt: null,
  linkedEntityId: null,
  linkedEntityType: null,
}

const mockPOSuggestion: ReplenishmentSuggestion = {
  id: 'sug-002',
  type: 'purchase-order',
  urgency: 'warning',
  status: 'pending',
  productId: 'prod-456',
  sku: 'WDG-MINI-002',
  productName: 'Widget Mini',
  destinationLocationId: 'loc-amz-fba',
  destinationLocationName: 'Amazon FBA US',
  currentStock: 300,
  inTransitQuantity: 100,
  reservedQuantity: 20,
  availableStock: 280,
  dailySalesRate: 25,
  weeklySalesRate: 175,
  daysOfStockRemaining: 11,
  stockoutDate: '2026-01-26',
  safetyStockThreshold: 250,
  recommendedQty: 1000,
  estimatedArrival: '2026-02-15',
  sourceLocationId: null,
  sourceLocationName: null,
  sourceAvailableQty: null,
  supplierId: 'sup-001',
  supplierName: 'Acme Widgets Inc',
  supplierLeadTimeDays: 30,
  routeId: null,
  routeName: null,
  routeMethod: null,
  routeTransitDays: null,
  reasoning: [
    { type: 'warning', message: 'Insufficient warehouse stock for transfer' },
    { type: 'info', message: 'Supplier lead time: 30 days' },
  ],
  generatedAt: '2026-01-15T08:00:00Z',
  snoozedUntil: null,
  dismissedReason: null,
  acceptedAt: null,
  linkedEntityId: null,
  linkedEntityType: null,
}

const mockForecasts: SalesForecast[] = [
  {
    id: 'fc-001',
    productId: 'prod-123',
    sku: 'WDG-PRO-001',
    productName: 'Widget Pro X',
    locationId: 'loc-amz-fba',
    locationName: 'Amazon FBA US',
    dailyRate: 28,
    confidence: 'high',
    accuracyMAPE: 12.5,
    manualOverride: null,
    isEnabled: true,
    lastCalculatedAt: '2026-01-15T08:00:00Z',
    seasonalMultipliers: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.2, 1.5],
    trendRate: 0.02,
    productAdjustments: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-15T08:00:00Z',
  },
]

const mockSettings: IntelligenceSettings = {
  id: 'settings-001',
  urgencyThresholds: {
    criticalDays: 7,
    warningDays: 14,
    plannedDays: 30,
  },
  autoRefreshIntervalMinutes: 60,
  defaultSafetyStockDays: 14,
  includeInTransitInCalculations: true,
  notifyOnCritical: true,
  notifyOnWarning: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-15T08:00:00Z',
}

const mockRoutes: ShippingRoute[] = [
  {
    id: 'route-1',
    name: 'Standard Ground WH to FBA',
    fromLocationId: 'loc-wh-1',
    fromLocationName: 'Main Warehouse',
    toLocationId: 'loc-amz-fba',
    toLocationName: 'Amazon FBA US',
    method: 'ground',
    transitDays: { min: 3, typical: 5, max: 7 },
    costs: { perUnit: 0.5, perKg: null, flatFee: 50, currency: 'USD' },
    isDefault: true,
    isActive: true,
    notes: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

const mockSafetyStockRules: SafetyStockRule[] = [
  {
    id: 'rule-001',
    productId: 'prod-123',
    sku: 'WDG-PRO-001',
    productName: 'Widget Pro X',
    locationId: 'loc-amz-fba',
    locationName: 'Amazon FBA US',
    thresholdType: 'days-of-cover',
    thresholdValue: 14,
    seasonalMultipliers: [],
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

// =============================================================================
// Component Tests: UrgencyBadge
// =============================================================================

describe('UrgencyBadge', () => {
  it('renders critical badge with correct styling', () => {
    render(<UrgencyBadge urgency="critical" />)
    const badge = screen.getByText('Critical')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-red-100')
  })

  it('renders warning badge with correct styling', () => {
    render(<UrgencyBadge urgency="warning" />)
    const badge = screen.getByText('Warning')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-amber-100')
  })

  it('renders planned badge with correct styling', () => {
    render(<UrgencyBadge urgency="planned" />)
    const badge = screen.getByText('Planned')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-indigo-100')
  })

  it('renders monitor badge with correct styling', () => {
    render(<UrgencyBadge urgency="monitor" />)
    const badge = screen.getByText('Monitor')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-slate-100')
  })

  it('supports small size variant', () => {
    render(<UrgencyBadge urgency="critical" size="sm" />)
    const badge = screen.getByText('Critical')
    expect(badge).toHaveClass('text-xs')
  })
})

// =============================================================================
// Component Tests: DaysRemainingBadge
// =============================================================================

describe('DaysRemainingBadge', () => {
  it('shows "Stockout!" for negative days', () => {
    render(<DaysRemainingBadge days={-2} />)
    expect(screen.getByText('Stockout!')).toBeInTheDocument()
  })

  it('shows days remaining for positive values', () => {
    render(<DaysRemainingBadge days={5} />)
    expect(screen.getByText('5 days')).toBeInTheDocument()
  })

  it('shows "1 day" for single day', () => {
    render(<DaysRemainingBadge days={1} />)
    expect(screen.getByText('1 day')).toBeInTheDocument()
  })

  it('handles null days gracefully', () => {
    render(<DaysRemainingBadge days={null} />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('shows critical styling for 0-7 days', () => {
    render(<DaysRemainingBadge days={5} />)
    const badge = screen.getByText('5 days')
    expect(badge).toHaveClass('bg-red-100')
  })

  it('shows warning styling for 8-14 days', () => {
    render(<DaysRemainingBadge days={10} />)
    const badge = screen.getByText('10 days')
    expect(badge).toHaveClass('bg-amber-100')
  })

  it('shows planned styling for 14+ days', () => {
    render(<DaysRemainingBadge days={20} />)
    const badge = screen.getByText('20 days')
    expect(badge).toHaveClass('bg-indigo-100')
  })
})

// =============================================================================
// Component Tests: DashboardView
// =============================================================================

describe('DashboardView', () => {
  const defaultProps = {
    summary: mockDashboardSummary,
    topSuggestions: [mockTransferSuggestion],
    onViewAllSuggestions: vi.fn(),
    onAcceptSuggestion: vi.fn(),
    onRefresh: vi.fn(),
  }

  it('renders summary stat cards', () => {
    render(<DashboardView {...defaultProps} />)

    // Check total SKUs
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('Total SKUs')).toBeInTheDocument()

    // Check critical alerts
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Critical Alerts')).toBeInTheDocument()

    // Check pending actions
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Pending Actions')).toBeInTheDocument()
  })

  it('renders location health cards', () => {
    render(<DashboardView {...defaultProps} />)

    expect(screen.getByText('Amazon FBA US')).toBeInTheDocument()
    expect(screen.getByText('100 products')).toBeInTheDocument()
    expect(screen.getByText('3 critical')).toBeInTheDocument()
  })

  it('renders top urgent suggestions', () => {
    render(<DashboardView {...defaultProps} />)

    expect(screen.getByText('Widget Pro X')).toBeInTheDocument()
    expect(screen.getByText('WDG-PRO-001')).toBeInTheDocument()
    expect(screen.getByText('5 days left')).toBeInTheDocument()
  })

  it('shows empty state when no suggestions', () => {
    render(<DashboardView {...defaultProps} topSuggestions={[]} />)

    expect(screen.getByText(/No pending suggestions. All inventory levels are healthy!/)).toBeInTheDocument()
  })

  it('calls onRefresh when refresh button clicked', () => {
    render(<DashboardView {...defaultProps} />)

    fireEvent.click(screen.getByText('Refresh'))
    expect(defaultProps.onRefresh).toHaveBeenCalled()
  })

  it('calls onViewAllSuggestions when View All clicked', () => {
    render(<DashboardView {...defaultProps} />)

    fireEvent.click(screen.getByText('View all'))
    expect(defaultProps.onViewAllSuggestions).toHaveBeenCalledWith('transfer')
  })

  it('calls onAcceptSuggestion when Accept button clicked', () => {
    render(<DashboardView {...defaultProps} />)

    fireEvent.click(screen.getByText('Accept'))
    expect(defaultProps.onAcceptSuggestion).toHaveBeenCalledWith('sug-001', 'transfer')
  })
})

// =============================================================================
// Component Tests: SuggestionsView
// =============================================================================

describe('SuggestionsView', () => {
  const defaultProps = {
    suggestions: [mockTransferSuggestion, mockPOSuggestion],
    type: 'transfer' as const,
    locations: mockLocations,
    urgencyOptions: mockUrgencyOptions,
    onAccept: vi.fn(),
    onDismiss: vi.fn(),
    onSnooze: vi.fn(),
  }

  it('renders transfer suggestions', () => {
    render(<SuggestionsView {...defaultProps} suggestions={[mockTransferSuggestion]} />)

    expect(screen.getByText('Widget Pro X')).toBeInTheDocument()
    expect(screen.getByText('WDG-PRO-001')).toBeInTheDocument()
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })

  it('renders PO suggestions', () => {
    render(<SuggestionsView {...defaultProps} type="purchase-order" suggestions={[mockPOSuggestion]} />)

    expect(screen.getByText('Widget Mini')).toBeInTheDocument()
    expect(screen.getByText('WDG-MINI-002')).toBeInTheDocument()
    expect(screen.getByText('Warning')).toBeInTheDocument()
  })

  it('shows source location for transfer suggestions', () => {
    render(<SuggestionsView {...defaultProps} suggestions={[mockTransferSuggestion]} />)

    expect(screen.getByText(/Main Warehouse/)).toBeInTheDocument()
  })

  it('shows supplier for PO suggestions', () => {
    render(<SuggestionsView {...defaultProps} type="purchase-order" suggestions={[mockPOSuggestion]} />)

    expect(screen.getByText(/Acme Widgets Inc/)).toBeInTheDocument()
  })

  it('shows empty state when no suggestions', () => {
    render(<SuggestionsView {...defaultProps} suggestions={[]} />)

    expect(screen.getByText(/No transfer suggestions at this time/)).toBeInTheDocument()
  })

  it('filters suggestions by urgency', async () => {
    render(<SuggestionsView {...defaultProps} suggestions={[mockTransferSuggestion]} />)

    // Find and click urgency filter - implementation varies based on your filter component
    // This is a placeholder for the filter interaction
  })
})

// =============================================================================
// Component Tests: InventoryIntelligenceView
// =============================================================================

describe('InventoryIntelligenceView', () => {
  const defaultProps = {
    activeTab: 'dashboard' as const,
    onTabChange: vi.fn(),
    loading: false,
    dashboardSummary: mockDashboardSummary,
    topSuggestions: [mockTransferSuggestion],
    transferSuggestions: [mockTransferSuggestion],
    poSuggestions: [mockPOSuggestion],
    forecasts: mockForecasts,
    accountAdjustments: [],
    settings: mockSettings,
    routes: mockRoutes,
    safetyStockRules: mockSafetyStockRules,
    locations: mockLocations,
  }

  it('renders loading state', () => {
    render(<InventoryIntelligenceView {...defaultProps} loading={true} />)

    expect(screen.getByText('Loading intelligence data...')).toBeInTheDocument()
  })

  it('renders page header', () => {
    render(<InventoryIntelligenceView {...defaultProps} />)

    expect(screen.getByText('Inventory Intelligence')).toBeInTheDocument()
    expect(screen.getByText(/Smart suggestions for transfers/)).toBeInTheDocument()
  })

  it('renders tab navigation', () => {
    render(<InventoryIntelligenceView {...defaultProps} />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Transfer Suggestions')).toBeInTheDocument()
    expect(screen.getByText('PO Suggestions')).toBeInTheDocument()
    expect(screen.getByText('Forecasts')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('shows suggestion counts on tabs', () => {
    render(<InventoryIntelligenceView {...defaultProps} />)

    // Transfer suggestions tab should show count badge
    const transferTab = screen.getByText('Transfer Suggestions')
    expect(transferTab.parentElement).toHaveTextContent('1')
  })

  it('calls onTabChange when tab clicked', () => {
    render(<InventoryIntelligenceView {...defaultProps} />)

    fireEvent.click(screen.getByText('Transfer Suggestions'))
    expect(defaultProps.onTabChange).toHaveBeenCalledWith('transfer-suggestions')
  })

  it('renders dashboard content when dashboard tab active', () => {
    render(<InventoryIntelligenceView {...defaultProps} activeTab="dashboard" />)

    expect(screen.getByText('Total SKUs')).toBeInTheDocument()
    expect(screen.getByText('Critical Alerts')).toBeInTheDocument()
  })

  it('renders suggestions content when suggestions tab active', () => {
    render(<InventoryIntelligenceView {...defaultProps} activeTab="transfer-suggestions" />)

    expect(screen.getByText('Widget Pro X')).toBeInTheDocument()
  })
})

// =============================================================================
// Edge Case Tests
// =============================================================================

describe('Edge Cases', () => {
  it('handles product with zero sales rate', () => {
    const zeroRateSuggestion = {
      ...mockTransferSuggestion,
      dailySalesRate: 0,
      daysOfStockRemaining: null,
    }

    render(
      <SuggestionsView
        suggestions={[zeroRateSuggestion]}
        type="transfer"
        locations={mockLocations}
        urgencyOptions={mockUrgencyOptions}
        onAccept={vi.fn()}
        onDismiss={vi.fn()}
        onSnooze={vi.fn()}
      />
    )

    // Should handle null days remaining gracefully
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('handles suggestion without source location', () => {
    const noSourceSuggestion = {
      ...mockPOSuggestion,
      sourceLocationId: null,
      sourceLocationName: null,
    }

    render(
      <SuggestionsView
        suggestions={[noSourceSuggestion]}
        type="purchase-order"
        locations={mockLocations}
        urgencyOptions={mockUrgencyOptions}
        onAccept={vi.fn()}
        onDismiss={vi.fn()}
        onSnooze={vi.fn()}
      />
    )

    // Should show supplier instead
    expect(screen.getByText(/Acme Widgets Inc/)).toBeInTheDocument()
  })
})

// =============================================================================
// Integration Tests
// =============================================================================

describe('Accept Suggestion Flow', () => {
  it('fires callback with correct data when accepting transfer suggestion', () => {
    const onAccept = vi.fn()

    render(
      <DashboardView
        summary={mockDashboardSummary}
        topSuggestions={[mockTransferSuggestion]}
        onAcceptSuggestion={onAccept}
      />
    )

    fireEvent.click(screen.getByText('Accept'))

    expect(onAccept).toHaveBeenCalledWith('sug-001', 'transfer')
  })
})
