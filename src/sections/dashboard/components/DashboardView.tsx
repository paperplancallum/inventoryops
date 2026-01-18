'use client'

import { useRef } from 'react'
import { RefreshCw } from 'lucide-react'
import { PulseCheck } from './PulseCheck'
import { KeyMetricsStrip } from './KeyMetricsStrip'
import { HealthCards } from './HealthCards'
import { ActionNeeded } from './ActionNeeded'
import { WeekTimeline } from './WeekTimeline'
import { QuickActions } from './QuickActions'
import type { DashboardViewProps, ActionItem } from '../types'

export function DashboardView({ data, onNavigate, onRefresh, isRefreshing }: DashboardViewProps) {
  const actionSectionRef = useRef<HTMLDivElement>(null)

  const handlePulseClick = () => {
    if (data.pulseCheck.status === 'needs_attention' && actionSectionRef.current) {
      actionSectionRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleNavigate = (section: string, entityId?: string) => {
    onNavigate?.(section, entityId)
  }

  const handleMetricNavigate = (section: string) => {
    handleNavigate(section, undefined)
  }

  const handleActionItem = (item: ActionItem) => {
    handleNavigate(item.navigateTo, item.entityId)
  }

  const handleQuickAction = (section: string) => {
    // Quick actions should pass 'create' or 'payment' as the entity ID to trigger the create modal
    if (section === 'invoices-and-payments') {
      handleNavigate(section, 'payment')
    } else {
      handleNavigate(section, 'create')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Business overview and urgent actions</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh"
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Pulse Check */}
      <PulseCheck data={data.pulseCheck} onActionClick={handlePulseClick} />

      {/* Key Metrics Strip */}
      <KeyMetricsStrip data={data.keyMetrics} onNavigate={handleMetricNavigate} />

      {/* Health Cards */}
      <HealthCards
        inventoryHealth={data.inventoryHealth}
        cashFlow={data.cashFlow}
        onNavigate={handleMetricNavigate}
      />

      {/* Action Needed */}
      <div ref={actionSectionRef}>
        <ActionNeeded items={data.actionItems} onAction={handleActionItem} />
      </div>

      {/* Week Timeline */}
      <WeekTimeline days={data.timeline} />

      {/* Quick Actions */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
        <QuickActions onNavigate={handleQuickAction} />
      </div>
      <div className="hidden md:block">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Quick Actions</h3>
        <QuickActions onNavigate={handleQuickAction} />
      </div>

      {/* Spacer for mobile fixed quick actions */}
      <div className="h-20 md:hidden" />
    </div>
  )
}
