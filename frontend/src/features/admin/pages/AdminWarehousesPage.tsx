import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { useBooks } from '@/services/books'
import { getErrorMessage } from '@/lib/api'
import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/store/auth.store'
import {
  useCreateWarehouse,
  useDeleteWarehouse,
  useSetWarehouseStock,
  useTransferWarehouseStock,
  useWarehouseAlerts,
  useWarehouseTransfers,
  useWarehouseStocks,
  useUpdateWarehouse,
  useWarehouses,
  type WarehouseAlert,
  type WarehouseAlertStatus,
} from '@/features/admin/services/warehouses'
import CreateWarehousePanel from '@/features/admin/warehouses/components/CreateWarehousePanel'
import WarehouseAlertsPanel from '@/features/admin/warehouses/components/WarehouseAlertsPanel'
import WarehouseHistoryPanel from '@/features/admin/warehouses/components/WarehouseHistoryPanel'
import WarehouseSettingsPanel from '@/features/admin/warehouses/components/WarehouseSettingsPanel'
import WarehouseStockPanel from '@/features/admin/warehouses/components/WarehouseStockPanel'
import WarehouseTransferPanel from '@/features/admin/warehouses/components/WarehouseTransferPanel'
import { useTimedMessage } from '@/hooks/useTimedMessage'

type WarehouseActionTab = 'overview' | 'stock' | 'transfer' | 'alerts' | 'settings'

