import type { Dispatch, SetStateAction } from 'react'
import ColumnVisibilityMenu from '@/components/admin/ColumnVisibilityMenu'
import AdminFilterCard from '@/components/admin/AdminFilterCard'
import {
  BOOK_LEAD_COLUMN_OPTIONS,
  SOURCE_OPTIONS,
  STAGE_OPTIONS,
  stageLabel,
  type VisibleBookLeadColumns,
} from '@/features/admin/book-leads/lib/bookLeadDisplay'
import type { BookLeadSource, BookLeadWorkflowStage } from '@/features/admin/services/book-leads'

type AdminBookLeadsFiltersProps = {
  q: string
  onQChange: (value: string) => void
  stage: BookLeadWorkflowStage | ''
  onStageChange: (value: BookLeadWorkflowStage | '') => void
  source: BookLeadSource | ''
  onSourceChange: (value: BookLeadSource | '') => void
  authorFilter: string
  onAuthorFilterChange: (value: string) => void
  requestedByFilter: string
  onRequestedByFilterChange: (value: string) => void
  assignedToFilter: string
  onAssignedToFilterChange: (value: string) => void
  createdFrom: string
  onCreatedFromChange: (value: string) => void
  createdTo: string
  onCreatedToChange: (value: string) => void
  onResetFilters: () => void
  visibleColumns: VisibleBookLeadColumns
  setVisibleColumns: Dispatch<SetStateAction<VisibleBookLeadColumns>>
}

const inputClassName =
  'h-12 rounded-[20px] border border-slate-200 bg-white px-4 text-sm dark:border-slate-700 dark:bg-slate-950'

const AdminBookLeadsFilters = ({
  q,
  onQChange,
  stage,
  onStageChange,
  source,
  onSourceChange,
  authorFilter,
  onAuthorFilterChange,
  requestedByFilter,
  onRequestedByFilterChange,
  assignedToFilter,
  onAssignedToFilterChange,
  createdFrom,
  onCreatedFromChange,
  createdTo,
  onCreatedToChange,
  onResetFilters,
  visibleColumns,
  setVisibleColumns,
}: AdminBookLeadsFiltersProps) => (
  <AdminFilterCard>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.35fr_0.85fr_0.85fr_0.85fr_auto_auto]">
      <input
        value={q}
        onChange={(event) => onQChange(event.target.value)}
        placeholder="Search title / author / note"
        className={inputClassName}
      />
      <select
        value={stage}
        onChange={(event) => onStageChange(event.target.value as BookLeadWorkflowStage | '')}
        className={inputClassName}
      >
        <option value="">All stages</option>
        {STAGE_OPTIONS.map((item) => (
          <option key={item} value={item}>
            {stageLabel(item)}
          </option>
        ))}
      </select>
      <select
        value={source}
        onChange={(event) => onSourceChange(event.target.value as BookLeadSource | '')}
        className={inputClassName}
      >
        <option value="">All sources</option>
        {SOURCE_OPTIONS.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <input
        value={authorFilter}
        onChange={(event) => onAuthorFilterChange(event.target.value)}
        placeholder="Author"
        className={inputClassName}
      />
      <button
        type="button"
        onClick={onResetFilters}
        className="h-12 rounded-[20px] border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        Reset
      </button>
      <ColumnVisibilityMenu
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        options={BOOK_LEAD_COLUMN_OPTIONS}
      />
    </div>
    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <input
        value={requestedByFilter}
        onChange={(event) => onRequestedByFilterChange(event.target.value)}
        placeholder="Requested by"
        className={inputClassName}
      />
      <input
        value={assignedToFilter}
        onChange={(event) => onAssignedToFilterChange(event.target.value)}
        placeholder="Assigned to"
        className={inputClassName}
      />
      <input
        type="date"
        value={createdFrom}
        onChange={(event) => onCreatedFromChange(event.target.value)}
        className={inputClassName}
      />
      <input
        type="date"
        value={createdTo}
        onChange={(event) => onCreatedToChange(event.target.value)}
        className={inputClassName}
      />
    </div>
  </AdminFilterCard>
)

export default AdminBookLeadsFilters
