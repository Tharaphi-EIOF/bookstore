import { lazy } from 'react'
import { Navigate, Route } from 'react-router-dom'
import AdminRoute from '@/components/guards/AdminRoute'
import PermissionRoute from '@/components/guards/PermissionRoute'
import type { PortalAccessState } from '@/app/routing/portal-rules'
import type { User } from '@/store/auth.store'

const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'))

const AdminInsightsPage = lazy(() => import('@/features/admin/pages/AdminInsightsPage'))
const AdminBooksPage = lazy(() => import('@/features/admin/pages/AdminBooksPage'))
const AdminBooksBinPage = lazy(() => import('@/features/admin/pages/AdminBooksBinPage'))
const AdminOrdersPage = lazy(() => import('@/features/admin/pages/AdminOrdersPage'))
const AdminUsersPage = lazy(() => import('@/features/admin/pages/AdminUsersPage'))
const AdminWarehousesPage = lazy(() => import('@/features/admin/pages/AdminWarehousesPage'))
const AdminStaffPage = lazy(() => import('@/features/admin/pages/AdminStaffPage'))
const AdminDepartmentsPage = lazy(() => import('@/features/admin/pages/AdminDepartmentsPage'))
const AdminRolesPermissionsPage = lazy(() => import('@/features/admin/pages/AdminRolesPermissionsPage'))
const AdminStaffTasksPage = lazy(() => import('@/features/admin/pages/AdminStaffTasksPage'))
const AdminPerformancePage = lazy(() => import('@/features/admin/pages/AdminPerformancePage'))
const AdminAuditLogsPage = lazy(() => import('@/features/admin/pages/AdminAuditLogsPage'))
const HRDashboardPage = lazy(() => import('@/features/admin/pages/HRDashboardPage'))
const WarehouseDashboardPage = lazy(() => import('@/features/admin/pages/WarehouseDashboardPage'))
const AdminDeliveryPage = lazy(() => import('@/features/admin/pages/AdminDeliveryPage'))
const AdminPurchaseRequestsPage = lazy(() => import('@/features/admin/pages/AdminPurchaseRequestsPage'))
const AdminPurchaseOrdersPage = lazy(() => import('@/features/admin/pages/AdminPurchaseOrdersPage'))
const AdminVendorsPage = lazy(() => import('@/features/admin/pages/AdminVendorsPage'))
const AdminBookDistributionPage = lazy(() => import('@/features/admin/pages/AdminBookDistributionPage'))
const AdminStoresPage = lazy(() => import('@/features/admin/pages/AdminStoresPage'))
const AdminInquiriesPage = lazy(() => import('@/features/admin/pages/AdminInquiriesPage'))
const AdminPromotionsPage = lazy(() => import('@/features/admin/pages/AdminPromotionsPage'))
const AdminPricingPage = lazy(() => import('@/features/admin/pages/AdminPricingPage'))
const AdminBookLeadsPage = lazy(() => import('@/features/admin/pages/AdminBookLeadsPage'))
const AdminReorderSuggestionsPage = lazy(() => import('@/features/admin/pages/AdminReorderSuggestionsPage'))
const AdminLoyaltyPage = lazy(() => import('@/features/admin/pages/AdminLoyaltyPage'))
const AdminBlogModerationPage = lazy(() => import('@/features/admin/pages/AdminBlogModerationPage'))

type AdminRoutesProps = {
  user: User | null
  portalAccess: PortalAccessState
}

