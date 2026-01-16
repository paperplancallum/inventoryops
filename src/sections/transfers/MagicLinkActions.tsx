'use client'

import { useState } from 'react'
import {
  Copy,
  Check,
  Mail,
  ExternalLink,
  RefreshCw,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react'

interface MagicLinkActionsProps {
  magicLinkUrl: string
  tokenExpiresAt: string
  shippingAgentName: string
  shippingAgentEmail?: string
  contactName?: string
  transferNumber?: string
  status: 'pending' | 'submitted' | 'expired'
  onRegenerateLink?: () => Promise<string | null>
  onCopied?: () => void
  variant?: 'inline' | 'compact'
  className?: string
}

export function MagicLinkActions({
  magicLinkUrl,
  tokenExpiresAt,
  shippingAgentName,
  shippingAgentEmail,
  contactName,
  transferNumber,
  status,
  onRegenerateLink,
  onCopied,
  variant = 'inline',
  className = '',
}: MagicLinkActionsProps) {
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [currentUrl, setCurrentUrl] = useState(magicLinkUrl)
  const [currentExpiry, setCurrentExpiry] = useState(tokenExpiresAt)

  // Calculate expiry status
  const expiryDate = new Date(currentExpiry)
  const now = new Date()
  const isExpired = expiryDate < now
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const isExpiringSoon = !isExpired && daysUntilExpiry <= 3

  // Determine effective status
  const effectiveStatus = isExpired ? 'expired' : status

  // Copy link to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      setCopied(true)
      onCopied?.()
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Open email client with pre-filled content
  const handleEmail = () => {
    if (!shippingAgentEmail) return

    const subject = encodeURIComponent(
      `Quote Request${transferNumber ? ` - ${transferNumber}` : ''}`
    )
    const body = encodeURIComponent(
      `Hi ${contactName || shippingAgentName},\n\n` +
        `We would like to request a shipping quote.\n\n` +
        `Please submit your quote using this secure link:\n${currentUrl}\n\n` +
        `This link will expire on ${expiryDate.toLocaleDateString()}.\n\n` +
        `Thank you,`
    )

    window.open(`mailto:${shippingAgentEmail}?subject=${subject}&body=${body}`)
  }

  // Regenerate expired link
  const handleRegenerate = async () => {
    if (!onRegenerateLink) return

    setRegenerating(true)
    try {
      const newUrl = await onRegenerateLink()
      if (newUrl) {
        setCurrentUrl(newUrl)
        // Set new expiry to 7 days from now
        const newExpiry = new Date()
        newExpiry.setDate(newExpiry.getDate() + 7)
        setCurrentExpiry(newExpiry.toISOString())
      }
    } catch (err) {
      console.error('Failed to regenerate link:', err)
    } finally {
      setRegenerating(false)
    }
  }

  // Format expiry for display
  const formatExpiry = () => {
    if (isExpired) {
      return `Expired ${expiryDate.toLocaleDateString()}`
    }
    if (daysUntilExpiry === 0) {
      return 'Expires today'
    }
    if (daysUntilExpiry === 1) {
      return 'Expires tomorrow'
    }
    return `Expires ${expiryDate.toLocaleDateString()}`
  }

  // Compact variant - just action buttons
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {effectiveStatus === 'expired' ? (
          <button
            onClick={handleRegenerate}
            disabled={regenerating || !onRegenerateLink}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 rounded transition-colors disabled:opacity-50"
          >
            {regenerating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
            Regenerate
          </button>
        ) : (
          <>
            <button
              onClick={handleCopy}
              className="p-1.5 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600 rounded transition-colors"
              title="Copy link"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            {shippingAgentEmail && (
              <button
                onClick={handleEmail}
                className="p-1.5 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600 rounded transition-colors"
                title="Send email"
              >
                <Mail className="w-3.5 h-3.5" />
              </button>
            )}
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600 rounded transition-colors"
              title="Open link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </>
        )}
      </div>
    )
  }

  // Inline variant - full info with actions
  return (
    <div className={`rounded-lg border p-3 ${
      effectiveStatus === 'expired'
        ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
        : isExpiringSoon
        ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
        : 'border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700/50'
    } ${className}`}>
      {/* Status header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {effectiveStatus === 'expired' ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-300">
              <AlertTriangle className="w-3 h-3" />
              Link Expired
            </span>
          ) : isExpiringSoon ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-3 h-3" />
              Expiring Soon
            </span>
          ) : effectiveStatus === 'submitted' ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-300">
              <Check className="w-3 h-3" />
              Quote Submitted
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 dark:text-stone-400">
              <Clock className="w-3 h-3" />
              Awaiting Response
            </span>
          )}
        </div>
        <span className={`text-xs ${
          effectiveStatus === 'expired'
            ? 'text-red-600 dark:text-red-400'
            : isExpiringSoon
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-stone-500 dark:text-stone-400'
        }`}>
          {formatExpiry()}
        </span>
      </div>

      {/* Link display */}
      {effectiveStatus !== 'expired' && (
        <div className="mb-2">
          <code className="block w-full p-2 bg-stone-100 dark:bg-stone-600 rounded text-xs text-stone-600 dark:text-stone-300 font-mono truncate">
            {currentUrl}
          </code>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {effectiveStatus === 'expired' ? (
          <button
            onClick={handleRegenerate}
            disabled={regenerating || !onRegenerateLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded transition-colors disabled:opacity-50"
          >
            {regenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Regenerate Link
          </button>
        ) : (
          <>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-200 bg-stone-200 dark:bg-stone-600 hover:bg-stone-300 dark:hover:bg-stone-500 rounded transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Link
                </>
              )}
            </button>
            {shippingAgentEmail && (
              <button
                onClick={handleEmail}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-lime-700 dark:text-lime-300 bg-lime-100 dark:bg-lime-900/30 hover:bg-lime-200 dark:hover:bg-lime-900/50 rounded transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Email Link
              </button>
            )}
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open
            </a>
          </>
        )}
      </div>
    </div>
  )
}
