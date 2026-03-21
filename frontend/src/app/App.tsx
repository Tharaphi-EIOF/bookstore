import { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import ScrollToTop from '@/components/ScrollToTop'
import { useAuthStore } from '@/store/auth.store'
import RouteFallback from '@/app/components/RouteFallback'
import { getPortalAccessState } from '@/app/routing/portal-rules'
import { Layout as PublicLayout, renderPublicChildRoutes } from '@/app/routes/public-routes'
import renderAdminRoutes from '@/app/routes/admin-routes'
import renderCSRoutes from '@/app/routes/cs-routes'

function App() {
  const { isAuthenticated, user, portalMode } = useAuthStore()
  const portalAccess = getPortalAccessState(user, portalMode)

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<PublicLayout />}>
            {renderPublicChildRoutes({
              isAuthenticated,
              user,
              portalMode,
              portalAccess,
            })}
          </Route>

          {renderCSRoutes()}
          {renderAdminRoutes({ user, portalAccess })}
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
