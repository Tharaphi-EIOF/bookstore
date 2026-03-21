import { ChevronLeft, ChevronRight, Flame, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type InsightsViewMode = 'WEEKLY' | 'MONTHLY' | 'YEARLY'

type ReadingInsightsSummaryProps = {
  averagePagesPerDay: number
  booksDelta: number
  booksFinished: number
  monthOptions: Array<{ value: string; label: string }>
  monthPages: number
  pagesDelta: number
  previousMonthLabel: string
  selectedMonth: string
  setSelectedMonth: (value: string) => void
  setSelectedDateKey: (value: string | null) => void
  setViewMode: (mode: InsightsViewMode) => void
  shiftMonthKey: (key: string, delta: number) => string
  streak: number
  summaryHeading: string
  toMonthKey: (date: Date) => string
  viewMode: InsightsViewMode
  yearOptions: Array<{ value: string; label: string }>
  parseMonthKey: (key: string) => { year: number; monthIndex: number }
  selectedDateKey: string | null
  onOpenComposer: () => void
}

const ReadingInsightsSummary = ({
  averagePagesPerDay,
  booksDelta,
  booksFinished,
  monthOptions,
  monthPages,
  pagesDelta,
  previousMonthLabel,
  selectedMonth,
  selectedDateKey,
  setSelectedDateKey,
  setSelectedMonth,
  setViewMode,
  shiftMonthKey,
  streak,
  summaryHeading,
  toMonthKey,
  viewMode,
  yearOptions,
  parseMonthKey,
  onOpenComposer,
}: ReadingInsightsSummaryProps) => {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-[#17171a]/85 dark:shadow-[0_20px_80px_rgba(0,0,0,0.35)] lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300/80">Reading Insights</p>
          <h1 className="mt-2 font-library-display text-4xl leading-tight text-slate-900 dark:text-[#f5f5f1]">{summaryHeading}</h1>
        </div>
        <button
          type="button"
          onClick={onOpenComposer}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(15,23,42,0.22)] dark:bg-white dark:text-slate-900 dark:hover:shadow-none"
        >
          <Plus className="h-4 w-4" />
          Add Session
        </button>
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/85 p-3 sm:p-4 dark:border-white/10 dark:bg-white/[0.03] xl:grid-cols-[auto_minmax(220px,1fr)_auto] xl:items-center">
        <div className="grid grid-cols-3 rounded-full border border-slate-300/90 bg-white p-1 dark:border-white/20 dark:bg-black/25">
          {(['WEEKLY', 'MONTHLY', 'YEARLY'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setViewMode(mode)
                if (mode === 'YEARLY') {
                  const { year: selectedYear } = parseMonthKey(selectedMonth)
                  setSelectedMonth(`${selectedYear}-01`)
                }
              }}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition',
                viewMode === mode
                  ? 'bg-slate-900 text-white shadow-[0_6px_16px_rgba(15,23,42,0.28)] dark:bg-white dark:text-slate-900 dark:shadow-none'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
              )}
            >
              {mode.toLowerCase()}
            </button>
          ))}
        </div>

        {(viewMode === 'MONTHLY' || viewMode === 'YEARLY') && (
          <select
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-slate-500 dark:border-white/20 dark:bg-black/25 dark:text-white dark:focus:border-white/45"
          >
            {(viewMode === 'YEARLY' ? yearOptions : monthOptions).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        <div className="flex flex-wrap items-center justify-start gap-2 xl:min-w-[320px] xl:justify-end">
          <button
            type="button"
            onClick={() => {
              if (viewMode === 'WEEKLY') {
                const next = selectedDateKey ? new Date(`${selectedDateKey}T00:00:00`) : new Date()
                next.setDate(next.getDate() - 7)
                setSelectedDateKey(next.toISOString().slice(0, 10))
                return
              }
              setSelectedMonth(shiftMonthKey(selectedMonth, viewMode === 'YEARLY' ? -12 : -1))
            }}
            className="inline-flex h-10 min-w-[88px] items-center justify-center gap-1 rounded-xl border border-slate-300/90 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-white/20 dark:bg-black/20 dark:text-slate-300 dark:hover:border-white/40 dark:hover:text-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedMonth(toMonthKey(new Date()))
              setSelectedDateKey(null)
            }}
            className="h-10 min-w-[88px] rounded-xl border border-slate-300/90 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-white/20 dark:bg-black/20 dark:text-slate-300 dark:hover:border-white/40 dark:hover:text-white"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => {
              if (viewMode === 'WEEKLY') {
                const next = selectedDateKey ? new Date(`${selectedDateKey}T00:00:00`) : new Date()
                next.setDate(next.getDate() + 7)
                setSelectedDateKey(next.toISOString().slice(0, 10))
                return
              }
              setSelectedMonth(shiftMonthKey(selectedMonth, viewMode === 'YEARLY' ? 12 : 1))
            }}
            className="inline-flex h-10 min-w-[88px] items-center justify-center gap-1 rounded-xl border border-slate-300/90 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-white/20 dark:bg-black/20 dark:text-slate-300 dark:hover:border-white/40 dark:hover:text-white"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[1.2fr_1.2fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/15 dark:bg-white/[0.04]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Pages Read ({viewMode === 'MONTHLY' ? 'Month' : viewMode === 'WEEKLY' ? 'Week' : 'Year'})
          </p>
          <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">{monthPages}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/15 dark:bg-white/[0.04]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            Books Finished ({viewMode === 'MONTHLY' ? 'Month' : viewMode === 'WEEKLY' ? 'Week' : 'Year'})
          </p>
          <p className="mt-2 text-4xl font-black text-slate-900 dark:text-white">{booksFinished}</p>
        </div>
        <div className="grid gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/15 dark:bg-white/[0.04]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Avg Pages / Day</p>
            <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">{averagePagesPerDay}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/15 dark:bg-white/[0.04]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Streak</p>
            <p className="mt-1 inline-flex items-center gap-2 text-3xl font-black text-slate-900 dark:text-white">
              <Flame className="h-6 w-6 text-amber-300" />
              {streak}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 dark:border-amber-300/30 dark:bg-amber-500/10 dark:text-amber-200">
          {pagesDelta >= 0 ? '+' : ''}{pagesDelta} pages vs {previousMonthLabel}
        </span>
        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700 dark:border-sky-300/30 dark:bg-sky-500/10 dark:text-sky-200">
          {booksDelta >= 0 ? '+' : ''}{booksDelta} books finished
        </span>
      </div>
    </section>
  )
}

export default ReadingInsightsSummary
