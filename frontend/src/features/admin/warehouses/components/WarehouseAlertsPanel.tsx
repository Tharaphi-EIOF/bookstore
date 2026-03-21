import { Link } from 'react-router-dom'
import type { WarehouseAlert, WarehouseAlertStatus } from '@/features/admin/services/warehouses'

type AlertSeverity = {
  label: string
  dot: string
  text: string
}

type WarehouseAlertsPanelProps = {
  alertStatus: WarehouseAlertStatus
  alerts: WarehouseAlert[]
  sortedAlerts: WarehouseAlert[]
  canUpdateWarehouseStock: boolean
  onAlertStatusChange: (status: WarehouseAlertStatus) => void
  onFocusAlertInStockPanel: (alert: WarehouseAlert) => void
  getAlertSeverity: (stock: number, threshold: number) => AlertSeverity
}

const WarehouseAlertsPanel = ({
  alertStatus,
  alerts,
  sortedAlerts,
  canUpdateWarehouseStock,
  onAlertStatusChange,
  onFocusAlertInStockPanel,
  getAlertSeverity,
}: WarehouseAlertsPanelProps) => (
  <div className="surface-panel p-5">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Low Stock Alerts</h2>
      <select
        value={alertStatus}
        onChange={(event) => onAlertStatusChange(event.target.value as WarehouseAlertStatus)}
        className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-600 dark:border-slate-700 dark:bg-slate-900/70"
      >
        <option value="OPEN">Open</option>
        <option value="RESOLVED">Resolved</option>
      </select>
    </div>
    <div className="surface-subtle mt-4 max-h-64 overflow-auto bg-slate-50/40 dark:bg-slate-950/30">
      {alerts.length === 0 && <p className="px-3 py-4 text-sm text-slate-500">No alerts in this status.</p>}
      {sortedAlerts.map((alert) => {
        const severity = getAlertSeverity(alert.stock, alert.threshold)

        return (
          <div
            key={alert.id}
            className="w-full border-b border-slate-200/60 px-3 py-2 text-left text-sm last:border-b-0 dark:border-slate-800"
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold">{alert.book.title}</p>
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest ${severity.text}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${severity.dot}`} />
                {severity.label}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {alert.warehouse.code} • stock {alert.stock} / threshold {alert.threshold}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onFocusAlertInStockPanel(alert)}
                disabled={!canUpdateWarehouseStock}
                className="rounded border border-slate-300 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Adjust Stock
              </button>
              <Link
                to={`/admin/purchase-requests?warehouseId=${alert.warehouseId}&bookId=${alert.bookId}`}
                className="rounded border border-blue-300 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-blue-700 transition-colors hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-950/40"
              >
                Create Request
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  </div>
)

export default WarehouseAlertsPanel
