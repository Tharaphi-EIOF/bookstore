import { RotateCcw, Trash2, X } from 'lucide-react'
import type { ReadingStatus } from '@/services/reading'
import BookCover from '@/components/ui/BookCover'
import { cn } from '@/lib/utils'
import type {
  LibraryDeskActions,
  LibraryDeskMutations,
  LibraryDeskState,
  LibraryItem,
} from '@/features/library/components/types'

type LibraryDetailPanelProps = {
  activeStockAlertBookIds: Set<string>
  closeDetailPanel: () => void
  deskActions: LibraryDeskActions
  deskMutations: LibraryDeskMutations
  deskState: LibraryDeskState
  isBookCardFlipped: boolean
  onBookCardFlippedChange: (value: boolean) => void
  onDeskStateChange: (state: LibraryDeskState) => void
  selectedBookId: string | null
  selectedPreview?: LibraryItem
  selectedReadingItem?: {
    progressPercent: number
    status: ReadingStatus
  }
  setSelectedStatus: (status: ReadingStatus) => void
  statusLabel: Record<ReadingStatus, string>
}

const LibraryDetailPanel = ({
  activeStockAlertBookIds,
  closeDetailPanel,
  deskActions,
  deskMutations,
  deskState,
  isBookCardFlipped,
  onBookCardFlippedChange,
  onDeskStateChange,
  selectedBookId,
  selectedPreview,
  selectedReadingItem,
  setSelectedStatus,
  statusLabel,
}: LibraryDetailPanelProps) => {
  return (
    <>
      <div
        onClick={closeDetailPanel}
        className="fixed inset-0 z-[60] bg-slate-900/35 backdrop-blur-[1px] transition-opacity dark:bg-black/45"
      />

      <aside className="fixed inset-y-0 right-0 z-[70] h-screen w-full max-w-[460px] overflow-hidden border-l border-slate-200 bg-white/95 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-[#141418]/95">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Reading Desk</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-[#f5f5f1]">Selected Book</h2>
          </div>
          <button
            type="button"
            onClick={closeDetailPanel}
            className="tone-hover-gold inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-white/15 dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
            aria-label="Close selected book panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {selectedPreview ? (
          <div className="no-scrollbar mt-5 h-[calc(100%-5rem)] overflow-y-auto pr-1">
            <div className="relative [perspective:1000px]">
              <div
                className={cn(
                  'relative min-h-[520px] transition-transform duration-500 [transform-style:preserve-3d]',
                  isBookCardFlipped ? '[transform:rotateY(180deg)]' : '',
                )}
              >
                <div className="absolute inset-0 [backface-visibility:hidden]">
                  <button
                    type="button"
                    onClick={() => onBookCardFlippedChange(true)}
                    className="tone-hover-gold group w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/25"
                  >
                    <div className="overflow-hidden rounded-2xl border border-slate-300 dark:border-white/15">
                      <BookCover
                        src={selectedPreview.book?.coverImage ?? null}
                        alt={selectedPreview.book?.title || 'Selected book'}
                        className="aspect-[2/3] w-full"
                      />
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-[#f5f5f1]">{selectedPreview.book?.title || 'Untitled'}</h3>
                    <p className="text-slate-500 dark:text-slate-400">{selectedPreview.book?.author || 'Unknown author'}</p>
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition group-hover:border-slate-400 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-200 dark:group-hover:border-white/30">
                      <RotateCcw className="h-3.5 w-3.5" />
                      Flip to update progress
                    </div>
                  </button>
                </div>

                <div className="absolute inset-0 rounded-3xl border border-slate-200 bg-slate-50 p-4 [backface-visibility:hidden] [transform:rotateY(180deg)] dark:border-white/10 dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Reading details</p>
                    <button
                      type="button"
                      onClick={() => onBookCardFlippedChange(false)}
                      className="tone-hover-gold inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-white/15 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/30 dark:hover:text-white"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Cover
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      <span>Progress</span>
                      <span>{selectedReadingItem?.progressPercent ?? 0}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300"
                        style={{ width: `${selectedReadingItem?.progressPercent ?? 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Status</p>
                    <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-300 dark:border-white/15">
                      {(Object.keys(statusLabel) as ReadingStatus[]).map((status) => (
                        <button
                          key={`status-${status}`}
                          type="button"
                          disabled={deskMutations.isPendingAction}
                          onClick={() => setSelectedStatus(status)}
                          className={cn(
                            'px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-60',
                            selectedReadingItem?.status === status
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                              : 'border-l border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
                          )}
                        >
                          {status === 'TO_READ' ? 'Want' : status === 'READING' ? 'Reading' : 'Done'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {!selectedPreview.book?.isDigital && (
                      <button
                        type="button"
                        onClick={deskActions.onStockAlertToggle}
                        disabled={deskMutations.isStockAlertPending}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200 dark:hover:bg-amber-900/30"
                      >
                        {activeStockAlertBookIds.has(selectedBookId ?? '')
                          ? 'Disable Back-in-Stock Alert'
                          : 'Enable Back-in-Stock Alert'}
                      </button>
                    )}
                    <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                      Current page
                      <input
                        type="number"
                        min={0}
                        value={deskState.currentPageInput}
                        onChange={(event) => onDeskStateChange({ ...deskState, currentPageInput: event.target.value })}
                        placeholder="e.g. 42"
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-white/15 dark:bg-black/30 dark:text-white dark:focus:border-white/40"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                      Total pages
                      <input
                        type="number"
                        min={1}
                        value={deskState.totalPagesInput}
                        onChange={(event) => onDeskStateChange({ ...deskState, totalPagesInput: event.target.value })}
                        placeholder="e.g. 320"
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-white/15 dark:bg-black/30 dark:text-white dark:focus:border-white/40"
                      />
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Progress is calculated from current page and total pages.
                    </p>
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      Daily goal
                      <input
                        type="number"
                        min={1}
                        value={deskState.goalInput}
                        onChange={(event) => onDeskStateChange({ ...deskState, goalInput: event.target.value })}
                        placeholder="e.g. 20 pages/day"
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-white/15 dark:bg-black/30 dark:text-white dark:focus:border-white/40"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={deskMutations.isPendingAction}
                      onClick={deskActions.onSaveDetails}
                      className="mt-2 w-full rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                    >
                      Save Reading Details
                    </button>
                    {selectedBookId && selectedPreview.book?.isDigital ? (
                      <button
                        type="button"
                        disabled={deskMutations.isOpeningEbook}
                        onClick={deskActions.onReadEbook}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                      >
                        {deskMutations.isOpeningEbook ? 'Opening eBook...' : 'Read eBook'}
                      </button>
                    ) : null}
                  </div>

                  {selectedReadingItem && (
                    <div className="mt-16 mx-auto rounded-xl border border-rose-300/35 bg-rose-50/50 p-3 dark:border-rose-300/20 dark:bg-rose-500/5">
                      <button
                        type="button"
                        disabled={deskMutations.isPendingAction}
                        onClick={deskActions.onRemove}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-300 dark:hover:text-rose-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove from tracking
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Select a book from your library to open the reading desk.</p>
        )}
      </aside>
    </>
  )
}

export default LibraryDetailPanel
