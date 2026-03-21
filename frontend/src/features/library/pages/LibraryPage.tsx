import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  BookOpenCheck,
  Check,
  ListFilter,
  ListChecks,
  Search,
} from 'lucide-react'
import {
  useFavorites,
  useStockAlerts,
  useSubscribeToStockAlert,
  useUnsubscribeFromStockAlert,
  useWishlist,
} from '@/services/library'
import {
  type ReadingStatus,
  useCreateReadingSession,
  useMyEbooks,
  useReadingItems,
  useRemoveTrackedBook,
  useTrackBook,
  useUpdateReadingGoal,
  useUpdateReadingProgress,
  useUpdateReadingStatus,
} from '@/services/reading'
import LibraryAlerts from '@/features/library/components/LibraryAlerts'
import LibraryDetailPanel from '@/features/library/components/LibraryDetailPanel'
import LibraryFilterPanel from '@/features/library/components/LibraryFilterPanel'
import LibraryShelfView from '@/features/library/components/LibraryShelfView'
import type {
  ActiveLibraryFilter,
  LibraryCollectionFilter,
  LibraryFilterMeta,
  LibraryItem,
  LibraryStatusFilter,
  ShelfRow,
  StockAlertItemPreview,
} from '@/features/library/components/types'
import { api, getErrorMessage } from '@/lib/api'
import { getLibraryLists, type LibraryList } from '@/lib/libraryLists'
import { getTaggedBookIds } from '@/lib/libraryTags'

const isLibraryStatusFilter = (value: string): value is LibraryStatusFilter =>
  value === 'ALL' || value === 'TO_READ' || value === 'READING' || value === 'FINISHED'

const STATUS_LABEL: Record<ReadingStatus, string> = {
  TO_READ: 'Want to Read',
  READING: 'Currently Reading',
  FINISHED: 'Finished',
}

const FILTER_META: Record<LibraryStatusFilter, LibraryFilterMeta> = {
  ALL: { label: 'All', icon: <BookOpen className="h-4 w-4" /> },
  TO_READ: { label: 'Want to Read', icon: <ListChecks className="h-4 w-4" /> },
  READING: { label: 'Currently Reading', icon: <BookOpenCheck className="h-4 w-4" /> },
  FINISHED: { label: 'Finished', icon: <Check className="h-4 w-4" /> },
}

const COLLECTION_META: Record<LibraryCollectionFilter, LibraryFilterMeta> = {
  FAVORITES: { label: 'Favorites', icon: <BookOpen className="h-4 w-4" /> },
  OWNED: { label: 'Owned', icon: <BookOpenCheck className="h-4 w-4" /> },
}

