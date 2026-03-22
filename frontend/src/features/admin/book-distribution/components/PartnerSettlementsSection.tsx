import type { PartnerDeal } from '@/features/admin/services/partner-deals'
import {
  createEmptySettlementForm,
  getDealLinkedBookLabel,
  type ResultMessage,
  type SettlementFormState,
} from '@/features/admin/book-distribution/lib/bookDistributionDisplay'

type SettlementPreviewValue = {
  orderCount: number
  quantitySold: number
  partnerShareAmount: number
  grossSalesAmount: number
}

type PartnerSettlementsSectionProps = {
  deals: PartnerDeal[]
  settlementFormByDeal: Record<string, SettlementFormState | undefined>
  settlementPreviewByDeal: Record<string, SettlementPreviewValue | undefined>
  settlementResultByDeal: Record<string, ResultMessage | undefined>
  isLoading: boolean
  isCreatingSettlement: boolean
  isPreviewingSettlement: boolean
  onSettlementFormChange: (dealId: string, value: SettlementFormState) => void
  onCreateSettlement: (dealId: string) => void
  onAutoFillSettlement: (dealId: string, hasLinkedBook: boolean) => void
  onMarkPaid: (dealId: string, settlementId: string) => void
}

const PartnerSettlementsSection = ({
  deals,
  settlementFormByDeal,
  settlementPreviewByDeal,
  settlementResultByDeal,
  isLoading,
  isCreatingSettlement,
  isPreviewingSettlement,
  onSettlementFormChange,
  onCreateSettlement,
  onAutoFillSettlement,
  onMarkPaid,
}: PartnerSettlementsSectionProps) => (
  <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90">
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Partner Settlements</h2>
      <p className="mt-1 text-xs text-slate-500">Create payout records from gross sales, then mark them paid when finance sends the partner share.</p>
    </div>
    <div className="mt-4 space-y-3">
      {deals.map((deal) => {
        const settlementForm = settlementFormByDeal[deal.id] || createEmptySettlementForm()
        const parsedGross = Number(settlementForm.grossSalesAmount)
        const canSubmitSettlement =
          !!settlementForm.periodStart
          && !!settlementForm.periodEnd
          && settlementForm.grossSalesAmount.trim() !== ''
          && Number.isFinite(parsedGross)
          && parsedGross >= 0

        return (
          <div key={deal.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{deal.partnerName}</p>
                <p className="text-xs text-slate-500">{getDealLinkedBookLabel(deal)}</p>
                <p className="text-xs text-slate-500">Share {Number(deal.revenueSharePct)}%</p>
              </div>
              <span className="rounded border border-slate-200 px-2 py-1 text-xs dark:border-slate-700">
                {deal.status}
              </span>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-4">
              <input
                type="date"
                value={settlementForm.periodStart}
                onChange={(event) => onSettlementFormChange(deal.id, { ...settlementForm, periodStart: event.target.value })}
                className="rounded-lg border px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
              <input
                type="date"
                value={settlementForm.periodEnd}
                onChange={(event) => onSettlementFormChange(deal.id, { ...settlementForm, periodEnd: event.target.value })}
                className="rounded-lg border px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
              <input
                type="number"
                min={0}
                value={settlementForm.grossSalesAmount}
                onChange={(event) => onSettlementFormChange(deal.id, { ...settlementForm, grossSalesAmount: event.target.value })}
                placeholder="Gross sales"
                className="rounded-lg border px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
              />
              <button
                type="button"
                onClick={() => onCreateSettlement(deal.id)}
                disabled={isCreatingSettlement || !canSubmitSettlement}
                className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700 dark:border-cyan-900/40 dark:bg-cyan-950/20 dark:text-cyan-300"
              >
                Add Settlement
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onAutoFillSettlement(deal.id, Boolean(deal.bookId))}
                disabled={isPreviewingSettlement || !deal.bookId || !settlementForm.periodStart || !settlementForm.periodEnd}
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-300"
              >
                {isPreviewingSettlement ? 'Calculating...' : 'Auto-fill from sales'}
              </button>
              {!deal.bookId && (
                <span className="text-xs text-amber-700 dark:text-amber-300">Link a book to enable auto-calc.</span>
              )}
              {settlementPreviewByDeal[deal.id] && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Orders {settlementPreviewByDeal[deal.id]?.orderCount} | Units {settlementPreviewByDeal[deal.id]?.quantitySold} | Est. partner share {settlementPreviewByDeal[deal.id]?.partnerShareAmount}
                </span>
              )}
            </div>
            {settlementResultByDeal[deal.id] && (
              <p
                className={`mt-2 text-xs ${
                  settlementResultByDeal[deal.id]?.type === 'success'
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-rose-700 dark:text-rose-300'
                }`}
              >
                {settlementResultByDeal[deal.id]?.message}
              </p>
            )}
            {(deal.settlements || []).length > 0 && (
              <div className="mt-3 space-y-2">
                {(deal.settlements || []).map((settlement) => (
                  <div key={settlement.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700">
                    <p>
                      {new Date(settlement.periodStart).toLocaleDateString()} - {new Date(settlement.periodEnd).toLocaleDateString()} | Gross {Number(settlement.grossSalesAmount)} | Share {Number(settlement.partnerShareAmount)}
                    </p>
                    {settlement.status === 'PENDING' ? (
                      <button
                        type="button"
                        onClick={() => onMarkPaid(deal.id, settlement.id)}
                        className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
                      >
                        Mark Paid
                      </button>
                    ) : (
                      <span className="rounded border border-slate-200 px-2 py-1 dark:border-slate-700">
                        {settlement.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
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

export default PartnerSettlementsSection
