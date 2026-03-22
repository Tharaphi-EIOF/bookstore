import type { PartnerDeal } from '@/features/admin/services/partner-deals'
import {
  createEmptyReceiptForm,
  getDealLinkedBookLabel,
  type ReceiptFormState,
  type ResultMessage,
} from '@/features/admin/book-distribution/lib/bookDistributionDisplay'

type WarehouseOption = {
  id: string
  name: string
  code: string
}

type PartnerReceiptsSectionProps = {
  deals: PartnerDeal[]
  warehouses: WarehouseOption[]
  receiptFormByDeal: Record<string, ReceiptFormState | undefined>
  receiptResultByDeal: Record<string, ResultMessage | undefined>
  isLoading: boolean
  isReceiving: boolean
  onReceiptFormChange: (dealId: string, value: ReceiptFormState) => void
  onReceiveStock: (dealId: string) => void
}

const PartnerReceiptsSection = ({
  deals,
  warehouses,
  receiptFormByDeal,
  receiptResultByDeal,
  isLoading,
  isReceiving,
  onReceiptFormChange,
  onReceiveStock,
}: PartnerReceiptsSectionProps) => (
  <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90">
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Consignment Receipts</h2>
      <p className="mt-1 text-xs text-slate-500">Use this after a deal is active and linked to a book. This is where you enter warehouse and quantity.</p>
    </div>
    <div className="mt-4 space-y-3">
      {deals.map((deal) => {
        const receiptForm = receiptFormByDeal[deal.id] || createEmptyReceiptForm()
        const canReceive = deal.status === 'ACTIVE' && Boolean(deal.bookId)
        return (
          <div key={deal.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{deal.partnerName}</p>
                <p className="text-xs text-slate-500">{getDealLinkedBookLabel(deal)}</p>
                <p className="text-xs text-slate-500">Status: {deal.status}</p>
              </div>
              {!canReceive && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                  {deal.bookId ? 'Activate deal to receive stock' : 'Link a book before receiving'}
                </span>
              )}
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-4">
              <select
                value={receiptForm.warehouseId}
                onChange={(event) => onReceiptFormChange(deal.id, { ...receiptForm, warehouseId: event.target.value })}
                disabled={!canReceive}
                className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">Choose warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} ({warehouse.code})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={receiptForm.quantity}
                onChange={(event) => onReceiptFormChange(deal.id, { ...receiptForm, quantity: event.target.value })}
                disabled={!canReceive}
                placeholder="Quantity received"
                className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
              <input
                value={receiptForm.note}
                onChange={(event) => onReceiptFormChange(deal.id, { ...receiptForm, note: event.target.value })}
                disabled={!canReceive}
                placeholder="Receipt note"
                className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 md:col-span-2"
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                Receiving stock here creates consignment inventory for the linked book in the selected warehouse.
              </p>
              <button
                type="button"
                onClick={() => onReceiveStock(deal.id)}
                disabled={isReceiving || !canReceive}
                className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-cyan-900/40 dark:bg-cyan-950/20 dark:text-cyan-300"
              >
                {isReceiving ? 'Receiving...' : 'Receive Stock'}
              </button>
            </div>
            {receiptResultByDeal[deal.id] && (
              <p
                className={`mt-2 text-xs ${
                  receiptResultByDeal[deal.id]?.type === 'success'
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-rose-700 dark:text-rose-300'
                }`}
              >
                {receiptResultByDeal[deal.id]?.message}
              </p>
            )}
          </div>
        )
      })}
      {!isLoading && deals.length === 0 && (
        <p className="text-sm text-slate-500">No partner deals yet.</p>
      )}
    </div>
  </div>
)

export default PartnerReceiptsSection
