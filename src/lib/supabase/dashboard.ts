import { createClient } from './server'
import type {
  DashboardData,
  PulseCheckData,
  KeyMetricsData,
  InventoryHealthData,
  CashFlowData,
  ActionItem,
  TimelineDay,
  TimelineEvent,
} from '@/sections/dashboard/types'
import { addDays, format, startOfDay, endOfDay, parseISO } from 'date-fns'

export async function fetchDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const sevenDaysFromNow = format(addDays(today, 7), 'yyyy-MM-dd')
  const fiveDaysFromNow = format(addDays(today, 4), 'yyyy-MM-dd') // Today + 4 more days = 5 days

  // Fetch all data in parallel
  const [
    openPOsResult,
    inTransitResult,
    arrivingResult,
    invoicesResult,
    productsResult,
    pendingSubmissionsResult,
    upcomingInspectionsResult,
    upcomingArrivalsResult,
  ] = await Promise.all([
    // Open POs count
    supabase
      .from('purchase_orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['draft', 'sent', 'confirmed', 'partially_received']),

    // In Transit transfers count
    supabase
      .from('transfers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'in_transit'),

    // Arriving transfers count (next 7 days)
    supabase
      .from('transfers')
      .select('id', { count: 'exact', head: true })
      .gte('estimated_arrival_date', todayStr)
      .lte('estimated_arrival_date', sevenDaysFromNow)
      .in('status', ['in_transit', 'shipped']),

    // Invoices for cash flow
    supabase
      .from('invoices')
      .select('id, balance, status, due_date'),

    // Products for inventory health
    supabase
      .from('products')
      .select('id, stock_level, safety_stock, status')
      .eq('status', 'active'),

    // Pending supplier invoice submissions
    supabase
      .from('supplier_invoice_submissions')
      .select('id, purchase_order_id', { count: 'exact' })
      .eq('review_status', 'pending'),

    // Upcoming inspections (next 5 days)
    supabase
      .from('inspections')
      .select('id, inspection_number, scheduled_date, status, purchase_order_number')
      .gte('scheduled_date', todayStr)
      .lte('scheduled_date', fiveDaysFromNow)
      .in('status', ['scheduled', 'confirmed']),

    // Upcoming transfer arrivals (next 5 days)
    supabase
      .from('transfers')
      .select('id, transfer_number, estimated_arrival_date, destination_location:locations!transfers_destination_id_fkey(name)')
      .gte('estimated_arrival_date', todayStr)
      .lte('estimated_arrival_date', fiveDaysFromNow)
      .in('status', ['in_transit', 'shipped']),
  ])

  // Calculate Key Metrics
  const keyMetrics: KeyMetricsData = {
    openPOs: openPOsResult.count || 0,
    inTransit: inTransitResult.count || 0,
    arriving: arrivingResult.count || 0,
    owed: 0,
  }

  // Calculate Cash Flow
  const invoices = invoicesResult.data || []
  const cashFlow: CashFlowData = {
    outstanding: 0,
    overdue: 0,
    dueThisWeek: 0,
  }

  invoices.forEach((invoice) => {
    if (invoice.status !== 'paid') {
      cashFlow.outstanding += invoice.balance || 0
      keyMetrics.owed += invoice.balance || 0

      if (invoice.status === 'overdue') {
        cashFlow.overdue += invoice.balance || 0
      }

      if (invoice.due_date) {
        const dueDate = parseISO(invoice.due_date)
        if (dueDate <= addDays(today, 7) && dueDate >= today) {
          cashFlow.dueThisWeek += invoice.balance || 0
        }
      }
    }
  })

  // Calculate Inventory Health
  const products = productsResult.data || []
  let healthyCount = 0
  let criticalCount = 0
  let warningCount = 0

  products.forEach((product) => {
    const stockLevel = product.stock_level || 0
    const safetyStock = product.safety_stock || 0

    if (safetyStock === 0 || stockLevel >= safetyStock) {
      healthyCount++
    } else if (stockLevel < safetyStock * 0.5) {
      // Below 50% of safety stock = critical
      criticalCount++
    } else {
      // Between 50% and 100% of safety stock = warning
      warningCount++
    }
  })

  const totalProducts = products.length
  const inventoryHealth: InventoryHealthData = {
    healthyPercent: totalProducts > 0 ? Math.round((healthyCount / totalProducts) * 100) : 100,
    alertCount: criticalCount + warningCount,
    criticalCount,
    warningCount,
  }

  // Build Action Items
  const actionItems: ActionItem[] = []

  // Add overdue invoices as critical action items
  const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue')
  overdueInvoices.slice(0, 3).forEach((invoice, idx) => {
    actionItems.push({
      id: `overdue-${invoice.id}`,
      type: 'payment',
      urgency: 'critical',
      title: `Invoice overdue`,
      description: `$${(invoice.balance || 0).toLocaleString()} outstanding`,
      actionLabel: 'Record payment',
      navigateTo: 'invoices-and-payments',
      entityId: invoice.id,
    })
  })

  // Add pending supplier invoice submissions
  const pendingCount = pendingSubmissionsResult.count || 0
  if (pendingCount > 0) {
    actionItems.push({
      id: 'pending-submissions',
      type: 'invoice',
      urgency: 'warning',
      title: `${pendingCount} supplier invoice${pendingCount > 1 ? 's' : ''}`,
      description: 'Pending approval',
      actionLabel: 'Review',
      navigateTo: 'supplier-invoices',
      entityId: '',
    })
  }

  // Add critical stock items
  const criticalProducts = products.filter((p) => {
    const stockLevel = p.stock_level || 0
    const safetyStock = p.safety_stock || 0
    return safetyStock > 0 && stockLevel < safetyStock * 0.5
  })

  criticalProducts.slice(0, 2).forEach((product) => {
    actionItems.push({
      id: `stock-${product.id}`,
      type: 'stock',
      urgency: 'critical',
      title: 'Low stock alert',
      description: 'Below 50% of safety stock',
      actionLabel: 'View',
      navigateTo: 'inventory-intelligence',
      entityId: product.id,
    })
  })

  // Add today's inspections
  const todaysInspections = (upcomingInspectionsResult.data || []).filter(
    (insp) => insp.scheduled_date === todayStr
  )
  todaysInspections.slice(0, 1).forEach((inspection) => {
    actionItems.push({
      id: `inspection-${inspection.id}`,
      type: 'inspection',
      urgency: 'info',
      title: `Inspection ${inspection.inspection_number || ''}`,
      description: 'Scheduled for today',
      actionLabel: 'View',
      navigateTo: 'inspections',
      entityId: inspection.id,
    })
  })

  // Calculate Pulse Check
  const attentionCount = actionItems.filter((item) => item.urgency === 'critical').length
  const pulseCheck: PulseCheckData = {
    status: attentionCount > 0 ? 'needs_attention' : 'all_clear',
    attentionCount: actionItems.length,
  }

  // Build Timeline
  const timeline: TimelineDay[] = []
  for (let i = 0; i < 5; i++) {
    const date = addDays(today, i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const events: TimelineEvent[] = []

    // Add arrivals for this day
    const arrivals = (upcomingArrivalsResult.data || []).filter(
      (t) => t.estimated_arrival_date === dateStr
    )
    arrivals.forEach((transfer) => {
      // destination_location can be an object or array depending on Supabase response
      const destinationLocation = transfer.destination_location as unknown
      const locationName = destinationLocation && typeof destinationLocation === 'object'
        ? Array.isArray(destinationLocation)
          ? (destinationLocation[0] as { name?: string } | undefined)?.name
          : (destinationLocation as { name?: string })?.name
        : undefined

      events.push({
        id: `arrival-${transfer.id}`,
        date: dateStr,
        type: 'arrival',
        title: `${transfer.transfer_number} arrives`,
        subtitle: locationName,
      })
    })

    // Add inspections for this day
    const inspections = (upcomingInspectionsResult.data || []).filter(
      (insp) => insp.scheduled_date === dateStr
    )
    inspections.forEach((inspection) => {
      events.push({
        id: `inspection-${inspection.id}`,
        date: dateStr,
        type: 'inspection',
        title: 'Inspection',
        subtitle: inspection.purchase_order_number || undefined,
      })
    })

    timeline.push({
      date: dateStr,
      dayLabel: format(date, 'EEE'),
      dateLabel: format(date, 'd'),
      events,
    })
  }

  return {
    pulseCheck,
    keyMetrics,
    inventoryHealth,
    cashFlow,
    actionItems,
    timeline,
  }
}
