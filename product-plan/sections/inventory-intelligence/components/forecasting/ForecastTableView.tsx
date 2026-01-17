'use client'

import { useMemo, useState } from 'react'
import { Download, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react'
import type { SalesForecast } from '@/../product/sections/inventory-intelligence/types'

export type ForecastGroupBy = 'product' | 'month' | 'week'

export interface ForecastTableViewProps {
  forecasts: SalesForecast[]
  groupBy: ForecastGroupBy
}

// Flat forecast row structure
interface ForecastRow {
  id: string
  productId: string
  productName: string
  sku: string
  location: string
  monthStart: string      // "1/1/2025"
  month: number           // 1-12
  year: number
  week: number            // ISO week number
  units: number
}

// Utility functions
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function formatNumber(num: number): string {
  return num.toLocaleString('en-US')
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function getMonthName(month: number): string {
  const names = ['January', 'February', 'March', 'April', 'May', 'June',
                 'July', 'August', 'September', 'October', 'November', 'December']
  return names[month - 1] || ''
}

// Calculate monthly forecast
function calculateMonthlyForecast(
  forecast: SalesForecast,
  year: number,
  month: number,
  monthsFromNow: number
): number {
  const daysInMonth = getDaysInMonth(year, month)
  const seasonalMultiplier = forecast.seasonalMultipliers?.[month] ?? 1.0
  const trendMultiplier = Math.pow(1 + (forecast.trendRate ?? 0), monthsFromNow)
  const baseRate = forecast.manualOverride ?? forecast.dailyRate
  return Math.round(baseRate * daysInMonth * seasonalMultiplier * trendMultiplier)
}

// Generate flat forecast rows for all products × 12 months
function generateForecastRows(forecasts: SalesForecast[]): ForecastRow[] {
  const rows: ForecastRow[] = []
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-indexed

  forecasts.forEach(forecast => {
    if (forecast.isEnabled === false) return

    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth + i) % 12
      const year = currentYear + Math.floor((currentMonth + i) / 12)
      const month = monthIndex + 1 // 1-indexed for display
      const date = new Date(year, monthIndex, 1)
      const week = getISOWeek(date)

      rows.push({
        id: `${forecast.id}-${year}-${month}`,
        productId: forecast.productId,
        productName: forecast.productName,
        sku: forecast.sku,
        location: forecast.locationName,
        monthStart: `${month}/${1}/${year}`,
        month,
        year,
        week,
        units: calculateMonthlyForecast(forecast, year, monthIndex, i)
      })
    }
  })

  return rows
}

// Group rows by product
function groupByProduct(rows: ForecastRow[]): Map<string, { label: string; sku: string; rows: ForecastRow[] }> {
  const groups = new Map<string, { label: string; sku: string; rows: ForecastRow[] }>()

  rows.forEach(row => {
    if (!groups.has(row.productId)) {
      groups.set(row.productId, {
        label: row.productName,
        sku: row.sku,
        rows: []
      })
    }
    groups.get(row.productId)!.rows.push(row)
  })

  // Sort rows within each group by date
  groups.forEach(group => {
    group.rows.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })
  })

  return groups
}

// Group rows by year → month
function groupByMonth(rows: ForecastRow[]): Map<number, Map<number, ForecastRow[]>> {
  const yearGroups = new Map<number, Map<number, ForecastRow[]>>()

  rows.forEach(row => {
    if (!yearGroups.has(row.year)) {
      yearGroups.set(row.year, new Map())
    }
    const monthGroups = yearGroups.get(row.year)!
    if (!monthGroups.has(row.month)) {
      monthGroups.set(row.month, [])
    }
    monthGroups.get(row.month)!.push(row)
  })

  // Sort products within each month by name
  yearGroups.forEach(monthGroups => {
    monthGroups.forEach(rows => {
      rows.sort((a, b) => a.productName.localeCompare(b.productName))
    })
  })

  return yearGroups
}

