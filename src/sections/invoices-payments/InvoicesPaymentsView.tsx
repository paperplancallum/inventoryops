'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  CreditCard,
} from 'lucide-react'
import { MultiSelectCombobox } from '@/components/ui/MultiSelectCombobox'
import { InvoiceTableRow } from './InvoiceTableRow'
import { PaymentsTable } from './PaymentsTable'
import { RecordPaymentModal } from './RecordPaymentModal'
import { EditMilestonesModal } from './EditMilestonesModal'
import type {
  Invoice,
  PaymentWithInvoice,
  InvoiceTypeOption,
  PaymentMethodOption,
  PaymentStatusOption,
  FinancialSummary,
  NewPayment,
  InvoiceType,
  PaymentStatus,
  LinkedEntityType,
  Brand,
  EditableScheduleItem,
} from './types'

type ActiveTab = 'invoices' | 'payments'

interface InvoicesPaymentsViewProps {
  invoices: Invoice[]
  payments: PaymentWithInvoice[]
  invoiceTypes: InvoiceTypeOption[]
  paymentMethods: PaymentMethodOption[]
  paymentStatuses: PaymentStatusOption[]
  brands: Brand[]
  summary: FinancialSummary
  loading?: boolean
  error?: Error | null
  selectedInvoiceId?: string | null
  onRecordPayment?: (invoiceId: string, payment: NewPayment) => Promise<void>
  onUpdateMilestones?: (invoiceId: string, items: EditableScheduleItem[]) => Promise<boolean>
  onAddPaymentAttachments?: (invoiceId: string, paymentId: string, files: File[]) => Promise<boolean>
  onDeletePayment?: (invoiceId: string, paymentId: string) => Promise<boolean>
  onViewLinkedEntity?: (type: LinkedEntityType, id: string) => void
  onRefresh?: () => void
}

