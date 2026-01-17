// Calculate Sales Forecasts Edge Function
// This function calculates daily sales rate forecasts based on historical sales data.
// Uses exponential smoothing with seasonal adjustments.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.90.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Minimum number of daily data points required to calculate trend
// We need data spanning at least 2 calendar months to detect meaningful trends
const MIN_DATA_POINTS_FOR_TREND = 60

interface SalesHistoryEntry {
  date: string
  unitsSold: number
  productId: string
  locationId: string
}

interface ForecastResult {
  productId: string
  locationId: string
  dailyRate: number
  confidence: 'high' | 'medium' | 'low'
  accuracyMAPE: number
  seasonalMultipliers: number[]
  trendRate: number
}

// Calculate exponential moving average
function exponentialSmoothing(values: number[], alpha: number = 0.3): number {
  if (values.length === 0) return 0
  let result = values[0]
  for (let i = 1; i < values.length; i++) {
    result = alpha * values[i] + (1 - alpha) * result
  }
  return result
}

// Calculate seasonal multipliers (12 months)
function calculateSeasonalMultipliers(
  sales: SalesHistoryEntry[],
  overallAverage: number
): number[] {
  const monthlyAverages = new Array(12).fill(0)
  const monthlyCounts = new Array(12).fill(0)

  for (const entry of sales) {
    const month = new Date(entry.date).getMonth()
    monthlyAverages[month] += entry.unitsSold
    monthlyCounts[month]++
  }

  // Calculate average per month and normalize to multiplier
  const multipliers: number[] = []
  for (let i = 0; i < 12; i++) {
    if (monthlyCounts[i] > 0 && overallAverage > 0) {
      const monthlyAvg = monthlyAverages[i] / monthlyCounts[i]
      multipliers.push(monthlyAvg / overallAverage)
    } else {
      multipliers.push(1.0) // Default multiplier
    }
  }

  return multipliers
}

// Calculate trend rate (monthly growth rate)
function calculateTrendRate(sales: SalesHistoryEntry[]): number {
  if (sales.length < MIN_DATA_POINTS_FOR_TREND) return 0

  // Group by month
  const monthlyData = new Map<string, number>()
  for (const entry of sales) {
    const monthKey = entry.date.substring(0, 7) // YYYY-MM
    monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + entry.unitsSold)
  }

  const months = Array.from(monthlyData.keys()).sort()
  if (months.length < 2) return 0

  const values = months.map(m => monthlyData.get(m) || 0)

  // Calculate average month-over-month growth rate
  let totalGrowth = 0
  let growthPeriods = 0
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] > 0) {
      totalGrowth += (values[i] - values[i - 1]) / values[i - 1]
      growthPeriods++
    }
  }

  return growthPeriods > 0 ? totalGrowth / growthPeriods : 0
}

// Calculate Mean Absolute Percentage Error
function calculateMAPE(actual: number[], predicted: number[]): number {
  if (actual.length === 0) return 0

  let totalError = 0
  let validCount = 0

  for (let i = 0; i < actual.length; i++) {
    if (actual[i] > 0) {
      totalError += Math.abs((actual[i] - predicted[i]) / actual[i])
      validCount++
    }
  }

  return validCount > 0 ? (totalError / validCount) * 100 : 0
}

// Determine confidence level based on data quality
function determineConfidence(
  dataPointCount: number,
  mape: number,
  varianceCoeff: number
): 'high' | 'medium' | 'low' {
  // High confidence: lots of data, low error, low variance
  if (dataPointCount >= 90 && mape < 20 && varianceCoeff < 0.5) {
    return 'high'
  }
  // Medium confidence: decent data
  if (dataPointCount >= 30 && mape < 40) {
    return 'medium'
  }
  // Low confidence: limited data or high error
  return 'low'
}

// Calculate coefficient of variation
function coefficientOfVariation(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  if (mean === 0) return 0
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  return Math.sqrt(variance) / mean
}

