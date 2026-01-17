import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Types
type SuggestionUrgency = 'critical' | 'warning' | 'planned' | 'monitor'
type SuggestionType = 'transfer' | 'purchase-order'
type ReasoningItemType = 'info' | 'warning' | 'calculation'

interface ReasoningItem {
  type: ReasoningItemType
  message: string
  value?: string | number
}

interface UrgencyThresholds {
  criticalDays: number
  warningDays: number
  plannedDays: number
}

interface Forecast {
  productId: string
  locationId: string
  dailyRate: number
  seasonalMultipliers: number[]
  trendRate: number
  isEnabled: boolean
}

interface SafetyStockRule {
  productId: string
  locationId: string
  thresholdType: 'units' | 'days-of-cover'
  thresholdValue: number
}

interface SourceLocation {
  locationId: string
  locationName: string
  availableQty: number
}

interface GeneratedSuggestion {
  type: SuggestionType
  urgency: SuggestionUrgency
  productId: string
  destinationLocationId: string
  currentStock: number
  inTransitQuantity: number
  reservedQuantity: number
  availableStock: number
  dailySalesRate: number
  weeklySalesRate: number
  daysOfStockRemaining: number
  stockoutDate: string | null
  safetyStockThreshold: number
  recommendedQty: number
  estimatedArrival: string | null
  sourceLocationId: string | null
  sourceAvailableQty: number | null
  supplierId: string | null
  supplierLeadTimeDays: number | null
  routeId: string | null
  routeMethod: string | null
  routeTransitDays: number | null
  reasoning: ReasoningItem[]
}

// Utility functions
function getSeasonalMultiplier(multipliers: number[] | null, date: Date): number {
  if (!multipliers || multipliers.length !== 12) return 1
  return multipliers[date.getMonth()] || 1
}

function calculateDaysOfStock(
  availableStock: number,
  dailyRate: number,
  inTransit: number,
  includeInTransit: boolean
): number {
  if (dailyRate <= 0) return 999
  const totalStock = includeInTransit ? availableStock + inTransit : availableStock
  return Math.floor(totalStock / dailyRate)
}

function calculateStockoutDate(daysRemaining: number): string | null {
  if (daysRemaining >= 999) return null
  const date = new Date()
  date.setDate(date.getDate() + daysRemaining)
  return date.toISOString().split('T')[0]
}

function classifyUrgency(daysRemaining: number, thresholds: UrgencyThresholds): SuggestionUrgency {
  if (daysRemaining <= thresholds.criticalDays) return 'critical'
  if (daysRemaining <= thresholds.warningDays) return 'warning'
  if (daysRemaining <= thresholds.plannedDays) return 'planned'
  return 'monitor'
}

function calculateRecommendedQty(
  dailyRate: number,
  daysOfCover: number,
  currentStock: number,
  inTransit: number,
  minOrderQty: number = 1
): number {
  const targetStock = Math.ceil(dailyRate * daysOfCover)
  const needed = targetStock - currentStock - inTransit
  return Math.max(minOrderQty, Math.ceil(needed / minOrderQty) * minOrderQty)
}

function calculateEstimatedArrival(transitDays: number): string {
  const date = new Date()
  date.setDate(date.getDate() + transitDays)
  return date.toISOString().split('T')[0]
}

