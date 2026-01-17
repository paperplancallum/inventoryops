'use client'

import type { SalesHistoryEntry } from '@/../product/sections/inventory-intelligence/types'

export interface SimpleForecastChartProps {
  salesHistory: SalesHistoryEntry[]
  forecastDailyRate: number
  seasonalMultipliers: number[]
  trendRate: number
  height?: number
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function SimpleForecastChart({
  salesHistory,
  forecastDailyRate,
  seasonalMultipliers = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  trendRate = 0,
  height = 200
}: SimpleForecastChartProps) {

  // Sort and get last 90 days of history
  const sortedHistory = [...salesHistory]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-90)

  // Generate 120 days of forecast grouped by month
  const lastDate = sortedHistory.length > 0
    ? new Date(sortedHistory[sortedHistory.length - 1].date)
    : new Date()

  // Calculate monthly forecast values
  const forecastMonths: { month: number; year: number; avgRate: number; days: number }[] = []
  let currentDate = new Date(lastDate)
  currentDate.setDate(currentDate.getDate() + 1) // Start from day after last history

  for (let dayOffset = 0; dayOffset < 120; dayOffset++) {
    const date = new Date(lastDate)
    date.setDate(date.getDate() + dayOffset + 1)
    const monthIndex = date.getMonth()
    const year = date.getFullYear()

    // Find or create month entry
    let monthEntry = forecastMonths.find(m => m.month === monthIndex && m.year === year)
    if (!monthEntry) {
      const monthsFromStart = forecastMonths.length
      const seasonalMultiplier = seasonalMultipliers[monthIndex] || 1.0
      const trendMultiplier = Math.pow(1 + trendRate, monthsFromStart)
      const adjustedRate = forecastDailyRate * seasonalMultiplier * trendMultiplier

      monthEntry = { month: monthIndex, year, avgRate: adjustedRate, days: 0 }
      forecastMonths.push(monthEntry)
    }
    monthEntry.days++
  }

  // Chart dimensions
  const padding = { top: 20, right: 16, bottom: 32, left: 40 }
  const width = 700
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Calculate total points for x-axis
  const historyDays = sortedHistory.length
  const forecastDays = 120
  const totalDays = historyDays + forecastDays

  // Calculate max value for y-axis
  const historyValues = sortedHistory.map(h => h.unitsSold)
  const forecastValues = forecastMonths.map(m => m.avgRate)
  const allValues = [...historyValues, ...forecastValues]
  const maxValue = Math.max(...allValues, 1) * 1.15

  const xScale = (dayIndex: number) => (dayIndex / (totalDays - 1)) * chartWidth
  const yScale = (value: number) => chartHeight - (value / maxValue) * chartHeight

  // History line path
  const historyPath = sortedHistory
    .map((point, i) => {
      const x = xScale(i)
      const y = yScale(point.unitsSold)
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  // Forecast stepped path (one segment per month)
  let forecastPath = ''
  let currentDayIndex = historyDays
  forecastMonths.forEach((month, monthIndex) => {
    const startX = xScale(currentDayIndex)
    const endX = xScale(currentDayIndex + month.days)
    const y = yScale(month.avgRate)

    if (monthIndex === 0) {
      // Connect from last history point
      const lastHistoryY = sortedHistory.length > 0
        ? yScale(sortedHistory[sortedHistory.length - 1].unitsSold)
        : y
      forecastPath += `M ${xScale(historyDays - 1)} ${lastHistoryY} `
      forecastPath += `L ${startX} ${y} `
    }
    forecastPath += `L ${endX} ${y} `
    currentDayIndex += month.days
  })

  // Y-axis ticks
  const yTicks = [0, Math.round(maxValue / 2), Math.round(maxValue)]

  // Divider position
  const dividerX = xScale(historyDays - 1)

  // Month labels for forecast
  const monthLabels = forecastMonths.map((month, i) => {
    let dayOffset = 0
    for (let j = 0; j < i; j++) {
      dayOffset += forecastMonths[j].days
    }
    const centerX = xScale(historyDays + dayOffset + month.days / 2)
    return { label: MONTH_NAMES[month.month], x: centerX, rate: month.avgRate }
  })

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ maxHeight: height }}
      >
        <defs>
          <linearGradient id="historyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="forecastGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines */}
          {yTicks.map(tick => (
            <g key={tick}>
              <line
                x1={0}
                y1={yScale(tick)}
                x2={chartWidth}
                y2={yScale(tick)}
                stroke="currentColor"
                strokeOpacity={0.1}
              />
              <text
                x={-8}
                y={yScale(tick)}
                textAnchor="end"
                alignmentBaseline="middle"
                className="text-[10px] fill-slate-400"
              >
                {tick}
              </text>
            </g>
          ))}

          {/* Divider line between history and forecast */}
          <line
            x1={dividerX}
            y1={0}
            x2={dividerX}
            y2={chartHeight}
            stroke="currentColor"
            strokeOpacity={0.2}
            strokeDasharray="4 4"
          />
          <text
            x={dividerX}
            y={-6}
            textAnchor="middle"
            className="text-[9px] fill-slate-400"
          >
            Today
          </text>

          {/* History area fill */}
          {historyPath && sortedHistory.length > 0 && (
            <path
              d={`${historyPath} L ${xScale(historyDays - 1)} ${chartHeight} L 0 ${chartHeight} Z`}
              fill="url(#historyGradient)"
            />
          )}

          {/* History line */}
          <path
            d={historyPath}
            fill="none"
            stroke="rgb(99, 102, 241)"
            strokeWidth={2}
          />

          {/* Forecast area fill */}
          {forecastPath && (
            <path
              d={`${forecastPath} L ${xScale(totalDays - 1)} ${chartHeight} L ${xScale(historyDays - 1)} ${chartHeight} Z`}
              fill="url(#forecastGradient)"
            />
          )}

          {/* Forecast stepped line */}
          <path
            d={forecastPath}
            fill="none"
            stroke="rgb(16, 185, 129)"
            strokeWidth={2}
          />

          {/* Month labels */}
          {monthLabels.map((label, i) => (
            <g key={i}>
              <text
                x={label.x}
                y={chartHeight + 14}
                textAnchor="middle"
                className="text-[9px] fill-slate-500 font-medium"
              >
                {label.label}
              </text>
              <text
                x={label.x}
                y={chartHeight + 24}
                textAnchor="middle"
                className="text-[8px] fill-slate-400"
              >
                {label.rate.toFixed(0)}/day
              </text>
            </g>
          ))}

        </g>
      </svg>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-1 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-indigo-500" />
          <span>History (90 days)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-emerald-500" />
          <span>Forecast (4 months)</span>
        </div>
        {trendRate !== 0 && (
          <div className="flex items-center gap-1.5">
            <span className={trendRate > 0 ? 'text-emerald-600' : 'text-red-600'}>
              {trendRate > 0 ? '↑' : '↓'} {Math.abs(trendRate * 100).toFixed(1)}%/mo
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
