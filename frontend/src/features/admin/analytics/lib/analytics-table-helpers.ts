import { currency } from '@/features/admin/analytics/lib/analytics-formatters'
import type {
  AnalyticsBook,
  AnalyticsDetailContext,
  AnalyticsRow,
  AnalyticsTableConfig,
  PartnerStatsSummary,
  TableView,
} from '@/features/admin/analytics/types'
import type {
  AuthorPerformanceItem,
  CatalogBreakdownItem,
  MissingBookDemandItem,
  RestockImprovementItem,
} from '@/features/admin/services/warehouses'
import type { BookLead } from '@/features/admin/services/book-leads'
import type { PartnerDeal } from '@/features/admin/services/partner-deals'

type SelectedTableParams = {
  tableView: TableView
  groupBy: string
  authorRows: AuthorPerformanceItem[]
  catalogItems: CatalogBreakdownItem[]
  genreItems: CatalogBreakdownItem[]
  categoryItems: CatalogBreakdownItem[]
  restockItems: RestockImprovementItem[]
  missingDemandItems: MissingBookDemandItem[]
  partnerSummary: PartnerStatsSummary[]
}

type AnalyticsDetailParams = {
  selectedRow: AnalyticsRow | null
  books: AnalyticsBook[]
  topSalesBooks: Array<{ bookId: string; title: string; author: string; soldQty: number; grossSales: number }>
  leads: BookLead[]
  deals: PartnerDeal[]
}

export const buildPartnerSummary = (deals: PartnerDeal[], limit: number): PartnerStatsSummary[] => {
  const bucket = new Map<string, PartnerStatsSummary>()

  for (const deal of deals) {
    const key = deal.partnerName || 'Unknown'
    const current = bucket.get(key) ?? {
      partnerName: key,
      deals: 0,
      gross: 0,
      share: 0,
      pendingSettlements: 0,
      paidSettlements: 0,
    }
    current.deals += 1
    for (const settlement of deal.settlements ?? []) {
      current.gross += Number(settlement.grossSalesAmount ?? 0)
      current.share += Number(settlement.partnerShareAmount ?? 0)
      if (settlement.status === 'PENDING') current.pendingSettlements += 1
      if (settlement.status === 'PAID') current.paidSettlements += 1
    }
    bucket.set(key, current)
  }

  return Array.from(bucket.values())
    .sort((a, b) => b.gross - a.gross)
    .slice(0, limit)
}

export const buildSelectedAnalyticsTable = ({
  tableView,
  groupBy,
  authorRows,
  catalogItems,
  genreItems,
  categoryItems,
  restockItems,
  missingDemandItems,
  partnerSummary,
}: SelectedTableParams): AnalyticsTableConfig => {
  if (tableView === 'authorSales') {
    return {
      title: 'Author Sales',
      csvName: 'author-sales.csv',
      columns: ['Author', 'Titles', 'Titles Sold', 'Sold Qty', 'Revenue', 'Out Of Stock', 'Top Books'],
      rows: authorRows.map<AnalyticsRow>((row) => ({
        id: `author-${row.author}`,
        cells: [
          row.author,
          row.totalTitles,
          row.titlesSold,
          row.soldQty,
          currency(row.revenue),
          row.outOfStockTitles,
          row.topBooks.map((book) => `${book.title} (${book.quantity})`).join(' | '),
        ],
        detail: { kind: 'authorSales', item: row },
      })),
      emptyText: 'No author performance data found for this filter.',
    }
  }

  if (tableView === 'catalogBreakdown') {
    return {
      title: `Catalog Breakdown (${groupBy})`,
      csvName: `catalog-breakdown-${groupBy}.csv`,
      columns: ['Group', 'Total Books', 'Total Stock'],
      rows: catalogItems.map<AnalyticsRow>((row) => ({
        id: `catalog-${groupBy}-${row.key}`,
        cells: [row.key, row.totalBooks, row.totalStock],
        detail: { kind: 'catalogBreakdown', item: row },
      })),
      emptyText: 'No catalog breakdown data found.',
    }
  }

  if (tableView === 'genreStats') {
    return {
      title: 'Genre Statistics',
      csvName: 'genre-statistics.csv',
      columns: ['Genre', 'Title Count', 'Sample Titles'],
      rows: genreItems.map<AnalyticsRow>((row) => ({
        id: `genre-${row.key}`,
        cells: [row.key, row.totalBooks, row.books.map((book) => book.title).join(' | ')],
        detail: { kind: 'genreStats', item: row },
      })),
      emptyText: 'No genre statistics found.',
    }
  }

  if (tableView === 'categoryStats') {
    return {
      title: 'Category Statistics',
      csvName: 'category-statistics.csv',
      columns: ['Category', 'Title Count'],
      rows: categoryItems.map<AnalyticsRow>((row) => ({
        id: `category-${row.key}`,
        cells: [row.key, row.totalBooks],
        detail: { kind: 'categoryStats', item: row },
      })),
      emptyText: 'No category statistics found.',
    }
  }

  if (tableView === 'restockMissing') {
    const restockRows = restockItems.map<AnalyticsRow>((row) => ({
      id: `restock-${row.bookId}`,
      cells: ['RESTOCK', row.title, row.stock, row.shortageSignal, '', ''],
      detail: { kind: 'restock', item: row },
    }))
    const missingRows = missingDemandItems.map<AnalyticsRow>((row) => ({
      id: `missing-${row.inquiryId}`,
      cells: [
        'MISSING_DEMAND',
        row.subject,
        '',
        '',
        row.isLikelyMissingFromCatalog ? 'YES' : 'NO',
        row.inquiryId,
      ],
      detail: { kind: 'missingDemand', item: row },
    }))

    return {
      title: 'Restock & Missing Demand',
      csvName: 'restock-missing-demand.csv',
      columns: ['Type', 'Title/Subject', 'Stock', 'Shortage Signal', 'Likely Missing', 'Reference Id'],
      rows: [...restockRows, ...missingRows],
      emptyText: 'No restock or missing-demand data found.',
    }
  }

  return {
    title: 'Distribution / Partner Statistics',
    csvName: 'distribution-partner-statistics.csv',
    columns: ['Partner', 'Deals', 'Gross', 'Share', 'Pending Settlements', 'Paid Settlements'],
    rows: partnerSummary.map<AnalyticsRow>((row) => ({
      id: `partner-${row.partnerName}`,
      cells: [
        row.partnerName,
        row.deals,
        currency(row.gross),
        currency(row.share),
        row.pendingSettlements,
        row.paidSettlements,
      ],
      detail: { kind: 'partnerStats', summary: row },
    })),
    emptyText: 'No partner statistics found.',
  }
}

