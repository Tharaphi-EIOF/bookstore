import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type BookLeadStatus =
  | 'NEW'
  | 'REVIEWED'
  | 'SOURCING'
  | 'APPROVED_TO_BUY'
  | 'ORDERED'
  | 'CONVERTED_TO_BOOK'
  | 'REJECTED'

export type BookLeadSource = 'USER_REQUEST' | 'STAFF_IDEA' | 'PARTNER_PITCH'
export type BookLeadWorkflowStage = 'NEW' | 'IN_REVIEW' | 'APPROVED' | 'CLOSED' | 'REJECTED'

export interface BookLead {
  id: string
  title: string
  author: string
  note?: string | null
  source: BookLeadSource
  status: BookLeadStatus
  priority: number
  requestedByUserId?: string | null
  assignedToUserId?: string | null
  convertedBookId?: string | null
  procurementIsbn?: string | null
  procurementPrice?: number | null
  procurementCategories?: string[]
  procurementGenres?: string[]
  procurementDescription?: string | null
  procurementCoverImage?: string | null
  procurementStock?: number | null
  procurementWarehouseId?: string | null
  procurementQuantity?: number | null
  procurementEstimatedCost?: number | null
  procurementReviewNote?: string | null
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
  requestedByUser?: {
    id: string
    name: string
    email: string
  } | null
  assignedToUser?: {
    id: string
    name: string
    email: string
  } | null
  confidenceScore?: number
  confidenceBand?: 'HIGH' | 'MEDIUM' | 'LOW'
  demandCount?: number
}

export interface BookLeadListResponse {
  total: number
  page: number
  limit: number
  totalPages: number
  items: BookLead[]
}

export const useBookLeads = (params?: {
  status?: BookLeadStatus
  stage?: BookLeadWorkflowStage
  source?: BookLeadSource
  view?: 'active' | 'trashed' | 'all'
  q?: string
  author?: string
  requestedBy?: string
  assignedTo?: string
  createdFrom?: string
  createdTo?: string
  page?: number
  limit?: number
}, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: [
      'book-leads',
      params?.status || 'all',
      params?.stage || 'all',
      params?.source || 'all',
      params?.view || 'active',
      params?.q || '',
      params?.author || '',
      params?.requestedBy || '',
      params?.assignedTo || '',
      params?.createdFrom || '',
      params?.createdTo || '',
      params?.page || 1,
      params?.limit || 20,
    ],
    queryFn: async (): Promise<BookLeadListResponse> => {
      const response = await api.get('/book-leads', { params })
      return response.data
    },
    enabled: options?.enabled ?? true,
    retry: false,
  })

export const useCreateBookLead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      title: string
      author: string
      note?: string
      source?: BookLeadSource
      priority?: number
      requestedByUserId?: string
    }): Promise<BookLead> => {
      const response = await api.post('/book-leads', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-leads'] })
    },
  })
}

export const useUpdateBookLead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<{
        title: string
        author: string
        note: string
        source: BookLeadSource
        status: BookLeadStatus
        priority: number
        requestedByUserId: string
        assignedToUserId: string
        procurementIsbn: string
        procurementPrice: number
        procurementCategories: string[]
        procurementGenres: string[]
        procurementDescription: string
        procurementCoverImage: string
        procurementStock: number
        procurementWarehouseId: string
        procurementQuantity: number
        procurementEstimatedCost: number
        procurementReviewNote: string
      }>
    }): Promise<BookLead> => {
      const response = await api.patch(`/book-leads/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-leads'] })
    },
  })
}

export const useDeleteBookLead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<BookLead> => {
      const response = await api.delete(`/book-leads/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-leads'] })
    },
  })
}

export const useRestoreBookLead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<BookLead> => {
      const response = await api.patch(`/book-leads/${id}/restore`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-leads'] })
    },
  })
}

