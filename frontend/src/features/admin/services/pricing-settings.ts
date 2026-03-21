import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type VendorMarkupType = 'PERCENT' | 'FIXED'

export interface PricingSettings {
  id: string
  taxRate: number | string
  vendorMarkupType: VendorMarkupType
  vendorMarkupValue: number | string
  applyPricingOnReceive: boolean
  createdAt: string
  updatedAt: string
}

export const useAdminPricingSettings = ({ enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: ['admin-pricing-settings'],
    queryFn: async (): Promise<PricingSettings> => {
      const response = await api.get('/admin/pricing-settings')
      return response.data
    },
    enabled,
    retry: false,
  })

export const useUpdateAdminPricingSettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: Partial<{
      taxRate: number
      vendorMarkupType: VendorMarkupType
      vendorMarkupValue: number
      applyPricingOnReceive: boolean
    }>): Promise<PricingSettings> => {
      const response = await api.patch('/admin/pricing-settings', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pricing-settings'] })
      queryClient.invalidateQueries({ queryKey: ['checkout-config'] })
    },
  })
}
