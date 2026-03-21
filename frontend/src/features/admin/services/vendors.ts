import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Vendor } from './warehouse-types'

export const useVendors = (
  activeOnly?: boolean,
  status: 'active' | 'trashed' | 'all' = 'active',
) =>
  useQuery({
    queryKey: ['vendors', activeOnly === undefined ? 'all' : activeOnly ? 'active' : 'inactive', status],
    queryFn: async (): Promise<Vendor[]> => {
      const response = await api.get('/warehouses/vendors', {
        params: {
          ...(activeOnly === undefined ? {} : { activeOnly }),
          status,
        },
      })
      return response.data
    },
    retry: false,
  })

export const useCreateVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      code: string
      name: string
      contactName?: string
      email?: string
      phone?: string
      address?: string
      isActive?: boolean
    }): Promise<Vendor> => {
      const response = await api.post('/warehouses/vendors', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}

export const useUpdateVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<{
        code: string
        name: string
        contactName: string
        email: string
        phone: string
        address: string
        isActive: boolean
      }>
    }): Promise<Vendor> => {
      const response = await api.patch(`/warehouses/vendors/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}

export const useDeleteVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/warehouses/vendors/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}

export const useRestoreVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/warehouses/vendors/${id}/restore`)
      return response.data as Vendor
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}

export const usePermanentDeleteVendor = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/warehouses/vendors/${id}/permanent`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}
