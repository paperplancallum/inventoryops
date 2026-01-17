'use client'

import { useState, useCallback } from 'react'
import { useLocations } from '@/lib/supabase/hooks/useLocations'
import {
  LocationsView,
  LocationForm,
  ArchiveConfirmationDialog,
  LOCATION_TYPES,
} from '@/sections/locations'
import type { Location, LocationFormData } from '@/sections/locations/types'

export default function LocationsPage() {
  // Fetch all locations including archived
  const {
    locations,
    loading,
    error,
    refetch,
    createLocation,
    updateLocation,
    archiveLocation,
    unarchiveLocation,
    checkReferences,
    getLocation,
  } = useLocations({ includeArchived: true })

  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Archive confirmation dialog state
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [archiveTargetLocation, setArchiveTargetLocation] = useState<Location | null>(null)
  const [isArchiving, setIsArchiving] = useState(true)

  // Handlers
  const handleCreateLocation = useCallback(() => {
    setEditingLocation(null)
    setIsFormOpen(true)
  }, [])

  const handleEditLocation = useCallback(async (id: string) => {
    const location = await getLocation(id)
    if (location) {
      setEditingLocation(location)
      setIsFormOpen(true)
    }
  }, [getLocation])

  const handleViewLocation = useCallback(async (id: string) => {
    // For now, just edit the location - could add a detail view later
    handleEditLocation(id)
  }, [handleEditLocation])

  const handleArchiveLocation = useCallback(async (id: string) => {
    const location = locations.find(l => l.id === id)
    if (location) {
      // Check for references first
      const refs = await checkReferences(id)
      if (refs.hasReferences) {
        // Show warning but still allow archiving
        console.log(`Location has ${refs.stockLedgerEntries} stock entries and ${refs.suppliers} suppliers linked`)
      }

      setArchiveTargetLocation(location)
      setIsArchiving(true)
      setArchiveDialogOpen(true)
    }
  }, [locations, checkReferences])

  const handleUnarchiveLocation = useCallback((id: string) => {
    const location = locations.find(l => l.id === id)
    if (location) {
      setArchiveTargetLocation(location)
      setIsArchiving(false)
      setArchiveDialogOpen(true)
    }
  }, [locations])

  const handleConfirmArchive = useCallback(async (confirmName: string) => {
    if (!archiveTargetLocation) return

    if (confirmName === archiveTargetLocation.name) {
      if (isArchiving) {
        await archiveLocation(archiveTargetLocation.id)
      } else {
        await unarchiveLocation(archiveTargetLocation.id)
      }
      setArchiveDialogOpen(false)
      setArchiveTargetLocation(null)
    }
  }, [archiveTargetLocation, isArchiving, archiveLocation, unarchiveLocation])

  const handleFormSubmit = useCallback(async (data: LocationFormData) => {
    setIsSubmitting(true)

    try {
      if (editingLocation) {
        // Update existing location
        await updateLocation(editingLocation.id, {
          name: data.name,
          type: data.type,
          addressLine1: data.addressLine1 || undefined,
          addressLine2: data.addressLine2 || undefined,
          city: data.city || undefined,
          stateProvince: data.stateProvince || undefined,
          country: data.country,
          countryCode: data.countryCode || undefined,
          postalCode: data.postalCode || undefined,
          contactName: data.contactName || undefined,
          contactEmail: data.contactEmail || undefined,
          contactPhone: data.contactPhone || undefined,
          notes: data.notes || undefined,
        })
      } else {
        // Create new location
        await createLocation({
          name: data.name,
          type: data.type,
          addressLine1: data.addressLine1 || undefined,
          addressLine2: data.addressLine2 || undefined,
          city: data.city || undefined,
          stateProvince: data.stateProvince || undefined,
          country: data.country,
          countryCode: data.countryCode || undefined,
          postalCode: data.postalCode || undefined,
          contactName: data.contactName || undefined,
          contactEmail: data.contactEmail || undefined,
          contactPhone: data.contactPhone || undefined,
          isActive: true,
          notes: data.notes || undefined,
        })
      }

      setIsFormOpen(false)
      setEditingLocation(null)
    } catch (err) {
      console.error('Failed to save location:', err)
    } finally {
      setIsSubmitting(false)
    }
  }, [editingLocation, createLocation, updateLocation])

  const handleFormCancel = useCallback(() => {
    setIsFormOpen(false)
    setEditingLocation(null)
  }, [])

  const handleCancelArchive = useCallback(() => {
    setArchiveDialogOpen(false)
    setArchiveTargetLocation(null)
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Failed to load locations</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <LocationsView
        locations={locations}
        locationTypes={LOCATION_TYPES}
        loading={loading}
        onViewLocation={handleViewLocation}
        onEditLocation={handleEditLocation}
        onArchiveLocation={handleArchiveLocation}
        onUnarchiveLocation={handleUnarchiveLocation}
        onCreateLocation={handleCreateLocation}
        onRefresh={refetch}
      />

      {/* Location Form Modal */}
      {isFormOpen && (
        <LocationForm
          location={editingLocation || undefined}
          locationTypes={LOCATION_TYPES}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Archive/Unarchive Confirmation Dialog */}
      {archiveTargetLocation && (
        <ArchiveConfirmationDialog
          isOpen={archiveDialogOpen}
          locationName={archiveTargetLocation.name}
          onConfirm={handleConfirmArchive}
          onCancel={handleCancelArchive}
          isArchiving={isArchiving}
        />
      )}
    </>
  )
}
