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
import AdminPageIntro from '@/components/admin/AdminPageIntro'
import AdminFilterCard from '@/components/admin/AdminFilterCard'
import AdminPaginationFooter from '@/components/admin/AdminPaginationFooter'
import AdminSurfacePanel from '@/components/admin/AdminSurfacePanel'

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
type StoreStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'BIN'
type StoreSortOption = 'NAME' | 'CITY' | 'SALES' | 'ORDERS'
type StoresTab = 'branches' | 'storeInventory' | 'ranking'

const ITEMS_PER_PAGE = 6

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
  const [activeTab, setActiveTab] = useState<StoresTab>('branches')
  const [storeQuery, setStoreQuery] = useState('')
  const [storeStatusFilter, setStoreStatusFilter] = useState<StoreStatusFilter>('ALL')
  const [storeSort, setStoreSort] = useState<StoreSortOption>('NAME')
  const [inventoryQuery, setInventoryQuery] = useState('')
  const [inventoryGenre, setInventoryGenre] = useState('')
  const [branchPage, setBranchPage] = useState(1)
  const [inventoryPage, setInventoryPage] = useState(1)
  const [rankingPage, setRankingPage] = useState(1)
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
  const storeSalesMap = useMemo(
    () => new Map((salesOverview?.perStore ?? []).map((entry) => [entry.store.id, entry])),
    [salesOverview],
  )
  const selectedStoreSales = useMemo(
    () => (selectedStoreId ? storeSalesMap.get(selectedStoreId) ?? null : null),
    [selectedStoreId, storeSalesMap],
  )
  const activeWarehouses = useMemo(
    () => warehouses.filter((warehouse) => warehouse.isActive),
    [warehouses],
  )
  const filteredStores = useMemo(() => {
    const normalizedQuery = storeQuery.trim().toLowerCase()
    const matchesQuery = (store: Store) => {
      if (!normalizedQuery) return true
      return [
        store.name,
        store.code,
        store.city,
        store.state,
        store.phone || '',
        store.email || '',
      ].some((value) => value.toLowerCase().includes(normalizedQuery))
    }

    const matchesStatus = (store: Store) => {
      switch (storeStatusFilter) {
        case 'ACTIVE':
          return store.isActive && !store.deletedAt
        case 'INACTIVE':
          return !store.isActive && !store.deletedAt
        case 'BIN':
          return Boolean(store.deletedAt)
        default:
          return true
      }
    }

    return stores
      .filter((store) => matchesQuery(store) && matchesStatus(store))
      .sort((a, b) => {
        if (storeSort === 'CITY') {
          return `${a.city} ${a.state}`.localeCompare(`${b.city} ${b.state}`) || a.name.localeCompare(b.name)
        }
        if (storeSort === 'SALES') {
          return (storeSalesMap.get(b.id)?.grossSales ?? 0) - (storeSalesMap.get(a.id)?.grossSales ?? 0)
            || a.name.localeCompare(b.name)
        }
        if (storeSort === 'ORDERS') {
          return (storeSalesMap.get(b.id)?.totalOrders ?? 0) - (storeSalesMap.get(a.id)?.totalOrders ?? 0)
            || a.name.localeCompare(b.name)
        }
        return a.name.localeCompare(b.name)
      })
  }, [storeQuery, storeSalesMap, storeSort, storeStatusFilter, stores])
  const stockedBooks = useMemo(
    () => selectedWarehouseStocks.filter((row) => row.stock > 0),
    [selectedWarehouseStocks],
  )
  const currentStoreBooks = useMemo(
    () => selectedStoreStocks.filter((row) => row.stock > 0).sort((a, b) => b.stock - a.stock || a.book.title.localeCompare(b.book.title)),
    [selectedStoreStocks],
  )
  const filteredStoreBooks = useMemo(() => {
    let filtered = currentStoreBooks

    if (inventoryGenre) {
      filtered = filtered.filter((row) => row.book.genres?.includes(inventoryGenre))
    }

    const normalizedQuery = inventoryQuery.trim().toLowerCase()
    if (normalizedQuery) {
      filtered = filtered.filter((row) =>
        [row.book.title, row.book.author, row.book.isbn].some((value) => value.toLowerCase().includes(normalizedQuery)),
      )
    }

    return filtered
  }, [currentStoreBooks, inventoryQuery, inventoryGenre])

  const availableGenres = useMemo(() => {
    const genres = new Set<string>()
    for (const row of currentStoreBooks) {
      if (Array.isArray(row.book.genres)) {
        for (const g of row.book.genres) {
          genres.add(g)
        }
      }
    }
    return Array.from(genres).sort()
  }, [currentStoreBooks])

  const selectedStoreTopAuthor = useMemo(() => {
    const authorTotals = new Map<string, number>()
    for (const book of selectedStoreSales?.topBooks ?? []) {
      authorTotals.set(book.author, (authorTotals.get(book.author) ?? 0) + book.quantity)
    }
    return [...authorTotals.entries()].sort((a, b) => b[1] - a[1])[0] ?? null
  }, [selectedStoreSales])
  const selectedStoreStockUnits = useMemo(
    () => currentStoreBooks.reduce((sum, row) => sum + row.stock, 0),
    [currentStoreBooks],
  )
  const branchTotalPages = Math.max(1, Math.ceil(filteredStores.length / ITEMS_PER_PAGE))
  const inventoryTotalPages = Math.max(1, Math.ceil(filteredStoreBooks.length / ITEMS_PER_PAGE))
  const rankingTotalPages = Math.max(1, Math.ceil(topStores.length / ITEMS_PER_PAGE))
  const paginatedStores = useMemo(
    () => filteredStores.slice((branchPage - 1) * ITEMS_PER_PAGE, branchPage * ITEMS_PER_PAGE),
    [branchPage, filteredStores],
  )
  const paginatedStoreBooks = useMemo(
    () => filteredStoreBooks.slice((inventoryPage - 1) * ITEMS_PER_PAGE, inventoryPage * ITEMS_PER_PAGE),
    [filteredStoreBooks, inventoryPage],
  )
  const paginatedTopStores = useMemo(
    () => topStores.slice((rankingPage - 1) * ITEMS_PER_PAGE, rankingPage * ITEMS_PER_PAGE),
    [rankingPage, topStores],
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
    if (filteredStores.length === 0) return
    if (!selectedStoreId || !filteredStores.some((store) => store.id === selectedStoreId)) {
      setSelectedStoreId(filteredStores[0]?.id ?? null)
    }
  }, [filteredStores, selectedStoreId])

  useEffect(() => {
    setBranchPage(1)
  }, [storeQuery, storeSort, storeStatusFilter])

  useEffect(() => {
    setInventoryPage(1)
  }, [inventoryQuery, inventoryGenre, selectedStoreId])

  useEffect(() => {
    setRankingPage(1)
  }, [topStores.length])

  useEffect(() => {
    if (branchPage > branchTotalPages) setBranchPage(branchTotalPages)
  }, [branchPage, branchTotalPages])

  useEffect(() => {
    if (inventoryPage > inventoryTotalPages) setInventoryPage(inventoryTotalPages)
  }, [inventoryPage, inventoryTotalPages])

  useEffect(() => {
    if (rankingPage > rankingTotalPages) setRankingPage(rankingTotalPages)
  }, [rankingPage, rankingTotalPages])

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
    <div className="space-y-8 p-6 sm:p-8 dark:text-slate-100">
      <AdminPageIntro
        eyebrow="Inventory"
        title="Physical Stores"
        actions={(
          <>
            <button
              type="button"
              onClick={() => {
                setEditingStoreId(null)
                setStoreForm(emptyStore)
                setIsStorePanelOpen(true)
              }}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              <Plus className="h-4 w-4" />
              New Store
            </button>
            <button
              type="button"
              onClick={() => setIsTransferPanelOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold uppercase tracking-widest text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowRightLeft className="h-4 w-4" />
              New Transfer
            </button>
            <Link
              to="/admin/bin"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Open bin"
            >
              <Trash2 className="h-4 w-4" />
            </Link>
          </>
        )}
      />

      {message && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
          {message}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-5">
        <MetricCard label="Branches" value={salesOverview?.totals.stores ?? stores.length} hint="Active pickup locations" />
        <MetricCard label="Pickup Ready" value={salesOverview?.totals.activeStores ?? stores.filter((store) => store.isActive).length} hint="Branches currently online" />
        <MetricCard label="Pickup Orders" value={salesOverview?.totals.orders ?? 0} hint="Orders routed to stores" />
        <MetricCard label="Pickup Sales" value={`$${(salesOverview?.totals.grossSales ?? 0).toFixed(2)}`} hint="Gross pickup revenue" />
        <MetricCard label="Avg Pickup Order" value={`$${(salesOverview?.totals.avgOrderValue ?? 0).toFixed(2)}`} hint="Average order value" />
      </section>

      <section className="space-y-6">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-white/70 bg-white/80 p-1.5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.24)] backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70">
          <TabButton label="Branches" active={activeTab === 'branches'} onClick={() => setActiveTab('branches')} />
          <TabButton label="Store Table" active={activeTab === 'storeInventory'} onClick={() => setActiveTab('storeInventory')} />
          <TabButton label="Ranking" active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')} />
        </div>

        {activeTab === 'branches' && (
          <>
            <AdminFilterCard className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_220px_220px_auto]">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Search</span>
                  <input
                    value={storeQuery}
                    onChange={(e) => setStoreQuery(e.target.value)}
                    placeholder="Search branch, code, city, state"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</span>
                  <select
                    value={storeStatusFilter}
                    onChange={(e) => setStoreStatusFilter(e.target.value as StoreStatusFilter)}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="ALL">All stores</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="BIN">In bin</option>
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sort</span>
                  <select
                    value={storeSort}
                    onChange={(e) => setStoreSort(e.target.value as StoreSortOption)}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="NAME">Name</option>
                    <option value="CITY">City</option>
                    <option value="SALES">Pickup sales</option>
                    <option value="ORDERS">Pickup orders</option>
                  </select>
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setStoreQuery('')
                      setStoreStatusFilter('ALL')
                      setStoreSort('NAME')
                    }}
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold uppercase tracking-widest text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            </AdminFilterCard>

            <AdminSurfacePanel className="overflow-hidden p-0">
              <table className="w-full table-fixed text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-4">Branch</th>
                    <th className="px-4 py-4">Code</th>
                    <th className="px-4 py-4">Location</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4">Pickup Snapshot</th>
                    <th className="px-4 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStores.map((store) => (
                    <tr
                      key={store.id}
                      className={`border-t border-slate-100 align-top transition-colors dark:border-slate-800 ${
                        selectedStoreId === store.id ? 'bg-slate-50/80 dark:bg-slate-800/40' : ''
                      }`}
                    >
                      <td className="px-4 py-5">
                        <button
                          type="button"
                          onClick={() => setSelectedStoreId(store.id)}
                          className="text-left transition hover:opacity-80"
                        >
                          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{store.name}</p>
                        </button>
                        <p className="mt-1 text-sm text-slate-500">{store.phone || store.email || 'Pickup branch profile'}</p>
                      </td>
                      <td className="px-4 py-5 font-mono text-xs text-slate-500">{store.code}</td>
                      <td className="px-4 py-5">{store.city}, {store.state}</td>
                      <td className="px-4 py-5">
                        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${store.deletedAt ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200' : store.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
                          {store.deletedAt ? 'In Bin' : store.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                          <p>{storeSalesMap.get(store.id)?.totalOrders ?? 0} orders</p>
                          <p className="text-xs text-slate-500">${(storeSalesMap.get(store.id)?.grossSales ?? 0).toFixed(2)} sales</p>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex flex-wrap items-center justify-end gap-2">
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
                  {paginatedStores.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-sm text-slate-500">
                        No stores match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <AdminPaginationFooter
                page={branchPage}
                totalPages={branchTotalPages}
                onPrev={() => setBranchPage((prev) => Math.max(1, prev - 1))}
                onNext={() => setBranchPage((prev) => Math.min(branchTotalPages, prev + 1))}
              />
            </AdminSurfacePanel>
          </>
        )}

        {activeTab === 'storeInventory' && (
          <>
            <AdminFilterCard className="space-y-5">
              <div className="grid gap-3 md:grid-cols-[250px_minmax(0,1fr)_180px_auto]">
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Store</span>
                  <select
                    value={selectedStoreId ?? ''}
                    onChange={(e) => setSelectedStoreId(e.target.value || null)}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {activeStores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name} ({store.code})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Search Inventory</span>
                  <input
                    value={inventoryQuery}
                    onChange={(e) => setInventoryQuery(e.target.value)}
                    placeholder="Search book, author, ISBN"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Genre</span>
                  <select
                    value={inventoryGenre}
                    onChange={(e) => setInventoryGenre(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">All genres</option>
                    {availableGenres.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </label>
                <div className="flex items-end">
                  <div className="rounded-full bg-slate-100 px-3 py-3 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    {filteredStoreBooks.length} of {currentStoreBooks.length} titles
                  </div>
                </div>
              </div>
            </AdminFilterCard>

            {selectedStore ? (
              <>
                <AdminSurfacePanel className="space-y-5 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-[1.55rem] font-semibold leading-tight text-slate-900 dark:text-slate-100">{selectedStore.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{selectedStore.city}, {selectedStore.state}</p>
                      <p className="mt-1 text-sm text-slate-400">{selectedStore.phone || selectedStore.email || 'Store contact not added yet'}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${selectedStore.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
                      {selectedStore.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="grid gap-4 border-t border-slate-100 pt-4 text-sm dark:border-slate-800 sm:grid-cols-2 xl:grid-cols-4">
                    <InlineStoreStat label="Titles in stock" value={currentStoreBooks.length} />
                    <InlineStoreStat label="Units on shelves" value={selectedStoreStockUnits} />
                    <InlineStoreStat label="Pickup orders" value={selectedStoreSales?.totalOrders ?? 0} />
                    <InlineStoreStat label="Pickup sales" value={`$${(selectedStoreSales?.grossSales ?? 0).toFixed(2)}`} />
                  </div>
                </AdminSurfacePanel>

                <AdminSurfacePanel className="overflow-hidden p-0">
                  <table className="w-full table-fixed text-sm">
                    <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-4">Book</th>
                        <th className="px-4 py-4">Author</th>
                        <th className="px-4 py-4">ISBN</th>
                        <th className="px-4 py-4">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStoreBooks.map((row) => (
                        <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="px-4 py-4 font-medium leading-6">{row.book.title}</td>
                          <td className="px-4 py-4 text-slate-700 dark:text-slate-200">{row.book.author}</td>
                          <td className="px-4 py-4 text-xs leading-6 text-slate-500">{row.book.isbn}</td>
                          <td className="px-4 py-4 font-semibold">{row.stock}</td>
                        </tr>
                      ))}
                      {paginatedStoreBooks.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-sm text-slate-500">
                            {currentStoreBooks.length === 0
                              ? 'No books currently stocked in this store.'
                              : 'No inventory rows match the current search.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <AdminPaginationFooter
                    page={inventoryPage}
                    totalPages={inventoryTotalPages}
                    onPrev={() => setInventoryPage((prev) => Math.max(1, prev - 1))}
                    onNext={() => setInventoryPage((prev) => Math.min(inventoryTotalPages, prev + 1))}
                  />
                </AdminSurfacePanel>

                <div className="grid gap-4 xl:grid-cols-3">
                  <HighlightRow
                    label="Top book"
                    value={selectedStoreSales?.topBooks[0]?.title || 'No sales yet'}
                    meta={selectedStoreSales?.topBooks[0] ? `${selectedStoreSales.topBooks[0].quantity} units · ${selectedStoreSales.topBooks[0].author}` : 'Waiting for completed pickup sales'}
                  />
                  <HighlightRow
                    label="Top author"
                    value={selectedStoreTopAuthor?.[0] || 'No sales yet'}
                    meta={selectedStoreTopAuthor ? `${selectedStoreTopAuthor[1]} units sold from top titles` : 'Needs sales data from this branch'}
                  />
                  <HighlightRow
                    label="Average order"
                    value={`$${(selectedStoreSales?.avgOrderValue ?? 0).toFixed(2)}`}
                    meta={`${selectedStoreSales?.completedOrders ?? 0} completed pickup order(s)`}
                  />
                </div>
              </>
            ) : (
              <AdminSurfacePanel className="p-6">
                <p className="text-sm text-slate-500">No store selected yet.</p>
              </AdminSurfacePanel>
            )}
          </>
        )}

        {activeTab === 'ranking' && (
          <AdminSurfacePanel className="overflow-hidden p-0">
            <table className="w-full table-fixed text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-4">Store</th>
                  <th className="px-4 py-4">Orders</th>
                  <th className="px-4 py-4">Units</th>
                  <th className="px-4 py-4">Sales</th>
                  <th className="px-4 py-4">Top Book</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTopStores.map((entry) => (
                  <tr key={entry.store.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-4 font-medium">{entry.store.name}</td>
                    <td className="px-4 py-4">{entry.totalOrders}</td>
                    <td className="px-4 py-4">{entry.unitsSold}</td>
                    <td className="px-4 py-4">${entry.grossSales.toFixed(2)}</td>
                    <td className="px-4 py-4 text-xs text-slate-500">{entry.topBooks[0]?.title || '-'}</td>
                  </tr>
                ))}
                {paginatedTopStores.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-sm text-slate-500">No store pickup sales yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <AdminPaginationFooter
              page={rankingPage}
              totalPages={rankingTotalPages}
              onPrev={() => setRankingPage((prev) => Math.max(1, prev - 1))}
              onNext={() => setRankingPage((prev) => Math.min(rankingTotalPages, prev + 1))}
            />
          </AdminSurfacePanel>
        )}
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
  hint: string
}

const MetricCard = ({ label, value, hint }: MetricCardProps) => (
  <AdminSurfacePanel className="min-h-[112px] p-4">
    <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
    <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
    <p className="mt-2 text-xs text-slate-400">{hint}</p>
  </AdminSurfacePanel>
)

type InlineStoreStatProps = {
  label: string
  value: number | string
}

const InlineStoreStat = ({ label, value }: InlineStoreStatProps) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
  </div>
)

type HighlightRowProps = {
  label: string
  value: string
  meta: string
}

const HighlightRow = ({ label, value, meta }: HighlightRowProps) => (
  <AdminSurfacePanel className="space-y-0 p-5">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
    <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    <p className="mt-1 text-sm text-slate-500">{meta}</p>
  </AdminSurfacePanel>
)

type TabButtonProps = {
  label: string
  active: boolean
  onClick: () => void
}

const TabButton = ({ label, active, onClick }: TabButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition ${
      active
        ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900'
        : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`}
  >
    {label}
  </button>
)

export default AdminStoresPage
