import type {
  AuthorPerformanceItem,
  CatalogBreakdownItem,
  MissingBookDemandItem,
  RestockImprovementItem,
} from '@/features/admin/services/warehouses'
import type { BookLead } from '@/features/admin/services/book-leads'
import type { PartnerDeal } from '@/features/admin/services/partner-deals'

export type GroupBy = 'author' | 'category' | 'genre' | 'vendor'

export type TableView =
  | 'authorSales'
  | 'catalogBreakdown'
  | 'genreStats'
  | 'categoryStats'
  | 'restockMissing'
  | 'partnerStats'

export type AnalyticsBook = {
  id: string
  title: string
  author: string
  categories: string[]
  genres: string[]
  stock?: number
  vendor?: {
    name?: string | null
  } | null
}

export type PartnerStatsSummary = {
  partnerName: string
  deals: number
  gross: number
  share: number
  pendingSettlements: number
  paidSettlements: number
}

export type DetailPayload =
  | { kind: 'authorSales'; item: AuthorPerformanceItem }
  | { kind: 'catalogBreakdown'; item: CatalogBreakdownItem }
  | { kind: 'genreStats'; item: CatalogBreakdownItem }
  | { kind: 'categoryStats'; item: CatalogBreakdownItem }
  | { kind: 'restock'; item: RestockImprovementItem }
  | { kind: 'missingDemand'; item: MissingBookDemandItem }
  | { kind: 'partnerStats'; summary: PartnerStatsSummary }

export type AnalyticsRow = {
  id: string
  cells: Array<unknown>
  detail: DetailPayload
}

export type AnalyticsTableConfig = {
  title: string
  csvName: string
  columns: string[]
  rows: AnalyticsRow[]
  emptyText: string
}

export type AnalyticsDetailContext = {
  matchedBooks?: AnalyticsBook[]
  topSalesBooks?: Array<{ bookId: string; title: string; author: string; soldQty: number; grossSales: number }>
  relatedLeads?: BookLead[]
  deals?: PartnerDeal[]
} | null
