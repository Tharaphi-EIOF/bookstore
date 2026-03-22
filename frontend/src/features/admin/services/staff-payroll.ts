import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface StaffPayroll {
  id: string
  staffProfileId: string
  amount: number
  bonus: number
  deductions: number
  netAmount: number
  periodStart: string
  periodEnd: string
  paymentDate?: string | null
  status: 'PENDING' | 'PAID' | 'CANCELLED'
  note?: string | null
  staffProfile?: {
    user: { name: string; email: string }
    department: { name: string }
  }
}

export const useStaffPayrolls = (filters: { staffId?: string; status?: string; departmentId?: string }) =>
  useQuery({
    queryKey: ['staff-payrolls', filters],
    queryFn: async (): Promise<StaffPayroll[]> => {
      const response = await api.get('/admin/payroll', { params: filters })
      return response.data
    },
  })

export const useGeneratePayroll = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { staffId: string; month: number; year: number }) => {
      const response = await api.post('/admin/payroll/generate', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-payrolls'] })
    },
  })
}

export const useUpdatePayroll = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; status?: string; bonus?: number; deductions?: number; note?: string }) => {
      const response = await api.patch(`/admin/payroll/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-payrolls'] })
    },
  })
}
