import { Plus, ArrowRightLeft, ClipboardCheck, DollarSign } from 'lucide-react'

interface QuickActionsProps {
  onNavigate?: (section: string) => void
}

interface ActionButtonProps {
  icon: React.ReactNode
  label: string
  onClick?: () => void
}

function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

export function QuickActions({ onNavigate }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <ActionButton
        icon={<Plus className="h-4 w-4" />}
        label="New PO"
        onClick={() => onNavigate?.('purchase-orders')}
      />
      <ActionButton
        icon={<ArrowRightLeft className="h-4 w-4" />}
        label="New Transfer"
        onClick={() => onNavigate?.('transfers')}
      />
      <ActionButton
        icon={<ClipboardCheck className="h-4 w-4" />}
        label="Log Inspection"
        onClick={() => onNavigate?.('inspections')}
      />
      <ActionButton
        icon={<DollarSign className="h-4 w-4" />}
        label="Record Payment"
        onClick={() => onNavigate?.('invoices-and-payments')}
      />
    </div>
  )
}
