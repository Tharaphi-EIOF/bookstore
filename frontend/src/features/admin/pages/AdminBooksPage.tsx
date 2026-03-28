import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import {
  useBooks,
  useCreateBook,
  useUpdateBook,
  useDeleteBook,
  usePermanentDeleteBook,
  useEmptyBooksBin,
  useRestoreBook,
} from '@/services/books'
import { Link, useSearchParams } from 'react-router-dom'
import { type Book } from '@/lib/schemas'
import Skeleton from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import { BOOK_CATEGORIES, BOOK_GENRES } from '@/constants/bookTaxonomy'
import AdminNotice from '@/components/admin/AdminNotice'
import AdminPageIntro from '@/components/admin/AdminPageIntro'
import AdminFilterCard from '@/components/admin/AdminFilterCard'
import BookFormModal from '@/components/admin/BookFormModal'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'
import BulkStockUpdateModal from '@/components/admin/BulkStockUpdateModal'
import AdminBooksBulkActions from '@/features/admin/books/components/AdminBooksBulkActions'
import AdminBooksFilters from '@/features/admin/books/components/AdminBooksFilters'
import AdminBooksSummaryStrip from '@/features/admin/books/components/AdminBooksSummaryStrip'
import AdminBooksTable from '@/features/admin/books/components/AdminBooksTable'
import { getErrorMessage } from '@/lib/api'
import { useTimedMessage } from '@/hooks/useTimedMessage'

const ITEMS_PER_PAGE = 10

type AdminBooksPageProps = {
  initialView?: 'active' | 'trash' | 'all'
  lockView?: boolean
  headerTitle?: string
}

