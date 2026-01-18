/**
 * Forecasting Calculations
 * Utility functions for sales forecasting, accuracy metrics, and demand planning
 */

export interface SalesDataPoint {
  date: string
  unitsSold: number
}

export interface ForecastAccuracyResult {
  mape: number // Mean Absolute Percentage Error
  mae: number // Mean Absolute Error
  rmse: number // Root Mean Square Error
  bias: number // Forecast bias (positive = over-forecasting)
  accuracy: number // 100 - MAPE (capped at 0-100)
  confidence: 'high' | 'medium' | 'low'
  sampleSize: number
}

/**
 * Calculate Mean Absolute Percentage Error (MAPE)
 * MAPE = (1/n) * Σ |actual - forecast| / |actual| * 100
 *
 * @param actuals - Array of actual sales values
 * @param forecasts - Array of forecasted values (same length as actuals)
 * @returns MAPE as a percentage (e.g., 15.5 means 15.5% error)
 */
export function calculateMAPE(actuals: number[], forecasts: number[]): number {
  if (actuals.length !== forecasts.length || actuals.length === 0) {
    return 0
  }

  // Filter out zero actuals to avoid division by zero
  const validPairs = actuals
    .map((actual, i) => ({ actual, forecast: forecasts[i] }))
    .filter(pair => pair.actual !== 0)

  if (validPairs.length === 0) {
    return 0
  }

  const sumAPE = validPairs.reduce((sum, { actual, forecast }) => {
    return sum + Math.abs(actual - forecast) / Math.abs(actual)
  }, 0)

  return (sumAPE / validPairs.length) * 100
}

/**
 * Calculate Mean Absolute Error (MAE)
 * MAE = (1/n) * Σ |actual - forecast|
 */
export function calculateMAE(actuals: number[], forecasts: number[]): number {
  if (actuals.length !== forecasts.length || actuals.length === 0) {
    return 0
  }

  const sumAE = actuals.reduce((sum, actual, i) => {
    return sum + Math.abs(actual - forecasts[i])
  }, 0)

  return sumAE / actuals.length
}

/**
 * Calculate Root Mean Square Error (RMSE)
 * RMSE = √((1/n) * Σ (actual - forecast)²)
 */
export function calculateRMSE(actuals: number[], forecasts: number[]): number {
  if (actuals.length !== forecasts.length || actuals.length === 0) {
    return 0
  }

  const sumSE = actuals.reduce((sum, actual, i) => {
    const error = actual - forecasts[i]
    return sum + error * error
  }, 0)

  return Math.sqrt(sumSE / actuals.length)
}

/**
 * Calculate forecast bias (mean error)
 * Positive bias = over-forecasting, negative = under-forecasting
 */
export function calculateBias(actuals: number[], forecasts: number[]): number {
  if (actuals.length !== forecasts.length || actuals.length === 0) {
    return 0
  }

  const sumError = actuals.reduce((sum, actual, i) => {
    return sum + (forecasts[i] - actual)
  }, 0)

  return sumError / actuals.length
}

/**
 * Calculate all forecast accuracy metrics
 */
export function calculateForecastAccuracy(
  actuals: number[],
  forecasts: number[]
): ForecastAccuracyResult {
  const mape = calculateMAPE(actuals, forecasts)
  const mae = calculateMAE(actuals, forecasts)
  const rmse = calculateRMSE(actuals, forecasts)
  const bias = calculateBias(actuals, forecasts)
  const accuracy = Math.max(0, Math.min(100, 100 - mape))

  // Determine confidence based on MAPE and sample size
  let confidence: 'high' | 'medium' | 'low' = 'medium'
  if (actuals.length >= 30 && mape <= 20) {
    confidence = 'high'
  } else if (actuals.length < 14 || mape > 40) {
    confidence = 'low'
  }

  return {
    mape,
    mae,
    rmse,
    bias,
    accuracy,
    confidence,
    sampleSize: actuals.length,
  }
}

/**
 * Calculate daily rate from sales history using simple moving average
 */
export function calculateDailyRate(
  salesHistory: SalesDataPoint[],
  days: number = 30
): number {
  if (salesHistory.length === 0) return 0

  // Sort by date descending and take the most recent days
  const sorted = [...salesHistory].sort((a, b) => b.date.localeCompare(a.date))
  const recent = sorted.slice(0, days)

  if (recent.length === 0) return 0

  const totalUnits = recent.reduce((sum, day) => sum + day.unitsSold, 0)
  return totalUnits / recent.length
}

/**
 * Calculate weighted moving average (more recent data has higher weight)
 */
export function calculateWeightedDailyRate(
  salesHistory: SalesDataPoint[],
  days: number = 30
): number {
  if (salesHistory.length === 0) return 0

  // Sort by date descending
  const sorted = [...salesHistory].sort((a, b) => b.date.localeCompare(a.date))
  const recent = sorted.slice(0, days)

  if (recent.length === 0) return 0

  // Linear weights: most recent day gets weight n, oldest gets weight 1
  let weightedSum = 0
  let totalWeight = 0

  recent.forEach((day, index) => {
    const weight = recent.length - index // Higher weight for more recent
    weightedSum += day.unitsSold * weight
    totalWeight += weight
  })

  return weightedSum / totalWeight
}

