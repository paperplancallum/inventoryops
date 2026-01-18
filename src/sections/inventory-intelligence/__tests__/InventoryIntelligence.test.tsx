import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/test-utils'
import { UrgencyBadge } from '../components/UrgencyBadge'
import { DaysRemainingBadge } from '../components/DaysRemainingBadge'
import { StockIndicator } from '../components/StockIndicator'
import { ReasoningList } from '../components/ReasoningList'
import { SuggestionsView } from '../components/SuggestionsView'
import { DashboardView } from '../components/DashboardView'
import { ForecastsView } from '../components/ForecastsView'
import {
  sampleReasoningItems,
  sampleTransferSuggestion,
  samplePOSuggestion,
  sampleSuggestions,
  sampleLocations,
  sampleUrgencyOptions,
  sampleDashboardSummary,
  sampleSalesForecasts,
  sampleSalesHistory,
} from './fixtures'

// =============================================================================
// UrgencyBadge Tests
// =============================================================================

describe('Inventory Intelligence - UrgencyBadge', () => {
  it('renders critical urgency with correct styling', () => {
    render(<UrgencyBadge urgency="critical" />)

    const badge = screen.getByText('Critical')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('text-red-700')
  })

  it('renders warning urgency with correct styling', () => {
    render(<UrgencyBadge urgency="warning" />)

    const badge = screen.getByText('Warning')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('text-amber-700')
  })

  it('renders planned urgency with correct styling', () => {
    render(<UrgencyBadge urgency="planned" />)

    const badge = screen.getByText('Planned')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('text-indigo-700')
  })

  it('renders monitor urgency with correct styling', () => {
    render(<UrgencyBadge urgency="monitor" />)

    const badge = screen.getByText('Monitor')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('text-slate-700')
  })

  it('applies small size class', () => {
    render(<UrgencyBadge urgency="critical" size="sm" />)

    const badge = screen.getByText('Critical')
    expect(badge).toHaveClass('text-xs')
    expect(badge).toHaveClass('px-1.5')
  })

  it('applies large size class', () => {
    render(<UrgencyBadge urgency="critical" size="lg" />)

    const badge = screen.getByText('Critical')
    expect(badge).toHaveClass('text-sm')
    expect(badge).toHaveClass('px-2.5')
  })

  it('capitalizes urgency label', () => {
    render(<UrgencyBadge urgency="critical" />)
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })

  it('includes indicator dot', () => {
    const { container } = render(<UrgencyBadge urgency="critical" />)

    const dot = container.querySelector('.rounded-full.h-1\\.5')
    expect(dot).toBeInTheDocument()
    expect(dot).toHaveClass('bg-red-500')
  })
})

// =============================================================================
// DaysRemainingBadge Tests
// =============================================================================

describe('Inventory Intelligence - DaysRemainingBadge', () => {
  it('displays days remaining', () => {
    render(<DaysRemainingBadge days={12} />)

    expect(screen.getByText('12 days')).toBeInTheDocument()
  })

  it('shows stockout date when provided', () => {
    render(<DaysRemainingBadge days={5} stockoutDate="2024-02-15" />)

    expect(screen.getByText('5 days')).toBeInTheDocument()
    expect(screen.getByText(/Stockout:/)).toBeInTheDocument()
    expect(screen.getByText(/Feb 15/)).toBeInTheDocument()
  })

  it('applies critical styling for days < 7', () => {
    render(<DaysRemainingBadge days={3} />)

    const badge = screen.getByText('3 days')
    expect(badge).toHaveClass('bg-red-100')
    expect(badge).toHaveClass('text-red-700')
  })

  it('applies warning styling for days 7-13', () => {
    render(<DaysRemainingBadge days={10} />)

    const badge = screen.getByText('10 days')
    expect(badge).toHaveClass('bg-amber-100')
    expect(badge).toHaveClass('text-amber-700')
  })

  it('applies planned styling for days >= 14', () => {
    render(<DaysRemainingBadge days={20} />)

    const badge = screen.getByText('20 days')
    expect(badge).toHaveClass('bg-indigo-100')
    expect(badge).toHaveClass('text-indigo-700')
  })

  it('uses explicit urgency over days-based calculation', () => {
    render(<DaysRemainingBadge days={3} urgency="monitor" />)

    const badge = screen.getByText('3 days')
    expect(badge).toHaveClass('bg-slate-100')
    expect(badge).toHaveClass('text-slate-700')
  })

  it('handles zero days', () => {
    render(<DaysRemainingBadge days={0} />)

    expect(screen.getByText('0 days')).toBeInTheDocument()
    const badge = screen.getByText('0 days')
    expect(badge).toHaveClass('bg-red-100')
  })
})

