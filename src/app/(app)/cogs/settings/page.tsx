'use client'

import { useCOGSSettings } from '@/lib/supabase/hooks'
import { COGSSettingsView } from '@/sections/cogs'

export default function COGSSettingsPage() {
  const {
    settings,
    defaultSettings,
    isLoading,
    error,
    createSettings,
    updateSettings,
    deleteSettings,
    setAsDefault,
  } = useCOGSSettings()

  return (
    <COGSSettingsView
      settings={settings}
      defaultSettings={defaultSettings}
      isLoading={isLoading}
      error={error}
      onCreateSettings={createSettings}
      onUpdateSettings={updateSettings}
      onDeleteSettings={deleteSettings}
      onSetAsDefault={setAsDefault}
    />
  )
}
