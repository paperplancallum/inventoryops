'use client'

import { useState } from 'react'
import { X, Mail, Phone, Globe, MapPin, FileText, Send, MessageSquare } from 'lucide-react'
import type { ShippingAgent, ShippingServiceOption } from '../types'

interface ShippingAgentDetailProps {
  agent: ShippingAgent
  shippingServices: ShippingServiceOption[]
  onClose: () => void
  onEdit?: () => void
  onSendMessage?: (content: string, attachments?: File[]) => void
  onAddNote?: (content: string) => void
}

const serviceIcons: Record<string, string> = {
  ocean: '🚢',
  air: '✈️',
  trucking: '🚚',
  rail: '🚂',
  courier: '📦',
}

export function ShippingAgentDetail({
  agent,
  shippingServices,
  onClose,
  onEdit,
  onSendMessage,
  onAddNote,
}: ShippingAgentDetailProps) {
  const [messageContent, setMessageContent] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)

  const handleSendMessage = () => {
    if (messageContent.trim()) {
      onSendMessage?.(messageContent)
      setMessageContent('')
    }
  }

  const handleAddNote = () => {
    if (noteContent.trim()) {
      onAddNote?.(noteContent)
      setNoteContent('')
      setShowNoteInput(false)
    }
  }

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-stone-800 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-lime-100 dark:bg-lime-900/50 flex items-center justify-center text-lime-600 dark:text-lime-400 font-medium">
                {agent.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-900 dark:text-white">
                  {agent.name}
                </h2>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  {agent.contactName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="px-3 py-1.5 text-sm font-medium text-lime-600 dark:text-lime-400 hover:bg-lime-50 dark:hover:bg-lime-900/20 rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-500 dark:text-stone-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Contact Info */}
          <section>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">Contact Information</h3>
            <div className="space-y-3">
              <a
                href={`mailto:${agent.email}`}
                className="flex items-center gap-3 text-sm text-stone-700 dark:text-stone-300 hover:text-lime-600 dark:hover:text-lime-400 transition-colors"
              >
                <Mail className="w-4 h-4 text-stone-400" />
                {agent.email}
              </a>
              <a
                href={`tel:${agent.phone}`}
                className="flex items-center gap-3 text-sm text-stone-700 dark:text-stone-300 hover:text-lime-600 dark:hover:text-lime-400 transition-colors"
              >
                <Phone className="w-4 h-4 text-stone-400" />
                {agent.phone}
              </a>
              {agent.website && (
                <a
                  href={agent.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-stone-700 dark:text-stone-300 hover:text-lime-600 dark:hover:text-lime-400 transition-colors"
                >
                  <Globe className="w-4 h-4 text-stone-400" />
                  {agent.website}
                </a>
              )}
              {agent.address && (
                <div className="flex items-start gap-3 text-sm text-stone-700 dark:text-stone-300">
                  <MapPin className="w-4 h-4 text-stone-400 mt-0.5" />
                  <div>
                    {agent.address.street && <p>{agent.address.street}</p>}
                    <p>
                      {agent.address.city}{agent.address.state && `, ${agent.address.state}`}
                    </p>
                    <p>{agent.address.country} {agent.address.postalCode}</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Services */}
          <section>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">Services</h3>
            <div className="flex flex-wrap gap-2">
              {getServiceLabels().map(service => (
                <span
                  key={service.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-700 rounded-lg text-sm text-stone-700 dark:text-stone-300"
                >
                  <span>{service.icon}</span>
                  {service.label}
                </span>
              ))}
            </div>
          </section>

          {/* Account Info */}
          {(agent.accountNumber || agent.paymentTerms) && (
            <section>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">Account Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {agent.accountNumber && (
                  <div>
                    <span className="text-stone-500 dark:text-stone-400">Account #</span>
                    <p className="text-stone-900 dark:text-white font-medium">{agent.accountNumber}</p>
                  </div>
                )}
                {agent.paymentTerms && (
                  <div>
                    <span className="text-stone-500 dark:text-stone-400">Payment Terms</span>
                    <p className="text-stone-900 dark:text-white font-medium">{agent.paymentTerms}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Notes */}
          {agent.notes && (
            <section>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-white mb-3">Notes</h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-700/50 rounded-lg p-3">
                {agent.notes}
              </p>
            </section>
          )}

          {/* Messages */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-900 dark:text-white">
                Communication
              </h3>
              <button
                onClick={() => setShowNoteInput(!showNoteInput)}
                className="inline-flex items-center gap-1 text-xs text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300"
              >
                <FileText className="w-3.5 h-3.5" />
                Add Note
              </button>
            </div>

            {/* Add Note Input */}
            {showNoteInput && (
              <div className="mb-4 p-3 bg-stone-50 dark:bg-stone-700/50 rounded-lg">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Add an internal note..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-600 border border-stone-200 dark:border-stone-500 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent resize-none"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => {
                      setNoteContent('')
                      setShowNoteInput(false)
                    }}
                    className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-600 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNote}
                    disabled={!noteContent.trim()}
                    className="px-3 py-1.5 text-xs font-medium bg-lime-600 hover:bg-lime-700 disabled:bg-stone-300 dark:disabled:bg-stone-600 text-white rounded transition-colors"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            )}

            {/* Message List */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {agent.messages && agent.messages.length > 0 ? (
                agent.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-3 rounded-lg ${
                      message.direction === 'inbound'
                        ? 'bg-stone-100 dark:bg-stone-700/50'
                        : message.direction === 'note'
                        ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                        : 'bg-lime-50 dark:bg-lime-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                        {message.direction === 'note' ? (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Internal Note
                          </span>
                        ) : (
                          message.senderName
                        )}
                      </span>
                      <span className="text-xs text-stone-500 dark:text-stone-400">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-stone-600 dark:text-stone-400">{message.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-4">
                  No messages yet
                </p>
              )}
            </div>

            {/* Message Input */}
            <div className="mt-4 flex gap-2">
              <div className="flex-1 relative">
                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Send a message..."
                  className="w-full pl-10 pr-4 py-2 bg-stone-50 dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-lg text-sm text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!messageContent.trim()}
                className="px-4 py-2 bg-lime-600 hover:bg-lime-700 disabled:bg-stone-300 dark:disabled:bg-stone-600 text-white rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
