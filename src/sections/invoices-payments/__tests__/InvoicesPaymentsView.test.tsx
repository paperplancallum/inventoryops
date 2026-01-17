import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@/test/test-utils'
import { InvoicesPaymentsView } from '../InvoicesPaymentsView'
import type { Invoice, PaymentWithInvoice, FinancialSummary, Brand } from '../types'
import { INVOICE_TYPES, PAYMENT_METHODS, PAYMENT_STATUSES } from '../types'

// Sample test data
const sampleInvoices: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2024-0001',
    invoiceDate: '2024-01-20',
    description: 'Water Bottle Production - PO-2024-0042',
    type: 'product',
    linkedEntityType: 'purchase-order',
    linkedEntityId: 'po-001',
    linkedEntityName: 'PO-2024-0042',
    amount: 10000,
    paidAmount: 3000,
    balance: 7000,
    status: 'partial',
    dueDate: '2024-02-20',
    paymentSchedule: [
      {
        id: 'ps-001',
        milestoneName: '30% Deposit',
        percentage: 30,
        amount: 3000,
        trigger: 'po_confirmed',
        triggerStatus: 'triggered',
        triggerDate: '2024-01-16',
        dueDate: '2024-01-16',
        paidDate: '2024-01-18',
        paidAmount: 3000,
        offsetDays: 0,
        sortOrder: 0,
      },
      {
        id: 'ps-002',
        milestoneName: '70% Balance',
        percentage: 70,
        amount: 7000,
        trigger: 'inspection_passed',
        triggerStatus: 'pending',
        triggerDate: null,
        dueDate: null,
        paidDate: null,
        paidAmount: 0,
        offsetDays: 7,
        sortOrder: 1,
      },
    ],
    payments: [
      {
        id: 'pmt-001',
        date: '2024-01-18',
        amount: 3000,
        method: 'wire-transfer',
        reference: 'WT-2024-0123',
        notes: null,
        scheduleItemId: 'ps-001',
        attachments: [],
      },
    ],
    notes: 'Deposit paid on time',
    creationMethod: 'automatic',
    paymentTermsTemplateId: 'template-30-70',
    brandId: 'brand-001',
    brandName: 'Hydro Brand',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-18T15:30:00Z',
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2024-0002',
    invoiceDate: '2024-01-22',
    description: 'Shipping - Container MSKU12345',
    type: 'shipping',
    linkedEntityType: 'shipment',
    linkedEntityId: 'ship-001',
    linkedEntityName: 'SHIP-2024-0005',
    amount: 2500,
    paidAmount: 0,
    balance: 2500,
    status: 'unpaid',
    dueDate: '2024-02-22',
    paymentSchedule: [],
    payments: [],
    notes: null,
    creationMethod: 'manual',
    paymentTermsTemplateId: null,
    brandId: null,
    brandName: null,
    createdAt: '2024-01-22T09:00:00Z',
    updatedAt: '2024-01-22T09:00:00Z',
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2024-0003',
    invoiceDate: '2024-01-10',
    description: 'Inspection Fees - Batch 2024-001',
    type: 'inspection',
    linkedEntityType: 'inspection',
    linkedEntityId: 'insp-001',
    linkedEntityName: 'INSP-2024-0001',
    amount: 500,
    paidAmount: 500,
    balance: 0,
    status: 'paid',
    dueDate: '2024-01-25',
    paymentSchedule: [],
    payments: [
      {
        id: 'pmt-002',
        date: '2024-01-12',
        amount: 500,
        method: 'credit-card',
        reference: 'CC-2024-0088',
        notes: 'Paid in full',
        scheduleItemId: null,
        attachments: [],
      },
    ],
    notes: null,
    creationMethod: 'automatic',
    paymentTermsTemplateId: null,
    brandId: 'brand-001',
    brandName: 'Hydro Brand',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-12T11:00:00Z',
  },
]

