import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import BookFormModal from '@/components/admin/BookFormModal'
import Button from '@/components/ui/Button'
import DistributionMatrixSection from '@/features/admin/book-distribution/components/DistributionMatrixSection'
import CreatePartnerDealPanel from '@/features/admin/book-distribution/components/CreatePartnerDealPanel'
import PartnerDealsSection from '@/features/admin/book-distribution/components/PartnerDealsSection'
import PartnerReceiptsSection from '@/features/admin/book-distribution/components/PartnerReceiptsSection'
import PartnerSettlementsSection from '@/features/admin/book-distribution/components/PartnerSettlementsSection'
import {
  DISTRIBUTION_SECTION_OPTIONS,
  createEmptyDealForm,
  createEmptyReceiptForm,
  createEmptySettlementForm,
  toSettlementBoundaryIso,
  type DistributionBook,
  type DistributionSection,
  type LocationCell,
  type OwnershipFilter,
  type ViewMode,
} from '@/features/admin/book-distribution/lib/bookDistributionDisplay'
import type { CreateBookData } from '@/lib/schemas'
import { useCreateBook } from '@/services/books'
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

const AdminBookDistributionPage = () => {
  const [activeSection, setActiveSection] = useState<DistributionSection>('distribution')
  const [search, setSearch] = useState('')
  const [selectedLocationKey, setSelectedLocationKey] = useState('')
  const [ownershipFilter, setOwnershipFilter] = useState<OwnershipFilter>('all')
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'isbn' | 'stock'>('title')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [dealFilter, setDealFilter] = useState<PartnerDealStatus | ''>('')
  const [dealSearch, setDealSearch] = useState('')
  const [dealForm, setDealForm] = useState(createEmptyDealForm)
  const [settlementFormByDeal, setSettlementFormByDeal] = useState<Record<string, ReturnType<typeof createEmptySettlementForm>>>({})
  const [settlementPreviewByDeal, setSettlementPreviewByDeal] = useState<
    Record<string, { orderCount: number; quantitySold: number; partnerShareAmount: number; grossSalesAmount: number } | undefined>
  >({})
  const [settlementResultByDeal, setSettlementResultByDeal] = useState<
    Record<string, { type: 'success' | 'error'; message: string } | undefined>
  >({})
  const [receiptFormByDeal, setReceiptFormByDeal] = useState<Record<string, ReturnType<typeof createEmptyReceiptForm>>>({})
  const [receiptResultByDeal, setReceiptResultByDeal] = useState<
    Record<string, { type: 'success' | 'error'; message: string } | undefined>
  >({})
  const [isCreateDealPanelOpen, setIsCreateDealPanelOpen] = useState(false)
  const [isAddBookPanelOpen, setIsAddBookPanelOpen] = useState(false)

  const { data: warehouses = [] } = useWarehouses()
  const { data: stores = [] } = useStores()
  const createBookMutation = useCreateBook()
  const {
    data: books = [],
    error: booksError,
    isLoading: isBooksLoading,
  } = useQuery({
    queryKey: ['book-distribution-books'],
    queryFn: async (): Promise<DistributionBook[]> => {
      const limit = 100
      let page = 1
      let total = Number.POSITIVE_INFINITY
      const allBooks: DistributionBook[] = []

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
  const { data: ownershipSummary } = useQuery({
    queryKey: ['book-ownership-summary'],
    queryFn: async (): Promise<{
      items: Array<{
        bookId: string
        ownedQuantity: number
        consignmentQuantity: number
        activeDealCount: number
        ownershipLabel: 'owned' | 'consignment' | 'mixed' | 'unassigned'
      }>
    }> => {
      const response = await api.get('/warehouses/admin/book-ownership-summary')
      return response.data
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
    const ownershipByBookId = new Map(
      (ownershipSummary?.items ?? []).map((item) => [item.bookId, item]),
    )

    return books
      .map((book) => {
        const ownership = ownershipByBookId.get(book.id)
        return {
          ...book,
          ownedQuantity: ownership?.ownedQuantity ?? 0,
          consignmentQuantity: ownership?.consignmentQuantity ?? 0,
          activeDealCount: ownership?.activeDealCount ?? 0,
          ownershipLabel:
            ownership?.ownershipLabel === 'consignment'
            || ownership?.ownershipLabel === 'mixed'
              ? ownership.ownershipLabel
              : 'owned',
        } satisfies DistributionBook
      })
      .filter((book) => {
        const matchesKeyword =
          !keyword
          || book.title.toLowerCase().includes(keyword)
          || book.author.toLowerCase().includes(keyword)
          || book.isbn.toLowerCase().includes(keyword)

        const matchesOwnership =
          ownershipFilter === 'all' || book.ownershipLabel === ownershipFilter

        return matchesKeyword && matchesOwnership
      })
  }, [books, ownershipFilter, ownershipSummary?.items, search])

  const eligibleDealBooks = useMemo(
    () => filteredBooks.filter((book) => (book.ownedQuantity ?? 0) === 0),
    [filteredBooks],
  )

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
  }, [search, sortBy, sortDir, pageSize, selectedLocationKey, ownershipFilter])

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
    setIsCreateDealPanelOpen(false)
  }

  const onCreateBook = async (data: CreateBookData) => {
    await createBookMutation.mutateAsync(data)
    setIsAddBookPanelOpen(false)
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
      setSettlementFormByDeal((prev) => ({ ...prev, [dealId]: createEmptySettlementForm() }))
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
      setReceiptFormByDeal((prev) => ({ ...prev, [dealId]: createEmptyReceiptForm() }))
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
      <AdminPageIntro
        title="Book Distribution"
        actions={(
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateDealPanelOpen(true)}
              className="h-12 rounded-[20px] px-5 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              Create Deal
            </Button>
            <Button
              type="button"
              onClick={() => setIsAddBookPanelOpen(true)}
              className="h-12 rounded-[20px] px-5 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              Add Book
            </Button>
          </>
        )}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          {DISTRIBUTION_SECTION_OPTIONS.map(([key, label]) => (
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
        <DistributionMatrixSection
          search={search}
          onSearchChange={setSearch}
          selectedLocationKey={selectedLocationKey}
          onSelectedLocationKeyChange={setSelectedLocationKey}
          ownershipFilter={ownershipFilter}
          onOwnershipFilterChange={setOwnershipFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortDir={sortDir}
          onSortDirChange={setSortDir}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          page={page}
          totalPages={totalPages}
          pageNumbers={pageNumbers}
          startRow={startRow}
          endRow={endRow}
          totalResults={sortedBooks.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          locations={locations}
          visibleLocations={visibleLocations}
          pagedBooks={pagedBooks}
          allLocations={locations}
          stockDistributionMap={stockDistributionMap}
          maxVisibleStock={maxVisibleStock}
          isBooksLoading={isBooksLoading}
          isDistributionLoading={isDistributionLoading}
          onPageChange={setPage}
          onPrevPage={() => setPage((prev) => Math.max(1, prev - 1))}
          onNextPage={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        />
      )}

      {activeSection === 'deals' && (
        <PartnerDealsSection
          dealFilter={dealFilter}
          onDealFilterChange={setDealFilter}
          dealSearch={dealSearch}
          onDealSearchChange={setDealSearch}
          deals={partnerDealsQuery.data?.items || []}
          isLoading={partnerDealsQuery.isLoading}
          onUpdateDealStatus={(dealId, status) => {
            updateDealMutation.mutate({
              id: dealId,
              data: { status },
            })
          }}
        />
      )}

      {activeSection === 'receipts' && (
        <PartnerReceiptsSection
          deals={partnerDealsQuery.data?.items || []}
          warehouses={warehouses}
          receiptFormByDeal={receiptFormByDeal}
          receiptResultByDeal={receiptResultByDeal}
          isLoading={partnerDealsQuery.isLoading}
          isReceiving={receiveConsignmentStockMutation.isPending}
          onReceiptFormChange={(dealId, value) => {
            setReceiptFormByDeal((prev) => ({ ...prev, [dealId]: value }))
          }}
          onReceiveStock={(dealId) => void onReceiveConsignmentStock(dealId)}
        />
      )}

      {activeSection === 'settlements' && (
        <PartnerSettlementsSection
          deals={partnerDealsQuery.data?.items || []}
          settlementFormByDeal={settlementFormByDeal}
          settlementPreviewByDeal={settlementPreviewByDeal}
          settlementResultByDeal={settlementResultByDeal}
          isLoading={partnerDealsQuery.isLoading}
          isCreatingSettlement={createSettlementMutation.isPending}
          isPreviewingSettlement={previewSettlementMutation.isPending}
          onSettlementFormChange={(dealId, value) => {
            setSettlementFormByDeal((prev) => ({ ...prev, [dealId]: value }))
          }}
          onCreateSettlement={(dealId) => void onCreateSettlement(dealId)}
          onAutoFillSettlement={(dealId, hasLinkedBook) => void onAutoFillSettlement(dealId, hasLinkedBook)}
          onMarkPaid={(dealId, settlementId) => {
            markPaidMutation.mutate({ dealId, settlementId })
          }}
        />
      )}

      <CreatePartnerDealPanel
        open={isCreateDealPanelOpen}
        onClose={() => setIsCreateDealPanelOpen(false)}
        dealForm={dealForm}
        onDealFormChange={setDealForm}
        books={books}
        eligibleBooks={eligibleDealBooks}
        isCreatingDeal={createDealMutation.isPending}
        onCreateDeal={() => void onCreateDeal()}
      />

      <BookFormModal
        isOpen={isAddBookPanelOpen}
        onClose={() => setIsAddBookPanelOpen(false)}
        onSubmit={onCreateBook}
        isLoading={createBookMutation.isPending}
      />
    </div>
  )
}

export default AdminBookDistributionPage
