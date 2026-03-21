import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Copy,
  Globe,
  Languages,
  LockKeyhole,
  MapPin,
  Shuffle,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import ProfileAccountHubSection from '@/features/profile/settings/components/ProfileAccountHubSection'
import ProfileSettingsActions from '@/features/profile/settings/components/ProfileSettingsActions'
import ProfileNotificationsSection from '@/features/profile/settings/components/ProfileNotificationsSection'
import ProfileSettingsNav from '@/features/profile/settings/components/ProfileSettingsNav'
import ProfilePrivacySection from '@/features/profile/settings/components/ProfilePrivacySection'
import ProfileSettingsToggleRow from '@/features/profile/settings/components/ProfileSettingsToggleRow'
import { languageOptions, settingsNav, timezoneOptions } from '@/features/profile/settings/constants'
import type { SettingsSection } from '@/features/profile/settings/types'
import { useChangePassword, useUpdateProfile, type UpdateProfileData, useUploadAvatar } from '@/services/auth'
import Avatar, { AVATARS, BACKGROUND_COLORS } from '@/features/profile/shared/components/Avatar'
import { cn } from '@/lib/utils'
import { resolveMediaUrl } from '@/lib/media'

const inputBaseClass =
  'mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400/50 dark:focus:bg-slate-900 dark:focus:ring-sky-500/10'

const textareaBaseClass =
  'mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm leading-6 text-slate-900 transition placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400/50 dark:focus:bg-slate-900 dark:focus:ring-sky-500/10'

