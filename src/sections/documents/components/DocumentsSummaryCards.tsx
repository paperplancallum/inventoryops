import type { DocumentsSummary } from '../types'
import { FileText, ClipboardCheck, Truck, Calendar } from 'lucide-react'

export interface DocumentsSummaryCardsProps {
  summary: DocumentsSummary
}

export function DocumentsSummaryCards({ summary }: DocumentsSummaryCardsProps) {
  const cards = [
    {
      label: 'Total Documents',
      value: summary.total,
      icon: FileText,
      color: 'text-stone-600 dark:text-stone-400',
      bgColor: 'bg-stone-100 dark:bg-stone-800',
    },
    {
      label: 'Purchase Orders',
      value: summary.purchaseOrders,
      icon: FileText,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    },
    {
      label: 'Inspection Briefs',
      value: summary.inspections,
      icon: ClipboardCheck,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    },
    {
      label: 'Transfer Documents',
      value: summary.transfers,
      icon: Truck,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      label: 'This Month',
      value: summary.thisMonth,
      icon: Calendar,
      color: 'text-lime-600 dark:text-lime-400',
      bgColor: 'bg-lime-100 dark:bg-lime-900/30',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700 p-4"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
                {card.value}
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-400">{card.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