export const sortAnalyticsRows = ({
  rows,
  columns,
  sortColumn,
  sortDir,
}: {
  rows: AnalyticsRow[]
  columns: string[]
  sortColumn: string
  sortDir: 'asc' | 'desc'
}) => {
  const nextRows = [...rows]
  if (!sortColumn) return nextRows

  const columnIndex = columns.indexOf(sortColumn)
  if (columnIndex < 0) return nextRows

  const normalize = (value: unknown): string | number => {
    if (typeof value === 'number') return value
    const text = String(value ?? '').trim()
    const numeric = Number(text.replace(/[^0-9.-]/g, ''))
    if (!Number.isNaN(numeric) && /[0-9]/.test(text)) return numeric
    return text.toLowerCase()
  }

  nextRows.sort((left, right) => {
    const a = normalize(left.cells[columnIndex])
    const b = normalize(right.cells[columnIndex])
    let result = 0

    if (typeof a === 'number' && typeof b === 'number') {
      result = a - b
    } else {
      result = String(a).localeCompare(String(b))
    }

    return sortDir === 'asc' ? result : -result
  })

  return nextRows
}

export const buildAnalyticsDetailContext = ({
  selectedRow,
  books,
  topSalesBooks,
  leads,
  deals,
}: AnalyticsDetailParams): AnalyticsDetailContext => {
  if (!selectedRow) return null

  const lowerIncludes = (source: string | undefined | null, value: string) =>
    String(source ?? '').toLowerCase().includes(value.toLowerCase())

  if (selectedRow.detail.kind === 'authorSales') {
    const detail = selectedRow.detail
    return {
      matchedBooks: books.filter((book) => book.author === detail.item.author),
      topSalesBooks: topSalesBooks.filter((book) => book.author === detail.item.author),
    }
  }

  if (selectedRow.detail.kind === 'restock') {
    const detail = selectedRow.detail
    return {
      relatedLeads: leads.filter(
        (lead) => lowerIncludes(lead.title, detail.item.title) || lowerIncludes(lead.author, detail.item.author),
      ),
    }
  }

  if (selectedRow.detail.kind === 'missingDemand') {
    const detail = selectedRow.detail
    return {
      relatedLeads: leads.filter(
        (lead) => lowerIncludes(lead.title, detail.item.subject) || lowerIncludes(lead.note, detail.item.subject),
      ),
    }
  }

  if (selectedRow.detail.kind === 'partnerStats') {
    const detail = selectedRow.detail
    return {
      deals: deals.filter((deal) => deal.partnerName === detail.summary.partnerName),
    }
  }

  return null
}
