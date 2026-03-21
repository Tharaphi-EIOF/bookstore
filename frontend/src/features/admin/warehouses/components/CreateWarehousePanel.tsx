import type { Dispatch, FormEvent, SetStateAction } from 'react'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'

type NewWarehouseForm = {
  name: string
  code: string
  city: string
  state: string
  address: string
}

type CreateWarehousePanelProps = {
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
  newWarehouse: NewWarehouseForm
  setNewWarehouse: Dispatch<SetStateAction<NewWarehouseForm>>
  isPending: boolean
  onSubmit: (event: FormEvent) => void
}

const CreateWarehousePanel = ({
  isOpen,
  setIsOpen,
  newWarehouse,
  setNewWarehouse,
  isPending,
  onSubmit,
}: CreateWarehousePanelProps) => (
  <AdminSlideOverPanel
    open={isOpen}
    onClose={() => setIsOpen(false)}
    kicker="Warehouse"
    title="Create Warehouse"
    description="Add a new warehouse location for stock and transfer operations."
    footer={(
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="create-warehouse-form"
          disabled={isPending}
          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
        >
          {isPending ? 'Creating...' : 'Create Warehouse'}
        </button>
      </div>
    )}
  >
    <form
      id="create-warehouse-form"
      onSubmit={onSubmit}
      className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/45"
    >
      <input
        placeholder="Name"
        value={newWarehouse.name}
        onChange={(event) => setNewWarehouse((prev) => ({ ...prev, name: event.target.value }))}
        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
      />
      <input
        placeholder="Code"
        value={newWarehouse.code}
        onChange={(event) => setNewWarehouse((prev) => ({ ...prev, code: event.target.value }))}
        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
      />
      <input
        placeholder="City"
        value={newWarehouse.city}
        onChange={(event) => setNewWarehouse((prev) => ({ ...prev, city: event.target.value }))}
        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
      />
      <input
        placeholder="State"
        value={newWarehouse.state}
        onChange={(event) => setNewWarehouse((prev) => ({ ...prev, state: event.target.value }))}
        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
      />
      <input
        placeholder="Address (optional)"
        value={newWarehouse.address}
        onChange={(event) => setNewWarehouse((prev) => ({ ...prev, address: event.target.value }))}
        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
      />
    </form>
  </AdminSlideOverPanel>
)

export default CreateWarehousePanel
