import { describe, it, expect } from 'vitest'
import {
  calculateMAPE,
  calculateMAE,
  calculateRMSE,
  calculateBias,
  calculateForecastAccuracy,
  calculateDailyRate,
  calculateWeightedDailyRate,
  detectSeasonality,
  calculateTrendRate,
  generateForecast,
  backtestForecast,
  type SalesDataPoint,
} from './calculations'

describe('Forecast Accuracy Metrics', () => {
  describe('calculateMAPE', () => {
    it('should calculate MAPE correctly for simple data', () => {
      const actuals = [100, 200, 300]
      const forecasts = [110, 180, 330]
      // APE: |100-110|/100=0.10, |200-180|/200=0.10, |300-330|/300=0.10
      // MAPE = (0.10 + 0.10 + 0.10) / 3 * 100 = 10%
      const mape = calculateMAPE(actuals, forecasts)
      expect(mape).toBeCloseTo(10, 1)
    })

    it('should return 0 for empty arrays', () => {
      expect(calculateMAPE([], [])).toBe(0)
    })

    it('should return 0 for mismatched array lengths', () => {
      expect(calculateMAPE([100, 200], [100])).toBe(0)
    })

    it('should skip zero actuals to avoid division by zero', () => {
      const actuals = [0, 100, 200]
      const forecasts = [10, 100, 200]
      // Only calculates for non-zero actuals: 100->100 (0%), 200->200 (0%)
      const mape = calculateMAPE(actuals, forecasts)
      expect(mape).toBe(0)
    })

    it('should return 0 when all actuals are zero', () => {
      const actuals = [0, 0, 0]
      const forecasts = [10, 20, 30]
      expect(calculateMAPE(actuals, forecasts)).toBe(0)
    })

    it('should handle perfect forecasts', () => {
      const actuals = [100, 200, 300]
      const forecasts = [100, 200, 300]
      expect(calculateMAPE(actuals, forecasts)).toBe(0)
    })

    it('should handle 100% under-forecast', () => {
      const actuals = [100, 200]
      const forecasts = [0, 0]
      // APE: 100/100 = 1, 200/200 = 1 => MAPE = 100%
      expect(calculateMAPE(actuals, forecasts)).toBe(100)
    })
  })

  describe('calculateMAE', () => {
    it('should calculate MAE correctly', () => {
      const actuals = [100, 200, 300]
      const forecasts = [110, 190, 280]
      // AE: 10, 10, 20 => MAE = 40/3 ≈ 13.33
      const mae = calculateMAE(actuals, forecasts)
      expect(mae).toBeCloseTo(13.33, 1)
    })

    it('should return 0 for empty arrays', () => {
      expect(calculateMAE([], [])).toBe(0)
    })

    it('should return 0 for mismatched lengths', () => {
      expect(calculateMAE([100], [100, 200])).toBe(0)
    })

    it('should handle perfect forecasts', () => {
      expect(calculateMAE([100, 200], [100, 200])).toBe(0)
    })
  })

  describe('calculateRMSE', () => {
    it('should calculate RMSE correctly', () => {
      const actuals = [100, 200, 300]
      const forecasts = [110, 190, 280]
      // SE: 100, 100, 400 => MSE = 600/3 = 200 => RMSE = √200 ≈ 14.14
      const rmse = calculateRMSE(actuals, forecasts)
      expect(rmse).toBeCloseTo(14.14, 1)
    })

    it('should return 0 for empty arrays', () => {
      expect(calculateRMSE([], [])).toBe(0)
    })

    it('should return 0 for mismatched lengths', () => {
      expect(calculateRMSE([100], [])).toBe(0)
    })

    it('should handle perfect forecasts', () => {
      expect(calculateRMSE([100, 200], [100, 200])).toBe(0)
    })
  })

  describe('calculateBias', () => {
    it('should return positive bias for over-forecasting', () => {
      const actuals = [100, 200]
      const forecasts = [120, 220]
      // Errors: 20, 20 => Bias = 40/2 = 20
      expect(calculateBias(actuals, forecasts)).toBe(20)
    })

    it('should return negative bias for under-forecasting', () => {
      const actuals = [100, 200]
      const forecasts = [80, 180]
      // Errors: -20, -20 => Bias = -40/2 = -20
      expect(calculateBias(actuals, forecasts)).toBe(-20)
    })

    it('should return 0 for balanced forecasts', () => {
      const actuals = [100, 200]
      const forecasts = [110, 190]
      // Errors: 10, -10 => Bias = 0
      expect(calculateBias(actuals, forecasts)).toBe(0)
    })

    it('should return 0 for empty arrays', () => {
      expect(calculateBias([], [])).toBe(0)
    })
  })

  describe('calculateForecastAccuracy', () => {
    it('should return all metrics combined', () => {
      const actuals = [100, 200, 300]
      const forecasts = [110, 190, 310]
      const result = calculateForecastAccuracy(actuals, forecasts)

      expect(result).toHaveProperty('mape')
      expect(result).toHaveProperty('mae')
      expect(result).toHaveProperty('rmse')
      expect(result).toHaveProperty('bias')
      expect(result).toHaveProperty('accuracy')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('sampleSize')
    })

    it('should calculate accuracy as 100 - MAPE', () => {
      const actuals = [100, 100, 100]
      const forecasts = [110, 110, 110] // 10% MAPE
      const result = calculateForecastAccuracy(actuals, forecasts)
      expect(result.accuracy).toBeCloseTo(90, 0)
    })

    it('should cap accuracy between 0 and 100', () => {
      // High error case
      const actuals = [10]
      const forecasts = [200] // Very high error
      const result = calculateForecastAccuracy(actuals, forecasts)
      expect(result.accuracy).toBeGreaterThanOrEqual(0)
      expect(result.accuracy).toBeLessThanOrEqual(100)
    })

    it('should assign high confidence for large sample with low MAPE', () => {
      const actuals = Array(30).fill(100)
      const forecasts = Array(30).fill(105) // 5% error
      const result = calculateForecastAccuracy(actuals, forecasts)
      expect(result.confidence).toBe('high')
    })

    it('should assign low confidence for small sample', () => {
      const actuals = Array(10).fill(100)
      const forecasts = Array(10).fill(105)
      const result = calculateForecastAccuracy(actuals, forecasts)
      expect(result.confidence).toBe('low')
    })

    it('should assign low confidence for high MAPE', () => {
      const actuals = Array(30).fill(100)
      const forecasts = Array(30).fill(150) // 50% error
      const result = calculateForecastAccuracy(actuals, forecasts)
      expect(result.confidence).toBe('low')
    })
  })
})

