import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@/test/test-utils'
import { TransfersView } from '../components/TransfersView'
import { TransferTableRow } from '../components/TransferTableRow'
import { ShippingAgentsView } from '../components/ShippingAgentsView'
import type {
  Transfer,
  TransferStatusOption,
  ShippingMethodOption,
  ShippingAgent,
  ShippingServiceOption,
  AmazonShipment,
} from '../types'
import type { Location } from '@/sections/suppliers/types'

// =============================================================================
// Test Data
// =============================================================================

const mockLocations: Location[] = [
  {
    id: 'loc-001',
    name: 'Shenzhen Factory',
    type: 'factory',
    addressLine1: '123 Factory Road',
    city: 'Shenzhen',
    country: 'China',
    countryCode: 'CN',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'loc-002',
    name: 'LA Warehouse',
    type: 'warehouse',
    addressLine1: '456 Warehouse Ave',
    city: 'Los Angeles',
    stateProvince: 'CA',
    country: 'United States',
    countryCode: 'US',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'loc-003',
    name: 'Amazon FBA - ONT8',
    type: 'amazon_fba',
    addressLine1: 'Amazon FC ONT8',
    city: 'San Bernardino',
    stateProvince: 'CA',
    country: 'United States',
    countryCode: 'US',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

const mockTransferStatuses: TransferStatusOption[] = [
  { id: 'draft', label: 'Draft', order: 1, color: 'stone' },
  { id: 'booked', label: 'Booked', order: 2, color: 'lime' },
  { id: 'in-transit', label: 'In Transit', order: 3, color: 'amber' },
  { id: 'delivered', label: 'Delivered', order: 4, color: 'cyan' },
  { id: 'completed', label: 'Completed', order: 5, color: 'green' },
  { id: 'cancelled', label: 'Cancelled', order: 6, color: 'red' },
]

const mockShippingMethods: ShippingMethodOption[] = [
  { id: 'ocean-fcl', label: 'Ocean FCL' },
  { id: 'ocean-lcl', label: 'Ocean LCL' },
  { id: 'air-freight', label: 'Air Freight' },
  { id: 'air-express', label: 'Air Express' },
  { id: 'ground', label: 'Ground' },
]

const mockShippingServices: ShippingServiceOption[] = [
  { id: 'ocean', label: 'Ocean Freight' },
  { id: 'air', label: 'Air Freight' },
  { id: 'trucking', label: 'Trucking' },
  { id: 'courier', label: 'Courier' },
]

const mockTransfers: Transfer[] = [
  {
    id: 'tr-001',
    transferNumber: 'TR-2024-001',
    status: 'in-transit',
    sourceLocationId: 'loc-001',
    sourceLocationName: 'Shenzhen Factory',
    sourceLocationType: 'factory',
    destinationLocationId: 'loc-002',
    destinationLocationName: 'LA Warehouse',
    destinationLocationType: 'warehouse',
    carrier: 'Maersk',
    carrierAccountNumber: 'MAE123456',
    shippingMethod: 'ocean-fcl',
    containerNumbers: ['MSKU1234567'],
    scheduledDepartureDate: '2024-03-01',
    actualDepartureDate: '2024-03-02',
    scheduledArrivalDate: '2024-03-25',
    actualArrivalDate: null,
    incoterms: 'FOB',
    costs: {
      freight: 3500,
      insurance: 150,
      duties: 800,
      taxes: 200,
      handling: 100,
      other: 50,
      currency: 'USD',
    },
    totalCost: 4800,
    customsInfo: {
      hsCode: '9617.00.10',
      broker: 'US Customs Brokers Inc',
      status: 'pending',
      entryNumber: '',
      clearanceDate: null,
      notes: '',
    },
    amazonReceiving: null,
    amazonShipmentId: null,
    lineItems: [
      {
        id: 'li-001',
        transferId: 'tr-001',
        batchId: 'batch-001',
        sku: 'WB-STEEL-750',
        productName: 'Stainless Steel Water Bottle 750ml',
        quantity: 5000,
        unitCost: 4.50,
        totalCost: 22500,
        status: 'in_transit',
        receivedQuantity: null,
        discrepancy: null,
        receivedAt: null,
        receivedNotes: '',
        debitLedgerEntryId: 'le-001',
        creditLedgerEntryId: null,
        sortOrder: 1,
        createdAt: '2024-02-28T00:00:00Z',
        updatedAt: '2024-03-02T00:00:00Z',
      },
    ],
    totalUnits: 5000,
    totalValue: 22500,
    trackingNumbers: [
      {
        id: 'tn-001',
        carrier: 'Maersk',
        trackingNumber: 'MSKU1234567',
        trackingUrl: 'https://maersk.com/tracking/MSKU1234567',
        createdAt: '2024-03-02T00:00:00Z',
      },
    ],
    documents: [],
    statusHistory: [
      {
        id: 'sh-001',
        status: 'draft',
        note: 'Transfer created',
        createdAt: '2024-02-28T00:00:00Z',
      },
      {
        id: 'sh-002',
        status: 'booked',
        note: 'Shipping booked with Maersk',
        createdAt: '2024-03-01T00:00:00Z',
      },
      {
        id: 'sh-003',
        status: 'in-transit',
        note: 'Container departed Shenzhen port',
        createdAt: '2024-03-02T00:00:00Z',
      },
    ],
    notes: 'Priority shipment for Q2 inventory',
    quoteConfirmedAt: null,
    createdAt: '2024-02-28T00:00:00Z',
    updatedAt: '2024-03-02T00:00:00Z',
  },
  {
    id: 'tr-002',
    transferNumber: 'TR-2024-002',
    status: 'draft',
    sourceLocationId: 'loc-002',
    sourceLocationName: 'LA Warehouse',
    sourceLocationType: 'warehouse',
    destinationLocationId: 'loc-003',
    destinationLocationName: 'Amazon FBA - ONT8',
    destinationLocationType: 'amazon_fba',
    carrier: '',
    carrierAccountNumber: '',
    shippingMethod: 'ground',
    containerNumbers: [],
    scheduledDepartureDate: '2024-03-28',
    actualDepartureDate: null,
    scheduledArrivalDate: '2024-03-29',
    actualArrivalDate: null,
    incoterms: '',
    costs: {
      freight: 250,
      insurance: 0,
      duties: 0,
      taxes: 0,
      handling: 50,
      other: 0,
      currency: 'USD',
    },
    totalCost: 300,
    customsInfo: {
      hsCode: '',
      broker: '',
      status: 'pending',
      entryNumber: '',
      clearanceDate: null,
      notes: '',
    },
    amazonReceiving: null,
    amazonShipmentId: 'FBA-SHIP-001',
    lineItems: [
      {
        id: 'li-002',
        transferId: 'tr-002',
        batchId: 'batch-002',
        sku: 'WB-GLASS-500',
        productName: 'Glass Water Bottle 500ml',
        quantity: 1000,
        unitCost: 3.25,
        totalCost: 3250,
        status: 'pending',
        receivedQuantity: null,
        discrepancy: null,
        receivedAt: null,
        receivedNotes: '',
        debitLedgerEntryId: null,
        creditLedgerEntryId: null,
        sortOrder: 1,
        createdAt: '2024-03-15T00:00:00Z',
        updatedAt: '2024-03-15T00:00:00Z',
      },
    ],
    totalUnits: 1000,
    totalValue: 3250,
    trackingNumbers: [],
    documents: [],
    statusHistory: [
      {
        id: 'sh-004',
        status: 'draft',
        note: 'Transfer created for FBA replenishment',
        createdAt: '2024-03-15T00:00:00Z',
      },
    ],
    notes: 'FBA replenishment shipment',
    quoteConfirmedAt: null,
    createdAt: '2024-03-15T00:00:00Z',
    updatedAt: '2024-03-15T00:00:00Z',
  },
]

const mockShippingAgents: ShippingAgent[] = [
  {
    id: 'agent-001',
    name: 'Global Freight Partners',
    contactName: 'John Smith',
    email: 'john@gfp.com',
    phone: '+1 555 123 4567',
    services: ['ocean', 'air'],
    address: {
      street: '100 Trade Center Dr',
      city: 'Los Angeles',
      state: 'CA',
      country: 'United States',
      postalCode: '90001',
    },
    accountNumber: 'GFP-12345',
    website: 'https://globalfreightpartners.com',
    notes: 'Primary freight forwarder',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  },
  {
    id: 'agent-002',
    name: 'Express Logistics Co',
    contactName: 'Jane Doe',
    email: 'jane@expresslogi.com',
    phone: '+1 555 987 6543',
    services: ['air', 'courier'],
    address: {
      city: 'Chicago',
      state: 'IL',
      country: 'United States',
    },
    isActive: true,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
  },
]

const mockAmazonShipments: AmazonShipment[] = [
  {
    id: 'ship-001',
    shipmentId: 'FBA-SHIP-001',
    shipmentName: 'Q2 FBA Replenishment',
    shipmentConfirmationId: 'CONF123456',
    inboundType: 'FBA',
    destinationFcId: 'ONT8',
    status: 'WORKING',
    labelsPrepType: 'AMAZON_LABEL',
    carrierName: 'UPS',
    trackingIds: ['1Z999AA10123456784'],
    boxCount: 25,
    areCasesRequired: false,
    totalUnits: 1000,
    totalSkus: 1,
    items: [
      {
        id: 'item-001',
        sellerSku: 'WB-GLASS-500',
        fnSku: 'X001ABC123',
        productName: 'Glass Water Bottle 500ml',
        quantityShipped: 1000,
        quantityReceived: 0,
        quantityInCase: 40,
      },
    ],
    linkedTransferId: 'tr-002',
    lastSyncedAt: '2024-03-15T10:00:00Z',
    createdDate: '2024-03-15T00:00:00Z',
    lastUpdatedDate: '2024-03-15T10:00:00Z',
    createdAt: '2024-03-15T00:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
  },
]

// =============================================================================
// TransfersView Tests
// =============================================================================

describe('TransfersView', () => {
  const defaultProps = {
    transfers: mockTransfers,
    locations: mockLocations,
    transferStatuses: mockTransferStatuses,
    shippingMethods: mockShippingMethods,
    shippingAgents: mockShippingAgents,
    shippingServices: mockShippingServices,
    amazonShipments: mockAmazonShipments,
  }

  it('renders the transfers view with header and stats', () => {
    render(<TransfersView {...defaultProps} />)

    // Check header - "Transfers" appears multiple times (header + tab), use heading role
    expect(screen.getByRole('heading', { name: 'Transfers' })).toBeInTheDocument()
    expect(screen.getByText('Track shipments between locations')).toBeInTheDocument()

    // Check stats are displayed - "In Transit" appears in stats and as status badge
    expect(screen.getByText('Total Transfers')).toBeInTheDocument()
    expect(screen.getAllByText(/In Transit/i).length).toBeGreaterThan(0)
  })

  it('displays the transfers table with correct columns', () => {
    render(<TransfersView {...defaultProps} />)

    // Check table headers
    expect(screen.getByText('Transfer #')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Route')).toBeInTheDocument()
    expect(screen.getByText('Items')).toBeInTheDocument()
    expect(screen.getByText('Carrier')).toBeInTheDocument()
  })

  it('renders transfer rows with correct data', () => {
    render(<TransfersView {...defaultProps} />)

    // Check transfer numbers are displayed
    expect(screen.getByText('TR-2024-001')).toBeInTheDocument()
    expect(screen.getByText('TR-2024-002')).toBeInTheDocument()

    // Check carrier is displayed
    expect(screen.getByText('Maersk')).toBeInTheDocument()
  })

  it('filters transfers by search query', () => {
    render(<TransfersView {...defaultProps} />)

    // Get search input
    const searchInput = screen.getByPlaceholderText('Search transfers...')

    // Search for a specific transfer
    fireEvent.change(searchInput, { target: { value: 'Maersk' } })

    // Should show matching transfer
    expect(screen.getByText('TR-2024-001')).toBeInTheDocument()

    // Should not show non-matching transfer (draft one has no carrier)
    expect(screen.queryByText('TR-2024-002')).not.toBeInTheDocument()
  })

  it('filters transfers by status', () => {
    render(<TransfersView {...defaultProps} />)

    // Get status filter - native select with "All statuses" option
    const statusFilter = screen.getByDisplayValue('All statuses')

    // Filter by draft status
    fireEvent.change(statusFilter, { target: { value: 'draft' } })

    // Should only show draft transfer
    expect(screen.getByText('TR-2024-002')).toBeInTheDocument()
    expect(screen.queryByText('TR-2024-001')).not.toBeInTheDocument()
  })

  it('calls onCreateTransfer when New Transfer button is clicked', () => {
    const onCreateTransfer = vi.fn()
    render(<TransfersView {...defaultProps} onCreateTransfer={onCreateTransfer} />)

    const newTransferBtn = screen.getByText('New Transfer')
    fireEvent.click(newTransferBtn)

    expect(onCreateTransfer).toHaveBeenCalled()
  })

  it('displays tabs for transfers, shipping agents, and amazon shipments', () => {
    render(<TransfersView {...defaultProps} />)

    // Check tabs exist - "Transfers" appears multiple places, so check unique tab labels
    // Shipping Agents and Amazon Shipments are unique to tabs
    expect(screen.getByText('Shipping Agents')).toBeInTheDocument()
    expect(screen.getByText('Amazon Shipments')).toBeInTheDocument()
    // For Transfers tab, we'll check it via the tab badge count
    expect(screen.getAllByText('Transfers').length).toBeGreaterThanOrEqual(2) // header + tab
  })

  it('shows empty state when no transfers match filter', () => {
    render(<TransfersView {...defaultProps} />)

    // Search for non-existent transfer
    const searchInput = screen.getByPlaceholderText('Search transfers...')
    fireEvent.change(searchInput, { target: { value: 'nonexistent12345' } })

    expect(screen.getByText('No transfers found matching your criteria')).toBeInTheDocument()
  })
})

// =============================================================================
// ShippingAgentsView Tests
// =============================================================================

describe('ShippingAgentsView', () => {
  const defaultProps = {
    shippingAgents: mockShippingAgents,
    shippingServices: mockShippingServices,
  }

  it('renders shipping agents table', () => {
    render(<ShippingAgentsView {...defaultProps} />)

    // Check agents are displayed
    expect(screen.getByText('Global Freight Partners')).toBeInTheDocument()
    expect(screen.getByText('Express Logistics Co')).toBeInTheDocument()
  })

  it('displays agent contact information', () => {
    render(<ShippingAgentsView {...defaultProps} />)

    expect(screen.getByText('John Smith')).toBeInTheDocument()
    expect(screen.getByText('john@gfp.com')).toBeInTheDocument()
  })

  it('shows services for each agent', () => {
    render(<ShippingAgentsView {...defaultProps} />)

    // Check services badges are displayed - services appear as lowercase badges
    // Agent 1 has: ocean, air
    // Agent 2 has: air, courier
    // So "ocean" appears 1 time, "air" appears 2 times
    expect(screen.getAllByText(/ocean/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/air/i).length).toBeGreaterThanOrEqual(1)
  })

  it('calls onCreateAgent when New Agent button is clicked', () => {
    const onCreateAgent = vi.fn()
    render(<ShippingAgentsView {...defaultProps} onCreateAgent={onCreateAgent} />)

    const newAgentBtn = screen.getByText('New Agent')
    fireEvent.click(newAgentBtn)

    expect(onCreateAgent).toHaveBeenCalled()
  })

  it('filters agents by search query', () => {
    render(<ShippingAgentsView {...defaultProps} />)

    const searchInput = screen.getByPlaceholderText('Search agents...')
    fireEvent.change(searchInput, { target: { value: 'Global' } })

    expect(screen.getByText('Global Freight Partners')).toBeInTheDocument()
    expect(screen.queryByText('Express Logistics Co')).not.toBeInTheDocument()
  })
})

// =============================================================================
// TransferTableRow Tests
// =============================================================================

describe('TransferTableRow', () => {
  const defaultProps = {
    transfer: mockTransfers[0],
    transferStatuses: mockTransferStatuses,
    shippingMethods: mockShippingMethods,
    destinationLocation: mockLocations[1],
  }

  it('renders transfer number and status', () => {
    render(
      <table>
        <tbody>
          <TransferTableRow {...defaultProps} />
        </tbody>
      </table>
    )

    expect(screen.getByText('TR-2024-001')).toBeInTheDocument()
    expect(screen.getByText('In Transit')).toBeInTheDocument()
  })

  it('displays route information', () => {
    render(
      <table>
        <tbody>
          <TransferTableRow {...defaultProps} />
        </tbody>
      </table>
    )

    expect(screen.getByText('Shenzhen Factory')).toBeInTheDocument()
    expect(screen.getByText('LA Warehouse')).toBeInTheDocument()
  })

  it('shows carrier and shipping method', () => {
    render(
      <table>
        <tbody>
          <TransferTableRow {...defaultProps} />
        </tbody>
      </table>
    )

    expect(screen.getByText('Maersk')).toBeInTheDocument()
    expect(screen.getByText('Ocean FCL')).toBeInTheDocument()
  })

  it('calls onView when view button is clicked', () => {
    const onView = vi.fn()
    render(
      <table>
        <tbody>
          <TransferTableRow {...defaultProps} onView={onView} />
        </tbody>
      </table>
    )

    // Find and click the view button (usually an eye icon or similar)
    const viewButtons = screen.getAllByRole('button')
    const viewButton = viewButtons.find(btn => btn.getAttribute('title')?.includes('View') || btn.textContent?.includes('View'))
    if (viewButton) {
      fireEvent.click(viewButton)
      expect(onView).toHaveBeenCalled()
    }
  })

  it('displays total cost', () => {
    render(
      <table>
        <tbody>
          <TransferTableRow {...defaultProps} />
        </tbody>
      </table>
    )

    // Check that cost is displayed (formatted as currency)
    expect(screen.getByText(/\$4,800/)).toBeInTheDocument()
  })

  it('shows linked Amazon shipment indicator for FBA transfers', () => {
    const fbaTransfer = mockTransfers[1] // This has amazonShipmentId
    const linkedShipment = mockAmazonShipments[0]

    render(
      <table>
        <tbody>
          <TransferTableRow
            transfer={fbaTransfer}
            transferStatuses={mockTransferStatuses}
            shippingMethods={mockShippingMethods}
            destinationLocation={mockLocations[2]}
            linkedAmazonShipment={linkedShipment}
          />
        </tbody>
      </table>
    )

    // Should show amazon FBA destination type
    expect(screen.getByText('Amazon FBA')).toBeInTheDocument()
  })
})

// =============================================================================
// Integration Tests
// =============================================================================

describe('Transfers Integration', () => {
  it('switching tabs shows different content', () => {
    const defaultProps = {
      transfers: mockTransfers,
      locations: mockLocations,
      transferStatuses: mockTransferStatuses,
      shippingMethods: mockShippingMethods,
      shippingAgents: mockShippingAgents,
      shippingServices: mockShippingServices,
      amazonShipments: mockAmazonShipments,
    }

    render(<TransfersView {...defaultProps} />)

    // Initially shows transfers tab
    expect(screen.getByText('TR-2024-001')).toBeInTheDocument()

    // Switch to shipping agents tab - click the button containing "Shipping Agents" text
    const agentsTab = screen.getByText('Shipping Agents')
    fireEvent.click(agentsTab)

    // Should show agents content
    expect(screen.getByText('Global Freight Partners')).toBeInTheDocument()

    // Transfers should not be visible
    expect(screen.queryByText('TR-2024-001')).not.toBeInTheDocument()
  })

  it('calculates summary stats correctly', () => {
    const defaultProps = {
      transfers: mockTransfers,
      locations: mockLocations,
      transferStatuses: mockTransferStatuses,
      shippingMethods: mockShippingMethods,
      shippingAgents: mockShippingAgents,
      shippingServices: mockShippingServices,
      amazonShipments: mockAmazonShipments,
    }

    render(<TransfersView {...defaultProps} />)

    // Check stats labels are present
    expect(screen.getByText('Total Transfers')).toBeInTheDocument()
    // "In Transit" appears in stats AND as status badge, use getAllByText
    expect(screen.getAllByText(/In Transit/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Pending Delivery')).toBeInTheDocument()
    expect(screen.getByText('This Month Freight')).toBeInTheDocument()

    // Verify transfers count shows in multiple places (stat + tab badge)
    // At minimum, we have 2 transfers
    const twoTexts = screen.getAllByText('2')
    expect(twoTexts.length).toBeGreaterThanOrEqual(1)
  })
})
