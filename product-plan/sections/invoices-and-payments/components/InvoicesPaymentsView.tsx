import { useState, useMemo } from 'react'
import type { InvoicesPaymentsProps, InvoiceType, PaymentStatus, Invoice, NewPayment, Brand } from '@/../product/sections/invoices-and-payments/types'
import { InvoiceTableRow } from './InvoiceTableRow'
import { PaymentsTable } from './PaymentsTable'
import { RecordPaymentModal } from './RecordPaymentModal'
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox'

type ActiveTab = 'invoices' | 'payments'

// Icons
const SearchIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const DollarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const ExclamationIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const FileTextIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const CreditCardTabIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
)

interface InvoicesPaymentsViewProps extends InvoicesPaymentsProps {
  brands?: Brand[]
}

export function InvoicesPaymentsView({
  invoices,
  payments,
  invoiceTypes,
  paymentMethods,
  brands = [],
  summary,
  onRecordPayment,
  onViewLinkedEntity,
}: InvoicesPaymentsViewProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('invoices')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<InvoiceType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all')
  const [brandFilters, setBrandFilters] = useState<string[]>([])
  const [sortField, setSortField] = useState<'date' | 'amount' | 'balance'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  // Brand options for the multi-select
  const brandOptions = useMemo(() => {
    return brands.map(b => ({ value: b.id, label: b.name }))
  }, [brands])

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchQuery === '' ||
      invoice.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.linkedEntityName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === 'all' || invoice.type === typeFilter
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    const matchesBrand = brandFilters.length === 0 || brandFilters.includes(invoice.brandId || '')

    return matchesSearch && matchesType && matchesStatus && matchesBrand
  })

  // Sort invoices
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    let comparison = 0
    if (sortField === 'date') {
      comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
    } else if (sortField === 'amount') {
      comparison = a.amount - b.amount
    } else if (sortField === 'balance') {
      comparison = a.balance - b.balance
    }
    return sortDirection === 'desc' ? -comparison : comparison
  })

  const handleSort = (field: 'date' | 'amount' | 'balance') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleRecordPaymentClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShowPaymentModal(true)
  }

  const handlePaymentSubmit = (payment: NewPayment) => {
    if (selectedInvoice && onRecordPayment) {
      onRecordPayment(selectedInvoice.id, payment)
    }
    setShowPaymentModal(false)
    setSelectedInvoice(null)
  }

  const handleViewInvoice = (_invoiceId: string) => {
    // Switch to invoices tab and potentially scroll to that invoice
    setActiveTab('invoices')
    // In a real app, you might highlight or scroll to the invoice
  }

  const paymentStatuses: { id: PaymentStatus | 'all'; label: string }[] = [
    { id: 'all', label: 'All statuses' },
    { id: 'unpaid', label: 'Unpaid' },
    { id: 'partial', label: 'Partial' },
    { id: 'paid', label: 'Paid' },
    { id: 'overdue', label: 'Overdue' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Invoices & Payments
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Track invoices and manage payments
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-200 dark:bg-slate-600 rounded-lg">
                  <DollarIcon />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Invoices</p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
                ${summary.totalInvoices.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <CheckCircleIcon />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Paid</p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                ${summary.totalPaid.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                  <ClockIcon />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Outstanding</p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-amber-600 dark:text-amber-400">
                ${summary.outstanding.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${summary.overdueCount > 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-slate-200 dark:bg-slate-600 text-slate-500'}`}>
                  <ExclamationIcon />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Overdue</p>
              </div>
              <p className={`mt-2 text-2xl font-semibold ${summary.overdueCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                {summary.overdueCount}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-700">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'invoices'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <FileTextIcon />
              Invoices
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'payments'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <CreditCardTabIcon />
              Payments
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                {payments.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Filters (only for Invoices tab) */}
        {activeTab === 'invoices' && (
          <div className="px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Type Filter */}
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as InvoiceType | 'all')}
                  className="appearance-none pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                >
                  <option value="all">All types</option>
                  {invoiceTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <FilterIcon />
                </div>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
                  className="appearance-none pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                >
                  {paymentStatuses.map(status => (
                    <option key={status.id} value={status.id}>{status.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDownIcon />
                </div>
              </div>

              {/* Brand Filter */}
              {brands.length > 0 && (
                <MultiSelectCombobox
                  options={brandOptions}
                  selected={brandFilters}
                  onChange={setBrandFilters}
                  placeholder="All brands"
                  searchPlaceholder="Search brands..."
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {activeTab === 'invoices' ? (
            <>
              {/* Invoices Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        <button
                          onClick={() => handleSort('date')}
                          className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          Date
                          {sortField === 'date' && (
                            <span className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                              <ChevronDownIcon />
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Brand
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Linked To
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        <button
                          onClick={() => handleSort('amount')}
                          className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          Amount
                          {sortField === 'amount' && (
                            <span className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                              <ChevronDownIcon />
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Paid
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        <button
                          onClick={() => handleSort('balance')}
                          className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          Balance
                          {sortField === 'balance' && (
                            <span className={sortDirection === 'desc' ? 'rotate-180' : ''}>
                              <ChevronDownIcon />
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {sortedInvoices.map(invoice => (
                      <InvoiceTableRow
                        key={invoice.id}
                        invoice={invoice}
                        invoiceTypes={invoiceTypes}
                        paymentMethods={paymentMethods}
                        onRecordPayment={() => handleRecordPaymentClick(invoice)}
                        onViewLinkedEntity={() => onViewLinkedEntity?.(invoice.linkedEntityType, invoice.linkedEntityId)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              {sortedInvoices.length === 0 && (
                <div className="px-4 py-12 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No invoices found matching your criteria
                  </p>
                </div>
              )}
              <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Showing {sortedInvoices.length} of {invoices.length} invoices
                </p>
              </div>
            </>
          ) : (
            /* Payments Tab */
            <PaymentsTable
              payments={payments}
              paymentMethods={paymentMethods}
              onViewInvoice={handleViewInvoice}
            />
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={showPaymentModal}
        invoiceDescription={selectedInvoice?.description || ''}
        invoiceBalance={selectedInvoice?.balance || 0}
        paymentMethods={paymentMethods}
        onClose={() => {
          setShowPaymentModal(false)
          setSelectedInvoice(null)
        }}
        onSubmit={handlePaymentSubmit}
      />
    </div>
  )
}
