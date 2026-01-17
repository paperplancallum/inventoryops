'use client'

import { useState } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import type { ShippingAgent, ShippingService, ShippingServiceOption } from '../types'
import { ShippingAgentTableRow } from './ShippingAgentTableRow'

interface ShippingAgentsViewProps {
  shippingAgents: ShippingAgent[]
  shippingServices: ShippingServiceOption[]
  onViewAgent?: (id: string) => void
  onEditAgent?: (id: string) => void
  onDeleteAgent?: (id: string) => void
  onCreateAgent?: () => void
  onToggleActive?: (id: string) => void
}

export function ShippingAgentsView({
  shippingAgents,
  shippingServices,
  onViewAgent,
  onEditAgent,
  onDeleteAgent,
  onCreateAgent,
  onToggleActive,
}: ShippingAgentsViewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [serviceFilter, setServiceFilter] = useState<ShippingService | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Filter agents
  const filteredAgents = shippingAgents.filter(agent => {
    const matchesSearch = searchQuery === '' ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesService = serviceFilter === 'all' ||
      agent.services.includes(serviceFilter)

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && agent.isActive) ||
      (statusFilter === 'inactive' && !agent.isActive)

    return matchesSearch && matchesService && matchesStatus
  })

  // Calculate summary stats
  const activeCount = shippingAgents.filter(a => a.isActive).length
  const totalAgents = shippingAgents.length

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="bg-white dark:bg-stone-800 rounded-lg px-4 py-3 border border-stone-200 dark:border-stone-700">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Total Agents</p>
          <p className="mt-1 text-2xl font-semibold text-stone-900 dark:text-white">{totalAgents}</p>
        </div>
        <div className="bg-white dark:bg-stone-800 rounded-lg px-4 py-3 border border-stone-200 dark:border-stone-700">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Active</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{activeCount}</p>
        </div>
        <div className="bg-white dark:bg-stone-800 rounded-lg px-4 py-3 border border-stone-200 dark:border-stone-700">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Ocean Freight</p>
          <p className="mt-1 text-2xl font-semibold text-stone-900 dark:text-white">
            {shippingAgents.filter(a => a.services.includes('ocean')).length}
          </p>
        </div>
        <div className="bg-white dark:bg-stone-800 rounded-lg px-4 py-3 border border-stone-200 dark:border-stone-700">
          <p className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide">Air Freight</p>
          <p className="mt-1 text-2xl font-semibold text-stone-900 dark:text-white">
            {shippingAgents.filter(a => a.services.includes('air')).length}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-stone-400" />
            </div>
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
            />
          </div>

          {/* Service Filter */}
          <div className="relative">
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value as ShippingService | 'all')}
              className="appearance-none pl-3 pr-10 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent cursor-pointer"
            >
              <option value="all">All services</option>
              {shippingServices.map(service => (
                <option key={service.id} value={service.id}>{service.label}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Filter className="w-4 h-4 text-stone-400" />
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="appearance-none pl-3 pr-10 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-sm text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent cursor-pointer"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Filter className="w-4 h-4 text-stone-400" />
            </div>
          </div>
        </div>

        {/* New Agent Button */}
        <button
          onClick={() => onCreateAgent?.()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-lime-600 hover:bg-lime-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Agent
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Services</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-700">
              {filteredAgents.map(agent => (
                <ShippingAgentTableRow
                  key={agent.id}
                  agent={agent}
                  shippingServices={shippingServices}
                  onView={() => onViewAgent?.(agent.id)}
                  onEdit={() => onEditAgent?.(agent.id)}
                  onDelete={() => onDeleteAgent?.(agent.id)}
                  onToggleActive={() => onToggleActive?.(agent.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
        {filteredAgents.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-stone-500 dark:text-stone-400">
              No shipping agents found matching your criteria
            </p>
          </div>
        )}
        <div className="px-4 py-3 border-t border-stone-200 dark:border-stone-700">
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Showing {filteredAgents.length} of {shippingAgents.length} agents
          </p>
        </div>
      </div>
    </div>
  )
}
