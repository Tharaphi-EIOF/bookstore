import type { WarehouseTransfer } from '@/features/admin/services/warehouses'

interface WarehouseHistoryPanelProps {
  filteredTransfers: WarehouseTransfer[]
}

const WarehouseHistoryPanel = ({ filteredTransfers }: WarehouseHistoryPanelProps) => {
  return (
    <div className="surface-subtle p-4">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Transfer History</h3>
      <div className="mt-4 max-h-80 space-y-2 overflow-auto">
        {filteredTransfers.length === 0 && <p className="text-sm text-slate-500">No transfers for this warehouse yet.</p>}
        {filteredTransfers.map((transfer) => (
          <div key={transfer.id} className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/65">
            <p className="font-medium text-slate-800 dark:text-slate-100">
              {transfer.book.title} • {transfer.quantity} units
            </p>
            <p className="text-xs text-slate-500">
              {transfer.fromWarehouse.code} → {transfer.toWarehouse.code} • {new Date(transfer.createdAt).toLocaleString()}
            </p>
            {transfer.note && <p className="mt-1 text-xs text-slate-500">Note: {transfer.note}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default WarehouseHistoryPanel
