import type { Dispatch, FormEventHandler, SetStateAction } from 'react'

type WarehouseEditState = {
  name: string
  code: string
  city: string
  state: string
  address: string
  isActive: boolean
}

interface WarehouseSettingsPanelProps {
  warehouseEdit: WarehouseEditState
  setWarehouseEdit: Dispatch<SetStateAction<WarehouseEditState>>
  isPending: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
}

const WarehouseSettingsPanel = ({
  warehouseEdit,
  setWarehouseEdit,
  isPending,
  onSubmit,
}: WarehouseSettingsPanelProps) => {
  return (
    <form onSubmit={onSubmit} className="surface-subtle p-4">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Edit Warehouse Details</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          value={warehouseEdit.name}
          onChange={(e) => setWarehouseEdit((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Name"
          className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
        />
        <input
          value={warehouseEdit.code}
          onChange={(e) => setWarehouseEdit((prev) => ({ ...prev, code: e.target.value }))}
          placeholder="Code"
          className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
        />
        <input
          value={warehouseEdit.city}
          onChange={(e) => setWarehouseEdit((prev) => ({ ...prev, city: e.target.value }))}
          placeholder="City"
          className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
        />
        <input
          value={warehouseEdit.state}
          onChange={(e) => setWarehouseEdit((prev) => ({ ...prev, state: e.target.value }))}
          placeholder="State"
          className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
        />
        <input
          value={warehouseEdit.address}
          onChange={(e) => setWarehouseEdit((prev) => ({ ...prev, address: e.target.value }))}
          placeholder="Address (optional)"
          className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm sm:col-span-2 dark:border-slate-700 dark:bg-slate-900/70"
        />
      </div>
      <label className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          checked={warehouseEdit.isActive}
          onChange={(e) => setWarehouseEdit((prev) => ({ ...prev, isActive: e.target.checked }))}
        />
        Active
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="mt-4 block rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900"
      >
        {isPending ? 'Saving...' : 'Save Warehouse'}
      </button>
    </form>
  )
}

export default WarehouseSettingsPanel
