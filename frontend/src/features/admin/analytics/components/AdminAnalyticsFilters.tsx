import type { Dispatch, SetStateAction } from 'react'
import { Download } from 'lucide-react'
import ColumnVisibilityMenu from '@/components/admin/ColumnVisibilityMenu'
import type { PartnerDealStatus } from '@/features/admin/services/partner-deals'
import { analyticsFilterControlClassName } from '@/features/admin/analytics/lib/analytics-formatters'
import type { GroupBy, TableView } from '@/features/admin/analytics/types'

type AdminAnalyticsFiltersProps = {
  groupBy: GroupBy
  setGroupBy: Dispatch<SetStateAction<GroupBy>>
  tableView: TableView
  setTableView: Dispatch<SetStateAction<TableView>>
  fromDate: string
  setFromDate: Dispatch<SetStateAction<string>>
  toDate: string
  setToDate: Dispatch<SetStateAction<string>>
  leadDays: number
  setLeadDays: Dispatch<SetStateAction<number>>
  partnerStatus: PartnerDealStatus | ''
  setPartnerStatus: Dispatch<SetStateAction<PartnerDealStatus | ''>>
  partnerSearch: string
  setPartnerSearch: Dispatch<SetStateAction<string>>
  visibleColumnMap: Record<string, boolean>
  setVisibleColumnMap: Dispatch<SetStateAction<Record<string, boolean>>>
  columnOptions: Array<{ key: string; label: string }>
  onExport: () => void
  exportDisabled: boolean
}

const AdminAnalyticsFilters = ({
  groupBy,
  setGroupBy,
  tableView,
  setTableView,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  leadDays,
  setLeadDays,
  partnerStatus,
  setPartnerStatus,
  partnerSearch,
  setPartnerSearch,
  visibleColumnMap,
  setVisibleColumnMap,
  columnOptions,
  onExport,
  exportDisabled,
}: AdminAnalyticsFiltersProps) => (
  <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Table Setup</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Adjust the dataset, visible columns, and export before reviewing rows.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ColumnVisibilityMenu
          visibleColumns={visibleColumnMap}
          setVisibleColumns={setVisibleColumnMap}
          options={columnOptions}
          className="z-20"
        />
        <button
          type="button"
          onClick={onExport}
          disabled={exportDisabled}
          className="inline-flex h-12 items-center gap-2 rounded-[20px] border border-slate-200/80 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">View</p>
        <select
          value={tableView}
          onChange={(event) => setTableView(event.target.value as TableView)}
          className={analyticsFilterControlClassName}
        >
          <option value="authorSales">Author Sales</option>
          <option value="catalogBreakdown">Catalog Breakdown</option>
          <option value="genreStats">Genre Statistics</option>
          <option value="categoryStats">Category Statistics</option>
          <option value="restockMissing">Restock + Missing Demand</option>
          <option value="partnerStats">Distribution / Partner</option>
        </select>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Group By</p>
        <select
          value={groupBy}
          onChange={(event) => setGroupBy(event.target.value as GroupBy)}
          className={analyticsFilterControlClassName}
        >
          <option value="author">Author</option>
          <option value="category">Category</option>
          <option value="vendor">Vendor</option>
        </select>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">From</p>
        <input
          type="date"
          value={fromDate}
          onChange={(event) => setFromDate(event.target.value)}
          className={analyticsFilterControlClassName}
        />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">To</p>
        <input
          type="date"
          value={toDate}
          onChange={(event) => setToDate(event.target.value)}
          className={analyticsFilterControlClassName}
        />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lead Days</p>
        <input
          type="number"
          min={30}
          max={365}
          value={leadDays}
          onChange={(event) => setLeadDays(Math.max(30, Math.min(365, Number(event.target.value) || 90)))}
          className={analyticsFilterControlClassName}
        />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Partner Status</p>
        <select
          value={partnerStatus}
          onChange={(event) => setPartnerStatus(event.target.value as PartnerDealStatus | '')}
          className={analyticsFilterControlClassName}
        >
          <option value="">All</option>
          <option value="DRAFT">DRAFT</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="PAUSED">PAUSED</option>
          <option value="ENDED">ENDED</option>
        </select>
      </div>
      <div className="min-w-0 md:col-span-2 xl:col-span-4 2xl:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Partner Search</p>
        <input
          value={partnerSearch}
          onChange={(event) => setPartnerSearch(event.target.value)}
          placeholder="Filter partner by name/company..."
          className={analyticsFilterControlClassName}
        />
      </div>
    </div>
  </div>
)

export default AdminAnalyticsFilters