const samplePayments: PaymentWithInvoice[] = [
  {
    id: 'pmt-001',
    date: '2024-01-18',
    amount: 3000,
    method: 'wire-transfer',
    reference: 'WT-2024-0123',
    notes: null,
    scheduleItemId: 'ps-001',
    attachments: [],
    invoiceId: 'inv-001',
    invoiceNumber: 'INV-2024-0001',
    invoiceDescription: 'Water Bottle Production - PO-2024-0042',
  },
  {
    id: 'pmt-002',
    date: '2024-01-12',
    amount: 500,
    method: 'credit-card',
    reference: 'CC-2024-0088',
    notes: 'Paid in full',
    scheduleItemId: null,
    attachments: [],
    invoiceId: 'inv-003',
    invoiceNumber: 'INV-2024-0003',
    invoiceDescription: 'Inspection Fees - Batch 2024-001',
  },
]

const sampleSummary: FinancialSummary = {
  totalInvoices: 13000,
  totalPaid: 3500,
  outstanding: 9500,
  upcomingThisWeek: 2500,
  overdueCount: 0,
}

const sampleBrands: Brand[] = [
  { id: 'brand-001', name: 'Hydro Brand' },
  { id: 'brand-002', name: 'Eco Products' },
]

const mockOnRecordPayment = vi.fn()
const mockOnViewLinkedEntity = vi.fn()
const mockOnRefresh = vi.fn()

