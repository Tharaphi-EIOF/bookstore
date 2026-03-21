export type StaffStatus = 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE'
export type StaffTaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED'
export type StaffTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface Department {
  id: string
  name: string
  code: string
  description?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    staffProfiles: number
    staffRoles: number
  }
}

export interface StaffPermission {
  id: string
  key: string
  description?: string | null
}

export interface StaffRole {
  id: string
  code?: string | null
  name: string
  departmentId?: string | null
  isSystem: boolean
  permissions: Array<{
    permission: StaffPermission
  }>
  _count?: {
    assignments: number
  }
}

export interface StaffProfile {
  id: string
  userId: string
  departmentId: string
  employeeCode: string
  title: string
  managerId?: string | null
  status: StaffStatus
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
  }
  department: Department
  assignments: Array<{
    id: string
    roleId: string
    effectiveFrom: string
    effectiveTo?: string | null
    role: StaffRole
  }>
  _count?: {
    tasks: number
  }
}

export interface StaffCandidate {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
}

export interface StaffTask {
  id: string
  staffId: string
  type: string
  status: StaffTaskStatus
  priority: StaffTaskPriority
  metadata?: Record<string, unknown> | null
  createdAt: string
  completedAt?: string | null
  staff: {
    id: string
    user: {
      id: string
      name: string
      email: string
    }
    department: {
      id: string
      name: string
      code: string
    }
  }
}

export interface ElevatedAccount {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'SUPER_ADMIN'
  isActive: boolean
  createdAt: string
  staffProfile: null | {
    id: string
    title: string
    status: StaffStatus
    department: {
      id: string
      name: string
      code: string
    }
  }
}

export interface StaffPerformanceResponse {
  summary: {
    totalTasks: number
    completedTasks: number
    completionRate: number
    statusCounts: Record<string, number>
  }
  byDepartment: Array<{
    departmentId: string
    departmentName: string
    total: number
    completed: number
    completionRate: number
  }>
  byStaff: Array<{
    staffId: string
    name: string
    departmentName: string
    total: number
    completed: number
    completionRate: number
  }>
}

export interface CommercialPerformanceResponse {
  summary: {
    buyersCount: number
    booksTracked: number
    totalRevenue: number
    totalOrders: number
  }
  period: {
    fromDate: string | null
    toDate: string | null
    limit: number
  }
  topBuyers: Array<{
    userId: string
    name: string
    email: string
    orderCount: number
    totalSpend: number
  }>
  topBooksByUnits: Array<{
    bookId: string
    title: string
    author: string
    isbn: string
    units: number
    revenue: number
  }>
  topBooksByRevenue: Array<{
    bookId: string
    title: string
    author: string
    isbn: string
    units: number
    revenue: number
  }>
}

export interface AuditLogEntry {
  id: string
  actorUserId?: string | null
  action: string
  resource: string
  resourceId?: string | null
  changes?: Record<string, unknown> | null
  createdAt: string
  actor?: {
    id: string
    name: string
    email: string
  } | null
}