// Main forecast calculation for a product-location pair
function calculateForecast(sales: SalesHistoryEntry[]): ForecastResult | null {
  if (sales.length === 0) return null

  const productId = sales[0].productId
  const locationId = sales[0].locationId

  // Get daily sales values (sorted by date)
  const sortedSales = [...sales].sort((a, b) => a.date.localeCompare(b.date))
  const dailyValues = sortedSales.map(s => s.unitsSold)

  // Calculate basic daily rate using exponential smoothing
  // Weight recent data more heavily
  const recentDays = Math.min(30, dailyValues.length)
  const recentValues = dailyValues.slice(-recentDays)
  const dailyRate = exponentialSmoothing(recentValues, 0.3)

  // Calculate overall average for seasonal comparison
  const overallAverage = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length

  // Calculate seasonal multipliers
  const seasonalMultipliers = calculateSeasonalMultipliers(sales, overallAverage)

  // Calculate trend
  const trendRate = calculateTrendRate(sales)

  // Calculate MAPE for accuracy measurement (use simple moving average as prediction)
  const windowSize = 7
  const predictions: number[] = []
  const actuals: number[] = []
  for (let i = windowSize; i < dailyValues.length; i++) {
    const window = dailyValues.slice(i - windowSize, i)
    predictions.push(window.reduce((a, b) => a + b, 0) / windowSize)
    actuals.push(dailyValues[i])
  }
  const mape = calculateMAPE(actuals, predictions)

  // Calculate variance coefficient
  const varianceCoeff = coefficientOfVariation(recentValues)

  // Determine confidence
  const confidence = determineConfidence(sales.length, mape, varianceCoeff)

  return {
    productId,
    locationId,
    dailyRate: Math.round(dailyRate * 100) / 100,
    confidence,
    accuracyMAPE: Math.round(mape * 100) / 100,
    seasonalMultipliers: seasonalMultipliers.map(m => Math.round(m * 100) / 100),
    trendRate: Math.round(trendRate * 1000) / 1000,
  }
}

async function calculateAllForecasts(supabase: SupabaseClient): Promise<{
  forecasts: ForecastResult[]
  errors: string[]
}> {
  const errors: string[] = []
  const forecasts: ForecastResult[] = []

  try {
    // Fetch sales history (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: salesData, error: salesError } = await supabase
      .from('sales_history')
      .select('product_id, location_id, date, units_sold')
      .gte('date', ninetyDaysAgo)
      .order('date', { ascending: true })

    if (salesError) {
      errors.push(`Failed to fetch sales history: ${salesError.message}`)
      return { forecasts, errors }
    }

    if (!salesData || salesData.length === 0) {
      console.log('No sales history data found')
      return { forecasts, errors }
    }

    // Group sales by product-location
    const salesByProductLocation = new Map<string, SalesHistoryEntry[]>()
    for (const entry of salesData) {
      const key = `${entry.product_id}-${entry.location_id}`
      const existing = salesByProductLocation.get(key) || []
      existing.push({
        date: entry.date,
        unitsSold: entry.units_sold || 0,
        productId: entry.product_id,
        locationId: entry.location_id,
      })
      salesByProductLocation.set(key, existing)
    }

    // Calculate forecast for each product-location pair
    for (const [, sales] of salesByProductLocation) {
      const forecast = calculateForecast(sales)
      if (forecast) {
        forecasts.push(forecast)
      }
    }
  } catch (err) {
    errors.push(`Calculation error: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }

  return { forecasts, errors }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Starting forecast calculation...')

    // Calculate forecasts
    const { forecasts, errors } = await calculateAllForecasts(supabase)

    console.log(`Generated ${forecasts.length} forecasts`)

    // Upsert forecasts (update existing or create new)
    let upsertedCount = 0
    for (const forecast of forecasts) {
      // Check if forecast exists
      const { data: existing } = await supabase
        .from('sales_forecasts')
        .select('id')
        .eq('product_id', forecast.productId)
        .eq('location_id', forecast.locationId)
        .maybeSingle()

      if (existing) {
        // Update existing forecast
        const { error: updateError } = await supabase
          .from('sales_forecasts')
          .update({
            daily_rate: forecast.dailyRate,
            confidence: forecast.confidence,
            accuracy_mape: forecast.accuracyMAPE,
            seasonal_multipliers: forecast.seasonalMultipliers,
            trend_rate: forecast.trendRate,
            last_calculated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (updateError) {
          errors.push(`Failed to update forecast for ${forecast.productId}: ${updateError.message}`)
        } else {
          upsertedCount++
        }
      } else {
        // Fetch product info for new forecast
        const { data: product } = await supabase
          .from('products')
          .select('sku, name')
          .eq('id', forecast.productId)
          .maybeSingle()

        const { data: location } = await supabase
          .from('locations')
          .select('name')
          .eq('id', forecast.locationId)
          .maybeSingle()

        // Insert new forecast
        const { error: insertError } = await supabase
          .from('sales_forecasts')
          .insert({
            product_id: forecast.productId,
            sku: product?.sku || '',
            product_name: product?.name || '',
            location_id: forecast.locationId,
            location_name: location?.name || '',
            daily_rate: forecast.dailyRate,
            confidence: forecast.confidence,
            accuracy_mape: forecast.accuracyMAPE,
            seasonal_multipliers: forecast.seasonalMultipliers,
            trend_rate: forecast.trendRate,
            is_enabled: true,
            last_calculated_at: new Date().toISOString(),
          })

        if (insertError) {
          errors.push(`Failed to insert forecast for ${forecast.productId}: ${insertError.message}`)
        } else {
          upsertedCount++
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        forecastsCalculated: forecasts.length,
        forecastsUpserted: upsertedCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in calculate-forecasts:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
