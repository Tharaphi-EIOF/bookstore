import type { WarehouseAlert } from '@/features/admin/services/warehouses'

const getAlertSeverity = (stock: number) => {
  if (stock === 0) {
    return {
      label: 'Critical',
      dot: 'bg-rose-500',
      text: 'text-rose-700 dark:text-rose-300',
    }
  }
  if (stock <= 2) {
    return {
      label: 'High',
      dot: 'bg-amber-500',
      text: 'text-amber-700 dark:text-amber-300',
    }
  }
  return {
    label: 'Medium',
    dot: 'bg-yellow-500',
    text: 'text-yellow-700 dark:text-yellow-300',
  }
}

interface WarehouseLowStockAlertsPanelProps {
  alerts: WarehouseAlert[]
}

const WarehouseLowStockAlertsPanel = ({ alerts }: WarehouseLowStockAlertsPanelProps) => {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Low Stock Alerts</h2>
      <div className="mt-4 max-h-72 overflow-auto divide-y rounded-xl border border-slate-200/70 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/30">
        {alerts.length === 0 && <p className="text-sm text-slate-500">No open low-stock alerts.</p>}
        {alerts.map((alert) => {
          const severity = getAlertSeverity(alert.stock)
          return (
            <div key={alert.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-semibold">{alert.book.title}</p>
                <p className="text-xs text-slate-500">
                  {alert.warehouse.code} • stock {alert.stock} / threshold {alert.threshold}
                </p>
              </div>
              <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${severity.text}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${severity.dot}`} />
                {severity.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default WarehouseLowStockAlertsPanel
