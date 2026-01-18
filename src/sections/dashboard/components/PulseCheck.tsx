'use client'

import { CheckCircle, AlertTriangle } from 'lucide-react'
import type { PulseCheckProps } from '../types'

export function PulseCheck({ data, onActionClick }: PulseCheckProps) {
  const isAllClear = data.status === 'all_clear'

  return (
    <button
      onClick={onActionClick}
      className={`
        w-full rounded-xl p-6 text-left transition-all
        ${isAllClear
          ? 'bg-lime-50 dark:bg-lime-950/30 hover:bg-lime-100 dark:hover:bg-lime-950/50'
          : 'bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50'
        }
      `}
    >
      <div className="flex items-center gap-4">
        {isAllClear ? (
          <CheckCircle className="h-10 w-10 text-lime-600 dark:text-lime-400" />
        ) : (
          <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
        )}
        <div>
          <p className={`text-xl font-semibold ${
            isAllClear
              ? 'text-lime-900 dark:text-lime-100'
              : 'text-red-900 dark:text-red-100'
          }`}>
            {isAllClear ? 'All clear' : `${data.attentionCount} items need attention`}
          </p>
          <p className={`text-sm ${
            isAllClear
              ? 'text-lime-700 dark:text-lime-300'
              : 'text-red-700 dark:text-red-300'
          }`}>
            {isAllClear
              ? 'No urgent items requiring action'
              : 'Click to view items requiring action'
            }
          </p>
        </div>
      </div>
    </button>
  )
}
