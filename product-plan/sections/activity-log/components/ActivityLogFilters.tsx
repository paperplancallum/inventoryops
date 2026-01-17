import type { ActivityLogFiltersProps, EntityType, ActionType, GroupByOption } from '@/../product/sections/activity-log/types'

const SearchIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
)

const XIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export function ActivityLogFilters({
  filters,
  entityTypes,
  actionTypes,
  users,
  onFiltersChange,
}: ActivityLogFiltersProps) {
  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.entityTypes.length > 0 ||
    filters.actionTypes.length > 0 ||
    filters.userIds.length > 0 ||
    filters.dateFrom !== null ||
    filters.dateTo !== null

  const clearFilters = () => {
    onFiltersChange({
      searchQuery: '',
      entityTypes: [],
      actionTypes: [],
      userIds: [],
      dateFrom: null,
      dateTo: null,
      groupBy: filters.groupBy,
    })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon />
        </div>
        <input
          type="text"
          placeholder="Search by entity name..."
          value={filters.searchQuery}
          onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Entity Type Filter */}
      <div className="relative">
        <select
          value={filters.entityTypes[0] || ''}
          onChange={(e) => {
            const value = e.target.value as EntityType | ''
            onFiltersChange({
              ...filters,
              entityTypes: value ? [value] : [],
            })
          }}
          className="appearance-none pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
        >
          <option value="">All entities</option>
          {entityTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
          <FilterIcon />
        </div>
      </div>

      {/* Action Type Filter */}
      <div className="relative">
        <select
          value={filters.actionTypes[0] || ''}
          onChange={(e) => {
            const value = e.target.value as ActionType | ''
            onFiltersChange({
              ...filters,
              actionTypes: value ? [value] : [],
            })
          }}
          className="appearance-none pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
        >
          <option value="">All actions</option>
          {actionTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
          <FilterIcon />
        </div>
      </div>

      {/* User Filter */}
      <div className="relative">
        <select
          value={filters.userIds[0] || ''}
          onChange={(e) => {
            const value = e.target.value
            onFiltersChange({
              ...filters,
              userIds: value ? [value] : [],
            })
          }}
          className="appearance-none pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
        >
          <option value="">All users</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
          <FilterIcon />
        </div>
      </div>

      {/* Group By */}
      <div className="relative">
        <select
          value={filters.groupBy}
          onChange={(e) => onFiltersChange({ ...filters, groupBy: e.target.value as GroupByOption })}
          className="appearance-none pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer"
        >
          <option value="none">No grouping</option>
          <option value="day">Group by day</option>
          <option value="entity">Group by entity</option>
          <option value="user">Group by user</option>
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
          <FilterIcon />
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <XIcon />
          Clear filters
        </button>
      )}
    </div>
  )
}