// =============================================================================
// StockIndicator Tests
// =============================================================================

describe('Inventory Intelligence - StockIndicator', () => {
  it('renders current stock value with units label by default', () => {
    render(<StockIndicator current={150} threshold={175} />)

    expect(screen.getByText('150 units')).toBeInTheDocument()
    expect(screen.getByText(/Threshold: 175/)).toBeInTheDocument()
  })

  it('hides label when showLabel is false', () => {
    render(<StockIndicator current={150} threshold={175} showLabel={false} />)

    expect(screen.queryByText(/units/i)).not.toBeInTheDocument()
  })

  it('applies red bar when current < threshold * 0.5', () => {
    const { container } = render(<StockIndicator current={50} threshold={200} />)

    const redBar = container.querySelector('.bg-red-500')
    expect(redBar).toBeInTheDocument()
  })

  it('applies amber bar when current < threshold but >= threshold * 0.5', () => {
    const { container } = render(<StockIndicator current={150} threshold={200} />)

    const amberBar = container.querySelector('.bg-amber-500')
    expect(amberBar).toBeInTheDocument()
  })

  it('applies emerald bar when current >= threshold', () => {
    const { container } = render(<StockIndicator current={250} threshold={200} />)

    const greenBar = container.querySelector('.bg-emerald-500')
    expect(greenBar).toBeInTheDocument()
  })

  it('handles zero current stock', () => {
    render(<StockIndicator current={0} threshold={100} />)

    expect(screen.getByText('0 units')).toBeInTheDocument()
  })

  it('handles max value for progress bar', () => {
    const { container } = render(<StockIndicator current={500} threshold={100} max={1000} />)

    // Should render without errors
    expect(container.firstChild).toBeInTheDocument()
  })

  it('formats large numbers with locale string', () => {
    render(<StockIndicator current={1500} threshold={1750} />)

    expect(screen.getByText('1,500 units')).toBeInTheDocument()
    expect(screen.getByText(/Threshold: 1,750/)).toBeInTheDocument()
  })
})

// =============================================================================
// ReasoningList Tests
// =============================================================================

describe('Inventory Intelligence - ReasoningList', () => {
  it('renders all reasoning items', () => {
    render(<ReasoningList items={sampleReasoningItems} />)

    expect(screen.getByText(/Current stock: 150 units/)).toBeInTheDocument()
    expect(screen.getByText(/In transit: 50 units/)).toBeInTheDocument()
    expect(screen.getByText(/Daily sales rate/)).toBeInTheDocument()
  })

  it('displays warning items with warning styling', () => {
    const warningItem = sampleReasoningItems.find(item => item.type === 'warning')
    render(<ReasoningList items={[warningItem!]} />)

    const warningText = screen.getByText(/WARNING/i)
    expect(warningText).toBeInTheDocument()
  })

  it('displays calculation items with calculation styling', () => {
    const calcItems = sampleReasoningItems.filter(item => item.type === 'calculation')
    render(<ReasoningList items={calcItems} />)

    expect(screen.getByText(/Current stock/)).toBeInTheDocument()
  })

  it('displays info items with info styling', () => {
    const infoItems = sampleReasoningItems.filter(item => item.type === 'info')
    render(<ReasoningList items={infoItems} />)

    expect(screen.getByText(/In transit/)).toBeInTheDocument()
  })

  it('handles empty reasoning list', () => {
    const { container } = render(<ReasoningList items={[]} />)

    // Should render an empty container or placeholder
    expect(container).toBeInTheDocument()
  })

  it('displays values when provided', () => {
    const itemWithValue = { type: 'calculation' as const, message: 'Test value', value: 42 }
    render(<ReasoningList items={[itemWithValue]} />)

    expect(screen.getByText(/Test value/)).toBeInTheDocument()
  })
})

