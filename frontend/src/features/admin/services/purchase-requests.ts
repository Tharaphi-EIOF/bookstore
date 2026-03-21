import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PurchaseRequest, PurchaseRequestStatus } from './warehouse-types'

export const usePurchaseRequests = (filters?: { status?: PurchaseRequestStatus; warehouseId?: string }) =>
  useQuery({
    queryKey: ['purchase-requests', filters?.status || 'all', filters?.warehouseId || 'all'],
    queryFn: async (): Promise<PurchaseRequest[]> => {
      const response = await api.get('/warehouses/purchase-requests', {
        params: filters,
      })
      return response.data
    },
    retry: false,
  })

export const useCreatePurchaseRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      bookId: string
      warehouseId: string
      quantity: number
      estimatedCost?: number
      reviewNote?: string
      submitForApproval?: boolean
    }) => {
      const response = await api.post('/warehouses/purchase-requests', payload)
      return response.data as PurchaseRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
    },
  })
}

export const useSubmitPurchaseRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/warehouses/purchase-requests/${id}/submit`)
      return response.data as PurchaseRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
    },
  })
}

export const useReviewPurchaseRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      action,
      approvedQuantity,
      approvedCost,
      reviewNote,
    }: {
      id: string
      action: 'APPROVE' | 'REJECT'
      approvedQuantity?: number
      approvedCost?: number
      reviewNote?: string
    }) => {
      const response = await api.patch(`/warehouses/purchase-requests/${id}/review`, {
        action,
        approvedQuantity,
        approvedCost,
        reviewNote,
      })
      return response.data as PurchaseRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
    },
  })
}

export const useCompletePurchaseRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/warehouses/purchase-requests/${id}/complete`)
      return response.data as PurchaseRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
    },
  })
}
