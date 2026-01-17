'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '../client'

// =============================================================================
// Types
// =============================================================================

export type ActivityEntityType =
  | 'product'
  | 'supplier'
  | 'purchase_order'
  | 'batch'
  | 'transfer'
  | 'inspection'
  | 'location'
  | 'invoice'
  | 'payment'
  | 'brand'
  | 'shipping_agent'
  | 'setting'

export type ActivityActionType = 'create' | 'update' | 'delete' | 'status_change'

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
  isSystemAction: boolean
  entityType: ActivityEntityType
  entityId: string
  entityName: string
  action: ActivityActionType
  changes: FieldChange[]
  ipAddress: string | null
  userAgent: string | null
  notes: string
}

export interface ActivityLogSummary {
  totalEntries: number
  entriesThisWeek: number
  mostActiveUser: ActivityUser | null
  mostChangedEntityType: ActivityEntityType | null
}

export type GroupByOption = 'day' | 'entity' | 'user' | 'none'

export interface ActivityLogFilters {
  searchQuery: string
  entityTypes: ActivityEntityType[]
  actionTypes: ActivityActionType[]
  userIds: string[]
  dateFrom: string | null
  dateTo: string | null
  includeSystemActions: boolean
}

interface DbActivityLogRow {
  id: string
  created_at: string
  user_id: string | null
  user_name: string | null
  user_email: string | null
  is_system_action: boolean
  entity_type: ActivityEntityType
  entity_id: string
  entity_name: string
  action: ActivityActionType
  changes: FieldChange[]
  ip_address: string | null
  user_agent: string | null
  notes: string | null
}

// =============================================================================
// Entity Type Display Config
// =============================================================================

export const ENTITY_TYPE_OPTIONS: { id: ActivityEntityType; label: string }[] = [
  { id: 'product', label: 'Product' },
  { id: 'supplier', label: 'Supplier' },
  { id: 'purchase_order', label: 'Purchase Order' },
  { id: 'batch', label: 'Batch' },
  { id: 'transfer', label: 'Transfer' },
  { id: 'inspection', label: 'Inspection' },
  { id: 'location', label: 'Location' },
  { id: 'invoice', label: 'Invoice' },
  { id: 'payment', label: 'Payment' },
  { id: 'brand', label: 'Brand' },
  { id: 'shipping_agent', label: 'Shipping Agent' },
]

export const ACTION_TYPE_OPTIONS: { id: ActivityActionType; label: string }[] = [
  { id: 'create', label: 'Created' },
  { id: 'update', label: 'Updated' },
  { id: 'delete', label: 'Deleted' },
  { id: 'status_change', label: 'Status Changed' },
]

// =============================================================================
// Transform Functions
// =============================================================================

function transformActivityLogEntry(row: DbActivityLogRow): ActivityLogEntry {
  return {
    id: row.id,
    timestamp: row.created_at,
    user: {
      id: row.user_id || 'system',
      name: row.user_name || 'System',
      email: row.user_email || '',
      avatarUrl: null,
    },
    isSystemAction: row.is_system_action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityName: row.entity_name,
    action: row.action,
    changes: row.changes || [],
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    notes: row.notes || '',
  }
}

// =============================================================================
// Date Preset Options
// =============================================================================

export type DatePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom'

export interface DatePresetOption {
  id: DatePreset
  label: string
  getRange: () => { from: string; to: string }
}

