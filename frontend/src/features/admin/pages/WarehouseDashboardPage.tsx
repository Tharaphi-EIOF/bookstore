import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Boxes, PackageCheck, RefreshCw } from 'lucide-react'
import { getErrorMessage } from '@/lib/api'
import { useWarehouseAlerts, useWarehouseStocks, useWarehouseTransfers, useWarehouses } from '@/features/admin/services/warehouses'
import WarehouseDashboardStatCard from '@/features/admin/warehouses/components/WarehouseDashboardStatCard'
import WarehouseDeliveryTasksPanel from '@/features/admin/warehouses/components/WarehouseDeliveryTasksPanel'
import WarehouseInventoryTrendCard from '@/features/admin/warehouses/components/WarehouseInventoryTrendCard'
import WarehouseLowStockAlertsPanel from '@/features/admin/warehouses/components/WarehouseLowStockAlertsPanel'
import WarehouseQuickActionsPanel from '@/features/admin/warehouses/components/WarehouseQuickActionsPanel'
import { useCompleteWarehouseDeliveryTask, useWarehouseDeliveryTasks } from '@/services/orders'
import { useTimedMessage } from '@/hooks/useTimedMessage'

const SELECTED_WAREHOUSE_KEY = 'warehouse-dashboard:selected-warehouse'