describe('Daily Rate Calculations', () => {
  describe('calculateDailyRate', () => {
    it('should calculate average daily rate from recent sales', () => {
      const salesHistory: SalesDataPoint[] = [
        { date: '2024-01-01', unitsSold: 10 },
        { date: '2024-01-02', unitsSold: 20 },
        { date: '2024-01-03', unitsSold: 30 },
      ]
      const rate = calculateDailyRate(salesHistory, 30)
      expect(rate).toBe(20) // (10 + 20 + 30) / 3
    })

    it('should return 0 for empty history', () => {
      expect(calculateDailyRate([], 30)).toBe(0)
    })

    it('should use only the most recent N days', () => {
      const salesHistory: SalesDataPoint[] = [
        { date: '2024-01-01', unitsSold: 100 }, // Should be excluded
        { date: '2024-01-15', unitsSold: 10 },
        { date: '2024-01-16', unitsSold: 20 },
      ]
      const rate = calculateDailyRate(salesHistory, 2)
      expect(rate).toBe(15) // Only uses most recent 2
    })

    it('should sort by date descending and take recent', () => {
      const salesHistory: SalesDataPoint[] = [
        { date: '2024-01-01', unitsSold: 5 },
        { date: '2024-01-03', unitsSold: 15 },
        { date: '2024-01-02', unitsSold: 10 },
      ]
      const rate = calculateDailyRate(salesHistory, 2)
      // Most recent are 01-03 (15) and 01-02 (10)
      expect(rate).toBe(12.5)
    })
  })

  describe('calculateWeightedDailyRate', () => {
    it('should weight recent data more heavily', () => {
      const salesHistory: SalesDataPoint[] = [
        { date: '2024-01-01', unitsSold: 10 },
        { date: '2024-01-02', unitsSold: 20 },
        { date: '2024-01-03', unitsSold: 30 },
      ]
      const rate = calculateWeightedDailyRate(salesHistory, 30)
      // Weights: 30*3 + 20*2 + 10*1 = 90 + 40 + 10 = 140
      // Total weight: 3 + 2 + 1 = 6
      // Weighted average: 140 / 6 ≈ 23.33
      expect(rate).toBeCloseTo(23.33, 1)
    })

    it('should return 0 for empty history', () => {
      expect(calculateWeightedDailyRate([], 30)).toBe(0)
    })

    it('should give higher weight to more recent data', () => {
      // If recent data is higher, weighted average should be higher than simple average
      const salesHistory: SalesDataPoint[] = [
        { date: '2024-01-01', unitsSold: 10 },
        { date: '2024-01-02', unitsSold: 50 },
      ]
      const simple = calculateDailyRate(salesHistory, 30)
      const weighted = calculateWeightedDailyRate(salesHistory, 30)
      expect(weighted).toBeGreaterThan(simple)
    })
  })
})