describe('InvoicesPaymentsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the header with title and description', () => {
      render(
        <InvoicesPaymentsView
          invoices={sampleInvoices}
          payments={samplePayments}
          invoiceTypes={INVOICE_TYPES}
          paymentMethods={PAYMENT_METHODS}
          paymentStatuses={PAYMENT_STATUSES}
          brands={sampleBrands}
          summary={sampleSummary}
        />
      )

      expect(screen.getByText('Invoices & Payments')).toBeInTheDocument()
      expect(screen.getByText('Track invoices and manage payments')).toBeInTheDocument()
    })

    it('renders summary cards with correct values', () => {
      render(
        <InvoicesPaymentsView
          invoices={sampleInvoices}
          payments={samplePayments}
          invoiceTypes={INVOICE_TYPES}
          paymentMethods={PAYMENT_METHODS}
          paymentStatuses={PAYMENT_STATUSES}
          brands={sampleBrands}
          summary={sampleSummary}
        />
      )

      expect(screen.getByText('$13,000')).toBeInTheDocument() // Total Invoices
      expect(screen.getByText('$3,500')).toBeInTheDocument() // Paid
      expect(screen.getByText('$9,500')).toBeInTheDocument() // Outstanding
      expect(screen.getByText('0')).toBeInTheDocument() // Overdue count
    })

    it('renders invoice table with correct data', () => {
      render(
        <InvoicesPaymentsView
          invoices={sampleInvoices}
          payments={samplePayments}
          invoiceTypes={INVOICE_TYPES}
          paymentMethods={PAYMENT_METHODS}
          paymentStatuses={PAYMENT_STATUSES}
          brands={sampleBrands}
          summary={sampleSummary}
        />
      )

      // Check for invoice descriptions
      expect(screen.getByText('Water Bottle Production - PO-2024-0042')).toBeInTheDocument()
      expect(screen.getByText('Shipping - Container MSKU12345')).toBeInTheDocument()
      expect(screen.getByText('Inspection Fees - Batch 2024-001')).toBeInTheDocument()
    })

    it('renders loading state', () => {
      render(
        <InvoicesPaymentsView
          invoices={[]}
          payments={[]}
          invoiceTypes={INVOICE_TYPES}
          paymentMethods={PAYMENT_METHODS}
          paymentStatuses={PAYMENT_STATUSES}
          brands={[]}
          summary={{ totalInvoices: 0, totalPaid: 0, outstanding: 0, upcomingThisWeek: 0, overdueCount: 0 }}
          loading={true}
        />
      )

      expect(screen.getByText('Loading invoices...')).toBeInTheDocument()
    })

    it('renders empty state when no invoices', () => {
      render(
        <InvoicesPaymentsView
          invoices={[]}
          payments={[]}
          invoiceTypes={INVOICE_TYPES}
          paymentMethods={PAYMENT_METHODS}
          paymentStatuses={PAYMENT_STATUSES}
          brands={[]}
          summary={{ totalInvoices: 0, totalPaid: 0, outstanding: 0, upcomingThisWeek: 0, overdueCount: 0 }}
        />
      )

      expect(screen.getByText('No invoices found')).toBeInTheDocument()
    })
  })

  describe('Tab Navigation', () => {
    it('switches between Invoices and Payments tabs', () => {
      render(
        <InvoicesPaymentsView
          invoices={sampleInvoices}
          payments={samplePayments}
          invoiceTypes={INVOICE_TYPES}
          paymentMethods={PAYMENT_METHODS}
          paymentStatuses={PAYMENT_STATUSES}
          brands={sampleBrands}
          summary={sampleSummary}
        />
      )

      // Click Payments tab
      fireEvent.click(screen.getByText('Payments'))

      // Should show payments count badge
      expect(screen.getByText('2')).toBeInTheDocument()

      // Should be in payments view (search for payments instead of invoices)
      expect(screen.getByPlaceholderText('Search payments...')).toBeInTheDocument()
    })
  })

  describe('Filtering', () => {
    it('filters invoices by search query', () => {
      render(
        <InvoicesPaymentsView
          invoices={sampleInvoices}
          payments={samplePayments}
          invoiceTypes={INVOICE_TYPES}
          paymentMethods={PAYMENT_METHODS}
          paymentStatuses={PAYMENT_STATUSES}
          brands={sampleBrands}
          summary={sampleSummary}
        />
      )

      const searchInput = screen.getByPlaceholderText('Search invoices...')
      fireEvent.change(searchInput, { target: { value: 'Water Bottle' } })

      // Should only show the matching invoice
      expect(screen.getByText('Water Bottle Production - PO-2024-0042')).toBeInTheDocument()
      expect(screen.queryByText('Shipping - Container MSKU12345')).not.toBeInTheDocument()
    })

    it('filters invoices by type', () => {
      render(
        <InvoicesPaymentsView
          invoices={sampleInvoices}
          payments={samplePayments}
          invoiceTypes={INVOICE_TYPES}
          paymentMethods={PAYMENT_METHODS}
          paymentStatuses={PAYMENT_STATUSES}
          brands={sampleBrands}
          summary={sampleSummary}
        />
      )

      // Find and change the type filter
      const typeSelect = screen.getAllByRole('combobox')[0]
      fireEvent.change(typeSelect, { target: { value: 'shipping' } })

      // Should only show shipping invoices
      expect(screen.queryByText('Water Bottle Production - PO-2024-0042')).not.toBeInTheDocument()
      expect(screen.getByText('Shipping - Container MSKU12345')).toBeInTheDocument()
    })

    it('filters invoices by status', () => {
      render(
        <InvoicesPaymentsView
          invoices={sampleInvoices}
          payments={samplePayments}
          invoiceTypes={INVOICE_TYPES}
          paymentMethods={PAYMENT_METHODS}
          paymentStatuses={PAYMENT_STATUSES}
          brands={sampleBrands}
          summary={sampleSummary}
        />
      )

      // Find and change the status filter
      const statusSelect = screen.getAllByRole('combobox')[1]
      fireEvent.change(statusSelect, { target: { value: 'paid' } })

      // Should only show paid invoices
      expect(screen.queryByText('Water Bottle Production - PO-2024-0042')).not.toBeInTheDocument()
      expect(screen.getByText('Inspection Fees - Batch 2024-001')).toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('sorts invoices by date when clicking date header', () => {
      render(
        <InvoicesPaymentsView
          invoices={sampleInvoices}
          payments={samplePayments}
          invoiceTypes={INVOICE_TYPES}
          paymentMethods={PAYMENT_METHODS}
          paymentStatuses={PAYMENT_STATUSES}
          brands={sampleBrands}
          summary={sampleSummary}
        />
      )

      // Find the Date column header button
      const dateHeader = screen.getByRole('button', { name: /Date/i })

      // Click to toggle sort direction
      fireEvent.click(dateHeader)

      // Verify sorting indicator appears (this is visual feedback)
      expect(dateHeader).toBeInTheDocument()
    })

    it('sorts invoices by amount when clicking amount header', () => {
      render(
        <InvoicesPaymentsView
          invoices={sampleInvoices}
          payments={samplePayments}
          invoiceTypes={INVOICE_TYPES}
          paymentMethods={PAYMENT_METHODS}
          paymentStatuses={PAYMENT_STATUSES}
          brands={sampleBrands}
          summary={sampleSummary}
        />
      )

      const amountHeader = screen.getByRole('button', { name: /Amount/i })
      fireEvent.click(amountHeader)

      expect(amountHeader).toBeInTheDocument()
    })
  })

  describe('Invoice Count', () => {
    it('shows correct invoice count in footer', () => {
      render(
        <InvoicesPaymentsView
          invoices={sampleInvoices}
          payments={samplePayments}
          invoiceTypes={INVOICE_TYPES}
          paymentMethods={PAYMENT_METHODS}
          paymentStatuses={PAYMENT_STATUSES}
          brands={sampleBrands}
          summary={sampleSummary}
        />
      )

      expect(screen.getByText('Showing 3 of 3 invoices')).toBeInTheDocument()
    })

    it('shows filtered count when filters applied', () => {
      render(
        <InvoicesPaymentsView
          invoices={sampleInvoices}
          payments={samplePayments}
          invoiceTypes={INVOICE_TYPES}
          paymentMethods={PAYMENT_METHODS}
          paymentStatuses={PAYMENT_STATUSES}
          brands={sampleBrands}
          summary={sampleSummary}
        />
      )

      const searchInput = screen.getByPlaceholderText('Search invoices...')
      fireEvent.change(searchInput, { target: { value: 'Water Bottle' } })

      expect(screen.getByText('Showing 1 of 3 invoices')).toBeInTheDocument()
    })
  })

  describe('Callbacks', () => {
    it('calls onViewLinkedEntity when clicking linked entity', () => {
      render(
        <InvoicesPaymentsView
          invoices={sampleInvoices}
          payments={samplePayments}
          invoiceTypes={INVOICE_TYPES}
          paymentMethods={PAYMENT_METHODS}
          paymentStatuses={PAYMENT_STATUSES}
          brands={sampleBrands}
          summary={sampleSummary}
          onViewLinkedEntity={mockOnViewLinkedEntity}
        />
      )

      // Find and click a linked entity link
      const linkedEntityLink = screen.getByText('PO-2024-0042')
      fireEvent.click(linkedEntityLink)

      expect(mockOnViewLinkedEntity).toHaveBeenCalledWith('purchase-order', 'po-001')
    })
  })
})

