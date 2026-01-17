'use client'

import { RefreshCw } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  onRefresh?: () => void
  loading?: boolean
  children?: React.ReactNode // For action buttons on the right
}

export function PageHeader({
  title,
  description,
  onRefresh,
  loading = false,
  children,
}: PageHeaderProps) {
  return (
    <div className="bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
      <div className="px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900 dark:text-white">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                {description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-2 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}

            {/* Action buttons slot */}
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
