import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CommercialPerformanceResponse, StaffPerformanceResponse } from './staff-types'

export const useStaffPerformance = (
  filters?: {
    departmentId?: string
    staffId?: string
    fromDate?: string
    toDate?: string
  },
  options?: {
    enabled?: boolean
  },
) =>
  useQuery({
    queryKey: [
      'staff-performance',
      filters?.departmentId || 'all',
      filters?.staffId || 'all',
      filters?.fromDate || 'all',
      filters?.toDate || 'all',
    ],
    queryFn: async (): Promise<StaffPerformanceResponse> => {
      const response = await api.get('/admin/staff/performance', { params: filters })
      return response.data
    },
    enabled: options?.enabled ?? true,
    retry: false,
  })

export const useCommercialPerformance = (
  filters?: {
    fromDate?: string
    toDate?: string
    limit?: number
  },
  options?: {
    enabled?: boolean
  },
) =>
  useQuery({
    queryKey: [
      'staff-performance-commercial',
      filters?.fromDate || 'all',
      filters?.toDate || 'all',
      filters?.limit || 5,
    ],
    queryFn: async (): Promise<CommercialPerformanceResponse> => {
      const response = await api.get('/admin/staff/performance/commercial', {
        params: filters,
      })
      return response.data
    },
    enabled: options?.enabled ?? true,
    retry: false,
  })
