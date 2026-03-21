import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { useQuery } from '@tanstack/react-query'
import AdminFilterCard from '@/components/admin/AdminFilterCard'
import AdminPageIntro from '@/components/admin/AdminPageIntro'
import { api } from '@/lib/api'
import AdminAnalyticsFilters from '@/features/admin/analytics/components/AdminAnalyticsFilters'
import AdminAnalyticsTable from '@/features/admin/analytics/components/AdminAnalyticsTable'
import { currency, downloadCsv, toUtc } from '@/features/admin/analytics/lib/analytics-formatters'
import {
  buildAnalyticsDetailContext,
  buildPartnerSummary,
  buildSelectedAnalyticsTable,
  sortAnalyticsRows,
} from '@/features/admin/analytics/lib/analytics-table-helpers'
import type { AnalyticsBook, GroupBy, TableView } from '@/features/admin/analytics/types'
import {
  useAuthorPerformance,
  useCatalogBreakdown,
  useMissingBookDemand,
  usePurchaseHistorySummary,
  useRestockImprovement,
} from '@/features/admin/services/warehouses'
import {
  useBookLeadDemandSummary,
  useBookLeads,
  useBookLeadPartnerPipeline,
} from '@/features/admin/services/book-leads'
import { PartnerDealStatus, usePartnerDeals } from '@/features/admin/services/partner-deals'

const ANALYTICS_FETCH_LIMIT = 100
const ANALYTICS_PAGE_SIZE = 10