const Card = ({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) => (
  <section className="rounded-[2rem] border border-slate-200/85 bg-white/88 p-6 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.28)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/92">
    <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
    {subtitle ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
    <div className="mt-5">{children}</div>
  </section>
)

const Field = ({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) => (
  <div>
    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
    {children}
    {hint ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
  </div>
)

const isValidAbsoluteUrl = (value: string) => {
  if (!value.trim()) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const ProfileSettingsPage = () => {
  const { user } = useAuthStore()
  const updateProfileMutation = useUpdateProfile()
  const changePasswordMutation = useChangePassword()
  const uploadAvatarMutation = useUploadAvatar()
  const uploadCoverMutation = useUploadAvatar()
  const uploadQrMutation = useUploadAvatar()

  const [activeSection, setActiveSection] = useState<SettingsSection>('identity')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [name, setName] = useState(user?.name || '')
  const [avatarValue, setAvatarValue] = useState(user?.avatarValue || 'avatar-1')
  const [activeAvatarTab, setActiveAvatarTab] = useState<'emoji' | 'upload'>(user?.avatarType || 'emoji')
  const [selectedBg, setSelectedBg] = useState(user?.backgroundColor || 'bg-slate-100')
  const [pronouns, setPronouns] = useState(user?.pronouns || '')
  const [shortBio, setShortBio] = useState(user?.shortBio || '')
  const [about, setAbout] = useState(user?.about || '')
  const [coverImage, setCoverImage] = useState(user?.coverImage || '')
  const [location, setLocation] = useState(user?.location || '')
  const [website, setWebsite] = useState(user?.website || '')
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC')
  const [language, setLanguage] = useState(user?.language || 'en')
  const [showEmail, setShowEmail] = useState(!!user?.showEmail)
  const [showFollowers, setShowFollowers] = useState(user?.showFollowers ?? true)
  const [showFollowing, setShowFollowing] = useState(user?.showFollowing ?? true)
  const [showFavorites, setShowFavorites] = useState(!!user?.showFavorites)
  const [showLikedPosts, setShowLikedPosts] = useState(!!user?.showLikedPosts)
  const [emailUpdatesEnabled, setEmailUpdatesEnabled] = useState(user?.emailUpdatesEnabled ?? true)
  const [followerAlertsEnabled, setFollowerAlertsEnabled] = useState(user?.followerAlertsEnabled ?? true)
  const [marketingEmailsEnabled, setMarketingEmailsEnabled] = useState(user?.marketingEmailsEnabled ?? false)
  const [supportEnabled, setSupportEnabled] = useState(!!user?.supportEnabled)
  const [supportUrl, setSupportUrl] = useState(user?.supportUrl || '')
  const [supportQrImage, setSupportQrImage] = useState(user?.supportQrImage || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  const publicProfilePath = `/user/${user?.id ?? ''}`
  const publicProfileUrl = typeof window === 'undefined' ? publicProfilePath : `${window.location.origin}${publicProfilePath}`

  // Form state
  useEffect(() => {
    if (!user) return
    setName(user.name)
    setAvatarValue(user.avatarValue || 'avatar-1')
    setActiveAvatarTab(user.avatarType || 'emoji')
    setSelectedBg(user.backgroundColor || 'bg-slate-100')
    setPronouns(user.pronouns || '')
    setShortBio(user.shortBio || '')
    setAbout(user.about || '')
    setCoverImage(user.coverImage || '')
    setLocation(user.location || '')
    setWebsite(user.website || '')
    setTimezone(user.timezone || 'UTC')
    setLanguage(user.language || 'en')
    setShowEmail(!!user.showEmail)
    setShowFollowers(user.showFollowers ?? true)
    setShowFollowing(user.showFollowing ?? true)
    setShowFavorites(!!user.showFavorites)
    setShowLikedPosts(!!user.showLikedPosts)
    setEmailUpdatesEnabled(user.emailUpdatesEnabled ?? true)
    setFollowerAlertsEnabled(user.followerAlertsEnabled ?? true)
    setMarketingEmailsEnabled(user.marketingEmailsEnabled ?? false)
    setSupportEnabled(!!user.supportEnabled)
    setSupportUrl(user.supportUrl || '')
    setSupportQrImage(user.supportQrImage || '')
  }, [user])

  // Derived state
  const isDirty = useMemo(() => {
    if (!user) return false
    return (
      name !== user.name
      || avatarValue !== (user.avatarValue || 'avatar-1')
      || activeAvatarTab !== (user.avatarType || 'emoji')
      || selectedBg !== (user.backgroundColor || 'bg-slate-100')
      || pronouns !== (user.pronouns || '')
      || shortBio !== (user.shortBio || '')
      || about !== (user.about || '')
      || coverImage !== (user.coverImage || '')
      || location !== (user.location || '')
      || website !== (user.website || '')
      || timezone !== (user.timezone || 'UTC')
      || language !== (user.language || 'en')
      || showEmail !== !!user.showEmail
      || showFollowers !== (user.showFollowers ?? true)
      || showFollowing !== (user.showFollowing ?? true)
      || showFavorites !== !!user.showFavorites
      || showLikedPosts !== !!user.showLikedPosts
      || emailUpdatesEnabled !== (user.emailUpdatesEnabled ?? true)
      || followerAlertsEnabled !== (user.followerAlertsEnabled ?? true)
      || marketingEmailsEnabled !== (user.marketingEmailsEnabled ?? false)
      || supportEnabled !== !!user.supportEnabled
      || supportUrl !== (user.supportUrl || '')
      || supportQrImage !== (user.supportQrImage || '')
    )
  }, [
    user,
    name,
    avatarValue,
    activeAvatarTab,
    selectedBg,
    pronouns,
    shortBio,
    about,
    coverImage,
    location,
    website,
    timezone,
    language,
    showEmail,
    showFollowers,
    showFollowing,
    showFavorites,
    showLikedPosts,
    emailUpdatesEnabled,
    followerAlertsEnabled,
    marketingEmailsEnabled,
    supportEnabled,
    supportUrl,
    supportQrImage,
  ])

  const passwordStrength = useMemo(() => {
    if (!newPassword) return null
    let score = 0
    if (newPassword.length >= 8) score += 1
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score += 1
    if (/\d/.test(newPassword)) score += 1
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1

    if (score <= 1) return { label: 'Weak', tone: 'rose' as const }
    if (score <= 3) return { label: 'Medium', tone: 'amber' as const }
    return { label: 'Strong', tone: 'emerald' as const }
  }, [newPassword])

  // Shared handlers
  const validateImageFile = (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Only JPG, PNG, and WebP images are allowed.' })
      return false
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 2MB.' })
      return false
    }

    return true
  }

  const handleImageUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    upload: (file: File) => Promise<{ url: string }>,
    onSuccess: (url: string) => void,
    loadingLabel: string,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!validateImageFile(file)) return

    try {
      const result = await upload(file)
      onSuccess(resolveMediaUrl(result.url))
      setMessage({ type: 'success', text: `${loadingLabel} uploaded successfully.` })
      window.setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      const text = error instanceof Error ? error.message : `Failed to upload ${loadingLabel.toLowerCase()}.`
      setMessage({ type: 'error', text })
    } finally {
      event.target.value = ''
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setMessage(null)

    if (name.trim().length < 2 || name.trim().length > 30) {
      setMessage({ type: 'error', text: 'Display name must be between 2 and 30 characters.' })
      return
    }

    if (shortBio.length > 160) {
      setMessage({ type: 'error', text: 'Short bio must stay within 160 characters.' })
      return
    }

    if (about.length > 4000) {
      setMessage({ type: 'error', text: 'About section must stay within 4000 characters.' })
      return
    }

    if (!isValidAbsoluteUrl(website)) {
      setMessage({ type: 'error', text: 'Website must be a valid URL starting with http:// or https://.' })
      return
    }

    if (supportEnabled && !supportUrl.trim()) {
      setMessage({ type: 'error', text: 'Support URL is required when creator support is enabled.' })
      return
    }

    if (!isValidAbsoluteUrl(supportUrl)) {
      setMessage({ type: 'error', text: 'Support URL must be a valid URL starting with http:// or https://.' })
      return
    }

    if (!isValidAbsoluteUrl(supportQrImage)) {
      setMessage({ type: 'error', text: 'QR image must be a valid URL starting with http:// or https://.' })
      return
    }

    const avatarValueToSave =
      activeAvatarTab === 'emoji'
        ? (avatarValue.includes('/') ? 'avatar-1' : avatarValue)
        : avatarValue

    if (activeAvatarTab === 'upload' && !avatarValueToSave.includes('/')) {
      setMessage({ type: 'error', text: 'Upload an avatar image before saving.' })
      return
    }

    const payload: UpdateProfileData = {
      name: name.trim(),
      avatarType: activeAvatarTab,
      avatarValue: avatarValueToSave,
      backgroundColor: selectedBg,
      pronouns: pronouns.trim() || undefined,
      shortBio: shortBio.trim() || undefined,
      about: about.trim() || undefined,
      coverImage: coverImage.trim() || undefined,
      location: location.trim() || undefined,
      website: website.trim() || undefined,
      timezone,
      language,
      showEmail,
      showFollowers,
      showFollowing,
      showFavorites,
      showLikedPosts,
      emailUpdatesEnabled,
      followerAlertsEnabled,
      marketingEmailsEnabled,
      supportEnabled,
      supportUrl: supportUrl.trim() || undefined,
      supportQrImage: supportQrImage.trim() || undefined,
    }

    updateProfileMutation.mutate(payload, {
      onSuccess: () => {
        setMessage({ type: 'success', text: 'Profile settings saved.' })
        window.setTimeout(() => setMessage(null), 3000)
      },
      onError: (error) => {
        const text = error instanceof Error ? error.message : 'Failed to save profile settings.'
        setMessage({ type: 'error', text })
      },
    })
  }

  const handlePasswordSubmit = async (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.()
    setMessage(null)

    if (currentPassword.length < 6) {
      setMessage({ type: 'error', text: 'Current password must be at least 6 characters.' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters.' })
      return
    }

    if (newPassword !== confirmNewPassword) {
      setMessage({ type: 'error', text: 'New password and confirmation do not match.' })
      return
    }

    if (currentPassword === newPassword) {
      setMessage({ type: 'error', text: 'New password must be different from the current password.' })
      return
    }

    try {
      const result = await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setMessage({ type: 'success', text: result.message })
      window.setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Failed to change password.'
      setMessage({ type: 'error', text })
    }
  }

  const handleCopyProfileLink = async () => {
    if (!user?.id) {
      setMessage({ type: 'error', text: 'Profile link is not available yet.' })
      return
    }

    try {
      await navigator.clipboard.writeText(publicProfileUrl)
      setMessage({ type: 'success', text: 'Profile link copied.' })
      window.setTimeout(() => setMessage(null), 3000)
    } catch {
      setMessage({ type: 'error', text: 'Could not copy profile link.' })
    }
  }

  const handleRandomizeAvatar = () => {
    const nextAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)]
    const nextBackground = BACKGROUND_COLORS[Math.floor(Math.random() * BACKGROUND_COLORS.length)]
    setActiveAvatarTab('emoji')
    setAvatarValue(nextAvatar.id)
    setSelectedBg(nextBackground.class)
  }

  return (
    <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-6 lg:px-8">
      <div
        className={cn(
          'grid gap-6',
          sidebarCollapsed
            ? 'lg:grid-cols-[92px,minmax(0,1fr)]'
            : 'lg:grid-cols-[260px,minmax(0,1fr)]',
        )}
      >
        <ProfileSettingsNav
          activeSection={activeSection}
          items={settingsNav}
          onSelect={setActiveSection}
          onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {message ? (
            <div
              className={cn(
                'rounded-2xl border px-4 py-3 text-sm',
                message.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/25 dark:text-emerald-200'
                  : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/25 dark:text-rose-200',
              )}
            >
              {message.text}
            </div>
          ) : null}

          {activeSection === 'identity' ? (
            <div className="space-y-6">
              {/* Identity preview */}
              <Card title="Live Preview">
                <div className="grid gap-6 xl:grid-cols-[360px,minmax(0,1fr)]">
                  <div className="overflow-hidden rounded-[1.9rem] border border-slate-200 bg-slate-50 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.24)] dark:border-slate-700 dark:bg-slate-950/70">
                    <div
                      className={cn(
                        'relative h-44 bg-cover bg-center',
                        coverImage
                          ? 'bg-slate-200'
                          : 'bg-[linear-gradient(135deg,rgba(226,232,240,0.95)_0%,rgba(241,245,249,0.98)_52%,rgba(219,234,254,0.9)_100%)] dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(30,41,59,0.94)_52%,rgba(14,116,144,0.28)_100%)]',
                      )}
                      style={coverImage ? { backgroundImage: `url(${resolveMediaUrl(coverImage)})` } : undefined}
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.55),rgba(255,255,255,0)_30%),linear-gradient(to_bottom,rgba(255,255,255,0.08),rgba(255,255,255,0.42))] dark:bg-[radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.12),rgba(15,23,42,0)_30%),linear-gradient(to_bottom,rgba(15,23,42,0.08),rgba(15,23,42,0.36))]" />
                      {!coverImage ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                          <button
                            type="button"
                            onClick={() => setActiveSection('appearance')}
                            className="rounded-full border border-white/70 bg-white/75 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm transition hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                          >
                            Add cover
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <div className="relative z-10 -mt-12 px-6 pb-6">
                      <button type="button" onClick={() => setActiveSection('appearance')} className="rounded-full">
                        <Avatar
                          avatarType={activeAvatarTab}
                          avatarValue={activeAvatarTab === 'emoji' ? (avatarValue.includes('/') ? 'avatar-1' : avatarValue) : avatarValue}
                          backgroundColor={selectedBg}
                          size="xl"
                          className="relative z-10 border-4 border-white shadow-[0_20px_40px_-24px_rgba(15,23,42,0.45)] transition hover:scale-[1.02] dark:border-slate-900"
                        />
                      </button>
                      <p className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">{name || 'Your Name'}</p>
                      {pronouns ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{pronouns}</p> : null}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                        {location ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900">
                            <MapPin className="h-3.5 w-3.5" />
                            {location}
                          </span>
                        ) : null}
                        {language ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900">
                            <Languages className="h-3.5 w-3.5" />
                            {language.toUpperCase()}
                          </span>
                        ) : null}
                        {website ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900">
                            <Globe className="h-3.5 w-3.5" />
                            Website linked
                          </span>
                        ) : null}
                      </div>
                      {shortBio ? <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{shortBio}</p> : null}
                      <div className="mt-5 flex flex-wrap gap-2">
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                          {showFollowers ? 'Followers visible' : 'Followers hidden'}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                          {supportEnabled ? 'Support enabled' : 'Support off'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.98)_100%)] p-5 dark:border-slate-700 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94)_0%,rgba(17,24,39,0.96)_100%)]">
                    <div className="border-b border-slate-200/80 pb-4 dark:border-white/10">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Profile tools</p>
                    </div>
                    <div className="mt-5 grid gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveSection('identity')}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900"
                      >
                        Identity
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSection('appearance')}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900"
                      >
                        Appearance
                        <ArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyProfileLink}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900"
                      >
                        Copy public profile link
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Identity fields */}
              <Card title="Identity & Public Basics">
                <div className="space-y-6">
                <div className="rounded-[1.75rem] border border-slate-200/85 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-950/45">
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <Field label="Display name">
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        maxLength={30}
                        className={inputBaseClass}
                        placeholder="Your display name"
                      />
                      <p className="mt-2 text-xs text-slate-500">{name.length}/30</p>
                    </Field>

                    <Field label="Pronouns">
                      <input
                        value={pronouns}
                        onChange={(event) => setPronouns(event.target.value)}
                        maxLength={30}
                        className={inputBaseClass}
                        placeholder="e.g. she/her"
                      />
                    </Field>

                    <Field label="Location">
                      <input
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                        maxLength={120}
                        className={inputBaseClass}
                        placeholder="Yangon, Myanmar"
                      />
                    </Field>

                    <Field label="Website">
                      <input
                        value={website}
                        onChange={(event) => setWebsite(event.target.value)}
                        className={inputBaseClass}
                        placeholder="https://example.com"
                      />
                    </Field>

                    <Field label="Timezone">
                      <select
                        value={timezone}
                        onChange={(event) => setTimezone(event.target.value)}
                        className={inputBaseClass}
                      >
                        {timezoneOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Language">
                      <select
                        value={language}
                        onChange={(event) => setLanguage(event.target.value)}
                        className={inputBaseClass}
                      >
                        {languageOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
                  <div className="rounded-[1.75rem] border border-slate-200/85 bg-slate-50/70 p-5 dark:border-slate-700 dark:bg-slate-950/45">
                    <Field label="Short bio">
                      <textarea
                        value={shortBio}
                        onChange={(event) => setShortBio(event.target.value)}
                        maxLength={160}
                        rows={5}
                        className={textareaBaseClass}
                        placeholder="Reader, writer, and curator of unusual stories."
                      />
                      <p className="mt-2 text-xs text-slate-500">{shortBio.length}/160</p>
                    </Field>
                  </div>

                  <div className="rounded-[1.75rem] border border-slate-200/85 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] dark:border-slate-700 dark:bg-slate-900/65">
                    <Field label="About">
                      <textarea
                        value={about}
                        onChange={(event) => setAbout(event.target.value)}
                        maxLength={4000}
                        rows={9}
                        className={textareaBaseClass}
                        placeholder="Tell readers what you do, what you write, and what matters to you."
                      />
                      <p className="mt-2 text-xs text-slate-500">{about.length}/4000</p>
                    </Field>
                  </div>
                </div>
                </div>
              </Card>
            </div>
          ) : null}

          {activeSection === 'appearance' ? (
            /* Appearance settings */
            <Card title="Appearance & Media">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),320px]">
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Avatar style</p>
                    <div className="mt-3 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveAvatarTab('emoji')}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-sm font-medium transition',
                          activeAvatarTab === 'emoji'
                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
                        )}
                      >
                        Emoji
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveAvatarTab('upload')}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-sm font-medium transition',
                          activeAvatarTab === 'upload'
                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
                        )}
                      >
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={handleRandomizeAvatar}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        <Shuffle className="h-4 w-4" />
                        Randomize
                      </button>
                    </div>

                    {activeAvatarTab === 'emoji' ? (
                      <>
                        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
                          {AVATARS.map((avatar) => (
                            <div key={avatar.id} className="flex justify-center">
                              <Avatar
                                avatarType="emoji"
                                avatarValue={avatar.id}
                                backgroundColor={selectedBg}
                                size="md"
                                onClick={() => setAvatarValue(avatar.id)}
                                className={cn('border-2', avatarValue === avatar.id ? 'border-slate-900 dark:border-slate-100' : 'border-transparent')}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-5 grid grid-cols-6 gap-2 sm:grid-cols-8">
                          {BACKGROUND_COLORS.map((bg) => (
                            <button
                              key={bg.id}
                              type="button"
                              onClick={() => setSelectedBg(bg.class)}
                              className={cn(
                                'h-8 w-8 rounded-full border-2 transition',
                                bg.class,
                                selectedBg === bg.class ? 'border-slate-900 dark:border-slate-100' : 'border-transparent',
                              )}
                              title={bg.id}
                            />
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="mt-4 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(event) =>
                            void handleImageUpload(
                              event,
                              uploadAvatarMutation.mutateAsync,
                              (url) => setAvatarValue(url),
                              'Avatar',
                            )
                          }
                          disabled={uploadAvatarMutation.isPending}
                        />
                        {uploadAvatarMutation.isPending ? <p className="mt-2 text-xs text-slate-500">Uploading avatar...</p> : null}
                      </div>
                    )}
                  </div>

                  <div className="rounded-[1.6rem] border border-slate-200/85 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-950/45">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Cover image</p>
                      </div>
                    </div>
                    <input
                      value={coverImage}
                      onChange={(event) => setCoverImage(event.target.value)}
                      className={inputBaseClass}
                      placeholder="https://..."
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600">
                        Upload cover
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(event) =>
                            void handleImageUpload(
                              event,
                              uploadCoverMutation.mutateAsync,
                              (url) => setCoverImage(url),
                              'Cover image',
                            )
                          }
                          disabled={uploadCoverMutation.isPending}
                          className="hidden"
                        />
                      </label>
                      {coverImage ? (
                        <button
                          type="button"
                          onClick={() => setCoverImage('')}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-900"
                        >
                          Remove cover
                        </button>
                      ) : null}
                      {uploadCoverMutation.isPending ? <span className="text-xs text-slate-500">Uploading cover...</span> : null}
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/70">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Profile card</p>
                  <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    <div
                      className="h-32 bg-cover bg-center"
                      style={coverImage ? { backgroundImage: `url(${resolveMediaUrl(coverImage)})` } : undefined}
                    />
                    <div className="-mt-10 flex flex-col items-center px-4 pb-5">
                      <Avatar
                        avatarType={activeAvatarTab}
                        avatarValue={activeAvatarTab === 'emoji' ? (avatarValue.includes('/') ? 'avatar-1' : avatarValue) : avatarValue}
                        backgroundColor={selectedBg}
                        size="lg"
                        className="border-4 border-white dark:border-slate-900"
                      />
                      <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">{name || 'Your Name'}</p>
                      <p className="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">{shortBio || 'A concise introduction will show here.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : null}

          {activeSection === 'privacy' ? (
            /* Privacy settings */
            <Card title="Privacy Controls">
              <ProfilePrivacySection
                showEmail={showEmail}
                showFollowers={showFollowers}
                showFollowing={showFollowing}
                showFavorites={showFavorites}
                showLikedPosts={showLikedPosts}
                onShowEmailChange={setShowEmail}
                onShowFollowersChange={setShowFollowers}
                onShowFollowingChange={setShowFollowing}
                onShowFavoritesChange={setShowFavorites}
                onShowLikedPostsChange={setShowLikedPosts}
              />
            </Card>
          ) : null}

          {activeSection === 'notifications' ? (
            /* Notification settings */
            <Card title="Notification Preferences">
              <ProfileNotificationsSection
                emailUpdatesEnabled={emailUpdatesEnabled}
                followerAlertsEnabled={followerAlertsEnabled}
                marketingEmailsEnabled={marketingEmailsEnabled}
                onEmailUpdatesChange={setEmailUpdatesEnabled}
                onFollowerAlertsChange={setFollowerAlertsEnabled}
                onMarketingEmailsChange={setMarketingEmailsEnabled}
              />
            </Card>
          ) : null}

          {activeSection === 'creator' ? (
            /* Creator tools */
            <Card title="Creator Support & Public Profile">
              <div className="space-y-5">
                <ProfileSettingsToggleRow
                  label='Enable "Support this author" on blog posts'
                  description="A support action will appear on your published blog pages."
                  checked={supportEnabled}
                  onChange={setSupportEnabled}
                />

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr),320px]">
                  <div className="space-y-5">
                    <Field label="Support checkout URL">
                      <input
                        value={supportUrl}
                        onChange={(event) => setSupportUrl(event.target.value)}
                        className={inputBaseClass}
                        placeholder="https://buymeacoffee.com/yourname"
                      />
                    </Field>

                    <Field label="Support QR image">
                      <input
                        value={supportQrImage}
                        onChange={(event) => setSupportQrImage(event.target.value)}
                        className={inputBaseClass}
                        placeholder="https://.../support-qr.png"
                      />
                      <div className="mt-3 flex items-center gap-2">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600">
                          Upload QR
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) =>
                              void handleImageUpload(
                                event,
                                uploadQrMutation.mutateAsync,
                                (url) => setSupportQrImage(url),
                                'QR image',
                              )
                            }
                            disabled={uploadQrMutation.isPending}
                            className="hidden"
                          />
                        </label>
                        {uploadQrMutation.isPending ? <span className="text-xs text-slate-500">Uploading QR image...</span> : null}
                      </div>
                    </Field>
                  </div>

                  <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-300">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Public profile link</p>
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-900">
                      {user?.id ? (
                        <div className="space-y-3">
                          <Link to={publicProfilePath} className="block truncate font-semibold text-slate-900 underline dark:text-slate-100">
                            {publicProfilePath}
                          </Link>
                          <button
                            type="button"
                            onClick={handleCopyProfileLink}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy link
                          </button>
                        </div>
                      ) : (
                        'Your public profile link will appear here once the session user is available.'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : null}

          {activeSection === 'security' ? (
            /* Security settings */
            <Card title="Security">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),320px]">
                <div className="space-y-4">
                  <Field label="Current password">
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      className={inputBaseClass}
                      placeholder="Current password"
                    />
                  </Field>

                  <Field label="New password">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className={inputBaseClass}
                      placeholder="New password"
                    />
                  </Field>

                  {passwordStrength ? (
                    <div
                      className={cn(
                        'rounded-2xl border px-4 py-3 text-sm font-medium',
                        passwordStrength.tone === 'emerald' && 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/25 dark:text-emerald-200',
                        passwordStrength.tone === 'amber' && 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-900/25 dark:text-amber-200',
                        passwordStrength.tone === 'rose' && 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-900/25 dark:text-rose-200',
                      )}
                    >
                      Password strength: {passwordStrength.label}
                    </div>
                  ) : null}

                  <Field label="Confirm new password">
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(event) => setConfirmNewPassword(event.target.value)}
                      className={inputBaseClass}
                      placeholder="Confirm new password"
                    />
                  </Field>

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={(event) => void handlePasswordSubmit(event)}
                      disabled={changePasswordMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                      <LockKeyhole className="h-4 w-4" />
                      {changePasswordMutation.isPending ? 'Updating...' : 'Update password'}
                    </button>
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-300">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Security status</p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70">
                      Password sign-in enabled
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70">
                      Current session stays active after password change
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : null}

          {/* Account shortcuts */}
          <Card title="Account Hub">
            <ProfileAccountHubSection />
          </Card>

          <ProfileSettingsActions
            canSave={isDirty}
            isSaving={updateProfileMutation.isPending}
            profilePath={`/user/${user?.id ?? ''}`}
          />
        </form>
      </div>

      {mobileMenuOpen ? (
        <ProfileSettingsNav
          activeSection={activeSection}
          items={settingsNav}
          mobileOpen
          onCloseMobile={() => setMobileMenuOpen(false)}
          onSelect={setActiveSection}
        />
      ) : null}
    </div>
  )
}

export default ProfileSettingsPage
