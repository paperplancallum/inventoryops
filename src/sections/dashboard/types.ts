// Dashboard Types

export type PulseStatus = 'all_clear' | 'needs_attention'

export interface PulseCheckData {
  status: PulseStatus
  attentionCount: number
}

export interface KeyMetricsData {
  openPOs: number
  inTransit: number
  arriving: number
  owed: number
}

export interface InventoryHealthData {
  healthyPercent: number
  alertCount: number
  criticalCount: number
  warningCount: number
}

export interface CashFlowData {
  outstanding: number
  overdue: number
  dueThisWeek: number
}

export type ActionItemType = 'stock' | 'payment' | 'invoice' | 'inspection'
export type ActionItemUrgency = 'critical' | 'warning' | 'info'

export interface ActionItem {
  id: string
  type: ActionItemType
  urgency: ActionItemUrgency
  title: string
  description: string
  actionLabel: string
  navigateTo: string
  entityId: string
}

export type TimelineEventType = 'arrival' | 'inspection' | 'completion'

export interface TimelineEvent {
  id: string
  date: string
  type: TimelineEventType
  title: string
  subtitle?: string
}

export interface TimelineDay {
  date: string
  dayLabel: string
  dateLabel: string
  events: TimelineEvent[]
}

export interface DashboardData {
  pulseCheck: PulseCheckData
  keyMetrics: KeyMetricsData
  inventoryHealth: InventoryHealthData
  cashFlow: CashFlowData
  actionItems: ActionItem[]
  timeline: TimelineDay[]
}

// Component Props

export interface PulseCheckProps {
  data: PulseCheckData
  onActionClick?: () => void
}

export interface KeyMetricsStripProps {
  data: KeyMetricsData
  onNavigate?: (section: string) => void
}

export interface HealthCardsProps {
  inventoryHealth: InventoryHealthData
  cashFlow: CashFlowData
  onNavigate?: (section: string) => void
}

export interface ActionNeededProps {
  items: ActionItem[]
  onAction?: (item: ActionItem) => void
  maxItems?: number
}

export interface WeekTimelineProps {
  days: TimelineDay[]
}

export interface QuickActionsProps {
  onNavigate?: (section: string) => void
}

export interface DashboardViewProps {
  data: DashboardData
  onNavigate?: (section: string, entityId?: string) => void
  onRefresh?: () => void
  isRefreshing?: boolean
}