export const AdminAnalyticsContent = ({ embedded = false }: { embedded?: boolean }) => {
  // Filter, sorting, and table-presentation state for the analytics hub.
  const [groupBy, setGroupBy] = useState<GroupBy>('author')
  const [tableView, setTableView] = useState<TableView>('authorSales')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [leadDays, setLeadDays] = useState(90)
  const [partnerStatus, setPartnerStatus] = useState<PartnerDealStatus | ''>('')
  const [partnerSearch, setPartnerSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortColumn, setSortColumn] = useState('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [hiddenColumnsByView, setHiddenColumnsByView] = useState<Record<TableView, string[]>>({
    authorSales: [],
    catalogBreakdown: [],
    genreStats: [],
    categoryStats: [],
    restockMissing: [],
    partnerStats: [],
  })

  const fromDateIso = fromDate ? toUtc(fromDate, 'start') : undefined
  const toDateIso = toDate ? toUtc(toDate, 'end') : undefined
  const needsBooksAnalytics = tableView === 'authorSales'
  const needsAuthorPerformance = tableView === 'authorSales'
  const needsCatalogBreakdown = tableView === 'catalogBreakdown'
  const needsGenreStats = tableView === 'genreStats'
  const needsCategoryStats = tableView === 'categoryStats'
  const needsRestockMissing = tableView === 'restockMissing'
  const needsPartnerStats = tableView === 'partnerStats'

  // Core analytics queries used across the KPI cards, tables, and detail drawer.
  const authorPerformanceQuery = useAuthorPerformance({
    fromDate: fromDateIso,
    toDate: toDateIso,
    limit: ANALYTICS_FETCH_LIMIT,
  }, { enabled: needsAuthorPerformance })
  const purchaseSummaryQuery = usePurchaseHistorySummary({
    fromDate: fromDateIso,
    toDate: toDateIso,
  })
  const restockQuery = useRestockImprovement(ANALYTICS_FETCH_LIMIT, { enabled: needsRestockMissing })
  const missingDemandQuery = useMissingBookDemand(ANALYTICS_FETCH_LIMIT, { enabled: needsRestockMissing })
  const leadSummaryQuery = useBookLeadDemandSummary(leadDays)
  const partnerPipelineQuery = useBookLeadPartnerPipeline({ enabled: needsPartnerStats })
  const partnerDealsQuery = usePartnerDeals({
    status: partnerStatus || undefined,
    q: partnerSearch.trim() || undefined,
  }, { enabled: needsPartnerStats })
  const allBookLeadsQuery = useBookLeads({ limit: 100 }, { enabled: needsRestockMissing })
  const gatedCatalogBreakdownQuery = useCatalogBreakdown(
    { groupBy, limit: ANALYTICS_FETCH_LIMIT },
    { enabled: needsCatalogBreakdown },
  )
  const genreBreakdownQuery = useCatalogBreakdown(
    { groupBy: 'genre', limit: ANALYTICS_FETCH_LIMIT },
    { enabled: needsGenreStats },
  )
  const categoryBreakdownQuery = useCatalogBreakdown(
    { groupBy: 'category', limit: ANALYTICS_FETCH_LIMIT },
    { enabled: needsCategoryStats },
  )

  const booksAnalyticsQuery = useQuery({
    queryKey: ['admin-analytics-books'],
    queryFn: async ({ signal }) => {
      const allRows: AnalyticsBook[] = []
      const limit = 100
      let page = 1
      let total = Number.POSITIVE_INFINITY

      while (allRows.length < total && page <= 25) {
        if (signal.aborted) {
          break
        }

        const response = await api.get('/books', {
          signal,
          params: { status: 'active', page, limit },
        })
        const payload = response.data as {
          books: Array<{
            id: string
            title: string
            author: string
            categories?: string[]
            genres?: string[]
            stock?: number
            vendor?: {
              name?: string | null
            } | null
          }>
          total: number
        }
        if (!Array.isArray(payload.books) || payload.books.length === 0) break

        allRows.push(
          ...payload.books.map((row) => ({
            id: row.id,
            title: row.title,
            author: row.author,
            categories: row.categories ?? [],
            genres: row.genres ?? [],
            stock: row.stock,
            vendor: row.vendor ?? null,
          })),
        )
        total = Number.isFinite(payload.total) ? payload.total : allRows.length
        page += 1
      }
      return allRows
    },
    enabled: needsBooksAnalytics,
    retry: false,
  })

  // Derived rollups for view-specific tables and KPI summaries.
  const partnerSummary = useMemo(
    () => buildPartnerSummary(partnerDealsQuery.data?.items ?? [], ANALYTICS_FETCH_LIMIT),
    [partnerDealsQuery.data?.items],
  )

  const purchaseSummary = purchaseSummaryQuery.data
  const leadSummary = leadSummaryQuery.data
  const authorRows = authorPerformanceQuery.data?.items || []
  const authorTotals = useMemo(() => {
    const revenue = authorRows.reduce((sum, row) => sum + row.revenue, 0)
    const soldQty = authorRows.reduce((sum, row) => sum + row.soldQty, 0)
    const titles = authorRows.reduce((sum, row) => sum + row.totalTitles, 0)
    return {
      revenue,
      soldQty,
      titles,
      authors: authorRows.length,
    }
  }, [authorRows])

  const selectedTable = useMemo(() => buildSelectedAnalyticsTable({
    tableView,
    groupBy,
    authorRows,
    catalogItems: gatedCatalogBreakdownQuery.data?.items || [],
    categoryItems: categoryBreakdownQuery.data?.items || [],
    genreItems: genreBreakdownQuery.data?.items || [],
    restockItems: restockQuery.data?.items || [],
    missingDemandItems: (missingDemandQuery.data?.items || []).slice(0, 4),
    partnerSummary,
  }), [
    authorRows,
    categoryBreakdownQuery.data?.items,
    gatedCatalogBreakdownQuery.data?.items,
    genreBreakdownQuery.data?.items,
    groupBy,
    missingDemandQuery.data?.items,
    partnerSummary,
    restockQuery.data?.items,
    tableView,
  ])
  const hiddenColumns = hiddenColumnsByView[tableView] || []
  const visibleColumns = selectedTable.columns.filter((column) => !hiddenColumns.includes(column))
  const visibleColumnIndexes = visibleColumns.map((column) => selectedTable.columns.indexOf(column))
  const visibleColumnMap = useMemo(
    () =>
      Object.fromEntries(
        selectedTable.columns.map((column) => [column, !hiddenColumns.includes(column)]),
      ) as Record<string, boolean>,
    [hiddenColumns, selectedTable.columns],
  )
  const setVisibleColumnMap: Dispatch<SetStateAction<Record<string, boolean>>> = (next) => {
    const resolved = typeof next === 'function' ? next(visibleColumnMap) : next
    setHiddenColumnsByView((current) => ({
      ...current,
      [tableView]: selectedTable.columns.filter((column) => !resolved[column]),
    }))
  }
  const columnOptions = useMemo(
    () => selectedTable.columns.map((column) => ({ key: column, label: column })),
    [selectedTable.columns],
  )
  const sortedRows = useMemo(
    () =>
      sortAnalyticsRows({
        rows: selectedTable.rows,
        columns: selectedTable.columns,
        sortColumn,
        sortDir,
      }),
    [selectedTable.columns, selectedTable.rows, sortColumn, sortDir],
  )

  const selectedRow = useMemo(
    () => sortedRows.find((row) => row.id === selectedRowId) ?? null,
    [selectedRowId, sortedRows],
  )

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / ANALYTICS_PAGE_SIZE))
  const paginatedRows = useMemo(
    () => sortedRows.slice((page - 1) * ANALYTICS_PAGE_SIZE, page * ANALYTICS_PAGE_SIZE),
    [page, sortedRows],
  )

  // Detail drawer context that augments the selected row with related records.
  const detailContext = useMemo(
    () =>
      buildAnalyticsDetailContext({
        selectedRow,
        books: booksAnalyticsQuery.data ?? [],
        topSalesBooks: purchaseSummary?.sales.topBooks ?? [],
        leads: allBookLeadsQuery.data?.items ?? [],
        deals: partnerDealsQuery.data?.items ?? [],
      }),
    [
      allBookLeadsQuery.data?.items,
      booksAnalyticsQuery.data,
      partnerDealsQuery.data?.items,
      purchaseSummary?.sales.topBooks,
      selectedRow,
    ],
  )

  useEffect(() => {
    if (!selectedTable.columns.includes(sortColumn)) {
      setSortColumn('')
      setSortDir('desc')
    }
  }, [selectedTable.columns, sortColumn])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  // Reset the selected row when filters switch to a different dataset.
  useEffect(() => {
    setSelectedRowId(null)
    setPage(1)
  }, [tableView, groupBy, fromDate, toDate, leadDays, partnerStatus, partnerSearch])

  const toggleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortColumn(column)
    setSortDir('desc')
  }

  const handleExport = () =>
    downloadCsv(
      selectedTable.csvName,
      visibleColumns,
      paginatedRows.map((row) => visibleColumnIndexes.map((index) => row.cells[index])),
    )

  const tableLoadingState = useMemo(() => {
    if (tableView === 'authorSales') {
      return { isLoading: authorPerformanceQuery.isLoading, text: 'Loading author metrics...' }
    }
    if (tableView === 'catalogBreakdown') {
      return { isLoading: gatedCatalogBreakdownQuery.isLoading, text: 'Loading catalog breakdown...' }
    }
    if (tableView === 'genreStats') {
      return { isLoading: genreBreakdownQuery.isLoading, text: 'Loading genre statistics...' }
    }
    if (tableView === 'categoryStats') {
      return { isLoading: categoryBreakdownQuery.isLoading, text: 'Loading category statistics...' }
    }
    if (tableView === 'restockMissing') {
      return {
        isLoading: restockQuery.isLoading || missingDemandQuery.isLoading,
        text: 'Loading restock and missing-demand signals...',
      }
    }
    return { isLoading: partnerDealsQuery.isLoading, text: 'Loading partner statistics...' }
  }, [
    authorPerformanceQuery.isLoading,
    categoryBreakdownQuery.isLoading,
    gatedCatalogBreakdownQuery.isLoading,
    genreBreakdownQuery.isLoading,
    missingDemandQuery.isLoading,
    partnerDealsQuery.isLoading,
    restockQuery.isLoading,
    tableView,
  ])

  return (
    <div className={`${embedded ? 'space-y-6 dark:text-slate-100' : 'space-y-6 p-8 dark:text-slate-100'}`.trim()}>
      {/* Page intro, filter controls, KPI summaries, and main analytics table. */}
      {!embedded ? (
        <AdminPageIntro
          title="Analytics Hub"
        />
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard label="Sales Revenue" value={currency(purchaseSummary?.sales.revenue ?? 0)} />
        <KpiCard label="Orders" value={String(purchaseSummary?.sales.orderCount ?? 0)} />
        <KpiCard label="Procurement Cost" value={currency(purchaseSummary?.procurement.totalCost ?? 0)} />
        <KpiCard label="Open Book Leads" value={String(leadSummary?.kpis.openLeads ?? 0)} />
      </div>

      {tableView === 'authorSales' && (
        <div className="grid gap-3 md:grid-cols-4">
          <KpiCard label="Authors" value={String(authorTotals.authors)} />
          <KpiCard label="Titles Tracked" value={String(authorTotals.titles)} />
          <KpiCard label="Units Sold" value={String(authorTotals.soldQty)} />
          <KpiCard label="Author Revenue" value={currency(authorTotals.revenue)} />
        </div>
      )}

      <AdminFilterCard>
        <AdminAnalyticsFilters
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          tableView={tableView}
          setTableView={setTableView}
          fromDate={fromDate}
          setFromDate={setFromDate}
          toDate={toDate}
          setToDate={setToDate}
          leadDays={leadDays}
          setLeadDays={setLeadDays}
          partnerStatus={partnerStatus}
          setPartnerStatus={setPartnerStatus}
          partnerSearch={partnerSearch}
          setPartnerSearch={setPartnerSearch}
          visibleColumnMap={visibleColumnMap}
          setVisibleColumnMap={setVisibleColumnMap}
          columnOptions={columnOptions}
          onExport={handleExport}
          exportDisabled={paginatedRows.length === 0}
        />
      </AdminFilterCard>

      <AdminAnalyticsTable
        tableTitle={selectedTable.title}
        tableEmptyText={selectedTable.emptyText}
        tableView={tableView}
        visibleColumns={visibleColumns}
        visibleColumnIndexes={visibleColumnIndexes}
        paginatedRows={paginatedRows}
        totalRows={sortedRows.length}
        sortColumn={sortColumn}
        sortDir={sortDir}
        onToggleSort={toggleSort}
        selectedRowId={selectedRowId}
        setSelectedRowId={setSelectedRowId}
        isLoading={tableLoadingState.isLoading}
        loadingText={tableLoadingState.text}
        partnerPipelineTotal={partnerPipelineQuery.data?.totalPartnerLeads ?? 0}
        selectedRow={selectedRow}
        groupBy={groupBy}
        detailContext={detailContext}
        page={page}
        totalPages={totalPages}
        onPrevPage={() => setPage((current) => Math.max(1, current - 1))}
        onNextPage={() => setPage((current) => Math.min(totalPages, current + 1))}
      />
    </div>
  )
}

const AdminAnalyticsPage = () => <AdminAnalyticsContent />

// Reusable KPI tile for top-level analytics summaries.
const KpiCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-bold">{value}</p>
  </div>
)

export default AdminAnalyticsPage
