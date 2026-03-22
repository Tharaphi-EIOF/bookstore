import type { PartnerDeal, PartnerDealStatus } from '@/features/admin/services/partner-deals'

export type ViewMode = 'table' | 'heatmap'
export type DistributionSection = 'distribution' | 'deals' | 'receipts' | 'settlements'
export type LocationType = 'warehouse' | 'store'

export type LocationCell = {
  id: string
  code: string
  name: string
  type: LocationType
  mapKey: string
}

export type DistributionBook = {
  id: string
  title: string
  author: string
  isbn: string
}

export type DealFormState = {
  partnerName: string
  partnerCompany: string
  partnerEmail: string
  revenueSharePct: string
  bookId: string
  termsNote: string
}

export type SettlementFormState = {
  periodStart: string
  periodEnd: string
  grossSalesAmount: string
  note: string
}

export type ReceiptFormState = {
  warehouseId: string
  quantity: string
  note: string
}

export type ResultMessage = {
  type: 'success' | 'error'
  message: string
}

export const DISTRIBUTION_SECTION_OPTIONS: Array<[DistributionSection, string]> = [
  ['distribution', 'Distribution'],
  ['deals', 'Deals'],
  ['receipts', 'Receipts'],
  ['settlements', 'Settlements'],
]

export const PARTNER_DEAL_STATUS_OPTIONS: PartnerDealStatus[] = ['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED']

export const createEmptyDealForm = (): DealFormState => ({
  partnerName: '',
  partnerCompany: '',
  partnerEmail: '',
  revenueSharePct: '25',
  bookId: '',
  termsNote: '',
})

export const createEmptySettlementForm = (): SettlementFormState => ({
  periodStart: '',
  periodEnd: '',
  grossSalesAmount: '',
  note: '',
})

export const createEmptyReceiptForm = (): ReceiptFormState => ({
  warehouseId: '',
  quantity: '',
  note: '',
})

export const toSettlementBoundaryIso = (dateText: string, mode: 'start' | 'end') => {
  const [yearText, monthText, dayText] = dateText.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return ''
  }

  const localDate = mode === 'start'
    ? new Date(year, month - 1, day, 0, 0, 0, 0)
    : new Date(year, month - 1, day, 23, 59, 59, 999)

  return localDate.toISOString()
}

export const getDealLinkedBookLabel = (deal: PartnerDeal) =>
  deal.book ? `${deal.book.title} by ${deal.book.author}` : 'No linked book yet'
