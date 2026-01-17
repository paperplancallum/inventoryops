'use client'

import type { FieldChange, ChangeValue, ValueType } from '@/lib/supabase/hooks/useActivityLog'
import { ArrowRight, Check, X } from 'lucide-react'

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDatetime(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase()
  if (statusLower.includes('pass') || statusLower.includes('complete') || statusLower.includes('active') || statusLower.includes('delivered') || statusLower.includes('paid')) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
  }
  if (statusLower.includes('fail') || statusLower.includes('reject') || statusLower.includes('cancel')) {
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }
  if (statusLower.includes('pending') || statusLower.includes('wait') || statusLower.includes('hold') || statusLower.includes('draft')) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  }
  if (statusLower.includes('transit') || statusLower.includes('progress') || statusLower.includes('ship') || statusLower.includes('sent')) {
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
}

function ValueDisplay({ value, valueType }: { value: ChangeValue; valueType: ValueType }) {
  if (value === null || value === '') {
    return <span className="text-slate-400 dark:text-slate-500 italic">empty</span>
  }

  switch (valueType) {
    case 'currency':
      return <span>{formatCurrency(value as number)}</span>
    case 'number':
      return <span>{formatNumber(value as number)}</span>
    case 'date':
      return <span>{formatDate(value as string)}</span>
    case 'datetime':
      return <span>{formatDatetime(value as string)}</span>
    case 'boolean':
      return value ? (
        <Check className="w-4 h-4 text-emerald-500" />
      ) : (
        <X className="w-4 h-4 text-slate-400" />
      )
    case 'status':
      return (
        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(value as string)}`}>
          {value as string}
        </span>
      )
    case 'reference':
      return <span className="text-indigo-600 dark:text-indigo-400">{value as string}</span>
    case 'text':
    default:
      const text = value as string
      if (text.length > 50) {
        return <span title={text}>{text.slice(0, 50)}...</span>
      }
      return <span>{text}</span>
  }
}

interface FieldChangeDisplayProps {
  change: FieldChange
  compact?: boolean
}

export function FieldChangeDisplay({ change, compact = false }: FieldChangeDisplayProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-slate-500 dark:text-slate-400">{change.fieldLabel}:</span>
        <span className="text-red-500/70 dark:text-red-400/70 line-through">
          <ValueDisplay value={change.oldValue} valueType={change.valueType} />
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
        <span className="text-emerald-600 dark:text-emerald-400">
          <ValueDisplay value={change.newValue} valueType={change.valueType} />
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 py-2">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[120px]">
        {change.fieldLabel}
      </span>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-red-500/80 dark:text-red-400/80 line-through">
          <ValueDisplay value={change.oldValue} valueType={change.valueType} />
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
          <ValueDisplay value={change.newValue} valueType={change.valueType} />
        </span>
      </div>
    </div>
  )
}
