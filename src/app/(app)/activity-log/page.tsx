'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { useActivityLog, type ActivityEntityType } from '@/lib/supabase/hooks'
import { ActivityLogView } from '@/sections/activity-log/components'

// Entity type to route mapping
const ENTITY_ROUTES: Record<ActivityEntityType, (id: string) => string> = {
  product: (id) => `/catalog?product=${id}`,
  supplier: (id) => `/suppliers?supplier=${id}`,
  purchase_order: (id) => `/purchase-orders/${id}`,
  batch: (id) => `/inventory?batch=${id}`,
  transfer: (id) => `/transfers?transfer=${id}`,
  inspection: (id) => `/inspections/${id}`,
  location: (id) => `/locations?location=${id}`,
  invoice: (id) => `/invoices-and-payments?invoice=${id}`,
  payment: (id) => `/invoices-and-payments?payment=${id}`,
  brand: (id) => `/catalog?brand=${id}`,
  shipping_agent: (id) => `/transfers?agent=${id}`,
  setting: () => '/settings',
}

export default function ActivityLogPage() {
  const router = useRouter()
  const {
    entries,
    loading,
    error,
    filters,
    summary,
    hasMore,
    uniqueUsers,
    updateFilters,
    resetFilters,
    applyDatePreset,
    loadMore,
    downloadCSV,
  } = useActivityLog()

  // Handle navigation to entity
  const handleViewEntity = useCallback((entityType: ActivityEntityType, entityId: string) => {
    const getRoute = ENTITY_ROUTES[entityType]
    if (getRoute) {
      router.push(getRoute(entityId))
    }
  }, [router])

  // Handle CSV export
  const handleExport = useCallback(async () => {
    try {
      await downloadCSV()
    } catch (err) {
      console.error('Export failed:', err)
      // Could add toast notification here
    }
  }, [downloadCSV])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400">Failed to load activity log</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <ActivityLogView
      entries={entries}
      filters={filters}
      summary={summary}
      users={uniqueUsers}
      isLoading={loading}
      hasMore={hasMore}
      onFiltersChange={updateFilters}
      onResetFilters={resetFilters}
      onApplyDatePreset={applyDatePreset}
      onLoadMore={loadMore}
      onExport={handleExport}
      onViewEntity={handleViewEntity}
    />
  )
}
