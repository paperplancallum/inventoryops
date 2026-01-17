'use client'

import { ShoppingCart, MapPin, AlertTriangle, CheckCircle, Info, Calculator } from 'lucide-react'
import type { POTimelineProps, ShippingRoute, StockoutGapMetric, ReasoningItem } from '@/../product/sections/inventory-intelligence/types'

const methodLabels: Record<string, string> = {
  ground: 'Ground',
  air: 'Air',
  sea: 'Sea',
  express: 'Express',
  rail: 'Rail',
}

// Extract warehouse name from route name (e.g., "Shenzhen Factory to FlexPort LA Ocean" → "FlexPort LA")
function extractWarehouseName(routeName: string | null): string {
  if (!routeName) return 'Warehouse'
  const match = routeName.match(/to\s+(.+?)\s+(Ocean|Air|Ground|Express|Rail|Sea)?$/i)
  if (match) {
    return match[1].trim()
  }
  return 'Warehouse'
}

// Find the default route from warehouse to Amazon destination
function findWarehouseToAmazonRoute(
  routes: ShippingRoute[] | undefined,
  warehouseName: string,
  destinationLocationId: string
): ShippingRoute | undefined {
  if (!routes) return undefined

  return routes.find(r =>
    r.toLocationId === destinationLocationId &&
    r.fromLocationName.toLowerCase().includes(warehouseName.toLowerCase().split(' ')[0]) &&
    r.isDefault
  ) || routes.find(r =>
    r.toLocationId === destinationLocationId &&
    r.fromLocationName.toLowerCase().includes(warehouseName.toLowerCase().split(' ')[0])
  )
}

// Calculate the stockout gap metric
function calculateStockoutGap(
  suggestion: POTimelineProps['suggestion'],
  routes?: ShippingRoute[]
): StockoutGapMetric {
  const today = new Date()

  // Calculate total lead time
  const productionDays = suggestion.supplierLeadTimeDays || 30
  const supplierTransitDays = suggestion.routeTransitDays || 21
  const warehouseName = extractWarehouseName(suggestion.routeName)
  const warehouseToAmazonRoute = findWarehouseToAmazonRoute(
    routes,
    warehouseName,
    suggestion.destinationLocationId
  )
  const amazonTransitDays = warehouseToAmazonRoute?.transitDays.typical || 3

  const totalLeadTimeDays = productionDays + supplierTransitDays + amazonTransitDays

  // Calculate arrival date
  const arrivalDate = new Date(today.getTime() + totalLeadTimeDays * 24 * 60 * 60 * 1000)

  // Calculate stockout date
  const stockoutDate = suggestion.stockoutDate
    ? new Date(suggestion.stockoutDate)
    : null

  // Calculate gap (positive = stockout before arrival = bad)
  let gapDays = 0
  let willStockOut = false

  if (stockoutDate) {
    gapDays = Math.ceil((arrivalDate.getTime() - stockoutDate.getTime()) / (24 * 60 * 60 * 1000))
    willStockOut = gapDays > 0
  }

  // Calculate projected stock on arrival
  const stockDepletionDuringWait = Math.round(suggestion.dailySalesRate * totalLeadTimeDays)
  const currentStockOnArrival = Math.max(0, suggestion.currentStock - stockDepletionDuringWait)
  const projectedStockOnArrival = currentStockOnArrival + suggestion.recommendedQty

  // Calculate coverage after arrival
  const coverageAfterArrival = suggestion.dailySalesRate > 0
    ? Math.round(projectedStockOnArrival / suggestion.dailySalesRate)
    : 0

  return {
    stockoutDate,
    arrivalDate,
    gapDays,
    willStockOut,
    totalLeadTimeDays,
    projectedStockOnArrival,
    coverageAfterArrival
  }
}