export const useConvertBookLeadToBook = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: {
        isbn: string
        price: number
        categories: string[]
        stock?: number
        description?: string
        coverImage?: string
        genres?: string[]
        title?: string
        author?: string
      }
    }) => {
      const response = await api.post(`/book-leads/${id}/convert-to-book`, data)
      return response.data as {
        lead: BookLead
        book: {
          id: string
          title: string
          author: string
          isbn: string
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-leads'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export const useImportBookLeadsFromInquiries = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload?: { limit?: number; defaultPriority?: number }) => {
      const response = await api.post('/book-leads/automation/from-inquiries', payload || {})
      return response.data as {
        scanned: number
        created: number
        updated: number
        skippedCatalogMatch: number
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-leads'] })
      queryClient.invalidateQueries({ queryKey: ['book-leads-demand-summary'] })
      queryClient.invalidateQueries({ queryKey: ['book-leads-restock-candidates'] })
      queryClient.invalidateQueries({ queryKey: ['book-leads-partner-pipeline'] })
    },
  })
}

export const useBookLeadDuplicates = (limit = 100) =>
  useQuery({
    queryKey: ['book-leads-duplicates', limit],
    queryFn: async () => {
      const response = await api.get('/book-leads/duplicates', { params: { limit } })
      return response.data as {
        totalGroups: number
        groups: Array<{
          dedupeKey: string
          count: number
          suggestedPrimaryLeadId: string
          leads: BookLead[]
        }>
      }
    },
    retry: false,
  })

export const useMergeBookLeads = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { targetLeadId: string; duplicateLeadIds: string[] }) => {
      const response = await api.post(`/book-leads/${payload.targetLeadId}/merge`, {
        duplicateLeadIds: payload.duplicateLeadIds,
      })
      return response.data as {
        mergedCount: number
        mergedLeadIds: string[]
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-leads'] })
      queryClient.invalidateQueries({ queryKey: ['book-leads-duplicates'] })
    },
  })
}

export const useBookLeadDemandSummary = (days = 90, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['book-leads-demand-summary', days],
    queryFn: async () => {
      const response = await api.get('/book-leads/demand-summary', { params: { days } })
      return response.data as {
        days: number
        fromDate: string
        kpis: {
          totalLeads: number
          openLeads: number
          convertedCount: number
          conversionRate: number
          highConfidenceRatio: number
        }
        confidenceBuckets: {
          HIGH: number
          MEDIUM: number
          LOW: number
        }
        topRequestedBooks: Array<{
          key: string
          title: string
          author: string
          count: number
          openLeadCount: number
          avgPriority: number
          latestRequestAt: string
        }>
        topAuthors: Array<{ author: string; demand: number }>
      }
    },
    enabled: options?.enabled ?? true,
    retry: false,
  })

export const useBookLeadRestockCandidates = (days = 90, limit = 20) =>
  useQuery({
    queryKey: ['book-leads-restock-candidates', days, limit],
    queryFn: async () => {
      const response = await api.get('/book-leads/restock-candidates', { params: { days, limit } })
      return response.data as {
        days: number
        fromDate: string
        items: Array<{
          bookId: string
          title: string
          author: string
          currentStock: number
          demandCount: number
          salesQty: number
          score: number
          suggestedQty: number
        }>
      }
    },
    retry: false,
  })

export const useBookLeadPartnerPipeline = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['book-leads-partner-pipeline'],
    queryFn: async () => {
      const response = await api.get('/book-leads/partner-pipeline')
      return response.data as {
        totalPartnerLeads: number
        statusBreakdown: Array<{ status: string; count: number }>
        avgRevenueSharePct: number | null
        leads: BookLead[]
      }
    },
    enabled: options?.enabled ?? true,
    retry: false,
  })

export const useApplyBookLeadWorkflowAutomation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload?: { promoteThreshold?: number; sourceThreshold?: number }) => {
      const response = await api.post('/book-leads/automation/apply-workflow', null, {
        params: payload,
      })
      return response.data as {
        scanned: number
        movedToReviewed: number
        movedToSourcing: number
        thresholds: {
          promoteThreshold: number
          sourceThreshold: number
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['book-leads'] })
      queryClient.invalidateQueries({ queryKey: ['book-leads-demand-summary'] })
      queryClient.invalidateQueries({ queryKey: ['book-leads-restock-candidates'] })
      queryClient.invalidateQueries({ queryKey: ['book-leads-partner-pipeline'] })
    },
  })
}
