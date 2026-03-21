import { Link } from 'react-router-dom'

const WarehouseQuickActionsPanel = () => {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Quick Actions</h2>
      <div className="mt-4 grid gap-3">
        <Link to="/admin/warehouses" className="rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-150 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
          Adjust Stock
        </Link>
        <Link to="/admin/warehouses" className="rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-150 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
          Transfer Stock
        </Link>
        <Link to="/admin/purchase-requests" className="rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-150 hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
          Create Purchase Request
        </Link>
      </div>
    </div>
  )
}

export default WarehouseQuickActionsPanel