// =============================================================================
// Integration: Suggestion Data Display
// =============================================================================

describe('Inventory Intelligence - Suggestion Data', () => {
  it('transfer suggestion has required fields', () => {
    expect(sampleTransferSuggestion.type).toBe('transfer')
    expect(sampleTransferSuggestion.sourceLocationId).toBeTruthy()
    expect(sampleTransferSuggestion.sourceLocationName).toBeTruthy()
    expect(sampleTransferSuggestion.sourceAvailableQty).toBeGreaterThan(0)
    expect(sampleTransferSuggestion.supplierId).toBeNull()
  })

  it('PO suggestion has required fields', () => {
    expect(samplePOSuggestion.type).toBe('purchase-order')
    expect(samplePOSuggestion.supplierId).toBeTruthy()
    expect(samplePOSuggestion.supplierName).toBeTruthy()
    expect(samplePOSuggestion.supplierLeadTimeDays).toBeGreaterThan(0)
    expect(samplePOSuggestion.sourceLocationId).toBeNull()
  })

  it('suggestion urgency is valid', () => {
    const validUrgencies = ['critical', 'warning', 'planned', 'monitor']
    expect(validUrgencies).toContain(sampleTransferSuggestion.urgency)
    expect(validUrgencies).toContain(samplePOSuggestion.urgency)
  })

  it('suggestion status is valid', () => {
    const validStatuses = ['pending', 'accepted', 'dismissed', 'snoozed']
    expect(validStatuses).toContain(sampleTransferSuggestion.status)
    expect(validStatuses).toContain(samplePOSuggestion.status)
  })

  it('days of stock remaining matches urgency threshold', () => {
    // Critical: <= 3 days
    expect(samplePOSuggestion.daysOfStockRemaining).toBeLessThanOrEqual(3)
    expect(samplePOSuggestion.urgency).toBe('critical')

    // Warning: 4-7 days
    expect(sampleTransferSuggestion.daysOfStockRemaining).toBeGreaterThan(3)
    expect(sampleTransferSuggestion.daysOfStockRemaining).toBeLessThanOrEqual(14)
  })

  it('reasoning items have valid types', () => {
    const validTypes = ['info', 'warning', 'calculation']

    sampleTransferSuggestion.reasoning.forEach(item => {
      expect(validTypes).toContain(item.type)
      expect(item.message).toBeTruthy()
    })
  })
})

// =============================================================================
// SuggestionsView Tests
// =============================================================================