// Filter reasoning items to top 3 by priority
function getTopReasoningItems(items: ReasoningItem[], maxCount: number = 3): ReasoningItem[] {
  // Priority 1: Stockout/lead time warnings
  const stockoutItems = items.filter(i =>
    i.type === 'warning' &&
    (i.message.toLowerCase().includes('stockout') ||
     i.message.toLowerCase().includes('lead time') ||
     i.message.toLowerCase().includes('must order'))
  )

  // Priority 2: Safety stock warnings
  const safetyItems = items.filter(i =>
    i.type === 'warning' &&
    i.message.toLowerCase().includes('safety') &&
    !stockoutItems.includes(i)
  )

  // Priority 3: Key calculations (lead time, coverage)
  const keyCalculations = items.filter(i =>
    i.type === 'calculation' &&
    (i.message.toLowerCase().includes('lead time') ||
     i.message.toLowerCase().includes('coverage') ||
     i.message.toLowerCase().includes('days'))
  )

  // Priority 4: Other warnings
  const otherWarnings = items.filter(i =>
    i.type === 'warning' &&
    !stockoutItems.includes(i) &&
    !safetyItems.includes(i)
  )

  return [...stockoutItems, ...safetyItems, ...keyCalculations, ...otherWarnings].slice(0, maxCount)
}

