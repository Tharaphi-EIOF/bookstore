import type { PartnerDeal, PartnerDealStatus } from '@/features/admin/services/partner-deals'
import {
  PARTNER_DEAL_STATUS_OPTIONS,
  getDealLinkedBookLabel,
} from '@/features/admin/book-distribution/lib/bookDistributionDisplay'

type PartnerDealsSectionProps = {
  dealFilter: PartnerDealStatus | ''
  onDealFilterChange: (value: PartnerDealStatus | '') => void
  dealSearch: string
  onDealSearchChange: (value: string) => void
  deals: PartnerDeal[]
  isLoading: boolean
  onUpdateDealStatus: (dealId: string, status: PartnerDealStatus) => void
}

const inputClassName = 'rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900'

const PartnerDealsSection = ({
  dealFilter,
  onDealFilterChange,
  dealSearch,
  onDealSearchChange,
  deals,
  isLoading,
  onUpdateDealStatus,
}: PartnerDealsSectionProps) => (
  <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Partner Consignment Deals</h2>
        <p className="mt-1 text-xs text-slate-500">Review and manage existing agreements here.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <select
          value={dealFilter}
          onChange={(event) => onDealFilterChange(event.target.value as PartnerDealStatus | '')}
          className={inputClassName}
        >
          <option value="">All statuses</option>
          {PARTNER_DEAL_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <input
          value={dealSearch}
          onChange={(event) => onDealSearchChange(event.target.value)}
          placeholder="Search partner/company"
          className={inputClassName}
        />
      </div>
    </div>

    <div className="mt-4 space-y-3">
      {deals.map((deal) => (
        <div key={deal.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">{deal.partnerName}</p>
              <p className="text-xs text-slate-500">
                {deal.partnerCompany || 'No company'} | Share {Number(deal.revenueSharePct)}%
              </p>
              <p className="text-xs text-slate-500">{getDealLinkedBookLabel(deal)}</p>
            </div>
            <select
              value={deal.status}
              onChange={(event) => onUpdateDealStatus(deal.id, event.target.value as PartnerDealStatus)}
              className="rounded-lg border px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
            >
              {PARTNER_DEAL_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Linked book</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                {deal.book ? `${deal.book.title} by ${deal.book.author}` : 'Not linked yet'}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Revenue share</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{Number(deal.revenueSharePct)}%</p>
            </div>
            <div className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Terms</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{deal.termsNote || 'No note yet'}</p>
            </div>
          </div>
        </div>
      ))}
      {!isLoading && deals.length === 0 && (
        <p className="text-sm text-slate-500">No partner deals yet.</p>
      )}
    </div>
  </div>
)

export default PartnerDealsSection
