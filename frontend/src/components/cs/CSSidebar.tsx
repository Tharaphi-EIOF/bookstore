import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Headset, Inbox, LifeBuoy, LogOut, MessageSquareText, ShieldAlert, UsersRound } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useInquiries, useInquiryOverview } from '@/services/inquiries'
import { canAccessAdmin } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import LiveBadge from './LiveBadge'

const navItems = [
  { name: 'Dashboard', path: '/cs', icon: Headset },
  { name: 'Inbox', path: '/cs/inbox', icon: Inbox },
  { name: 'Inquiries', path: '/cs/inquiries', icon: MessageSquareText },
  { name: 'Escalations', path: '/cs/escalations', icon: ShieldAlert },
  { name: 'Team', path: '/cs/team', icon: UsersRound },
  { name: 'Knowledge', path: '/cs/knowledge', icon: LifeBuoy },
]

type CSSidebarProps = {
  collapsed?: boolean
}

const CSSidebar = ({ collapsed = false }: CSSidebarProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { data: overview } = useInquiryOverview(undefined, true)
  const { data: escalations } = useInquiries({ status: 'ESCALATED', page: 1, limit: 1 }, true)
  const escalatedCount = escalations?.total ?? 0
  const canReturnToAdmin = canAccessAdmin(user?.role, user?.permissions)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className={cn(
        'luxe-panel sticky top-[5.25rem] hidden h-[calc(100vh-6.25rem)] flex-shrink-0 rounded-2xl px-3 py-4 transition-all duration-200 lg:block',
        collapsed ? 'w-[84px]' : 'w-[280px]',
      )}
    >
      <div className={cn('mb-6', collapsed && 'text-center')}>
        {!collapsed ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#61738a] dark:text-slate-400">
              Customer Service
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#14263a] dark:text-white">Service Desk</h2>
            <p className="mt-1 text-sm text-[#71839a] dark:text-slate-400">
              {user?.staffTitle || 'Service workflow'}
            </p>
            <p className="mt-2 text-xs text-[#5f7087] dark:text-slate-400">
              Signed in as {user?.name || 'Unknown staff'}
            </p>
          </>
        ) : (
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-[#bdd4ee] bg-[#e9f3ff] text-[#1e4061] dark:border-[#3a6488] dark:bg-[#112339] dark:text-slate-100">
            <Headset className="h-5 w-5" />
          </div>
        )}
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/cs' && location.pathname.startsWith(item.path))
          const Icon = item.icon
          return (
            <Link
              key={`${item.name}-${item.path}`}
              to={item.path}
              className={cn(
                'relative flex items-center rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
                collapsed ? 'justify-center' : 'gap-3 pl-4',
                isActive
                  ? 'luxe-card border-[#bdd4ee] bg-[#e9f3ff] text-[#1e4061] dark:border-[#3a6488] dark:bg-[#112339] dark:text-slate-100'
                  : 'border-transparent text-[#62748b] hover:border-[#c7d7ea] hover:text-[#1f2f44] dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white',
              )}
              title={collapsed ? item.name : undefined}
            >
              {isActive && (
                <span className="absolute inset-y-2 left-1 w-0.5 rounded-full bg-[#2d5d8c] dark:bg-[#8eb5d8]" />
              )}
              <Icon className="h-4 w-4 opacity-80" />
              {!collapsed && <span className="flex-1">{item.name}</span>}
              {!collapsed && item.path === '/cs/inbox' && overview?.totals?.unchecked && (
                <LiveBadge count={overview.totals.unchecked} variant="urgent" size="sm" />
              )}
              {!collapsed && item.path === '/cs/escalations' && escalatedCount > 0 && (
                <LiveBadge count={escalatedCount} variant="urgent" size="sm" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-6 border-t border-[#c7d7ea] pt-4 dark:border-slate-700">
        {!collapsed && (
          <p className="text-xs text-[#71839a] dark:text-slate-400">
            Queue refreshes every minute.
          </p>
        )}
        <div className={cn('mt-3 space-y-2', collapsed && 'mt-0')}>
          {canReturnToAdmin && (
            <Link
              to="/admin"
              className={cn(
                'inline-flex items-center justify-center rounded-xl border border-[#c2d6ea] bg-white/70 px-3 py-2 text-sm font-semibold text-[#2b4f70] transition hover:border-[#aac7e3] hover:bg-white dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100 dark:hover:border-slate-600',
                collapsed ? 'w-full px-0' : 'w-full',
              )}
              title={collapsed ? 'Back to Admin Dashboard' : undefined}
            >
              {collapsed ? 'A' : 'Back to Admin Dashboard'}
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200 dark:hover:bg-rose-950/50',
              collapsed && 'px-0',
            )}
            title={collapsed ? 'Log out' : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && 'Log out'}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default CSSidebar
