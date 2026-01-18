import { describe, it, expect } from 'vitest'
import {
  classifyUrgency,
  calculateDaysOfStock,
  calculateStockoutDate,
  calculateRecommendedQty,
  getSeasonalMultiplier,
  calculateEstimatedArrival,
  calculateSafetyStock,
  DEFAULT_THRESHOLDS,
} from './urgency'

describe('Urgency Classification', () => {
  describe('classifyUrgency', () => {
    it('should classify as critical when days <= criticalDays', () => {
      expect(classifyUrgency(0, DEFAULT_THRESHOLDS)).toBe('critical')
      expect(classifyUrgency(1, DEFAULT_THRESHOLDS)).toBe('critical')
      expect(classifyUrgency(3, DEFAULT_THRESHOLDS)).toBe('critical')
    })

    it('should classify as warning when criticalDays < days <= warningDays', () => {
      expect(classifyUrgency(4, DEFAULT_THRESHOLDS)).toBe('warning')
      expect(classifyUrgency(5, DEFAULT_THRESHOLDS)).toBe('warning')
      expect(classifyUrgency(7, DEFAULT_THRESHOLDS)).toBe('warning')
    })

    it('should classify as planned when warningDays < days <= plannedDays', () => {
      expect(classifyUrgency(8, DEFAULT_THRESHOLDS)).toBe('planned')
      expect(classifyUrgency(10, DEFAULT_THRESHOLDS)).toBe('planned')
      expect(classifyUrgency(14, DEFAULT_THRESHOLDS)).toBe('planned')
    })

    it('should classify as monitor when days > plannedDays', () => {
      expect(classifyUrgency(15, DEFAULT_THRESHOLDS)).toBe('monitor')
      expect(classifyUrgency(30, DEFAULT_THRESHOLDS)).toBe('monitor')
      expect(classifyUrgency(999, DEFAULT_THRESHOLDS)).toBe('monitor')
    })

    it('should use default thresholds when not provided', () => {
      expect(classifyUrgency(3)).toBe('critical')
      expect(classifyUrgency(7)).toBe('warning')
      expect(classifyUrgency(14)).toBe('planned')
      expect(classifyUrgency(15)).toBe('monitor')
    })

    it('should respect custom thresholds', () => {
      const customThresholds = {
        criticalDays: 5,
        warningDays: 10,
        plannedDays: 20,
      }
      expect(classifyUrgency(5, customThresholds)).toBe('critical')
      expect(classifyUrgency(6, customThresholds)).toBe('warning')
      expect(classifyUrgency(10, customThresholds)).toBe('warning')
      expect(classifyUrgency(11, customThresholds)).toBe('planned')
      expect(classifyUrgency(20, customThresholds)).toBe('planned')
      expect(classifyUrgency(21, customThresholds)).toBe('monitor')
    })

    it('should handle edge cases with negative days', () => {
      expect(classifyUrgency(-1, DEFAULT_THRESHOLDS)).toBe('critical')
    })
  })

  describe('calculateDaysOfStock', () => {
    it('should calculate days correctly', () => {
      expect(calculateDaysOfStock(100, 10)).toBe(10)
      expect(calculateDaysOfStock(50, 10)).toBe(5)
      expect(calculateDaysOfStock(7, 1)).toBe(7)
    })

    it('should return 999 when daily rate is 0', () => {
      expect(calculateDaysOfStock(100, 0)).toBe(999)
    })

    it('should return 999 when daily rate is negative', () => {
      expect(calculateDaysOfStock(100, -5)).toBe(999)
    })

    it('should floor the result', () => {
      expect(calculateDaysOfStock(15, 4)).toBe(3) // 15/4 = 3.75, floor = 3
    })

    it('should include in-transit when specified', () => {
      expect(calculateDaysOfStock(50, 10, 50, true)).toBe(10) // (50+50)/10 = 10
      expect(calculateDaysOfStock(50, 10, 50, false)).toBe(5) // 50/10 = 5
    })

    it('should handle zero stock', () => {
      expect(calculateDaysOfStock(0, 10)).toBe(0)
    })

    it('should handle in-transit only stock', () => {
      expect(calculateDaysOfStock(0, 10, 50, true)).toBe(5)
      expect(calculateDaysOfStock(0, 10, 50, false)).toBe(0)
    })
  })

  describe('calculateStockoutDate', () => {
    it('should return null for 999 days (infinite stock)', () => {
      expect(calculateStockoutDate(999)).toBeNull()
    })

    it('should return null for days >= 999', () => {
      expect(calculateStockoutDate(1000)).toBeNull()
    })

    it('should return a valid date string for finite days', () => {
      const result = calculateStockoutDate(7)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should calculate correct future date', () => {
      const today = new Date()
      const expected = new Date(today)
      expected.setDate(expected.getDate() + 5)
      const expectedStr = expected.toISOString().split('T')[0]

      expect(calculateStockoutDate(5)).toBe(expectedStr)
    })

    it('should handle 0 days (stockout today)', () => {
      const today = new Date().toISOString().split('T')[0]
      expect(calculateStockoutDate(0)).toBe(today)
    })
  })

  describe('calculateRecommendedQty', () => {
    it('should calculate needed quantity to reach target', () => {
      // 10 units/day * 30 days = 300 target
      // 300 - 100 current - 50 in-transit = 150 needed
      expect(calculateRecommendedQty(10, 30, 100, 50)).toBe(150)
    })

    it('should return 0 when no replenishment needed', () => {
      expect(calculateRecommendedQty(10, 30, 300, 0)).toBe(0)
      expect(calculateRecommendedQty(10, 30, 200, 100)).toBe(0)
    })

    it('should respect minimum order quantity', () => {
      // Need 15 units, minOrderQty is 10
      // Should round up to 20
      expect(calculateRecommendedQty(1, 30, 15, 0, 10)).toBe(20)
    })

    it('should handle minOrderQty of 1', () => {
      expect(calculateRecommendedQty(10, 30, 290, 0, 1)).toBe(10)
    })

    it('should ceil daily rate calculations', () => {
      // 2.5 * 10 = 25, ceil = 25
      expect(calculateRecommendedQty(2.5, 10, 0, 0, 1)).toBe(25)
    })

    it('should handle zero daily rate', () => {
      expect(calculateRecommendedQty(0, 30, 0, 0, 1)).toBe(0)
    })

    it('should handle overstocked scenarios', () => {
      // More stock than needed
      expect(calculateRecommendedQty(10, 30, 500, 0)).toBe(0)
    })
  })

  describe('getSeasonalMultiplier', () => {
    it('should return correct multiplier for month', () => {
      const multipliers = [1.2, 1.0, 1.0, 1.1, 1.0, 0.9, 0.8, 0.9, 1.0, 1.1, 1.2, 1.5]
      expect(getSeasonalMultiplier(multipliers, new Date('2024-01-15'))).toBe(1.2) // Jan
      expect(getSeasonalMultiplier(multipliers, new Date('2024-12-15'))).toBe(1.5) // Dec
      expect(getSeasonalMultiplier(multipliers, new Date('2024-07-15'))).toBe(0.8) // Jul
    })

    it('should return 1 for null multipliers', () => {
      expect(getSeasonalMultiplier(null, new Date())).toBe(1)
    })

    it('should return 1 for invalid array length', () => {
      expect(getSeasonalMultiplier([1, 2, 3], new Date())).toBe(1)
      expect(getSeasonalMultiplier([], new Date())).toBe(1)
    })

    it('should return 1 when multiplier is 0 (falsy fallback)', () => {
      const multipliers = [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
      // Note: function returns multipliers[month] || 1, so 0 is treated as falsy and returns 1
      expect(getSeasonalMultiplier(multipliers, new Date('2024-01-15'))).toBe(1)
    })
  })

  describe('calculateEstimatedArrival', () => {
    it('should return valid date string', () => {
      const result = calculateEstimatedArrival(14)
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should calculate correct future date', () => {
      const today = new Date()
      const expected = new Date(today)
      expected.setDate(expected.getDate() + 10)
      const expectedStr = expected.toISOString().split('T')[0]

      expect(calculateEstimatedArrival(10)).toBe(expectedStr)
    })

    it('should handle 0 transit days', () => {
      const today = new Date().toISOString().split('T')[0]
      expect(calculateEstimatedArrival(0)).toBe(today)
    })
  })

  describe('calculateSafetyStock', () => {
    it('should return units directly for units type', () => {
      expect(calculateSafetyStock('units', 100, 10, 14)).toBe(100)
    })

    it('should calculate days-of-cover based threshold', () => {
      // 10 units/day * 7 days = 70 units
      expect(calculateSafetyStock('days-of-cover', 7, 10, 14)).toBe(70)
    })

    it('should use default days when type is null', () => {
      // 10 units/day * 14 default days = 140 units
      expect(calculateSafetyStock(null, null, 10, 14)).toBe(140)
    })

    it('should use default days when value is null', () => {
      expect(calculateSafetyStock('days-of-cover', null, 10, 14)).toBe(140)
    })

    it('should ceil the result', () => {
      // 2.5 * 7 = 17.5, ceil = 18
      expect(calculateSafetyStock('days-of-cover', 7, 2.5, 14)).toBe(18)
    })

    it('should handle zero daily rate', () => {
      expect(calculateSafetyStock('days-of-cover', 7, 0, 14)).toBe(0)
    })
  })
})