/**
 * Detect seasonality patterns from historical data
 * Returns an array of 12 multipliers (one per month)
 */
export function detectSeasonality(
  salesHistory: SalesDataPoint[],
  minYearsData: number = 1
): number[] {
  const defaultMultipliers = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]

  if (salesHistory.length < minYearsData * 365) {
    return defaultMultipliers
  }

  // Group sales by month
  const monthlyTotals: Record<number, { total: number; count: number }> = {}
  for (let i = 0; i < 12; i++) {
    monthlyTotals[i] = { total: 0, count: 0 }
  }

  salesHistory.forEach((day) => {
    const month = new Date(day.date).getMonth()
    monthlyTotals[month].total += day.unitsSold
    monthlyTotals[month].count++
  })

  // Calculate monthly averages
  const monthlyAverages = Object.values(monthlyTotals).map((m) =>
    m.count > 0 ? m.total / m.count : 0
  )

  // Calculate overall average
  const overallAverage =
    monthlyAverages.reduce((sum, avg) => sum + avg, 0) / 12

  if (overallAverage === 0) {
    return defaultMultipliers
  }

  // Calculate multipliers
  return monthlyAverages.map((avg) =>
    Math.max(0.5, Math.min(2.0, avg / overallAverage))
  )
}

/**
 * Calculate trend rate (month-over-month growth)
 */
export function calculateTrendRate(
  salesHistory: SalesDataPoint[],
  lookbackMonths: number = 6
): number {
  if (salesHistory.length < 60) return 0 // Need at least 2 months of data

  // Sort by date
  const sorted = [...salesHistory].sort((a, b) => a.date.localeCompare(b.date))

  // Group by month
  const monthlyData: Record<string, number> = {}
  sorted.forEach((day) => {
    const monthKey = day.date.substring(0, 7) // YYYY-MM
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = 0
    }
    monthlyData[monthKey] += day.unitsSold
  })

  const months = Object.keys(monthlyData).sort()
  if (months.length < 2) return 0

  // Take the most recent months
  const recentMonths = months.slice(-lookbackMonths)
  if (recentMonths.length < 2) return 0

  // Calculate average month-over-month growth rate
  let growthRates: number[] = []
  for (let i = 1; i < recentMonths.length; i++) {
    const prev = monthlyData[recentMonths[i - 1]]
    const curr = monthlyData[recentMonths[i]]
    if (prev > 0) {
      growthRates.push((curr - prev) / prev)
    }
  }

  if (growthRates.length === 0) return 0

  // Return average growth rate, capped at -20% to +20%
  const avgGrowth = growthRates.reduce((sum, r) => sum + r, 0) / growthRates.length
  return Math.max(-0.2, Math.min(0.2, avgGrowth))
}

/**
 * Generate forecast values for a given period
 */
export function generateForecast(
  baseRate: number,
  seasonalMultipliers: number[],
  trendRate: number,
  startDate: Date,
  days: number
): { date: string; forecast: number }[] {
  const forecasts: { date: string; forecast: number }[] = []

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)

    const month = date.getMonth()
    const monthsFromStart = Math.floor(i / 30)

    const seasonalMultiplier = seasonalMultipliers[month] || 1
    const trendMultiplier = Math.pow(1 + trendRate, monthsFromStart)

    const forecast = baseRate * seasonalMultiplier * trendMultiplier

    forecasts.push({
      date: date.toISOString().split('T')[0],
      forecast: Math.round(forecast * 100) / 100,
    })
  }

  return forecasts
}

/**
 * Backtest a forecast model against historical data
 * Uses walk-forward validation
 */
export function backtestForecast(
  salesHistory: SalesDataPoint[],
  baseRate: number,
  seasonalMultipliers: number[],
  trendRate: number,
  testDays: number = 30
): ForecastAccuracyResult {
  if (salesHistory.length <= testDays) {
    return {
      mape: 0,
      mae: 0,
      rmse: 0,
      bias: 0,
      accuracy: 0,
      confidence: 'low',
      sampleSize: 0,
    }
  }

  // Sort by date ascending
  const sorted = [...salesHistory].sort((a, b) => a.date.localeCompare(b.date))

  // Use the last testDays as test set
  const testSet = sorted.slice(-testDays)

  // Generate forecasts for the test period
  const startDate = new Date(testSet[0].date)
  const forecasts = generateForecast(
    baseRate,
    seasonalMultipliers,
    trendRate,
    startDate,
    testDays
  )

  // Extract actual and forecast values
  const actuals = testSet.map(d => d.unitsSold)
  const forecastValues = forecasts.map(f => f.forecast)

  return calculateForecastAccuracy(actuals, forecastValues)
}
