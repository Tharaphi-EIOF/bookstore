import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SettingsNavItem, SettingsSection } from '@/features/profile/settings/types'

type ProfileSettingsNavProps = {
  activeSection: SettingsSection
  items: SettingsNavItem[]
  mobileOpen?: boolean
  onCloseMobile?: () => void
  onToggleCollapse?: () => void
  onSelect: (section: SettingsSection) => void
  sidebarCollapsed?: boolean
}

const NavItems = ({
  activeSection,
  items,
  onSelect,
  sidebarCollapsed = false,
}: {
  activeSection: SettingsSection
  items: SettingsNavItem[]
  onSelect: (section: SettingsSection) => void
  sidebarCollapsed?: boolean
}) => (
  <nav className="space-y-1">
    {items.map((item) => {
      const Icon = item.icon
      const isActive = activeSection === item.key
      return (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item.key)}
          className={cn(
            'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition',
            isActive
              ? 'bg-slate-950 text-white shadow-[0_16px_40px_-28px_rgba(15,23,42,0.55)] dark:bg-slate-100 dark:text-slate-900'
              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
            sidebarCollapsed && 'justify-center px-2',
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed ? (
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              {item.description ? (
                <p className={cn('text-xs', isActive ? 'text-white/80 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400')}>
                  {item.description}
                </p>
              ) : null}
            </div>
          ) : null}
        </button>
      )
    })}
  </nav>
)

const ProfileSettingsNav = ({
  activeSection,
  items,
  mobileOpen = false,
  onCloseMobile,
  onToggleCollapse,
  onSelect,
  sidebarCollapsed = false,
}: ProfileSettingsNavProps) => {
  if (mobileOpen) {
    return (
      <div className="fixed inset-0 z-50 lg:hidden">
        <button
          type="button"
          aria-label="Close settings menu"
          onClick={onCloseMobile}
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]"
        />
        <div className="absolute left-0 top-0 h-full w-[82%] max-w-sm border-r border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Settings Menu</p>
            <button
              type="button"
              onClick={onCloseMobile}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
              aria-label="Close settings menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <NavItems
            activeSection={activeSection}
            items={items}
            onSelect={(section) => {
              onSelect(section)
              onCloseMobile?.()
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <aside
      className={cn(
        'hidden rounded-[2rem] border border-slate-200/85 bg-white/86 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.22)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 lg:sticky lg:top-24 lg:block lg:self-start',
        sidebarCollapsed ? 'p-2' : 'p-3',
      )}
    >
      <div className={cn('mb-3 flex items-center justify-between', sidebarCollapsed ? 'px-0' : 'px-2')}>
        {!sidebarCollapsed ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Sections</p> : null}
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            'inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600',
            sidebarCollapsed && 'mx-auto',
          )}
          aria-label={sidebarCollapsed ? 'Expand settings menu' : 'Collapse settings menu'}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <NavItems
        activeSection={activeSection}
        items={items}
        onSelect={onSelect}
        sidebarCollapsed={sidebarCollapsed}
      />
    </aside>
  )
}

export default ProfileSettingsNav