const LibraryPage = () => {
  // Route state and local UI controls.
  const location = useLocation()
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<ActiveLibraryFilter>({ type: 'status', value: 'ALL' })
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false)
  const [isBookCardFlipped, setIsBookCardFlipped] = useState(false)
  const [customLists, setCustomLists] = useState<LibraryList[]>([])
  const [feedback, setFeedback] = useState('')
  const [currentPageInput, setCurrentPageInput] = useState('0')
  const [totalPagesInput, setTotalPagesInput] = useState('')
  const [goalInput, setGoalInput] = useState('')
  const [isOpeningEbook, setIsOpeningEbook] = useState(false)

  // Library, reading, and ebook data sources.
  const { data: favorites = [], isLoading: favoritesLoading } = useFavorites(true)
  const { data: wishlist = [], isLoading: wishlistLoading } = useWishlist(true)
  const { data: stockAlerts = [] } = useStockAlerts(true)
  const { data: readingItems = [], isLoading: readingLoading } = useReadingItems()
  const { data: myEbooks = [], isLoading: ebooksLoading } = useMyEbooks(true)
  const subscribeToStockAlert = useSubscribeToStockAlert()
  const unsubscribeFromStockAlert = useUnsubscribeFromStockAlert()
  const trackBook = useTrackBook()
  const updateStatus = useUpdateReadingStatus()
  const updateProgress = useUpdateReadingProgress()
  const updateGoal = useUpdateReadingGoal()
  const createReadingSession = useCreateReadingSession()
  const removeTrackedBook = useRemoveTrackedBook()

  // Unified book registry derived from multiple library namespaces.
  const allBooksById = useMemo(() => {
    const map = new Map<string, LibraryItem>()
    const register = (item: LibraryItem) => {
      const existing = map.get(item.bookId)
      if (!existing) {
        map.set(item.bookId, item)
        return
      }
      map.set(item.bookId, {
        ...existing,
        ...item,
        book: {
          ...existing.book,
          ...item.book,
        },
      })
    }

    favorites.forEach(register)
    wishlist.forEach(register)
    readingItems.forEach(register)
    myEbooks.forEach((item) =>
      register({
        id: item.id,
        bookId: item.bookId,
        book: item.book,
      }),
    )
    return map
  }, [favorites, myEbooks, readingItems, wishlist])

  const allBooks = Array.from(allBooksById.values())
  const favoriteBookIds = useMemo(() => new Set(favorites.map((item) => item.bookId)), [favorites])
  const ownedBookIds = useMemo(() => {
    const ids = new Set<string>(myEbooks.map((item) => item.bookId))
    getTaggedBookIds('owned').forEach((bookId) => ids.add(bookId))
    return ids
  }, [myEbooks])
  const activeStockAlertBookIds = useMemo(
    () => new Set(stockAlerts.filter((item) => item.isActive).map((item) => item.bookId)),
    [stockAlerts],
  )

  // URL-driven deep-linking for selected book and initial filter state.
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const querySelectedBookId = queryParams.get('selectedBookId') || queryParams.get('bookId') || queryParams.get('book')
  const queryFilter = queryParams.get('filter')

  // Filtered collections and supporting dashboard data.
  const filteredBooks = useMemo(() => {
    if (activeFilter.type === 'status') {
      if (activeFilter.value === 'ALL') return allBooks
      return readingItems.filter((item) => item.status === activeFilter.value)
    }
    if (activeFilter.type === 'collection') {
      const targetIds = activeFilter.value === 'FAVORITES' ? favoriteBookIds : ownedBookIds
      return allBooks.filter((item) => targetIds.has(item.bookId))
    }
    const selectedList = customLists.find((list) => list.name === activeFilter.value)
    if (!selectedList) return []
    return allBooks.filter((item) => selectedList.bookIds.includes(item.bookId))
  }, [activeFilter, allBooks, customLists, favoriteBookIds, ownedBookIds, readingItems])

  const recentActivity = useMemo(() => {
    return [...readingItems]
      .filter((item) => item.book?.title)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4)
  }, [readingItems])

  const entitledEbooks = useMemo(() => myEbooks.filter((item) => item.book?.title), [myEbooks])
  const counts = {
    ALL: allBooks.length,
    TO_READ: readingItems.filter((item) => item.status === 'TO_READ').length,
    READING: readingItems.filter((item) => item.status === 'READING').length,
    FINISHED: readingItems.filter((item) => item.status === 'FINISHED').length,
  }
  const collectionCounts: Record<LibraryCollectionFilter, number> = {
    FAVORITES: allBooks.filter((item) => favoriteBookIds.has(item.bookId)).length,
    OWNED: allBooks.filter((item) => ownedBookIds.has(item.bookId)).length,
  }

  // Sync custom local-storage lists and detail panel state.
  useEffect(() => {
    const refresh = () => setCustomLists(getLibraryLists())
    refresh()
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  useEffect(() => {
    if (!filteredBooks.length) {
      setSelectedBookId(null)
      setIsDetailPanelOpen(false)
      setIsBookCardFlipped(false)
      return
    }
    if (selectedBookId && !filteredBooks.some((item) => item.bookId === selectedBookId)) {
      setSelectedBookId(null)
      setIsDetailPanelOpen(false)
      setIsBookCardFlipped(false)
    }
  }, [filteredBooks, selectedBookId])

  const selectedPreview = selectedBookId ? allBooksById.get(selectedBookId) : undefined
  const selectedReadingItem = readingItems.find((item) => item.bookId === selectedBookId)
  const isLoading = favoritesLoading || wishlistLoading || readingLoading || ebooksLoading
  const isPendingAction =
    trackBook.isPending ||
    updateStatus.isPending ||
    updateProgress.isPending ||
    updateGoal.isPending ||
    createReadingSession.isPending ||
    removeTrackedBook.isPending

  useEffect(() => {
    if (!selectedReadingItem) {
      setCurrentPageInput('0')
      setTotalPagesInput('')
      setGoalInput('')
      return
    }
    setCurrentPageInput(String(selectedReadingItem.currentPage))
    setTotalPagesInput(selectedReadingItem.totalPages ? String(selectedReadingItem.totalPages) : '')
    setGoalInput(selectedReadingItem.dailyGoalPages ? String(selectedReadingItem.dailyGoalPages) : '')
  }, [selectedReadingItem])

  useEffect(() => {
    if (!isDetailPanelOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isDetailPanelOpen])

  const showMessage = (message: string) => {
    setFeedback(message)
    window.setTimeout(() => setFeedback(''), 2200)
  }

  const ensureTracked = async (bookId: string, status: ReadingStatus) => {
    const existing = readingItems.find((item) => item.bookId === bookId)
    if (existing) return existing
    return trackBook.mutateAsync({ bookId, status })
  }

  // Detail desk actions.
  const handleStatusUpdate = async (status: ReadingStatus) => {
    if (!selectedBookId) return
    try {
      const existing = readingItems.find((item) => item.bookId === selectedBookId)
      if (existing) {
        await updateStatus.mutateAsync({ bookId: selectedBookId, status })
      } else {
        await trackBook.mutateAsync({ bookId: selectedBookId, status })
      }
      showMessage(`Moved to ${STATUS_LABEL[status]}.`)
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const handleSaveDetails = async () => {
    if (!selectedBookId) return
    const currentPage = Number(currentPageInput)
    const totalPages = totalPagesInput.trim() ? Number(totalPagesInput) : undefined
    const dailyGoal = goalInput.trim() ? Number(goalInput) : undefined

    if (Number.isNaN(currentPage) || currentPage < 0) {
      showMessage('Current page must be a valid number.')
      return
    }
    if (totalPages !== undefined && (Number.isNaN(totalPages) || totalPages < 1)) {
      showMessage('Total pages must be a valid number greater than 0.')
      return
    }
    if (dailyGoal !== undefined && (Number.isNaN(dailyGoal) || dailyGoal < 1)) {
      showMessage('Daily goal must be at least 1.')
      return
    }

    try {
      const previousPage = selectedReadingItem?.currentPage ?? 0
      const pagesDelta = Math.max(0, currentPage - previousPage)
      await ensureTracked(selectedBookId, 'TO_READ')
      await updateProgress.mutateAsync({ bookId: selectedBookId, currentPage, totalPages })
      await updateGoal.mutateAsync({ bookId: selectedBookId, dailyGoalPages: dailyGoal })
      if (pagesDelta > 0) {
        await createReadingSession.mutateAsync({
          bookId: selectedBookId,
          pagesRead: pagesDelta,
          sessionDate: new Date().toISOString(),
          notes: 'Auto-logged from Library progress update',
        })
        showMessage(`Reading details saved. Logged ${pagesDelta} pages as a session.`)
        return
      }
      showMessage('Reading details saved.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const handleRemove = async () => {
    if (!selectedBookId) return
    try {
      await removeTrackedBook.mutateAsync(selectedBookId)
      showMessage('Removed from tracking.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const handleReadEbook = async () => {
    if (!selectedBookId) return
    setIsOpeningEbook(true)
    try {
      await api.get(`/reading/ebook/${selectedBookId}/open`)
      navigate(`/my-books/${selectedBookId}/read`)
    } catch (error) {
      setFeedback(getErrorMessage(error))
    } finally {
      setIsOpeningEbook(false)
    }
  }

  const handleStockAlertToggle = async () => {
    if (!selectedBookId) return
    try {
      if (activeStockAlertBookIds.has(selectedBookId)) {
        await unsubscribeFromStockAlert.mutateAsync({ bookId: selectedBookId })
        showMessage('Back-in-stock alert removed.')
      } else {
        await subscribeToStockAlert.mutateAsync({ bookId: selectedBookId })
        showMessage('Back-in-stock alert enabled.')
      }
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const openDetailPanel = (bookId: string) => {
    setSelectedBookId(bookId)
    setIsDetailPanelOpen(true)
    setIsBookCardFlipped(false)
    setIsFilterPanelOpen(false)
  }

  const closeDetailPanel = () => {
    setIsDetailPanelOpen(false)
    setIsBookCardFlipped(false)
    if (querySelectedBookId) {
      const nextParams = new URLSearchParams(location.search)
      nextParams.delete('selectedBookId')
      nextParams.delete('bookId')
      nextParams.delete('book')
      const nextSearch = nextParams.toString()
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : '',
        },
        { replace: true },
      )
    }
  }

  useEffect(() => {
    if (!queryFilter) return
    if (!isLibraryStatusFilter(queryFilter)) return
    setActiveFilter((prev) => {
      if (prev.type === 'status' && prev.value === queryFilter) return prev
      return { type: 'status', value: queryFilter }
    })
  }, [queryFilter])

  useEffect(() => {
    if (!querySelectedBookId || isLoading) return
    if (!allBooksById.has(querySelectedBookId)) return
    if (isDetailPanelOpen && selectedBookId === querySelectedBookId) return
    setSelectedBookId(querySelectedBookId)
    setIsDetailPanelOpen(true)
    setIsBookCardFlipped(false)
    setIsFilterPanelOpen(false)
  }, [allBooksById, isDetailPanelOpen, isLoading, querySelectedBookId, selectedBookId])

  const activeFilterLabel = activeFilter.type === 'status'
    ? FILTER_META[activeFilter.value].label
    : activeFilter.type === 'collection'
      ? COLLECTION_META[activeFilter.value].label
      : activeFilter.value

  const shelfRows = useMemo<ShelfRow[]>(() => {
    if (activeFilter.type === 'status' && activeFilter.value === 'ALL') {
      const reading = readingItems.filter((item) => item.status === 'READING')
      const toRead = readingItems.filter((item) => item.status === 'TO_READ')
      const finished = readingItems.filter((item) => item.status === 'FINISHED')
      return [
        { key: 'READING', title: 'Currently Reading', books: reading },
        { key: 'TO_READ', title: 'Next Up', books: toRead },
        { key: 'FINISHED', title: 'Finished', books: finished },
      ].filter((row) => row.books.length > 0)
    }

    return [
      {
        key: 'ACTIVE',
        title: activeFilterLabel,
        books: filteredBooks,
      },
    ]
  }, [activeFilter, activeFilterLabel, filteredBooks, readingItems])

  const stockAlertPreviews: StockAlertItemPreview[] = stockAlerts
  const deskState = { currentPageInput, totalPagesInput, goalInput }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#101012] dark:text-[#f5f5f1]">
      <div className="pointer-events-none fixed inset-0 hidden opacity-80 dark:block">
        <div className="absolute -left-24 top-14 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(255,194,97,0.12),_rgba(0,0,0,0))]" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(91,59,182,0.2),_rgba(0,0,0,0))]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-32 pt-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4 dark:border-white/10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Reading Workspace</p>
            <h1 className="mt-2 font-library-display text-4xl text-slate-900 dark:text-[#f5f5f1]">Library</h1>
          </div>
          <Link
            to="/books"
            className="tone-hover-gold inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 transition hover:text-slate-900 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white"
            aria-label="Browse books"
          >
            <Search className="h-5 w-5" />
          </Link>
        </header>

        <LibraryAlerts
          entitledEbooks={entitledEbooks}
          feedback={feedback}
          onOpenDetailPanel={(bookId) => {
            setActiveFilter({ type: 'status', value: 'ALL' })
            openDetailPanel(bookId)
          }}
          stockAlerts={stockAlertPreviews}
        />

        <section className="rounded-3xl border border-slate-200 bg-white p-4 backdrop-blur-md dark:border-white/10 dark:bg-[#17171a]/85 lg:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{activeFilterLabel}</h2>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{filteredBooks.length} books</p>
            </div>
            <button
              type="button"
              onClick={() => setIsFilterPanelOpen((prev) => !prev)}
              className="tone-hover-gold inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition hover:text-slate-900 dark:border-white/15 dark:bg-white/[0.03] dark:text-slate-200 dark:hover:text-white"
            >
              <ListFilter className="h-4 w-4" />
              Filters
            </button>
          </div>

          <LibraryFilterPanel
            activeFilter={activeFilter}
            allBooks={allBooks}
            collectionCounts={collectionCounts}
            collectionMeta={COLLECTION_META}
            counts={counts}
            customLists={customLists}
            isOpen={isFilterPanelOpen}
            onClose={() => setIsFilterPanelOpen(false)}
            onSelectFilter={setActiveFilter}
            statusMeta={FILTER_META}
          />

          <LibraryShelfView
            filteredBooks={filteredBooks}
            isLoading={isLoading}
            onOpenDetailPanel={openDetailPanel}
            recentActivity={recentActivity}
            selectedBookId={selectedBookId}
            shelfRows={shelfRows}
          />
        </section>
      </div>

      {typeof document !== 'undefined' && isDetailPanelOpen && createPortal(
        <LibraryDetailPanel
          activeStockAlertBookIds={activeStockAlertBookIds}
          closeDetailPanel={closeDetailPanel}
          deskActions={{
            onReadEbook: () => void handleReadEbook(),
            onRemove: () => void handleRemove(),
            onSaveDetails: () => void handleSaveDetails(),
            onStatusUpdate: (status) => void handleStatusUpdate(status),
            onStockAlertToggle: () => void handleStockAlertToggle(),
          }}
          deskMutations={{
            isOpeningEbook,
            isPendingAction,
            isStockAlertPending: subscribeToStockAlert.isPending || unsubscribeFromStockAlert.isPending,
          }}
          deskState={deskState}
          isBookCardFlipped={isBookCardFlipped}
          onBookCardFlippedChange={setIsBookCardFlipped}
          onDeskStateChange={(next) => {
            setCurrentPageInput(next.currentPageInput)
            setTotalPagesInput(next.totalPagesInput)
            setGoalInput(next.goalInput)
          }}
          selectedBookId={selectedBookId}
          selectedPreview={selectedPreview}
          selectedReadingItem={selectedReadingItem}
          setSelectedStatus={(status) => void handleStatusUpdate(status)}
          statusLabel={STATUS_LABEL}
        />,
        document.body,
      )}
    </div>
  )
}

export default LibraryPage
