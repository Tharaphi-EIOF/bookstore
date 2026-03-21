import type { Warehouse } from '@/features/admin/services/warehouses'

type WarehouseAlertSummary = {
  critical: number
  low: number
}

type WarehouseListSectionProps = {
  isLoading: boolean
  warehouses: Warehouse[]
  selectedWarehouseId: string
  canManageWarehouseEntity: boolean
  warehouseAlertStats: Map<string, WarehouseAlertSummary>
  onSelectWarehouse: (warehouseId: string) => void
  onDeleteWarehouse: (warehouseId: string) => Promise<void>
}

const WarehouseListSection = ({
  isLoading,
  warehouses,
  selectedWarehouseId,
  canManageWarehouseEntity,
  warehouseAlertStats,
  onSelectWarehouse,
  onDeleteWarehouse,
}: WarehouseListSectionProps) => (
  <div className="surface-panel p-5">
    <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">Warehouses</h2>
    {isLoading ? (
      <p className="text-sm text-slate-500">Loading warehouses...</p>
    ) : (
      <div className="space-y-2">
        {warehouses.map((warehouse) => (
          <div
            key={warehouse.id}
            className={`rounded-2xl border p-3 transition ${
              selectedWarehouseId === warehouse.id
                ? 'border-amber-300 bg-amber-50/70 dark:border-amber-500/70 dark:bg-amber-900/20'
                : 'border-slate-200/80 bg-white/75 dark:border-slate-800 dark:bg-slate-900/60'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => onSelectWarehouse(warehouse.id)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    (warehouseAlertStats.get(warehouse.id)?.critical ?? 0) > 0
                      ? 'bg-rose-500'
                      : (warehouseAlertStats.get(warehouse.id)?.low ?? 0) > 0
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`} />
                  <p className="truncate font-semibold text-slate-900 dark:text-slate-100">{warehouse.name}</p>
                </div>
                <p className="mt-1 text-xs text-slate-500">{warehouse.code} • {warehouse.city}, {warehouse.state}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {warehouse._count?.stocks ?? 0} stock rows • {warehouseAlertStats.get(warehouse.id)?.critical ?? 0} critical • {warehouseAlertStats.get(warehouse.id)?.low ?? 0} low
                </p>
              </button>

              {canManageWarehouseEntity && (
                <button
                  type="button"
                  onClick={() => void onDeleteWarehouse(warehouse.id)}
                  className="shrink-0 rounded-lg border border-rose-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-rose-600 transition hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-300 dark:hover:bg-rose-950/30"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)

export default WarehouseListSection
