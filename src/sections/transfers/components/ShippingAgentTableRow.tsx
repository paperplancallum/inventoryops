'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreVertical } from 'lucide-react'
import type { ShippingAgent, ShippingServiceOption } from '../types'

interface ShippingAgentTableRowProps {
  agent: ShippingAgent
  shippingServices: ShippingServiceOption[]
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onToggleActive?: () => void
}

const serviceIcons: Record<string, string> = {
  ocean: '🚢',
  air: '✈️',
  trucking: '🚚',
  rail: '🚂',
  courier: '📦',
}

export function ShippingAgentTableRow({
  agent,
  shippingServices,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
}: ShippingAgentTableRowProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getServiceLabels = () => {
    return agent.services.map(serviceId => {
      const service = shippingServices.find(s => s.id === serviceId)
      return {
        id: serviceId,
        label: service?.label || serviceId,
        icon: serviceIcons[serviceId] || '📋'
      }
    })
  }

  return (
    <tr
      className="hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors cursor-pointer"
      onClick={() => onView?.()}
    >
      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-lime-100 dark:bg-lime-900/50 flex items-center justify-center text-lime-600 dark:text-lime-400 text-sm font-medium">
            {agent.name.charAt(0)}
          </div>
          <div>
            <span className="font-medium text-stone-900 dark:text-white">
              {agent.name}
            </span>
            {agent.unreadCount && agent.unreadCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-lime-600 text-white rounded-full">
                {agent.unreadCount}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Contact */}
      <td className="px-4 py-3">
        <div className="text-sm text-stone-700 dark:text-stone-300">{agent.contactName}</div>
        <div className="text-xs text-stone-500 dark:text-stone-400">{agent.email}</div>
      </td>

      {/* Services */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          {getServiceLabels().map(service => (
            <span
              key={service.id}
              title={service.label}
              className="text-base"
            >
              {service.icon}
            </span>
          ))}
        </div>
      </td>

      {/* Phone */}
      <td className="px-4 py-3 text-sm text-stone-600 dark:text-stone-400">
        {agent.phone}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          agent.isActive
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
            : 'bg-stone-100 text-stone-600 dark:bg-stone-700 dark:text-stone-400'
        }`}>
          {agent.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-600 text-stone-500 dark:text-stone-400 transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-stone-700 rounded-lg shadow-lg border border-stone-200 dark:border-stone-600 py-1 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                  onView?.()
                }}
                className="w-full px-3 py-2 text-left text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-600"
              >
                View Details
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                  onEdit?.()
                }}
                className="w-full px-3 py-2 text-left text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-600"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                  onToggleActive?.()
                }}
                className="w-full px-3 py-2 text-left text-sm text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-600"
              >
                {agent.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <hr className="my-1 border-stone-200 dark:border-stone-600" />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(false)
                  onDelete?.()
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}