describe('Inventory Intelligence - SuggestionsView', () => {
  const transferSuggestions = sampleSuggestions.filter(s => s.type === 'transfer')

  it('renders suggestions list', () => {
    render(
      <SuggestionsView
        suggestions={transferSuggestions}
        type="transfer"
        locations={sampleLocations}
        urgencyOptions={sampleUrgencyOptions}
      />
    )

    expect(screen.getByText('Water Bottle 500ml Black')).toBeInTheDocument()
    expect(screen.getByText('WB-500-BLK')).toBeInTheDocument()
  })

  it('displays empty state when no suggestions', () => {
    render(
      <SuggestionsView
        suggestions={[]}
        type="transfer"
        locations={sampleLocations}
        urgencyOptions={sampleUrgencyOptions}
      />
    )

    expect(screen.getByText(/No transfer suggestions/)).toBeInTheDocument()
  })

  it('displays PO-specific empty state', () => {
    render(
      <SuggestionsView
        suggestions={[]}
        type="purchase-order"
        locations={sampleLocations}
        urgencyOptions={sampleUrgencyOptions}
      />
    )

    expect(screen.getByText(/No purchase order suggestions/)).toBeInTheDocument()
  })

  it('filters suggestions by search query', () => {
    render(
      <SuggestionsView
        suggestions={transferSuggestions}
        type="transfer"
        locations={sampleLocations}
        urgencyOptions={sampleUrgencyOptions}
      />
    )

    const searchInput = screen.getByPlaceholderText(/Search by SKU/i)
    fireEvent.change(searchInput, { target: { value: 'Water Bottle' } })

    expect(screen.getByText('Water Bottle 500ml Black')).toBeInTheDocument()
  })

  it('filters suggestions by SKU', () => {
    render(
      <SuggestionsView
        suggestions={transferSuggestions}
        type="transfer"
        locations={sampleLocations}
        urgencyOptions={sampleUrgencyOptions}
      />
    )

    const searchInput = screen.getByPlaceholderText(/Search by SKU/i)
    fireEvent.change(searchInput, { target: { value: 'WB-500' } })

    expect(screen.getByText('Water Bottle 500ml Black')).toBeInTheDocument()
  })

  it('shows filter panel when filter button clicked', () => {
    render(
      <SuggestionsView
        suggestions={transferSuggestions}
        type="transfer"
        locations={sampleLocations}
        urgencyOptions={sampleUrgencyOptions}
      />
    )

    const filterButton = screen.getByRole('button', { name: /Filters/i })
    fireEvent.click(filterButton)

    // Filter panel shows Urgency and Destination labels
    // Use getAllByText since 'Urgency' appears as both filter label and table header
    const urgencyElements = screen.getAllByText('Urgency')
    expect(urgencyElements.length).toBeGreaterThanOrEqual(2) // Filter label + table header
    expect(screen.getByText('Destination')).toBeInTheDocument()
  })

  it('shows Review button for each suggestion', () => {
    render(
      <SuggestionsView
        suggestions={transferSuggestions}
        type="transfer"
        locations={sampleLocations}
        urgencyOptions={sampleUrgencyOptions}
      />
    )

    const reviewButtons = screen.getAllByRole('button', { name: /Review/i })
    expect(reviewButtons.length).toBeGreaterThan(0)
  })

  it('displays correct result count', () => {
    render(
      <SuggestionsView
        suggestions={transferSuggestions}
        type="transfer"
        locations={sampleLocations}
        urgencyOptions={sampleUrgencyOptions}
      />
    )

    expect(screen.getByText(new RegExp(`${transferSuggestions.length} transfer`))).toBeInTheDocument()
  })

  it('calls onAccept when accept button clicked in expanded row', async () => {
    const mockOnAccept = vi.fn()

    render(
      <SuggestionsView
        suggestions={[sampleTransferSuggestion]}
        type="transfer"
        locations={sampleLocations}
        urgencyOptions={sampleUrgencyOptions}
        onAccept={mockOnAccept}
      />
    )

    // Click to expand row
    const reviewButton = screen.getByRole('button', { name: /Review/i })
    fireEvent.click(reviewButton)

    // Find and click accept button
    const acceptButton = await screen.findByRole('button', { name: /Accept & Create Transfer/i })
    fireEvent.click(acceptButton)

    expect(mockOnAccept).toHaveBeenCalledWith(sampleTransferSuggestion.id, sampleTransferSuggestion.recommendedQty)
  })
})

// =============================================================================
// DashboardView Tests
// =============================================================================

