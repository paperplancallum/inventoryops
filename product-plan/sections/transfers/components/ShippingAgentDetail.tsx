import { useState, useRef } from 'react'
import type { ShippingAgentDetailProps, ShippingService } from '@/../product/sections/transfers/types'
import { MessageThread } from '../../purchase-orders/components/MessageThread'
import { MessageComposer } from '../../purchase-orders/components/MessageComposer'

// Icons
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

const EnvelopeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
)

const GlobeIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
)

const MapPinIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const serviceIcons: Record<ShippingService, string> = {
  ocean: '🚢',
  air: '✈️',
  trucking: '🚚',
  rail: '🚂',
  courier: '📦',
}

const serviceLabels: Record<ShippingService, string> = {
  ocean: 'Ocean Freight',
  air: 'Air Freight',
  trucking: 'Trucking/Ground',
  rail: 'Rail',
  courier: 'Courier/Express',
}

export function ShippingAgentDetail({
  agent,
  onEdit,
  onClose,
  onSendMessage,
  onAddNote,
}: ShippingAgentDetailProps) {
  const messageCount = agent.messages?.length || 0
  const [messagesExpanded, setMessagesExpanded] = useState(messageCount <= 3)
  const composerRef = useRef<HTMLDivElement>(null)

  const scrollToComposer = () => {
    setMessagesExpanded(true)
    setTimeout(() => {
      composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  const formatAddress = () => {
    if (!agent.address) return null
    const parts = [
      agent.address.street,
      agent.address.city,
      agent.address.state,
      agent.address.country,
      agent.address.postalCode,
    ].filter(Boolean)
    return parts.join(', ')
  }

  // Convert ShippingAgentMessage to Message type for MessageThread
  const messages = (agent.messages || []).map(msg => ({
    id: msg.id,
    direction: msg.direction,
    senderName: msg.senderName,
    senderEmail: msg.senderEmail,
    timestamp: msg.timestamp,
    content: msg.content,
    attachments: msg.attachments,
  }))

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-slate-800 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-lg font-semibold">
                {agent.name.charAt(0)}
              </div>
              <div>
                <span className="text-lg font-semibold text-slate-900 dark:text-white">
                  {agent.name}
                </span>
                <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  agent.isActive
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  {agent.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <XIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Contact Information */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Contact Information</h3>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  {agent.contactName.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-slate-900 dark:text-white">{agent.contactName}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Primary Contact</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 text-sm">
                  <EnvelopeIcon />
                  <a href={`mailto:${agent.email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">
                    {agent.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <PhoneIcon />
                  {agent.phone}
                </div>
                {agent.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <GlobeIcon />
                    <a href={agent.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                      {agent.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {formatAddress() && (
                  <div className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 sm:col-span-2">
                    <MapPinIcon />
                    {formatAddress()}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Services */}
          <section>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Services Offered</h3>
            <div className="flex flex-wrap gap-2">
              {agent.services.map(service => (
                <span
                  key={service}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  <span>{serviceIcons[service]}</span>
                  {serviceLabels[service]}
                </span>
              ))}
            </div>
          </section>

          {/* Account Information */}
          {agent.accountNumber && (
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Account Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Account Number</span>
                  <p className="text-slate-900 dark:text-white font-medium">{agent.accountNumber}</p>
                </div>
              </div>
            </section>
          )}

          {/* Notes */}
          {agent.notes && (
            <section>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Notes</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                {agent.notes}
              </p>
            </section>
          )}

          {/* Messages */}
          <section className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            {/* Collapsible header */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50">
              <button
                onClick={() => setMessagesExpanded(!messagesExpanded)}
                className="flex-1 flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="text-slate-500 dark:text-slate-400">
                  {messagesExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                </span>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Messages {messageCount > 0 && `(${messageCount})`}
                </h3>
              </button>
              {!messagesExpanded && (
                <button
                  onClick={scrollToComposer}
                  className="flex items-center gap-1.5 px-3 py-1.5 mr-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                >
                  <PlusIcon />
                  New
                </button>
              )}
            </div>

            {/* Collapsible content */}
            {messagesExpanded && (
              <div className="border-t border-slate-200 dark:border-slate-700">
                <div className="p-4 space-y-4">
                  <MessageThread messages={messages} />
                  <div ref={composerRef}>
                    <MessageComposer
                      onSend={(content, attachments) => {
                        onSendMessage?.(agent.id, content, attachments)
                      }}
                      onAddNote={(content) => {
                        onAddNote?.(agent.id, content)
                      }}
                      placeholder={`Write a message to ${agent.name}...`}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
