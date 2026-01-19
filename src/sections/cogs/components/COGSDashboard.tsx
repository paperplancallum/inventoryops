'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  Package,
  DollarSign,
  AlertTriangle,
  Settings,
  FileText,
  ArrowRight,
  RefreshCw,
  BarChart3,
  Layers,
  Table2
} from 'lucide-react'
import type { COGSMonthlySummary, BatchCOGS } from '@/lib/supabase/hooks'

interface COGSDashboardProps {
  monthlySummary: COGSMonthlySummary[]
  recentBatches: BatchCOGS[]
  isLoading: boolean
  error: string | null
  onRefresh: () => void
  unattributedSalesCount: number
}

export function COGSDashboard({
  monthlySummary,
  recentBatches,
  isLoading,
  error,
  onRefresh,
  unattributedSalesCount,
}: COGSDashboardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  // Get current month stats
  const currentMonth = monthlySummary[0]
  const previousMonth = monthlySummary[1]

  // Calculate month-over-month changes
  const revenueChange = currentMonth && previousMonth
    ? ((currentMonth.totalRevenue - previousMonth.totalRevenue) / previousMonth.totalRevenue) * 100
    : 0
  const marginChange = currentMonth && previousMonth
    ? currentMonth.grossMarginPct - previousMonth.grossMarginPct
    : 0

  // Quick action cards
  const quickActions = [
    {
      title: 'COGS Table',
      description: 'Detailed cost breakdown by product',
      icon: Table2,
      href: '/cogs/table',
      color: 'bg-emerald-500',
    },
    {
      title: 'Monthly Reports',
      description: 'View detailed COGS reports by month',
      icon: FileText,
      href: '/cogs/reports',
      color: 'bg-indigo-500',
    },
    {
      title: 'Batch FIFO',
      description: 'Track batch depletion with FIFO',
      icon: Layers,
      href: '/cogs/batch-report',
      color: 'bg-purple-500',
    },
    {
      title: 'Amazon Fees',
      description: 'Manage FBA and inbound fees',
      icon: DollarSign,
      href: '/cogs/fees',
      color: 'bg-amber-500',
    },
    {
      title: 'Inventory Losses',
      description: 'Track damaged and lost inventory',
      icon: AlertTriangle,
      href: '/cogs/losses',
      color: 'bg-red-500',
    },
    {
      title: 'Settings',
      description: 'Configure COGS calculation profiles',
      icon: Settings,
      href: '/cogs/settings',
      color: 'bg-slate-500',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                COGS Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Cost of Goods Sold tracking and analysis
              </p>
            </div>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              {revenueChange !== 0 && (
                <span className={`text-xs font-medium ${revenueChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {revenueChange > 0 ? '+' : ''}{revenueChange.toFixed(1)}%
                </span>
              )}
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">
              {currentMonth ? formatCurrency(currentMonth.totalRevenue) : '$0'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Revenue (this month)</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">
              {currentMonth ? formatCurrency(currentMonth.productCost) : '$0'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Product Cost (this month)</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              {marginChange !== 0 && (
                <span className={`text-xs font-medium ${marginChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {marginChange > 0 ? '+' : ''}{marginChange.toFixed(1)}pp
                </span>
              )}
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">
              {currentMonth ? formatPercent(currentMonth.grossMarginPct) : '0%'}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gross Margin</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <Package className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              {unattributedSalesCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  Action needed
                </span>
              )}
            </div>
            <p className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">
              {currentMonth?.unitsSold || 0}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Units Sold (this month)</p>
          </div>
        </div>

        {/* Unattributed Sales Alert */}
        {unattributedSalesCount > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-amber-800 dark:text-amber-200">
                  {unattributedSalesCount} sales pending COGS attribution
                </h3>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  Some sales have not been attributed to inventory batches. Run FIFO attribution to calculate accurate COGS.
                </p>
              </div>
              <Link
                href="/cogs/batch-report"
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                View
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {quickActions.map(action => (
              <Link
                key={action.href}
                href={action.href}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
              >
                <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {action.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Monthly Summary & Recent Batches */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white">Monthly Summary</h2>
              <Link
                href="/cogs/reports"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {monthlySummary.slice(0, 5).map(month => (
                <div key={month.month} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {month.unitsSold} units sold
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {formatCurrency(month.totalRevenue)}
                    </p>
                    <p className={`text-sm ${month.grossMarginPct >= 30 ? 'text-green-600 dark:text-green-400' : month.grossMarginPct >= 20 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatPercent(month.grossMarginPct)} margin
                    </p>
                  </div>
                </div>
              ))}
              {monthlySummary.length === 0 && (
                <div className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                  No sales data available
                </div>
              )}
            </div>
          </div>

          {/* Recent Batches */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white">Recent Batches</h2>
              <Link
                href="/cogs/batch-report"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {recentBatches.slice(0, 5).map(batch => (
                <div key={batch.batchId} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {batch.batchNumber}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {batch.sku} · {batch.originalQuantity} units
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {formatCurrency(batch.productTotalCost + batch.transferCosts + batch.amazonFeesDirect)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      ${((batch.productTotalCost + batch.transferCosts + batch.amazonFeesDirect) / batch.originalQuantity).toFixed(2)}/unit
                    </p>
                  </div>
                </div>
              ))}
              {recentBatches.length === 0 && (
                <div className="px-5 py-8 text-center text-slate-500 dark:text-slate-400">
                  No batch data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
