'use client'

import { useState, useEffect } from 'react'
import { X, Link2, Mail, Copy, Check, ExternalLink, Send } from 'lucide-react'
import type { MagicLinkEntityType, MagicLinkPurpose, CreateMagicLinkData } from '@/lib/supabase/hooks/useMagicLinks'

// Type alias for backwards compatibility
type CreateMagicLinkInput = CreateMagicLinkData

interface GenerateMagicLinkModalProps {
  isOpen: boolean
  entityType: MagicLinkEntityType
  entityId: string
  entityName: string
  defaultPurpose?: MagicLinkPurpose
  defaultRecipientName?: string
  defaultRecipientEmail?: string
  onClose: () => void
  onGenerate: (input: CreateMagicLinkInput) => Promise<{ magicLink: { id: string }; rawToken: string } | null>
  onSendEmail?: (linkId: string, recipientEmail: string, recipientName: string, message?: string) => Promise<boolean>
}

const EXPIRATION_OPTIONS = [
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' },
]

const PURPOSE_OPTIONS: { id: MagicLinkPurpose; label: string; description: string }[] = [
  { id: 'invoice-submission', label: 'Invoice Submission', description: 'Supplier submits their pricing for the order' },
  { id: 'document-upload', label: 'Document Upload', description: 'Upload shipping documents (BOL, POD, etc.)' },
]