describe('Inventory Intelligence - DashboardView', () => {
  it('renders summary cards', () => {
    render(
      <DashboardView
        summary={sampleDashboardSummary}
        topSuggestions={[sampleTransferSuggestion, samplePOSuggestion]}
      />
    )

    // Check summary cards are displayed
    expect(screen.getByText('Total SKUs')).toBeInTheDocument()
    expect(screen.getByText('60')).toBeInTheDocument() // totalActiveProducts
    expect(screen.getByText('Critical Alerts')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument() // critical count
    expect(screen.getByText('Pending Actions')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument() // totalSuggestions
  })

  it('renders urgency distribution', () => {
    render(
      <DashboardView
        summary={sampleDashboardSummary}
        topSuggestions={[]}
      />
    )

    expect(screen.getByText('Urgency Distribution')).toBeInTheDocument()
    expect(screen.getByText(/Critical \(2\)/)).toBeInTheDocument()
    expect(screen.getByText(/Warning \(5\)/)).toBeInTheDocument()
    expect(screen.getByText(/Planned \(8\)/)).toBeInTheDocument()
    expect(screen.getByText(/Monitor \(15\)/)).toBeInTheDocument()
  })

  it('renders location health section', () => {
    render(
      <DashboardView
        summary={sampleDashboardSummary}
        topSuggestions={[]}
      />
    )

    expect(screen.getByText('Location Health')).toBeInTheDocument()
    expect(screen.getByText('Amazon FBA - US East')).toBeInTheDocument()
    expect(screen.getByText('Amazon FBA - US West')).toBeInTheDocument()
    expect(screen.getByText('Amazon AWD - LA')).toBeInTheDocument()
  })

  it('displays location critical/warning counts', () => {
    render(
      <DashboardView
        summary={sampleDashboardSummary}
        topSuggestions={[]}
      />
    )

    // Check critical/warning badges appear
    expect(screen.getAllByText(/critical/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/warning/).length).toBeGreaterThan(0)
  })

  it('renders top suggestions', () => {
    render(
      <DashboardView
        summary={sampleDashboardSummary}
        topSuggestions={[sampleTransferSuggestion, samplePOSuggestion]}
      />
    )

    expect(screen.getByText('Top Urgent Suggestions')).toBeInTheDocument()
    expect(screen.getByText('Water Bottle 500ml Black')).toBeInTheDocument()
    expect(screen.getByText('Yoga Mat Pro Grey')).toBeInTheDocument()
  })

  it('displays empty state for no suggestions', () => {
    render(
      <DashboardView
        summary={sampleDashboardSummary}
        topSuggestions={[]}
      />
    )

    expect(screen.getByText(/No pending suggestions/)).toBeInTheDocument()
  })

  it('calls onRefresh when refresh button clicked', () => {
    const mockOnRefresh = vi.fn()

    render(
      <DashboardView
        summary={sampleDashboardSummary}
        topSuggestions={[]}
        onRefresh={mockOnRefresh}
      />
    )

    const refreshButton = screen.getByRole('button', { name: /Refresh/i })
    fireEvent.click(refreshButton)

    expect(mockOnRefresh).toHaveBeenCalled()
  })

  it('calls onViewAllSuggestions when view all clicked', () => {
    const mockOnViewAll = vi.fn()

    render(
      <DashboardView
        summary={sampleDashboardSummary}
        topSuggestions={[sampleTransferSuggestion]}
        onViewAllSuggestions={mockOnViewAll}
      />
    )

    const viewAllLink = screen.getByRole('button', { name: /View all/i })
    fireEvent.click(viewAllLink)

    expect(mockOnViewAll).toHaveBeenCalledWith('transfer')
  })

  it('calls onAcceptSuggestion when Create Transfer clicked', () => {
    const mockOnAccept = vi.fn()

    render(
      <DashboardView
        summary={sampleDashboardSummary}
        topSuggestions={[sampleTransferSuggestion]}
        onAcceptSuggestion={mockOnAccept}
      />
    )

    const createButton = screen.getByRole('button', { name: /Create Transfer/i })
    fireEvent.click(createButton)

    expect(mockOnAccept).toHaveBeenCalledWith(sampleTransferSuggestion.id, sampleTransferSuggestion.type)
  })
})

// =============================================================================
// ForecastsView Tests
// =============================================================================

describe('Inventory Intelligence - ForecastsView', () => {
  it('renders forecasts table', () => {
    render(
      <ForecastsView
        forecasts={sampleSalesForecasts}
        salesHistory={sampleSalesHistory}
      />
    )

    expect(screen.getByText('Water Bottle 500ml Black')).toBeInTheDocument()
    expect(screen.getByText('Yoga Mat Pro Grey')).toBeInTheDocument()
    expect(screen.getByText('Reusable Bottle 1L Blue')).toBeInTheDocument()
  })

  it('displays empty state when no forecasts', () => {
    render(
      <ForecastsView
        forecasts={[]}
        salesHistory={[]}
      />
    )

    expect(screen.getByText(/No products with sales history/)).toBeInTheDocument()
  })

  it('shows confidence badges', () => {
    render(
      <ForecastsView
        forecasts={sampleSalesForecasts}
        salesHistory={sampleSalesHistory}
      />
    )

    expect(screen.getByText('high')).toBeInTheDocument()
    expect(screen.getByText('medium')).toBeInTheDocument()
    expect(screen.getByText('low')).toBeInTheDocument()
  })

  it('shows seasonal badge for forecasts with seasonal multipliers', () => {
    render(
      <ForecastsView
        forecasts={sampleSalesForecasts}
        salesHistory={sampleSalesHistory}
      />
    )

    // 'Seasonal' appears as both table header and badge - use getAllByText
    const seasonalElements = screen.getAllByText('Seasonal')
    expect(seasonalElements.length).toBeGreaterThanOrEqual(2) // Header + badge
  })

  it('shows trend badge for forecasts with trend rate', () => {
    render(
      <ForecastsView
        forecasts={sampleSalesForecasts}
        salesHistory={sampleSalesHistory}
      />
    )

    expect(screen.getByText('+5%')).toBeInTheDocument() // Positive trend
    expect(screen.getByText('-10%')).toBeInTheDocument() // Negative trend
  })

  it('shows override indicator for manual overrides', () => {
    render(
      <ForecastsView
        forecasts={sampleSalesForecasts}
        salesHistory={sampleSalesHistory}
      />
    )

    expect(screen.getByText('(override)')).toBeInTheDocument()
  })

  it('filters forecasts by search query', () => {
    render(
      <ForecastsView
        forecasts={sampleSalesForecasts}
        salesHistory={sampleSalesHistory}
      />
    )

    const searchInput = screen.getByPlaceholderText(/Search by SKU/i)
    fireEvent.change(searchInput, { target: { value: 'Water' } })

    expect(screen.getByText('Water Bottle 500ml Black')).toBeInTheDocument()
    expect(screen.queryByText('Yoga Mat Pro Grey')).not.toBeInTheDocument()
  })

  it('filters forecasts by enabled status', () => {
    render(
      <ForecastsView
        forecasts={sampleSalesForecasts}
        salesHistory={sampleSalesHistory}
      />
    )

    // Find and click the filter dropdown
    const filterDropdown = screen.getByRole('combobox')
    fireEvent.change(filterDropdown, { target: { value: 'enabled' } })

    // Should show enabled forecasts only (2 are enabled)
    expect(screen.getByText('Water Bottle 500ml Black')).toBeInTheDocument()
    expect(screen.getByText('Yoga Mat Pro Grey')).toBeInTheDocument()
    // Disabled forecast should not appear
    expect(screen.queryByText('Reusable Bottle 1L Blue')).not.toBeInTheDocument()
  })

  it('shows stats in footer', () => {
    render(
      <ForecastsView
        forecasts={sampleSalesForecasts}
        salesHistory={sampleSalesHistory}
      />
    )

    expect(screen.getByText(/3 products/)).toBeInTheDocument()
    expect(screen.getByText(/2 enabled/)).toBeInTheDocument()
    expect(screen.getByText(/1 disabled/)).toBeInTheDocument()
  })

  it('calls onToggleEnabled when toggle clicked', () => {
    const mockToggle = vi.fn()

    render(
      <ForecastsView
        forecasts={sampleSalesForecasts}
        salesHistory={sampleSalesHistory}
        onToggleEnabled={mockToggle}
      />
    )

    // Find and click a toggle switch
    const toggles = screen.getAllByRole('switch')
    fireEvent.click(toggles[0])

    expect(mockToggle).toHaveBeenCalled()
  })

  it('can switch between chart and table view', () => {
    render(
      <ForecastsView
        forecasts={sampleSalesForecasts}
        salesHistory={sampleSalesHistory}
      />
    )

    const tableButton = screen.getByRole('button', { name: /Table/i })
    fireEvent.click(tableButton)

    // Should show table grouping options
    expect(screen.getByRole('combobox', { name: '' })).toBeInTheDocument()
  })
})
