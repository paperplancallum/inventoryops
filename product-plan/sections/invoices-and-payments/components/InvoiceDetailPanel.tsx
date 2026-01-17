import type {
  InvoiceDetailPanelProps,
  InvoiceType,
  PaymentStatus,
  PaymentMilestoneTrigger,
  PaymentTriggerStatus,
} from '@/../product/sections/invoices-and-payments/types'

// Icons
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const LinkIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
)

const CreditCardIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
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

const AlertCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

// Style maps
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

const triggerStatusStyles: Record<PaymentTriggerStatus, { bg: string; text: string; icon: React.FC }> = {
  'pending': { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-400', icon: ClockIcon },
  'triggered': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: CheckCircleIcon },
  'overdue': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: AlertCircleIcon },
}

export function InvoiceDetailPanel({
  invoice,
  invoiceTypes,
  paymentMethods,
  isOpen,
  onClose,
  onRecordPayment,
  onViewLinkedEntity,
}: InvoiceDetailPanelProps) {
  if (!isOpen) return null

  const typeStyle = typeColors[invoice.type]
  const statusStyle = statusColors[invoice.status]
  const typeLabel = invoiceTypes.find(t => t.id === invoice.type)?.label || invoice.type

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getMethodLabel = (methodId: string) => {
    return paymentMethods.find(m => m.id === methodId)?.label || methodId
  }

  // Calculate progress
  const progressPercent = invoice.amount > 0 ? (invoice.paidAmount / invoice.amount) * 100 : 0

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-slate-800 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Invoice Details
              </h2>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                {typeLabel}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <XIcon />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Overview Card */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(invoice.date)}</p>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-1">
                  {invoice.description}
                </h3>
                <button
                  onClick={onViewLinkedEntity}
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-1"
                >
                  {invoice.linkedEntityName}
                  <LinkIcon />
                </button>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                {statusLabels[invoice.status]}
              </span>
            </div>

            {/* Amount breakdown */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-600">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  ${invoice.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Paid</p>
                <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                  ${invoice.paidAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Balance</p>
                <p className={`text-lg font-semibold ${invoice.balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  ${invoice.balance.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-right">
                {progressPercent.toFixed(0)}% paid
              </p>
            </div>
          </div>

          {/* Payment Milestones */}
          {invoice.paymentSchedule.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                Payment Milestones
              </h3>
              <div className="space-y-3">
                {invoice.paymentSchedule.map((item, index) => {
                  const triggerStyle = triggerStatusStyles[item.triggerStatus] || triggerStatusStyles.pending
                  const isPaid = item.paidAmount >= item.amount
                  const TriggerIcon = triggerStyle.icon

                  return (
                    <div
                      key={item.id}
                      className={`relative border rounded-lg p-4 ${
                        isPaid
                          ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
                          : item.triggerStatus === 'overdue'
                          ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {/* Milestone number badge */}
                      <div className="absolute -top-2.5 -left-2.5 w-5 h-5 rounded-full bg-slate-600 dark:bg-slate-500 text-white text-xs flex items-center justify-center font-medium">
                        {index + 1}
                      </div>

                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-slate-900 dark:text-white">
                              {item.milestoneName || item.description}
                            </h4>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              ({item.percentage}%)
                            </span>
                          </div>

                          {/* Trigger info */}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${triggerStyle.bg} ${triggerStyle.text}`}>
                              <TriggerIcon />
                              {triggerLabels[item.trigger]}
                            </span>
                            {item.triggerDate && (
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                Triggered: {formatDate(item.triggerDate)}
                              </span>
                            )}
                          </div>

                          {/* Due date */}
                          {item.dueDate && (
                            <p className={`text-sm mt-2 ${
                              item.triggerStatus === 'overdue' && !isPaid
                                ? 'text-red-600 dark:text-red-400 font-medium'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}>
                              Due: {formatDate(item.dueDate)}
                              {item.triggerStatus === 'overdue' && !isPaid && ' (Overdue)'}
                            </p>
                          )}
                          {!item.dueDate && item.triggerStatus === 'pending' && (
                            <p className="text-sm text-slate-400 mt-2">
                              Awaiting {triggerLabels[item.trigger].toLowerCase()}
                            </p>
                          )}
                        </div>

                        {/* Amount */}
                        <div className="text-right">
                          <p className="text-lg font-semibold text-slate-900 dark:text-white">
                            ${item.amount.toLocaleString()}
                          </p>
                          {isPaid ? (
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                              <CheckCircleIcon />
                              Paid {formatDate(item.paidDate)}
                            </p>
                          ) : item.paidAmount > 0 ? (
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                              ${item.paidAmount.toLocaleString()} paid
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Payment History */}
          {invoice.payments.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                Payment History
              </h3>
              <div className="space-y-2">
                {invoice.payments.map(payment => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <CreditCardIcon />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          ${payment.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(payment.date)} • {getMethodLabel(payment.method)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {payment.reference}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Notes */}
          {invoice.notes && (
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Notes
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {invoice.notes}
              </p>
            </section>
          )}

          {/* Creation info */}
          {invoice.creationMethod && (
            <section className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-400">
                Created {invoice.creationMethod === 'manual' ? 'manually' : 'automatically'}
                {invoice.paymentTermsTemplateId && ' using payment terms template'}
              </p>
            </section>
          )}
        </div>

        {/* Footer */}
        {invoice.balance > 0 && onRecordPayment && (
          <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4">
            <button
              onClick={() => onRecordPayment?.({
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                method: 'wire-transfer',
                reference: '',
                attachments: [],
              })}
              className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <CreditCardIcon />
              Record Payment
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
