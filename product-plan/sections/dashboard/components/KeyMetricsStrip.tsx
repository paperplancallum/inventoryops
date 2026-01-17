import { FileText, Truck, Calendar, DollarSign } from 'lucide-react'
import type { KeyMetricsStripProps } from '../../../../product/sections/dashboard/types'

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount.toLocaleString()}`
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  onClick?: () => void
}

function MetricCard({ icon, label, value, onClick }: MetricCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-center transition-all hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm"
    >
      <div className="text-slate-500 dark:text-slate-400">{icon}</div>
      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </button>
  )
}

export function KeyMetricsStrip({ data, onNavigate }: KeyMetricsStripProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <MetricCard
        icon={<FileText className="h-5 w-5" />}
        label="Open POs"
        value={data.openPOs}
        onClick={() => onNavigate?.('purchase-orders')}
      />
      <MetricCard
        icon={<Truck className="h-5 w-5" />}
        label="In Transit"
        value={data.inTransit}
        onClick={() => onNavigate?.('transfers')}
      />
      <MetricCard
        icon={<Calendar className="h-5 w-5" />}
        label="Arriving"
        value={data.arriving}
        onClick={() => onNavigate?.('transfers')}
      />
      <MetricCard
        icon={<DollarSign className="h-5 w-5" />}
        label="Owed"
        value={formatCurrency(data.owed)}
        onClick={() => onNavigate?.('invoices-and-payments')}
      />
    </div>
  )
}
