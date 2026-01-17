// Calculate Replenishment Suggestions Edge Function
// This function calculates transfer and PO suggestions based on inventory levels,
// sales forecasts, and safety stock rules. Designed to run as a cron job.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.90.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Settings {
  criticalDays: number
  warningDays: number
  plannedDays: number
  defaultSafetyStockDays: number
  includeInTransitInCalculations: boolean
}

interface StockLevel {
  productId: string
  sku: string
  productName: string
  locationId: string
  locationName: string
  locationType: string
  quantity: number
  reservedQuantity: number
  inTransitQuantity: number
}

interface Forecast {
  productId: string
  locationId: string
  dailyRate: number
  confidence: string
  isEnabled: boolean
}

interface SafetyStockRule {
  productId: string
  locationId: string
  thresholdType: string
  thresholdValue: number
  isActive: boolean
}

interface ShippingRoute {
  id: string
  fromLocationId: string
  toLocationId: string
  method: string
  transitDaysTypical: number
  isDefault: boolean
  isActive: boolean
}

interface Suggestion {
  type: 'transfer' | 'purchase-order'
  urgency: 'critical' | 'warning' | 'planned' | 'monitor'
  status: 'pending'
  productId: string
  sku: string
  productName: string
  destinationLocationId: string
  destinationLocationName: string
  currentStock: number
  inTransitQuantity: number
  reservedQuantity: number
  availableStock: number
  dailySalesRate: number
  weeklySalesRate: number
  daysOfStockRemaining: number | null
  stockoutDate: string | null
  safetyStockThreshold: number
  recommendedQty: number
  estimatedArrival: string | null
  sourceLocationId: string | null
  sourceLocationName: string | null
  sourceAvailableQty: number | null
  supplierId: string | null
  supplierName: string | null
  supplierLeadTimeDays: number | null
  routeId: string | null
  routeName: string | null
  routeMethod: string | null
  routeTransitDays: number | null
  reasoning: Array<{ type: string; message: string; value?: string | number }>
}

// Calculate days of stock remaining
function calculateDaysRemaining(
  availableStock: number,
  dailySalesRate: number,
  includeInTransit: boolean,
  inTransitQty: number
): number | null {
  if (dailySalesRate <= 0) return null
  const effectiveStock = includeInTransit ? availableStock + inTransitQty : availableStock
  return Math.floor(effectiveStock / dailySalesRate)
}

// Determine urgency level based on days remaining
function determineUrgency(
  daysRemaining: number | null,
  settings: Settings
): 'critical' | 'warning' | 'planned' | 'monitor' {
  if (daysRemaining === null) return 'monitor'
  if (daysRemaining <= settings.criticalDays) return 'critical'
  if (daysRemaining <= settings.warningDays) return 'warning'
  if (daysRemaining <= settings.plannedDays) return 'planned'
  return 'monitor'
}

// Calculate safety stock threshold
function calculateSafetyStockThreshold(
  rule: SafetyStockRule | undefined,
  dailySalesRate: number,
  defaultSafetyDays: number
): number {
  if (!rule || !rule.isActive) {
    // Default: use days of cover approach
    return Math.ceil(dailySalesRate * defaultSafetyDays)
  }
  if (rule.thresholdType === 'units') {
    return rule.thresholdValue
  }
  // days-of-cover
  return Math.ceil(dailySalesRate * rule.thresholdValue)
}

// Calculate recommended quantity
function calculateRecommendedQty(
  currentStock: number,
  safetyThreshold: number,
  dailySalesRate: number,
  targetDays: number = 30
): number {
  const targetStock = Math.ceil(dailySalesRate * targetDays) + safetyThreshold
  const needed = Math.max(0, targetStock - currentStock)
  // Round up to nearest 10 for practical ordering
  return Math.ceil(needed / 10) * 10
}

