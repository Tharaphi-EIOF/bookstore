import type { Dispatch, FormEventHandler, SetStateAction } from 'react'
import { Link } from 'react-router-dom'
import type { WarehouseStockRow } from '@/features/admin/services/warehouses'

type WarehouseBookOption = {
  id: string
  title: string
  author: string
  stock: number
}

type StockFormState = {
  bookId: string
  stock: string
  lowStockThreshold: string
}

interface WarehouseStockPanelProps {
  selectedWarehouseId: string
  stockBookSearch: string
  setStockBookSearch: Dispatch<SetStateAction<string>>
  stockForm: StockFormState
  setStockForm: Dispatch<SetStateAction<StockFormState>>
  stockBookOptions: WarehouseBookOption[]
  selectedStockBook?: WarehouseBookOption
  selectedStockRow?: WarehouseStockRow
  stocks: WarehouseStockRow[]
  isPending: boolean
  onChooseStockBook: (bookId: string, label: string) => void
  onSubmit: FormEventHandler<HTMLFormElement>
}

const WarehouseStockPanel = ({
  selectedWarehouseId,
  stockBookSearch,
  setStockBookSearch,
  stockForm,
  setStockForm,
  stockBookOptions,
  selectedStockBook,
  selectedStockRow,
  stocks,
  isPending,
  onChooseStockBook,
  onSubmit,
}: WarehouseStockPanelProps) => {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="surface-subtle p-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Stock Adjustment</h3>
        <p className="mt-1 text-xs text-slate-500">Set the new on-hand quantity for the selected book in this warehouse.</p>
        <div className="mt-4 space-y-3">
          <input
            value={stockBookSearch}
            onChange={(e) => {
              setStockBookSearch(e.target.value)
              setStockForm((prev) => ({ ...prev, bookId: '' }))
            }}
            placeholder="Search book by title"
            className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
          />
          {stockBookSearch.length > 0 && (
            <div className="max-h-44 space-y-1 overflow-auto rounded-lg border border-slate-200 bg-white/65 p-2 dark:border-slate-700 dark:bg-slate-900/55">
              {stockBookOptions.map((book) => (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => onChooseStockBook(book.id, book.title)}
                  className={`w-full rounded px-2 py-1 text-left text-sm ${
                    stockForm.bookId === book.id ? 'bg-amber-100 dark:bg-amber-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="font-medium">{book.title}</p>
                  <p className="text-xs text-slate-500">{book.author}</p>
                </button>
              ))}
              {stockBookOptions.length === 0 && <p className="text-xs text-slate-500">No matching books. Try title keywords.</p>}
            </div>
          )}
          {stockForm.bookId && (
            <p className="text-xs text-slate-500">
              Selected: {selectedStockBook ? `${selectedStockBook.title} • ${selectedStockBook.author}` : stockBookSearch}
            </p>
          )}
          {stockForm.bookId && (
            <p className="text-xs text-slate-500">
              {selectedStockRow
                ? `Current in this warehouse: ${selectedStockRow.stock} units (threshold ${selectedStockRow.lowStockThreshold})`
                : 'This book has no stock row in this warehouse yet. Saving will create one.'}
            </p>
          )}
          {stockForm.bookId && selectedStockBook && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                Company total stock: {selectedStockBook.stock} units across all warehouses.
              </p>
              {selectedStockBook.stock <= 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 dark:border-amber-900/60 dark:bg-amber-900/20">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    No stock exists in any warehouse for this book. Create a purchase request to restock.
                  </p>
                  <Link
                    to={`/admin/purchase-requests?warehouseId=${selectedWarehouseId}&bookId=${stockForm.bookId}`}
                    className="mt-2 inline-flex rounded-md border border-amber-300 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/40"
                  >
                    Create Purchase Request
                  </Link>
                </div>
              )}
            </div>
          )}

          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
            New On-hand Quantity
          </label>
          <input
            type="number"
            min={0}
            value={stockForm.stock}
            onChange={(e) => setStockForm((prev) => ({ ...prev, stock: e.target.value }))}
            placeholder="e.g. 24"
            className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
          />
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
            Low-stock Threshold
          </label>
          <input
            type="number"
            min={1}
            value={stockForm.lowStockThreshold}
            onChange={(e) => setStockForm((prev) => ({ ...prev, lowStockThreshold: e.target.value }))}
            placeholder="e.g. 5"
            className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
          />
          <button
            type="submit"
            disabled={isPending || !stockForm.bookId}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900"
          >
            {isPending ? 'Saving...' : 'Save Stock Level'}
          </button>
        </div>
      </form>

      <div className="surface-subtle p-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Current Stock Snapshot</h3>
        {selectedStockRow && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/40">
            <p className="font-semibold text-slate-800 dark:text-slate-100">{selectedStockRow.book.title}</p>
            <p className="text-xs text-slate-500">
              Current stock {selectedStockRow.stock} • threshold {selectedStockRow.lowStockThreshold}
            </p>
          </div>
        )}
        <div className="mt-3 max-h-72 space-y-2 overflow-auto">
          {stocks.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => onChooseStockBook(row.bookId, row.book.title)}
              className="w-full rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-left text-sm transition-colors hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/65"
            >
              <p className="font-medium text-slate-800 dark:text-slate-100">{row.book.title}</p>
              <p className="text-xs text-slate-500">Stock {row.stock} • threshold {row.lowStockThreshold}</p>
            </button>
          ))}
          {stocks.length === 0 && <p className="text-sm text-slate-500">No stock rows yet.</p>}
        </div>
      </div>
    </div>
  )
}

export default WarehouseStockPanel