describe('Seasonality Detection', () => {
  describe('detectSeasonality', () => {
    it('should return default multipliers for insufficient data', () => {
      const salesHistory: SalesDataPoint[] = [
        { date: '2024-01-01', unitsSold: 10 },
      ]
      const multipliers = detectSeasonality(salesHistory)
      expect(multipliers).toHaveLength(12)
      expect(multipliers.every((m) => m === 1)).toBe(true)
    })

    it('should return 12 monthly multipliers', () => {
      // Generate 2 years of data
      const salesHistory: SalesDataPoint[] = []
      for (let year = 2022; year <= 2023; year++) {
        for (let month = 0; month < 12; month++) {
          for (let day = 1; day <= 28; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            salesHistory.push({ date: dateStr, unitsSold: 10 })
          }
        }
      }
      const multipliers = detectSeasonality(salesHistory)
      expect(multipliers).toHaveLength(12)
    })

    it('should detect higher multipliers for months with more sales', () => {
      // Generate data with December having 2x sales
      const salesHistory: SalesDataPoint[] = []
      for (let year = 2022; year <= 2023; year++) {
        for (let month = 0; month < 12; month++) {
          for (let day = 1; day <= 28; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const unitsSold = month === 11 ? 20 : 10 // December = 2x
            salesHistory.push({ date: dateStr, unitsSold })
          }
        }
      }
      const multipliers = detectSeasonality(salesHistory)
      // December (index 11) should have higher multiplier
      expect(multipliers[11]).toBeGreaterThan(1)
    })

    it('should cap multipliers between 0.5 and 2.0', () => {
      // Generate data with extreme seasonal variation
      const salesHistory: SalesDataPoint[] = []
      for (let year = 2022; year <= 2023; year++) {
        for (let month = 0; month < 12; month++) {
          for (let day = 1; day <= 28; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const unitsSold = month === 0 ? 100 : 1 // Extreme variation
            salesHistory.push({ date: dateStr, unitsSold })
          }
        }
      }
      const multipliers = detectSeasonality(salesHistory)
      expect(multipliers.every((m) => m >= 0.5 && m <= 2.0)).toBe(true)
    })
  })
})

