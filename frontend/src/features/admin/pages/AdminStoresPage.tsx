import { useEffect, useMemo, useState } from 'react'
import { ArrowRightLeft, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/lib/api'
import { useWarehouseStocks, useWarehouses } from '@/features/admin/services/warehouses'
import {
  useCreateStore,
  useDeleteStore,
  usePermanentDeleteStore,
  useRestoreStore,
  useStoreSalesOverview,
  useStoreStocks,
  useStores,
  useTransferToStore,
  useUpdateStore,
  type Store,
} from '@/features/admin/services/stores'
import { useTimedMessage } from '@/hooks/useTimedMessage'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'
import AdminIconActionButton from '@/components/admin/AdminIconActionButton'

const emptyStore = {
  name: '',
  code: '',
  city: '',
  state: '',
  address: '',
  phone: '',
  email: '',
  isActive: true,
}

const emptyTransferLine = {
  bookId: '',
  quantity: '1',
}

type TransferLine = {
  bookId: string
  quantity: number
}

type TransferDraftStatus = 'DRAFT' | 'SUBMITTED' | 'EXECUTED'

type TransferDraft = {
  id: string
  fromWarehouseId: string
  toStoreId: string
  note?: string
  lines: TransferLine[]
  status: TransferDraftStatus
  createdAt: string
}

const STORE_TRANSFER_DRAFTS_KEY = 'store-transfer-drafts-v1'

const AdminStoresPage = () => {
  const { data: stores = [] } = useStores('active')
  const { data: warehouses = [] } = useWarehouses()
  const { data: salesOverview } = useStoreSalesOverview()

  const createStore = useCreateStore()
  const updateStore = useUpdateStore()
  const deleteStore = useDeleteStore()
  const restoreStore = useRestoreStore()
  const permanentDeleteStore = usePermanentDeleteStore()
  const transferToStore = useTransferToStore()

  const [editingStoreId, setEditingStoreId] = useState<string | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [isStorePanelOpen, setIsStorePanelOpen] = useState(false)
  const [isTransferPanelOpen, setIsTransferPanelOpen] = useState(false)
  const [storeForm, setStoreForm] = useState(emptyStore)
  const [transferForm, setTransferForm] = useState({
    fromWarehouseId: '',
    toStoreId: '',
    note: '',
    lines: [{ ...emptyTransferLine }],
  })
  const [transferDrafts, setTransferDrafts] = useState<TransferDraft[]>([])
  const { data: selectedWarehouseStocks = [] } = useWarehouseStocks(transferForm.fromWarehouseId || undefined)
  const { data: selectedStoreStocks = [] } = useStoreStocks(selectedStoreId || undefined)

  const { message, showMessage } = useTimedMessage(2400)

  const selectedEditingStore = useMemo(
    () => stores.find((store) => store.id === editingStoreId) ?? null,
    [editingStoreId, stores],
  )
  const selectedStore = useMemo(
    () => stores.find((store) => store.id === selectedStoreId) ?? null,
    [selectedStoreId, stores],
  )

  const topStores = useMemo(
    () => (salesOverview?.perStore ?? []).slice(0, 5),
    [salesOverview],
  )
  const activeStores = useMemo(
    () => stores.filter((store) => store.isActive && !store.deletedAt),
    [stores],
  )
  const activeWarehouses = useMemo(
    () => warehouses.filter((warehouse) => warehouse.isActive),
    [warehouses],
  )
  const stockedBooks = useMemo(
    () => selectedWarehouseStocks.filter((row) => row.stock > 0),
    [selectedWarehouseStocks],
  )
  const currentStoreBooks = useMemo(
    () => selectedStoreStocks.filter((row) => row.stock > 0).sort((a, b) => b.stock - a.stock || a.book.title.localeCompare(b.book.title)),
    [selectedStoreStocks],
  )
  const selectedWarehouseStockMap = useMemo(
    () => new Map(stockedBooks.map((row) => [row.bookId, row])),
    [stockedBooks],
  )

  useEffect(() => {
    if (stores.length === 0) {
      setSelectedStoreId(null)
      return
    }
    if (!selectedStoreId || !stores.some((store) => store.id === selectedStoreId)) {
      setSelectedStoreId(stores[0]?.id ?? null)
    }
  }, [selectedStoreId, stores])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORE_TRANSFER_DRAFTS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as TransferDraft[]
      if (Array.isArray(parsed)) {
        setTransferDrafts(parsed)
      }
    } catch {
      setTransferDrafts([])
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORE_TRANSFER_DRAFTS_KEY, JSON.stringify(transferDrafts))
  }, [transferDrafts])

  const syncFormFromStore = (store: Store) => {
    setStoreForm({
      name: store.name,
      code: store.code,
      city: store.city,
      state: store.state,
      address: store.address || '',
      phone: store.phone || '',
      email: store.email || '',
      isActive: store.isActive,
    })
  }

  const closeStorePanel = () => {
    setIsStorePanelOpen(false)
    setEditingStoreId(null)
    setStoreForm(emptyStore)
  }

  const closeTransferPanel = () => {
    setIsTransferPanelOpen(false)
    setTransferForm({
      fromWarehouseId: '',
      toStoreId: '',
      note: '',
      lines: [{ ...emptyTransferLine }],
    })
  }

  useEffect(() => {
    if (!transferForm.fromWarehouseId) return
    setTransferForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line) => {
        if (!line.bookId) return line
        const stockRow = selectedWarehouseStockMap.get(line.bookId)
        if (stockRow) {
          const safeQuantity = Math.min(Number(line.quantity) || 1, stockRow.stock)
          return { ...line, quantity: String(safeQuantity) }
        }
        return { ...line, bookId: '', quantity: '1' }
      }),
    }))
  }, [transferForm.fromWarehouseId, selectedWarehouseStockMap])

  const validateTransferLines = () => {
    if (!transferForm.fromWarehouseId || !transferForm.toStoreId) {
      throw new Error('Warehouse and store are required for transfer.')
    }

    const validLines = transferForm.lines.filter((line) => line.bookId)
    if (validLines.length === 0) {
      throw new Error('Add at least one book to transfer.')
    }

    const normalizedLines: TransferLine[] = validLines.map((line) => {
      const quantity = Number(line.quantity)
      const stockRow = selectedWarehouseStockMap.get(line.bookId)
      if (!stockRow) {
        throw new Error('Select books that are currently available in the chosen warehouse.')
      }
      if (Number.isNaN(quantity) || quantity < 1) {
        throw new Error('Each transfer quantity must be at least 1.')
      }
      if (quantity > stockRow.stock) {
        throw new Error(`Only ${stockRow.stock} unit(s) available for ${stockRow.book.title} in the selected warehouse.`)
      }
      return { bookId: line.bookId, quantity }
    })

    return normalizedLines
  }

  const saveDraft = async (status: TransferDraftStatus) => {
    try {
      const normalizedLines = validateTransferLines()
      const draft: TransferDraft = {
        id: crypto.randomUUID(),
        fromWarehouseId: transferForm.fromWarehouseId,
        toStoreId: transferForm.toStoreId,
        note: transferForm.note || undefined,
        lines: normalizedLines,
        status,
        createdAt: new Date().toISOString(),
      }
      setTransferDrafts((prev) => [draft, ...prev])
      closeTransferPanel()
      showMessage(status === 'DRAFT' ? 'Transfer draft saved.' : 'Transfer submitted to delivery queue.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const onCreateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeForm.name || !storeForm.code || !storeForm.city || !storeForm.state) {
      showMessage('Name, code, city, and state are required.')
      return
    }

    try {
      await createStore.mutateAsync({
        ...storeForm,
        address: storeForm.address || undefined,
        phone: storeForm.phone || undefined,
        email: storeForm.email || undefined,
      })
      showMessage('Store created.')
      closeStorePanel()
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const onUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStoreId) {
      showMessage('Select a store from the list first.')
      return
    }

    try {
      await updateStore.mutateAsync({
        id: editingStoreId,
        data: {
          ...storeForm,
          address: storeForm.address || '',
          phone: storeForm.phone || '',
          email: storeForm.email || '',
        },
      })
      showMessage('Store updated.')
      closeStorePanel()
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const onDeleteStore = async (storeId: string) => {
    const store = stores.find((item) => item.id === storeId)
    const confirmed = window.confirm(
      `Move store "${store?.name || 'this store'}" to bin? You can restore it later.`,
    )
    if (!confirmed) return

    try {
      await deleteStore.mutateAsync(storeId)
      if (editingStoreId === storeId) {
        closeStorePanel()
      }
      showMessage('Store moved to bin.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const onRestoreStore = async (storeId: string) => {
    try {
      await restoreStore.mutateAsync(storeId)
      showMessage('Store restored from bin.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const onPermanentDeleteStore = async (storeId: string) => {
    const store = stores.find((item) => item.id === storeId)
    const confirmed = window.confirm(
      `Permanently delete "${store?.name || 'this store'}"? This cannot be undone.`,
    )
    if (!confirmed) return
    try {
      await permanentDeleteStore.mutateAsync(storeId)
      showMessage('Store permanently deleted.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const onTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    await saveDraft('SUBMITTED')
  }

  return (
    <div className="space-y-6 p-8 dark:text-slate-100">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Physical Stores</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingStoreId(null)
                setStoreForm(emptyStore)
                setIsStorePanelOpen(true)
              }}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              <Plus className="h-4 w-4" />
              New Store
            </button>
            <button
              type="button"
              onClick={() => setIsTransferPanelOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold uppercase tracking-widest text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowRightLeft className="h-4 w-4" />
              New Transfer
            </button>
            <Link
              to="/admin/bin"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Open bin"
            >
              <Trash2 className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {message && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
          {message}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Branches" value={salesOverview?.totals.stores ?? stores.length} />
        <MetricCard label="Pickup Ready" value={salesOverview?.totals.activeStores ?? stores.filter((store) => store.isActive).length} />
        <MetricCard label="Pickup Orders" value={salesOverview?.totals.orders ?? 0} />
        <MetricCard label="Pickup Sales" value={`$${(salesOverview?.totals.grossSales ?? 0).toFixed(2)}`} />
        <MetricCard label="Avg Pickup Order" value={`$${(salesOverview?.totals.avgOrderValue ?? 0).toFixed(2)}`} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Branch Directory</h2>
            <span className="text-xs text-slate-400">{stores.length} locations</span>
          </div>
          <div className="mt-4 overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-2 py-2">Branch</th>
                  <th className="px-2 py-2">Code</th>
                  <th className="px-2 py-2">Location</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => (
                  <tr
                    key={store.id}
                    className={`border-t border-slate-100 transition-colors dark:border-slate-800 ${
                      selectedStoreId === store.id ? 'bg-slate-50 dark:bg-slate-800/40' : ''
                    }`}
                  >
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => setSelectedStoreId(store.id)}
                        className="text-left"
                      >
                        <p className="font-medium">{store.name}</p>
                      </button>
                      <p className="text-xs text-slate-500">{store.phone || store.email || 'Pickup branch profile'}</p>
                    </td>
                    <td className="px-2 py-2 font-mono text-xs">{store.code}</td>
                    <td className="px-2 py-2">{store.city}, {store.state}</td>
                    <td className="px-2 py-2">
                      <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${store.deletedAt ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200' : store.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
                        {store.deletedAt ? 'In Bin' : store.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {!store.deletedAt ? (
                          <>
                            <AdminIconActionButton
                              label="Edit store"
                              icon={<Pencil className="h-4 w-4" />}
                              onClick={() => {
                                setEditingStoreId(store.id)
                                syncFormFromStore(store)
                                setIsStorePanelOpen(true)
                              }}
                            />
                            <AdminIconActionButton
                              label="Move store to bin"
                              icon={<Trash2 className="h-4 w-4" />}
                              variant="danger"
                              onClick={() => onDeleteStore(store.id)}
                            />
                          </>
                        ) : (
                          <>
                            <AdminIconActionButton
                              label="Restore store"
                              icon={<RotateCcw className="h-4 w-4" />}
                              variant="success"
                              onClick={() => onRestoreStore(store.id)}
                            />
                            <AdminIconActionButton
                              label="Delete store permanently"
                              icon={<Trash2 className="h-4 w-4" />}
                              variant="danger"
                              onClick={() => onPermanentDeleteStore(store.id)}
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Store Inventory</h2>
              <p className="mt-1 text-xs text-slate-400">
                {selectedStore ? `${selectedStore.name}` : 'Select a store from the directory'}
              </p>
            </div>
            <span className="text-xs text-slate-400">
              {currentStoreBooks.length} title{currentStoreBooks.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {selectedStore ? (
              <>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedStore.name}</h3>
                      <p className="text-sm text-slate-500">{selectedStore.city}, {selectedStore.state}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${selectedStore.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
                      {selectedStore.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="max-h-[32rem] overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/60">
                      <tr>
                        <th className="px-3 py-2">Book</th>
                        <th className="px-3 py-2">Author</th>
                        <th className="px-3 py-2">ISBN</th>
                        <th className="px-3 py-2">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentStoreBooks.map((row) => (
                        <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="px-3 py-2 font-medium">{row.book.title}</td>
                          <td className="px-3 py-2">{row.book.author}</td>
                          <td className="px-3 py-2 text-xs text-slate-500">{row.book.isbn}</td>
                          <td className="px-3 py-2 font-semibold">{row.stock}</td>
                        </tr>
                      ))}
                      {currentStoreBooks.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-3 py-4 text-sm text-slate-500">
                            No books currently stocked in this store.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">No store selected yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Pickup Sales Ranking</h2>
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-2 py-2">Store</th>
                <th className="px-2 py-2">Orders</th>
                <th className="px-2 py-2">Units</th>
                <th className="px-2 py-2">Sales</th>
                <th className="px-2 py-2">Top Book</th>
              </tr>
            </thead>
            <tbody>
              {topStores.map((entry) => (
                <tr key={entry.store.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-2 py-2">{entry.store.name}</td>
                  <td className="px-2 py-2">{entry.totalOrders}</td>
                  <td className="px-2 py-2">{entry.unitsSold}</td>
                  <td className="px-2 py-2">${entry.grossSales.toFixed(2)}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">{entry.topBooks[0]?.title || '-'}</td>
                </tr>
              ))}
              {topStores.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-sm text-slate-500">No store pickup sales yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AdminSlideOverPanel
        open={isStorePanelOpen}
        onClose={closeStorePanel}
        kicker="Operations"
        title={selectedEditingStore ? 'Edit Store' : 'Create Store'}
        footer={(
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeStorePanel}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="store-form"
              disabled={createStore.isPending || updateStore.isPending}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-60 dark:bg-amber-400 dark:text-slate-900"
            >
              {selectedEditingStore ? 'Save Changes' : 'Create Store'}
            </button>
          </div>
        )}
      >
        <form id="store-form" className="space-y-3" onSubmit={selectedEditingStore ? onUpdateStore : onCreateStore}>
          <input className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-slate-800" placeholder="Store name" value={storeForm.name} onChange={(e) => setStoreForm((prev) => ({ ...prev, name: e.target.value }))} />
          <input className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-slate-800" placeholder="Store code" value={storeForm.code} onChange={(e) => setStoreForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))} />
          <div className="grid grid-cols-2 gap-2">
            <input className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-slate-800" placeholder="City" value={storeForm.city} onChange={(e) => setStoreForm((prev) => ({ ...prev, city: e.target.value }))} />
            <input className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-slate-800" placeholder="State" value={storeForm.state} onChange={(e) => setStoreForm((prev) => ({ ...prev, state: e.target.value }))} />
          </div>
          <input className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-slate-800" placeholder="Address" value={storeForm.address} onChange={(e) => setStoreForm((prev) => ({ ...prev, address: e.target.value }))} />
          <input className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-slate-800" placeholder="Phone" value={storeForm.phone} onChange={(e) => setStoreForm((prev) => ({ ...prev, phone: e.target.value }))} />
          <input className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm dark:border-slate-700 dark:bg-slate-800" placeholder="Email" value={storeForm.email} onChange={(e) => setStoreForm((prev) => ({ ...prev, email: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={storeForm.isActive} onChange={(e) => setStoreForm((prev) => ({ ...prev, isActive: e.target.checked }))} />
            Active store
          </label>
        </form>
      </AdminSlideOverPanel>

      <AdminSlideOverPanel
        open={isTransferPanelOpen}
        onClose={closeTransferPanel}
        kicker="Operations"
        title="Warehouse to Store Transfer"
        footer={(
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => void saveDraft('DRAFT')}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={closeTransferPanel}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="transfer-form"
              disabled={transferToStore.isPending}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-60 dark:bg-amber-400 dark:text-slate-900"
            >
              Submit to Delivery
            </button>
          </div>
        )}
      >
        <form id="transfer-form" className="space-y-3" onSubmit={onTransfer}>
          <div className="grid gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Destination Store</span>
              <select
                value={transferForm.toStoreId}
                onChange={(e) => setTransferForm((prev) => ({ ...prev, toStoreId: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Choose a store</option>
                {activeStores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} ({store.code})
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Source Warehouse</span>
                {transferForm.fromWarehouseId ? (
                  <span className="text-xs text-slate-400">{stockedBooks.length} titles</span>
                ) : null}
              </div>
              <select
                value={transferForm.fromWarehouseId}
                onChange={(e) => setTransferForm((prev) => ({ ...prev, fromWarehouseId: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Choose a warehouse</option>
                {activeWarehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} ({warehouse.code})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Books To Replenish</h3>
              <span className="text-xs text-slate-400">{transferForm.lines.length} lines</span>
            </div>

            {transferForm.lines.map((line, index) => (
              <div key={`${index}-${line.bookId}`} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px_auto] sm:items-end">
                  <label className="space-y-1.5">
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Book</span>
                    <select
                      value={line.bookId}
                      onChange={(e) => setTransferForm((prev) => ({
                        ...prev,
                        lines: prev.lines.map((row, rowIndex) => (
                          rowIndex === index ? { ...row, bookId: e.target.value } : row
                        )),
                      }))}
                      disabled={!transferForm.fromWarehouseId || stockedBooks.length === 0}
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-900"
                    >
                      <option value="">
                        {!transferForm.fromWarehouseId
                          ? 'Choose a warehouse first'
                          : stockedBooks.length === 0
                            ? 'No stocked books available'
                            : 'Choose a book'}
                      </option>
                      {stockedBooks.map((row) => (
                        <option key={row.bookId} value={row.bookId}>
                          {row.book.title} ({row.stock} available)
                        </option>
                      ))}
                    </select>
                    {line.bookId && selectedWarehouseStockMap.get(line.bookId) ? (
                      <p className="text-xs text-slate-400">
                        Available now: {selectedWarehouseStockMap.get(line.bookId)?.stock} unit(s)
                      </p>
                    ) : null}
                  </label>

                  <label className="space-y-1.5">
                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Qty</span>
                    <input
                      value={line.quantity}
                      onChange={(e) => setTransferForm((prev) => ({
                        ...prev,
                        lines: prev.lines.map((row, rowIndex) => (
                          rowIndex === index ? { ...row, quantity: e.target.value } : row
                        )),
                      }))}
                      type="number"
                      min={1}
                      max={selectedWarehouseStockMap.get(line.bookId)?.stock || undefined}
                      disabled={!line.bookId}
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="1"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setTransferForm((prev) => ({
                      ...prev,
                      lines: prev.lines.length > 1
                        ? prev.lines.filter((_, rowIndex) => rowIndex !== index)
                        : prev.lines,
                    }))}
                    disabled={transferForm.lines.length <= 1}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-500 transition hover:bg-rose-50 disabled:opacity-40 dark:border-rose-900/60 dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-rose-950/30"
                    aria-label="Remove line"
                    title="Remove line"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setTransferForm((prev) => ({
                ...prev,
                lines: [...prev.lines, { ...emptyTransferLine }],
              }))}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold uppercase tracking-widest text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Add Book
            </button>
          </div>

          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Delivery Note</span>
            <textarea
              value={transferForm.note}
              onChange={(e) => setTransferForm((prev) => ({ ...prev, note: e.target.value }))}
              className="min-h-24 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Add a note for the delivery or branch team (optional)"
            />
          </label>
        </form>
      </AdminSlideOverPanel>
    </div>
  )
}

type MetricCardProps = {
  label: string
  value: number | string
}

const MetricCard = ({ label, value }: MetricCardProps) => (
  <div className="rounded-2xl border bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-bold">{value}</p>
  </div>
)

export default AdminStoresPage
