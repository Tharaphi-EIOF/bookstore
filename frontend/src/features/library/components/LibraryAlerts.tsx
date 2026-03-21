import { Link } from 'react-router-dom'
import type { LibraryAlertsProps } from '@/features/library/components/types'
import BookCover from '@/components/ui/BookCover'

const LibraryAlerts = ({
  entitledEbooks,
  feedback,
  onOpenDetailPanel,
  stockAlerts,
}: LibraryAlertsProps) => {
  const activeAlerts = stockAlerts.filter((item) => item.isActive)

  return (
    <>
      {feedback && (
        <div className="mb-4 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-300/30 dark:bg-emerald-500/10 dark:text-emerald-100">
          {feedback}
        </div>
      )}

      {activeAlerts.length > 0 && (
        <section className="mb-4 rounded-3xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-900/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">Back-in-stock alerts</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                {activeAlerts.length} active alert{activeAlerts.length === 1 ? '' : 's'} on your wishlist.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
              {activeAlerts.slice(0, 4).map((item) => (
                <span key={item.id} className="rounded-full border border-amber-300/70 bg-white px-3 py-1 font-semibold dark:border-amber-700/40 dark:bg-slate-900">
                  {item.book?.title ?? item.bookId}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {entitledEbooks.length > 0 && (
        <section className="mb-4 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-900/10">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Unlocked eBooks</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">My eBooks</h2>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-300">
              {entitledEbooks.length} unlocked
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {entitledEbooks.slice(0, 6).map((ebook) => (
              <div
                key={`ebook-access-${ebook.id}`}
                className="rounded-2xl border border-emerald-200 bg-white/90 p-3 dark:border-emerald-900/40 dark:bg-black/20"
              >
                <div className="flex items-center gap-3">
                  <div className="h-14 w-10 overflow-hidden rounded-md border border-slate-200 dark:border-white/10">
                    <BookCover
                      src={ebook.book.coverImage ?? null}
                      alt={ebook.book.title || 'eBook'}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{ebook.book.title}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{ebook.book.author}</p>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
                      {ebook.progress ? `${ebook.progress.percent.toFixed(1)}% read` : 'Not started'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    to={`/my-books/${ebook.bookId}/read`}
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-emerald-500"
                  >
                    Read Now
                  </Link>
                  <button
                    type="button"
                    onClick={() => onOpenDetailPanel(ebook.bookId)}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

export default LibraryAlerts