// POST - Generate replenishment suggestions
export async function POST() {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Fetch intelligence settings
    const { data: settingsData } = await supabase
      .from('intelligence_settings')
      .select('*')
      .limit(1)
      .single()

    const settings = settingsData || {
      critical_days: 3,
      warning_days: 7,
      planned_days: 14,
      default_safety_stock_days: 14,
      include_in_transit_in_calculations: true,
    }

    const thresholds: UrgencyThresholds = {
      criticalDays: settings.critical_days,
      warningDays: settings.warning_days,
      plannedDays: settings.planned_days,
    }

    // Fetch Amazon/FBA locations (destinations)
    const { data: amazonLocations } = await supabase
      .from('locations')
      .select('id, name, type')
      .in('type', ['amazon-fba', 'amazon-awd'])

    if (!amazonLocations || amazonLocations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No Amazon locations found',
        suggestions: 0
      })
    }

    // Fetch warehouse locations (potential sources)
    const { data: warehouseLocations } = await supabase
      .from('locations')
      .select('id, name, type')
      .in('type', ['warehouse', '3pl'])

    // Fetch all active products
    const { data: products } = await supabase
      .from('products')
      .select('id, sku, name')
      .eq('is_active', true)

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active products found',
        suggestions: 0
      })
    }

    // Fetch inventory batches for current stock
    const { data: inventoryBatches } = await supabase
      .from('inventory_batches')
      .select('product_id, location_id, quantity')

    // Fetch in-transit quantities from transfers
    const { data: inTransitTransfers } = await supabase
      .from('transfers')
      .select('product_id, to_location_id, quantity')
      .in('status', ['pending', 'in_transit'])

    // Fetch sales forecasts
    const { data: forecasts } = await supabase
      .from('sales_forecasts')
      .select('*')
      .eq('is_enabled', true)

    // Fetch safety stock rules
    const { data: safetyRules } = await supabase
      .from('safety_stock_rules')
      .select('*')
      .eq('is_active', true)

    // Fetch suppliers
    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('id, name, lead_time_days')

    // Fetch default shipping route
    const { data: defaultRoute } = await supabase
      .from('shipping_routes')
      .select('id, name, leg_ids')
      .eq('is_default', true)
      .eq('is_active', true)
      .limit(1)
      .single()

    // Calculate route transit days
    let routeTransitDays = 14
    let routeMethod = 'sea'
    if (defaultRoute?.leg_ids?.length) {
      const { data: routeLegs } = await supabase
        .from('shipping_route_legs')
        .select('transit_days_typical, method')
        .in('id', defaultRoute.leg_ids)

      if (routeLegs?.length) {
        routeTransitDays = routeLegs.reduce((sum, leg) => sum + (leg.transit_days_typical || 0), 0)
        routeMethod = routeLegs[0]?.method || 'sea'
      }
    }

    // Build maps for efficient lookups
    const inventoryMap = new Map<string, number>()
    inventoryBatches?.forEach((batch) => {
      const key = `${batch.product_id}-${batch.location_id}`
      inventoryMap.set(key, (inventoryMap.get(key) || 0) + (batch.quantity || 0))
    })

    const inTransitMap = new Map<string, number>()
    inTransitTransfers?.forEach((transfer) => {
      const key = `${transfer.product_id}-${transfer.to_location_id}`
      inTransitMap.set(key, (inTransitMap.get(key) || 0) + (transfer.quantity || 0))
    })

    const forecastMap = new Map<string, Forecast>()
    forecasts?.forEach((f) => {
      const key = `${f.product_id}-${f.location_id}`
      forecastMap.set(key, {
        productId: f.product_id,
        locationId: f.location_id,
        dailyRate: parseFloat(f.manual_override || f.daily_rate) || 0,
        seasonalMultipliers: f.seasonal_multipliers || [],
        trendRate: parseFloat(f.trend_rate) || 0,
        isEnabled: f.is_enabled,
      })
    })

    const safetyMap = new Map<string, SafetyStockRule>()
    safetyRules?.forEach((rule) => {
      const key = `${rule.product_id}-${rule.location_id}`
      safetyMap.set(key, {
        productId: rule.product_id,
        locationId: rule.location_id,
        thresholdType: rule.threshold_type,
        thresholdValue: parseFloat(rule.threshold_value) || settings.default_safety_stock_days,
      })
    })

    // Build warehouse inventory for source finding
    const warehouseInventory = new Map<string, SourceLocation[]>()
    warehouseLocations?.forEach((wh) => {
      products?.forEach((product) => {
        const key = `${product.id}-${wh.id}`
        const qty = inventoryMap.get(key) || 0
        if (qty > 0) {
          const sources = warehouseInventory.get(product.id) || []
          sources.push({
            locationId: wh.id,
            locationName: wh.name,
            availableQty: qty,
          })
          warehouseInventory.set(product.id, sources)
        }
      })
    })

    // Generate suggestions
    const suggestions: GeneratedSuggestion[] = []
    const now = new Date()

    for (const product of products) {
      for (const location of amazonLocations) {
        const invKey = `${product.id}-${location.id}`
        const currentStock = inventoryMap.get(invKey) || 0
        const inTransit = inTransitMap.get(invKey) || 0
        const availableStock = currentStock

        // Get forecast
        const forecast = forecastMap.get(invKey)
        const dailyRate = forecast?.dailyRate || 0
        const seasonalMultiplier = getSeasonalMultiplier(forecast?.seasonalMultipliers || null, now)
        const adjustedDailyRate = dailyRate * seasonalMultiplier

        // Get safety stock
        const safetyRule = safetyMap.get(invKey)
        let safetyThreshold: number
        if (safetyRule) {
          if (safetyRule.thresholdType === 'units') {
            safetyThreshold = safetyRule.thresholdValue
          } else {
            safetyThreshold = Math.ceil(adjustedDailyRate * safetyRule.thresholdValue)
          }
        } else {
          safetyThreshold = Math.ceil(adjustedDailyRate * settings.default_safety_stock_days)
        }

        // Calculate days of stock
        const daysOfStock = calculateDaysOfStock(
          availableStock,
          adjustedDailyRate,
          inTransit,
          settings.include_in_transit_in_calculations
        )

        // Skip if plenty of stock
        if (daysOfStock > settings.planned_days * 2) continue

        const urgency = classifyUrgency(daysOfStock, thresholds)
        const sources = warehouseInventory.get(product.id) || []
        const bestSource = sources.sort((a, b) => b.availableQty - a.availableQty)[0]

        const targetDays = Math.max(settings.planned_days, safetyRule?.thresholdValue || settings.default_safety_stock_days)
        const recommendedQty = calculateRecommendedQty(adjustedDailyRate, targetDays, availableStock, inTransit)

        if (recommendedQty <= 0) continue

        // Build reasoning
        const reasoning: ReasoningItem[] = [
          { type: 'calculation', message: `Current stock: ${currentStock.toLocaleString()} units`, value: currentStock },
        ]

        if (inTransit > 0) {
          reasoning.push({ type: 'info', message: `In transit: ${inTransit.toLocaleString()} units`, value: inTransit })
        }

        reasoning.push({ type: 'calculation', message: `Daily sales rate: ${adjustedDailyRate.toFixed(1)} units/day`, value: adjustedDailyRate })
        reasoning.push({ type: 'calculation', message: `Days of stock remaining: ${daysOfStock === 999 ? 'Unlimited' : daysOfStock}`, value: daysOfStock })

        if (daysOfStock <= thresholds.criticalDays) {
          reasoning.push({ type: 'warning', message: `CRITICAL: Stock will run out in ${daysOfStock} days` })
        } else if (daysOfStock <= thresholds.warningDays) {
          reasoning.push({ type: 'warning', message: `WARNING: Stock below ${thresholds.warningDays}-day threshold` })
        }

        reasoning.push({ type: 'calculation', message: `Safety stock threshold: ${safetyThreshold.toLocaleString()} units`, value: safetyThreshold })
        reasoning.push({ type: 'info', message: `Recommended replenishment: ${recommendedQty.toLocaleString()} units`, value: recommendedQty })

        // Determine suggestion type
        let suggestionType: SuggestionType
        let sourceLocationId: string | null = null
        let sourceAvailableQty: number | null = null
        let supplierId: string | null = null
        let supplierLeadTimeDays: number | null = null
        let transitDays = routeTransitDays

        if (bestSource && bestSource.availableQty >= recommendedQty) {
          suggestionType = 'transfer'
          sourceLocationId = bestSource.locationId
          sourceAvailableQty = bestSource.availableQty
          transitDays = 7
          reasoning.push({ type: 'info', message: `Transfer from ${bestSource.locationName} (${bestSource.availableQty.toLocaleString()} available)` })
        } else {
          suggestionType = 'purchase-order'
          const preferredSupplier = suppliers?.[0]
          if (preferredSupplier) {
            supplierId = preferredSupplier.id
            supplierLeadTimeDays = preferredSupplier.lead_time_days || 30
            transitDays = routeTransitDays + (supplierLeadTimeDays || 0)
            reasoning.push({ type: 'info', message: `Purchase from ${preferredSupplier.name} (${supplierLeadTimeDays} day lead time)` })
          }
          if (bestSource) {
            reasoning.push({ type: 'info', message: `Warehouse stock insufficient: ${bestSource.availableQty.toLocaleString()} available` })
          } else {
            reasoning.push({ type: 'info', message: 'No warehouse stock available - purchase order required' })
          }
        }

        suggestions.push({
          type: suggestionType,
          urgency,
          productId: product.id,
          destinationLocationId: location.id,
          currentStock,
          inTransitQuantity: inTransit,
          reservedQuantity: 0,
          availableStock,
          dailySalesRate: adjustedDailyRate,
          weeklySalesRate: adjustedDailyRate * 7,
          daysOfStockRemaining: daysOfStock,
          stockoutDate: calculateStockoutDate(daysOfStock),
          safetyStockThreshold: safetyThreshold,
          recommendedQty,
          estimatedArrival: calculateEstimatedArrival(transitDays),
          sourceLocationId,
          sourceAvailableQty,
          supplierId,
          supplierLeadTimeDays,
          routeId: defaultRoute?.id || null,
          routeMethod,
          routeTransitDays: transitDays,
          reasoning,
        })
      }
    }

    // Delete old pending suggestions
    await supabase.from('replenishment_suggestions').delete().eq('status', 'pending')

    // Insert new suggestions
    if (suggestions.length > 0) {
      const insertData = suggestions.map((s) => ({
        type: s.type,
        urgency: s.urgency,
        status: 'pending',
        product_id: s.productId,
        destination_location_id: s.destinationLocationId,
        current_stock: s.currentStock,
        in_transit_quantity: s.inTransitQuantity,
        reserved_quantity: s.reservedQuantity,
        available_stock: s.availableStock,
        daily_sales_rate: s.dailySalesRate,
        weekly_sales_rate: s.weeklySalesRate,
        days_of_stock_remaining: s.daysOfStockRemaining,
        stockout_date: s.stockoutDate,
        safety_stock_threshold: s.safetyStockThreshold,
        recommended_qty: s.recommendedQty,
        estimated_arrival: s.estimatedArrival,
        source_location_id: s.sourceLocationId,
        source_available_qty: s.sourceAvailableQty,
        supplier_id: s.supplierId,
        supplier_lead_time_days: s.supplierLeadTimeDays,
        route_id: s.routeId,
        route_method: s.routeMethod,
        route_transit_days: s.routeTransitDays,
        reasoning: s.reasoning,
        generated_at: new Date().toISOString(),
      }))

      const { error: insertError } = await supabase.from('replenishment_suggestions').insert(insertData)

      if (insertError) {
        console.error('Error inserting suggestions:', insertError)
        return NextResponse.json({ error: 'Failed to save suggestions', details: insertError.message }, { status: 500 })
      }
    }

    // Create critical notifications
    const criticalSuggestions = suggestions.filter((s) => s.urgency === 'critical')
    for (const suggestion of criticalSuggestions) {
      const product = products.find((p) => p.id === suggestion.productId)
      const location = amazonLocations.find((l) => l.id === suggestion.destinationLocationId)

      await supabase.from('inventory_notifications').insert({
        type: 'critical_stock',
        title: `Critical: ${product?.sku || 'Unknown'} at ${location?.name || 'Unknown'}`,
        message: `Stock will run out in ${suggestion.daysOfStockRemaining} days. Recommend ${suggestion.recommendedQty} units.`,
        entity_type: 'product',
        entity_id: suggestion.productId,
        data: {
          daysRemaining: suggestion.daysOfStockRemaining,
          recommendedQty: suggestion.recommendedQty,
          locationId: suggestion.destinationLocationId,
        },
      })
    }

    return NextResponse.json({
      success: true,
      totalSuggestions: suggestions.length,
      byUrgency: {
        critical: suggestions.filter((s) => s.urgency === 'critical').length,
        warning: suggestions.filter((s) => s.urgency === 'warning').length,
        planned: suggestions.filter((s) => s.urgency === 'planned').length,
        monitor: suggestions.filter((s) => s.urgency === 'monitor').length,
      },
      byType: {
        transfer: suggestions.filter((s) => s.type === 'transfer').length,
        purchaseOrder: suggestions.filter((s) => s.type === 'purchase-order').length,
      },
    })
  } catch (error) {
    console.error('Error generating suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}

// GET - Get current suggestion statistics
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: suggestions } = await supabase
      .from('replenishment_suggestions')
      .select('type, urgency, status')
      .eq('status', 'pending')

    const stats = {
      total: suggestions?.length || 0,
      byUrgency: {
        critical: suggestions?.filter((s) => s.urgency === 'critical').length || 0,
        warning: suggestions?.filter((s) => s.urgency === 'warning').length || 0,
        planned: suggestions?.filter((s) => s.urgency === 'planned').length || 0,
        monitor: suggestions?.filter((s) => s.urgency === 'monitor').length || 0,
      },
      byType: {
        transfer: suggestions?.filter((s) => s.type === 'transfer').length || 0,
        purchaseOrder: suggestions?.filter((s) => s.type === 'purchase-order').length || 0,
      },
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching suggestion stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
