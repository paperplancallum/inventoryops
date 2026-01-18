// Settings Section Types

export type SettingsTab = 'amazon' | 'brands' | 'routes' | 'notifications' | 'preferences'

export interface SettingsTabOption {
  id: SettingsTab
  label: string
  description: string
  disabled?: boolean
}
