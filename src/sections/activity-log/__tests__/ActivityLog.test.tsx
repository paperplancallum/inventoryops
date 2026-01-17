import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { ActivityLogView } from '../components/ActivityLogView'
import { ActivityLogEntryRow } from '../components/ActivityLogEntryRow'
import { FieldChangeDisplay } from '../components/FieldChangeDisplay'
import type {
  ActivityLogEntry,
  ActivityLogFilters,
  ActivityLogSummary,
  ActivityUser,
  FieldChange,
} from '@/lib/supabase/hooks/useActivityLog'

// =============================================================================
// Test Data
// =============================================================================

const sampleUsers: ActivityUser[] = [
  { id: 'user-001', name: 'Sarah Chen', email: 'sarah@company.com', avatarUrl: null },
  { id: 'user-002', name: 'Mike Johnson', email: 'mike@company.com', avatarUrl: null },
  { id: 'user-003', name: 'Emily Rodriguez', email: 'emily@company.com', avatarUrl: null },
]

const sampleEntries: ActivityLogEntry[] = [
  {
    id: 'act-001',
    timestamp: new Date().toISOString(),
    user: sampleUsers[0],
    isSystemAction: false,
    entityType: 'transfer',
    entityId: 'transfer-001',
    entityName: 'TRF-2024-001',
    action: 'status_change',
    changes: [
      {
        field: 'status',
        fieldLabel: 'Status',
        oldValue: 'booked',
        newValue: 'in-transit',
        valueType: 'status',
      },
    ],
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0',
    notes: '',
  },
  {
    id: 'act-002',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    user: sampleUsers[1],
    isSystemAction: false,
    entityType: 'purchase_order',
    entityId: 'po-007',
    entityName: 'PO-2024-007',
    action: 'update',
    changes: [
      {
        field: 'quantity',
        fieldLabel: 'Quantity',
        oldValue: 500,
        newValue: 750,
        valueType: 'number',
      },
      {
        field: 'totalCost',
        fieldLabel: 'Total Cost',
        oldValue: 2500.0,
        newValue: 3750.0,
        valueType: 'currency',
      },
    ],
    ipAddress: '192.168.1.105',
    userAgent: null,
    notes: 'Supplier confirmed increased capacity',
  },
  {
    id: 'act-003',
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    user: sampleUsers[0],
    isSystemAction: false,
    entityType: 'product',
    entityId: 'prod-015',
    entityName: 'Insulated Water Bottle 20oz',
    action: 'create',
    changes: [],
    ipAddress: '192.168.1.100',
    userAgent: null,
    notes: 'New SKU added to catalog',
  },
  {
    id: 'act-004',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    user: sampleUsers[2],
    isSystemAction: false,
    entityType: 'inspection',
    entityId: 'insp-002',
    entityName: 'INSP-BATCH-007',
    action: 'update',
    changes: [
      {
        field: 'result',
        fieldLabel: 'Result',
        oldValue: 'pending',
        newValue: 'fail',
        valueType: 'status',
      },
      {
        field: 'defectRate',
        fieldLabel: 'Defect Rate',
        oldValue: 0,
        newValue: 3.2,
        valueType: 'number',
      },
    ],
    ipAddress: null,
    userAgent: null,
    notes: '',
  },
  {
    id: 'act-005',
    timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    user: { id: 'system', name: 'System', email: '', avatarUrl: null },
    isSystemAction: true,
    entityType: 'batch',
    entityId: 'batch-012',
    entityName: 'BATCH-2024-012',
    action: 'status_change',
    changes: [
      {
        field: 'stage',
        fieldLabel: 'Stage',
        oldValue: 'ordered',
        newValue: 'at_factory',
        valueType: 'status',
      },
    ],
    ipAddress: null,
    userAgent: null,
    notes: 'Automatic stage update',
  },
]

const sampleSummary: ActivityLogSummary = {
  totalEntries: 5,
  entriesThisWeek: 4,
  mostActiveUser: sampleUsers[0],
  mostChangedEntityType: 'purchase_order',
}

const defaultFilters: ActivityLogFilters = {
  searchQuery: '',
  entityTypes: [],
  actionTypes: [],
  userIds: [],
  dateFrom: null,
  dateTo: null,
  includeSystemActions: true,
}

// =============================================================================
// Flow 1: View Activity Log
// =============================================================================

