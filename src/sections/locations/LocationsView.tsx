'use client'

import { useState, useMemo } from 'react'
import { RefreshCw, MapPin, Plus, Search, MoreVertical, ChevronRight, ChevronDown } from 'lucide-react'
import type { LocationsViewProps, LocationType } from './types'
import { LOCATION_TYPES, TYPE_COLORS } from './types'

type SortKey = 'name' | 'city' | 'country' | 'type'
type SortDir = 'asc' | 'desc'

export function LocationsView({
  locations,
  locationTypes = LOCATION_TYPES,
  onViewLocation,
  onEditLocation,
  onArchiveLocation,
  onUnarchiveLocation,
  onCreateLocation,
  onRefresh,
  loading = false,
}: LocationsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    amazon_fba: true,
    amazon_awd: true,
  })

  const toggleGroup = (groupType: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupType]: !prev[groupType],
    }))
  }

  // Filter and sort locations
  const filteredLocations = useMemo(() => {
    let result = [...locations]

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        l =>
          l.name.toLowerCase().includes(q) ||
          (l.city?.toLowerCase().includes(q)) ||
          l.country.toLowerCase().includes(q)
      )
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(l => l.type === typeFilter)
    }

    // Status filter
    if (statusFilter === 'active') {
      result = result.filter(l => l.isActive)
    } else if (statusFilter === 'archived') {
      result = result.filter(l => !l.isActive)
    }

    // Sort
    result.sort((a, b) => {
      let aVal: string = ''
      let bVal: string = ''

      switch (sortKey) {
        case 'name':
          aVal = a.name
          bVal = b.name
          break
        case 'city':
          aVal = a.city || ''
          bVal = b.city || ''
          break
        case 'country':
          aVal = a.country
          bVal = b.country
          break
        case 'type':
          aVal = a.type
          bVal = b.type
          break
      }

      return sortDir === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    })

    return result
  }, [locations, searchQuery, typeFilter, statusFilter, sortKey, sortDir])

  // Group locations
  const groupedLocations = useMemo(() => {
    const regular = filteredLocations.filter(l => l.type !== 'amazon_fba' && l.type !== 'amazon_awd')
    const fba = filteredLocations.filter(l => l.type === 'amazon_fba')
    const awd = filteredLocations.filter(l => l.type === 'amazon_awd')
    return { regular, fba, awd }
  }, [filteredLocations])

  // Calculate stats
  const stats = useMemo(() => {
    const total = locations.length
    const active = locations.filter(l => l.isActive).length
    const factories = locations.filter(l => l.type === 'factory').length
    const warehouses = locations.filter(l => l.type === 'warehouse' || l.type === '3pl').length
    const amazon = locations.filter(l => l.type === 'amazon_fba' || l.type === 'amazon_awd').length
    return { total, active, factories, warehouses, amazon }
  }, [locations])

  const getTypeLabel = (type: LocationType): string => {
    const typeOption = locationTypes.find(t => t.id === type)
    return typeOption?.label || type
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const renderLocationRow = (location: typeof locations[0], indent = false) => {
    const isArchived = !location.isActive

    return (
      <tr
        key={location.id}
        className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
          isArchived ? 'opacity-60' : ''
        }`}
      >
        <td className={`px-4 py-3 ${indent ? 'pl-10' : ''}`}>
          <button
            onClick={() => onViewLocation?.(location.id)}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
          >
            {location.name}
          </button>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[location.type]}`}>
            {getTypeLabel(location.type)}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
          {location.type === 'factory' && location.ownerSupplier
            ? location.ownerSupplier.name
            : '-'}
        </td>
        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
          {location.city || '-'}
        </td>
        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
          {location.country}
        </td>
        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
          {location.contactName || '-'}
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              location.isActive
                ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
            }`}
          >
            {location.isActive ? 'Active' : 'Archived'}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="relative inline-block">
            <button
              onClick={() => setMenuOpenId(menuOpenId === location.id ? null : location.id)}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpenId === location.id && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpenId(null)}
                />
                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                  <button
                    onClick={() => {
                      onEditLocation?.(location.id)
                      setMenuOpenId(null)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Edit
                  </button>
                  {location.isActive ? (
                    <button
                      onClick={() => {
                        onArchiveLocation?.(location.id)
                        setMenuOpenId(null)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-amber-600 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      Archive
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        // This will trigger the confirmation dialog
                        onUnarchiveLocation?.(location.id, '')
                        setMenuOpenId(null)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-green-600 dark:text-green-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      Unarchive
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </td>
      </tr>
    )
  }

  const renderGroupHeader = (type: 'amazon_fba' | 'amazon_awd', count: number) => {
    const label = type === 'amazon_fba' ? 'Amazon FBA' : 'Amazon AWD'
    const bgColor = type === 'amazon_fba' ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'bg-yellow-50/50 dark:bg-yellow-950/20'
    const hoverColor = type === 'amazon_fba' ? 'hover:bg-amber-50 dark:hover:bg-amber-950/30' : 'hover:bg-yellow-50 dark:hover:bg-yellow-950/30'

    return (
      <tr
        key={`group-${type}`}
        className={`${bgColor} ${hoverColor} cursor-pointer`}
        onClick={() => toggleGroup(type)}
      >
        <td colSpan={8} className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className={`transition-transform ${expandedGroups[type] ? 'rotate-90' : ''}`}>
              <ChevronRight className="w-4 h-4" />
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[type]}`}>
              {label}
            </span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {count} location{count !== 1 ? 's' : ''}
            </span>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                Locations
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Manage your supply chain network
              </p>
            </div>
            <div className="flex items-center gap-3">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              )}
              <button
                onClick={() => onCreateLocation?.()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Location
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Active</p>
              <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">{stats.active}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Factories</p>
              <p className="mt-1 text-2xl font-semibold text-orange-600 dark:text-orange-400">{stats.factories}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Warehouses</p>
              <p className="mt-1 text-2xl font-semibold text-blue-600 dark:text-blue-400">{stats.warehouses}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Amazon</p>
              <p className="mt-1 text-2xl font-semibold text-amber-600 dark:text-amber-400">{stats.amazon}</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <select
              aria-label="Filter by type"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All types</option>
              {locationTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'archived')}
              className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="archived">Archived only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {filteredLocations.length > 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        Name
                        {sortKey === 'name' && (sortDir === 'asc' ? <ChevronDown className="w-3 h-3" /> : <ChevronDown className="w-3 h-3 rotate-180" />)}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort('type')}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        Type
                        {sortKey === 'type' && (sortDir === 'asc' ? <ChevronDown className="w-3 h-3" /> : <ChevronDown className="w-3 h-3 rotate-180" />)}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Supplier
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort('city')}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        City
                        {sortKey === 'city' && (sortDir === 'asc' ? <ChevronDown className="w-3 h-3" /> : <ChevronDown className="w-3 h-3 rotate-180" />)}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort('country')}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        Country
                        {sortKey === 'country' && (sortDir === 'asc' ? <ChevronDown className="w-3 h-3" /> : <ChevronDown className="w-3 h-3 rotate-180" />)}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {/* Regular locations (non-Amazon) */}
                  {groupedLocations.regular.map(location => renderLocationRow(location))}

                  {/* Amazon FBA Group */}
                  {groupedLocations.fba.length > 0 && (
                    <>
                      {renderGroupHeader('amazon_fba', groupedLocations.fba.length)}
                      {expandedGroups.amazon_fba &&
                        groupedLocations.fba.map(location => renderLocationRow(location, true))}
                    </>
                  )}

                  {/* Amazon AWD Group */}
                  {groupedLocations.awd.length > 0 && (
                    <>
                      {renderGroupHeader('amazon_awd', groupedLocations.awd.length)}
                      {expandedGroups.amazon_awd &&
                        groupedLocations.awd.map(location => renderLocationRow(location, true))}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing {filteredLocations.length} of {locations.length} locations
              </p>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="flex justify-center mb-4">
              <MapPin className="w-12 h-12 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'No locations match your filters'
                : 'No locations yet'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add your first location to start tracking your supply chain network'}
            </p>
            {!searchQuery && typeFilter === 'all' && statusFilter === 'all' && (
              <button
                onClick={() => onCreateLocation?.()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Location
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