// Format date consistently
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function POTimeline({ suggestion, routes }: POTimelineProps) {
  const gap = calculateStockoutGap(suggestion, routes)
  const topReasons = getTopReasoningItems(suggestion.reasoning, 3)

  const today = new Date()
  const productionDays = suggestion.supplierLeadTimeDays || 30
  const supplierTransitDays = suggestion.routeTransitDays || 21

  // Determine status colors
  const getStatusColor = () => {
    if (gap.willStockOut) return 'critical'
    if (gap.gapDays > -7) return 'warning' // Arrives less than 7 days before stockout
    return 'healthy'
  }

  const status = getStatusColor()

  // Calculate bar percentages for stock projection
  const maxStock = Math.max(gap.projectedStockOnArrival * 1.2, suggestion.safetyStockThreshold * 2)
  const currentPercent = Math.min(100, (suggestion.currentStock / maxStock) * 100)
  const projectedPercent = Math.min(100, (gap.projectedStockOnArrival / maxStock) * 100)
  const safetyPercent = Math.min(100, (suggestion.safetyStockThreshold / maxStock) * 100)

  return (
    <div className="space-y-4">
      {/* Hero Metric: Stockout Gap Banner */}
      <div className={`rounded-lg p-4 ${
        status === 'critical'
          ? 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
          : status === 'warning'
            ? 'bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
            : 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          {status === 'critical' || status === 'warning' ? (
            <AlertTriangle className={`h-5 w-5 ${
              status === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
            }`} />
          ) : (
            <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          )}
          <span className={`font-semibold ${
            status === 'critical'
              ? 'text-red-900 dark:text-red-100'
              : status === 'warning'
                ? 'text-amber-900 dark:text-amber-100'
                : 'text-emerald-900 dark:text-emerald-100'
          }`}>
            {gap.willStockOut
              ? `WILL STOCK OUT ${gap.gapDays} DAYS BEFORE ARRIVAL`
              : gap.stockoutDate
                ? `ARRIVES ${Math.abs(gap.gapDays)} DAYS BEFORE STOCKOUT`
                : 'NO STOCKOUT PROJECTED'
            }
          </span>
        </div>

        <div className={`flex flex-wrap gap-x-4 gap-y-1 text-sm ${
          status === 'critical'
            ? 'text-red-700 dark:text-red-300'
            : status === 'warning'
              ? 'text-amber-700 dark:text-amber-300'
              : 'text-emerald-700 dark:text-emerald-300'
        }`}>
          {gap.stockoutDate && (
            <span>Stockout: <strong>{formatDate(gap.stockoutDate)}</strong></span>
          )}
          <span>Arrives: <strong>{formatDate(gap.arrivalDate)}</strong></span>
          {gap.stockoutDate && (
            <span>Gap: <strong>{Math.abs(gap.gapDays)} days</strong></span>
          )}
        </div>
      </div>

      {/* Simplified Single Timeline */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-4">Journey</h4>

        {/* Desktop: Horizontal */}
        <div className="hidden sm:flex items-center justify-between">
          {/* Order Placed */}
          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <p className="mt-2 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Order</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(today)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-24 text-center truncate">
              {suggestion.supplierName}
            </p>
          </div>

          {/* Timeline Line with Duration */}
          <div className="flex-1 mx-4 relative">
            <div className="h-0.5 bg-slate-300 dark:bg-slate-600 w-full" />
            <div className="absolute inset-x-0 -top-3 flex justify-center">
              <span className="bg-white dark:bg-slate-800 px-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                {gap.totalLeadTimeDays} days via {methodLabels[suggestion.routeMethod || 'sea']}
              </span>
            </div>
            <div className="absolute inset-x-0 top-2 flex justify-center">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({productionDays}d production + {supplierTransitDays}d shipping)
              </span>
            </div>
          </div>

          {/* Arrives At */}
          <div className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <MapPin className="h-6 w-6" />
            </div>
            <p className="mt-2 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Arrives</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{formatDate(gap.arrivalDate)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {suggestion.destinationLocationName}
            </p>
          </div>
        </div>

        {/* Mobile: Compact */}
        <div className="sm:hidden space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Order · {formatDate(today)}
              </p>
              <p className="text-xs text-slate-500">{suggestion.supplierName}</p>
            </div>
          </div>

          <div className="ml-5 pl-4 border-l-2 border-slate-200 dark:border-slate-700 py-1">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {gap.totalLeadTimeDays} days via {methodLabels[suggestion.routeMethod || 'sea']}
            </p>
            <p className="text-xs text-slate-500">
              {productionDays}d production + {supplierTransitDays}d shipping
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Arrives · {formatDate(gap.arrivalDate)}
              </p>
              <p className="text-xs text-slate-500">{suggestion.destinationLocationName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Reasoning Items */}
      {topReasons.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Why This Matters</h4>
          <div className="space-y-2">
            {topReasons.map((item, index) => {
              const Icon = item.type === 'warning'
                ? AlertTriangle
                : item.type === 'calculation'
                  ? Calculator
                  : Info

              const bgColor = item.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-900/20'
                : item.type === 'calculation'
                  ? 'bg-slate-50 dark:bg-slate-700/50'
                  : 'bg-indigo-50 dark:bg-indigo-900/20'

              const iconColor = item.type === 'warning'
                ? 'text-amber-500'
                : item.type === 'calculation'
                  ? 'text-slate-500'
                  : 'text-indigo-500'

              return (
                <div
                  key={index}
                  className={`flex items-start gap-2 rounded-lg p-2.5 ${bgColor}`}
                >
                  <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {item.message}
                    </span>
                    {item.value && (
                      <span className="text-sm font-medium text-slate-900 dark:text-white ml-1">
                        {item.value}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Simplified Stock Projection Bar */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
        <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Projected Stock</h4>

        {/* Stock transition */}
        <div className="flex items-center gap-2 mb-3 text-sm">
          <span className="text-slate-500 dark:text-slate-400">Current:</span>
          <span className="font-mono font-medium text-slate-900 dark:text-white">
            {suggestion.currentStock.toLocaleString()}
          </span>
          <span className="text-slate-400 mx-1">→</span>
          <span className="text-slate-500 dark:text-slate-400">On Arrival:</span>
          <span className={`font-mono font-medium ${
            status === 'critical'
              ? 'text-red-600 dark:text-red-400'
              : status === 'warning'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {gap.projectedStockOnArrival.toLocaleString()}
          </span>
        </div>

        {/* Visual bar */}
        <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-700">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all ${
              status === 'critical'
                ? 'bg-red-500'
                : status === 'warning'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            }`}
            style={{ width: `${projectedPercent}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 bg-slate-900/20 dark:bg-white/20"
            style={{ width: `${currentPercent}%` }}
          />
          <div
            className="absolute inset-y-0 w-0.5 bg-slate-600 dark:bg-slate-300"
            style={{ left: `${safetyPercent}%` }}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
          <span>0</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-slate-600 dark:bg-slate-300 rounded-full" />
            Safety: {suggestion.safetyStockThreshold.toLocaleString()}
          </span>
          <span>{Math.round(maxStock).toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}
