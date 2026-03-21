import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useWarehouses } from '@/features/admin/services/warehouses'
import { useStores } from '@/features/admin/services/stores'
import { api, getErrorMessage } from '@/lib/api'
import {
  PartnerDealStatus,
  useCreatePartnerDeal,
  useReceivePartnerConsignmentStock,
  useCreatePartnerSettlement,
  usePartnerSettlementPreview,
  useMarkPartnerSettlementPaid,
  usePartnerDeals,
  useUpdatePartnerDeal,
} from '@/features/admin/services/partner-deals'
import AdminPageIntro from '@/components/admin/AdminPageIntro'

type ViewMode = 'table' | 'heatmap'
type DistributionSection = 'distribution' | 'deals' | 'receipts' | 'settlements'

type LocationType = 'warehouse' | 'store'

type LocationCell = {
  id: string
  code: string
  name: string
  type: LocationType
  mapKey: string
}

const AdminBookDistributionPage = () => {
  const [activeSection, setActiveSection] = useState<DistributionSection>('distribution')
  const [search, setSearch] = useState('')
  const [selectedLocationKey, setSelectedLocationKey] = useState('')
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'isbn' | 'stock'>('title')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [dealFilter, setDealFilter] = useState<PartnerDealStatus | ''>('')
  const [dealSearch, setDealSearch] = useState('')
  const [dealForm, setDealForm] = useState({
    partnerName: '',
    partnerCompany: '',
    partnerEmail: '',
    revenueSharePct: '25',
    bookId: '',
    termsNote: '',
  })
  const [settlementFormByDeal, setSettlementFormByDeal] = useState<Record<string, {
    periodStart: string
    periodEnd: string
    grossSalesAmount: string
    note: string
  }>>({})
  const [settlementPreviewByDeal, setSettlementPreviewByDeal] = useState<
    Record<string, { orderCount: number; quantitySold: number; partnerShareAmount: number; grossSalesAmount: number } | undefined>
  >({})
  const [settlementResultByDeal, setSettlementResultByDeal] = useState<
    Record<string, { type: 'success' | 'error'; message: string } | undefined>
  >({})
  const [receiptFormByDeal, setReceiptFormByDeal] = useState<Record<string, {
    warehouseId: string
    quantity: string
    note: string
  }>>({})
  const [receiptResultByDeal, setReceiptResultByDeal] = useState<
    Record<string, { type: 'success' | 'error'; message: string } | undefined>
  >({})

  const { data: warehouses = [] } = useWarehouses()
  const { data: stores = [] } = useStores()
  const {
    data: books = [],
    error: booksError,
    isLoading: isBooksLoading,
  } = useQuery({
    queryKey: ['book-distribution-books'],
    queryFn: async () => {
      const limit = 100
      let page = 1
      let total = Number.POSITIVE_INFINITY
      const allBooks: Array<{
        id: string
        title: string
        author: string
        isbn: string
      }> = []

      while (allBooks.length < total) {
        const response = await api.get('/books', {
          params: {
            status: 'active',
            page,
            limit,
          },
        })
        const payload = response.data as {
          books: Array<{
            id: string
            title: string
            author: string
            isbn: string
          }>
          total: number
        }

        if (!Array.isArray(payload.books) || payload.books.length === 0) {
          break
        }

        allBooks.push(...payload.books)
        total = Number.isFinite(payload.total) ? payload.total : allBooks.length
        page += 1
      }

      return allBooks
    },
  })

  const partnerDealsQuery = usePartnerDeals({
    status: dealFilter || undefined,
    q: dealSearch.trim() || undefined,
  })
  const createDealMutation = useCreatePartnerDeal()
  const receiveConsignmentStockMutation = useReceivePartnerConsignmentStock()
  const updateDealMutation = useUpdatePartnerDeal()
  const createSettlementMutation = useCreatePartnerSettlement()
  const previewSettlementMutation = usePartnerSettlementPreview()
  const markPaidMutation = useMarkPartnerSettlementPaid()

  const locations = useMemo<LocationCell[]>(
    () => [
      ...warehouses.map((warehouse) => ({
        id: warehouse.id,
        code: warehouse.code,
        name: warehouse.name,
        type: 'warehouse' as const,
        mapKey: `warehouse:${warehouse.id}`,
      })),
      ...stores.map((store) => ({
        id: store.id,
        code: store.code,
        name: store.name,
        type: 'store' as const,
        mapKey: `store:${store.id}`,
      })),
    ],
    [stores, warehouses],
  )

  const {
    data: stockDistributionMap = {},
    error: distributionError,
    isLoading: isDistributionLoading,
  } = useQuery({
    queryKey: [
      'book-distribution',
      warehouses.map((w) => w.id).join(','),
      stores.map((s) => s.id).join(','),
    ],
    queryFn: async (): Promise<Record<string, Record<string, number>>> => {
      const [warehouseResponses, storeResponses] = await Promise.all([
        Promise.all(
          warehouses.map(async (warehouse) => {
            const response = await api.get(`/warehouses/${warehouse.id}/stocks`)
            return {
              mapKey: `warehouse:${warehouse.id}`,
              rows: response.data as Array<{ bookId: string; stock: number }>,
            }
          }),
        ),
        Promise.all(
          stores.map(async (store) => {
            const response = await api.get(`/stores/${store.id}/stocks`)
            return {
              mapKey: `store:${store.id}`,
              rows: response.data as Array<{ bookId: string; stock: number }>,
            }
          }),
        ),
      ])

      const distribution: Record<string, Record<string, number>> = {}
      for (const result of [...warehouseResponses, ...storeResponses]) {
        for (const row of result.rows) {
          if (!distribution[row.bookId]) distribution[row.bookId] = {}
          distribution[row.bookId][result.mapKey] = row.stock
        }
      }
      return distribution
    },
    enabled: warehouses.length + stores.length > 0,
    retry: false,
  })

  const visibleLocations = useMemo(() => {
    if (!selectedLocationKey) return locations
    return locations.filter((location) => location.mapKey === selectedLocationKey)
  }, [locations, selectedLocationKey])

  const filteredBooks = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return books
    return books.filter((book) =>
      book.title.toLowerCase().includes(keyword)
      || book.author.toLowerCase().includes(keyword)
      || book.isbn.toLowerCase().includes(keyword),
    )
  }, [books, search])

  const sortedBooks = useMemo(() => {
    const direction = sortDir === 'asc' ? 1 : -1
    return [...filteredBooks].sort((a, b) => {
      switch (sortBy) {
        case 'author':
          return a.author.localeCompare(b.author) * direction
        case 'isbn':
          return a.isbn.localeCompare(b.isbn) * direction
        case 'stock': {
          const aTotal = locations.reduce((sum, location) => sum + (stockDistributionMap[a.id]?.[location.mapKey] ?? 0), 0)
          const bTotal = locations.reduce((sum, location) => sum + (stockDistributionMap[b.id]?.[location.mapKey] ?? 0), 0)
          return (aTotal - bTotal) * direction
        }
        default:
          return a.title.localeCompare(b.title) * direction
      }
    })
  }, [filteredBooks, locations, sortBy, sortDir, stockDistributionMap])

  const totalPages = Math.max(1, Math.ceil(sortedBooks.length / pageSize))
  const pageNumbers = useMemo(() => {
    const maxButtons = 5
    let start = Math.max(1, page - Math.floor(maxButtons / 2))
    const end = Math.min(totalPages, start + maxButtons - 1)
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1)
    }
    return Array.from({ length: end - start + 1 }, (_, index) => start + index)
  }, [page, totalPages])
  const pagedBooks = useMemo(() => {
    const start = (page - 1) * pageSize
    return sortedBooks.slice(start, start + pageSize)
  }, [page, pageSize, sortedBooks])
  const startRow = sortedBooks.length === 0 ? 0 : (page - 1) * pageSize + 1
  const endRow = Math.min(page * pageSize, sortedBooks.length)

  const maxVisibleStock = useMemo(() => {
    const values = pagedBooks.flatMap((book) =>
      visibleLocations.map((location) => stockDistributionMap[book.id]?.[location.mapKey] ?? 0),
    )
    return Math.max(1, ...values)
  }, [pagedBooks, visibleLocations, stockDistributionMap])

  useEffect(() => {
    setPage(1)
  }, [search, sortBy, sortDir, pageSize, selectedLocationKey])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const onCreateDeal = async () => {
    if (!dealForm.partnerName.trim() || !dealForm.revenueSharePct) return
    await createDealMutation.mutateAsync({
      partnerName: dealForm.partnerName.trim(),
      partnerCompany: dealForm.partnerCompany.trim() || undefined,
      partnerEmail: dealForm.partnerEmail.trim() || undefined,
      revenueSharePct: Number(dealForm.revenueSharePct),
      bookId: dealForm.bookId || undefined,
      termsNote: dealForm.termsNote.trim() || undefined,
      status: 'DRAFT',
    })

    setDealForm({
      partnerName: '',
      partnerCompany: '',
      partnerEmail: '',
      revenueSharePct: '25',
      bookId: '',
      termsNote: '',
    })
  }

  const toSettlementBoundaryIso = (dateText: string, mode: 'start' | 'end') => {
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

  const onCreateSettlement = async (dealId: string) => {
    const payload = settlementFormByDeal[dealId]
    const grossText = payload?.grossSalesAmount?.trim() ?? ''
    if (!payload?.periodStart || !payload?.periodEnd || grossText === '') return
    const grossSalesAmount = Number(grossText)
    if (!Number.isFinite(grossSalesAmount) || grossSalesAmount < 0) return
    const periodStart = toSettlementBoundaryIso(payload.periodStart, 'start')
    const periodEnd = toSettlementBoundaryIso(payload.periodEnd, 'end')
    if (!periodStart || !periodEnd) {
      setSettlementResultByDeal((prev) => ({
        ...prev,
        [dealId]: { type: 'error', message: 'Enter a valid settlement date range.' },
      }))
      return
    }
    const startDate = new Date(periodStart)
    const endDate = new Date(periodEnd)
    if (endDate < startDate) {
      setSettlementResultByDeal((prev) => ({
        ...prev,
        [dealId]: { type: 'error', message: 'End date cannot be earlier than start date.' },
      }))
      return
    }

    try {
      await createSettlementMutation.mutateAsync({
        dealId,
        data: {
          periodStart,
          periodEnd,
          grossSalesAmount,
          note: payload.note || undefined,
        },
      })
      setSettlementFormByDeal((prev) => ({
        ...prev,
        [dealId]: {
          periodStart: '',
          periodEnd: '',
          grossSalesAmount: '',
          note: '',
        },
      }))
      setSettlementResultByDeal((prev) => ({
        ...prev,
        [dealId]: { type: 'success', message: 'Settlement added successfully.' },
      }))
    } catch (error) {
      setSettlementResultByDeal((prev) => ({
        ...prev,
        [dealId]: { type: 'error', message: getErrorMessage(error) },
      }))
    }
  }

  const onAutoFillSettlement = async (dealId: string, hasLinkedBook: boolean) => {
    const payload = settlementFormByDeal[dealId]
    if (!payload?.periodStart || !payload?.periodEnd || !hasLinkedBook) return

    const periodStart = toSettlementBoundaryIso(payload.periodStart, 'start')
    const periodEnd = toSettlementBoundaryIso(payload.periodEnd, 'end')
    if (!periodStart || !periodEnd) {
      setSettlementResultByDeal((prev) => ({
        ...prev,
        [dealId]: { type: 'error', message: 'Enter a valid settlement date range.' },
      }))
      return
    }

    try {
      const preview = await previewSettlementMutation.mutateAsync({
        dealId,
        periodStart,
        periodEnd,
      })

      setSettlementFormByDeal((prev) => ({
        ...prev,
        [dealId]: {
          ...payload,
          grossSalesAmount: String(preview.grossSalesAmount),
          note: payload.note || `Auto-calculated from ${preview.orderCount} orders (${preview.quantitySold} units).`,
        },
      }))
      setSettlementPreviewByDeal((prev) => ({
        ...prev,
        [dealId]: {
          orderCount: preview.orderCount,
          quantitySold: preview.quantitySold,
          partnerShareAmount: preview.partnerShareAmount,
          grossSalesAmount: preview.grossSalesAmount,
        },
      }))
      setSettlementResultByDeal((prev) => ({
        ...prev,
        [dealId]: {
          type: 'success',
          message:
            preview.orderCount > 0
              ? `Auto-filled gross sales from ${preview.orderCount} order${preview.orderCount === 1 ? '' : 's'}.`
              : 'No confirmed or completed sales were found in that date range.',
        },
      }))
    } catch (error) {
      setSettlementResultByDeal((prev) => ({
        ...prev,
        [dealId]: { type: 'error', message: getErrorMessage(error) },
      }))
    }
  }

  const onReceiveConsignmentStock = async (dealId: string) => {
    const payload = receiptFormByDeal[dealId]
    const quantity = Number(payload?.quantity ?? '')

    if (!payload?.warehouseId || !Number.isFinite(quantity) || quantity < 1) {
      setReceiptResultByDeal((prev) => ({
        ...prev,
        [dealId]: { type: 'error', message: 'Choose a warehouse and enter a valid quantity.' },
      }))
      return
    }

    try {
      await receiveConsignmentStockMutation.mutateAsync({
        dealId,
        data: {
          warehouseId: payload.warehouseId,
          quantity,
          note: payload.note.trim() || undefined,
        },
      })
      setReceiptFormByDeal((prev) => ({
        ...prev,
        [dealId]: { warehouseId: '', quantity: '', note: '' },
      }))
      setReceiptResultByDeal((prev) => ({
        ...prev,
        [dealId]: { type: 'success', message: `Received ${quantity} consignment unit${quantity === 1 ? '' : 's'}.` },
      }))
    } catch (error) {
      setReceiptResultByDeal((prev) => ({
        ...prev,
        [dealId]: { type: 'error', message: getErrorMessage(error) },
      }))
    }
  }

  return (
    <div className="space-y-6 p-8 dark:text-slate-100">
      <AdminPageIntro title="Book Distribution" />

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          {([
            ['distribution', 'Distribution'],
            ['deals', 'Deals'],
            ['receipts', 'Receipts'],
            ['settlements', 'Settlements'],
          ] as Array<[DistributionSection, string]>).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveSection(key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeSection === key
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {(booksError || distributionError) && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          {booksError
            ? `Books query failed: ${getErrorMessage(booksError)}`
            : `Distribution query failed: ${getErrorMessage(distributionError)}`}
        </div>
      )}

      {activeSection === 'distribution' && (
      <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Distribution Matrix</h2>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition-all duration-150 ${
                viewMode === 'table'
                  ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900'
                  : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode('heatmap')}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition-all duration-150 ${
                viewMode === 'heatmap'
                  ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900'
                  : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              Heatmap
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, author, or ISBN"
            className="h-11 w-full rounded-lg border px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <select
            value={selectedLocationKey}
            onChange={(e) => setSelectedLocationKey(e.target.value)}
            className="h-11 rounded-lg border px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">All locations</option>
            {locations.map((location) => (
              <option key={location.mapKey} value={location.mapKey}>
                {location.type === 'warehouse' ? 'WH' : 'Store'} • {location.name} ({location.code})
              </option>
            ))}
          </select>
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="title">Sort: Title</option>
            <option value="author">Sort: Author</option>
            <option value="isbn">Sort: ISBN</option>
            <option value="stock">Sort: Network Stock</option>
          </select>
          <select
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value as typeof sortDir)}
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="asc">Order: Ascending</option>
            <option value="desc">Order: Descending</option>
          </select>
          <select
            value={String(pageSize)}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
          </select>
          <div className="rounded-lg border px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
            {sortedBooks.length} result(s)
          </div>
        </div>

        <div className="admin-table-wrapper relative mt-4 max-h-[560px] overflow-auto">
          <table className="admin-table min-w-full border-separate border-spacing-0 text-sm">
            <thead className="admin-table-head">
              <tr>
                <th className="sticky left-0 top-0 z-30 min-w-[260px] border-b border-slate-200 bg-slate-50 px-3 py-2 text-left dark:border-slate-700 dark:bg-slate-900">Book</th>
                <th className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 px-3 py-2 text-left dark:border-slate-700 dark:bg-slate-900">Network Total</th>
                {visibleLocations.map((location) => (
                  <th key={location.mapKey} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 px-3 py-2 text-left dark:border-slate-700 dark:bg-slate-900">
                    {location.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedBooks.map((book) => {
                const networkTotal = locations.reduce(
                  (sum, location) => sum + (stockDistributionMap[book.id]?.[location.mapKey] ?? 0),
                  0,
                )

                return (
                  <tr key={book.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="sticky left-0 z-10 border-r border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                      <p className="font-medium">{book.title}</p>
                      <p className="text-xs text-slate-500">{book.author}</p>
                      <p className="text-xs text-slate-400">{book.isbn}</p>
                    </td>
                    <td className="px-3 py-2 font-semibold">{networkTotal}</td>
                    {visibleLocations.map((location) => {
                      const value = stockDistributionMap[book.id]?.[location.mapKey] ?? 0
                      const intensity = Math.max(0.08, value / maxVisibleStock)
                      return (
                        <td
                          key={`${book.id}:${location.mapKey}`}
                          className={`px-3 py-2 ${viewMode === 'heatmap' ? 'font-semibold' : ''}`}
                          style={viewMode === 'heatmap'
                            ? {
                                background: `linear-gradient(90deg, rgba(59,130,246,${Math.min(intensity, 0.7)}) 0%, rgba(59,130,246,${Math.min(intensity, 0.28)}) 100%)`,
                              }
                            : undefined}
                        >
                          {value}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
              {!isBooksLoading && !isDistributionLoading && sortedBooks.length === 0 && (
                <tr>
                  <td colSpan={2 + visibleLocations.length} className="px-3 py-4 text-slate-500">
                    No distribution data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Showing {startRow}-{endRow} of {sortedBooks.length} • Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={page <= 1}
              className="rounded border px-3 py-1 text-sm transition-all duration-150 disabled:opacity-50 dark:border-slate-700"
            >
              First
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="rounded border px-3 py-1 text-sm transition-all duration-150 disabled:opacity-50 dark:border-slate-700"
            >
              Previous
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                className={`rounded border px-3 py-1 text-sm transition-all duration-150 dark:border-slate-700 ${
                  pageNumber === page ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : ''
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="rounded border px-3 py-1 text-sm transition-all duration-150 disabled:opacity-50 dark:border-slate-700"
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className="rounded border px-3 py-1 text-sm transition-all duration-150 disabled:opacity-50 dark:border-slate-700"
            >
              Last
            </button>
          </div>
        </div>
      </div>
      )}

      {activeSection === 'deals' && (
      <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Partner Consignment Deals</h2>
            <p className="mt-1 text-xs text-slate-500">Create the agreement first, then receive consignment stock separately in Receipts.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={dealFilter}
              onChange={(event) => setDealFilter(event.target.value as PartnerDealStatus | '')}
              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">All statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PAUSED">PAUSED</option>
              <option value="ENDED">ENDED</option>
            </select>
            <input
              value={dealSearch}
              onChange={(event) => setDealSearch(event.target.value)}
              placeholder="Search partner/company"
              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <input
            value={dealForm.partnerName}
            onChange={(event) => setDealForm((prev) => ({ ...prev, partnerName: event.target.value }))}
            placeholder="Partner name"
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <input
            value={dealForm.partnerCompany}
            onChange={(event) => setDealForm((prev) => ({ ...prev, partnerCompany: event.target.value }))}
            placeholder="Company"
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <input
            value={dealForm.partnerEmail}
            onChange={(event) => setDealForm((prev) => ({ ...prev, partnerEmail: event.target.value }))}
            placeholder="Partner email"
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <input
            type="number"
            min={0}
            max={100}
            value={dealForm.revenueSharePct}
            onChange={(event) => setDealForm((prev) => ({ ...prev, revenueSharePct: event.target.value }))}
            placeholder="Share %"
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <select
            value={dealForm.bookId}
            onChange={(event) => setDealForm((prev) => ({ ...prev, bookId: event.target.value }))}
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">No linked book yet</option>
            {books.slice(0, 400).map((book) => (
              <option key={book.id} value={book.id}>
                {book.title} - {book.author}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void onCreateDeal()}
            disabled={createDealMutation.isPending}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
          >
            {createDealMutation.isPending ? 'Saving...' : 'Create Deal'}
          </button>
        </div>
        <textarea
          value={dealForm.termsNote}
          onChange={(event) => setDealForm((prev) => ({ ...prev, termsNote: event.target.value }))}
          placeholder="Terms note (cycle, payout method, exclusions...)"
          rows={2}
          className="mt-3 w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        />

        <div className="mt-4 space-y-3">
          {(partnerDealsQuery.data?.items || []).map((deal) => {
            return (
              <div key={deal.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{deal.partnerName}</p>
                    <p className="text-xs text-slate-500">
                      {deal.partnerCompany || 'No company'} | Share {Number(deal.revenueSharePct)}%
                    </p>
                    <p className="text-xs text-slate-500">
                      {deal.book ? `${deal.book.title} by ${deal.book.author}` : 'No linked book yet'}
                    </p>
                  </div>
                  <select
                    value={deal.status}
                    onChange={(event) =>
                      updateDealMutation.mutate({
                        id: deal.id,
                        data: { status: event.target.value as PartnerDealStatus },
                      })
                    }
                    className="rounded-lg border px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="ACTIVE">ACTIVE</option>
                    <option value="PAUSED">PAUSED</option>
                    <option value="ENDED">ENDED</option>
                  </select>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Linked book</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                      {deal.book ? `${deal.book.title} by ${deal.book.author}` : 'Not linked yet'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Revenue share</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{Number(deal.revenueSharePct)}%</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Terms</p>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{deal.termsNote || 'No note yet'}</p>
                  </div>
                </div>
              </div>
            )
          })}
          {!partnerDealsQuery.isLoading && (partnerDealsQuery.data?.items.length || 0) === 0 && (
            <p className="text-sm text-slate-500">No partner deals yet.</p>
          )}
        </div>
      </div>
      )}

      {activeSection === 'receipts' && (
      <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Consignment Receipts</h2>
          <p className="mt-1 text-xs text-slate-500">Use this after a deal is active and linked to a book. This is where you enter warehouse and quantity.</p>
        </div>
        <div className="mt-4 space-y-3">
          {(partnerDealsQuery.data?.items || []).map((deal) => {
            const receiptForm = receiptFormByDeal[deal.id] || {
              warehouseId: '',
              quantity: '',
              note: '',
            }
            const canReceive = deal.status === 'ACTIVE' && Boolean(deal.bookId)
            return (
              <div key={deal.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{deal.partnerName}</p>
                    <p className="text-xs text-slate-500">
                      {deal.book ? `${deal.book.title} by ${deal.book.author}` : 'No linked book'}
                    </p>
                    <p className="text-xs text-slate-500">Status: {deal.status}</p>
                  </div>
                  {!canReceive && (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                      {deal.bookId ? 'Activate deal to receive stock' : 'Link a book before receiving'}
                    </span>
                  )}
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-4">
                  <select
                    value={receiptForm.warehouseId}
                    onChange={(event) =>
                      setReceiptFormByDeal((prev) => ({
                        ...prev,
                        [deal.id]: { ...receiptForm, warehouseId: event.target.value },
                      }))
                    }
                    disabled={!canReceive}
                    className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="">Choose warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.code})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={receiptForm.quantity}
                    onChange={(event) =>
                      setReceiptFormByDeal((prev) => ({
                        ...prev,
                        [deal.id]: { ...receiptForm, quantity: event.target.value },
                      }))
                    }
                    disabled={!canReceive}
                    placeholder="Quantity received"
                    className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                  <input
                    value={receiptForm.note}
                    onChange={(event) =>
                      setReceiptFormByDeal((prev) => ({
                        ...prev,
                        [deal.id]: { ...receiptForm, note: event.target.value },
                      }))
                    }
                    disabled={!canReceive}
                    placeholder="Receipt note"
                    className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 md:col-span-2"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">
                    Receiving stock here creates consignment inventory for the linked book in the selected warehouse.
                  </p>
                  <button
                    type="button"
                    onClick={() => void onReceiveConsignmentStock(deal.id)}
                    disabled={receiveConsignmentStockMutation.isPending || !canReceive}
                    className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-cyan-900/40 dark:bg-cyan-950/20 dark:text-cyan-300"
                  >
                    {receiveConsignmentStockMutation.isPending ? 'Receiving...' : 'Receive Stock'}
                  </button>
                </div>
                {receiptResultByDeal[deal.id] && (
                  <p
                    className={`mt-2 text-xs ${
                      receiptResultByDeal[deal.id]?.type === 'success'
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {receiptResultByDeal[deal.id]?.message}
                  </p>
                )}
              </div>
            )
          })}
          {!partnerDealsQuery.isLoading && (partnerDealsQuery.data?.items.length || 0) === 0 && (
            <p className="text-sm text-slate-500">No partner deals yet.</p>
          )}
        </div>
      </div>
      )}

      {activeSection === 'settlements' && (
      <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Partner Settlements</h2>
          <p className="mt-1 text-xs text-slate-500">Create payout records from gross sales, then mark them paid when finance sends the partner share.</p>
        </div>
        <div className="mt-4 space-y-3">
          {(partnerDealsQuery.data?.items || []).map((deal) => {
            const settlementForm = settlementFormByDeal[deal.id] || {
              periodStart: '',
              periodEnd: '',
              grossSalesAmount: '',
              note: '',
            }
            const parsedGross = Number(settlementForm.grossSalesAmount)
            const canSubmitSettlement =
              !!settlementForm.periodStart
              && !!settlementForm.periodEnd
              && settlementForm.grossSalesAmount.trim() !== ''
              && Number.isFinite(parsedGross)
              && parsedGross >= 0
            return (
              <div key={deal.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{deal.partnerName}</p>
                    <p className="text-xs text-slate-500">
                      {deal.book ? `${deal.book.title} by ${deal.book.author}` : 'No linked book yet'}
                    </p>
                    <p className="text-xs text-slate-500">Share {Number(deal.revenueSharePct)}%</p>
                  </div>
                  <span className="rounded border border-slate-200 px-2 py-1 text-xs dark:border-slate-700">
                    {deal.status}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-4">
                  <input
                    type="date"
                    value={settlementForm.periodStart}
                    onChange={(event) =>
                      setSettlementFormByDeal((prev) => ({
                        ...prev,
                        [deal.id]: { ...settlementForm, periodStart: event.target.value },
                      }))
                    }
                    className="rounded-lg border px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                  />
                  <input
                    type="date"
                    value={settlementForm.periodEnd}
                    onChange={(event) =>
                      setSettlementFormByDeal((prev) => ({
                        ...prev,
                        [deal.id]: { ...settlementForm, periodEnd: event.target.value },
                      }))
                    }
                    className="rounded-lg border px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                  />
                  <input
                    type="number"
                    min={0}
                    value={settlementForm.grossSalesAmount}
                    onChange={(event) =>
                      setSettlementFormByDeal((prev) => ({
                        ...prev,
                        [deal.id]: { ...settlementForm, grossSalesAmount: event.target.value },
                      }))
                    }
                    placeholder="Gross sales"
                    className="rounded-lg border px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => void onCreateSettlement(deal.id)}
                    disabled={createSettlementMutation.isPending || !canSubmitSettlement}
                    className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 dark:border-cyan-900/40 dark:bg-cyan-950/20 dark:text-cyan-300"
                  >
                    Add Settlement
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void onAutoFillSettlement(deal.id, Boolean(deal.bookId))}
                    disabled={
                      previewSettlementMutation.isPending
                      || !deal.bookId
                      || !settlementForm.periodStart
                      || !settlementForm.periodEnd
                    }
                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-300"
                  >
                    {previewSettlementMutation.isPending ? 'Calculating...' : 'Auto-fill from sales'}
                  </button>
                  {!deal.bookId && (
                    <span className="text-xs text-amber-700 dark:text-amber-300">
                      Link a book to enable auto-calc.
                    </span>
                  )}
                  {settlementPreviewByDeal[deal.id] && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Orders {settlementPreviewByDeal[deal.id]?.orderCount} | Units {settlementPreviewByDeal[deal.id]?.quantitySold} | Est. partner share {settlementPreviewByDeal[deal.id]?.partnerShareAmount}
                    </span>
                  )}
                </div>
                {settlementResultByDeal[deal.id] && (
                  <p
                    className={`mt-2 text-xs ${
                      settlementResultByDeal[deal.id]?.type === 'success'
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {settlementResultByDeal[deal.id]?.message}
                  </p>
                )}
                {(deal.settlements || []).length > 0 && (
                  <div className="mt-3 space-y-2">
                    {(deal.settlements || []).map((settlement) => (
                      <div key={settlement.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700">
                        <p>
                          {new Date(settlement.periodStart).toLocaleDateString()} - {new Date(settlement.periodEnd).toLocaleDateString()} | Gross {Number(settlement.grossSalesAmount)} | Share {Number(settlement.partnerShareAmount)}
                        </p>
                        {settlement.status === 'PENDING' ? (
                          <button
                            type="button"
                            onClick={() =>
                              markPaidMutation.mutate({
                                dealId: deal.id,
                                settlementId: settlement.id,
                              })
                            }
                            className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
                          >
                            Mark Paid
                          </button>
                        ) : (
                          <span className="rounded border border-slate-200 px-2 py-1 dark:border-slate-700">
                            {settlement.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {!partnerDealsQuery.isLoading && (partnerDealsQuery.data?.items.length || 0) === 0 && (
            <p className="text-sm text-slate-500">No partner deals yet.</p>
          )}
        </div>
      </div>
      )}
    </div>
  )
}

export default AdminBookDistributionPage
