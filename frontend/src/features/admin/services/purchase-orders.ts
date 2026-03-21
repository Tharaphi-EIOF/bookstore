import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchasePricingPreviewConfig,
} from './warehouse-types'

export const usePurchaseOrders = (filters?: {
  status?: PurchaseOrderStatus
  warehouseId?: string
  vendorId?: string
}) =>
  useQuery({
    queryKey: [
      'purchase-orders',
      filters?.status || 'all',
      filters?.warehouseId || 'all',
      filters?.vendorId || 'all',
    ],
    queryFn: async (): Promise<PurchaseOrder[]> => {
      const response = await api.get('/warehouses/purchase-orders', { params: filters })
      return response.data
    },
    retry: false,
  })

export const usePurchasePricingPreview = () =>
  useQuery({
    queryKey: ['purchase-pricing-preview'],
    queryFn: async (): Promise<PurchasePricingPreviewConfig> => {
      const response = await api.get('/warehouses/purchase-pricing-preview')
      return response.data
    },
    retry: false,
  })

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      purchaseRequestId: string
      vendorId: string
      unitCost?: number
      expectedAt?: string
      notes?: string
    }): Promise<PurchaseOrder> => {
      const response = await api.post('/warehouses/purchase-orders', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
    },
  })
}

export const useCreatePurchaseOrdersBatch = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      purchaseRequestIds: string[]
      vendorId: string
      unitCost?: number
      expectedAt?: string
      notes?: string
    }): Promise<{ createdCount: number; orders: PurchaseOrder[] }> => {
      const response = await api.post('/warehouses/purchase-orders/batch', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
    },
  })
}

export const useReceivePurchaseOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      items,
      note,
      closeWhenFullyReceived,
    }: {
      id: string
      items?: Array<{
        itemId: string
        receivedQuantity: number
        finalRetailPrice?: number
      }>
      note?: string
      closeWhenFullyReceived?: boolean
    }): Promise<PurchaseOrder> => {
      const response = await api.patch(`/warehouses/purchase-orders/${id}/receive`, {
        items,
        note,
        closeWhenFullyReceived,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] })
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-stocks'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export const useUpdatePurchaseOrderDraft = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      expectedAt,
      notes,
      items,
    }: {
      id: string
      expectedAt?: string
      notes?: string
      items: Array<{
        id: string
        orderedQuantity: number
        unitCost?: number
      }>
    }): Promise<PurchaseOrder> => {
      const response = await api.patch(`/warehouses/purchase-orders/${id}`, {
        expectedAt,
        notes,
        items,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
  })
}
