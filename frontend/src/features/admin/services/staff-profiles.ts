import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { StaffCandidate, StaffProfile, StaffStatus } from './staff-types'

export const useStaffProfiles = (
  filters?: {
    departmentId?: string
    roleId?: string
    status?: StaffStatus
  },
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ['staff-profiles', filters?.departmentId || 'all', filters?.roleId || 'all', filters?.status || 'all'],
    queryFn: async (): Promise<StaffProfile[]> => {
      const response = await api.get('/admin/staff', { params: filters })
      return response.data
    },
    enabled: options?.enabled ?? true,
    retry: false,
  })

export const useCreateStaffProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      userId: string
      departmentId: string
      employeeCode: string
      title: string
      managerId?: string
      status?: StaffStatus
    }) => {
      const response = await api.post('/admin/staff', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
    },
  })
}

export const useStaffCandidates = (q?: string, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['staff-candidates', q || ''],
    queryFn: async (): Promise<StaffCandidate[]> => {
      const response = await api.get('/admin/staff/candidates', {
        params: q?.trim() ? { q: q.trim() } : undefined,
      })
      return response.data
    },
    enabled: options?.enabled ?? true,
  })

export const useHireExistingUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      userId: string
      departmentId: string
      employeeCode?: string
      title: string
      managerId?: string
      status?: StaffStatus
      roleIds?: string[]
    }) => {
      const response = await api.post('/admin/staff/hire-existing', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
      queryClient.invalidateQueries({ queryKey: ['staff-candidates'] })
    },
  })
}

export const useCreateStaffAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      name: string
      email: string
      departmentId: string
      employeeCode?: string
      title: string
      managerId?: string
      status?: StaffStatus
      roleIds?: string[]
      sendActivationEmail?: boolean
      convertExisting?: boolean
    }) => {
      const response = await api.post('/admin/staff/create-account', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
      queryClient.invalidateQueries({ queryKey: ['staff-candidates'] })
    },
  })
}

export const useUpdateStaffProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<StaffProfile> }) => {
      const response = await api.patch(`/admin/staff/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
    },
  })
}

export const useUpdateStaffAccountAccess = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      role,
    }: {
      id: string
      role: 'USER' | 'ADMIN' | 'SUPER_ADMIN'
    }) => {
      const response = await api.patch(`/admin/staff/${id}/account-access`, { role })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
    },
  })
}

export const useAssignRole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ staffId, roleId }: { staffId: string; roleId: string }) => {
      const response = await api.post(`/admin/staff/${staffId}/roles`, { roleId })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
    },
  })
}
