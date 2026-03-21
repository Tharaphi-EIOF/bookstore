import { Bell, CircleUser, LockKeyhole, Palette, Shield, Sparkles } from 'lucide-react'
import type { SettingsNavItem } from '@/features/profile/settings/types'

export const settingsNav: SettingsNavItem[] = [
  { key: 'identity', label: 'Identity', icon: CircleUser },
  { key: 'appearance', label: 'Appearance', icon: Palette },
  { key: 'privacy', label: 'Privacy', icon: Shield },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'creator', label: 'Creator Tools', icon: Sparkles },
  { key: 'security', label: 'Security', icon: LockKeyhole },
]

export const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'my', label: 'Myanmar' },
  { value: 'th', label: 'Thai' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
]

export const timezoneOptions = [
  'UTC',
  'Asia/Yangon',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
]