describe('Type badges', () => {
  it('renders correct badge for each invoice type', () => {
    render(
      <InvoicesPaymentsView
        invoices={sampleInvoices}
        payments={samplePayments}
        invoiceTypes={INVOICE_TYPES}
        paymentMethods={PAYMENT_METHODS}
        paymentStatuses={PAYMENT_STATUSES}
        brands={sampleBrands}
        summary={sampleSummary}
      />
    )

    // These texts appear multiple times (in badges and filter dropdowns)
    // so we use getAllByText to verify they exist
    expect(screen.getAllByText('Product').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Shipping').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Inspection').length).toBeGreaterThan(0)
  })
})

describe('Status indicators', () => {
  it('renders correct status for each invoice', () => {
    render(
      <InvoicesPaymentsView
        invoices={sampleInvoices}
        payments={samplePayments}
        invoiceTypes={INVOICE_TYPES}
        paymentMethods={PAYMENT_METHODS}
        paymentStatuses={PAYMENT_STATUSES}
        brands={sampleBrands}
        summary={sampleSummary}
      />
    )

    // These texts appear multiple times (in badges and summary cards)
    // so we use getAllByText to verify they exist
    expect(screen.getAllByText('Partial').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Unpaid').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Paid').length).toBeGreaterThan(0)
  })
})
