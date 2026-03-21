import type { Dispatch, FormEventHandler, SetStateAction } from 'react'
import type { Warehouse } from '@/features/admin/services/warehouses'

type WarehouseBookOption = {
  id: string
  title: string
  author: string
}

type TransferFormState = {
  bookId: string
  fromWarehouseId: string
  toWarehouseId: string
  quantity: string
  note: string
}

interface WarehouseTransferPanelProps {
  warehouses: Warehouse[]
  transferBookSearch: string
  setTransferBookSearch: Dispatch<SetStateAction<string>>
  transferForm: TransferFormState
  setTransferForm: Dispatch<SetStateAction<TransferFormState>>
  transferBookOptions: WarehouseBookOption[]
  selectedTransferBook?: WarehouseBookOption
  isPending: boolean
  onChooseTransferBook: (bookId: string, label: string) => void
  onSubmit: FormEventHandler<HTMLFormElement>
}

const WarehouseTransferPanel = ({
  warehouses,
  transferBookSearch,
  setTransferBookSearch,
  transferForm,
  setTransferForm,
  transferBookOptions,
  selectedTransferBook,
  isPending,
  onChooseTransferBook,
  onSubmit,
}: WarehouseTransferPanelProps) => {
  return (
    <form onSubmit={onSubmit} className="surface-subtle p-4">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Transfer Stock</h3>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <input
            value={transferBookSearch}
            onChange={(e) => {
              setTransferBookSearch(e.target.value)
              setTransferForm((prev) => ({ ...prev, bookId: '' }))
            }}
            placeholder="Search book by title"
            className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
          />
          {transferBookSearch.length > 0 && (
            <div className="mt-2 max-h-44 space-y-1 overflow-auto rounded-lg border border-slate-200 bg-white/65 p-2 dark:border-slate-700 dark:bg-slate-900/55">
              {transferBookOptions.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => onChooseTransferBook(book.id, book.title)}
                  className={`w-full rounded px-2 py-1 text-left text-sm ${
                    transferForm.bookId === book.id ? 'bg-amber-100 dark:bg-amber-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="font-medium">{book.title}</p>
                  <p className="text-xs text-slate-500">{book.author}</p>
                </button>
              ))}
              {transferBookOptions.length === 0 && <p className="text-xs text-slate-500">No matching books. Try title keywords.</p>}
            </div>
          )}
          {transferForm.bookId && (
            <p className="mt-2 text-xs text-slate-500">
              Selected: {selectedTransferBook ? `${selectedTransferBook.title} • ${selectedTransferBook.author}` : transferBookSearch}
            </p>
          )}
        </div>

        <select
          value={transferForm.fromWarehouseId}
          onChange={(e) => setTransferForm((prev) => ({ ...prev, fromWarehouseId: e.target.value }))}
          className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
        >
          <option value="">From warehouse</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
          ))}
        </select>
        <select
          value={transferForm.toWarehouseId}
          onChange={(e) => setTransferForm((prev) => ({ ...prev, toWarehouseId: e.target.value }))}
          className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
        >
          <option value="">To warehouse</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={transferForm.quantity}
          onChange={(e) => setTransferForm((prev) => ({ ...prev, quantity: e.target.value }))}
          placeholder="Quantity"
          className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
        />
        <input
          value={transferForm.note}
          onChange={(e) => setTransferForm((prev) => ({ ...prev, note: e.target.value }))}
          placeholder="Note (optional)"
          className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900"
      >
        {isPending ? 'Transferring...' : 'Create Transfer'}
      </button>
    </form>
  )
}

export default WarehouseTransferPanel