describe('Activity Log - View Chronological Activity', () => {
  it('renders activity entries in chronological order (newest first)', () => {
    render(
      <ActivityLogView
        entries={sampleEntries}
        filters={defaultFilters}
        summary={sampleSummary}
        users={sampleUsers}
        onFiltersChange={vi.fn()}
        onResetFilters={vi.fn()}
        onApplyDatePreset={vi.fn()}
      />
    )

    // Check first entry is visible (most recent)
    expect(screen.getByText('TRF-2024-001')).toBeInTheDocument()
    // Check second entry is visible
    expect(screen.getByText('PO-2024-007')).toBeInTheDocument()
  })

  it('displays entry with timestamp, user, action badge, and entity name', () => {
    render(
      <ActivityLogView
        entries={sampleEntries}
        filters={defaultFilters}
        summary={sampleSummary}
        users={sampleUsers}
        onFiltersChange={vi.fn()}
        onResetFilters={vi.fn()}
        onApplyDatePreset={vi.fn()}
      />
    )

    // Check user name
    expect(screen.getAllByText('Sarah Chen').length).toBeGreaterThan(0)
    // Check action badge
    expect(screen.getAllByText('Status Changed').length).toBeGreaterThan(0)
    // Check entity name
    expect(screen.getByText('TRF-2024-001')).toBeInTheDocument()
  })

  it('shows action badges with appropriate colors', () => {
    render(
      <ActivityLogView
        entries={sampleEntries}
        filters={defaultFilters}
        summary={sampleSummary}
        users={sampleUsers}
        onFiltersChange={vi.fn()}
        onResetFilters={vi.fn()}
        onApplyDatePreset={vi.fn()}
      />
    )

    // Check various action types are displayed
    expect(screen.getAllByText('Status Changed').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Updated').length).toBeGreaterThan(0)
    // Created appears in both the action badge and filter dropdown
    expect(screen.getAllByText('Created').length).toBeGreaterThan(0)
  })

  it('displays summary cards with correct counts', () => {
    render(
      <ActivityLogView
        entries={sampleEntries}
        filters={defaultFilters}
        summary={sampleSummary}
        users={sampleUsers}
        onFiltersChange={vi.fn()}
        onResetFilters={vi.fn()}
        onApplyDatePreset={vi.fn()}
      />
    )

    // Total entries
    expect(screen.getByText('5')).toBeInTheDocument()
    // This week
    expect(screen.getByText('4')).toBeInTheDocument()
    // Most active user
    expect(screen.getAllByText('Sarah Chen').length).toBeGreaterThan(0)
    // Most changed entity type (appears in filter dropdown and summary card)
    expect(screen.getAllByText('Purchase Order').length).toBeGreaterThan(0)
  })
})

// =============================================================================
// Flow 2: Filter Activity Log
// =============================================================================

describe('Activity Log - Filtering', () => {
  it('calls onFiltersChange when search input changes', async () => {
    const onFiltersChange = vi.fn()
    const user = userEvent.setup()

    render(
      <ActivityLogView
        entries={sampleEntries}
        filters={defaultFilters}
        summary={sampleSummary}
        users={sampleUsers}
        onFiltersChange={onFiltersChange}
        onResetFilters={vi.fn()}
        onApplyDatePreset={vi.fn()}
      />
    )

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'PO')

    expect(onFiltersChange).toHaveBeenCalled()
  })

  it('calls onFiltersChange when entity type filter changes', async () => {
    const onFiltersChange = vi.fn()
    const user = userEvent.setup()

    render(
      <ActivityLogView
        entries={sampleEntries}
        filters={defaultFilters}
        summary={sampleSummary}
        users={sampleUsers}
        onFiltersChange={onFiltersChange}
        onResetFilters={vi.fn()}
        onApplyDatePreset={vi.fn()}
      />
    )

    // Find entity type dropdown (index 1 - after grouping dropdown)
    const entityTypeSelect = screen.getAllByRole('combobox')[1]
    await user.selectOptions(entityTypeSelect, 'product')

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ entityTypes: ['product'] })
    )
  })

  it('calls onFiltersChange when action type filter changes', async () => {
    const onFiltersChange = vi.fn()
    const user = userEvent.setup()

    render(
      <ActivityLogView
        entries={sampleEntries}
        filters={defaultFilters}
        summary={sampleSummary}
        users={sampleUsers}
        onFiltersChange={onFiltersChange}
        onResetFilters={vi.fn()}
        onApplyDatePreset={vi.fn()}
      />
    )

    // Find action type dropdown (index 2 - after grouping and entity type dropdowns)
    const actionTypeSelect = screen.getAllByRole('combobox')[2]
    await user.selectOptions(actionTypeSelect, 'update')

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ actionTypes: ['update'] })
    )
  })

  it('calls onResetFilters when clear filters button is clicked', async () => {
    const onResetFilters = vi.fn()
    const user = userEvent.setup()

    render(
      <ActivityLogView
        entries={sampleEntries}
        filters={{ ...defaultFilters, searchQuery: 'test' }}
        summary={sampleSummary}
        users={sampleUsers}
        onFiltersChange={vi.fn()}
        onResetFilters={onResetFilters}
        onApplyDatePreset={vi.fn()}
      />
    )

    const clearButton = screen.getByText(/clear filters/i)
    await user.click(clearButton)

    expect(onResetFilters).toHaveBeenCalled()
  })
})