const AdminBooksPage = ({
  initialView = 'active',
  lockView = false,
  headerTitle = 'Books Management',
}: AdminBooksPageProps) => {
  const [searchParams, setSearchParams] = useSearchParams()
  // Page-level filters, selection, view, and modal state for book operations.
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('q') ?? searchParams.get('book') ?? searchParams.get('author') ?? '',
  )
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN' | 'LOW' | 'OUT'>(
    'ALL'
  )
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [genreFilter, setGenreFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const itemsPerPage = ITEMS_PER_PAGE

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [deletingBook, setDeletingBook] = useState<Book | null>(null)
  const [permanentDeletingBook, setPermanentDeletingBook] = useState<Book | null>(null)
  const [isEmptyBinOpen, setIsEmptyBinOpen] = useState(false)
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set())
  const [isBulkStockModalOpen, setIsBulkStockModalOpen] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [binAnimationKey, setBinAnimationKey] = useState(0)
  const [sortKey, setSortKey] = useState<'title' | 'author' | 'categories' | 'isbn' | 'price' | 'stock' | 'createdAt'>('title')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [recentBookId, setRecentBookId] = useState<string | null>(null)
  const { message: actionMessage, showMessage: showActionMessage } = useTimedMessage(3400)
  const [viewMode, setViewMode] = useState<'active' | 'trash' | 'all'>(initialView)
  const [visibleColumns, setVisibleColumns] = useState({
    title: true,
    author: true,
    categories: true,
    isbn: true,
    price: true,
    stock: true,
    actions: true,
  })

  const createBook = useCreateBook()
  const updateBook = useUpdateBook()
  const deleteBook = useDeleteBook()
  const permanentDeleteBook = usePermanentDeleteBook()
  const emptyBin = useEmptyBooksBin()
  const restoreBook = useRestoreBook()

  // View-mode flags and query wiring for active, trash, and combined listings.
  const showViewSwitcher = !lockView
  const showAddButton = !(lockView && initialView === 'trash')
  const showBinShortcut = !lockView && initialView === 'active'

  const effectiveView = lockView ? initialView : viewMode
  const trimmedSearchTerm = searchTerm.trim()
  const { data: booksData, isLoading } = useBooks({
    limit: 100,
    status: effectiveView === 'trash' ? 'trashed' : effectiveView === 'all' ? 'all' : 'active',
    q: trimmedSearchTerm || undefined,
  })
  const { data: binCountData } = useBooks(
    { page: 1, limit: 1, status: 'trashed' },
    { enabled: showViewSwitcher }
  )

  useEffect(() => {
    if (!lockView) return
    setViewMode(initialView)
  }, [initialView, lockView])

  useEffect(() => {
    const next = new URLSearchParams()
    const trimmed = searchTerm.trim()
    if (trimmed) next.set('q', trimmed)
    setSearchParams(next, { replace: true })
  }, [searchTerm, setSearchParams])

  // Derived book collections for the current view, filters, sorting, and pagination.
  const books = booksData?.books || []
  const visibleBooks =
    effectiveView === 'trash'
      ? books.filter((book) => book.deletedAt)
      : effectiveView === 'active'
        ? books.filter((book) => !book.deletedAt)
        : books
  const binCount = showViewSwitcher ? (binCountData?.total ?? 0) : (booksData?.total ?? 0)
  const isTrashView = effectiveView === 'trash'
  const isActiveView = effectiveView === 'active'
  const selectedBooksArray = books.filter((book) => selectedBooks.has(book.id))
  const selectedActiveBooks = selectedBooksArray.filter((book) => !book.deletedAt)
  const selectedTrashedBooks = selectedBooksArray.filter((book) => book.deletedAt)
  const inStockCount = visibleBooks.filter((book) => book.stock > 10).length
  const lowStockCount = visibleBooks.filter((book) => book.stock > 0 && book.stock <= 10).length
  const outOfStockCount = visibleBooks.filter((book) => book.stock === 0).length

  // 🔍 Filter logic
  const filteredBooks = visibleBooks.filter(book => {
    const matchesSearch =
      !trimmedSearchTerm ||
      book.title.toLowerCase().includes(trimmedSearchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(trimmedSearchTerm.toLowerCase()) ||
      book.isbn.toLowerCase().includes(trimmedSearchTerm.toLowerCase())

    let matchesStock = true
    if (stockFilter === 'IN') matchesStock = book.stock > 10
    if (stockFilter === 'LOW') matchesStock = book.stock > 0 && book.stock <= 10
    if (stockFilter === 'OUT') matchesStock = book.stock === 0

    const matchesCategory =
      categoryFilter === 'ALL' || (book.categories || []).includes(categoryFilter)
    const matchesGenre =
      genreFilter === 'ALL' || (book.genres || []).includes(genreFilter)

    return matchesSearch && matchesStock && matchesCategory && matchesGenre
  })

  const allCategories = [...BOOK_CATEGORIES]
  const allGenres = Array.from(
    new Set([
      ...BOOK_GENRES,
      ...books.flatMap((book) => book.genres || []),
    ]),
  ).sort((a, b) => a.localeCompare(b))

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    switch (sortKey) {
      case 'price':
        return (a.price - b.price) * dir
      case 'stock':
        return (a.stock - b.stock) * dir
      case 'categories':
        return (a.categories || []).join(', ').localeCompare((b.categories || []).join(', ')) * dir
      case 'createdAt':
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
      case 'author':
        return a.author.localeCompare(b.author) * dir
      case 'isbn':
        return a.isbn.localeCompare(b.isbn) * dir
      default:
        return a.title.localeCompare(b.title) * dir
    }
  })

  // 📄 Pagination logic
  const totalPages = Math.ceil(sortedBooks.length / itemsPerPage)
  const start = (page - 1) * itemsPerPage
  const end = start + itemsPerPage
  const paginatedBooks = sortedBooks.slice(start, end)

  // Reset page when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setPage(1)
  }

  const handleStockChange = (value: 'ALL' | 'IN' | 'LOW' | 'OUT') => {
    setStockFilter(value)
    setPage(1)
  }

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value)
    setPage(1)
  }

  const handleGenreChange = (value: string) => {
    setGenreFilter(value)
    setPage(1)
  }

  // CRUD handlers
  const handleAddBook = async (data: any) => {
    try {
      await createBook.mutateAsync(data)
      setIsAddModalOpen(false)
      showActionMessage('Book created.')
    } catch (err) {
      showActionMessage(getErrorMessage(err))
    }
  }

  const handleEditBook = async (data: any) => {
    if (!editingBook) return
    try {
      const editedId = editingBook.id
      await updateBook.mutateAsync({ id: editingBook.id, data })
      setRecentBookId(editedId)
      setEditingBook(null)
      showActionMessage('Book updated.')
    } catch (err) {
      showActionMessage(getErrorMessage(err))
    }
  }

  const handleDeleteBook = async () => {
    if (!deletingBook) return
    try {
      await deleteBook.mutateAsync(deletingBook.id)
      setDeletingBook(null)
      showActionMessage('Book removed and sent to bin.')
      setBinAnimationKey((prev) => prev + 1)
    } catch (err) {
      showActionMessage(getErrorMessage(err))
    }
  }

  const handlePermanentDeleteBook = async () => {
    if (!permanentDeletingBook) return
    try {
      await permanentDeleteBook.mutateAsync(permanentDeletingBook.id)
      setPermanentDeletingBook(null)
      showActionMessage('Book permanently deleted.')
    } catch (err) {
      showActionMessage(getErrorMessage(err))
    }
  }

  const handleEmptyBin = async () => {
    try {
      const result = await emptyBin.mutateAsync()
      setIsEmptyBinOpen(false)
      showActionMessage(`Bin emptied. ${result.deleted} book${result.deleted === 1 ? '' : 's'} deleted.`)
    } catch (err) {
      showActionMessage(getErrorMessage(err))
    }
  }

  const handleRestoreBook = async (book: Book) => {
    try {
      await restoreBook.mutateAsync(book.id)
      showActionMessage('Book restored.')
    } catch (err) {
      showActionMessage(getErrorMessage(err))
    }
  }

  // Bulk operations
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBooks(new Set(paginatedBooks.map(b => b.id)))
    } else {
      setSelectedBooks(new Set())
    }
  }

  const handleSelectBook = (bookId: string, checked: boolean) => {
    const newSelected = new Set(selectedBooks)
    if (checked) {
      newSelected.add(bookId)
    } else {
      newSelected.delete(bookId)
    }
    setSelectedBooks(newSelected)
  }

  const handleBulkDelete = async () => {
    if (selectedActiveBooks.length === 0) return
    setIsBulkDeleting(true)
    try {
      const results = await Promise.allSettled(
        selectedActiveBooks.map((book) => deleteBook.mutateAsync(book.id)),
      )
      const failed = results.filter((result) => result.status === 'rejected')
      const succeeded = results.length - failed.length
      setSelectedBooks(new Set())
      if (failed.length > 0) {
        const firstError = failed[0] as PromiseRejectedResult
        showActionMessage(
          `${succeeded} deleted, ${failed.length} failed: ${getErrorMessage(firstError.reason)}`,
        )
        return
      }
      showActionMessage(`${succeeded} books moved to bin.`)
      if (succeeded > 0) {
        setBinAnimationKey((prev) => prev + 1)
      }
    } catch (err) {
      showActionMessage(getErrorMessage(err))
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleBulkRestore = async () => {
    if (selectedTrashedBooks.length === 0) return
    setIsBulkDeleting(true)
    try {
      const results = await Promise.allSettled(
        selectedTrashedBooks.map((book) => restoreBook.mutateAsync(book.id)),
      )
      const failed = results.filter((result) => result.status === 'rejected')
      const succeeded = results.length - failed.length
      setSelectedBooks(new Set())
      if (failed.length > 0) {
        const firstError = failed[0] as PromiseRejectedResult
        showActionMessage(
          `${succeeded} restored, ${failed.length} failed: ${getErrorMessage(firstError.reason)}`,
        )
        return
      }
      showActionMessage(`${succeeded} books restored.`)
    } catch (err) {
      showActionMessage(getErrorMessage(err))
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleBulkPermanentDelete = async () => {
    if (selectedTrashedBooks.length === 0) return
    const confirmed = window.confirm(
      `Permanently delete ${selectedTrashedBooks.length} book${selectedTrashedBooks.length > 1 ? 's' : ''}? This cannot be undone.`,
    )
    if (!confirmed) return
    setIsBulkDeleting(true)
    try {
      const results = await Promise.allSettled(
        selectedTrashedBooks.map((book) => permanentDeleteBook.mutateAsync(book.id)),
      )
      const failed = results.filter((result) => result.status === 'rejected')
      const succeeded = results.length - failed.length
      setSelectedBooks(new Set())
      if (failed.length > 0) {
        const firstError = failed[0] as PromiseRejectedResult
        showActionMessage(
          `${succeeded} deleted, ${failed.length} failed: ${getErrorMessage(firstError.reason)}`,
        )
        return
      }
      showActionMessage(`${succeeded} books permanently deleted.`)
    } catch (err) {
      showActionMessage(getErrorMessage(err))
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleBulkStockUpdate = async (stockChange: number) => {
    if (selectedActiveBooks.length === 0) return
    try {
      await Promise.all(
        selectedActiveBooks.map(book =>
          updateBook.mutateAsync({
            id: book.id,
            data: { stock: Math.max(0, book.stock + stockChange) },
          })
        )
      )
      setSelectedBooks(new Set())
      setIsBulkStockModalOpen(false)
      showActionMessage('Stock updated for selected books.')
    } catch (err) {
      showActionMessage(getErrorMessage(err))
    }
  }

  useEffect(() => {
    if (!recentBookId) return
    const timeout = setTimeout(() => setRecentBookId(null), 2000)
    return () => clearTimeout(timeout)
  }, [recentBookId])

  useEffect(() => {
    setPage(1)
    setSelectedBooks(new Set())
  }, [viewMode])

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const rowPad = 'py-3'
  const columnOptions: Array<{ key: keyof typeof visibleColumns; label: string }> = [
    { key: 'title', label: 'Title' },
    { key: 'author', label: 'Author' },
    { key: 'categories', label: 'Categories' },
    { key: 'isbn', label: 'ISBN' },
    { key: 'price', label: 'Price' },
    { key: 'stock', label: 'Stock' },
    { key: 'actions', label: 'Actions' },
  ]

  // CSV export data
  const csvData = filteredBooks.map(book => ({
    Title: book.title,
    Author: book.author,
    ISBN: book.isbn,
    Price: book.price,
    Stock: book.stock,
    Categories: book.categories?.join(', ') || '',
    Description: book.description || '',
  }))

  const handleExportCsv = () => {
    if (csvData.length === 0) return

    const headers = Object.keys(csvData[0])
    const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const rows = csvData.map((row) => headers.map((header) => escapeCsv(row[header as keyof typeof row])).join(','))
    const csv = [headers.join(','), ...rows].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `books-export-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="p-8 dark:text-slate-100 space-y-6">
        <Skeleton variant="logo" className="h-10 w-10" />
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_200px_auto]">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="bg-white rounded-lg border p-4 space-y-3 dark:bg-slate-900 dark:border-slate-800">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 dark:text-slate-100">
      {/* Intro, messages, filters, bulk actions, table, and CRUD modals. */}
      <AdminPageIntro
        title={headerTitle}
        className="mb-8 flex-col gap-5 md:flex-row md:items-start"
        actions={(
          <>
          {showBinShortcut && (
            <Link
              to="/admin/books/bin"
              className="group relative inline-flex h-12 w-12 items-center justify-center rounded-[20px] border border-white/70 bg-white/80 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.35)] backdrop-blur transition hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-950/70"
              aria-label="Open books bin"
              title="Open books bin"
            >
              <div className="relative flex h-6 w-6 items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6 text-slate-500/90 dark:text-slate-300/90"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.g
                    key={`lid-${binAnimationKey}`}
                    initial={{ rotate: 0, y: 0 }}
                    animate={{ rotate: [0, -18, 0], y: [0, -1.5, 0] }}
                    transition={{ duration: 0.45, ease: 'easeInOut' }}
                    style={{ transformOrigin: '12px 6px' }}
                  >
                    <path d="M4 7h16" />
                    <path d="M9 4h6" />
                  </motion.g>
                  <path d="M6 7l1 13h10l1-13" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
                <motion.div
                  key={`drop-${binAnimationKey}`}
                  initial={{ opacity: 0, y: -10, scale: 0.8 }}
                  animate={{ opacity: [0, 1, 0], y: [-10, 2, 10], scale: [0.8, 1, 0.6] }}
                  transition={{ duration: 0.55, ease: 'easeInOut' }}
                  className="absolute -top-2 h-2 w-2 rounded-full bg-amber-400/90"
                />
              </div>
            </Link>
          )}
          {isTrashView && (
            <button
              type="button"
              onClick={() => setIsEmptyBinOpen(true)}
              disabled={binCount === 0}
              className="inline-flex h-12 items-center justify-center rounded-[20px] border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
            >
              Empty Bin
            </button>
          )}
          {showAddButton && (
            <Button onClick={() => setIsAddModalOpen(true)} className="h-12 rounded-[20px] px-5 text-sm font-semibold">
              <Plus className="h-4 w-4" />
              Add Book
            </Button>
          )}
          </>
        )}
      />

      {actionMessage && (
        <AdminNotice className="mb-4">
          {actionMessage}
        </AdminNotice>
      )}

      <AdminBooksSummaryStrip
        totalBooks={visibleBooks.length}
        inStockBooks={inStockCount}
        lowStockBooks={lowStockCount}
        outOfStockBooks={outOfStockCount}
      />

      <AdminFilterCard className="relative z-30 mb-6 p-4">
        <AdminBooksFilters
          searchTerm={searchTerm}
          stockFilter={stockFilter}
          categoryFilter={categoryFilter}
          genreFilter={genreFilter}
          allCategories={allCategories}
          allGenres={allGenres}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          columnOptions={columnOptions}
          csvCount={csvData.length}
          onSearchChange={handleSearchChange}
          onStockChange={handleStockChange}
          onCategoryChange={handleCategoryChange}
          onGenreChange={handleGenreChange}
          onExportCsv={handleExportCsv}
        />
      </AdminFilterCard>

      <AdminBooksBulkActions
        selectedCount={selectedBooks.size}
        selectedActiveCount={selectedActiveBooks.length}
        selectedTrashedCount={selectedTrashedBooks.length}
        isBulkDeleting={isBulkDeleting}
        onOpenBulkStockModal={() => setIsBulkStockModalOpen(true)}
        onBulkDelete={handleBulkDelete}
        onBulkRestore={handleBulkRestore}
        onBulkPermanentDelete={handleBulkPermanentDelete}
        onClearSelection={() => setSelectedBooks(new Set())}
      />

      <AdminBooksTable
        paginatedBooks={paginatedBooks}
        selectedBooks={selectedBooks}
        recentBookId={recentBookId}
        isActiveView={isActiveView}
        visibleColumns={visibleColumns}
        rowPad={rowPad}
        start={start}
        sortKey={sortKey}
        sortDir={sortDir}
        page={page}
        totalPages={totalPages}
        filteredCount={filteredBooks.length}
        onSelectAll={handleSelectAll}
        onSelectBook={handleSelectBook}
        onToggleSort={toggleSort}
        onEditBook={setEditingBook}
        onRestoreBook={handleRestoreBook}
        onDeleteBook={setDeletingBook}
        onPermanentDeleteBook={setPermanentDeletingBook}
        onPreviousPage={() => setPage((p) => p - 1)}
        onNextPage={() => setPage((p) => p + 1)}
      />

      {/* Modals */}
      <BookFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddBook}
        isLoading={createBook.isPending}
      />

      <BookFormModal
        isOpen={!!editingBook}
        onClose={() => setEditingBook(null)}
        onSubmit={handleEditBook}
        book={editingBook}
        isLoading={updateBook.isPending}
      />

      <DeleteConfirmModal
        isOpen={!!deletingBook}
        onClose={() => setDeletingBook(null)}
        onConfirm={handleDeleteBook}
        title="Remove Book"
        message={`Remove "${deletingBook?.title}"? It will be moved to the bin and hidden from users.`}
        confirmLabel="Remove"
        confirmClassName="bg-amber-600 hover:bg-amber-700"
        isLoading={deleteBook.isPending}
      />

      <DeleteConfirmModal
        isOpen={!!permanentDeletingBook}
        onClose={() => setPermanentDeletingBook(null)}
        onConfirm={handlePermanentDeleteBook}
        title="Delete Forever"
        message={`Permanently delete "${permanentDeletingBook?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmClassName="bg-red-600 hover:bg-red-700"
        isLoading={permanentDeleteBook.isPending}
      />

      <DeleteConfirmModal
        isOpen={isEmptyBinOpen}
        onClose={() => setIsEmptyBinOpen(false)}
        onConfirm={handleEmptyBin}
        title="Empty Bin"
        message="Permanently delete all removable books in the bin? This cannot be undone."
        confirmLabel="Delete All"
        confirmClassName="bg-red-600 hover:bg-red-700"
        isLoading={emptyBin.isPending}
      />

      <BulkStockUpdateModal
        isOpen={isBulkStockModalOpen}
        onClose={() => setIsBulkStockModalOpen(false)}
        onSubmit={handleBulkStockUpdate}
        selectedCount={selectedBooks.size}
      />
    </div>
  )
}

export default AdminBooksPage
