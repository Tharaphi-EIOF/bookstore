import { FormEvent, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import {
  BookLead,
  BookLeadSource,
  BookLeadWorkflowStage,
  useBookLeadDemandSummary,
  useBookLeads,
  useConvertBookLeadToBook,
  useCreateBookLead,
  useDeleteBookLead,
  useImportBookLeadsFromInquiries,
  useUpdateBookLead,
} from '@/features/admin/services/book-leads'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'
import AdminNotice from '@/components/admin/AdminNotice'
import AdminPageIntro from '@/components/admin/AdminPageIntro'
import AdminBookLeadsFilters from '@/features/admin/book-leads/components/AdminBookLeadsFilters'
import AdminBookLeadsTable from '@/features/admin/book-leads/components/AdminBookLeadsTable'
import {
  BUTTON_DANGER,
  CONFIDENCE_BADGE,
  ITEMS_PER_PAGE,
  SOURCE_OPTIONS,
  STAGE_BADGE,
  leadHasCatalogPrep,
  splitCsv,
  stageLabel,
  stageToEditableStatus,
  statusToStage,
  type BookLeadSortKey,
} from '@/features/admin/book-leads/lib/bookLeadDisplay'
import { getErrorMessage } from '@/lib/api'
import { hasPermission } from '@/lib/permissions'
import { useTimedMessage } from '@/hooks/useTimedMessage'
import { useCreatePurchaseRequest, useWarehouses } from '@/features/admin/services/warehouses'
import { useAuthStore } from '@/store/auth.store'

const AdminBookLeadsPage = () => {
  const user = useAuthStore((state) => state.user)
  const canCreatePurchaseRequest =
    user?.role === 'ADMIN'
    || user?.role === 'SUPER_ADMIN'
    || hasPermission(user?.permissions, 'warehouse.purchase_request.create')
  const { message, showMessage } = useTimedMessage(3200)
  const [stage, setStage] = useState<BookLeadWorkflowStage | ''>('')
  const [source, setSource] = useState<BookLeadSource | ''>('')
  const [q, setQ] = useState('')
  const [authorFilter, setAuthorFilter] = useState('')
  const [requestedByFilter, setRequestedByFilter] = useState('')
  const [assignedToFilter, setAssignedToFilter] = useState('')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [page, setPage] = useState(1)
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingStage, setEditingStage] = useState<BookLeadWorkflowStage>('NEW')
  const [deletingLead, setDeletingLead] = useState<BookLead | null>(null)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)
  const [sortKey, setSortKey] = useState<BookLeadSortKey>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [visibleColumns, setVisibleColumns] = useState({
    title: true,
    author: true,
    source: true,
    demand: true,
    confidence: true,
    priority: true,
    status: true,
    actions: true,
  })
  const [workflowLeadId, setWorkflowLeadId] = useState<string | null>(null)
  const [workflowIntent, setWorkflowIntent] = useState<'approve' | 'convert'>('approve')
  const [convertPayload, setConvertPayload] = useState({
    isbn: '',
    price: '',
    categories: '',
    stock: '0',
    genres: '',
    description: '',
    coverImage: '',
    warehouseId: '',
    quantity: '10',
    estimatedCost: '',
    reviewNote: '',
  })
  const [createPurchaseAfterConvert, setCreatePurchaseAfterConvert] = useState(false)
  const [submitPurchaseRequestForApproval, setSubmitPurchaseRequestForApproval] = useState(true)
  const [createPayload, setCreatePayload] = useState({
    title: '',
    author: '',
    note: '',
    source: 'USER_REQUEST' as BookLeadSource,
    priority: 3,
  })
  const deferredQuery = useDeferredValue(q)
  const deferredAuthorFilter = useDeferredValue(authorFilter)
  const deferredRequestedByFilter = useDeferredValue(requestedByFilter)
  const deferredAssignedToFilter = useDeferredValue(assignedToFilter)

  const listQuery = useBookLeads({
    stage: stage || undefined,
    source: source || undefined,
    view: 'active',
    q: deferredQuery.trim() || undefined,
    author: deferredAuthorFilter.trim() || undefined,
    requestedBy: deferredRequestedByFilter.trim() || undefined,
    assignedTo: deferredAssignedToFilter.trim() || undefined,
    createdFrom: createdFrom || undefined,
    createdTo: createdTo || undefined,
    page,
    limit: ITEMS_PER_PAGE,
  })
  const createMutation = useCreateBookLead()
  const deleteMutation = useDeleteBookLead()
  const updateMutation = useUpdateBookLead()
  const convertMutation = useConvertBookLeadToBook()
  const createPurchaseRequestMutation = useCreatePurchaseRequest()
  const importMutation = useImportBookLeadsFromInquiries()
  const demandSummaryQuery = useBookLeadDemandSummary(90)
  const { data: warehouses = [] } = useWarehouses()

  const rows = listQuery.data?.items || []
  const selectedLeads = rows.filter((row) => selectedLeadIds.has(row.id))
  const workflowLead = useMemo(
    () => rows.find((item) => item.id === workflowLeadId) || null,
    [rows, workflowLeadId],
  )
  const selectedLead = useMemo(
    () => rows.find((item) => item.id === selectedLeadId) || null,
    [rows, selectedLeadId],
  )

  const sortedRows = useMemo(() => {
    const sorted = [...rows]
    const direction = sortDir === 'asc' ? 1 : -1
    sorted.sort((a, b) => {
      switch (sortKey) {
        case 'author':
          return a.author.localeCompare(b.author) * direction
        case 'source':
          return a.source.localeCompare(b.source) * direction
        case 'demand':
          return ((a.demandCount ?? 1) - (b.demandCount ?? 1)) * direction
        case 'confidence':
          return ((a.confidenceScore ?? 0) - (b.confidenceScore ?? 0)) * direction
        case 'priority':
          return (a.priority - b.priority) * direction
        case 'status':
          return a.status.localeCompare(b.status) * direction
        case 'createdAt':
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction
        default:
          return a.title.localeCompare(b.title) * direction
      }
    })
    return sorted
  }, [rows, sortDir, sortKey])

  const totalPages = Math.max(1, listQuery.data?.totalPages ?? 1)
  const paginatedRows = sortedRows

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  useEffect(() => {
    setSelectedLeadIds((prev) => new Set([...prev].filter((id) => rows.some((row) => row.id === id))))
  }, [rows])

  useEffect(() => {
    if (importMutation.data) {
      const timer = setTimeout(() => importMutation.reset(), 5000)
      return () => clearTimeout(timer)
    }
  }, [importMutation.data, importMutation])

  const openWorkflowDrawer = (lead: BookLead, intent: 'approve' | 'convert') => {
    setWorkflowLeadId(lead.id)
    setWorkflowIntent(intent)
    setConvertPayload({
      isbn: lead.procurementIsbn || '',
      price: lead.procurementPrice != null ? String(lead.procurementPrice) : '',
      categories: (lead.procurementCategories || []).join(', '),
      stock: String(lead.procurementStock ?? 0),
      genres: (lead.procurementGenres || []).join(', '),
      description: lead.procurementDescription || '',
      coverImage: lead.procurementCoverImage || '',
      warehouseId: lead.procurementWarehouseId || '',
      quantity: String(lead.procurementQuantity ?? 10),
      estimatedCost:
        lead.procurementEstimatedCost != null ? String(lead.procurementEstimatedCost) : '',
      reviewNote: lead.procurementReviewNote || '',
    })
    setCreatePurchaseAfterConvert(Boolean(lead.procurementWarehouseId && lead.procurementQuantity))
    setSubmitPurchaseRequestForApproval(true)
  }

  const closeWorkflowDrawer = () => {
    setWorkflowLeadId(null)
    setWorkflowIntent('approve')
    setCreatePurchaseAfterConvert(false)
    setSubmitPurchaseRequestForApproval(true)
    setConvertPayload({
      isbn: '',
      price: '',
      categories: '',
      stock: '0',
      genres: '',
      description: '',
      coverImage: '',
      warehouseId: '',
      quantity: '10',
      estimatedCost: '',
      reviewNote: '',
    })
  }

  const onCreate = async (event: FormEvent) => {
    event.preventDefault()
    if (!createPayload.title.trim() || !createPayload.author.trim()) return

    await createMutation.mutateAsync({
      title: createPayload.title.trim(),
      author: createPayload.author.trim(),
      note: createPayload.note.trim() || undefined,
      source: createPayload.source,
      priority: createPayload.priority,
    })

    setCreatePayload({
      title: '',
      author: '',
      note: '',
      source: 'USER_REQUEST',
      priority: 3,
    })
    setIsCreatePanelOpen(false)
  }

  const saveWorkflowDetails = async () => {
    if (!workflowLeadId) return
    const categories = splitCsv(convertPayload.categories)
    if (!convertPayload.isbn.trim() || !convertPayload.price || categories.length === 0) {
      showMessage('ISBN, price, and at least one category are required.')
      return
    }

    await updateMutation.mutateAsync({
      id: workflowLeadId,
      data: {
        status: 'APPROVED_TO_BUY',
        procurementIsbn: convertPayload.isbn.trim(),
        procurementPrice: Number(convertPayload.price),
        procurementCategories: categories,
        procurementStock: Number(convertPayload.stock || 0),
        procurementGenres: splitCsv(convertPayload.genres),
        procurementDescription: convertPayload.description.trim(),
        procurementCoverImage: convertPayload.coverImage.trim(),
        procurementWarehouseId: convertPayload.warehouseId,
        procurementQuantity: convertPayload.quantity ? Number(convertPayload.quantity) : undefined,
        procurementEstimatedCost: convertPayload.estimatedCost
          ? Number(convertPayload.estimatedCost)
          : undefined,
        procurementReviewNote: convertPayload.reviewNote.trim(),
      },
    })
  }

  const onConvert = async (options?: { createPurchaseRequest?: boolean }) => {
    if (!workflowLeadId || !workflowLead) return

    const categories = splitCsv(convertPayload.categories)
    const genres = splitCsv(convertPayload.genres)
    const wantsPurchaseRequest = options?.createPurchaseRequest || false

    if (!convertPayload.isbn.trim() || !convertPayload.price || categories.length === 0) {
      showMessage('ISBN, price, and at least one category are required before conversion.')
      return
    }

    if (wantsPurchaseRequest) {
      if (!canCreatePurchaseRequest) {
        showMessage('Missing permission: warehouse.purchase_request.create')
        return
      }
      if (!convertPayload.warehouseId || !convertPayload.quantity) {
        showMessage('Choose a warehouse and quantity for the purchase request.')
        return
      }
    }

    try {
      await saveWorkflowDetails()

      const converted = await convertMutation.mutateAsync({
        id: workflowLeadId,
        data: {
          isbn: convertPayload.isbn.trim(),
          price: Number(convertPayload.price),
          categories,
          stock: Number(convertPayload.stock || 0),
          genres: genres.length ? genres : undefined,
          description: convertPayload.description.trim() || undefined,
          coverImage: convertPayload.coverImage.trim() || undefined,
          title: workflowLead.title,
          author: workflowLead.author,
        },
      })

      if (wantsPurchaseRequest) {
        await createPurchaseRequestMutation.mutateAsync({
          bookId: converted.book.id,
          warehouseId: convertPayload.warehouseId,
          quantity: Number(convertPayload.quantity),
          estimatedCost: convertPayload.estimatedCost
            ? Number(convertPayload.estimatedCost)
            : undefined,
          reviewNote: convertPayload.reviewNote.trim() || undefined,
          submitForApproval: submitPurchaseRequestForApproval,
        })
        showMessage('Lead converted and purchase request created.')
      } else {
        showMessage('Lead converted into a catalog book.')
      }

      closeWorkflowDrawer()
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const resetFilters = () => {
    setStage('')
    setSource('')
    setQ('')
    setAuthorFilter('')
    setRequestedByFilter('')
    setAssignedToFilter('')
    setCreatedFrom('')
    setCreatedTo('')
    setPage(1)
  }

  const toggleSort = (key: BookLeadSortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir(key === 'createdAt' ? 'desc' : 'asc')
  }

  const toggleLeadSelection = (leadId: string, checked: boolean) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(leadId)
      } else {
        next.delete(leadId)
      }
      return next
    })
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev)
      for (const row of paginatedRows) {
        if (checked) {
          next.add(row.id)
        } else {
          next.delete(row.id)
        }
      }
      return next
    })
  }

  const beginEdit = (lead: BookLead) => {
    setEditingId(lead.id)
    setEditingStage(statusToStage(lead.status))
  }

  const handleSaveEdit = async (lead: BookLead, nextStage: BookLeadWorkflowStage) => {
    const nextStatus = stageToEditableStatus(nextStage)
    if (nextStatus === 'APPROVED_TO_BUY' && !leadHasCatalogPrep(lead)) {
      openWorkflowDrawer(lead, 'approve')
      setEditingId(null)
      return
    }

    await updateMutation.mutateAsync({
      id: lead.id,
      data: { status: nextStatus },
    })
    setEditingId(null)
    showMessage('Lead updated.')
  }

  const handleDeleteLead = async () => {
    if (!deletingLead) return
    try {
      await deleteMutation.mutateAsync(deletingLead.id)
      setDeletingLead(null)
      setSelectedLeadIds((prev) => {
        const next = new Set(prev)
        next.delete(deletingLead.id)
        return next
      })
      showMessage('Lead moved to bin.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const handleBulkDelete = async () => {
    const activeLeads = selectedLeads.filter((lead) => !lead.deletedAt)
    if (activeLeads.length === 0) return
    const results = await Promise.allSettled(activeLeads.map((lead) => deleteMutation.mutateAsync(lead.id)))
    const succeeded = results.filter((result) => result.status === 'fulfilled').length
    const failed = results.filter((result) => result.status === 'rejected')
    if (succeeded > 0) {
      setSelectedLeadIds(new Set())
    }
    if (failed.length > 0) {
      showMessage(
        succeeded > 0
          ? `${succeeded} moved to bin, ${failed.length} failed.`
          : getErrorMessage((failed[0] as PromiseRejectedResult).reason),
      )
      return
    }
    showMessage(`${succeeded} lead${succeeded === 1 ? '' : 's'} moved to bin.`)
  }

  return (
    <div className="space-y-6 p-8 dark:text-slate-100">
      <AdminPageIntro
        title="Book Leads Inbox"
        className="mb-8 flex-col gap-5 md:flex-row md:items-start"
        actions={(
          <>
            <Link
              to="/admin/bin"
              className="inline-flex h-12 w-12 items-center justify-center rounded-[20px] border border-white/70 bg-white/80 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.35)] backdrop-blur transition hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-800/80 dark:bg-slate-950/70"
              aria-label="Open admin bin"
              title="Open admin bin"
            >
              <Trash2 className="h-5 w-5 text-slate-500/90 dark:text-slate-300/90" />
            </Link>
            <button
              type="button"
              disabled={importMutation.isPending}
              onClick={() => importMutation.mutate({ limit: 150, defaultPriority: 3 })}
              className="inline-flex h-12 items-center justify-center rounded-[20px] border border-indigo-200 bg-indigo-50 px-5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-300"
            >
              {importMutation.isPending ? 'Importing...' : 'Import from Inquiries'}
            </button>
            <button
              type="button"
              onClick={() => setIsCreatePanelOpen(true)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[20px] bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900"
            >
              <Plus className="h-4 w-4" />
              Create Lead
            </button>
          </>
        )}
      />

      {message ? (
        <AdminNotice className="rounded-2xl border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900/40 dark:bg-cyan-950/20 dark:text-cyan-300">
          {message}
        </AdminNotice>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Total Leads (90d)"
          value={demandSummaryQuery.data?.kpis.totalLeads ?? '-'}
        />
        <KpiCard
          label="Open Leads"
          value={demandSummaryQuery.data?.kpis.openLeads ?? '-'}
        />
        <KpiCard
          label="Converted"
          value={demandSummaryQuery.data?.kpis.convertedCount ?? '-'}
        />
        <KpiCard
          label="Conversion Rate"
          value={
            demandSummaryQuery.data
              ? `${Math.round(demandSummaryQuery.data.kpis.conversionRate * 100)}%`
              : '-'
          }
        />
        <KpiCard
          label="High Confidence"
          value={
            demandSummaryQuery.data
              ? `${Math.round(demandSummaryQuery.data.kpis.highConfidenceRatio * 100)}%`
              : '-'
          }
        />
      </div>

      {importMutation.data && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-300">
          Imported from inquiries: scanned {importMutation.data.scanned}, created {importMutation.data.created}, updated {importMutation.data.updated}, skipped existing catalog {importMutation.data.skippedCatalogMatch}.
        </div>
      )}

      {selectedLeadIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[26px] border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {selectedLeadIds.size} lead{selectedLeadIds.size === 1 ? '' : 's'} selected
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={deleteMutation.isPending}
              onClick={() => void handleBulkDelete()}
              className={BUTTON_DANGER}
            >
              <Trash2 className="h-4 w-4" />
              Move Selected To Bin
            </button>
          </div>
        </div>
      )}

      <AdminBookLeadsFilters
        q={q}
        onQChange={(value) => {
          setQ(value)
          setPage(1)
        }}
        stage={stage}
        onStageChange={(value) => {
          setStage(value)
          setPage(1)
        }}
        source={source}
        onSourceChange={(value) => {
          setSource(value)
          setPage(1)
        }}
        authorFilter={authorFilter}
        onAuthorFilterChange={(value) => {
          setAuthorFilter(value)
          setPage(1)
        }}
        requestedByFilter={requestedByFilter}
        onRequestedByFilterChange={(value) => {
          setRequestedByFilter(value)
          setPage(1)
        }}
        assignedToFilter={assignedToFilter}
        onAssignedToFilterChange={(value) => {
          setAssignedToFilter(value)
          setPage(1)
        }}
        createdFrom={createdFrom}
        onCreatedFromChange={(value) => {
          setCreatedFrom(value)
          setPage(1)
        }}
        createdTo={createdTo}
        onCreatedToChange={(value) => {
          setCreatedTo(value)
          setPage(1)
        }}
        onResetFilters={resetFilters}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
      />

      <AdminBookLeadsTable
        rows={paginatedRows}
        visibleColumns={visibleColumns}
        selectedLeadIds={selectedLeadIds}
        editingId={editingId}
        editingStage={editingStage}
        sortKey={sortKey}
        sortDir={sortDir}
        isLoading={listQuery.isLoading}
        isUpdating={updateMutation.isPending}
        page={page}
        totalPages={totalPages}
        onToggleSort={toggleSort}
        onToggleLeadSelection={toggleLeadSelection}
        onSelectAll={handleSelectAll}
        onSelectLead={setSelectedLeadId}
        onEditingStageChange={setEditingStage}
        onBeginEdit={beginEdit}
        onCancelEdit={() => setEditingId(null)}
        onOpenWorkflowDrawer={openWorkflowDrawer}
        onDeleteLead={setDeletingLead}
        onSaveEdit={handleSaveEdit}
        onPrevPage={() => setPage((prev) => Math.max(1, prev - 1))}
        onNextPage={() => setPage((prev) => prev + 1)}
        showMessage={showMessage}
      />

      {selectedLead && (
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm dark:border-cyan-900/40 dark:bg-cyan-950/20">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">Lead Detail</h2>
            <button
              type="button"
              onClick={() => setSelectedLeadId(null)}
              className="rounded-md border px-2 py-1 text-xs dark:border-slate-700"
            >
              Close
            </button>
          </div>
          <p className="mt-2 text-sm font-semibold">
            {selectedLead.title} by {selectedLead.author}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2 py-1 font-semibold ${CONFIDENCE_BADGE[selectedLead.confidenceBand || 'LOW']}`}>
              {selectedLead.confidenceBand || 'LOW'} confidence
            </span>
            <span className="rounded-full border border-cyan-300 px-2 py-1 text-cyan-700 dark:border-cyan-700 dark:text-cyan-300">
              Demand {selectedLead.demandCount ?? 1}
            </span>
            <span className={`rounded-full px-2 py-1 font-semibold ${STAGE_BADGE[statusToStage(selectedLead.status)]}`}>
              {stageLabel(statusToStage(selectedLead.status))}
            </span>
          </div>
          <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border border-cyan-200 bg-white p-3 text-xs text-slate-700 dark:border-cyan-900/40 dark:bg-slate-900 dark:text-slate-300">
            {selectedLead.note || 'No note available.'}
          </pre>
        </div>
      )}

      <AdminSlideOverPanel
        open={isCreatePanelOpen}
        onClose={() => setIsCreatePanelOpen(false)}
        kicker="Create Lead"
        title="New Book Lead"
        description="Add a procurement lead without cluttering the inbox layout."
        widthClassName="max-w-[36rem]"
        footer={(
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreatePanelOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-book-lead-form"
              disabled={createMutation.isPending}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
            >
              {createMutation.isPending ? 'Saving...' : 'Create Lead'}
            </button>
          </div>
        )}
      >
        <form id="create-book-lead-form" onSubmit={onCreate} className="space-y-4">
          <div className="grid gap-4">
            <label className="space-y-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Title</span>
              <input
                value={createPayload.title}
                onChange={(event) => setCreatePayload((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Book title"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Author</span>
              <input
                value={createPayload.author}
                onChange={(event) => setCreatePayload((prev) => ({ ...prev, author: event.target.value }))}
                placeholder="Author"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Source</span>
                <select
                  value={createPayload.source}
                  onChange={(event) => setCreatePayload((prev) => ({ ...prev, source: event.target.value as BookLeadSource }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                >
                  {SOURCE_OPTIONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Priority</span>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={createPayload.priority}
                  onChange={(event) => setCreatePayload((prev) => ({ ...prev, priority: Number(event.target.value || 3) }))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>
            </div>
            <label className="space-y-1 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Note</span>
              <textarea
                value={createPayload.note}
                onChange={(event) => setCreatePayload((prev) => ({ ...prev, note: event.target.value }))}
                placeholder="Customer request, demand reason, supplier hint..."
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
          </div>
        </form>
      </AdminSlideOverPanel>

      <AdminSlideOverPanel
        open={Boolean(workflowLead)}
        onClose={closeWorkflowDrawer}
        kicker={workflowIntent === 'approve' ? 'Approved' : 'Lead Conversion'}
        title={workflowLead?.title || 'Lead workflow'}
        description={
          workflowIntent === 'approve'
            ? 'Fill the catalog and procurement details once, save them on the lead, and keep sourcing honest.'
            : 'Use the saved procurement prep to convert this lead into a real catalog book and optionally raise a purchase request.'
        }
        widthClassName="max-w-[46rem]"
        footer={
          workflowLead ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {workflowLead.convertedBookId ? (
                  <span>
                    Already converted. <Link className="font-semibold text-cyan-700 hover:underline dark:text-cyan-300" to={`/admin/books?bookId=${workflowLead.convertedBookId}`}>Open book</Link>
                  </span>
                ) : workflowIntent === 'approve' ? (
                  'Save the prep now, then convert only when procurement is ready.'
                ) : (
                  'Conversion will mark the lead as converted and write a real catalog book.'
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void saveWorkflowDetails()
                      .then(() => {
                        showMessage('Approved-to-buy details saved on the lead.')
                        closeWorkflowDrawer()
                      })
                      .catch((error) => showMessage(getErrorMessage(error)))
                  }}
                  disabled={updateMutation.isPending || convertMutation.isPending || createPurchaseRequestMutation.isPending}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Approved Details'}
                </button>
                {!workflowLead.convertedBookId ? (
                  <button
                    type="button"
                    onClick={() => void onConvert()}
                    disabled={updateMutation.isPending || convertMutation.isPending || createPurchaseRequestMutation.isPending}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {convertMutation.isPending && !createPurchaseRequestMutation.isPending
                      ? 'Converting...'
                      : 'Save & Convert'}
                  </button>
                ) : null}
                {!workflowLead.convertedBookId && canCreatePurchaseRequest && createPurchaseAfterConvert ? (
                  <button
                    type="button"
                    onClick={() => void onConvert({ createPurchaseRequest: true })}
                    disabled={updateMutation.isPending || convertMutation.isPending || createPurchaseRequestMutation.isPending}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
                  >
                    {createPurchaseRequestMutation.isPending
                      ? 'Creating request...'
                      : 'Convert & Create Request'}
                  </button>
                ) : null}
              </div>
            </div>
          ) : null
        }
      >
        {workflowLead ? (
          <div className="space-y-5">
            <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950 md:grid-cols-[1.3fr_0.7fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Lead Snapshot
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {workflowLead.title}
                </p>
                <p className="text-slate-600 dark:text-slate-300">{workflowLead.author}</p>
                {workflowLead.note ? (
                  <p className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs leading-6 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                    {workflowLead.note}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2 text-xs">
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900">
                  <span className={`inline-flex rounded-full px-2 py-1 font-semibold ${STAGE_BADGE[statusToStage(workflowLead.status)]}`}>
                    {stageLabel(statusToStage(workflowLead.status))}
                  </span>
                  <p className="mt-2 text-slate-500 dark:text-slate-400">
                    Priority {workflowLead.priority} · Demand {workflowLead.demandCount ?? 1}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">What is required?</p>
                  <p className="mt-1 text-slate-500 dark:text-slate-400">
                    ISBN, price, and at least one category to save approved buying details.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Catalog Prep
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Save the catalog-ready details on the lead before conversion.
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    leadHasCatalogPrep(workflowLead)
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  }`}
                >
                  {leadHasCatalogPrep(workflowLead) ? 'Saved' : 'Needs details'}
                </span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">ISBN</span>
                  <input
                    value={convertPayload.isbn}
                    onChange={(event) => setConvertPayload((prev) => ({ ...prev, isbn: event.target.value }))}
                    placeholder="9780547928227"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Price</span>
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={convertPayload.price}
                    onChange={(event) => setConvertPayload((prev) => ({ ...prev, price: event.target.value }))}
                    placeholder="19.99"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
                <label className="space-y-1 text-sm md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Categories</span>
                  <input
                    value={convertPayload.categories}
                    onChange={(event) => setConvertPayload((prev) => ({ ...prev, categories: event.target.value }))}
                    placeholder="Poetry, Fiction"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Genres</span>
                  <input
                    value={convertPayload.genres}
                    onChange={(event) => setConvertPayload((prev) => ({ ...prev, genres: event.target.value }))}
                    placeholder="Modern Poetry"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Starting stock</span>
                  <input
                    type="number"
                    min={0}
                    value={convertPayload.stock}
                    onChange={(event) => setConvertPayload((prev) => ({ ...prev, stock: event.target.value }))}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
                <label className="space-y-1 text-sm md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Cover image</span>
                  <input
                    value={convertPayload.coverImage}
                    onChange={(event) => setConvertPayload((prev) => ({ ...prev, coverImage: event.target.value }))}
                    placeholder="https://example.com/cover.jpg"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
                <label className="space-y-1 text-sm md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Description</span>
                  <textarea
                    rows={3}
                    value={convertPayload.description}
                    onChange={(event) => setConvertPayload((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Why procurement approved this title, who asked for it, and how it should enter the catalog."
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Purchase Request Prep
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Optional while approving. Required only when you want this drawer to create the purchase request too.
                  </p>
                </div>
                {canCreatePurchaseRequest ? (
                  <label className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={createPurchaseAfterConvert}
                      onChange={(event) => setCreatePurchaseAfterConvert(event.target.checked)}
                      className="rounded border-slate-300"
                    />
                    Create request after convert
                  </label>
                ) : (
                  <span className="rounded-full border border-slate-300 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No purchase-request permission
                  </span>
                )}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Warehouse</span>
                  <select
                    value={convertPayload.warehouseId}
                    onChange={(event) => setConvertPayload((prev) => ({ ...prev, warehouseId: event.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">Choose warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.code})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Quantity</span>
                  <input
                    type="number"
                    min={1}
                    value={convertPayload.quantity}
                    onChange={(event) => setConvertPayload((prev) => ({ ...prev, quantity: event.target.value }))}
                    placeholder="10"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Estimated total cost</span>
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={convertPayload.estimatedCost}
                    onChange={(event) => setConvertPayload((prev) => ({ ...prev, estimatedCost: event.target.value }))}
                    placeholder="250.00"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Submission mode</span>
                  <select
                    value={submitPurchaseRequestForApproval ? 'submit' : 'draft'}
                    onChange={(event) => setSubmitPurchaseRequestForApproval(event.target.value === 'submit')}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="submit">Send for approval</option>
                    <option value="draft">Save as draft request</option>
                  </select>
                </label>
                <label className="space-y-1 text-sm md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Procurement note</span>
                  <textarea
                    rows={3}
                    value={convertPayload.reviewNote}
                    onChange={(event) => setConvertPayload((prev) => ({ ...prev, reviewNote: event.target.value }))}
                    placeholder="Vendor hint, urgency, branch context, or why this quantity makes sense."
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
              </div>
            </div>
          </div>
        ) : null}
      </AdminSlideOverPanel>

      <DeleteConfirmModal
        isOpen={Boolean(deletingLead)}
        onClose={() => setDeletingLead(null)}
        onConfirm={() => void handleDeleteLead()}
        isLoading={deleteMutation.isPending}
        title="Move lead to bin?"
        message={`Remove "${deletingLead?.title || 'this lead'}"? It will be moved to the bin and can be restored later.`}
        confirmLabel="Move To Bin"
      />
    </div>
  )
}

const KpiCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
    <p className="mt-4 text-[2.2rem] font-black leading-none tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
  </div>
)

export default AdminBookLeadsPage
