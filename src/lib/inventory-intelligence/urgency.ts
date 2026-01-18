/**
 * Urgency Classification Utilities
 * Functions for classifying inventory replenishment urgency
 */

export type SuggestionUrgency = 'critical' | 'warning' | 'planned' | 'monitor'

export interface UrgencyThresholds {
  criticalDays: number
  warningDays: number
  plannedDays: number
}

export const DEFAULT_THRESHOLDS: UrgencyThresholds = {
  criticalDays: 3,
  warningDays: 7,
  plannedDays: 14,
}

/**
 * Classify urgency based on days of stock remaining
 */
export function classifyUrgency(
  daysRemaining: number,
  thresholds: UrgencyThresholds = DEFAULT_THRESHOLDS
): SuggestionUrgency {
  if (daysRemaining <= thresholds.criticalDays) return 'critical'
  if (daysRemaining <= thresholds.warningDays) return 'warning'
  if (daysRemaining <= thresholds.plannedDays) return 'planned'
  return 'monitor'
}

/**
 * Calculate days of stock remaining
 * @param availableStock - Current available stock
 * @param dailyRate - Daily sales rate
 * @param inTransit - In-transit quantity
 * @param includeInTransit - Whether to include in-transit in calculation
 * @returns Days of stock remaining (999 if infinite/no sales)
 */
export function calculateDaysOfStock(
  availableStock: number,
  dailyRate: number,
  inTransit: number = 0,
  includeInTransit: boolean = false
): number {
  if (dailyRate <= 0) return 999
  const totalStock = includeInTransit ? availableStock + inTransit : availableStock
  return Math.floor(totalStock / dailyRate)
}

/**
 * Calculate the projected stockout date
 * @param daysRemaining - Days of stock remaining
 * @returns ISO date string or null if no stockout expected
 */
export function calculateStockoutDate(daysRemaining: number): string | null {
  if (daysRemaining >= 999) return null
  const date = new Date()
  date.setDate(date.getDate() + daysRemaining)
  return date.toISOString().split('T')[0]
}

/**
 * Calculate recommended replenishment quantity
 * @param dailyRate - Daily sales rate
 * @param daysOfCover - Target days of coverage
 * @param currentStock - Current stock level
 * @param inTransit - In-transit quantity
 * @param minOrderQty - Minimum order quantity (default 1)
 * @returns Recommended quantity to order
 */
export function calculateRecommendedQty(
  dailyRate: number,
  daysOfCover: number,
  currentStock: number,
  inTransit: number = 0,
  minOrderQty: number = 1
): number {
  const targetStock = Math.ceil(dailyRate * daysOfCover)
  const needed = targetStock - currentStock - inTransit
  if (needed <= 0) return 0
  return Math.max(minOrderQty, Math.ceil(needed / minOrderQty) * minOrderQty)
}

/**
 * Get seasonal multiplier for a given date
 * @param multipliers - Array of 12 monthly multipliers
 * @param date - Date to get multiplier for
 * @returns Multiplier value (1 if invalid)
 */
export function getSeasonalMultiplier(
  multipliers: number[] | null,
  date: Date
): number {
  if (!multipliers || multipliers.length !== 12) return 1
  return multipliers[date.getMonth()] || 1
}

/**
 * Calculate estimated arrival date
 * @param transitDays - Number of transit days
 * @returns ISO date string
 */
export function calculateEstimatedArrival(transitDays: number): string {
  const date = new Date()
  date.setDate(date.getDate() + transitDays)
  return date.toISOString().split('T')[0]
}

/**
 * Calculate safety stock threshold
 * @param thresholdType - 'units' or 'days-of-cover'
 * @param thresholdValue - Threshold value
 * @param dailyRate - Daily sales rate (required for days-of-cover)
 * @param defaultDays - Default days if no rule set
 * @returns Safety stock threshold in units
 */
export function calculateSafetyStock(
  thresholdType: 'units' | 'days-of-cover' | null,
  thresholdValue: number | null,
  dailyRate: number,
  defaultDays: number = 14
): number {
  if (thresholdType === 'units' && thresholdValue !== null) {
    return thresholdValue
  }
  if (thresholdType === 'days-of-cover' && thresholdValue !== null) {
    return Math.ceil(dailyRate * thresholdValue)
  }
  return Math.ceil(dailyRate * defaultDays)
}
