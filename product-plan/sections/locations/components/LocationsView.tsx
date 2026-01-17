import { useState, useMemo } from 'react'
import type { LocationsViewProps, LocationType } from '@/../product/sections/locations/types'

// Icons
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

const SearchIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)

const MoreVerticalIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
)

const MapPinIcon = () => (
  <svg className="w-12 h-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const typeColors: Record<LocationType, string> = {
  factory: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  warehouse: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  '3pl': 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  'amazon-fba': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  'amazon-awd': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
  port: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300',
  customs: 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300',
}

export function LocationsView({
  locations,
  locationTypes,
  onViewLocation,
  onEditLocation,
  onDeleteLocation,
  onCreateLocation,
  onToggleActive,
}: LocationsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'amazon-fba': true,
    'amazon-awd': true,
  })

  const toggleGroup = (groupType: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupType]: !prev[groupType]
    }))
  }

  const filteredLocations = useMemo(() => {
    return locations.filter(location => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.country.toLowerCase().includes(searchQuery.toLowerCase())

      // Type filter
      const matchesType = typeFilter === 'all' || location.type === typeFilter

      // Status filter
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && location.isActive) ||
        (statusFilter === 'inactive' && !location.isActive)

      return matchesSearch && matchesType && matchesStatus
    })
  }, [locations, searchQuery, typeFilter, statusFilter])

  // Group locations: regular locations first, then FBA group, then AWD group
  const groupedLocations = useMemo(() => {
    const regular = filteredLocations.filter(l => l.type !== 'amazon-fba' && l.type !== 'amazon-awd')
    const fba = filteredLocations.filter(l => l.type === 'amazon-fba')
    const awd = filteredLocations.filter(l => l.type === 'amazon-awd')
    return { regular, fba, awd }
  }, [filteredLocations])

  // Stats
  const stats = useMemo(() => {
    const active = locations.filter(l => l.isActive).length
    const factories = locations.filter(l => l.type === 'factory').length
    const warehouses = locations.filter(l => l.type === 'warehouse' || l.type === '3pl').length
    const amazon = locations.filter(l => l.type === 'amazon-fba' || l.type === 'amazon-awd').length
    return { total: locations.length, active, factories, warehouses, amazon }
  }, [locations])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Locations</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage your supply chain network</p>
          </div>
          <button
            onClick={() => onCreateLocation?.()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <PlusIcon />
            Add Location
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Active</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Factories</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.factories}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Warehouses</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.warehouses}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Amazon</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.amazon}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All types</option>
              {locationTypes.map(type => (
                <option key={type.id} value={type.id}>{type.label}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDownIcon />
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="appearance-none pl-4 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All statuses</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronDownIcon />
            </div>
          </div>
        </div>

        {/* Table */}
        {filteredLocations.length > 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">City</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Country</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {/* Regular locations (non-Amazon) */}
                  {groupedLocations.regular.map(location => {
                    const typeLabel = locationTypes.find(t => t.id === location.type)?.label || location.type
                    return (
                      <tr key={location.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => onViewLocation?.(location.id)}
                            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                          >
                            {location.name}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[location.type]}`}>
                            {typeLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{location.city}</td>
                        <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{location.country}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                          {location.contactName || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => onToggleActive?.(location.id)}
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                              location.isActive
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/70'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                          >
                            {location.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="relative">
                            <button
                              onClick={() => setMenuOpenId(menuOpenId === location.id ? null : location.id)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                            >
                              <MoreVerticalIcon />
                            </button>
                            {menuOpenId === location.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setMenuOpenId(null)}
                                />
                                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                                  <button
                                    onClick={() => { onEditLocation?.(location.id); setMenuOpenId(null) }}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => { onDeleteLocation?.(location.id); setMenuOpenId(null) }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}

                  {/* Amazon FBA Group */}
                  {groupedLocations.fba.length > 0 && (
                    <>
                      <tr
                        className="bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer"
                        onClick={() => toggleGroup('amazon-fba')}
                      >
                        <td colSpan={7} className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`transition-transform ${expandedGroups['amazon-fba'] ? 'rotate-90' : ''}`}>
                              <ChevronRightIcon />
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors['amazon-fba']}`}>
                              Amazon FBA
                            </span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {groupedLocations.fba.length} location{groupedLocations.fba.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {expandedGroups['amazon-fba'] && groupedLocations.fba.map(location => (
                        <tr key={location.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors bg-amber-50/30 dark:bg-amber-950/10">
                          <td className="px-4 py-3 pl-10">
                            <button
                              onClick={() => onViewLocation?.(location.id)}
                              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                            >
                              {location.name}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors['amazon-fba']}`}>
                              FBA
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{location.city}</td>
                          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{location.country}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{location.contactName || '-'}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => onToggleActive?.(location.id)}
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                location.isActive
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                              }`}
                            >
                              {location.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="relative">
                              <button
                                onClick={() => setMenuOpenId(menuOpenId === location.id ? null : location.id)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                              >
                                <MoreVerticalIcon />
                              </button>
                              {menuOpenId === location.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                                  <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                                    <button
                                      onClick={() => { onEditLocation?.(location.id); setMenuOpenId(null) }}
                                      className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => { onDeleteLocation?.(location.id); setMenuOpenId(null) }}
                                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  )}

                  {/* Amazon AWD Group */}
                  {groupedLocations.awd.length > 0 && (
                    <>
                      <tr
                        className="bg-yellow-50/50 dark:bg-yellow-950/20 hover:bg-yellow-50 dark:hover:bg-yellow-950/30 cursor-pointer"
                        onClick={() => toggleGroup('amazon-awd')}
                      >
                        <td colSpan={7} className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`transition-transform ${expandedGroups['amazon-awd'] ? 'rotate-90' : ''}`}>
                              <ChevronRightIcon />
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors['amazon-awd']}`}>
                              Amazon AWD
                            </span>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              {groupedLocations.awd.length} location{groupedLocations.awd.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {expandedGroups['amazon-awd'] && groupedLocations.awd.map(location => (
                        <tr key={location.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors bg-yellow-50/30 dark:bg-yellow-950/10">
                          <td className="px-4 py-3 pl-10">
                            <button
                              onClick={() => onViewLocation?.(location.id)}
                              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                            >
                              {location.name}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors['amazon-awd']}`}>
                              AWD
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{location.city}</td>
                          <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">{location.country}</td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{location.contactName || '-'}</td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => onToggleActive?.(location.id)}
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                location.isActive
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                              }`}
                            >
                              {location.isActive ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="relative">
                              <button
                                onClick={() => setMenuOpenId(menuOpenId === location.id ? null : location.id)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                              >
                                <MoreVerticalIcon />
                              </button>
                              {menuOpenId === location.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                                  <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-20">
                                    <button
                                      onClick={() => { onEditLocation?.(location.id); setMenuOpenId(null) }}
                                      className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => { onDeleteLocation?.(location.id); setMenuOpenId(null) }}
                                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
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
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="flex justify-center mb-4">
              <MapPinIcon />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'No locations found'
                : 'No locations yet'
              }
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add your first location to start tracking your supply chain network'
              }
            </p>
            {!searchQuery && typeFilter === 'all' && statusFilter === 'all' && (
              <button
                onClick={() => onCreateLocation?.()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <PlusIcon />
                Add Location
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
