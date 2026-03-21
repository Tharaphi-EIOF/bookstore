import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AuditLogEntry } from './staff-types'

export const useAuditLogs = (params?: {
  actorUserId?: string
  resource?: string
  action?: string
  limit?: number
  enabled?: boolean
}) =>
  useQuery({
    queryKey: ['staff-audit-logs', params || {}],
    queryFn: async (): Promise<AuditLogEntry[]> => {
      const response = await api.get('/admin/staff/audit-logs', {
        params: {
          actorUserId: params?.actorUserId,
          resource: params?.resource,
          action: params?.action,
          limit: params?.limit,
        },
      })
      return response.data
    },
    enabled: params?.enabled ?? true,
    retry: false,
  })

export const useStaffAuditLogs = (staffId?: string) =>
  useQuery({
    queryKey: ['staff-audit', staffId || 'none'],
    queryFn: async () => {
      const response = await api.get(`/admin/staff/${staffId}/audit`)
      return response.data
    },
    enabled: !!staffId,
    retry: false,
  })
