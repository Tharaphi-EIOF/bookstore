import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import BookCover from '@/components/ui/BookCover'
import Skeleton from '@/components/ui/Skeleton'
import type { LibraryItem, ShelfRow } from '@/features/library/components/types'

type RecentActivityItem = LibraryItem & { updatedAt: string }

type LibraryShelfViewProps = {
  filteredBooks: LibraryItem[]
  isLoading: boolean
  onOpenDetailPanel: (bookId: string) => void
  recentActivity: RecentActivityItem[]
  selectedBookId: string | null
  shelfRows: ShelfRow[]
}

const LibraryShelfView = ({
  filteredBooks,
  isLoading,
  onOpenDetailPanel,
  recentActivity,
  selectedBookId,
  shelfRows,
}: LibraryShelfViewProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={`lib-skeleton-${index}`} className="aspect-[2/3] rounded-2xl bg-slate-200 dark:bg-white/10" />
        ))}
      </div>
    )
  }

  if (filteredBooks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500 dark:border-white/15 dark:bg-black/20 dark:text-slate-400">
        No books in this section yet.
      </div>
    )
  }

  return (
    <>
      <div
        className="space-y-10 rounded-2xl border border-[#e6ddd0] bg-gradient-to-b from-[#faf8f3] via-[#f6f2ea] to-[#f1ece2] p-4 transition-colors dark:border-[#3d352c] dark:from-[#1c1813] dark:via-[#1f1b16] dark:to-[#191612]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 12%, rgba(255,255,255,0.45), transparent 42%), radial-gradient(circle at 82% 10%, rgba(255,255,255,0.24), transparent 40%), linear-gradient(180deg, rgba(0,0,0,0.03), rgba(0,0,0,0))',
        }}
      >
        {shelfRows.map((row) => (
          <div key={row.key} className="transition-all duration-500 ease-out">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{row.title}</p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{row.books.length} books</p>
            </div>
            <div className="relative">
              <div className="no-scrollbar mx-4 overflow-x-auto pb-8">
                <div className="inline-flex min-w-full items-end gap-6 px-2 pt-2">
                  {row.books.map((item) => (
                    <button
                      key={`${row.key}-${item.id}`}
                      type="button"
                      onClick={() => onOpenDetailPanel(item.bookId)}
                      className="group relative z-10 w-[118px] shrink-0 text-left sm:w-[128px]"
                    >
                      <div
                        className={cn(
                          'overflow-visible rounded-[2px] shadow-[0_6px_14px_rgba(15,23,42,0.14)] transition group-hover:-translate-y-1.5 group-hover:shadow-[0_14px_22px_rgba(15,23,42,0.2)]',
                          selectedBookId === item.bookId && 'ring-2 ring-slate-300 dark:ring-white/40',
                        )}
                      >
                        <BookCover
                          src={item.book?.coverImage ?? null}
                          alt={item.book?.title || 'Book cover'}
                          className="aspect-[2/3] w-full"
                          variant="physical"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div
                className="pointer-events-none absolute bottom-3 left-4 right-4 h-4 rounded-[3px] border border-[#c8a075] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_10px_18px_rgba(86,57,29,0.28)] dark:border-[#5d4734]"
                style={{
                  backgroundImage:
                    'linear-gradient(180deg, #d7a66f 0%, #bd8753 35%, #8f5d32 100%), repeating-linear-gradient(90deg, rgba(74,45,24,0.25) 0, rgba(74,45,24,0.25) 1px, rgba(255,255,255,0.07) 1px, rgba(255,255,255,0.07) 12px)',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {recentActivity.length > 0 && (
        <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/[0.02]">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Recent activity
            </p>
            <Link
              to="/reading-insights"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Open insights
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {recentActivity.map((item) => (
              <button
                key={`recent-${item.id}`}
                type="button"
                onClick={() => onOpenDetailPanel(item.bookId)}
                className="tone-hover-gold flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-left transition dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div className="h-12 w-8 overflow-hidden rounded-md border border-slate-200 dark:border-white/10">
                  <BookCover src={item.book?.coverImage ?? null} alt={item.book?.title || 'Recent book'} className="h-full w-full" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                    {item.book?.title || 'Untitled'}
                  </p>
                  <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                    Updated {new Date(item.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default LibraryShelfView