export function GenerateMagicLinkModal({
  isOpen,
  entityType,
  entityId,
  entityName,
  defaultPurpose,
  defaultRecipientName = '',
  defaultRecipientEmail = '',
  onClose,
  onGenerate,
  onSendEmail,
}: GenerateMagicLinkModalProps) {
  const [purpose, setPurpose] = useState<MagicLinkPurpose>(defaultPurpose || 'invoice-submission')
  const [expirationDays, setExpirationDays] = useState(14)
  const [recipientName, setRecipientName] = useState(defaultRecipientName)
  const [recipientEmail, setRecipientEmail] = useState(defaultRecipientEmail)
  const [message, setMessage] = useState('')
  const [sendImmediately, setSendImmediately] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ recipientName?: string; recipientEmail?: string }>({})

  // Generated link state
  const [generatedLink, setGeneratedLink] = useState<{ url: string; linkId: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPurpose(defaultPurpose || (entityType === 'purchase-order' ? 'invoice-submission' : 'document-upload'))
      setExpirationDays(14)
      setRecipientName(defaultRecipientName)
      setRecipientEmail(defaultRecipientEmail)
      setMessage('')
      setSendImmediately(true)
      setErrors({})
      setGeneratedLink(null)
      setCopied(false)
      setEmailSent(false)
    }
  }, [isOpen, entityType, defaultPurpose, defaultRecipientName, defaultRecipientEmail])

  if (!isOpen) return null

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!recipientName.trim()) {
      newErrors.recipientName = 'Recipient name is required'
    }

    if (!recipientEmail.trim()) {
      newErrors.recipientEmail = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      newErrors.recipientEmail = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setSubmitting(true)

    try {
      const result = await onGenerate({
        linkedEntityType: entityType,
        linkedEntityId: entityId,
        linkedEntityName: entityName,
        purpose,
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim().toLowerCase(),
        expirationDays,
      })

      if (result) {
        const formPath = purpose === 'invoice-submission' ? 'invoice' : 'documents'
        const url = `${window.location.origin}/forms/${formPath}/${result.rawToken}`
        setGeneratedLink({ url, linkId: result.magicLink.id })

        // Send email immediately if requested
        if (sendImmediately && onSendEmail) {
          setSendingEmail(true)
          const sent = await onSendEmail(
            result.magicLink.id,
            recipientEmail.trim().toLowerCase(),
            recipientName.trim(),
            message.trim() || undefined
          )
          setEmailSent(sent)
          setSendingEmail(false)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyLink = async () => {
    if (!generatedLink) return

    try {
      await navigator.clipboard.writeText(generatedLink.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleSendEmail = async () => {
    if (!generatedLink || !onSendEmail) return

    setSendingEmail(true)
    const sent = await onSendEmail(
      generatedLink.linkId,
      recipientEmail.trim().toLowerCase(),
      recipientName.trim(),
      message.trim() || undefined
    )
    setEmailSent(sent)
    setSendingEmail(false)
  }

  const handleClose = () => {
    if (submitting || sendingEmail) return
    onClose()
  }

  // Filter purpose options based on entity type
  const availablePurposes = entityType === 'purchase-order'
    ? PURPOSE_OPTIONS
    : PURPOSE_OPTIONS.filter(p => p.id === 'document-upload')

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg transform rounded-xl bg-white dark:bg-slate-800 shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {generatedLink ? 'Magic Link Generated' : 'Generate Magic Link'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                  {entityName}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={submitting || sendingEmail}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-500 dark:hover:text-slate-300 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {generatedLink ? (
            // Success State
            <div className="p-6">
              <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                  Magic link created successfully!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  This link will expire in {expirationDays} days.
                </p>
              </div>

              {/* Link Display */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Share this link with {recipientName}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink.url}
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white font-mono text-xs"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      copied
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Open Link Button */}
              <div className="mb-6">
                <a
                  href={generatedLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  <ExternalLink className="w-4 h-4" />
                  Preview link in new tab
                </a>
              </div>

              {/* Email Status */}
              {onSendEmail && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  {emailSent ? (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <Check className="w-4 h-4" />
                      Email sent to {recipientEmail}
                    </div>
                  ) : (
                    <button
                      onClick={handleSendEmail}
                      disabled={sendingEmail}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingEmail ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Send email to {recipientEmail}
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Done Button */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            // Form State
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Purpose Selection */}
              {availablePurposes.length > 1 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Purpose
                  </label>
                  <div className="space-y-2">
                    {availablePurposes.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                          purpose === opt.id
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700'
                            : 'bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="purpose"
                          value={opt.id}
                          checked={purpose === opt.id}
                          onChange={(e) => setPurpose(e.target.value as MagicLinkPurpose)}
                          className="mt-1"
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {opt.label}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {opt.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Recipient Name */}
              <div>
                <label htmlFor="recipientName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  id="recipientName"
                  value={recipientName}
                  onChange={(e) => {
                    setRecipientName(e.target.value)
                    setErrors({ ...errors, recipientName: undefined })
                  }}
                  placeholder="e.g., John Smith"
                  disabled={submitting}
                  className={`w-full rounded-lg border px-4 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${
                    errors.recipientName
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-slate-200 dark:border-slate-600'
                  }`}
                />
                {errors.recipientName && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.recipientName}</p>
                )}
              </div>

              {/* Recipient Email */}
              <div>
                <label htmlFor="recipientEmail" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  id="recipientEmail"
                  value={recipientEmail}
                  onChange={(e) => {
                    setRecipientEmail(e.target.value)
                    setErrors({ ...errors, recipientEmail: undefined })
                  }}
                  placeholder="e.g., john@supplier.com"
                  disabled={submitting}
                  className={`w-full rounded-lg border px-4 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${
                    errors.recipientEmail
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-slate-200 dark:border-slate-600'
                  }`}
                />
                {errors.recipientEmail && (
                  <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.recipientEmail}</p>
                )}
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Link Expiration
                </label>
                <div className="flex gap-2">
                  {EXPIRATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => setExpirationDays(opt.days)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        expirationDays === opt.days
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Message (optional)
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal message to include in the email..."
                  disabled={submitting}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-600 px-4 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 resize-none"
                />
              </div>

              {/* Send Immediately Toggle */}
              {onSendEmail && (
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendImmediately}
                      onChange={(e) => setSendImmediately(e.target.checked)}
                      className="sr-only peer"
                      disabled={submitting}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Send email immediately
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Generate Link
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
