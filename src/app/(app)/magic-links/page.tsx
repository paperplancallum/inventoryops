'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { useMagicLinks, type MagicLinkEntityType, type MagicLink, type MagicLinkEvent } from '@/lib/supabase/hooks'
import { MagicLinksView, MagicLinkDetailPanel } from '@/sections/magic-links/components'

export default function MagicLinksPage() {
  const router = useRouter()
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null)
  const [selectedLink, setSelectedLink] = useState<MagicLink | null>(null)
  const [selectedLinkEvents, setSelectedLinkEvents] = useState<MagicLinkEvent[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  const {
    magicLinks,
    loading,
    error,
    filters,
    summary,
    statusOptions,
    entityTypeOptions,
    purposeOptions,
    fetchMagicLink,
    revokeMagicLink,
    regenerateMagicLink,
    sendReminder,
    updateFilters,
    resetFilters,
  } = useMagicLinks()

  // Handle view link details
  const handleViewLink = useCallback(async (id: string) => {
    setSelectedLinkId(id)
    setDetailLoading(true)
    try {
      const link = await fetchMagicLink(id)
      if (link) {
        setSelectedLink(link)
        setSelectedLinkEvents(link.events || [])
      }
    } finally {
      setDetailLoading(false)
    }
  }, [fetchMagicLink])

  // Handle close detail panel
  const handleCloseDetail = useCallback(() => {
    setSelectedLinkId(null)
    setSelectedLink(null)
    setSelectedLinkEvents([])
  }, [])

  // Handle revoke link (from list)
  const handleRevokeLink = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to revoke this link? The recipient will no longer be able to access it.')) {
      await revokeMagicLink(id)
    }
  }, [revokeMagicLink])

  // Handle revoke link (from detail panel)
  const handleRevokeFromPanel = useCallback(async (id: string) => {
    await revokeMagicLink(id)
    // Refresh the detail view
    const updated = await fetchMagicLink(id)
    if (updated) {
      setSelectedLink(updated)
      setSelectedLinkEvents(updated.events || [])
    }
  }, [revokeMagicLink, fetchMagicLink])

  // Handle regenerate link (from list)
  const handleRegenerateLink = useCallback(async (id: string) => {
    const result = await regenerateMagicLink(id)
    if (result) {
      alert(`New link created!\n\nURL: ${window.location.origin}/forms/${result.magicLink.purpose === 'invoice-submission' ? 'invoice' : 'documents'}/${result.rawToken}`)
    }
  }, [regenerateMagicLink])

  // Handle regenerate link (from detail panel)
  const handleRegenerateFromPanel = useCallback(async (id: string) => {
    const result = await regenerateMagicLink(id)
    // Close current panel and open the new link
    if (result) {
      setSelectedLink(result.magicLink)
      setSelectedLinkEvents([])
      // Fetch full details for new link
      const newLink = await fetchMagicLink(result.magicLink.id)
      if (newLink) {
        setSelectedLink(newLink)
        setSelectedLinkEvents(newLink.events || [])
      }
    }
    return result
  }, [regenerateMagicLink, fetchMagicLink])

  // Handle send reminder (from list)
  const handleSendReminder = useCallback(async (id: string) => {
    const success = await sendReminder(id)
    if (success) {
      alert('Reminder logged. Email will be sent shortly.')
    }
  }, [sendReminder])

  // Handle send reminder (from detail panel)
  const handleSendReminderFromPanel = useCallback(async (id: string) => {
    const success = await sendReminder(id)
    if (success) {
      // Refresh events
      const updated = await fetchMagicLink(id)
      if (updated) {
        setSelectedLinkEvents(updated.events || [])
      }
    }
    return success
  }, [sendReminder, fetchMagicLink])

  // Handle view entity
  const handleViewEntity = useCallback((entityType: MagicLinkEntityType, entityId: string) => {
    if (entityType === 'purchase-order') {
      router.push(`/purchase-orders/${entityId}`)
    } else if (entityType === 'transfer') {
      router.push(`/transfers?transfer=${entityId}`)
    }
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400">Failed to load magic links</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <MagicLinksView
        magicLinks={magicLinks}
        summary={summary}
        filters={filters}
        isLoading={loading}
        statusOptions={statusOptions}
        entityTypeOptions={entityTypeOptions}
        purposeOptions={purposeOptions}
        onFiltersChange={updateFilters}
        onResetFilters={resetFilters}
        onViewLink={handleViewLink}
        onRevokeLink={handleRevokeLink}
        onRegenerateLink={handleRegenerateLink}
        onSendReminder={handleSendReminder}
        onViewEntity={handleViewEntity}
      />

      {/* Detail Panel */}
      {selectedLinkId && (
        <MagicLinkDetailPanel
          link={selectedLink}
          events={selectedLinkEvents}
          isLoading={detailLoading}
          onClose={handleCloseDetail}
          onRevoke={handleRevokeFromPanel}
          onRegenerate={handleRegenerateFromPanel}
          onSendReminder={handleSendReminderFromPanel}
        />
      )}
    </>
  )
}