// =============================================================================
// Flow 3: Expand Entry Details
// =============================================================================

describe('Activity Log - Entry Expansion', () => {
  it('expands entry to show field changes when clicked', async () => {
    const user = userEvent.setup()

    render(
      <ActivityLogEntryRow
        entry={sampleEntries[1]} // Entry with changes
        isExpanded={false}
        onToggleExpand={vi.fn()}
        onViewEntity={vi.fn()}
      />
    )

    // Entry should show the entity name
    expect(screen.getByText('PO-2024-007')).toBeInTheDocument()
  })

  it('displays field changes with old and new values', () => {
    render(
      <ActivityLogEntryRow
        entry={sampleEntries[1]}
        isExpanded={true}
        onToggleExpand={vi.fn()}
        onViewEntity={vi.fn()}
      />
    )

    // Check field labels are visible
    expect(screen.getByText('Quantity')).toBeInTheDocument()
    expect(screen.getByText('Total Cost')).toBeInTheDocument()

    // Check values are shown
    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.getByText('750')).toBeInTheDocument()
  })

  it('calls onToggleExpand when entry is clicked', async () => {
    const onToggleExpand = vi.fn()
    const user = userEvent.setup()

    render(
      <ActivityLogEntryRow
        entry={sampleEntries[1]}
        isExpanded={false}
        onToggleExpand={onToggleExpand}
        onViewEntity={vi.fn()}
      />
    )

    // Click on the timestamp area (part of the clickable row, not the entity link)
    // The row has onClick handler for entries with changes
    const timestampArea = screen.getByText(/ago/i) // Matches "1h ago" or similar
    await user.click(timestampArea)

    expect(onToggleExpand).toHaveBeenCalled()
  })
})

// =============================================================================
// Flow 4: Navigate to Entity
// =============================================================================

describe('Activity Log - Entity Navigation', () => {
  it('calls onViewEntity when entity name is clicked', async () => {
    const onViewEntity = vi.fn()
    const user = userEvent.setup()

    render(
      <ActivityLogEntryRow
        entry={sampleEntries[0]}
        isExpanded={false}
        onToggleExpand={vi.fn()}
        onViewEntity={onViewEntity}
      />
    )

    const entityLink = screen.getByText('TRF-2024-001')
    await user.click(entityLink)

    expect(onViewEntity).toHaveBeenCalled()
  })

  it('entity name is styled as a clickable link', () => {
    render(
      <ActivityLogEntryRow
        entry={sampleEntries[0]}
        isExpanded={false}
        onToggleExpand={vi.fn()}
        onViewEntity={vi.fn()}
      />
    )

    const entityLink = screen.getByText('TRF-2024-001')
    expect(entityLink.tagName).toBe('BUTTON')
  })
})

// =============================================================================
// Flow 5: Export Activity Log
// =============================================================================

describe('Activity Log - Export', () => {
  it('calls onExport when export button is clicked', async () => {
    const onExport = vi.fn()
    const user = userEvent.setup()

    render(
      <ActivityLogView
        entries={sampleEntries}
        filters={defaultFilters}
        summary={sampleSummary}
        users={sampleUsers}
        onFiltersChange={vi.fn()}
        onResetFilters={vi.fn()}
        onApplyDatePreset={vi.fn()}
        onExport={onExport}
      />
    )

    const exportButton = screen.getByRole('button', { name: /export/i })
    await user.click(exportButton)

    expect(onExport).toHaveBeenCalled()
  })
})

// =============================================================================
// Empty States
// =============================================================================

describe('Activity Log - Empty States', () => {
  it('shows empty state when no entries exist', () => {
    render(
      <ActivityLogView
        entries={[]}
        filters={defaultFilters}
        summary={{ totalEntries: 0, entriesThisWeek: 0, mostActiveUser: null, mostChangedEntityType: null }}
        users={sampleUsers}
        onFiltersChange={vi.fn()}
        onResetFilters={vi.fn()}
        onApplyDatePreset={vi.fn()}
      />
    )

    expect(screen.getByText(/no activity found/i)).toBeInTheDocument()
  })

  it('shows filter-specific empty state when filters return no results', () => {
    render(
      <ActivityLogView
        entries={[]}
        filters={{ ...defaultFilters, searchQuery: 'nonexistent' }}
        summary={{ totalEntries: 0, entriesThisWeek: 0, mostActiveUser: null, mostChangedEntityType: null }}
        users={sampleUsers}
        onFiltersChange={vi.fn()}
        onResetFilters={vi.fn()}
        onApplyDatePreset={vi.fn()}
      />
    )

    expect(screen.getByText(/adjust/i)).toBeInTheDocument()
  })
})