const AdminWarehousesPage = () => {
  // Permission checks and page-level state for warehouse operations.
  const user = useAuthStore((state) => state.user)
  const canUpdateWarehouseStock =
    user?.role === 'ADMIN'
    || user?.role === 'SUPER_ADMIN'
    || hasPermission(user?.permissions, 'warehouse.stock.update')
  const canManageWarehouseEntity = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const canTransferWarehouse =
    user?.role === 'ADMIN'
    || user?.role === 'SUPER_ADMIN'
    || hasPermission(user?.permissions, 'warehouse.transfer')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<WarehouseActionTab>('overview')
  const { message, showMessage } = useTimedMessage(2400)
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)
  const [alertStatus, setAlertStatus] = useState<WarehouseAlertStatus>('OPEN')

  const [newWarehouse, setNewWarehouse] = useState({
    name: '',
    code: '',
    city: '',
    state: '',
    address: '',
  })

  const [stockBookSearch, setStockBookSearch] = useState('')
  const [transferBookSearch, setTransferBookSearch] = useState('')

  const [stockForm, setStockForm] = useState({
    bookId: '',
    stock: '0',
    lowStockThreshold: '5',
  })

  const [transferForm, setTransferForm] = useState({
    bookId: '',
    fromWarehouseId: '',
    toWarehouseId: '',
    quantity: '1',
    note: '',
  })

  const [warehouseEdit, setWarehouseEdit] = useState({
    name: '',
    code: '',
    city: '',
    state: '',
    address: '',
    isActive: true,
  })

  const { data: warehouses = [], isLoading } = useWarehouses()
  const { data: stockSearchResults } = useBooks({ page: 1, limit: 50, title: stockBookSearch || undefined, status: 'active' })
  const { data: transferSearchResults } = useBooks({ page: 1, limit: 50, title: transferBookSearch || undefined, status: 'active' })
  const { data: stocks = [] } = useWarehouseStocks(selectedWarehouseId || undefined)
  const { data: alerts = [] } = useWarehouseAlerts(alertStatus)
  const { data: transfers = [] } = useWarehouseTransfers(50)

  const createWarehouse = useCreateWarehouse()
  const deleteWarehouse = useDeleteWarehouse()
  const updateWarehouse = useUpdateWarehouse()
  const setStock = useSetWarehouseStock()
  const transferStock = useTransferWarehouseStock()
  const selectedWarehousePanelRef = useRef<HTMLDivElement | null>(null)

  // Derived warehouse selections, alert summaries, and focused stock rows.
  const selectedWarehouse = useMemo(
    () => warehouses.find((w) => w.id === selectedWarehouseId),
    [warehouses, selectedWarehouseId],
  )
  const sortedAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => {
      const aRank = a.stock <= 0 ? 3 : a.stock <= Math.ceil(a.threshold * 0.5) ? 2 : 1
      const bRank = b.stock <= 0 ? 3 : b.stock <= Math.ceil(b.threshold * 0.5) ? 2 : 1
      if (aRank !== bRank) return bRank - aRank
      return a.stock - b.stock
    })
  }, [alerts])

  const filteredTransfers = useMemo(
    () => transfers.filter((transfer) =>
      transfer.fromWarehouseId === selectedWarehouseId
      || transfer.toWarehouseId === selectedWarehouseId,
    ),
    [transfers, selectedWarehouseId],
  )

  const stockBookOptions = stockSearchResults?.books ?? []
  const transferBookOptions = transferSearchResults?.books ?? []

  const selectedStockBook = useMemo(
    () => stockBookOptions.find((book) => book.id === stockForm.bookId),
    [stockBookOptions, stockForm.bookId],
  )
  const selectedTransferBook = useMemo(
    () => transferBookOptions.find((book) => book.id === transferForm.bookId),
    [transferBookOptions, transferForm.bookId],
  )
  const selectedStockRow = useMemo(
    () => stocks.find((row) => row.bookId === stockForm.bookId),
    [stocks, stockForm.bookId],
  )
  const selectedWarehouseAlerts = useMemo(
    () => alerts.filter((alert) => alert.warehouseId === selectedWarehouseId),
    [alerts, selectedWarehouseId],
  )
  const selectedCriticalAlerts = selectedWarehouseAlerts.filter((alert) => alert.stock <= 0).length
  const selectedLowAlerts = selectedWarehouseAlerts.filter((alert) => alert.stock > 0).length
  const selectedTransferCount = filteredTransfers.length

  // Keep selection and edit forms aligned with the currently focused warehouse.
  useEffect(() => {
    if (!selectedWarehouseId && warehouses.length > 0) {
      setSelectedWarehouseId(warehouses[0].id)
      setTransferForm((prev) => ({ ...prev, fromWarehouseId: warehouses[0].id }))
    }
  }, [selectedWarehouseId, warehouses])

  useEffect(() => {
    if (!selectedWarehouse) {
      setWarehouseEdit({
        name: '',
        code: '',
        city: '',
        state: '',
        address: '',
        isActive: true,
      })
      return
    }

    setWarehouseEdit({
      name: selectedWarehouse.name,
      code: selectedWarehouse.code,
      city: selectedWarehouse.city,
      state: selectedWarehouse.state,
      address: selectedWarehouse.address || '',
      isActive: selectedWarehouse.isActive,
    })
    setTransferForm((prev) => ({ ...prev, fromWarehouseId: selectedWarehouse.id }))
  }, [selectedWarehouse])

  const getAlertSeverity = (stock: number, threshold: number) => {
    if (stock <= 0) return { label: 'CRITICAL', dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-300' }
    if (stock <= Math.ceil(threshold * 0.5)) return { label: 'HIGH', dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300' }
    return { label: 'MEDIUM', dot: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-300' }
  }

  // CRUD and stock-movement handlers for the warehouse workspace.
  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageWarehouseEntity) return

    if (!newWarehouse.name || !newWarehouse.code || !newWarehouse.city || !newWarehouse.state) {
      showMessage('Name, code, city, and state are required.')
      return
    }

    try {
      await createWarehouse.mutateAsync({
        ...newWarehouse,
        address: newWarehouse.address || undefined,
      })
      setNewWarehouse({ name: '', code: '', city: '', state: '', address: '' })
      setIsCreatePanelOpen(false)
      showMessage('Warehouse created.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const handleDeleteWarehouse = async (warehouseId: string) => {
    if (!canManageWarehouseEntity) return

    try {
      await deleteWarehouse.mutateAsync(warehouseId)
      if (selectedWarehouseId === warehouseId) {
        setSelectedWarehouseId('')
      }
      showMessage('Warehouse deleted.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const handleUpdateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageWarehouseEntity || !selectedWarehouseId) return

    if (!warehouseEdit.name || !warehouseEdit.code || !warehouseEdit.city || !warehouseEdit.state) {
      showMessage('Name, code, city, and state are required.')
      return
    }

    try {
      await updateWarehouse.mutateAsync({
        id: selectedWarehouseId,
        data: {
          name: warehouseEdit.name,
          code: warehouseEdit.code,
          city: warehouseEdit.city,
          state: warehouseEdit.state,
          address: warehouseEdit.address || '',
          isActive: warehouseEdit.isActive,
        },
      })
      showMessage('Warehouse updated.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const chooseStockBook = (bookId: string, label: string) => {
    setStockForm((prev) => ({ ...prev, bookId }))
    setStockBookSearch(label)
    const existing = stocks.find((row) => row.bookId === bookId)
    if (existing) {
      setStockForm((prev) => ({
        ...prev,
        stock: String(existing.stock),
        lowStockThreshold: String(existing.lowStockThreshold),
      }))
    }
  }

  const chooseTransferBook = (bookId: string, label: string) => {
    setTransferForm((prev) => ({ ...prev, bookId }))
    setTransferBookSearch(label)
  }

  const focusAlertInStockPanel = (alert: WarehouseAlert) => {
    setSelectedWarehouseId(alert.warehouseId)
    setActiveTab('stock')
    setStockBookSearch(alert.book.title)
    setStockForm((prev) => ({
      ...prev,
      bookId: alert.bookId,
      stock: String(alert.stock),
      lowStockThreshold: String(alert.threshold),
    }))
    requestAnimationFrame(() => {
      selectedWarehousePanelRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }

  const handleSetStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canUpdateWarehouseStock) return

    if (!selectedWarehouseId || !stockForm.bookId) {
      showMessage('Select warehouse and book first.')
      return
    }

    const stock = Number(stockForm.stock)
    const lowStockThreshold = Number(stockForm.lowStockThreshold)

    if (Number.isNaN(stock) || stock < 0) {
      showMessage('Stock must be a valid non-negative number.')
      return
    }
    if (Number.isNaN(lowStockThreshold) || lowStockThreshold < 1) {
      showMessage('Low-stock threshold must be at least 1.')
      return
    }
    if (selectedStockRow && selectedStockRow.stock === stock && selectedStockRow.lowStockThreshold === lowStockThreshold) {
      showMessage('No changes detected. Update quantity or threshold first.')
      return
    }

    try {
      const previousStock = selectedStockRow?.stock
      const previousThreshold = selectedStockRow?.lowStockThreshold
      await setStock.mutateAsync({
        warehouseId: selectedWarehouseId,
        bookId: stockForm.bookId,
        stock,
        lowStockThreshold,
      })
      if (previousStock === undefined || previousThreshold === undefined) {
        showMessage(`Stock row created: stock ${stock}, threshold ${lowStockThreshold}.`)
      } else {
        showMessage(`Saved: stock ${previousStock} -> ${stock}, threshold ${previousThreshold} -> ${lowStockThreshold}.`)
      }
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canTransferWarehouse) return

    const quantity = Number(transferForm.quantity)
    if (!transferForm.bookId || !transferForm.fromWarehouseId || !transferForm.toWarehouseId) {
      showMessage('Book and both warehouses are required.')
      return
    }
    if (transferForm.fromWarehouseId === transferForm.toWarehouseId) {
      showMessage('Source and destination must be different.')
      return
    }
    if (Number.isNaN(quantity) || quantity < 1) {
      showMessage('Quantity must be at least 1.')
      return
    }

    try {
      await transferStock.mutateAsync({
        bookId: transferForm.bookId,
        fromWarehouseId: transferForm.fromWarehouseId,
        toWarehouseId: transferForm.toWarehouseId,
        quantity,
        note: transferForm.note || undefined,
      })
      showMessage('Transfer created.')
      setTransferForm((prev) => ({ ...prev, quantity: '1', note: '' }))
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const actionTabs: Array<{ key: WarehouseActionTab; label: string; visible: boolean }> = [
    { key: 'overview', label: 'Overview', visible: true },
    { key: 'stock', label: 'Stock Adjustment', visible: canUpdateWarehouseStock },
    { key: 'transfer', label: 'Transfers', visible: canTransferWarehouse || filteredTransfers.length > 0 },
    { key: 'alerts', label: 'Alerts', visible: true },
    { key: 'settings', label: 'Warehouse Details', visible: canManageWarehouseEntity },
  ]
  const visibleTabs = actionTabs.filter((tab) => tab.visible)

  return (
    <div className="surface-canvas min-h-screen space-y-6 p-8 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
      {/* Header, warehouse rail, mode switcher, and focused action workspace. */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Warehouse Management</h1>
        </div>
        {canManageWarehouseEntity && (
          <button
            type="button"
            onClick={() => setIsCreatePanelOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.99] dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
          >
            <Plus className="h-4 w-4" />
            Create Warehouse
          </button>
        )}
      </div>

      {message && (
        <div className="surface-subtle px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
          {message}
        </div>
      )}

      <CreateWarehousePanel
        isOpen={isCreatePanelOpen}
        setIsOpen={setIsCreatePanelOpen}
        newWarehouse={newWarehouse}
        setNewWarehouse={setNewWarehouse}
        isPending={createWarehouse.isPending}
        onSubmit={handleCreateWarehouse}
      />

      {selectedWarehouse && (
        <div
          ref={selectedWarehousePanelRef}
          className="space-y-6"
        >
          <section className="surface-panel p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-[280px] flex-1">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Warehouse
                </label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  disabled={isLoading || warehouses.length === 0}
                  className="h-12 w-full rounded-[18px] border border-slate-200/80 bg-white/90 px-4 text-sm font-medium text-slate-800 transition focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-slate-700 dark:focus:ring-slate-800"
                >
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} • {warehouse.code} • {warehouse.city}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canManageWarehouseEntity && selectedWarehouse && (
                  <button
                    type="button"
                    onClick={() => void handleDeleteWarehouse(selectedWarehouse.id)}
                    className="inline-flex h-12 items-center rounded-[18px] border border-rose-200/80 bg-white px-4 text-xs font-semibold uppercase tracking-widest text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 dark:border-rose-900/60 dark:bg-slate-950 dark:text-rose-300 dark:hover:bg-rose-950/30"
                  >
                    Delete Warehouse
                  </button>
                )}
              </div>
            </div>
          </section>

          <section
            className="space-y-6"
          >
            <section className="space-y-5 px-1">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedWarehouse.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedWarehouse.code} • {selectedWarehouse.city}, {selectedWarehouse.state}
                    {selectedWarehouse.address ? ` • ${selectedWarehouse.address}` : ''}
                  </p>
                </div>
                <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest ${
                  selectedWarehouse.isActive
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {selectedWarehouse.isActive ? 'Active warehouse' : 'Inactive warehouse'}
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('alerts')}
                  className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900"
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Critical Alerts</p>
                  <p className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-300">{selectedCriticalAlerts}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('stock')}
                  className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900"
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Low Stock</p>
                  <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-300">{selectedLowAlerts}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('transfer')}
                  className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900"
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Transfers</p>
                  <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">{selectedTransferCount}</p>
                </button>
              </div>
            </section>

            <section className="surface-panel p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Workspace</h3>
                <div className="surface-subtle flex flex-wrap items-center gap-1 bg-slate-50 p-1 dark:bg-slate-800/40">
                  {visibleTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-all duration-150 ${
                        activeTab === tab.key
                          ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-amber-300'
                          : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900/60'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                {activeTab === 'overview' && (
                  <div className="grid gap-4 xl:grid-cols-2">
                    <WarehouseAlertsPanel
                      alertStatus={alertStatus}
                      alerts={selectedWarehouseAlerts}
                      sortedAlerts={sortedAlerts.filter((alert) => alert.warehouseId === selectedWarehouseId)}
                      canUpdateWarehouseStock={canUpdateWarehouseStock}
                      onAlertStatusChange={setAlertStatus}
                      onFocusAlertInStockPanel={focusAlertInStockPanel}
                      getAlertSeverity={getAlertSeverity}
                    />
                    <WarehouseHistoryPanel filteredTransfers={filteredTransfers.slice(0, 8)} />
                  </div>
                )}

                {activeTab === 'alerts' && (
                  <WarehouseAlertsPanel
                    alertStatus={alertStatus}
                    alerts={selectedWarehouseAlerts}
                    sortedAlerts={sortedAlerts.filter((alert) => alert.warehouseId === selectedWarehouseId)}
                    canUpdateWarehouseStock={canUpdateWarehouseStock}
                    onAlertStatusChange={setAlertStatus}
                    onFocusAlertInStockPanel={focusAlertInStockPanel}
                    getAlertSeverity={getAlertSeverity}
                  />
                )}

                {activeTab === 'settings' && canManageWarehouseEntity && (
                  <WarehouseSettingsPanel
                    warehouseEdit={warehouseEdit}
                    setWarehouseEdit={setWarehouseEdit}
                    isPending={updateWarehouse.isPending}
                    onSubmit={handleUpdateWarehouse}
                  />
                )}

                {activeTab === 'stock' && canUpdateWarehouseStock && (
                  <WarehouseStockPanel
                    selectedWarehouseId={selectedWarehouseId}
                    stockBookSearch={stockBookSearch}
                    setStockBookSearch={setStockBookSearch}
                    stockForm={stockForm}
                    setStockForm={setStockForm}
                    stockBookOptions={stockBookOptions}
                    selectedStockBook={selectedStockBook}
                    selectedStockRow={selectedStockRow}
                    stocks={stocks}
                    isPending={setStock.isPending}
                    onChooseStockBook={chooseStockBook}
                    onSubmit={handleSetStock}
                  />
                )}

                {activeTab === 'transfer' && (
                  <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    {canTransferWarehouse ? (
                      <WarehouseTransferPanel
                        warehouses={warehouses}
                        transferBookSearch={transferBookSearch}
                        setTransferBookSearch={setTransferBookSearch}
                        transferForm={transferForm}
                        setTransferForm={setTransferForm}
                        transferBookOptions={transferBookOptions}
                        selectedTransferBook={selectedTransferBook}
                        isPending={transferStock.isPending}
                        onChooseTransferBook={chooseTransferBook}
                        onSubmit={handleTransfer}
                      />
                    ) : (
                      <div className="surface-subtle rounded-2xl p-4 text-sm text-slate-500">
                        You can review transfers for this warehouse, but you do not have permission to create new ones.
                      </div>
                    )}
                    <WarehouseHistoryPanel filteredTransfers={filteredTransfers} />
                  </div>
                )}
              </div>
            </section>
          </section>
        </div>
      )}
      </div>
    </div>
  )
}

export default AdminWarehousesPage
