'use client'

import { AlertCircle, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react'
import type { ShippingQuote } from '@/sections/shipping-quotes/types'

interface PortalStatesProps {
  state: 'loading' | 'invalid' | 'expired' | 'already_submitted'
  message?: string
  quote?: ShippingQuote
  agentName?: string
}

export function PortalStates({ state, message, quote, agentName }: PortalStatesProps) {
  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Loading quote form...</p>
      </div>
    )
  }

  if (state === 'invalid') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Invalid Link
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message || 'This quote link is not valid. Please check the link or contact the requester.'}
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          If you believe this is an error, please contact{' '}
          <a href="mailto:support@inventoryops.com" className="text-blue-600 hover:underline">
            support@inventoryops.com
          </a>
        </div>
      </div>
    )
  }

  if (state === 'expired') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Link Expired
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message || 'This quote link has expired. Please contact the requester for a new link.'}
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Quote links are typically valid for 7 days. Request a new link to submit your quote.
        </div>
      </div>
    )
  }

  if (state === 'already_submitted' && quote) {
    return (
      <div className="space-y-6">
        {/* Success banner */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Quote Submitted
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {agentName ? `Thank you, ${agentName}! ` : ''}
            Your quote has been submitted successfully.
          </p>
        </div>

        {/* Quote summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Quote Summary
          </h3>

          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-600 dark:text-gray-400">Status</dt>
              <dd>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  quote.status === 'selected'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : quote.status === 'rejected'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {quote.status === 'selected' && 'Selected'}
                  {quote.status === 'rejected' && 'Not Selected'}
                  {quote.status === 'submitted' && 'Under Review'}
                </span>
              </dd>
            </div>

            {quote.totalAmount && (
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Total Amount</dt>
                <dd className="font-semibold text-gray-900 dark:text-white">
                  {quote.currency} {quote.totalAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </dd>
              </div>
            )}

            {quote.validUntil && (
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Valid Until</dt>
                <dd className="text-gray-900 dark:text-white">
                  {new Date(quote.validUntil).toLocaleDateString()}
                </dd>
              </div>
            )}

            {quote.submittedAt && (
              <div className="flex justify-between">
                <dt className="text-gray-600 dark:text-gray-400">Submitted</dt>
                <dd className="text-gray-900 dark:text-white">
                  {new Date(quote.submittedAt).toLocaleDateString()}
                </dd>
              </div>
            )}
          </dl>

          {/* Line items */}
          {quote.lineItems && quote.lineItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Breakdown
              </h4>
              <ul className="space-y-1">
                {quote.lineItems.map((item) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{item.description}</span>
                    <span className="text-gray-900 dark:text-white">
                      {quote.currency} {item.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {quote.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Notes
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {quote.notes}
              </p>
            </div>
          )}
        </div>

        {/* Info message */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium">What happens next?</p>
              <p className="mt-1">
                The requester will review all quotes and select a winner. You will be notified
                of the outcome. If you need to update your quote, please contact the requester directly.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
