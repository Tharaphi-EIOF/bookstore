import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type LoyaltyRewardType = 'PERCENT_COUPON' | 'FIXED_COUPON' | 'FREE_EBOOK'

export interface LoyaltyReward {
  id: string
  name: string
  description?: string | null
  stickerCost: number
  rewardType: LoyaltyRewardType
  discountValue?: number | string | null
  maxDiscountAmount?: number | string | null
  rewardBookId?: string | null
  isActive: boolean
  redemptionLimit?: number | null
  redeemedCount: number
  createdAt: string
  updatedAt: string
  rewardBook?: {
    id: string
    title: string
    author: string
    coverImage?: string | null
  } | null
}

export interface StickerLedgerEntry {
  id: string
  type: 'ORDER_EARN' | 'ADMIN_GRANT' | 'REWARD_REDEEM'
  delta: number
  note?: string | null
  createdAt: string
  actorUser?: {
    id: string
    name: string
  } | null
  order?: {
    id: string
    totalPrice: number | string
  } | null
  redemption?: {
    id: string
    reward: {
      id: string
      name: string
    }
  } | null
}

export interface MyLoyaltyDashboard {
  user: {
    id: string
    name: string
    stickerBalance: number
  }
  history: StickerLedgerEntry[]
  rewards: LoyaltyReward[]
  redemptions: Array<{
    id: string
    stickerCost: number
    createdAt: string
    reward: LoyaltyReward
    generatedPromo?: {
      id: string
      code: string
      name: string
      description?: string | null
      discountType: 'PERCENT' | 'FIXED'
      discountValue: number | string
      maxDiscountAmount?: number | string | null
      endsAt?: string | null
      isActive: boolean
    } | null
    grantedBook?: {
      id: string
      title: string
      author: string
      coverImage?: string | null
    } | null
  }>
  activePromotions: Array<{
    id: string
    code: string
    name: string
    description?: string | null
    discountType: 'PERCENT' | 'FIXED'
    discountValue: number | string
    maxDiscountAmount?: number | string | null
    endsAt?: string | null
    isActive: boolean
  }>
  program: {
    earnRate: string
  }
}

export const useMyLoyaltyDashboard = (enabled = true) =>
  useQuery({
    queryKey: ['loyalty', 'me'],
    queryFn: async (): Promise<MyLoyaltyDashboard> => {
      const response = await api.get('/loyalty/me')
      return response.data
    },
    enabled,
  })

export const useRedeemReward = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (rewardId: string) => {
      const response = await api.post(`/loyalty/rewards/${rewardId}/redeem`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty', 'me'] })
    },
  })
}

export const useAdminLoyaltyRewards = () =>
  useQuery({
    queryKey: ['admin-loyalty', 'rewards'],
    queryFn: async (): Promise<LoyaltyReward[]> => {
      const response = await api.get('/admin/loyalty/rewards')
      return response.data
    },
    retry: false,
  })

export const useCreateLoyaltyReward = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      name: string
      description?: string
      stickerCost: number
      rewardType: LoyaltyRewardType
      discountValue?: number
      maxDiscountAmount?: number
      rewardBookId?: string
      redemptionLimit?: number
      isActive?: boolean
    }) => {
      const response = await api.post('/admin/loyalty/rewards', payload)
      return response.data as LoyaltyReward
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-loyalty', 'rewards'] })
      queryClient.invalidateQueries({ queryKey: ['loyalty', 'me'] })
    },
  })
}

export const useUpdateLoyaltyReward = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LoyaltyReward> }) => {
      const response = await api.patch(`/admin/loyalty/rewards/${id}`, data)
      return response.data as LoyaltyReward
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-loyalty', 'rewards'] })
      queryClient.invalidateQueries({ queryKey: ['loyalty', 'me'] })
    },
  })
}

export const useGrantStickers = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { userIds: string[]; amount: number; note?: string }) => {
      const response = await api.post('/admin/loyalty/grants/stickers', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

export const useGrantPersonalPromotions = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      userIds: string[]
      promotionId: string
    }) => {
      const response = await api.post('/admin/loyalty/grants/promotions', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty', 'me'] })
    },
  })
}
