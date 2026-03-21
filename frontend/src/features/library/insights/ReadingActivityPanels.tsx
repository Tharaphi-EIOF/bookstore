import { BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import BookCover from '@/components/ui/BookCover'
import { cn } from '@/lib/utils'
import type { ReadingSession } from '@/features/library/insights/types'

type DistributionDay = {
  key: string
  compactLabel: string
  pages: number
  shortDate: string
}

type ReadingActivityPanelsProps = {
  lastSevenDays: DistributionDay[]
  maxLastSevenDaysPages: number
  timelineSessions: ReadingSession[]
  viewMode: 'WEEKLY' | 'MONTHLY' | 'YEARLY'
}

const ReadingActivityPanels = ({
  lastSevenDays,
  maxLastSevenDaysPages,
  timelineSessions,
  viewMode,
}: ReadingActivityPanelsProps) => {
  return (
    <div className="mb-20 mt-6 space-y-6 lg:mb-24">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 backdrop-blur-md dark:border-white/10 dark:bg-[#16181c]/85 lg:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Reading Distribution</h3>
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
            <BarChart3 className="h-4 w-4" />
            Last 7 days
          </span>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/15 dark:bg-black/25">
          <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-300">
            <span className="whitespace-nowrap">{maxLastSevenDaysPages}p max</span>
            <span className="whitespace-nowrap">0p min</span>
          </div>
          <div className="grid h-36 grid-cols-7 items-end gap-2 border-t border-dashed border-slate-300 pt-3 dark:border-white/25">
            {lastSevenDays.map((day) => {
              const barHeight = day.pages > 0 ? Math.max(10, (day.pages / maxLastSevenDaysPages) * 100) : 4
              return (
                <div key={day.key} className="group relative flex h-full flex-col items-center justify-end gap-2">
                  <div
                    className={cn(
                      'w-full rounded-sm transition group-hover:opacity-100',
                      day.pages > 0 ? 'bg-gradient-to-t from-amber-500 to-orange-300 opacity-90' : 'bg-slate-300 dark:bg-white/10',
                    )}
                    style={{ height: `${barHeight}%` }}
                    title={`${day.shortDate}: ${day.pages} pages`}
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300" title={day.shortDate}>
                    {day.compactLabel}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4 backdrop-blur-md dark:border-white/10 dark:bg-[#16181c]/85 lg:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Sessions Timeline</h3>
          <span className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">{timelineSessions.length} sessions</span>
        </div>
        {timelineSessions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-white/25 dark:bg-black/25 dark:text-slate-300">
            No sessions logged for this {viewMode === 'MONTHLY' ? 'month' : viewMode === 'WEEKLY' ? 'week' : 'year'} yet.
          </p>
        ) : (
          <div className="no-scrollbar overflow-x-auto pb-2">
            <div className="inline-flex min-w-full items-end gap-4 px-1 pt-1">
              {timelineSessions.map((session) => (
                <article key={session.id} className="group w-[132px] shrink-0 text-left sm:w-[142px]">
                  <Link to={`/books/${session.bookId}`} className="block">
                    <div className="overflow-visible rounded-[2px] shadow-[0_6px_14px_rgba(15,23,42,0.14)] transition duration-300 group-hover:-translate-y-1.5 group-hover:[transform:perspective(1000px)_rotateY(-8deg)_rotateX(3deg)] group-hover:shadow-[0_14px_24px_rgba(15,23,42,0.22)]">
                      <BookCover
                        src={session.coverImage}
                        alt={session.title}
                        className="aspect-[2/3] w-full"
                        variant="physical"
                      />
                    </div>
                  </Link>
                  <div className="mt-2">
                    <p className="truncate text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {session.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {session.pages}p
                    </p>
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{session.title}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default ReadingActivityPanels
