import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type PartnerDealStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED'
export type PartnerSettlementStatus = 'PENDING' | 'PAID' | 'CANCELLED'

export interface PartnerSettlement {
  id: string
  dealId: string
  periodStart: string
  periodEnd: string
  grossSalesAmount: string | number
  partnerShareAmount: string | number
  status: PartnerSettlementStatus
  paidAt?: string | null
  note?: string | null
  createdAt: string
  updatedAt: string
}

export interface PartnerDeal {
  id: string
  partnerName: string
  partnerCompany?: string | null
  partnerEmail?: string | null
  leadId?: string | null
  bookId?: string | null
  status: PartnerDealStatus
  revenueSharePct: string | number
  effectiveFrom: string
  effectiveTo?: string | null
  termsNote?: string | null
  createdByUserId: string
  createdAt: string
  updatedAt: string
  book?: {
    id: string
    title: string
    author: string
    isbn: string
  } | null
  lead?: {
    id: string
    title: string
    author: string
    status: string
  } | null
  settlements?: PartnerSettlement[]
}

export interface PartnerSettlementPreview {
  dealId: string
  bookId: string
  periodStart: string
  periodEnd: string
  orderCount: number
  quantitySold: number
  grossSalesAmount: number
  revenueSharePct: number
  partnerShareAmount: number
  calculationBasis: string
}

export interface PartnerConsignmentReceiptResult {
  dealId: string
  bookId: string
  warehouseId: string
  quantityReceived: number
  ownershipType: string
}

export const usePartnerDeals = (
  query?: { status?: PartnerDealStatus; q?: string },
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ['partner-deals', query?.status || 'all', query?.q || ''],
    queryFn: async () => {
      const response = await api.get('/partner-deals', { params: query })
      return response.data as {
        total: number
        items: PartnerDeal[]
      }
    },
    enabled: options?.enabled ?? true,
    retry: false,
  })

export const useCreatePartnerDeal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      partnerName: string
      partnerCompany?: string
      partnerEmail?: string
      leadId?: string
      bookId?: string
      revenueSharePct: number
      status?: PartnerDealStatus
      effectiveFrom?: string
      effectiveTo?: string
      termsNote?: string
    }) => {
      const response = await api.post('/partner-deals', payload)
      return response.data as PartnerDeal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-deals'] })
    },
  })
}

export const useUpdatePartnerDeal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<{
        partnerName: string
        partnerCompany: string
        partnerEmail: string
        leadId: string
        bookId: string
        revenueSharePct: number
        status: PartnerDealStatus
        effectiveFrom: string
        effectiveTo: string
        termsNote: string
      }>
    }) => {
      const response = await api.patch(`/partner-deals/${id}`, data)
      return response.data as PartnerDeal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-deals'] })
    },
  })
}

export const useCreatePartnerSettlement = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      dealId,
      data,
    }: {
      dealId: string
      data: {
        periodStart: string
        periodEnd: string
        grossSalesAmount: number
        note?: string
      }
    }) => {
      const response = await api.post(`/partner-deals/${dealId}/settlements`, data)
      return response.data as PartnerSettlement
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-deals'] })
    },
  })
}

export const useReceivePartnerConsignmentStock = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      dealId,
      data,
    }: {
      dealId: string
      data: {
        warehouseId: string
        quantity: number
        note?: string
      }
    }) => {
      const response = await api.post(`/partner-deals/${dealId}/receipts`, data)
      return response.data as PartnerConsignmentReceiptResult
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-deals'] })
      queryClient.invalidateQueries({ queryKey: ['book-distribution'] })
      queryClient.invalidateQueries({ queryKey: ['book-distribution-books'] })
    },
  })
}

export const usePartnerSettlementPreview = () =>
  useMutation({
    mutationFn: async ({
      dealId,
      periodStart,
      periodEnd,
    }: {
      dealId: string
      periodStart: string
      periodEnd: string
    }) => {
      const response = await api.get(`/partner-deals/${dealId}/settlements/preview`, {
        params: {
          periodStart,
          periodEnd,
        },
      })
      return response.data as PartnerSettlementPreview
    },
  })

export const useMarkPartnerSettlementPaid = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ dealId, settlementId }: { dealId: string; settlementId: string }) => {
      const response = await api.post(`/partner-deals/${dealId}/settlements/${settlementId}/mark-paid`)
      return response.data as PartnerSettlement
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-deals'] })
    },
  })
}
