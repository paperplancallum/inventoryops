'use client'

import { Calendar, Warehouse, Truck, MapPin, Package, CheckCircle, AlertTriangle } from 'lucide-react'
import type { TransferTimelineProps } from '@/../product/sections/inventory-intelligence/types'

const methodLabels: Record<string, string> = {
  ground: 'Ground',
  air: 'Air',
  sea: 'Sea',
  express: 'Express',
  rail: 'Rail',
}

export function TransferTimeline({ suggestion }: TransferTimelineProps) {
  const today = new Date()
  const transitDays = suggestion.routeTransitDays || 3
  const arrivalDate = suggestion.estimatedArrival
    ? new Date(suggestion.estimatedArrival)
    : new Date(today.getTime() + transitDays * 24 * 60 * 60 * 1000)

  // Calculate projected stock on arrival
  // Stock depletes by dailySalesRate each day during transit
  const stockDepletionDuringTransit = Math.round(suggestion.dailySalesRate * transitDays)
  const currentStockOnArrival = Math.max(0, suggestion.currentStock - stockDepletionDuringTransit)
  const projectedStockOnArrival = currentStockOnArrival + suggestion.recommendedQty

  // Calculate days above safety stock
  const unitsAboveSafety = projectedStockOnArrival - suggestion.safetyStockThreshold
  const daysAboveSafety = suggestion.dailySalesRate > 0
    ? Math.round(unitsAboveSafety / suggestion.dailySalesRate)
    : 0

  // Determine health status
  const getHealthStatus = () => {
    if (projectedStockOnArrival <= suggestion.safetyStockThreshold) return 'critical'
    if (daysAboveSafety <= 7) return 'warning'
    return 'healthy'
  }

  const healthStatus = getHealthStatus()

  // Calculate bar percentages for visualization
  const maxStock = Math.max(projectedStockOnArrival * 1.2, suggestion.safetyStockThreshold * 2)
  const currentPercent = Math.min(100, (suggestion.currentStock / maxStock) * 100)
  const projectedPercent = Math.min(100, (projectedStockOnArrival / maxStock) * 100)
  const safetyPercent = Math.min(100, (suggestion.safetyStockThreshold / maxStock) * 100)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <h4 className="text-sm font-medium text-slate-900 dark:text-white">
        Projected Timeline
      </h4>

      {/* Horizontal Timeline */}
      <div className="relative">
        {/* Desktop: Horizontal layout */}
        <div className="hidden sm:block">
          <div className="flex items-start justify-between">
            {/* Today */}
            <div className="flex flex-col items-center w-1/4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <Calendar className="h-5 w-5" />
              </div>
              <p className="mt-2 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Today
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {formatDate(today)}
              </p>
            </div>

            {/* Ships From */}
            <div className="flex flex-col items-center w-1/4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <Warehouse className="h-5 w-5" />
              </div>
              <p className="mt-2 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Ships From
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {suggestion.sourceLocationName || 'Warehouse'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {suggestion.recommendedQty.toLocaleString()} units
              </p>
            </div>

            {/* In Transit */}
            <div className="flex flex-col items-center w-1/4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                <Truck className="h-5 w-5" />
              </div>
              <p className="mt-2 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                In Transit
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {transitDays} day{transitDays !== 1 ? 's' : ''}
              </p>
              {suggestion.routeMethod && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  via {methodLabels[suggestion.routeMethod] || suggestion.routeMethod}
                </p>
              )}
            </div>

            {/* Arrives At */}
            <div className="flex flex-col items-center w-1/4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <MapPin className="h-5 w-5" />
              </div>
              <p className="mt-2 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Arrives At
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {suggestion.destinationLocationName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatDate(arrivalDate)}
              </p>
            </div>
          </div>

          {/* Connecting line */}
          <div className="absolute top-5 left-[12.5%] right-[12.5%] h-0.5 bg-slate-300 dark:bg-slate-600 -z-10" />
        </div>

        {/* Mobile: Vertical layout */}
        <div className="sm:hidden space-y-3">
          {/* Today */}
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Today</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(today)}</p>
            </div>
          </div>

          {/* Ships From */}
          <div className="flex items-center gap-3 ml-4 border-l-2 border-slate-200 pl-4 dark:border-slate-700">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <Warehouse className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Ships From</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {suggestion.sourceLocationName || 'Warehouse'} ({suggestion.recommendedQty.toLocaleString()} units)
              </p>
            </div>
          </div>

          {/* In Transit */}
          <div className="flex items-center gap-3 ml-4 border-l-2 border-slate-200 pl-4 dark:border-slate-700">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">In Transit</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {transitDays} day{transitDays !== 1 ? 's' : ''} via {methodLabels[suggestion.routeMethod || ''] || 'Ground'}
              </p>
            </div>
          </div>

          {/* Arrives At */}
          <div className="flex items-center gap-3 ml-4 border-l-2 border-slate-200 pl-4 dark:border-slate-700">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Arrives At</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {suggestion.destinationLocationName} ({formatDate(arrivalDate)})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Projection Card */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <h5 className="text-sm font-medium text-slate-900 dark:text-white">
            Projected Stock on Arrival
          </h5>
        </div>

        {/* Stock transition */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-slate-500 dark:text-slate-400">Current:</span>
          <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">
            {suggestion.currentStock.toLocaleString()}
          </span>
          <span className="text-slate-400">→</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">On Arrival:</span>
          <span className={`font-mono text-sm font-medium ${
            healthStatus === 'critical'
              ? 'text-red-600 dark:text-red-400'
              : healthStatus === 'warning'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {projectedStockOnArrival.toLocaleString()} units
          </span>
        </div>

        {/* Visual bar */}
        <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-700">
          {/* Projected stock bar */}
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all ${
              healthStatus === 'critical'
                ? 'bg-red-500'
                : healthStatus === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${projectedPercent}%` }}
          />
          {/* Current stock marker (transparent overlay) */}
          <div
            className="absolute inset-y-0 left-0 bg-slate-900/20 dark:bg-white/20"
            style={{ width: `${currentPercent}%` }}
          />
          {/* Safety threshold marker */}
          <div
            className="absolute inset-y-0 w-0.5 bg-slate-600 dark:bg-slate-300"
            style={{ left: `${safetyPercent}%` }}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
          <span>0</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-slate-600 dark:bg-slate-300 rounded-full" />
            Safety: {suggestion.safetyStockThreshold.toLocaleString()}
          </span>
          <span>{Math.round(maxStock).toLocaleString()}</span>
        </div>

        {/* Status message */}
        <div className={`mt-3 flex items-center gap-2 text-sm ${
          healthStatus === 'critical'
            ? 'text-red-600 dark:text-red-400'
            : healthStatus === 'warning'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-emerald-600 dark:text-emerald-400'
        }`}>
          {healthStatus === 'critical' ? (
            <>
              <AlertTriangle className="h-4 w-4" />
              <span>
                {Math.abs(unitsAboveSafety).toLocaleString()} units below safety stock
              </span>
            </>
          ) : healthStatus === 'warning' ? (
            <>
              <AlertTriangle className="h-4 w-4" />
              <span>
                {unitsAboveSafety.toLocaleString()} units above safety stock ({daysAboveSafety} days of cover)
              </span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>
                {unitsAboveSafety.toLocaleString()} units above safety stock ({daysAboveSafety} days of cover)
              </span>
            </>
          )}
        </div>

        {/* Depletion note */}
        {stockDepletionDuringTransit > 0 && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Note: {stockDepletionDuringTransit.toLocaleString()} units will be sold during {transitDays}-day transit
            (at {suggestion.dailySalesRate} units/day)
          </p>
        )}
      </div>
    </div>
  )
}