// Group rows by year → week
function groupByWeek(rows: ForecastRow[]): Map<number, Map<number, ForecastRow[]>> {
  const yearGroups = new Map<number, Map<number, ForecastRow[]>>()

  rows.forEach(row => {
    if (!yearGroups.has(row.year)) {
      yearGroups.set(row.year, new Map())
    }
    const weekGroups = yearGroups.get(row.year)!
    if (!weekGroups.has(row.week)) {
      weekGroups.set(row.week, [])
    }
    weekGroups.get(row.week)!.push(row)
  })

  // Sort products within each week by name
  yearGroups.forEach(weekGroups => {
    weekGroups.forEach(rows => {
      rows.sort((a, b) => a.productName.localeCompare(b.productName))
    })
  })

  return yearGroups
}

// Table header row
function TableHeader() {
  return (
    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
        Product
      </th>
      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
        Month Start
      </th>
      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
        Location
      </th>
      <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
        Units
      </th>
      <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
        Month
      </th>
      <th className="px-4 py-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
        Year
      </th>
    </tr>
  )
}

// Data row
function DataRow({ row, index }: { row: ForecastRow; index: number }) {
  return (
    <tr className={index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'}>
      <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300">
        {row.sku}
      </td>
      <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300">
        {row.monthStart}
      </td>
      <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300">
        {row.location}
      </td>
      <td className="px-4 py-2 text-sm text-slate-900 dark:text-white text-right font-medium tabular-nums">
        {formatNumber(row.units)}
      </td>
      <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 text-center">
        {row.month}
      </td>
      <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 text-center">
        {row.year}
      </td>
    </tr>
  )
}

export function ForecastTableView({
  forecasts,
  groupBy
}: ForecastTableViewProps) {
  const [copied, setCopied] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['all']))

  // Generate all forecast rows
  const allRows = useMemo(() => generateForecastRows(forecasts), [forecasts])

  // Toggle group expansion
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupKey)) {
        next.delete(groupKey)
      } else {
        next.add(groupKey)
      }
      return next
    })
  }

  // Expand all groups
  const expandAll = () => {
    const allKeys = new Set<string>(['all'])
    if (groupBy === 'product') {
      const groups = groupByProduct(allRows)
      groups.forEach((_, key) => allKeys.add(`product-${key}`))
    } else if (groupBy === 'month') {
      const groups = groupByMonth(allRows)
      groups.forEach((monthMap, year) => {
        allKeys.add(`year-${year}`)
        monthMap.forEach((_, month) => allKeys.add(`month-${year}-${month}`))
      })
    } else {
      const groups = groupByWeek(allRows)
      groups.forEach((weekMap, year) => {
        allKeys.add(`year-${year}`)
        weekMap.forEach((_, week) => allKeys.add(`week-${year}-${week}`))
      })
    }
    setExpandedGroups(allKeys)
  }

  // Collapse all groups
  const collapseAll = () => {
    setExpandedGroups(new Set())
  }

  // Export functions
  const generateCSVContent = (): string => {
    const lines: string[] = []
    lines.push('Product,SKU,Month Start,Location,Units,Month,Year')
    allRows.forEach(row => {
      lines.push(`"${row.productName}","${row.sku}","${row.monthStart}","${row.location}",${row.units},${row.month},${row.year}`)
    })
    return lines.join('\n')
  }

  const handleExportCSV = () => {
    const csvContent = generateCSVContent()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `forecast-${groupBy}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCopyToClipboard = async () => {
    const lines: string[] = []
    lines.push('Product\tSKU\tMonth Start\tLocation\tUnits\tMonth\tYear')
    allRows.forEach(row => {
      lines.push(`${row.productName}\t${row.sku}\t${row.monthStart}\t${row.location}\t${row.units}\t${row.month}\t${row.year}`)
    })
    const tsvContent = lines.join('\n')

    try {
      await navigator.clipboard.writeText(tsvContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Render grouped by product
  const renderByProduct = () => {
    const groups = groupByProduct(allRows)

    return (
      <div className="space-y-2">
        {Array.from(groups.entries()).map(([productId, group]) => {
          const groupKey = `product-${productId}`
          const isExpanded = expandedGroups.has(groupKey)

          return (
            <div key={productId} className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(groupKey)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                )}
                <span className="font-medium text-slate-900 dark:text-white">
                  {group.label}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  ({group.sku})
                </span>
                <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                  {group.rows.length} rows
                </span>
              </button>

              {/* Group content */}
              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <TableHeader />
                    </thead>
                    <tbody>
                      {group.rows.map((row, idx) => (
                        <DataRow key={row.id} row={row} index={idx} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Render grouped by month (year → month)
  const renderByMonth = () => {
    const yearGroups = groupByMonth(allRows)
    const sortedYears = Array.from(yearGroups.keys()).sort()

    return (
      <div className="space-y-2">
        {sortedYears.map(year => {
          const monthGroups = yearGroups.get(year)!
          const yearKey = `year-${year}`
          const isYearExpanded = expandedGroups.has(yearKey)
          const totalYearRows = Array.from(monthGroups.values()).reduce((sum, rows) => sum + rows.length, 0)

          return (
            <div key={year} className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Year header */}
              <button
                onClick={() => toggleGroup(yearKey)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-150 dark:hover:bg-slate-600/50 transition-colors"
              >
                {isYearExpanded ? (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                )}
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Year
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {year}
                </span>
                <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                  {totalYearRows} rows
                </span>
              </button>

              {/* Month groups */}
              {isYearExpanded && (
                <div className="pl-4 space-y-1 py-1">
                  {Array.from(monthGroups.entries())
                    .sort(([a], [b]) => a - b)
                    .map(([month, rows]) => {
                      const monthKey = `month-${year}-${month}`
                      const isMonthExpanded = expandedGroups.has(monthKey)

                      return (
                        <div key={month} className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden mr-2">
                          {/* Month header */}
                          <button
                            onClick={() => toggleGroup(monthKey)}
                            className="w-full flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            {isMonthExpanded ? (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            )}
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Month
                            </span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {month} ({getMonthName(month)})
                            </span>
                            <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                              {rows.length} rows
                            </span>
                          </button>

                          {/* Month content */}
                          {isMonthExpanded && (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <TableHeader />
                                </thead>
                                <tbody>
                                  {rows.map((row, idx) => (
                                    <DataRow key={row.id} row={row} index={idx} />
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // Render grouped by week (year → week)
  const renderByWeek = () => {
    const yearGroups = groupByWeek(allRows)
    const sortedYears = Array.from(yearGroups.keys()).sort()

    return (
      <div className="space-y-2">
        {sortedYears.map(year => {
          const weekGroups = yearGroups.get(year)!
          const yearKey = `year-${year}`
          const isYearExpanded = expandedGroups.has(yearKey)
          const totalYearRows = Array.from(weekGroups.values()).reduce((sum, rows) => sum + rows.length, 0)

          return (
            <div key={year} className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Year header */}
              <button
                onClick={() => toggleGroup(yearKey)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-150 dark:hover:bg-slate-600/50 transition-colors"
              >
                {isYearExpanded ? (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                )}
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Year
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {year}
                </span>
                <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                  {totalYearRows} rows
                </span>
              </button>

              {/* Week groups */}
              {isYearExpanded && (
                <div className="pl-4 space-y-1 py-1">
                  {Array.from(weekGroups.entries())
                    .sort(([a], [b]) => a - b)
                    .map(([week, rows]) => {
                      const weekKey = `week-${year}-${week}`
                      const isWeekExpanded = expandedGroups.has(weekKey)

                      return (
                        <div key={week} className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden mr-2">
                          {/* Week header */}
                          <button
                            onClick={() => toggleGroup(weekKey)}
                            className="w-full flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            {isWeekExpanded ? (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                            )}
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Week
                            </span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              W{week}
                            </span>
                            <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                              {rows.length} rows
                            </span>
                          </button>

                          {/* Week content */}
                          {isWeekExpanded && (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <TableHeader />
                                </thead>
                                <tbody>
                                  {rows.map((row, idx) => (
                                    <DataRow key={row.id} row={row} index={idx} />
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Expand All
          </button>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <button
            onClick={collapseAll}
            className="px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Collapse All
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Grouped content */}
      {groupBy === 'product' && renderByProduct()}
      {groupBy === 'month' && renderByMonth()}
      {groupBy === 'week' && renderByWeek()}

      {/* Summary */}
      <div className="text-sm text-slate-500 dark:text-slate-400 text-center">
        {allRows.length} forecasts
      </div>
    </div>
  )
}
