import { Fragment, useEffect, useMemo, useState } from 'react'
import { CircleCheck, Pencil, Plus } from 'lucide-react'
import { getErrorMessage } from '@/lib/api'
import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/store/auth.store'
import {
  useCreatePurchaseRequestsFromReorderSuggestions,
  useCreatePurchaseOrdersBatch,
  useCreatePurchaseOrder,
  usePurchaseOrders,
  usePurchasePricingPreview,
  usePurchaseRequests,
  useReceivePurchaseOrder,
  useUpdatePurchaseOrderDraft,
  useReorderPurchaseOrder,
  useReorderSuggestions,
  useVendors,
  useWarehouses,
  type PurchaseOrderStatus,
} from '@/features/admin/services/warehouses'
import { useTimedMessage } from '@/hooks/useTimedMessage'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'
import AdminIconActionButton from '@/components/admin/AdminIconActionButton'
import { useSearchParams } from 'react-router-dom'

const statusOptions: PurchaseOrderStatus[] = ['DRAFT', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED']
type ProcurementView = 'orders' | 'replenishment'
type ReceiveDraftItem = {
  id: string
  title: string
  author: string
  orderedQuantity: number
  receivedQuantity: number
  remainingQuantity: number
  unitCost: number | null
  currentRetailPrice: number
  suggestedRetailPrice: number | null
  finalRetailPrice: string
}

type PriceSourceTone = 'default' | 'suggested' | 'manual'

const AdminPurchaseOrdersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const user = useAuthStore((state) => state.user)
  const canCreate =
    user?.role === 'ADMIN'
    || user?.role === 'SUPER_ADMIN'
    || hasPermission(user?.permissions, 'warehouse.purchase_order.create')
  const canReceive =
    user?.role === 'ADMIN'
    || user?.role === 'SUPER_ADMIN'
    || hasPermission(user?.permissions, 'warehouse.purchase_order.receive')

  const { message, showMessage } = useTimedMessage(2600)
  const initialView = searchParams.get('view') === 'replenishment' ? 'replenishment' : 'orders'
  const [activeView, setActiveView] = useState<ProcurementView>(initialView)
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)
  const [status, setStatus] = useState<PurchaseOrderStatus | ''>('')
  const [warehouseId, setWarehouseId] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [vendorSearch, setVendorSearch] = useState('')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState({
    vendorId: '',
    unitCost: '',
    expectedAt: '',
    notes: '',
  })
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([])
  const [leadTimeDays, setLeadTimeDays] = useState(14)
  const [coverageDays, setCoverageDays] = useState(30)
  const [minDailySales, setMinDailySales] = useState(0)
  const [suggestionLimit, setSuggestionLimit] = useState(20)
  const [reorderMessage, setReorderMessage] = useState('')
  const [selectedPreviousOrderId, setSelectedPreviousOrderId] = useState<string | null>(null)
  const [selectedEditableOrderId, setSelectedEditableOrderId] = useState<string | null>(null)
  const [selectedReceiveOrderId, setSelectedReceiveOrderId] = useState<string | null>(null)
  const [draftEditForm, setDraftEditForm] = useState({
    expectedAt: '',
    notes: '',
    items: [] as Array<{
      id: string
      title: string
      author: string
      orderedQuantity: string
      unitCost: string
    }>,
  })
  const [receiveForm, setReceiveForm] = useState({
    note: '',
    closeWhenFullyReceived: true,
    items: [] as Array<ReceiveDraftItem>,
  })

  const { data: warehouses = [] } = useWarehouses()
  const { data: vendors = [] } = useVendors(true)
  const { data: approvedRequests = [] } = usePurchaseRequests({ status: 'APPROVED' })
  const { data: purchasePricingPreview } = usePurchasePricingPreview()
  const { data: orders = [], error } = usePurchaseOrders({
    status: status || undefined,
    warehouseId: warehouseId || undefined,
    vendorId: vendorId || undefined,
  })
  const reorderSuggestionsQuery = useReorderSuggestions({
    warehouseId: warehouseId || undefined,
    leadTimeDays,
    coverageDays,
    minDailySales,
    limit: suggestionLimit,
  })
  const createOrder = useCreatePurchaseOrder()
  const createBatchOrders = useCreatePurchaseOrdersBatch()
  const receiveOrder = useReceivePurchaseOrder()
  const createRequestsFromSuggestions = useCreatePurchaseRequestsFromReorderSuggestions()
  const reorderPurchaseOrder = useReorderPurchaseOrder()
  const updateDraftOrder = useUpdatePurchaseOrderDraft()

  const selectableRequests = useMemo(
    () => approvedRequests.filter((request) => !request.purchaseOrderId),
    [approvedRequests],
  )
  const filteredVendors = useMemo(() => {
    const keyword = vendorSearch.trim().toLowerCase()
    if (!keyword) return vendors
    return vendors.filter((vendor) =>
      vendor.name.toLowerCase().includes(keyword) || vendor.code.toLowerCase().includes(keyword),
    )
  }, [vendorSearch, vendors])
  const reorderableOrders = useMemo(
    () =>
      orders
        .filter((order) => order.items.length > 0 && order.status !== 'CANCELLED')
        .slice(0, 12),
    [orders],
  )
  const selectedPreviousOrder = useMemo(
    () => reorderableOrders.find((order) => order.id === selectedPreviousOrderId) ?? null,
    [reorderableOrders, selectedPreviousOrderId],
  )
  const editableOrder = useMemo(
    () => orders.find((order) => order.id === selectedEditableOrderId) ?? null,
    [orders, selectedEditableOrderId],
  )
  const receiveOrderDraft = useMemo(
    () => orders.find((order) => order.id === selectedReceiveOrderId) ?? null,
    [orders, selectedReceiveOrderId],
  )
  const suggestionTotals = useMemo(() => {
    const rows = reorderSuggestionsQuery.data?.items || []
    return {
      books: rows.length,
      suggestedQty: rows.reduce((sum, row) => sum + row.suggestedQuantity, 0),
      shortage: rows.reduce((sum, row) => sum + row.shortage, 0),
    }
  }, [reorderSuggestionsQuery.data?.items])
  useEffect(() => {
    if (!editableOrder) return
    setDraftEditForm({
      expectedAt: editableOrder.expectedAt ? editableOrder.expectedAt.slice(0, 16) : '',
      notes: editableOrder.notes || '',
      items: editableOrder.items.map((item) => ({
        id: item.id,
        title: item.book.title,
        author: item.book.author,
        orderedQuantity: String(item.orderedQuantity),
        unitCost: item.unitCost ? String(Number(item.unitCost)) : '',
      })),
    })
  }, [editableOrder])

  useEffect(() => {
    if (!receiveOrderDraft) return
    setReceiveForm({
      note: '',
      closeWhenFullyReceived: true,
      items: receiveOrderDraft.items
        .map((item) => {
          const remainingQuantity = item.orderedQuantity - item.receivedQuantity
          if (remainingQuantity <= 0) return null
          const suggestedRetailPrice = projectRetailPrice(item.unitCost ?? null)
          return {
            id: item.id,
            title: item.book.title,
            author: item.book.author,
            orderedQuantity: item.orderedQuantity,
            receivedQuantity: remainingQuantity,
            remainingQuantity,
            unitCost: item.unitCost ? Number(item.unitCost) : null,
            currentRetailPrice: Number(item.book.price),
            suggestedRetailPrice,
            finalRetailPrice: String(suggestedRetailPrice ?? Number(item.book.price)),
          }
        })
        .filter(Boolean) as ReceiveDraftItem[],
    })
  }, [receiveOrderDraft])

  const getStatusTone = (orderStatus: PurchaseOrderStatus) => {
    switch (orderStatus) {
      case 'CLOSED':
      case 'RECEIVED':
        return 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200'
      case 'SENT':
      case 'PARTIALLY_RECEIVED':
        return 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200'
      case 'CANCELLED':
        return 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200'
      default:
        return 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
    }
  }

  const projectRetailPrice = (unitCost: number | null | undefined) => {
    if (!purchasePricingPreview) return null
    if (!purchasePricingPreview.applyPricingOnReceive) return null
    if (unitCost === null || unitCost === undefined || unitCost <= 0) return null

    const markup = Number(purchasePricingPreview.vendorMarkupValue)
    const projected =
      purchasePricingPreview.vendorMarkupType === 'PERCENT'
        ? unitCost * (1 + markup / 100)
        : unitCost + markup

    return Number(projected.toFixed(2))
  }

  const getReceivePriceSource = (item: ReceiveDraftItem): { label: string; tone: PriceSourceTone } => {
    const finalRetailPrice = Number(item.finalRetailPrice)
    if (!Number.isFinite(finalRetailPrice)) {
      return { label: 'Needs review', tone: 'default' }
    }

    if (item.suggestedRetailPrice !== null && Math.abs(finalRetailPrice - item.suggestedRetailPrice) < 0.01) {
      return { label: 'Global suggestion', tone: 'suggested' }
    }

    if (Math.abs(finalRetailPrice - item.currentRetailPrice) < 0.01) {
      return { label: 'Keep current price', tone: 'default' }
    }

    return { label: 'Manual override', tone: 'manual' }
  }

  const getPriceSourceClassName = (tone: PriceSourceTone) => {
    switch (tone) {
      case 'suggested':
        return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200'
      case 'manual':
        return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200'
      default:
        return 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300'
    }
  }

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canCreate) {
      showMessage('Missing permission: warehouse.purchase_order.create')
      return
    }
    if (!createForm.vendorId) {
      showMessage('Vendor is required.')
      return
    }
    if (selectedRequestIds.length === 0) {
      showMessage('Select at least one approved request.')
      return
    }
    try {
      if (selectedRequestIds.length === 1) {
        await createOrder.mutateAsync({
          purchaseRequestId: selectedRequestIds[0],
          vendorId: createForm.vendorId,
          unitCost: createForm.unitCost ? Number(createForm.unitCost) : undefined,
          expectedAt: createForm.expectedAt || undefined,
          notes: createForm.notes || undefined,
        })
      } else {
        await createBatchOrders.mutateAsync({
          purchaseRequestIds: selectedRequestIds,
          vendorId: createForm.vendorId,
          unitCost: createForm.unitCost ? Number(createForm.unitCost) : undefined,
          expectedAt: createForm.expectedAt || undefined,
          notes: createForm.notes || undefined,
        })
      }
      setCreateForm({
        vendorId: '',
        unitCost: '',
        expectedAt: '',
        notes: '',
      })
      setSelectedRequestIds([])
      setIsCreatePanelOpen(false)
      showMessage(selectedRequestIds.length > 1 ? 'Batch purchase orders created.' : 'Purchase order created.')
    } catch (err) {
      showMessage(getErrorMessage(err))
    }
  }

  const toggleRequest = (id: string, checked: boolean) => {
    setSelectedRequestIds((prev) =>
      checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((item) => item !== id),
    )
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequestIds(selectableRequests.map((request) => request.id))
      return
    }
    setSelectedRequestIds([])
  }

  const handleReceive = async () => {
    if (!receiveOrderDraft) return
    try {
      const items = receiveForm.items
        .filter((item) => item.receivedQuantity > 0)
        .map((item) => ({
          itemId: item.id,
          receivedQuantity: item.receivedQuantity,
          finalRetailPrice: item.finalRetailPrice.trim() ? Number(item.finalRetailPrice) : undefined,
        }))

      if (items.length === 0) {
        showMessage('Set at least one received quantity before saving.')
        return
      }

      await receiveOrder.mutateAsync({
        id: receiveOrderDraft.id,
        items,
        note: receiveForm.note || undefined,
        closeWhenFullyReceived: receiveForm.closeWhenFullyReceived,
      })
      showMessage('Purchase order received and inventory updated.')
      setSelectedReceiveOrderId(null)
    } catch (err) {
      showMessage(getErrorMessage(err))
    }
  }
  const switchView = (view: ProcurementView) => {
    setActiveView(view)
    const next = new URLSearchParams(searchParams)
    if (view === 'replenishment') next.set('view', 'replenishment')
    else next.delete('view')
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="space-y-6 p-8 dark:text-slate-100">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Procurement</p>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
        </div>
        <button
          type="button"
          onClick={() => setIsCreatePanelOpen(true)}
          disabled={!canCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
        >
          <Plus className="h-4 w-4" />
          Create Purchase Order
        </button>
      </div>

      <div className="surface-subtle inline-flex items-center gap-1 rounded-full bg-slate-50 p-1 dark:bg-slate-800/40">
        {([
          ['orders', 'Purchase Orders'],
          ['replenishment', 'Restock Planning'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => switchView(key)}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-all ${
              activeView === key
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-amber-300'
                : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {message && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {message}
        </div>
      )}
      {reorderMessage && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          {reorderMessage}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
          {getErrorMessage(error)}
        </div>
      )}

      {activeView === 'orders' && (
      <>
      <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Order Queue</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PurchaseOrderStatus | '')}
              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">All statuses</option>
              {statusOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">All warehouses</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.code}</option>
              ))}
            </select>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">All vendors</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>{vendor.code}</option>
              ))}
            </select>
          </div>

          <div className="admin-table-wrapper mt-4 overflow-auto">
            <table className="admin-table min-w-full text-sm">
              <thead className="admin-table-head">
                <tr>
                  <th className="px-3 py-2 text-left">Order</th>
                  <th className="px-3 py-2 text-left">Vendor</th>
                  <th className="px-3 py-2 text-left">Warehouse</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Items</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const canReceiveThis = canReceive && ['SENT', 'PARTIALLY_RECEIVED', 'RECEIVED'].includes(order.status)
                  const isExpanded = expandedOrderId === order.id
                  return (
                    <Fragment key={order.id}>
                    <tr>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setExpandedOrderId((prev) => (prev === order.id ? null : order.id))}
                          className="font-medium text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300"
                        >
                          {order.id.slice(0, 8)}
                        </button>
                        <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
                      </td>
                      <td className="px-3 py-2">{order.vendor.code}</td>
                      <td className="px-3 py-2">{order.warehouse.code}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusTone(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-xs text-slate-600 dark:text-slate-300">{order.items.length} item(s)</p>
                      </td>
                      <td className="px-3 py-2">
                        {order.status === 'DRAFT' && canCreate ? (
                          <AdminIconActionButton
                            label="Edit draft purchase order"
                            icon={<Pencil className="h-4 w-4" />}
                            onClick={() => setSelectedEditableOrderId(order.id)}
                          />
                        ) : canReceiveThis ? (
                          <AdminIconActionButton
                            label="Receive purchase order"
                            icon={<CircleCheck className="h-4 w-4" />}
                            variant="accent"
                            onClick={() => setSelectedReceiveOrderId(order.id)}
                          />
                        ) : (
                          <span className="text-xs text-slate-400">No action</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="bg-slate-50/70 px-3 py-2 dark:bg-slate-950/40">
                          <div className="space-y-1">
                            {order.items.map((item) => (
                              <div key={item.id} className="rounded-md border border-slate-200/70 bg-white/70 px-2 py-1.5 dark:border-slate-700/70 dark:bg-slate-900/60">
                                <p className="text-xs text-slate-700 dark:text-slate-200">
                                  {item.book.title} by {item.book.author} • received {item.receivedQuantity}/{item.orderedQuantity}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  Unit cost: {item.unitCost ? `$${Number(item.unitCost).toFixed(2)}` : 'Not set'}
                                  {' • '}
                                  Current retail: ${Number(item.book.price).toFixed(2)}
                                  {(() => {
                                    const projected = projectRetailPrice(item.unitCost ?? null)
                                    if (projected === null) return ' • Retail preview: N/A'
                                    return ` • Retail preview after receive: $${projected.toFixed(2)}`
                                  })()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  )
                })}
                {orders.length === 0 && (
                  <tr>
                    <td className="px-3 py-4 text-sm text-slate-500" colSpan={6}>No purchase orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>
      </>
      )}

      {activeView === 'replenishment' && (
      <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric title="Suggested Books" value={suggestionTotals.books} />
        <Metric title="Suggested Qty" value={suggestionTotals.suggestedQty} />
        <Metric title="Current Shortage" value={suggestionTotals.shortage} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-3 md:grid-cols-5">
          <select
            value={warehouseId}
            onChange={(event) => setWarehouseId(event.target.value)}
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="">All warehouses</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.code} - {warehouse.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={90}
            value={leadTimeDays}
            onChange={(event) => setLeadTimeDays(Number(event.target.value || 14))}
            placeholder="Lead time days"
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
          <input
            type="number"
            min={7}
            max={120}
            value={coverageDays}
            onChange={(event) => setCoverageDays(Number(event.target.value || 30))}
            placeholder="Coverage days"
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
          <input
            type="number"
            min={0}
            step="0.1"
            value={minDailySales}
            onChange={(event) => setMinDailySales(Number(event.target.value || 0))}
            placeholder="Min daily sales"
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
          <input
            type="number"
            min={1}
            max={100}
            value={suggestionLimit}
            onChange={(event) => setSuggestionLimit(Number(event.target.value || 20))}
            placeholder="Max rows"
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Auto Replenishment Suggestions</h2>
          <button
            type="button"
            disabled={!warehouseId || createRequestsFromSuggestions.isPending}
            onClick={() => {
              if (!warehouseId) return
              createRequestsFromSuggestions.mutate({
                warehouseId,
                leadTimeDays,
                coverageDays,
                minDailySales,
                limit: suggestionLimit,
              }, {
                onSuccess: (result) => {
                  setReorderMessage(`Created ${result.createdCount} draft purchase request(s), skipped ${result.skippedCount}.`)
                },
                onError: (error) => {
                  setReorderMessage(getErrorMessage(error))
                },
              })
            }}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
          >
            {createRequestsFromSuggestions.isPending ? 'Creating Requests...' : 'Create Draft Purchase Requests'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800">
                <th className="px-3 py-2">Book</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Sold (30d)</th>
                <th className="px-3 py-2">Daily Sales</th>
                <th className="px-3 py-2">Pending PR</th>
                <th className="px-3 py-2">Target Stock</th>
                <th className="px-3 py-2">Suggested Qty</th>
              </tr>
            </thead>
            <tbody>
              {(reorderSuggestionsQuery.data?.items || []).map((item) => (
                <tr key={item.bookId} className="border-b dark:border-slate-800">
                  <td className="px-3 py-3">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.author}</p>
                  </td>
                  <td className="px-3 py-3">{item.stock}</td>
                  <td className="px-3 py-3">{item.sold30Days}</td>
                  <td className="px-3 py-3">{item.dailySales.toFixed(2)}</td>
                  <td className="px-3 py-3">{item.pendingPurchaseQty}</td>
                  <td className="px-3 py-3">{item.targetStock}</td>
                  <td className="px-3 py-3">
                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      {item.suggestedQuantity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reorderSuggestionsQuery.isLoading && (
            <p className="px-3 py-6 text-sm text-slate-500">Loading suggestions...</p>
          )}
          {!reorderSuggestionsQuery.isLoading && (reorderSuggestionsQuery.data?.items || []).length === 0 && (
            <p className="px-3 py-6 text-sm text-slate-500">No suggestions for current filters.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Reorder From Previous Merchant Orders</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800">
                <th className="px-3 py-2">Previous Order</th>
                <th className="px-3 py-2">Vendor</th>
                <th className="px-3 py-2">Warehouse</th>
                <th className="px-3 py-2">Items</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {reorderableOrders.map((order) => (
                <tr key={order.id} className="border-b dark:border-slate-800">
                  <td className="px-3 py-3">
                    <p className="font-medium">{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-medium">{order.vendor.name}</p>
                    <p className="text-xs text-slate-500">{order.vendor.code}</p>
                  </td>
                  <td className="px-3 py-3">{order.warehouse.code}</td>
                  <td className="px-3 py-3">
                    <p>{order.items.length} items</p>
                    <p className="text-xs text-slate-500">
                      {order.items.slice(0, 2).map((item) => item.book.title).join(', ')}
                      {order.items.length > 2 ? '...' : ''}
                    </p>
                  </td>
                  <td className="px-3 py-3">{order.status}</td>
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPreviousOrderId(order.id)}
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      Open Reorder Panel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reorderableOrders.length === 0 && (
            <p className="px-3 py-6 text-sm text-slate-500">No previous merchant orders available for reordering.</p>
          )}
        </div>
      </div>
      </>
      )}

      <AdminSlideOverPanel
        open={isCreatePanelOpen}
        onClose={() => setIsCreatePanelOpen(false)}
        kicker="Procurement"
        title="Create Purchase Order"
        description="Create single or batch orders from approved purchase requests."
        footer={(
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreatePanelOpen(false)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-po-form"
              disabled={(createOrder.isPending || createBatchOrders.isPending) || !canCreate}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              {(createOrder.isPending || createBatchOrders.isPending)
                ? 'Creating...'
                : selectedRequestIds.length > 1
                  ? `Create ${selectedRequestIds.length} Purchase Orders`
                  : 'Create Purchase Order'}
            </button>
          </div>
        )}
      >
        <form
          id="create-po-form"
          onSubmit={submitCreate}
          className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/45"
        >
          <div className="rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/60">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Approved Requests</p>
              <label className="inline-flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={selectableRequests.length > 0 && selectedRequestIds.length === selectableRequests.length}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                />
                Select all
              </label>
            </div>
            <div className="max-h-52 space-y-1 overflow-auto">
              {selectableRequests.map((request) => (
                <label key={request.id} className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <input
                    type="checkbox"
                    checked={selectedRequestIds.includes(request.id)}
                    onChange={(e) => toggleRequest(request.id, e.target.checked)}
                    className="mt-1"
                  />
                  <div className="text-xs">
                    <p className="font-medium text-slate-700 dark:text-slate-200">
                      {request.book.title} • {request.warehouse.code}
                    </p>
                    <p className="text-slate-500">
                      qty {request.approvedQuantity || request.quantity} • {request.book.author}
                    </p>
                  </div>
                </label>
              ))}
              {selectableRequests.length === 0 && (
                <p className="px-2 py-1 text-xs text-slate-500">No approved requests waiting for order creation.</p>
              )}
            </div>
            {selectedRequestIds.length > 0 && (
              <p className="mt-2 text-xs text-slate-500">{selectedRequestIds.length} request(s) selected</p>
            )}
          </div>

          <select
            value={createForm.vendorId}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, vendorId: e.target.value }))}
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="">Select vendor</option>
            {filteredVendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.code} • {vendor.name}
              </option>
            ))}
          </select>
          <input
            value={vendorSearch}
            onChange={(e) => setVendorSearch(e.target.value)}
            placeholder="Search vendor by code or name"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />

          <input
            type="number"
            min={0}
            step="0.01"
            value={createForm.unitCost}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, unitCost: e.target.value }))}
            placeholder="Unit cost (optional)"
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />

          <input
            type="datetime-local"
            value={createForm.expectedAt}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, expectedAt: e.target.value }))}
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
          <p className="text-xs text-slate-500">Expected delivery date/time (optional)</p>

          <textarea
            value={createForm.notes}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Notes (optional)"
            rows={3}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
        </form>
      </AdminSlideOverPanel>

      <AdminSlideOverPanel
        open={!!receiveOrderDraft}
        onClose={() => setSelectedReceiveOrderId(null)}
        kicker="Procurement"
        title="Receive Purchase Order"
        description="Review incoming quantities and confirm the final retail price for each received item."
        footer={receiveOrderDraft ? (
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setSelectedReceiveOrderId(null)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={receiveOrder.isPending}
              onClick={() => void handleReceive()}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              {receiveOrder.isPending ? 'Receiving...' : 'Receive Stock'}
            </button>
          </div>
        ) : null}
      >
        {receiveOrderDraft ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Vendor / Warehouse</p>
                <p className="mt-2 text-lg font-semibold">{receiveOrderDraft.vendor.name}</p>
                <p className="text-sm text-slate-500">
                  {receiveOrderDraft.vendor.code} • {receiveOrderDraft.warehouse.code}
                </p>
              </div>
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={receiveForm.closeWhenFullyReceived}
                    onChange={(e) => setReceiveForm((prev) => ({ ...prev, closeWhenFullyReceived: e.target.checked }))}
                  />
                  Close order when everything in this batch is fully received
                </label>
                <textarea
                  value={receiveForm.note}
                  onChange={(e) => setReceiveForm((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="Receiving note"
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="space-y-3">
              {receiveForm.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40"
                >
                  {(() => {
                    const priceSource = getReceivePriceSource(item)
                    return (
                      <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.author}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right text-xs text-slate-500">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getPriceSourceClassName(priceSource.tone)}`}
                      >
                        {priceSource.label}
                      </span>
                      <p>Ordered {item.orderedQuantity}</p>
                      <p>Remaining {item.remainingQuantity}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <label className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Receive Qty</span>
                      <input
                        type="number"
                        min={0}
                        max={item.remainingQuantity}
                        value={item.receivedQuantity}
                        onChange={(e) =>
                          setReceiveForm((prev) => ({
                            ...prev,
                            items: prev.items.map((entry) =>
                              entry.id === item.id
                                ? {
                                    ...entry,
                                    receivedQuantity: Math.max(
                                      0,
                                      Math.min(item.remainingQuantity, Number(e.target.value || 0)),
                                    ),
                                  }
                                : entry,
                            ),
                          }))
                        }
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                      />
                    </label>

                    <div className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Vendor Cost</span>
                      <div className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm leading-[2.75rem] text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {item.unitCost !== null ? `$${item.unitCost.toFixed(2)}` : 'Not set'}
                      </div>
                    </div>

                    <label className="space-y-1">
                      <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Final Retail</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.finalRetailPrice}
                        onChange={(e) =>
                          setReceiveForm((prev) => ({
                            ...prev,
                            items: prev.items.map((entry) =>
                              entry.id === item.id
                                ? { ...entry, finalRetailPrice: e.target.value }
                                : entry,
                            ),
                          }))
                        }
                        className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                      />
                    </label>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>Current retail ${item.currentRetailPrice.toFixed(2)}</span>
                    {item.suggestedRetailPrice !== null ? (
                      <span>Suggested ${item.suggestedRetailPrice.toFixed(2)}</span>
                    ) : (
                      <span>No global suggestion</span>
                    )}
                  </div>
                      </>
                    )
                  })()}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </AdminSlideOverPanel>

      <AdminSlideOverPanel
        open={!!selectedPreviousOrder}
        onClose={() => setSelectedPreviousOrderId(null)}
        kicker="Procurement"
        title="Reorder Previous Merchant Order"
        footer={selectedPreviousOrder ? (
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setSelectedPreviousOrderId(null)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={reorderPurchaseOrder.isPending}
              onClick={() =>
                reorderPurchaseOrder.mutate(selectedPreviousOrder.id, {
                  onSuccess: (createdOrder) => {
                    setReorderMessage(
                      `Created draft purchase order ${createdOrder.id.slice(0, 8)} from ${selectedPreviousOrder.vendor.code}.`,
                    )
                    setSelectedPreviousOrderId(null)
                    switchView('orders')
                    setSelectedEditableOrderId(createdOrder.id)
                  },
                  onError: (error) => {
                    setReorderMessage(getErrorMessage(error))
                  },
                })
              }
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              {reorderPurchaseOrder.isPending ? 'Creating...' : 'Create Draft Order'}
            </button>
          </div>
        ) : null}
      >
        {selectedPreviousOrder ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Previous Order</p>
                <p className="mt-2 text-lg font-semibold">{selectedPreviousOrder.id.slice(0, 8)}</p>
                <p className="text-sm text-slate-500">{new Date(selectedPreviousOrder.createdAt).toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Vendor / Warehouse</p>
                <p className="mt-2 text-lg font-semibold">{selectedPreviousOrder.vendor.name}</p>
                <p className="text-sm text-slate-500">
                  {selectedPreviousOrder.vendor.code} • {selectedPreviousOrder.warehouse.code}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Items to copy</p>
              <div className="mt-3 space-y-2">
                {selectedPreviousOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 px-3 py-3 dark:border-slate-700"
                  >
                    <div>
                      <p className="font-medium">{item.book.title}</p>
                      <p className="text-sm text-slate-500">{item.book.author}</p>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      <p>Qty {item.orderedQuantity}</p>
                      <p>Unit cost {item.unitCost ?? 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </AdminSlideOverPanel>

      <AdminSlideOverPanel
        open={!!selectedEditableOrderId}
        onClose={() => setSelectedEditableOrderId(null)}
        kicker="Procurement"
        title="Edit Draft Purchase Order"
        footer={editableOrder ? (
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setSelectedEditableOrderId(null)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={updateDraftOrder.isPending}
              onClick={() => {
                if (!editableOrder) return
                void updateDraftOrder.mutateAsync({
                  id: editableOrder.id,
                  expectedAt: draftEditForm.expectedAt || undefined,
                  notes: draftEditForm.notes || undefined,
                  items: draftEditForm.items.map((item) => ({
                    id: item.id,
                    orderedQuantity: Number(item.orderedQuantity),
                    unitCost: item.unitCost ? Number(item.unitCost) : undefined,
                  })),
                }).then(() => {
                  showMessage('Draft purchase order updated.')
                  setSelectedEditableOrderId(null)
                }).catch((err) => {
                  showMessage(getErrorMessage(err))
                })
              }}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              {updateDraftOrder.isPending ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
        ) : null}
      >
        {editableOrder ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Vendor / Warehouse</p>
                <p className="mt-2 text-lg font-semibold">{editableOrder.vendor.name}</p>
                <p className="text-sm text-slate-500">
                  {editableOrder.vendor.code} • {editableOrder.warehouse.code}
                </p>
              </div>
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
                <input
                  type="datetime-local"
                  value={draftEditForm.expectedAt}
                  onChange={(e) => setDraftEditForm((prev) => ({ ...prev, expectedAt: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                />
                <textarea
                  value={draftEditForm.notes}
                  onChange={(e) => setDraftEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes"
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Items</p>
              <div className="mt-3 space-y-3">
                {draftEditForm.items.map((item, index) => (
                  <div key={item.id} className="grid gap-3 rounded-xl border border-slate-200 px-3 py-3 md:grid-cols-[minmax(0,1fr)_140px_160px] dark:border-slate-700">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-slate-500">{item.author}</p>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={item.orderedQuantity}
                      onChange={(e) =>
                        setDraftEditForm((prev) => ({
                          ...prev,
                          items: prev.items.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, orderedQuantity: e.target.value } : row,
                          ),
                        }))
                      }
                      className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    />
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.unitCost}
                      onChange={(e) =>
                        setDraftEditForm((prev) => ({
                          ...prev,
                          items: prev.items.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, unitCost: e.target.value } : row,
                          ),
                        }))
                      }
                      className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Loading draft order...</p>
        )}
      </AdminSlideOverPanel>
    </div>
  )
}

const Metric = ({ title, value }: { title: string; value: string | number }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <p className="text-xs uppercase tracking-wider text-slate-500">{title}</p>
    <p className="mt-2 text-2xl font-bold">{value}</p>
  </div>
)

export default AdminPurchaseOrdersPage
