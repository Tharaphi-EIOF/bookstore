import { Menu } from 'lucide-react'

type ProfileSettingsHeroProps = {
  completeness: number
  hasUserId: boolean
  isDirty: boolean
  onOpenMobileMenu: () => void
  renderStat: (label: string, value: string, tone?: 'default' | 'accent') => React.ReactNode
}

const ProfileSettingsHero = ({
  completeness,
  hasUserId,
  isDirty,
  onOpenMobileMenu,
  renderStat,
}: ProfileSettingsHeroProps) => {
  return (
    <div className="relative overflow-hidden rounded-[2.25rem] border border-slate-200/85 bg-[linear-gradient(135deg,rgba(248,250,252,0.98)_0%,rgba(255,255,255,0.98)_42%,rgba(239,246,255,0.95)_100%)] p-6 shadow-[0_28px_80px_-52px_rgba(15,23,42,0.32)] dark:border-slate-800 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(15,23,42,0.92)_50%,rgba(30,41,59,0.92)_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(148,163,184,0.18),rgba(255,255,255,0)_30%),radial-gradient(circle_at_84%_18%,rgba(56,189,248,0.16),rgba(255,255,255,0)_22%)] dark:bg-[radial-gradient(circle_at_18%_24%,rgba(148,163,184,0.12),rgba(15,23,42,0)_30%),radial-gradient(circle_at_84%_18%,rgba(56,189,248,0.12),rgba(15,23,42,0)_22%)]" />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Profile Settings</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">Shape how your profile looks and feels.</h1>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[540px]">
          {renderStat('Profile completion', `${completeness}%`, 'accent')}
          {renderStat('Public profile', hasUserId ? 'Live and accessible' : 'Not available yet')}
          {renderStat('Changes', isDirty ? 'Ready to save' : 'Everything synced')}
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenMobileMenu}
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
      >
        <Menu className="h-4 w-4" />
        Settings Menu
      </button>
    </div>
  )
}

export default ProfileSettingsHero