describe('Trend Rate Calculation', () => {
  describe('calculateTrendRate', () => {
    it('should return 0 for insufficient data', () => {
      const salesHistory: SalesDataPoint[] = [
        { date: '2024-01-01', unitsSold: 10 },
      ]
      expect(calculateTrendRate(salesHistory)).toBe(0)
    })

    it('should detect positive trend', () => {
      // Generate 3 months of increasing sales
      const salesHistory: SalesDataPoint[] = []
      const months = ['2024-01', '2024-02', '2024-03']
      const monthlyTotals = [100, 120, 144] // 20% growth each month

      months.forEach((month, monthIdx) => {
        for (let day = 1; day <= 28; day++) {
          salesHistory.push({
            date: `${month}-${String(day).padStart(2, '0')}`,
            unitsSold: monthlyTotals[monthIdx] / 28,
          })
        }
      })

      const trend = calculateTrendRate(salesHistory, 3)
      expect(trend).toBeGreaterThan(0)
    })

    it('should detect negative trend', () => {
      // Generate 3 months of decreasing sales
      const salesHistory: SalesDataPoint[] = []
      const months = ['2024-01', '2024-02', '2024-03']
      const monthlyTotals = [144, 120, 100] // Declining

      months.forEach((month, monthIdx) => {
        for (let day = 1; day <= 28; day++) {
          salesHistory.push({
            date: `${month}-${String(day).padStart(2, '0')}`,
            unitsSold: monthlyTotals[monthIdx] / 28,
          })
        }
      })

      const trend = calculateTrendRate(salesHistory, 3)
      expect(trend).toBeLessThan(0)
    })

    it('should cap trend between -20% and +20%', () => {
      // Generate extreme growth
      const salesHistory: SalesDataPoint[] = []
      const months = ['2024-01', '2024-02', '2024-03']
      const monthlyTotals = [10, 100, 1000] // Extreme growth

      months.forEach((month, monthIdx) => {
        for (let day = 1; day <= 28; day++) {
          salesHistory.push({
            date: `${month}-${String(day).padStart(2, '0')}`,
            unitsSold: monthlyTotals[monthIdx] / 28,
          })
        }
      })

      const trend = calculateTrendRate(salesHistory, 3)
      expect(trend).toBeLessThanOrEqual(0.2)
      expect(trend).toBeGreaterThanOrEqual(-0.2)
    })
  })
})

describe('Forecast Generation', () => {
  describe('generateForecast', () => {
    it('should generate forecasts for specified number of days', () => {
      const forecasts = generateForecast(10, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 0, new Date('2024-01-01'), 30)
      expect(forecasts).toHaveLength(30)
    })

    it('should apply base rate', () => {
      const forecasts = generateForecast(10, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 0, new Date('2024-01-01'), 1)
      expect(forecasts[0].forecast).toBe(10)
    })

    it('should apply seasonal multipliers', () => {
      // All months have multiplier 1 except January (index 0) which has 2
      const multipliers = [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
      const forecasts = generateForecast(10, multipliers, 0, new Date('2024-01-15'), 1)
      expect(forecasts[0].forecast).toBe(20) // 10 * 2
    })

    it('should apply trend rate over time', () => {
      const forecasts = generateForecast(10, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 0.1, new Date('2024-01-01'), 60)
      // After 30 days (1 month), trend multiplier = (1 + 0.1)^1 = 1.1
      // Day 30 should be ~11 units
      expect(forecasts[30].forecast).toBeGreaterThan(forecasts[0].forecast)
    })

    it('should include correct dates', () => {
      const forecasts = generateForecast(10, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 0, new Date('2024-01-01'), 3)
      expect(forecasts[0].date).toBe('2024-01-01')
      expect(forecasts[1].date).toBe('2024-01-02')
      expect(forecasts[2].date).toBe('2024-01-03')
    })
  })
})

describe('Backtesting', () => {
  describe('backtestForecast', () => {
    it('should return low confidence result for insufficient data', () => {
      const salesHistory: SalesDataPoint[] = [
        { date: '2024-01-01', unitsSold: 10 },
      ]
      const result = backtestForecast(salesHistory, 10, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 0, 30)
      expect(result.confidence).toBe('low')
      expect(result.sampleSize).toBe(0)
    })

    it('should calculate accuracy using test set', () => {
      // Generate 60 days of constant sales
      const salesHistory: SalesDataPoint[] = []
      for (let i = 0; i < 60; i++) {
        const date = new Date('2024-01-01')
        date.setDate(date.getDate() + i)
        salesHistory.push({
          date: date.toISOString().split('T')[0],
          unitsSold: 10,
        })
      }

      const result = backtestForecast(salesHistory, 10, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 0, 30)
      expect(result.sampleSize).toBe(30)
      // Perfect forecast should have low MAPE
      expect(result.mape).toBeLessThan(1)
    })

    it('should use the last N days as test set', () => {
      const salesHistory: SalesDataPoint[] = []
      for (let i = 0; i < 60; i++) {
        const date = new Date('2024-01-01')
        date.setDate(date.getDate() + i)
        salesHistory.push({
          date: date.toISOString().split('T')[0],
          unitsSold: 10,
        })
      }

      const result = backtestForecast(salesHistory, 10, [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 0, 20)
      expect(result.sampleSize).toBe(20)
    })
  })
})