export const DATE_PRESET_OPTIONS: DatePresetOption[] = [
  {
    id: 'today',
    label: 'Today',
    getRange: () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return {
        from: today.toISOString(),
        to: new Date().toISOString(),
      }
    },
  },
  {
    id: 'yesterday',
    label: 'Yesterday',
    getRange: () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return {
        from: yesterday.toISOString(),
        to: today.toISOString(),
      }
    },
  },
  {
    id: 'last7days',
    label: 'Last 7 days',
    getRange: () => {
      const from = new Date()
      from.setDate(from.getDate() - 7)
      from.setHours(0, 0, 0, 0)
      return {
        from: from.toISOString(),
        to: new Date().toISOString(),
      }
    },
  },
  {
    id: 'last30days',
    label: 'Last 30 days',
    getRange: () => {
      const from = new Date()
      from.setDate(from.getDate() - 30)
      from.setHours(0, 0, 0, 0)
      return {
        from: from.toISOString(),
        to: new Date().toISOString(),
      }
    },
  },
  {
    id: 'thisMonth',
    label: 'This month',
    getRange: () => {
      const from = new Date()
      from.setDate(1)
      from.setHours(0, 0, 0, 0)
      return {
        from: from.toISOString(),
        to: new Date().toISOString(),
      }
    },
  },
  {
    id: 'lastMonth',
    label: 'Last month',
    getRange: () => {
      const from = new Date()
      from.setMonth(from.getMonth() - 1)
      from.setDate(1)
      from.setHours(0, 0, 0, 0)
      const to = new Date()
      to.setDate(0) // Last day of previous month
      to.setHours(23, 59, 59, 999)
      return {
        from: from.toISOString(),
        to: to.toISOString(),
      }
    },
  },
]

// =============================================================================
// Hook
// =============================================================================

const DEFAULT_FILTERS: ActivityLogFilters = {
  searchQuery: '',
  entityTypes: [],
  actionTypes: [],
  userIds: [],
  dateFrom: null,
  dateTo: null,
  includeSystemActions: true,
}