const WarehouseDashboardPage = () => {
  // Dashboard state for trend range and the persisted warehouse selection.
  const [trendRange, setTrendRange] = useState<7 | 30 | 90>(30)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem(SELECTED_WAREHOUSE_KEY) || ''
  })

  const { data: warehouses = [] } = useWarehouses()
  const { data: alerts = [] } = useWarehouseAlerts('OPEN')
  const { data: transfers = [] } = useWarehouseTransfers(200)
  const selectedWarehouseExists = warehouses.some((warehouse) => warehouse.id === selectedWarehouseId)
  const effectiveWarehouseId = selectedWarehouseExists ? selectedWarehouseId : (warehouses[0]?.id || '')
  const { data: selectedStocks = [] } = useWarehouseStocks(effectiveWarehouseId || undefined)
  const { data: tasks = [] } = useWarehouseDeliveryTasks()
  const completeTask = useCompleteWarehouseDeliveryTask()
  const { message: taskMessage, showMessage: showTaskMessage } = useTimedMessage(2600)

  // Warehouse selection helpers and scoped dashboard datasets.
  const effectiveStocks = selectedStocks

  const onWarehouseChange = (id: string) => {
    setSelectedWarehouseId(id)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SELECTED_WAREHOUSE_KEY, id)
    }
  }

  const scopedAlerts = useMemo(
    () => alerts.filter((item) => !effectiveWarehouseId || item.warehouseId === effectiveWarehouseId),
    [alerts, effectiveWarehouseId],
  )
  const rankedAlerts = useMemo(() => {
    const rank = (stock: number) => {
      if (stock === 0) return 0
      if (stock <= 2) return 1
      return 2
    }
    return [...scopedAlerts].sort((a, b) => rank(a.stock) - rank(b.stock))
  }, [scopedAlerts])

  const deliveryTasks = useMemo(
    () => tasks.filter((task) => task.type === 'order-delivery'),
    [tasks],
  )
  const openDeliveryTasks = useMemo(
    () => deliveryTasks.filter((task) => task.status !== 'COMPLETED'),
    [deliveryTasks],
  )
  const completedDeliveryTasks = useMemo(
    () => deliveryTasks.filter((task) => task.status === 'COMPLETED').slice(0, 8),
    [deliveryTasks],
  )

  const getDeliverySla = (createdAt: string, completedAt?: string | null) => {
    const created = new Date(createdAt)
    const due = new Date(created)
    due.setDate(due.getDate() + 3)
    const now = new Date()
    const finish = completedAt ? new Date(completedAt) : now
    const late = finish.getTime() > due.getTime()
    const msLeft = due.getTime() - now.getTime()
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))

    if (completedAt) {
      return {
        label: late ? 'Completed Late' : 'Completed On Time',
        tone: late
          ? 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-200 dark:bg-rose-900/20 dark:border-rose-800'
          : 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
      }
    }

    if (late) {
      return {
        label: 'Late',
        tone: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-200 dark:bg-rose-900/20 dark:border-rose-800',
      }
    }
    if (daysLeft <= 1) {
      return {
        label: 'Due Soon',
        tone: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
      }
    }
    return {
      label: 'On Time',
      tone: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
    }
  }

  useEffect(() => {
    if (warehouses.length === 0) return
    if (!selectedWarehouseId || !selectedWarehouseExists) {
      onWarehouseChange(warehouses[0].id)
    }
  }, [selectedWarehouseId, selectedWarehouseExists, warehouses])

  // Trend chart data and KPI rollups for the selected warehouse scope.
  const inventoryTrend = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - (trendRange - 1))
    const days = Array.from({ length: trendRange }, (_, index) => {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + index)
      return {
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        incoming: 0,
        outgoing: 0,
      }
    })
    const map = new Map(days.map((d) => [d.key, d]))

    transfers.forEach((transfer) => {
      const key = new Date(transfer.createdAt).toISOString().slice(0, 10)
      const bucket = map.get(key)
      if (!bucket) return
      if (!effectiveWarehouseId) {
        bucket.incoming += transfer.quantity
        bucket.outgoing += transfer.quantity
        return
      }
      if (transfer.toWarehouseId === effectiveWarehouseId) bucket.incoming += transfer.quantity
      if (transfer.fromWarehouseId === effectiveWarehouseId) bucket.outgoing += transfer.quantity
    })

    return days
  }, [transfers, effectiveWarehouseId, trendRange])

  const incoming30 = inventoryTrend.reduce((sum, day) => sum + day.incoming, 0)
  const outgoing30 = inventoryTrend.reduce((sum, day) => sum + day.outgoing, 0)
  const totalSkus = effectiveWarehouseId
    ? effectiveStocks.length
    : warehouses.reduce((sum, warehouse) => sum + (warehouse._count?.stocks ?? 0), 0)
  const activeAlerts = scopedAlerts.length
  const criticalAlerts = scopedAlerts.filter((alert) => alert.stock === 0).length
  const lowStockItems = scopedAlerts.filter((alert) => alert.stock > 0 && alert.stock <= 3).length
  const restockTasksToday = scopedAlerts.length

  const onCompleteDeliveryTask = async (taskId: string) => {
    try {
      await completeTask.mutateAsync(taskId)
      showTaskMessage('Delivery task completed. Linked order status moved to COMPLETED.')
    } catch (error) {
      showTaskMessage(getErrorMessage(error))
    }
  }

  return (
    <div className="p-8 space-y-6 dark:text-slate-100">
      {/* Header, warehouse selector, KPI cards, and dashboard feature panels. */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Warehouse</p>
          <h1 className="text-3xl font-bold">Warehouse Dashboard</h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/50 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/20 dark:text-emerald-300">
          WAREHOUSE STAFF
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/90">
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Selected Warehouse</label>
        <select
          value={effectiveWarehouseId}
          onChange={(e) => onWarehouseChange(e.target.value)}
          className="mt-2 w-full max-w-sm rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name} ({warehouse.code})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <WarehouseDashboardStatCard title="Total SKUs" value={totalSkus} subtitle={effectiveWarehouseId ? 'In selected warehouse' : `Across ${warehouses.length} warehouses`} icon={<Boxes className="h-5 w-5" />} />
        <WarehouseDashboardStatCard title="Low Stock Items" value={lowStockItems} subtitle="Needs restock attention" icon={<AlertTriangle className="h-5 w-5" />} valueClassName="text-amber-600 dark:text-amber-300" />
        <WarehouseDashboardStatCard title="Restock Tasks Today" value={restockTasksToday} subtitle="Open low-stock actions" icon={<RefreshCw className="h-5 w-5" />} />
        <WarehouseDashboardStatCard title="Active Alerts" value={activeAlerts} subtitle="All severities" icon={<PackageCheck className="h-5 w-5" />} valueClassName="text-yellow-600 dark:text-yellow-300" />
        <WarehouseDashboardStatCard title="Critical (0 stock)" value={criticalAlerts} subtitle="Immediate action required" icon={<AlertTriangle className="h-5 w-5" />} valueClassName="text-rose-600 dark:text-rose-300" />
      </div>

      <WarehouseInventoryTrendCard
        trendRange={trendRange}
        setTrendRange={setTrendRange}
        incomingTotal={incoming30}
        outgoingTotal={outgoing30}
        inventoryTrend={inventoryTrend}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <WarehouseDeliveryTasksPanel
          openDeliveryTasks={openDeliveryTasks}
          completedDeliveryTasks={completedDeliveryTasks}
          taskMessage={taskMessage}
          isPending={completeTask.isPending}
          onCompleteDeliveryTask={onCompleteDeliveryTask}
          getDeliverySla={getDeliverySla}
        />
        <WarehouseLowStockAlertsPanel alerts={rankedAlerts} />
        <WarehouseQuickActionsPanel />
      </div>
    </div>
  )
}

export default WarehouseDashboardPage