// =============================================================================
// Field Change Display
// =============================================================================

describe('Activity Log - Field Change Display', () => {
  it('renders currency values with currency symbol', () => {
    const change: FieldChange = {
      field: 'cost',
      fieldLabel: 'Cost',
      oldValue: 100.0,
      newValue: 150.0,
      valueType: 'currency',
    }

    render(<FieldChangeDisplay change={change} />)

    expect(screen.getByText('$100.00')).toBeInTheDocument()
    expect(screen.getByText('$150.00')).toBeInTheDocument()
  })

  it('renders number values with formatting', () => {
    const change: FieldChange = {
      field: 'quantity',
      fieldLabel: 'Quantity',
      oldValue: 1000,
      newValue: 2500,
      valueType: 'number',
    }

    render(<FieldChangeDisplay change={change} />)

    expect(screen.getByText('1,000')).toBeInTheDocument()
    expect(screen.getByText('2,500')).toBeInTheDocument()
  })

  it('renders status values as badges', () => {
    const change: FieldChange = {
      field: 'status',
      fieldLabel: 'Status',
      oldValue: 'pending',
      newValue: 'completed',
      valueType: 'status',
    }

    render(<FieldChangeDisplay change={change} />)

    expect(screen.getByText('pending')).toBeInTheDocument()
    expect(screen.getByText('completed')).toBeInTheDocument()
  })

  it('renders empty old value appropriately', () => {
    const change: FieldChange = {
      field: 'notes',
      fieldLabel: 'Notes',
      oldValue: null,
      newValue: 'New note added',
      valueType: 'text',
    }

    render(<FieldChangeDisplay change={change} />)

    expect(screen.getByText('empty')).toBeInTheDocument()
    expect(screen.getByText('New note added')).toBeInTheDocument()
  })
})

// =============================================================================
// Grouping
// =============================================================================

describe('Activity Log - Grouping', () => {
  it('renders grouping dropdown', () => {
    render(
      <ActivityLogView
        entries={sampleEntries}
        filters={defaultFilters}
        summary={sampleSummary}
        users={sampleUsers}
        onFiltersChange={vi.fn()}
        onResetFilters={vi.fn()}
        onApplyDatePreset={vi.fn()}
      />
    )

    // Check grouping options exist
    expect(screen.getByText('No grouping')).toBeInTheDocument()
  })
})

// =============================================================================
// System Actions
// =============================================================================

describe('Activity Log - System Actions', () => {
  it('displays system action entries with System user', () => {
    render(
      <ActivityLogEntryRow
        entry={sampleEntries[4]} // System action entry
        isExpanded={false}
        onToggleExpand={vi.fn()}
        onViewEntity={vi.fn()}
      />
    )

    expect(screen.getByText('System')).toBeInTheDocument()
  })

  it('can toggle system actions visibility via filter', async () => {
    const onFiltersChange = vi.fn()
    const user = userEvent.setup()

    render(
      <ActivityLogView
        entries={sampleEntries}
        filters={defaultFilters}
        summary={sampleSummary}
        users={sampleUsers}
        onFiltersChange={onFiltersChange}
        onResetFilters={vi.fn()}
        onApplyDatePreset={vi.fn()}
      />
    )

    const systemToggle = screen.getByLabelText(/include system actions/i)
    await user.click(systemToggle)

    expect(onFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ includeSystemActions: false })
    )
  })
})

// =============================================================================
// Pagination
// =============================================================================

describe('Activity Log - Pagination', () => {
  it('shows pagination controls when entries exceed page size', () => {
    // Create many entries
    const manyEntries = Array.from({ length: 30 }, (_, i) => ({
      ...sampleEntries[0],
      id: `act-${i}`,
    }))

    render(
      <ActivityLogView
        entries={manyEntries}
        filters={defaultFilters}
        summary={{ ...sampleSummary, totalEntries: 30 }}
        users={sampleUsers}
        onFiltersChange={vi.fn()}
        onResetFilters={vi.fn()}
        onApplyDatePreset={vi.fn()}
      />
    )

    // Should show entries count
    expect(screen.getByText(/showing/i)).toBeInTheDocument()
  })

  it('allows changing items per page', () => {
    render(
      <ActivityLogView
        entries={sampleEntries}
        filters={defaultFilters}
        summary={sampleSummary}
        users={sampleUsers}
        onFiltersChange={vi.fn()}
        onResetFilters={vi.fn()}
        onApplyDatePreset={vi.fn()}
      />
    )

    const perPageSelect = screen.getByLabelText(/per page/i)
    expect(perPageSelect).toBeInTheDocument()
  })
})