export function useActivityLog(initialFilters: Partial<ActivityLogFilters> = {}) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [filters, setFilters] = useState<ActivityLogFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  })
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [uniqueUsers, setUniqueUsers] = useState<ActivityUser[]>([])

  const PAGE_SIZE = 50

  const supabase = createClient()

  // Fetch activity log entries with filters
  const fetchEntries = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    if (!append) {
      setLoading(true)
    }
    setError(null)

    try {
      let query = supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

      // Apply filters
      if (filters.entityTypes.length > 0) {
        query = query.in('entity_type', filters.entityTypes)
      }

      if (filters.actionTypes.length > 0) {
        query = query.in('action', filters.actionTypes)
      }

      if (filters.userIds.length > 0) {
        query = query.in('user_id', filters.userIds)
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }

      if (!filters.includeSystemActions) {
        query = query.eq('is_system_action', false)
      }

      if (filters.searchQuery) {
        query = query.or(`entity_name.ilike.%${filters.searchQuery}%,notes.ilike.%${filters.searchQuery}%`)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        // Check if it's a "table doesn't exist" error
        const isTableMissing = fetchError.code === '42P01' ||
          fetchError.message?.includes('relation') ||
          fetchError.message?.includes('does not exist')

        if (isTableMissing) {
          console.warn('Activity log table not found. Run migrations to create it.')
          setEntries([])
          setHasMore(false)
          return
        }
        throw fetchError
      }

      const transformed = (data || []).map(transformActivityLogEntry)

      if (append) {
        setEntries(prev => [...prev, ...transformed])
      } else {
        setEntries(transformed)
      }

      setHasMore(transformed.length === PAGE_SIZE)
      setPage(pageNum)
    } catch (err) {
      console.error('Activity log fetch error:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch activity log'))
    } finally {
      setLoading(false)
    }
  }, [supabase, filters])

  // Fetch unique users for filter dropdown
  const fetchUniqueUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('user_id, user_name, user_email')
        .not('user_id', 'is', null)
        .limit(100)

      if (error) {
        // Log detailed error info for debugging
        console.error('Failed to fetch unique users:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        // Don't throw - just return empty users (table may not exist yet)
        return
      }

      // Deduplicate users
      const userMap = new Map<string, ActivityUser>()
      for (const row of data || []) {
        if (row.user_id && !userMap.has(row.user_id)) {
          userMap.set(row.user_id, {
            id: row.user_id,
            name: row.user_name || 'Unknown',
            email: row.user_email || '',
            avatarUrl: null,
          })
        }
      }

      setUniqueUsers(Array.from(userMap.values()))
    } catch (err) {
      // Gracefully handle errors - users list is not critical
      console.error('Failed to fetch unique users:', err instanceof Error ? err.message : 'Unknown error')
    }
  }, [supabase])

  // Calculate summary
  const summary = useMemo<ActivityLogSummary>(() => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const entriesThisWeek = entries.filter(
      e => new Date(e.timestamp) >= weekAgo
    ).length

    // Count by user
    const userCounts = new Map<string, { user: ActivityUser; count: number }>()
    for (const entry of entries) {
      if (!entry.isSystemAction) {
        const existing = userCounts.get(entry.user.id)
        if (existing) {
          existing.count++
        } else {
          userCounts.set(entry.user.id, { user: entry.user, count: 1 })
        }
      }
    }
    const mostActiveUser = Array.from(userCounts.values())
      .sort((a, b) => b.count - a.count)[0]?.user || null

    // Count by entity type
    const entityCounts = new Map<ActivityEntityType, number>()
    for (const entry of entries) {
      entityCounts.set(entry.entityType, (entityCounts.get(entry.entityType) || 0) + 1)
    }
    const mostChangedEntityType = Array.from(entityCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null

    return {
      totalEntries: entries.length,
      entriesThisWeek,
      mostActiveUser,
      mostChangedEntityType,
    }
  }, [entries])

  // Load more entries
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchEntries(page + 1, true)
    }
  }, [hasMore, loading, page, fetchEntries])

  // Update filters and refetch
  const updateFilters = useCallback((newFilters: Partial<ActivityLogFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  // Apply date preset
  const applyDatePreset = useCallback((preset: DatePreset) => {
    if (preset === 'custom') {
      return // Custom is handled separately
    }
    const option = DATE_PRESET_OPTIONS.find(o => o.id === preset)
    if (option) {
      const range = option.getRange()
      setFilters(prev => ({
        ...prev,
        dateFrom: range.from,
        dateTo: range.to,
      }))
    }
  }, [])

  // Export to CSV
  const exportToCSV = useCallback(async (): Promise<string> => {
    // Fetch all entries matching current filters (no pagination)
    let query = supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.entityTypes.length > 0) {
      query = query.in('entity_type', filters.entityTypes)
    }
    if (filters.actionTypes.length > 0) {
      query = query.in('action', filters.actionTypes)
    }
    if (filters.userIds.length > 0) {
      query = query.in('user_id', filters.userIds)
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }
    if (!filters.includeSystemActions) {
      query = query.eq('is_system_action', false)
    }
    if (filters.searchQuery) {
      query = query.or(`entity_name.ilike.%${filters.searchQuery}%,notes.ilike.%${filters.searchQuery}%`)
    }

    const { data, error } = await query

    if (error) throw error

    // Generate CSV
    const headers = [
      'Timestamp',
      'User',
      'Email',
      'System Action',
      'Entity Type',
      'Entity ID',
      'Entity Name',
      'Action',
      'Changes',
      'Notes',
    ]

    const rows = (data || []).map(row => {
      const changesStr = (row.changes || [])
        .map((c: FieldChange) => `${c.fieldLabel}: ${c.oldValue} → ${c.newValue}`)
        .join('; ')

      return [
        row.created_at,
        row.user_name || 'System',
        row.user_email || '',
        row.is_system_action ? 'Yes' : 'No',
        row.entity_type,
        row.entity_id,
        row.entity_name,
        row.action,
        changesStr,
        row.notes || '',
      ]
    })

    // Escape CSV fields
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => escapeCSV(String(cell))).join(','))
    ].join('\n')

    return csvContent
  }, [supabase, filters])

  // Download CSV file
  const downloadCSV = useCallback(async () => {
    try {
      const csv = await exportToCSV()
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const date = new Date().toISOString().split('T')[0]
      link.href = url
      link.download = `activity-log-${date}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export CSV:', err)
      throw err
    }
  }, [exportToCSV])

  // Initial fetch
  useEffect(() => {
    fetchEntries(0, false)
    fetchUniqueUsers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when filters change
  useEffect(() => {
    fetchEntries(0, false)
  }, [filters]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    entries,
    loading,
    error,
    filters,
    summary,
    hasMore,
    uniqueUsers,
    entityTypeOptions: ENTITY_TYPE_OPTIONS,
    actionTypeOptions: ACTION_TYPE_OPTIONS,
    datePresetOptions: DATE_PRESET_OPTIONS,
    updateFilters,
    resetFilters,
    applyDatePreset,
    loadMore,
    refetch: () => fetchEntries(0, false),
    exportToCSV,
    downloadCSV,
  }
}
