import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Check, CircleCheck, Eye, X } from 'lucide-react'
import { getErrorMessage } from '@/lib/api'
import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/store/auth.store'
import { useBook, useBooks } from '@/services/books'
import {
  type PurchaseRequest,
  useBookStockPresence,
  useCompletePurchaseRequest,
  useCreatePurchaseRequest,
  usePurchaseRequests,
  useReviewPurchaseRequest,
  useWarehouseStocks,
  useWarehouses,
  type PurchaseRequestStatus,
} from '@/features/admin/services/warehouses'
import { useTimedMessage } from '@/hooks/useTimedMessage'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'
import AdminIconActionButton from '@/components/admin/AdminIconActionButton'

const statusOptions: PurchaseRequestStatus[] = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COMPLETED']

type BatchMode = 'LOW_OR_OUT' | 'OUT_ONLY' | 'ALL' | 'NEW_BOOKS'

type BatchItem = {
  bookId: string
  title: string
  author: string
  isbn: string
  currentStock: number
  threshold: number
  quantity: number
  estimatedCost?: number
}

type BatchCandidate = {
  id: string
  bookId: string
  stock: number
  lowStockThreshold: number
  warehousePresenceCount: number
  book: {
    id: string
    title: string
    author: string
    isbn: string
  }
}

const getStatusTone = (status: PurchaseRequestStatus) => {
  switch (status) {
    case 'COMPLETED':
      return 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
    case 'APPROVED':
      return 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200'
    case 'PENDING_APPROVAL':
      return 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200'
    case 'REJECTED':
      return 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200'
    default:
      return 'border-slate-300 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
  }
}

const formatCurrency = (value?: number | null) => {
  if (value === undefined || value === null) return 'Not set'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value))
}

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Not available'
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

