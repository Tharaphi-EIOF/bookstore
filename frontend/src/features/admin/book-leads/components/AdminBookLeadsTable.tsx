import { ArrowRightLeft, Pencil, Trash2 } from 'lucide-react'
import AdminIconActionButton from '@/components/admin/AdminIconActionButton'
import AdminPaginationFooter from '@/components/admin/AdminPaginationFooter'
import AdminTableCard from '@/components/admin/AdminTableCard'
import {
  BUTTON_SECONDARY,
  CONFIDENCE_BADGE,
  STAGE_BADGE,
  STAGE_OPTIONS,
  stageLabel,
  statusToStage,
  type BookLeadSortKey,
  type VisibleBookLeadColumns,
} from '@/features/admin/book-leads/lib/bookLeadDisplay'
import type { BookLead, BookLeadWorkflowStage } from '@/features/admin/services/book-leads'
import { getErrorMessage } from '@/lib/api'

type AdminBookLeadsTableProps = {
  rows: BookLead[]
  visibleColumns: VisibleBookLeadColumns
  selectedLeadIds: Set<string>
  editingId: string | null
  editingStage: BookLeadWorkflowStage
  sortKey: BookLeadSortKey
  sortDir: 'asc' | 'desc'
  isLoading: boolean
  isUpdating: boolean
  page: number
  totalPages: number
  onToggleSort: (key: BookLeadSortKey) => void
  onToggleLeadSelection: (leadId: string, checked: boolean) => void
  onSelectAll: (checked: boolean) => void
  onSelectLead: (leadId: string) => void
  onEditingStageChange: (value: BookLeadWorkflowStage) => void
  onBeginEdit: (lead: BookLead) => void
  onCancelEdit: () => void
  onOpenWorkflowDrawer: (lead: BookLead, intent: 'approve' | 'convert') => void
  onDeleteLead: (lead: BookLead) => void
  onSaveEdit: (row: BookLead, nextStage: BookLeadWorkflowStage) => Promise<void>
  onPrevPage: () => void
  onNextPage: () => void
  showMessage: (message: string) => void
}

const SortHeader = ({
  label,
  active,
  direction,
  onClick,
}: {
  label: string
  active: boolean
  direction: 'asc' | 'desc'
  onClick: () => void
}) => (
  <button type="button" onClick={onClick} className="inline-flex items-center gap-2">
    {label}
    {active && <span>{direction === 'asc' ? '↑' : '↓'}</span>}
  </button>
)

const AdminBookLeadsTable = ({
  rows,
  visibleColumns,
  selectedLeadIds,
  editingId,
  editingStage,
  sortKey,
  sortDir,
  isLoading,
  isUpdating,
  page,
  totalPages,
  onToggleSort,
  onToggleLeadSelection,
  onSelectAll,
  onSelectLead,
  onEditingStageChange,
  onBeginEdit,
  onCancelEdit,
  onOpenWorkflowDrawer,
  onDeleteLead,
  onSaveEdit,
  onPrevPage,
  onNextPage,
  showMessage,
}: AdminBookLeadsTableProps) => (
  <AdminTableCard className="overflow-x-auto">
    <table className="admin-table min-w-full text-sm">
      <thead className="admin-table-head">
        <tr>
          <th className="px-4 py-3">
            <input
              type="checkbox"
              checked={rows.length > 0 && rows.every((row) => selectedLeadIds.has(row.id))}
              onChange={(event) => onSelectAll(event.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
            />
          </th>
          {visibleColumns.title && (
            <th className="px-4 py-3">
              <SortHeader label="Title" active={sortKey === 'title'} direction={sortDir} onClick={() => onToggleSort('title')} />
            </th>
          )}
          {visibleColumns.author && (
            <th className="px-4 py-3">
              <SortHeader label="Author" active={sortKey === 'author'} direction={sortDir} onClick={() => onToggleSort('author')} />
            </th>
          )}
          {visibleColumns.source && (
            <th className="px-4 py-3">
              <SortHeader label="Source" active={sortKey === 'source'} direction={sortDir} onClick={() => onToggleSort('source')} />
            </th>
          )}
          {visibleColumns.demand && (
            <th className="px-4 py-3">
              <SortHeader label="Demand" active={sortKey === 'demand'} direction={sortDir} onClick={() => onToggleSort('demand')} />
            </th>
          )}
          {visibleColumns.confidence && (
            <th className="px-4 py-3">
              <SortHeader label="Confidence" active={sortKey === 'confidence'} direction={sortDir} onClick={() => onToggleSort('confidence')} />
            </th>
          )}
          {visibleColumns.priority && (
            <th className="px-4 py-3">
              <SortHeader label="Priority" active={sortKey === 'priority'} direction={sortDir} onClick={() => onToggleSort('priority')} />
            </th>
          )}
          {visibleColumns.status && (
            <th className="px-4 py-3">
              <SortHeader label="Status" active={sortKey === 'status'} direction={sortDir} onClick={() => onToggleSort('status')} />
            </th>
          )}
          {visibleColumns.actions && <th className="px-4 py-3">Actions</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className={`align-top ${row.deletedAt ? 'opacity-75' : ''}`}>
            <td className="px-4 py-4">
              <input
                type="checkbox"
                checked={selectedLeadIds.has(row.id)}
                onChange={(event) => onToggleLeadSelection(row.id, event.target.checked)}
                className="mt-1 h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              />
            </td>
            {visibleColumns.title && (
              <td className="px-4 py-4">
                <button
                  type="button"
                  onClick={() => onSelectLead(row.id)}
                  className="text-left text-[1.05rem] font-semibold tracking-tight underline decoration-dotted underline-offset-4 hover:text-cyan-700 dark:hover:text-cyan-300"
                >
                  {row.title}
                </button>
                {row.note && (
                  <p
                    className="mt-1 max-w-xl overflow-hidden text-xs leading-6 text-slate-500"
                    style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}
                  >
                    {row.note}
                  </p>
                )}
              </td>
            )}
            {visibleColumns.author && (
              <td className="px-4 py-4 text-[15px] text-slate-700 dark:text-slate-200">{row.author}</td>
            )}
            {visibleColumns.source && (
              <td className="px-4 py-4 text-[15px] text-slate-600 dark:text-slate-300">{row.source}</td>
            )}
            {visibleColumns.demand && (
              <td className="px-4 py-4 text-[15px] text-slate-900 dark:text-slate-100">{row.demandCount ?? 1}</td>
            )}
            {visibleColumns.confidence && (
              <td className="px-4 py-4">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${CONFIDENCE_BADGE[row.confidenceBand || 'LOW']}`}>
                  {row.confidenceBand || 'LOW'} ({row.confidenceScore ?? 0})
                </span>
              </td>
            )}
            {visibleColumns.priority && (
              <td className="px-4 py-4 text-[15px] text-slate-900 dark:text-slate-100">{row.priority}</td>
            )}
            {visibleColumns.status && (
              <td className="px-4 py-4">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${STAGE_BADGE[statusToStage(row.status)]}`}>
                  {stageLabel(statusToStage(row.status))}
                </span>
              </td>
            )}
            {visibleColumns.actions && (
              <td className="px-4 py-4">
                {editingId === row.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={editingStage}
                      onChange={(event) => onEditingStageChange(event.target.value as BookLeadWorkflowStage)}
                      className="rounded-[18px] border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                    >
                      {STAGE_OPTIONS.filter((item) => item !== 'CLOSED').map((item) => (
                        <option key={item} value={item}>
                          {stageLabel(item)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => {
                        void onSaveEdit(row, editingStage).catch((error) => {
                          showMessage(getErrorMessage(error))
                        })
                      }}
                      className="rounded-[18px] bg-slate-900 px-3 py-2 text-xs font-semibold text-white dark:bg-slate-200 dark:text-slate-900"
                    >
                      Save
                    </button>
                    <button type="button" onClick={onCancelEdit} className={BUTTON_SECONDARY}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <AdminIconActionButton
                      label="Update lead"
                      icon={<Pencil className="h-4 w-4" />}
                      onClick={() => onBeginEdit(row)}
                    />
                    {!row.deletedAt && row.status !== 'CONVERTED_TO_BOOK' && (
                      <AdminIconActionButton
                        label="Convert lead"
                        icon={<ArrowRightLeft className="h-4 w-4" />}
                        variant="success"
                        onClick={() => onOpenWorkflowDrawer(row, 'convert')}
                      />
                    )}
                    <AdminIconActionButton
                      label="Delete lead"
                      icon={<Trash2 className="h-4 w-4" />}
                      variant="danger"
                      onClick={() => onDeleteLead(row)}
                    />
                  </div>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
    {isLoading && <p className="px-3 py-6 text-sm text-slate-500">Loading leads...</p>}
    {!isLoading && rows.length === 0 && (
      <p className="px-3 py-6 text-sm text-slate-500">No book leads found for this filter.</p>
    )}

    <AdminPaginationFooter
      page={page}
      totalPages={totalPages}
      onPrev={onPrevPage}
      onNext={onNextPage}
    />
  </AdminTableCard>
)

export default AdminBookLeadsTable
