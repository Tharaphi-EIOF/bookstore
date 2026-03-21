import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Department } from './staff-types'

export const useDepartments = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['staff-departments'],
    queryFn: async (): Promise<Department[]> => {
      const response = await api.get('/admin/departments')
      return response.data
    },
    enabled: options?.enabled ?? true,
    retry: false,
  })

export const useCreateDepartment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Partial<Department>) => {
      const response = await api.post('/admin/departments', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-departments'] })
    },
  })
}

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Department> }) => {
      const response = await api.patch(`/admin/departments/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-departments'] })
    },
  })
}

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/admin/departments/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-departments'] })
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
    },
  })
}
