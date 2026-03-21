import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { StaffTask, StaffTaskPriority, StaffTaskStatus } from './staff-types'

export const useTasks = (filters?: {
  departmentId?: string
  staffId?: string
  status?: StaffTaskStatus
  priority?: StaffTaskPriority
}) =>
  useQuery({
    queryKey: [
      'staff-tasks',
      filters?.departmentId || 'all',
      filters?.staffId || 'all',
      filters?.status || 'all',
      filters?.priority || 'all',
    ],
    queryFn: async (): Promise<StaffTask[]> => {
      const response = await api.get('/admin/staff/tasks', { params: filters })
      return response.data
    },
  })

export const useCreateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      staffId: string
      type: string
      status?: StaffTaskStatus
      priority?: StaffTaskPriority
      metadata?: Record<string, unknown>
    }) => {
      const response = await api.post('/admin/staff/tasks', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['staff-performance'] })
      queryClient.invalidateQueries({ queryKey: ['staff-profiles'] })
    },
  })
}

export const useCompleteTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await api.post(`/admin/staff/tasks/${taskId}/complete`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['staff-performance'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    },
  })
}