const renderAdminRoutes = ({ user, portalAccess }: AdminRoutesProps) => (
  <Route
    path="/admin"
    element={
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    }
  >
    <Route
      index
      element={
        portalAccess.isHrFocusedUser
          ? <HRDashboardPage />
          : portalAccess.isWarehouseFocusedUser
            ? <WarehouseDashboardPage />
            : <AdminInsightsPage />
      }
    />
    <Route
      path="books"
      element={portalAccess.canUseAdminBooks ? <AdminBooksPage /> : <Navigate to="/admin" replace />}
    />
    <Route
      path="books/bin"
      element={portalAccess.canUseAdminBooks ? <AdminBooksBinPage /> : <Navigate to="/admin" replace />}
    />
    <Route
      path="bin"
      element={portalAccess.canUseAdminBooks ? <AdminBooksBinPage /> : <Navigate to="/admin" replace />}
    />
    <Route
      path="orders"
      element={<PermissionRoute permission="finance.reports.view"><AdminOrdersPage /></PermissionRoute>}
    />
    <Route
      path="book-leads"
      element={<PermissionRoute permission="finance.reports.view"><AdminBookLeadsPage /></PermissionRoute>}
    />
    <Route
      path="author-performance"
      element={<PermissionRoute permission="finance.reports.view"><AdminInsightsPage /></PermissionRoute>}
    />
    <Route
      path="reorder-suggestions"
      element={<PermissionRoute permission="finance.reports.view"><AdminReorderSuggestionsPage /></PermissionRoute>}
    />
    <Route
      path="analytics"
      element={<PermissionRoute permission="finance.reports.view"><AdminInsightsPage /></PermissionRoute>}
    />
    <Route
      path="blog-moderation"
      element={<PermissionRoute permission="blogs.moderate"><AdminBlogModerationPage /></PermissionRoute>}
    />
    <Route
      path="pricing"
      element={<PermissionRoute permission="finance.payout.manage"><AdminPricingPage /></PermissionRoute>}
    />
    <Route
      path="promotions"
      element={<PermissionRoute permission="finance.payout.manage"><AdminPromotionsPage /></PermissionRoute>}
    />
    <Route
      path="loyalty"
      element={<PermissionRoute permission="finance.payout.manage"><AdminLoyaltyPage /></PermissionRoute>}
    />
    <Route
      path="users"
      element={portalAccess.canUseAdminUsers ? <AdminUsersPage /> : <Navigate to="/admin" replace />}
    />
    <Route
      path="delivery"
      element={<PermissionRoute permission="warehouse.purchase_order.view"><AdminDeliveryPage /></PermissionRoute>}
    />
    <Route
      path="warehouses"
      element={<PermissionRoute permission="warehouse.view"><AdminWarehousesPage /></PermissionRoute>}
    />
    <Route
      path="book-distribution"
      element={<PermissionRoute permission="warehouse.view"><AdminBookDistributionPage /></PermissionRoute>}
    />
    <Route
      path="stores"
      element={<PermissionRoute permission="warehouse.view"><AdminStoresPage /></PermissionRoute>}
    />
    <Route
      path="vendors"
      element={
        <PermissionRoute permission={['warehouse.view', 'warehouse.vendor.manage']} requireAll={false}>
          <AdminVendorsPage />
        </PermissionRoute>
      }
    />
    <Route
      path="purchase-requests"
      element={
        <PermissionRoute
          permission={[
            'warehouse.purchase_request.view',
            'finance.purchase_request.review',
            'finance.purchase_request.approve',
            'finance.purchase_request.reject',
          ]}
          requireAll={false}
        >
          <AdminPurchaseRequestsPage />
        </PermissionRoute>
      }
    />
    <Route
      path="purchase-orders"
      element={
        <PermissionRoute
          permission={[
            'warehouse.purchase_order.view',
            'finance.purchase_order.view',
            'warehouse.purchase_order.create',
            'warehouse.purchase_order.receive',
          ]}
          requireAll={false}
        >
          <AdminPurchaseOrdersPage />
        </PermissionRoute>
      }
    />
    <Route
      path="staff"
      element={<PermissionRoute permission="staff.view"><AdminStaffPage /></PermissionRoute>}
    />
    <Route
      path="staff/departments"
      element={<PermissionRoute permission={['staff.manage', 'staff.view']} requireAll><AdminDepartmentsPage /></PermissionRoute>}
    />
    <Route
      path="staff/roles"
      element={<PermissionRoute permission="admin.permission.manage"><AdminRolesPermissionsPage /></PermissionRoute>}
    />
    <Route
      path="staff/audit-logs"
      element={<PermissionRoute permission="admin.permission.manage"><AdminAuditLogsPage /></PermissionRoute>}
    />
    <Route
      path="staff/tasks"
      element={<PermissionRoute permission={['staff.view', 'hr.performance.manage']} requireAll><AdminStaffTasksPage /></PermissionRoute>}
    />
    <Route
      path="staff/performance"
      element={<PermissionRoute permission="hr.performance.manage"><AdminPerformancePage /></PermissionRoute>}
    />
    <Route
      path="inquiries"
      element={user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? <AdminInquiriesPage /> : <Navigate to="/admin" replace />}
    />
  </Route>
)

export default renderAdminRoutes
