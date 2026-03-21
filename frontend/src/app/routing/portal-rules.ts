import { canAccessAdmin, canAccessCS, hasPermission } from '@/lib/permissions'
import type { User } from '@/store/auth.store'

export type PortalMode = 'buyer' | 'staff' | null

export type PortalAccessState = {
  canUseAdmin: boolean
  canUseCS: boolean
  hasStaffPortalAccess: boolean
  isStaffLinkedUser: boolean
  isBuyerSession: boolean
  staffPortalPath: string
  isDualPortalUser: boolean
  isHrFocusedUser: boolean
  isWarehouseFocusedUser: boolean
  canUseAdminBooks: boolean
  canUseAdminUsers: boolean
  canUseAdminInquiries: boolean
}

export const getPortalAccessState = (
  user: User | null,
  portalMode: PortalMode,
): PortalAccessState => {
  const canUseAdminPortal = canAccessAdmin(user?.role, user?.permissions)
  const canUseCSPortal = canAccessCS(user?.role, user?.permissions)
  const hasStaffPortalAccess = canUseAdminPortal || canUseCSPortal
  const isStaffLinkedUser = !!user?.isStaff
  const isBuyerSession =
    user?.role === 'USER' && !isStaffLinkedUser && portalMode === 'buyer'
  const isAdminRole = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const staffPortalPath =
    canUseAdminPortal && isAdminRole
      ? '/admin'
      : canUseCSPortal
        ? '/cs'
        : '/admin'
  const isDualPortalUser =
    user?.role === 'USER' && !isStaffLinkedUser && canUseAdminPortal && !canUseCSPortal
  const isHrFocusedUser =
    user?.role === 'USER'
    && (
      hasPermission(user?.permissions, 'staff.view')
      || hasPermission(user?.permissions, 'staff.manage')
      || hasPermission(user?.permissions, 'hr.performance.manage')
    )
    && !hasPermission(user?.permissions, 'finance.reports.view')
    && !hasPermission(user?.permissions, 'warehouse.view')
  const isWarehouseFocusedUser =
    user?.role === 'USER'
    && hasPermission(user?.permissions, 'warehouse.view')
    && (
      hasPermission(user?.permissions, 'warehouse.stock.update')
      || hasPermission(user?.permissions, 'warehouse.transfer')
    )
    && !hasPermission(user?.permissions, 'finance.reports.view')
    && !hasPermission(user?.permissions, 'staff.view')

  return {
    canUseAdmin: canUseAdminPortal,
    canUseCS: canUseCSPortal,
    hasStaffPortalAccess,
    isStaffLinkedUser,
    isBuyerSession,
    staffPortalPath,
    isDualPortalUser,
    isHrFocusedUser,
    isWarehouseFocusedUser,
    canUseAdminBooks: isAdminRole,
    canUseAdminUsers: isAdminRole,
    canUseAdminInquiries: isAdminRole,
  }
}
