import type {
  PurchaseOrderStatus,
  PurchasePricingPreviewConfig,
} from '@/features/admin/services/warehouses'

export const statusOptions: PurchaseOrderStatus[] = ['DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED']

export type PriceSourceTone = 'default' | 'suggested' | 'manual'

export type ReceiveDraftItem = {
  id: string
  title: string
  author: string
  orderedQuantity: number
  receivedQuantity: number
  remainingQuantity: number
  unitCost: number | null
  currentRetailPrice: number
  suggestedRetailPrice: number | null
  finalRetailPrice: string
}

export const getStatusTone = (orderStatus: PurchaseOrderStatus) => {
  switch (orderStatus) {
    case 'CLOSED':
    case 'RECEIVED':
      return 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200'
    case 'SENT':
    case 'PARTIALLY_RECEIVED':
      return 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200'
    case 'CANCELLED':
      return 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200'
    default:
      return 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
  }
}

export const projectRetailPrice = (
  unitCost: number | null | undefined,
  purchasePricingPreview?: PurchasePricingPreviewConfig | null,
) => {
  if (!purchasePricingPreview) return null
  if (!purchasePricingPreview.applyPricingOnReceive) return null
  if (unitCost === null || unitCost === undefined || unitCost <= 0) return null

  const markup = Number(purchasePricingPreview.vendorMarkupValue)
  const projected =
    purchasePricingPreview.vendorMarkupType === 'PERCENT'
      ? unitCost * (1 + markup / 100)
      : unitCost + markup

  return Number(projected.toFixed(2))
}

export const getReceivePriceSource = (item: ReceiveDraftItem): { label: string; tone: PriceSourceTone } => {
  const finalRetailPrice = Number(item.finalRetailPrice)
  if (!Number.isFinite(finalRetailPrice)) {
    return { label: 'Needs review', tone: 'default' }
  }

  if (item.suggestedRetailPrice !== null && Math.abs(finalRetailPrice - item.suggestedRetailPrice) < 0.01) {
    return { label: 'Global suggestion', tone: 'suggested' }
  }

  if (Math.abs(finalRetailPrice - item.currentRetailPrice) < 0.01) {
    return { label: 'Keep current price', tone: 'default' }
  }

  return { label: 'Manual override', tone: 'manual' }
}

export const getPriceSourceClassName = (tone: PriceSourceTone) => {
  switch (tone) {
    case 'suggested':
      return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200'
    case 'manual':
      return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300'
  }
}