export function InvoicesPaymentsView({
  invoices,
  payments,
  invoiceTypes,
  paymentMethods,
  paymentStatuses,
  brands,
  summary,
  loading = false,
  selectedInvoiceId,
  onRecordPayment,
  onUpdateMilestones,
  onAddPaymentAttachments,
  onDeletePayment,
  onViewLinkedEntity,
}: InvoicesPaymentsViewProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('invoices')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<InvoiceType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all')
  const [brandFilters, setBrandFilters] = useState<string[]>([])
  const [sortField, setSortField] = useState<'date' | 'amount' | 'balance'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [recordingPayment, setRecordingPayment] = useState(false)

  // Edit milestones modal state
  const [showEditMilestonesModal, setShowEditMilestonesModal] = useState(false)
  const [editingMilestonesInvoice, setEditingMilestonesInvoice] = useState<Invoice | null>(null)

  // Clear filters and navigate to correct page for selected invoice
  const hasScrolledRef = useRef(false)
  useEffect(() => {
    if (selectedInvoiceId && !loading && invoices.length > 0 && !hasScrolledRef.current) {
      hasScrolledRef.current = true
      // Clear all filters to ensure the invoice is visible
      setSearchQuery('')
      setTypeFilter('all')
      setStatusFilter('all')
      setBrandFilters([])
      setActiveTab('invoices')

      // Find the index of the selected invoice and calculate which page it's on
      const invoiceIndex = invoices.findIndex(inv => inv.id === selectedInvoiceId)
      if (invoiceIndex !== -1) {
        const targetPage = Math.floor(invoiceIndex / pageSize) + 1
        setCurrentPage(targetPage)
      }

      // Small delay to ensure DOM is ready after page change
      setTimeout(() => {
        const element = document.getElementById(`invoice-${selectedInvoiceId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [selectedInvoiceId, loading, invoices.length, invoices, pageSize])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, typeFilter, statusFilter, brandFilters, sortField, sortDirection])

  // Brand options for the multi-select
  const brandOptions = useMemo(() => {
    return brands.map(b => ({ value: b.id, label: b.name }))
  }, [brands])

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchQuery === '' ||
      invoice.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.linkedEntityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === 'all' || invoice.type === typeFilter
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    const matchesBrand = brandFilters.length === 0 || brandFilters.includes(invoice.brandId || '')

    return matchesSearch && matchesType && matchesStatus && matchesBrand
  })

  // Sort invoices
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    let comparison = 0
    if (sortField === 'date') {
      comparison = new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime()
    } else if (sortField === 'amount') {
      comparison = a.amount - b.amount
    } else if (sortField === 'balance') {
      comparison = a.balance - b.balance
    }
    return sortDirection === 'desc' ? -comparison : comparison
  })

  // Pagination calculations
  const totalPages = Math.ceil(sortedInvoices.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedInvoices = sortedInvoices.slice(startIndex, endIndex)

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('ellipsis')
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis')
      pages.push(totalPages)
    }
    return pages
  }

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

  const handlePaymentSubmit = async (payment: NewPayment) => {
    if (!selectedInvoice || !onRecordPayment) return

    setRecordingPayment(true)
    try {
      await onRecordPayment(selectedInvoice.id, payment)
      setShowPaymentModal(false)
      setSelectedInvoice(null)
    } finally {
      setRecordingPayment(false)
    }
  }

  const handleViewInvoice = (_invoiceId: string) => {
    // Switch to invoices tab and potentially scroll to that invoice
    setActiveTab('invoices')
  }

  const handleViewPayment = (_paymentId: string) => {
    // Switch to payments tab - could add highlighting/scrolling to specific payment
    setActiveTab('payments')
  }

  const handleEditMilestonesClick = (invoice: Invoice) => {
    setEditingMilestonesInvoice(invoice)
    setShowEditMilestonesModal(true)
  }

  const handleMilestonesSave = async (items: EditableScheduleItem[]): Promise<boolean> => {
    if (!editingMilestonesInvoice || !onUpdateMilestones) return false

    const success = await onUpdateMilestones(editingMilestonesInvoice.id, items)
    if (success) {
      setShowEditMilestonesModal(false)
      setEditingMilestonesInvoice(null)
    }
    return success
  }

  const allPaymentStatuses: { id: PaymentStatus | 'all'; label: string }[] = [
    { id: 'all', label: 'All statuses' },
    ...paymentStatuses,
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-slate-600 dark:text-slate-400">Loading invoices...</span>
        </div>
      </div>
    )
  }

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
                <div className="p-1.5 bg-slate-200 dark:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-300">
                  <DollarSign className="w-5 h-5" />
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
                  <CheckCircle className="w-5 h-5" />
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
                  <Clock className="w-5 h-5" />
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
                  <AlertTriangle className="w-5 h-5" />
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
              <FileText className="w-4 h-4" />
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
              <CreditCard className="w-4 h-4" />
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
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
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
                  <Filter className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
                  className="appearance-none pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
                >
                  {allPaymentStatuses.map(status => (
                    <option key={status.id} value={status.id}>{status.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Brand Filter */}
              {brands.length > 0 && (
                <MultiSelectCombobox
                  options={brandOptions}
                  value={brandFilters}
                  onChange={setBrandFilters}
                  placeholder="All brands"
                  searchPlaceholder="Search brands..."
                  countLabel="brands"
                  className="min-w-[160px]"
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
                              <ChevronDown className="w-4 h-4" />
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Invoice
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
                              <ChevronDown className="w-4 h-4" />
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
                              <ChevronDown className="w-4 h-4" />
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
                    {paginatedInvoices.map(invoice => (
                      <InvoiceTableRow
                        key={invoice.id}
                        invoice={invoice}
                        invoiceTypes={invoiceTypes}
                        paymentMethods={paymentMethods}
                        isSelected={invoice.id === selectedInvoiceId}
                        initialExpanded={invoice.id === selectedInvoiceId}
                        onRecordPayment={() => handleRecordPaymentClick(invoice)}
                        onViewLinkedEntity={() => onViewLinkedEntity?.(invoice.linkedEntityType, invoice.linkedEntityId)}
                        onEditMilestones={onUpdateMilestones ? () => handleEditMilestonesClick(invoice) : undefined}
                        onViewPayment={handleViewPayment}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              {sortedInvoices.length === 0 && (
                <div className="px-4 py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    No invoices found
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {searchQuery || typeFilter !== 'all' || statusFilter !== 'all' || brandFilters.length > 0
                      ? 'Try adjusting your filters'
                      : 'Invoices will appear here when created from purchase orders'}
                  </p>
                </div>
              )}
              {/* Pagination Footer */}
              <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {sortedInvoices.length === 0 ? 0 : startIndex + 1} - {Math.min(endIndex, sortedInvoices.length)} of {sortedInvoices.length} invoices
                    {sortedInvoices.length !== invoices.length && (
                      <span className="text-slate-400 dark:text-slate-500"> (filtered from {invoices.length})</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <label htmlFor="pageSize" className="text-sm text-slate-500 dark:text-slate-400">
                      Per page:
                    </label>
                    <select
                      id="pageSize"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="px-2 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    {getPageNumbers().map((page, idx) =>
                      page === 'ellipsis' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 dark:text-slate-500">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Payments Tab */
            <PaymentsTable
              payments={payments}
              paymentMethods={paymentMethods}
              onViewInvoice={handleViewInvoice}
              onAddAttachments={onAddPaymentAttachments}
              onDeletePayment={onDeletePayment}
            />
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {selectedInvoice && (
        <RecordPaymentModal
          isOpen={showPaymentModal}
          invoice={selectedInvoice}
          paymentMethods={paymentMethods}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedInvoice(null)
          }}
          onSubmit={handlePaymentSubmit}
          loading={recordingPayment}
        />
      )}

      {/* Edit Milestones Modal */}
      {editingMilestonesInvoice && (
        <EditMilestonesModal
          isOpen={showEditMilestonesModal}
          invoice={editingMilestonesInvoice}
          onClose={() => {
            setShowEditMilestonesModal(false)
            setEditingMilestonesInvoice(null)
          }}
          onSave={handleMilestonesSave}
        />
      )}
    </div>
  )
}
