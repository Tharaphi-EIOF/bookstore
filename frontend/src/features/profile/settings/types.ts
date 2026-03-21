import type { ComponentType } from 'react'

export type SettingsSection = 'identity' | 'appearance' | 'privacy' | 'notifications' | 'creator' | 'security'

export type SettingsNavItem = {
  key: SettingsSection
  label: string
  description?: string
  icon: ComponentType<{ className?: string }>
}