const AdminPurchaseRequestsPage = () => {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const canCreate = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || hasPermission(user?.permissions, 'warehouse.purchase_request.create')
  const canApprove = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || hasPermission(user?.permissions, 'finance.purchase_request.approve')
  const canReject = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || hasPermission(user?.permissions, 'finance.purchase_request.reject')
  const canComplete = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || hasPermission(user?.permissions, 'warehouse.purchase_request.complete')

  const [status, setStatus] = useState<PurchaseRequestStatus | ''>('')
  const [warehouseId, setWarehouseId] = useState('')
  const { message, showMessage } = useTimedMessage(3200)

  const [builderWarehouseId, setBuilderWarehouseId] = useState('')
  const [batchMode, setBatchMode] = useState<BatchMode>('LOW_OR_OUT')
  const [batchSearch, setBatchSearch] = useState('')
  const [batchReviewNote, setBatchReviewNote] = useState('')
  const [batchSubmitForApproval, setBatchSubmitForApproval] = useState(true)
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])
  const [isCandidateListOpen, setIsCandidateListOpen] = useState(false)
  const [prefillDone, setPrefillDone] = useState(false)
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null)
  const [approvedQuantity, setApprovedQuantity] = useState('')
  const [approvedCost, setApprovedCost] = useState('')
  const [reviewNote, setReviewNote] = useState('')

  const { data: warehouses = [] } = useWarehouses()
  const { data: bookStockPresence } = useBookStockPresence()
  const { data: builderStocks = [] } = useWarehouseStocks(builderWarehouseId || undefined)
  const { data: booksData } = useBooks({
    page: 1,
    limit: 100,
    sortBy: 'title',
    sortOrder: 'asc',
    status: 'active',
  })
  const { data: requests = [], error } = usePurchaseRequests({
    status: status || undefined,
    warehouseId: warehouseId || undefined,
  })

  const createMutation = useCreatePurchaseRequest()
  const reviewMutation = useReviewPurchaseRequest()
  const completeMutation = useCompletePurchaseRequest()

  const sorted = useMemo(() => requests, [requests])
  const prefillParams = useMemo(() => {
    const query = new URLSearchParams(location.search)
    return {
      warehouseId: query.get('warehouseId') || '',
      bookId: query.get('bookId') || '',
    }
  }, [location.search])
  const { data: prefillBook } = useBook(prefillParams.bookId)
  const hasRestockPrefill = Boolean(prefillParams.bookId || prefillParams.warehouseId)

  const warehouseStockByBookId = useMemo(
    () => new Map(builderStocks.map((row) => [row.bookId, row])),
    [builderStocks],
  )
  const bookPresenceByBookId = useMemo(
    () =>
      new Map((bookStockPresence?.byBook ?? []).map((row) => [row.bookId, row.warehouseCount])),
    [bookStockPresence?.byBook],
  )

  const candidateRows = useMemo<BatchCandidate[]>(() => {
    const books = booksData?.books ?? []
    return books.map((book) => {
      const stockRow = warehouseStockByBookId.get(book.id)
      const warehousePresenceCount = bookPresenceByBookId.get(book.id) ?? 0
      return {
        id: stockRow?.id ?? `${builderWarehouseId || 'warehouse'}-${book.id}`,
        bookId: book.id,
        stock: stockRow?.stock ?? 0,
        lowStockThreshold: stockRow?.lowStockThreshold ?? 5,
        warehousePresenceCount,
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          isbn: book.isbn,
        },
      }
    })
  }, [booksData?.books, warehouseStockByBookId, builderWarehouseId, bookPresenceByBookId])

  const candidates = useMemo(() => {
    const keyword = batchSearch.trim().toLowerCase()

    return candidateRows
      .filter((row) => {
        if (batchMode === 'OUT_ONLY') {
          return row.stock === 0
        }
        if (batchMode === 'NEW_BOOKS') {
          return row.warehousePresenceCount === 0
        }
        if (batchMode === 'LOW_OR_OUT') {
          return row.stock <= row.lowStockThreshold
        }
        return true
      })
      .filter((row) => {
        if (!keyword) return true
        return (
          row.book.title.toLowerCase().includes(keyword)
          || row.book.author.toLowerCase().includes(keyword)
          || row.book.isbn.toLowerCase().includes(keyword)
        )
      })
      .sort((a, b) => a.stock - b.stock)
  }, [candidateRows, batchMode, batchSearch])

  const addToBatch = (row: BatchCandidate) => {
    const defaultQty = Math.max(1, row.lowStockThreshold * 2 - row.stock)

    setBatchItems((prev) => {
      const exists = prev.some((item) => item.bookId === row.bookId)
      if (exists) return prev

      return [
        ...prev,
        {
          bookId: row.bookId,
          title: row.book.title,
          author: row.book.author,
          isbn: row.book.isbn,
          currentStock: row.stock,
          threshold: row.lowStockThreshold,
          quantity: defaultQty,
        },
      ]
    })
  }

  useEffect(() => {
    if (prefillDone) return
    if (!prefillParams.warehouseId) return
    setBuilderWarehouseId(prefillParams.warehouseId)
  }, [prefillDone, prefillParams.warehouseId])

  useEffect(() => {
    if (!hasRestockPrefill) return
    setIsBuilderOpen(true)
    setIsCandidateListOpen(true)
  }, [hasRestockPrefill])

  useEffect(() => {
    if (!prefillBook) return
    setBatchSearch((prev) => (prev.trim() ? prev : prefillBook.title))
  }, [prefillBook])

  useEffect(() => {
    if (prefillDone) return
    if (!prefillParams.bookId || !builderWarehouseId) return
    if (prefillParams.warehouseId && builderWarehouseId !== prefillParams.warehouseId) return
    if (!prefillBook) return
    const stockRow = warehouseStockByBookId.get(prefillBook.id)
    addToBatch({
      id: stockRow?.id ?? `${builderWarehouseId}-${prefillBook.id}`,
      bookId: prefillBook.id,
      stock: stockRow?.stock ?? 0,
      lowStockThreshold: stockRow?.lowStockThreshold ?? 5,
      warehousePresenceCount: bookPresenceByBookId.get(prefillBook.id) ?? 0,
      book: {
        id: prefillBook.id,
        title: prefillBook.title,
        author: prefillBook.author,
        isbn: prefillBook.isbn,
      },
    })
    setPrefillDone(true)
  }, [
    prefillDone,
    prefillParams.bookId,
    prefillParams.warehouseId,
    builderWarehouseId,
    prefillBook,
    warehouseStockByBookId,
  ])

  const updateBatchItem = (bookId: string, patch: Partial<BatchItem>) => {
    setBatchItems((prev) =>
      prev.map((item) => (item.bookId === bookId ? { ...item, ...patch } : item)),
    )
  }

  const removeBatchItem = (bookId: string) => {
    setBatchItems((prev) => prev.filter((item) => item.bookId !== bookId))
  }

  const openRequestReview = (request: PurchaseRequest) => {
    setSelectedRequest(request)
    setApprovedQuantity(String(request.approvedQuantity ?? request.quantity))
    setApprovedCost(
      request.approvedCost !== null && request.approvedCost !== undefined
        ? String(request.approvedCost)
        : request.estimatedCost !== null && request.estimatedCost !== undefined
          ? String(request.estimatedCost)
          : '',
    )
    setReviewNote(request.reviewNote ?? '')
  }

  const closeRequestReview = () => {
    setSelectedRequest(null)
    setApprovedQuantity('')
    setApprovedCost('')
    setReviewNote('')
  }

  const submitRequestReview = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedRequest) return

    try {
      await reviewMutation.mutateAsync({
        id: selectedRequest.id,
        action,
        approvedQuantity:
          action === 'APPROVE'
            ? Math.max(1, Number(approvedQuantity) || selectedRequest.quantity)
            : undefined,
        approvedCost:
          action === 'APPROVE'
            ? approvedCost === ''
              ? undefined
              : Number(approvedCost)
            : undefined,
        reviewNote: reviewNote || undefined,
      })
      showMessage(action === 'APPROVE' ? 'Purchase request approved.' : 'Purchase request rejected.')
      closeRequestReview()
    } catch (err) {
      showMessage(getErrorMessage(err))
    }
  }

  const submitBatchCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canCreate) {
      showMessage('Missing permission: warehouse.purchase_request.create')
      return
    }
    if (!builderWarehouseId) {
      showMessage('Select warehouse first.')
      return
    }
    if (batchItems.length === 0) {
      showMessage('Add at least one book to batch.')
      return
    }

    const invalidQty = batchItems.find((item) => !Number.isInteger(item.quantity) || item.quantity < 1)
    if (invalidQty) {
      showMessage(`Invalid quantity for ${invalidQty.title}. Quantity must be at least 1.`)
      return
    }

    const failed: string[] = []
    let created = 0

    for (const item of batchItems) {
      try {
        await createMutation.mutateAsync({
          bookId: item.bookId,
          warehouseId: builderWarehouseId,
          quantity: item.quantity,
          estimatedCost: item.estimatedCost,
          reviewNote: batchReviewNote || undefined,
          submitForApproval: batchSubmitForApproval,
        })
        created += 1
      } catch {
        failed.push(item.title)
      }
    }

    if (created > 0 && failed.length === 0) {
      setBatchItems([])
      setBatchReviewNote('')
      showMessage(`Created ${created} purchase request(s).`)
      return
    }

    if (created > 0 && failed.length > 0) {
      showMessage(`Created ${created} request(s). Failed: ${failed.join(', ')}`)
      return
    }

    showMessage(`Failed to create requests: ${failed.join(', ')}`)
  }

  return (
    <div className="space-y-6 p-8 dark:text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Workflow</p>
          <h1 className="text-2xl font-bold">Purchase Requests</h1>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setIsBuilderOpen(true)}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
          >
            Create Request
          </button>
        )}
      </div>

      {message && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          {getErrorMessage(error)}
        </div>
      )}

      <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Queue Filters</h2>
          <div className="mt-4 grid gap-3">
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">All warehouses</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PurchaseRequestStatus | '')}
              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">All statuses</option>
              {statusOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
      </div>

      <AdminSlideOverPanel
        open={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        title={prefillBook ? `Restock ${prefillBook.title}` : 'Batch Request Builder'}
        description={
          prefillBook
            ? builderWarehouseId
              ? 'The selected title is ready in the request cart. Adjust quantity and cost before submitting.'
              : 'Choose a warehouse to finish preparing this restock request.'
            : undefined
        }
        widthClassName="sm:max-w-[56rem]"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsBuilderOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="purchase-request-builder-form"
              disabled={createMutation.isPending || !canCreate || !builderWarehouseId || batchItems.length === 0}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              {createMutation.isPending ? 'Creating...' : `Create ${batchItems.length || ''} Request(s)`}
            </button>
          </div>
        }
      >
        <form id="purchase-request-builder-form" onSubmit={submitBatchCreate}>
          {prefillBook ? (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-slate-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">Restock Focus</p>
                  <p className="mt-1 font-medium">{prefillBook.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{prefillBook.author} • {prefillBook.isbn}</p>
                </div>
                {builderWarehouseId ? (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                    Ready to request
                  </span>
                ) : (
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    Select a warehouse
                  </span>
                )}
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <select
              value={builderWarehouseId}
              onChange={(e) => {
                setBuilderWarehouseId(e.target.value)
                setBatchItems([])
              }}
              className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">Select warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
              ))}
            </select>
            <select
              value={batchMode}
              onChange={(e) => setBatchMode(e.target.value as BatchMode)}
              className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="LOW_OR_OUT">Low + Out of Stock</option>
              <option value="OUT_ONLY">Out of Stock Only</option>
              <option value="NEW_BOOKS">New Books</option>
              <option value="ALL">All Books in Warehouse</option>
            </select>
            <input
              value={batchSearch}
              onChange={(e) => setBatchSearch(e.target.value)}
              placeholder="Search by title, author, ISBN"
              className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Candidate Books</h3>
              <button
                type="button"
                onClick={() => setIsCandidateListOpen((prev) => !prev)}
                className="rounded border border-slate-300 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {isCandidateListOpen ? 'Hide List' : 'Show List'}
              </button>
            </div>
          </div>

          {isCandidateListOpen && (
            <div className={`admin-table-wrapper mt-3 max-h-64 overflow-auto ${!builderWarehouseId ? 'opacity-60' : ''}`}>
              <table className="admin-table min-w-full text-sm">
                <thead className="admin-table-head">
                  <tr>
                    <th className="px-3 py-2 text-left">Book</th>
                    <th className="px-3 py-2 text-left">Current</th>
                    <th className="px-3 py-2 text-left">Threshold</th>
                    <th className="px-3 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((row) => (
                    <tr key={row.id}>
                      <td className="px-3 py-2">
                        <p className="font-medium">{row.book.title}</p>
                        <p className="text-xs text-slate-500">{row.book.author} • {row.book.isbn}</p>
                      </td>
                      <td className="px-3 py-2">{row.stock}</td>
                      <td className="px-3 py-2">{row.lowStockThreshold}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => addToBatch(row)}
                          className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold uppercase tracking-widest text-slate-700 dark:border-slate-700 dark:text-slate-200"
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  ))}
                  {builderWarehouseId && candidates.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-sm text-slate-500">No matching books for this filter.</td>
                    </tr>
                  )}
                  {!builderWarehouseId && (
                    <tr>
                      <td colSpan={4} className="px-3 py-7 text-center text-sm text-slate-500">
                        <p className="font-medium">Select a warehouse to begin.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Batch Cart</h3>
              <p className="text-xs text-slate-500">{batchItems.length} item(s)</p>
            </div>

            <div className="mt-3 space-y-2">
              {batchItems.map((item) => (
                <div key={item.bookId} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2 sm:grid-cols-[1fr_120px_140px_auto] dark:border-slate-800 dark:bg-slate-900">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-slate-500">Current {item.currentStock} • threshold {item.threshold}</p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateBatchItem(item.bookId, { quantity: Number(e.target.value) || 1 })}
                    className="rounded border px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                    title="Quantity"
                  />
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={item.estimatedCost ?? ''}
                    onChange={(e) => {
                      const value = e.target.value
                      updateBatchItem(item.bookId, { estimatedCost: value === '' ? undefined : Number(value) })
                    }}
                    className="rounded border px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                    placeholder="Est. cost"
                    title="Estimated cost"
                  />
                  <button
                    type="button"
                    onClick={() => removeBatchItem(item.bookId)}
                    className="rounded border border-rose-200 px-2 py-1 text-xs font-semibold uppercase tracking-widest text-rose-700 transition-all duration-150 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {batchItems.length === 0 && <p className="text-sm text-slate-500">No books added yet.</p>}
            </div>

            <textarea
              value={batchReviewNote}
              onChange={(e) => setBatchReviewNote(e.target.value)}
              placeholder="Reason / note for finance (optional)"
              rows={2}
              className="mt-3 w-full rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={batchSubmitForApproval}
                onChange={(e) => setBatchSubmitForApproval(e.target.checked)}
              />
              Submit for approval now
            </label>
          </div>
        </form>
      </AdminSlideOverPanel>

      <AdminSlideOverPanel
        open={Boolean(selectedRequest)}
        onClose={closeRequestReview}
        kicker="Review"
        title={selectedRequest?.book.title ?? 'Purchase Request'}
        description={selectedRequest ? `Request ${selectedRequest.id.slice(0, 8)} for ${selectedRequest.warehouse.name}` : undefined}
        widthClassName="sm:max-w-[44rem]"
        footer={
          selectedRequest ? (
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeRequestReview}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              >
                Close
              </button>
              {selectedRequest.status === 'PENDING_APPROVAL' && (canApprove || canReject) ? (
                <>
                  {canReject ? (
                    <button
                      type="button"
                      onClick={() => void submitRequestReview('REJECT')}
                      disabled={reviewMutation.isPending}
                      className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-950/30"
                    >
                      {reviewMutation.isPending ? 'Saving...' : 'Reject'}
                    </button>
                  ) : null}
                  {canApprove ? (
                    <button
                      type="button"
                      onClick={() => void submitRequestReview('APPROVE')}
                      disabled={reviewMutation.isPending}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {reviewMutation.isPending ? 'Saving...' : 'Approve Request'}
                    </button>
                  ) : null}
                </>
              ) : null}
              {selectedRequest.status === 'APPROVED' && canComplete ? (
                <button
                  type="button"
                  onClick={() => {
                    void completeMutation
                      .mutateAsync(selectedRequest.id)
                      .then(() => {
                        showMessage('Purchase request completed.')
                        closeRequestReview()
                      })
                      .catch((err) => {
                        showMessage(getErrorMessage(err))
                      })
                  }}
                  disabled={completeMutation.isPending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {completeMutation.isPending ? 'Completing...' : 'Mark Completed'}
                </button>
              ) : null}
            </div>
          ) : null
        }
      >
        {selectedRequest ? (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Request Summary</h3>
                <dl className="mt-3 space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-500">Book</dt>
                    <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                      <div>{selectedRequest.book.title}</div>
                      <div className="text-xs font-normal text-slate-500">{selectedRequest.book.author}</div>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Warehouse</dt>
                    <dd className="text-right font-medium text-slate-900 dark:text-slate-100">{selectedRequest.warehouse.name}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Status</dt>
                    <dd>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusTone(selectedRequest.status)}`}>
                        {selectedRequest.status}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Workflow Details</h3>
                <dl className="mt-3 space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-500">Requested By</dt>
                    <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                      <div>{selectedRequest.requestedByUser.name}</div>
                      <div className="text-xs font-normal text-slate-500">{selectedRequest.requestedByUser.email}</div>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Created</dt>
                    <dd className="font-medium text-slate-900 dark:text-slate-100">{formatDateTime(selectedRequest.createdAt)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Reviewed By</dt>
                    <dd className="text-right font-medium text-slate-900 dark:text-slate-100">
                      {selectedRequest.approvedByUser ? selectedRequest.approvedByUser.name : 'Not reviewed'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Reviewed At</dt>
                    <dd className="font-medium text-slate-900 dark:text-slate-100">{formatDateTime(selectedRequest.approvedAt)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Linked Order</dt>
                    <dd className="font-medium text-slate-900 dark:text-slate-100">
                      {selectedRequest.purchaseOrderId ? selectedRequest.purchaseOrderId.slice(0, 8) : 'Not linked'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Approved Qty</dt>
                    <dd className="font-medium text-slate-900 dark:text-slate-100">
                      {selectedRequest.approvedQuantity ?? 'Not set'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500">Approved Cost</dt>
                    <dd className="font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(selectedRequest.approvedCost)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Approval Details</h3>
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
                Requested {selectedRequest.quantity} unit(s) at {formatCurrency(selectedRequest.estimatedCost)}.
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Approved quantity</span>
                  <input
                    type="number"
                    min={1}
                    value={approvedQuantity}
                    onChange={(e) => setApprovedQuantity(e.target.value)}
                    disabled={selectedRequest.status !== 'PENDING_APPROVAL'}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:disabled:bg-slate-800"
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Approved cost</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={approvedCost}
                    onChange={(e) => setApprovedCost(e.target.value)}
                    disabled={selectedRequest.status !== 'PENDING_APPROVAL'}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:disabled:bg-slate-800"
                  />
                </label>
              </div>
              <label className="mt-4 block space-y-2 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">Review note</span>
                <textarea
                  rows={4}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  disabled={selectedRequest.status !== 'PENDING_APPROVAL'}
                  placeholder="Add finance/admin review notes, pricing context, or rejection reason."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:disabled:bg-slate-800"
                />
              </label>
            </div>
          </div>
        ) : null}
      </AdminSlideOverPanel>

      <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Queue</h2>
        <div className="admin-table-wrapper mt-4 overflow-auto">
          <table className="admin-table min-w-full text-sm">
            <thead className="admin-table-head">
              <tr>
                <th className="px-3 py-2 text-left">Book</th>
                <th className="px-3 py-2 text-left">Warehouse</th>
                <th className="px-3 py-2 text-left">Qty</th>
                <th className="px-3 py-2 text-left">Est. Cost</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Requested By</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((request) => (
                <tr key={request.id}>
                  <td className="px-3 py-2">
                    <p className="font-medium">{request.book.title}</p>
                    <p className="text-xs text-slate-500">{request.book.author}</p>
                  </td>
                  <td className="px-3 py-2">{request.warehouse.code}</td>
                  <td className="px-3 py-2">{request.quantity}</td>
                  <td className="px-3 py-2">{formatCurrency(request.estimatedCost)}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusTone(request.status)}`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">{request.requestedByUser.name}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <AdminIconActionButton
                        label="Review request"
                        icon={<Eye className="h-4 w-4" />}
                        onClick={() => openRequestReview(request)}
                      />
                      {request.status === 'PENDING_APPROVAL' && canApprove && (
                        <AdminIconActionButton
                          label="Approve request"
                          icon={<Check className="h-4 w-4" />}
                          variant="success"
                          onClick={() => openRequestReview(request)}
                        />
                      )}
                      {request.status === 'PENDING_APPROVAL' && canReject && (
                        <AdminIconActionButton
                          label="Reject request"
                          icon={<X className="h-4 w-4" />}
                          variant="danger"
                          onClick={() => openRequestReview(request)}
                        />
                      )}
                      {request.status === 'APPROVED' && canComplete && (
                        <AdminIconActionButton
                          label="Complete request"
                          icon={<CircleCheck className="h-4 w-4" />}
                          variant="accent"
                          onClick={() => openRequestReview(request)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-sm text-slate-500" colSpan={7}>No purchase requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminPurchaseRequestsPage
