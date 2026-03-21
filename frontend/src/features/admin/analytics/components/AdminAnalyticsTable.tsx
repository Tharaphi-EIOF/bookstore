import { AnimatePresence, motion } from 'framer-motion'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import AdminPaginationFooter from '@/components/admin/AdminPaginationFooter'
import AdminTableCard from '@/components/admin/AdminTableCard'
import type { AnalyticsDetailContext, AnalyticsRow, GroupBy } from '@/features/admin/analytics/types'
import AnalyticsDetailPanel from './AnalyticsDetailPanel'

type AdminAnalyticsTableProps = {
  tableTitle: string
  tableEmptyText: string
  tableView: string
  visibleColumns: string[]
  visibleColumnIndexes: number[]
  paginatedRows: AnalyticsRow[]
  totalRows: number
  sortColumn: string
  sortDir: 'asc' | 'desc'
  onToggleSort: (column: string) => void
  selectedRowId: string | null
  setSelectedRowId: Dispatch<SetStateAction<string | null>>
  isLoading: boolean
  loadingText: string
  partnerPipelineTotal: number
  selectedRow: AnalyticsRow | null
  groupBy: GroupBy
  detailContext: AnalyticsDetailContext
  page: number
  totalPages: number
  onPrevPage: () => void
  onNextPage: () => void
}

const AdminAnalyticsTable = ({
  tableTitle,
  tableEmptyText,
  tableView,
  visibleColumns,
  visibleColumnIndexes,
  paginatedRows,
  totalRows,
  sortColumn,
  sortDir,
  onToggleSort,
  selectedRowId,
  setSelectedRowId,
  isLoading,
  loadingText,
  partnerPipelineTotal,
  selectedRow,
  groupBy,
  detailContext,
  page,
  totalPages,
  onPrevPage,
  onNextPage,
}: AdminAnalyticsTableProps) => (
  <>
    <AdminTableCard className="bg-white/90 dark:bg-slate-900/90">
      <section className="p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{tableTitle}</h2>
        </div>

        {tableView === 'partnerStats' && (
          <p className="mt-2 text-xs text-slate-500">
            Partner pipeline leads: {partnerPipelineTotal} • Source focus: PARTNER_PITCH
          </p>
        )}

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left dark:border-slate-800">
                {visibleColumns.map((column) => (
                  <th
                    key={column}
                    className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400"
                  >
                    <button type="button" onClick={() => onToggleSort(column)} className="inline-flex items-center gap-2">
                      {column}
                      {sortColumn === column ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  className={`border-b align-top transition-colors dark:border-slate-800 ${
                    selectedRowId === row.id
                      ? 'bg-sky-50/80 dark:bg-sky-950/20'
                      : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                  onClick={() => setSelectedRowId(row.id)}
                >
                  {visibleColumnIndexes.map((index) => (
                    <td key={`${tableTitle}-${rowIndex}-${index}`} className="px-3 py-3">
                      {row.cells[index] as ReactNode}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {isLoading && <p className="px-3 py-6 text-sm text-slate-500">{loadingText}</p>}
          {!isLoading && totalRows === 0 && <p className="px-3 py-6 text-sm text-slate-500">{tableEmptyText}</p>}
        </div>
        {totalRows > 0 && (
          <AdminPaginationFooter
            page={page}
            totalPages={totalPages}
            onPrev={onPrevPage}
            onNext={onNextPage}
          />
        )}
      </section>
    </AdminTableCard>

    <AnimatePresence>
      {selectedRow && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setSelectedRowId(null)}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
          <motion.aside
            className="fixed inset-y-6 right-4 z-50 h-[calc(100vh-3rem)] w-[min(560px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-5"
            initial={{ opacity: 0, x: 36, scale: 0.99 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.99 }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
          >
            <AnalyticsDetailPanel
              row={selectedRow}
              groupBy={groupBy}
              detailContext={detailContext}
              onClose={() => setSelectedRowId(null)}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  </>
)

export default AdminAnalyticsTable
