import { useState, useMemo } from 'react'
import type { PaymentWithInvoice, PaymentMethodOption } from '@/../product/sections/invoices-and-payments/types'

interface PaymentsTableProps {
  payments: PaymentWithInvoice[]
  paymentMethods: PaymentMethodOption[]
  onViewInvoice?: (invoiceId: string) => void
}

// Icons
const SearchIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const CreditCardIcon = () => (
  <svg className="w-12 h-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
)

export function PaymentsTable({
  payments,
  paymentMethods,
  onViewInvoice,
}: PaymentsTableProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // Sort by date (newest first) and filter by search
  const filteredPayments = useMemo(() => {
    let filtered = [...payments]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(payment => {
        const matchesInvoice = payment.invoiceDescription.toLowerCase().includes(query)
        const matchesReference = payment.reference.toLowerCase().includes(query)
        const matchesMethod = getMethodLabel(payment.method, paymentMethods).toLowerCase().includes(query)
        return matchesInvoice || matchesReference || matchesMethod
      })
    }

    // Sort by date descending (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return filtered
  }, [payments, searchQuery, paymentMethods])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  }

  const getMethodLabel = (methodId: string, methods: PaymentMethodOption[]) => {
    return methods.find(m => m.id === methodId)?.label || methodId
  }

  return (
    <div>
      {/* Search */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search payments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {filteredPayments.length > 0 ? (
        <>
          {/* Table Header */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700">
            <div className="col-span-2">Date</div>
            <div className="col-span-4">Invoice</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-2">Method</div>
            <div className="col-span-2">Reference</div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredPayments.map(payment => (
              <div
                key={payment.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                {/* Date */}
                <div className="col-span-2 flex items-center">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {formatDate(payment.date)}
                  </span>
                </div>

                {/* Invoice */}
                <div className="col-span-4">
                  <button
                    onClick={() => onViewInvoice?.(payment.invoiceId)}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline text-left line-clamp-2"
                  >
                    {payment.invoiceDescription}
                  </button>
                </div>

                {/* Amount */}
                <div className="col-span-2 flex items-center justify-end">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>

                {/* Method */}
                <div className="col-span-2 flex items-center">
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {getMethodLabel(payment.method, paymentMethods)}
                  </span>
                </div>

                {/* Reference */}
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-mono text-xs truncate">
                    {payment.reference}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {filteredPayments.length} of {payments.length} payments
            </p>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="px-4 py-16 text-center">
          <CreditCardIcon />
          <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">
            No payments found
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {searchQuery
              ? 'Try adjusting your search'
              : 'Payments will appear here when recorded against invoices'}
          </p>
        </div>
      )}
    </div>
  )
}
