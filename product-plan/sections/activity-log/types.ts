// =============================================================================
// Data Types
// =============================================================================

export type EntityType =
  | 'product'
  | 'supplier'
  | 'purchase-order'
  | 'batch'
  | 'transfer'
  | 'inspection'
  | 'cost'
  | 'payment'
  | 'location'
  | 'user'
  | 'setting'

export type ActionType = 'create' | 'update' | 'delete' | 'status_change'

export type ValueType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'status'
  | 'reference'

export type ChangeValue = string | number | boolean | null

export interface FieldChange {
  field: string
  fieldLabel: string
  oldValue: ChangeValue
  newValue: ChangeValue
  valueType: ValueType
}

export interface ActivityUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
}

export interface ActivityLogEntry {
  id: string
  timestamp: string
  user: ActivityUser
  entityType: EntityType
  entityId: string
  entityName: string
  action: ActionType
  changes: FieldChange[]
  ipAddress: string | null
  userAgent: string | null
  notes: string
}

export interface EntityTypeOption {
  id: EntityType
  label: string
}

export interface ActionTypeOption {
  id: ActionType
  label: string
}

export interface ActivityLogSummary {
  totalEntries: number
  entriesThisWeek: number
  mostActiveUser: ActivityUser | null
  mostChangedEntityType: EntityType | null
}

export type GroupByOption = 'day' | 'entity' | 'user' | 'none'

export interface ActivityLogFilters {
  searchQuery: string
  entityTypes: EntityType[]
  actionTypes: ActionType[]
  userIds: string[]
  dateFrom: string | null
  dateTo: string | null
  groupBy: GroupByOption
}

// =============================================================================
// Component Props
// =============================================================================

export interface ActivityLogProps {
  /** List of activity log entries */
  entries: ActivityLogEntry[]
  /** Available entity type options for filtering */
  entityTypes: EntityTypeOption[]
  /** Available action type options for filtering */
  actionTypes: ActionTypeOption[]
  /** List of users for filtering */
  users: ActivityUser[]
  /** Summary statistics */
  summary: ActivityLogSummary
  /** Called when user clicks on an entity to view it */
  onViewEntity?: (entityType: EntityType, entityId: string) => void
  /** Called when filters change */
  onFilterChange?: (filters: ActivityLogFilters) => void
  /** Called when user wants to export the log */
  onExport?: () => void
  /** Called when user wants to load more entries */
  onLoadMore?: () => void
  /** Whether there are more entries to load */
  hasMore?: boolean
  /** Whether entries are currently loading */
  isLoading?: boolean
}

export interface ActivityLogEntryRowProps {
  /** The activity log entry to display */
  entry: ActivityLogEntry
  /** Whether the entry is expanded to show changes */
  isExpanded?: boolean
  /** Called when user toggles expand/collapse */
  onToggleExpand?: () => void
  /** Called when user clicks to view the entity */
  onViewEntity?: () => void
}

export interface FieldChangeDisplayProps {
  /** The field change to display */
  change: FieldChange
  /** Whether to use compact display */
  compact?: boolean
}

export interface ActivityLogFiltersProps {
  /** Current filter values */
  filters: ActivityLogFilters
  /** Available entity type options */
  entityTypes: EntityTypeOption[]
  /** Available action type options */
  actionTypes: ActionTypeOption[]
  /** Available users for filtering */
  users: ActivityUser[]
  /** Called when filters change */
  onFiltersChange: (filters: ActivityLogFilters) => void
}
