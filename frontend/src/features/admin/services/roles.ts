import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ElevatedAccount, StaffPermission, StaffRole } from './staff-types'

export const useRoles = (departmentId?: string) =>
  useQuery({
    queryKey: ['staff-roles', departmentId || 'all'],
    queryFn: async (): Promise<StaffRole[]> => {
      const response = await api.get('/admin/staff/roles', {
        params: departmentId ? { departmentId } : undefined,
      })
      return response.data
    },
  })

export const useElevatedAccounts = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['staff-elevated-accounts'],
    queryFn: async (): Promise<ElevatedAccount[]> => {
      const response = await api.get('/admin/staff/account-access/admins')
      return response.data
    },
    enabled: options?.enabled ?? true,
    retry: false,
  })

export const usePermissions = () =>
  useQuery({
    queryKey: ['staff-permissions'],
    queryFn: async (): Promise<StaffPermission[]> => {
      const response = await api.get('/admin/staff/permissions')
      return response.data
    },
  })

export const useCreateRole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { name: string; code?: string; departmentId?: string; isSystem?: boolean }) => {
      const response = await api.post('/admin/staff/roles', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-roles'] })
    },
  })
}

export const useUpdateRole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StaffRole> }) => {
      const response = await api.patch(`/admin/staff/roles/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-roles'] })
    },
  })
}

export const useReplaceRolePermissions = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, permissionKeys }: { id: string; permissionKeys: string[] }) => {
      const response = await api.post(`/admin/staff/roles/${id}/permissions`, {
        permissionKeys,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-roles'] })
    },
  })
}
