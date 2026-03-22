import type {
  PurchaseOrder,
  ReorderSuggestionItem,
  Warehouse,
} from '@/features/admin/services/warehouses'

type ReplenishmentSectionProps = {
  suggestionTotals: {
    books: number
    suggestedQty: number
    shortage: number
  }
  warehouseId: string
  onWarehouseIdChange: (value: string) => void
  leadTimeDays: number
  onLeadTimeDaysChange: (value: number) => void
  coverageDays: number
  onCoverageDaysChange: (value: number) => void
  minDailySales: number
  onMinDailySalesChange: (value: number) => void
  suggestionLimit: number
  onSuggestionLimitChange: (value: number) => void
  warehouses: Warehouse[]
  suggestions: ReorderSuggestionItem[]
  suggestionsLoading: boolean
  reorderableOrders: PurchaseOrder[]
  createRequestsPending: boolean
  onCreateDraftRequests: () => void
  onOpenReorderPanel: (orderId: string) => void
}

const Metric = ({ title, value }: { title: string; value: string | number }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <p className="text-xs uppercase tracking-wider text-slate-500">{title}</p>
    <p className="mt-2 text-2xl font-bold">{value}</p>
  </div>
)

const ReplenishmentSection = ({
  suggestionTotals,
  warehouseId,
  onWarehouseIdChange,
  leadTimeDays,
  onLeadTimeDaysChange,
  coverageDays,
  onCoverageDaysChange,
  minDailySales,
  onMinDailySalesChange,
  suggestionLimit,
  onSuggestionLimitChange,
  warehouses,
  suggestions,
  suggestionsLoading,
  reorderableOrders,
  createRequestsPending,
  onCreateDraftRequests,
  onOpenReorderPanel,
}: ReplenishmentSectionProps) => (
  <>
    <div className="grid gap-4 sm:grid-cols-3">
      <Metric title="Suggested Books" value={suggestionTotals.books} />
      <Metric title="Suggested Qty" value={suggestionTotals.suggestedQty} />
      <Metric title="Current Shortage" value={suggestionTotals.shortage} />
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-3 md:grid-cols-5">
        <select
          value={warehouseId}
          onChange={(event) => onWarehouseIdChange(event.target.value)}
          className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="">All warehouses</option>
          {warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.code} - {warehouse.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          max={90}
          value={leadTimeDays}
          onChange={(event) => onLeadTimeDaysChange(Number(event.target.value || 14))}
          placeholder="Lead time days"
          className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
        <input
          type="number"
          min={7}
          max={120}
          value={coverageDays}
          onChange={(event) => onCoverageDaysChange(Number(event.target.value || 30))}
          placeholder="Coverage days"
          className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
        <input
          type="number"
          min={0}
          step="0.1"
          value={minDailySales}
          onChange={(event) => onMinDailySalesChange(Number(event.target.value || 0))}
          placeholder="Min daily sales"
          className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
        <input
          type="number"
          min={1}
          max={100}
          value={suggestionLimit}
          onChange={(event) => onSuggestionLimitChange(Number(event.target.value || 20))}
          placeholder="Max rows"
          className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
      </div>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Auto Replenishment Suggestions</h2>
        <button
          type="button"
          disabled={!warehouseId || createRequestsPending}
          onClick={onCreateDraftRequests}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
        >
          {createRequestsPending ? 'Creating Requests...' : 'Create Draft Purchase Requests'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800">
              <th className="px-3 py-2">Book</th>
              <th className="px-3 py-2">Stock</th>
              <th className="px-3 py-2">Sold (30d)</th>
              <th className="px-3 py-2">Daily Sales</th>
              <th className="px-3 py-2">Pending PR</th>
              <th className="px-3 py-2">Target Stock</th>
              <th className="px-3 py-2">Suggested Qty</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((item) => (
              <tr key={item.bookId} className="border-b dark:border-slate-800">
                <td className="px-3 py-3">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.author}</p>
                </td>
                <td className="px-3 py-3">{item.stock}</td>
                <td className="px-3 py-3">{item.sold30Days}</td>
                <td className="px-3 py-3">{item.dailySales.toFixed(2)}</td>
                <td className="px-3 py-3">{item.pendingPurchaseQty}</td>
                <td className="px-3 py-3">{item.targetStock}</td>
                <td className="px-3 py-3">
                  <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    {item.suggestedQuantity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {suggestionsLoading && (
          <p className="px-3 py-6 text-sm text-slate-500">Loading suggestions...</p>
        )}
        {!suggestionsLoading && suggestions.length === 0 && (
          <p className="px-3 py-6 text-sm text-slate-500">No suggestions for current filters.</p>
        )}
      </div>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Reorder From Previous Merchant Orders</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800">
              <th className="px-3 py-2">Previous Order</th>
              <th className="px-3 py-2">Vendor</th>
              <th className="px-3 py-2">Warehouse</th>
              <th className="px-3 py-2">Items</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {reorderableOrders.map((order) => (
              <tr key={order.id} className="border-b dark:border-slate-800">
                <td className="px-3 py-3">
                  <p className="font-medium">{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                </td>
                <td className="px-3 py-3">
                  <p className="font-medium">{order.vendor.name}</p>
                  <p className="text-xs text-slate-500">{order.vendor.code}</p>
                </td>
                <td className="px-3 py-3">{order.warehouse.code}</td>
                <td className="px-3 py-3">
                  <p>{order.items.length} items</p>
                  <p className="text-xs text-slate-500">
                    {order.items.slice(0, 2).map((item) => item.book.title).join(', ')}
                    {order.items.length > 2 ? '...' : ''}
                  </p>
                </td>
                <td className="px-3 py-3">{order.status}</td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => onOpenReorderPanel(order.id)}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    Open Reorder Panel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reorderableOrders.length === 0 && (
          <p className="px-3 py-6 text-sm text-slate-500">No previous merchant orders available for reordering.</p>
        )}
      </div>
    </div>
  </>
)

export default ReplenishmentSection
