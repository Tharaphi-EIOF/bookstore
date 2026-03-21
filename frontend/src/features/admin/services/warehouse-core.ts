import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  BookStockPresenceResponse,
  Warehouse,
  WarehouseAlert,
  WarehouseAlertStatus,
  WarehouseStockRow,
  WarehouseTransfer,
} from './warehouse-types'

export const useWarehouses = () =>
  useQuery({
    queryKey: ['warehouses'],
    queryFn: async (): Promise<Warehouse[]> => {
      const response = await api.get('/warehouses')
      return response.data
    },
    retry: false,
  })

export const useBookStockPresence = () =>
  useQuery({
    queryKey: ['book-stock-presence'],
    queryFn: async (): Promise<BookStockPresenceResponse> => {
      const response = await api.get('/warehouses/book-stock-presence')
      return response.data
    },
    retry: false,
  })

export const useCreateWarehouse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      name: string
      code: string
      city: string
      state: string
      address?: string
      isActive?: boolean
    }): Promise<Warehouse> => {
      const response = await api.post('/warehouses', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
    },
  })
}

export const useUpdateWarehouse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<{
        name: string
        code: string
        city: string
        state: string
        address: string
        isActive: boolean
      }>
    }): Promise<Warehouse> => {
      const response = await api.patch(`/warehouses/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-stocks'] })
    },
  })
}

export const useDeleteWarehouse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/warehouses/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-stocks'] })
    },
  })
}

export const useWarehouseStocks = (warehouseId?: string) =>
  useQuery({
    queryKey: ['warehouse-stocks', warehouseId],
    queryFn: async (): Promise<WarehouseStockRow[]> => {
      const response = await api.get(`/warehouses/${warehouseId}/stocks`)
      return response.data
    },
    enabled: !!warehouseId,
    retry: false,
  })

export const useSetWarehouseStock = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      warehouseId,
      bookId,
      stock,
      lowStockThreshold,
    }: {
      warehouseId: string
      bookId: string
      stock: number
      lowStockThreshold?: number
    }) => {
      const response = await api.put(`/warehouses/${warehouseId}/stocks/${bookId}`, {
        stock,
        lowStockThreshold,
      })
      return response.data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-stocks', vars.warehouseId] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['book', vars.bookId] })
    },
  })
}

export const useTransferWarehouseStock = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      bookId: string
      fromWarehouseId: string
      toWarehouseId: string
      quantity: number
      note?: string
    }): Promise<WarehouseTransfer> => {
      const response = await api.post('/warehouses/transfer', payload)
      return response.data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-stocks', vars.fromWarehouseId] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-stocks', vars.toWarehouseId] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-transfers'] })
      queryClient.invalidateQueries({ queryKey: ['warehouse-alerts'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['book', vars.bookId] })
    },
  })
}

export const useWarehouseAlerts = (status: WarehouseAlertStatus = 'OPEN') =>
  useQuery({
    queryKey: ['warehouse-alerts', status],
    queryFn: async (): Promise<WarehouseAlert[]> => {
      const response = await api.get('/warehouses/alerts/low-stock', { params: { status } })
      return response.data
    },
    retry: false,
  })

export const useWarehouseTransfers = (limit = 20) =>
  useQuery({
    queryKey: ['warehouse-transfers', limit],
    queryFn: async (): Promise<WarehouseTransfer[]> => {
      const response = await api.get('/warehouses/transfers', { params: { limit } })
      return response.data
    },
    retry: false,
  })
