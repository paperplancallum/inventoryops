import { useState } from 'react'
import type { Invoice, InvoiceTypeOption, InvoiceType, PaymentStatus, PaymentMethodOption, PaymentMilestoneTrigger, PaymentTriggerStatus } from '@/../product/sections/invoices-and-payments/types'

interface InvoiceTableRowProps {
  invoice: Invoice
  invoiceTypes: InvoiceTypeOption[]
  paymentMethods: PaymentMethodOption[]
  onRecordPayment?: () => void
  onViewLinkedEntity?: () => void
}

// Icons
const CreditCardIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
)

const LinkIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const typeColors: Record<InvoiceType, { bg: string; text: string }> = {
  'product': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-300' },
  'shipping': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  'duties': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300' },
  'inspection': { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300' },
  'storage': { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300' },
}

const statusColors: Record<PaymentStatus, { bg: string; text: string; dot: string }> = {
  'unpaid': { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
  'partial': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  'paid': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  'overdue': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
}

const statusLabels: Record<PaymentStatus, string> = {
  'unpaid': 'Unpaid',
  'partial': 'Partial',
  'paid': 'Paid',
  'overdue': 'Overdue',
}

const triggerLabels: Record<PaymentMilestoneTrigger, string> = {
  'po-confirmed': 'PO Confirmed',
  'inspection-passed': 'Inspection Passed',
  'customs-cleared': 'Customs Cleared',
  'shipment-departed': 'Shipment Departed',
  'goods-received': 'Goods Received',
  'manual': 'Manual',
  'upfront': 'Upfront',
}

const triggerStatusColors: Record<PaymentTriggerStatus, { bg: string; text: string }> = {
  'pending': { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-400' },
  'triggered': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300' },
  'overdue': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' },
}

export function InvoiceTableRow({
  invoice,
  invoiceTypes,
  paymentMethods,
  onRecordPayment,
  onViewLinkedEntity,
}: InvoiceTableRowProps) {
  const [expanded, setExpanded] = useState(false)

  const typeStyle = typeColors[invoice.type]
  const statusStyle = statusColors[invoice.status]
  const typeLabel = invoiceTypes.find(t => t.id === invoice.type)?.label || invoice.type

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getMethodLabel = (methodId: string) => {
    return paymentMethods.find(m => m.id === methodId)?.label || methodId
  }

  const hasSchedule = invoice.paymentSchedule.length > 1 || invoice.payments.length > 0

  return (
    <>
      <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
        {/* Date */}
        <td className="px-4 py-3">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {formatDate(invoice.date)}
          </span>
        </td>

        {/* Description */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {hasSchedule && (
              <button
                onClick={() => setExpanded(!expanded)}
                className={`p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-transform ${expanded ? 'rotate-180' : ''}`}
              >
                <ChevronDownIcon />
              </button>
            )}
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              {invoice.description}
            </span>
          </div>
        </td>

        {/* Type */}
        <td className="px-4 py-3">
          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}>
            {typeLabel}
          </span>
        </td>

        {/* Brand */}
        <td className="px-4 py-3">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {invoice.brandName || '—'}
          </span>
        </td>

        {/* Linked Entity */}
        <td className="px-4 py-3">
          <button
            onClick={onViewLinkedEntity}
            className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            {invoice.linkedEntityName}
            <LinkIcon />
          </button>
        </td>

        {/* Amount */}
        <td className="px-4 py-3">
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            ${invoice.amount.toLocaleString()}
          </span>
        </td>

        {/* Paid */}
        <td className="px-4 py-3">
          <span className="text-sm text-emerald-600 dark:text-emerald-400">
            ${invoice.paidAmount.toLocaleString()}
          </span>
        </td>

        {/* Balance */}
        <td className="px-4 py-3">
          <span className={`text-sm font-medium ${invoice.balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
            ${invoice.balance.toLocaleString()}
          </span>
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
            {statusLabels[invoice.status]}
          </span>
        </td>

        {/* Actions */}
        <td className="px-4 py-3">
          <div className="flex items-center justify-end">
            {invoice.balance > 0 ? (
              <button
                onClick={onRecordPayment}
                className="p-1.5 text-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                title="Record Payment"
              >
                <CreditCardIcon />
              </button>
            ) : (
              <span className="w-8" /> // Spacer for alignment
            )}
          </div>
        </td>
      </tr>

      {/* Expanded Payment Schedule */}
      {expanded && hasSchedule && (
        <tr className="bg-slate-50 dark:bg-slate-800/50">
          <td colSpan={10} className="px-4 py-3">
            <div className="ml-8 space-y-3">
              {/* Payment Schedule - Milestone Tracking */}
              {invoice.paymentSchedule.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                    Payment Milestones
                  </p>
                  <div className="space-y-2">
                    {invoice.paymentSchedule.map(item => {
                      const triggerStyle = triggerStatusColors[item.triggerStatus] || triggerStatusColors.pending
                      const isPaid = item.paidAmount >= item.amount

                      return (
                        <div key={item.id} className="flex items-center gap-3 text-sm bg-slate-100/50 dark:bg-slate-700/30 rounded-lg p-2">
                          {/* Status indicator */}
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            isPaid ? 'bg-emerald-500' :
                            item.triggerStatus === 'overdue' ? 'bg-red-500' :
                            item.triggerStatus === 'triggered' ? 'bg-blue-500' :
                            'bg-slate-300 dark:bg-slate-600'
                          }`} />

                          {/* Milestone name & percentage */}
                          <div className="flex-1 min-w-0">
                            <span className="text-slate-900 dark:text-white font-medium">
                              {item.milestoneName || item.description}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 ml-2">
                              ({item.percentage}%)
                            </span>
                          </div>

                          {/* Amount */}
                          <span className="text-slate-900 dark:text-white font-medium w-24 text-right">
                            ${item.amount.toLocaleString()}
                          </span>

                          {/* Trigger badge */}
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${triggerStyle.bg} ${triggerStyle.text}`}>
                            {triggerLabels[item.trigger] || item.trigger}
                          </span>

                          {/* Due date / Trigger status */}
                          <div className="w-32 text-right">
                            {isPaid ? (
                              <span className="text-emerald-600 dark:text-emerald-400 text-xs">
                                Paid {item.paidDate ? formatDate(item.paidDate) : ''}
                              </span>
                            ) : item.dueDate ? (
                              <span className={`text-xs ${item.triggerStatus === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                Due: {formatDate(item.dueDate)}
                              </span>
                            ) : item.triggerStatus === 'pending' ? (
                              <span className="text-slate-400 text-xs">Awaiting trigger</span>
                            ) : item.triggerDate ? (
                              <span className="text-blue-600 dark:text-blue-400 text-xs">
                                Triggered {formatDate(item.triggerDate)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Payment History */}
              {invoice.payments.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                    Payment History
                  </p>
                  <div className="space-y-1">
                    {invoice.payments.map(payment => (
                      <div key={payment.id} className="flex items-center gap-4 text-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-slate-600 dark:text-slate-400 w-40">{formatDate(payment.date)}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium w-24">${payment.amount.toLocaleString()}</span>
                        <span className="text-slate-500 dark:text-slate-400">{getMethodLabel(payment.method)}</span>
                        <span className="text-slate-400 text-xs font-mono">{payment.reference}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
