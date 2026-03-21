import { useMemo } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import ScrollProgressBar from '@/components/ui/ScrollProgressBar'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { canAccessAdmin } from '@/lib/permissions'

const topNavItems = [
  { name: 'Dashboard', path: '/cs' },
  { name: 'Inbox', path: '/cs/inbox' },
  { name: 'Inquiries', path: '/cs/inquiries' },
  { name: 'Escalations', path: '/cs/escalations' },
  { name: 'Team', path: '/cs/team' },
  { name: 'Knowledge', path: '/cs/knowledge' },
]

const CSLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const canReturnToAdmin = canAccessAdmin(user?.role, user?.permissions)

  const activeLabel = useMemo(() => {
    const active = topNavItems.find((item) => location.pathname === item.path || (item.path !== '/cs' && location.pathname.startsWith(item.path)))
    return active?.name ?? 'Service Desk'
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="luxe-shell min-h-screen text-slate-900 dark:text-slate-100">
      <ScrollProgressBar topClassName="top-0" widthClassName="w-full" />
      <div className="px-4 py-4 sm:px-6 lg:px-6 lg:py-5">
        <header className="cs-card sticky top-3 z-30 mb-4 rounded-2xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#61738a] dark:text-slate-400">Customer Service</p>
                <p className="text-base font-semibold text-[#1a2e45] dark:text-slate-100">{activeLabel}</p>
                <p className="text-xs text-[#607389] dark:text-slate-400">
                  Signed in as {user?.name || 'Unknown staff'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <nav className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white/70 p-1 text-sm dark:border-slate-700 dark:bg-slate-900/55">
                {topNavItems.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/cs' && location.pathname.startsWith(item.path))
                  return (
                    <Link
                      key={`cs-top-nav-${item.path}`}
                      to={item.path}
                      className={cn(
                        'whitespace-nowrap rounded-lg px-3 py-1.5 font-medium transition',
                        isActive
                          ? 'bg-[#e9f3ff] text-[#1e4061] dark:bg-[#112339] dark:text-slate-100'
                          : 'text-[#607389] hover:bg-white/80 hover:text-[#1f2f44] dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white',
                      )}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
              {canReturnToAdmin && (
                <Link
                  to="/admin"
                  className="inline-flex items-center justify-center rounded-xl border border-[#c2d6ea] bg-white/70 px-3 py-2 text-sm font-semibold text-[#2b4f70] transition hover:border-[#aac7e3] hover:bg-white dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100 dark:hover:border-slate-600"
                >
                  Back to Admin
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200 dark:hover:bg-rose-950/50"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        </header>

        <main className="min-w-0 space-y-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default CSLayout
