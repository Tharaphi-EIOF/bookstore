import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AdminPageIntro from '@/components/admin/AdminPageIntro'
import { AdminOverviewContent } from '@/features/admin/pages/AdminPage'
import { AdminAnalyticsContent } from '@/features/admin/pages/AdminAnalyticsPage'
import { useAuthStore } from '@/store/auth.store'
import { hasPermission } from '@/lib/permissions'

type InsightsTab = 'overview' | 'analytics'

const TAB_BUTTON_CLASS_NAME = 'rounded-[18px] px-4 py-2 text-xs font-semibold transition'

const AdminInsightsPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const canViewAnalytics =
    user?.role === 'ADMIN'
    || user?.role === 'SUPER_ADMIN'
    || hasPermission(user?.permissions, 'finance.reports.view')

  const activeTab = useMemo<InsightsTab>(() => {
    if (location.pathname === '/admin/analytics' || location.pathname === '/admin/author-performance') {
      return canViewAnalytics ? 'analytics' : 'overview'
    }
    const tabParam = new URLSearchParams(location.search).get('tab')
    if (tabParam === 'analytics' && canViewAnalytics) return 'analytics'
    return 'overview'
  }, [canViewAnalytics, location.pathname, location.search])

  const setTab = (tab: InsightsTab) => {
    if (tab === 'analytics' && !canViewAnalytics) return
    navigate({
      pathname: '/admin',
      search: tab === 'analytics' ? '?tab=analytics' : '',
    })
  }

  return (
    <div className="space-y-6 p-8 dark:text-slate-100">
      <AdminPageIntro
        title="Insights"
        actions={(
          <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => setTab('overview')}
              className={`${TAB_BUTTON_CLASS_NAME} ${
                activeTab === 'overview'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900'
              }`}
            >
              Overview
            </button>
            {canViewAnalytics ? (
              <button
                type="button"
                onClick={() => setTab('analytics')}
                className={`${TAB_BUTTON_CLASS_NAME} ${
                  activeTab === 'analytics'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900'
                }`}
              >
                Analytics
              </button>
            ) : null}
          </div>
        )}
      />

      {activeTab === 'overview' ? <AdminOverviewContent embedded /> : <AdminAnalyticsContent embedded />}
    </div>
  )
}

export default AdminInsightsPage