// Find best source location for transfer
function findBestSourceLocation(
  productId: string,
  destinationLocationId: string,
  stockLevels: StockLevel[],
  routes: ShippingRoute[]
): { locationId: string; locationName: string; availableQty: number; route: ShippingRoute } | null {
  // Get all stock for this product in other locations
  const otherStock = stockLevels.filter(
    s => s.productId === productId && s.locationId !== destinationLocationId
  )

  // Find locations with available stock and valid routes
  const candidates = otherStock
    .map(stock => {
      const available = stock.quantity - stock.reservedQuantity
      if (available <= 0) return null

      // Find route to destination
      const route = routes.find(
        r => r.fromLocationId === stock.locationId &&
             r.toLocationId === destinationLocationId &&
             r.isActive
      )
      if (!route) return null

      return {
        locationId: stock.locationId,
        locationName: stock.locationName,
        availableQty: available,
        route,
      }
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)

  // Sort by: default route first, then by transit time, then by available quantity
  candidates.sort((a, b) => {
    if (a.route.isDefault !== b.route.isDefault) {
      return a.route.isDefault ? -1 : 1
    }
    if (a.route.transitDaysTypical !== b.route.transitDaysTypical) {
      return a.route.transitDaysTypical - b.route.transitDaysTypical
    }
    return b.availableQty - a.availableQty
  })

  return candidates[0] || null
}

// Main calculation function
async function calculateSuggestions(supabase: SupabaseClient): Promise<{
  transferSuggestions: Suggestion[]
  poSuggestions: Suggestion[]
  errors: string[]
}> {
  const errors: string[] = []
  const transferSuggestions: Suggestion[] = []
  const poSuggestions: Suggestion[] = []

  try {
    // Fetch settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('intelligence_settings')
      .select('*')
      .single()

    if (settingsError || !settingsData) {
      errors.push('Failed to fetch intelligence settings')
      return { transferSuggestions, poSuggestions, errors }
    }

    const settings: Settings = {
      criticalDays: settingsData.critical_threshold_days || 7,
      warningDays: settingsData.warning_threshold_days || 14,
      plannedDays: settingsData.planned_threshold_days || 30,
      defaultSafetyStockDays: settingsData.default_safety_stock_days || 14,
      includeInTransitInCalculations: settingsData.include_in_transit_in_calculations ?? true,
    }

    // Fetch stock levels with location info
    const { data: stockData, error: stockError } = await supabase
      .from('inventory_batches')
      .select(`
        id,
        product_id,
        location_id,
        quantity,
        reserved_quantity,
        products(id, sku, name, supplier_id),
        locations(id, name, type)
      `)
      .gt('quantity', 0)

    if (stockError) {
      errors.push(`Failed to fetch stock levels: ${stockError.message}`)
      return { transferSuggestions, poSuggestions, errors }
    }

    // Aggregate stock by product and location
    const stockMap = new Map<string, StockLevel>()
    for (const batch of stockData || []) {
      const key = `${batch.product_id}-${batch.location_id}`
      const existing = stockMap.get(key)
      const product = batch.products as { id: string; sku: string; name: string; supplier_id: string | null }
      const location = batch.locations as { id: string; name: string; type: string }

      if (existing) {
        existing.quantity += batch.quantity || 0
        existing.reservedQuantity += batch.reserved_quantity || 0
      } else {
        stockMap.set(key, {
          productId: batch.product_id,
          sku: product?.sku || '',
          productName: product?.name || '',
          locationId: batch.location_id,
          locationName: location?.name || '',
          locationType: location?.type || '',
          quantity: batch.quantity || 0,
          reservedQuantity: batch.reserved_quantity || 0,
          inTransitQuantity: 0,
        })
      }
    }
    const stockLevels = Array.from(stockMap.values())

    // Fetch in-transit quantities from pending transfers
    const { data: transfersData } = await supabase
      .from('transfers')
      .select(`
        destination_location_id,
        transfer_line_items(product_id, quantity)
      `)
      .in('status', ['pending', 'in_transit'])

    for (const transfer of transfersData || []) {
      // deno-lint-ignore no-explicit-any
      for (const item of (transfer.transfer_line_items as any[]) || []) {
        const key = `${item.product_id}-${transfer.destination_location_id}`
        const stock = stockMap.get(key)
        if (stock) {
          stock.inTransitQuantity += item.quantity || 0
        }
      }
    }

    // Fetch forecasts
    const { data: forecastsData } = await supabase
      .from('sales_forecasts')
      .select('product_id, location_id, daily_rate, confidence, is_enabled')
      .eq('is_enabled', true)

    const forecastMap = new Map<string, Forecast>()
    for (const f of forecastsData || []) {
      forecastMap.set(`${f.product_id}-${f.location_id}`, {
        productId: f.product_id,
        locationId: f.location_id,
        dailyRate: f.daily_rate || 0,
        confidence: f.confidence || 'low',
        isEnabled: f.is_enabled,
      })
    }

    // Fetch safety stock rules
    const { data: rulesData } = await supabase
      .from('safety_stock_rules')
      .select('product_id, location_id, threshold_type, threshold_value, is_active')
      .eq('is_active', true)

    const rulesMap = new Map<string, SafetyStockRule>()
    for (const r of rulesData || []) {
      rulesMap.set(`${r.product_id}-${r.location_id}`, {
        productId: r.product_id,
        locationId: r.location_id,
        thresholdType: r.threshold_type,
        thresholdValue: r.threshold_value,
        isActive: r.is_active,
      })
    }

    // Fetch shipping routes
    const { data: routesData } = await supabase
      .from('shipping_routes')
      .select('*')
      .eq('is_active', true)

    const routes: ShippingRoute[] = (routesData || []).map(r => ({
      id: r.id,
      fromLocationId: r.from_location_id,
      toLocationId: r.to_location_id,
      method: r.method,
      transitDaysTypical: r.transit_days_typical || 7,
      isDefault: r.is_default || false,
      isActive: r.is_active,
    }))

    // Fetch supplier info for products
    const { data: productsData } = await supabase
      .from('products')
      .select('id, supplier_id, suppliers(id, name, lead_time_days)')

    const productSupplierMap = new Map<string, { supplierId: string; supplierName: string; leadTimeDays: number }>()
    for (const p of productsData || []) {
      if (p.supplier_id) {
        const supplier = p.suppliers as { id: string; name: string; lead_time_days: number } | null
        if (supplier) {
          productSupplierMap.set(p.id, {
            supplierId: supplier.id,
            supplierName: supplier.name,
            leadTimeDays: supplier.lead_time_days || 30,
          })
        }
      }
    }

    // Fetch existing pending suggestions to avoid duplicates
    const { data: existingSuggestions } = await supabase
      .from('replenishment_suggestions')
      .select('product_id, destination_location_id, type')
      .eq('status', 'pending')

    const existingSet = new Set<string>()
    for (const s of existingSuggestions || []) {
      existingSet.add(`${s.product_id}-${s.destination_location_id}-${s.type}`)
    }

    // Process each stock level
    for (const stock of stockLevels) {
      // Focus on Amazon/FBA locations that need replenishment
      if (!stock.locationType?.toLowerCase().includes('amazon') &&
          !stock.locationType?.toLowerCase().includes('fba')) {
        continue
      }

      const forecast = forecastMap.get(`${stock.productId}-${stock.locationId}`)
      const dailySalesRate = forecast?.dailyRate || 0

      // Skip if no sales forecast
      if (dailySalesRate <= 0) continue

      const rule = rulesMap.get(`${stock.productId}-${stock.locationId}`)
      const safetyThreshold = calculateSafetyStockThreshold(rule, dailySalesRate, settings.defaultSafetyStockDays)

      const availableStock = stock.quantity - stock.reservedQuantity
      const daysRemaining = calculateDaysRemaining(
        availableStock,
        dailySalesRate,
        settings.includeInTransitInCalculations,
        stock.inTransitQuantity
      )

      const urgency = determineUrgency(daysRemaining, settings)

      // Only create suggestions for non-monitor urgency
      if (urgency === 'monitor') continue

      const recommendedQty = calculateRecommendedQty(availableStock, safetyThreshold, dailySalesRate)
      if (recommendedQty <= 0) continue

      const stockoutDate = daysRemaining !== null
        ? new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null

      const reasoning: Array<{ type: string; message: string; value?: string | number }> = [
        { type: 'info', message: 'Current stock level', value: availableStock },
        { type: 'info', message: 'Daily sales rate', value: dailySalesRate.toFixed(1) },
        { type: 'calculation', message: 'Days of stock remaining', value: daysRemaining ?? 'Unknown' },
        { type: 'info', message: 'Safety stock threshold', value: safetyThreshold },
      ]

      // Try to create a transfer suggestion first
      const sourceLocation = findBestSourceLocation(stock.productId, stock.locationId, stockLevels, routes)

      if (sourceLocation && sourceLocation.availableQty >= recommendedQty) {
        // Check for existing suggestion
        if (existingSet.has(`${stock.productId}-${stock.locationId}-transfer`)) continue

        const transitDays = sourceLocation.route.transitDaysTypical
        const estimatedArrival = new Date(Date.now() + transitDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        reasoning.push({
          type: 'info',
          message: `Source: ${sourceLocation.locationName} has ${sourceLocation.availableQty} available`,
        })

        transferSuggestions.push({
          type: 'transfer',
          urgency,
          status: 'pending',
          productId: stock.productId,
          sku: stock.sku,
          productName: stock.productName,
          destinationLocationId: stock.locationId,
          destinationLocationName: stock.locationName,
          currentStock: stock.quantity,
          inTransitQuantity: stock.inTransitQuantity,
          reservedQuantity: stock.reservedQuantity,
          availableStock,
          dailySalesRate,
          weeklySalesRate: dailySalesRate * 7,
          daysOfStockRemaining: daysRemaining,
          stockoutDate,
          safetyStockThreshold: safetyThreshold,
          recommendedQty: Math.min(recommendedQty, sourceLocation.availableQty),
          estimatedArrival,
          sourceLocationId: sourceLocation.locationId,
          sourceLocationName: sourceLocation.locationName,
          sourceAvailableQty: sourceLocation.availableQty,
          supplierId: null,
          supplierName: null,
          supplierLeadTimeDays: null,
          routeId: sourceLocation.route.id,
          routeName: `${sourceLocation.locationName} to ${stock.locationName}`,
          routeMethod: sourceLocation.route.method,
          routeTransitDays: transitDays,
          reasoning,
        })
      } else {
        // Fall back to PO suggestion
        const supplierInfo = productSupplierMap.get(stock.productId)

        // Check for existing suggestion
        if (existingSet.has(`${stock.productId}-${stock.locationId}-purchase-order`)) continue

        if (!supplierInfo) {
          console.warn(`No supplier found for product ${stock.sku} (${stock.productId}) - skipping PO suggestion`)
          continue
        }

        const estimatedArrival = new Date(
          Date.now() + supplierInfo.leadTimeDays * 24 * 60 * 60 * 1000
        ).toISOString().split('T')[0]

        reasoning.push({
          type: 'info',
          message: `Supplier: ${supplierInfo.supplierName} (${supplierInfo.leadTimeDays} day lead time)`,
        })

        if (sourceLocation) {
          reasoning.push({
            type: 'warning',
            message: `Insufficient stock at ${sourceLocation.locationName} (${sourceLocation.availableQty} available)`,
          })
        }

        poSuggestions.push({
          type: 'purchase-order',
          urgency,
          status: 'pending',
          productId: stock.productId,
          sku: stock.sku,
          productName: stock.productName,
          destinationLocationId: stock.locationId,
          destinationLocationName: stock.locationName,
          currentStock: stock.quantity,
          inTransitQuantity: stock.inTransitQuantity,
          reservedQuantity: stock.reservedQuantity,
          availableStock,
          dailySalesRate,
          weeklySalesRate: dailySalesRate * 7,
          daysOfStockRemaining: daysRemaining,
          stockoutDate,
          safetyStockThreshold: safetyThreshold,
          recommendedQty,
          estimatedArrival,
          sourceLocationId: null,
          sourceLocationName: null,
          sourceAvailableQty: null,
          supplierId: supplierInfo.supplierId,
          supplierName: supplierInfo.supplierName,
          supplierLeadTimeDays: supplierInfo.leadTimeDays,
          routeId: null,
          routeName: null,
          routeMethod: null,
          routeTransitDays: null,
          reasoning,
        })
      }
    }
  } catch (err) {
    errors.push(`Calculation error: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }

  return { transferSuggestions, poSuggestions, errors }
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

    console.log('Starting suggestion calculation...')

    // Calculate suggestions
    const { transferSuggestions, poSuggestions, errors } = await calculateSuggestions(supabase)

    console.log(`Generated ${transferSuggestions.length} transfer suggestions, ${poSuggestions.length} PO suggestions`)

    // Insert new suggestions
    const allSuggestions = [...transferSuggestions, ...poSuggestions]
    let insertedCount = 0

    for (const suggestion of allSuggestions) {
      const { error: insertError } = await supabase
        .from('replenishment_suggestions')
        .insert({
          type: suggestion.type,
          urgency: suggestion.urgency,
          status: suggestion.status,
          product_id: suggestion.productId,
          sku: suggestion.sku,
          product_name: suggestion.productName,
          destination_location_id: suggestion.destinationLocationId,
          destination_location_name: suggestion.destinationLocationName,
          current_stock: suggestion.currentStock,
          in_transit_quantity: suggestion.inTransitQuantity,
          reserved_quantity: suggestion.reservedQuantity,
          available_stock: suggestion.availableStock,
          daily_sales_rate: suggestion.dailySalesRate,
          weekly_sales_rate: suggestion.weeklySalesRate,
          days_of_stock_remaining: suggestion.daysOfStockRemaining,
          stockout_date: suggestion.stockoutDate,
          safety_stock_threshold: suggestion.safetyStockThreshold,
          recommended_qty: suggestion.recommendedQty,
          estimated_arrival: suggestion.estimatedArrival,
          source_location_id: suggestion.sourceLocationId,
          source_location_name: suggestion.sourceLocationName,
          source_available_qty: suggestion.sourceAvailableQty,
          supplier_id: suggestion.supplierId,
          supplier_name: suggestion.supplierName,
          supplier_lead_time_days: suggestion.supplierLeadTimeDays,
          route_id: suggestion.routeId,
          route_name: suggestion.routeName,
          route_method: suggestion.routeMethod,
          route_transit_days: suggestion.routeTransitDays,
          reasoning: suggestion.reasoning,
          generated_at: new Date().toISOString(),
        })

      if (insertError) {
        errors.push(`Failed to insert suggestion for ${suggestion.sku}: ${insertError.message}`)
      } else {
        insertedCount++
      }
    }

    // Update settings last_calculated_at
    await supabase
      .from('intelligence_settings')
      .update({ last_calculated_at: new Date().toISOString() })
      .not('id', 'is', null)

    return new Response(
      JSON.stringify({
        success: true,
        transferSuggestions: transferSuggestions.length,
        poSuggestions: poSuggestions.length,
        inserted: insertedCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in calculate-suggestions:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
