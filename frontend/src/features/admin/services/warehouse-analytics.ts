import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  AuthorPerformanceResponse,
  CatalogBreakdownResponse,
  MissingBookDemandResponse,
  PurchaseHistorySummaryResponse,
  PurchaseOrder,
  ReorderSuggestionResponse,
  RestockImprovementResponse,
} from './warehouse-types'

export const useAuthorPerformance = (params?: {
  fromDate?: string
  toDate?: string
  limit?: number
}, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['author-performance', params?.fromDate || '', params?.toDate || '', params?.limit || 20],
    queryFn: async (): Promise<AuthorPerformanceResponse> => {
      const response = await api.get('/warehouses/admin/author-performance', {
        params,
      })
      return response.data
    },
    enabled: options?.enabled ?? true,
    retry: false,
  })

export const useCatalogBreakdown = (params?: {
  groupBy?: 'author' | 'category' | 'genre' | 'vendor'
  limit?: number
}, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['catalog-breakdown', params?.groupBy || 'author', params?.limit || 20],
    queryFn: async (): Promise<CatalogBreakdownResponse> => {
      const response = await api.get('/warehouses/admin/catalog-breakdown', {
        params,
      })
      return response.data
    },
    enabled: options?.enabled ?? true,
    retry: false,
  })

export const useReorderSuggestions = (params?: {
  warehouseId?: string
  leadTimeDays?: number
  coverageDays?: number
  minDailySales?: number
  limit?: number
}) =>
  useQuery({
    queryKey: [
      'reorder-suggestions',
      params?.warehouseId || '',
      params?.leadTimeDays || 14,
      params?.coverageDays || 30,
      params?.minDailySales || 0,
      params?.limit || 20,
    ],
    queryFn: async (): Promise<ReorderSuggestionResponse> => {
      const response = await api.get('/warehouses/admin/reorder-suggestions', {
        params,
      })
      return response.data
    },
    retry: false,
  })

export const useRestockImprovement = (limit = 50, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['restock-improvement', limit],
    queryFn: async (): Promise<RestockImprovementResponse> => {
      const response = await api.get('/warehouses/admin/restock-improvement', {
        params: { limit },
      })
      return response.data
    },
    enabled: options?.enabled ?? true,
    retry: false,
  })

export const useMissingBookDemand = (limit = 50, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['missing-book-demand', limit],
    queryFn: async (): Promise<MissingBookDemandResponse> => {
      const response = await api.get('/warehouses/admin/missing-book-demand', {
        params: { limit },
      })
      return response.data
    },
    enabled: options?.enabled ?? true,
    retry: false,
  })

export const usePurchaseHistorySummary = (params?: {
  fromDate?: string
  toDate?: string
}, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['purchase-history-summary', params?.fromDate || '', params?.toDate || ''],
    queryFn: async (): Promise<PurchaseHistorySummaryResponse> => {
      const response = await api.get('/warehouses/admin/purchase-history-summary', {
        params,
      })
      return response.data
    },
    enabled: options?.enabled ?? true,
    retry: false,
  })

export const useCreatePurchaseRequestsFromReorderSuggestions = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      warehouseId: string
      leadTimeDays?: number
      coverageDays?: number
      minDailySales?: number
      limit?: number
      submitForApproval?: boolean
    }) => {
      const response = await api.post(
        '/warehouses/admin/reorder-suggestions/create-purchase-requests',
        payload,
      )
      return response.data as {
        createdCount: number
        skippedCount: number
        created: Array<{
          requestId: string
          bookId: string
          quantity: number
        }>
        skipped: Array<{
          bookId: string
          reason: string
        }>
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reorder-suggestions'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export const useReorderPurchaseOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (purchaseOrderId: string): Promise<PurchaseOrder> => {
      const response = await api.post(`/warehouses/purchase-orders/${purchaseOrderId}/reorder`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
  })
}
