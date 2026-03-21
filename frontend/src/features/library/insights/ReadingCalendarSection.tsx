import { AnimatePresence, motion } from 'framer-motion'
import BookCover from '@/components/ui/BookCover'
import type { ReadingSession } from '@/features/library/insights/types'
import { cn } from '@/lib/utils'

type WeeklyDay = {
  key: string
  label: string
  date: Date
  pages: number
  sessions: ReadingSession[]
}

type YearlyMonthCard = {
  key: string
  label: string
  pages: number
  cover: string | null
}

type ReadingCalendarSectionProps = {
  activeDay?: { pages: number; sessions: ReadingSession[] }
  activityByDate: Map<string, { pages: number; sessions: ReadingSession[] }>
  calendarCells: Array<number | null>
  dayLabel: string[]
  hoveredDateKey: string | null
  monthIndex: number
  onCalendarDayClick: (dateKey: string) => void
  onHoveredDateKeyChange: (value: string | null) => void
  periodHeading: string
  periodHint: string
  selectedDateKey: string | null
  setSelectedMonthAndView: (monthKey: string) => void
  toDateKey: (date: Date) => string
  todayKey: string
  viewMode: 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  weekDayCards: WeeklyDay[]
  year: number
  yearlyMonthCards: YearlyMonthCard[]
}

const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })

const ReadingCalendarSection = ({
  activeDay,
  activityByDate,
  calendarCells,
  dayLabel,
  hoveredDateKey,
  monthIndex,
  onCalendarDayClick,
  onHoveredDateKeyChange,
  periodHeading,
  periodHint,
  selectedDateKey,
  setSelectedMonthAndView,
  toDateKey,
  todayKey,
  viewMode,
  weekDayCards,
  year,
  yearlyMonthCards,
}: ReadingCalendarSectionProps) => {
  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 backdrop-blur-md dark:border-white/10 dark:bg-[#16181c]/85 lg:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Reading Calendar</p>
          <h2 className="mt-1 font-library-display text-3xl text-slate-900 dark:text-[#f5f5f1]">{periodHeading}</h2>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">{periodHint}</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${viewMode}-${periodHeading}-${selectedDateKey ?? 'none'}-${hoveredDateKey ?? 'idle'}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {viewMode === 'MONTHLY' && (
            <>
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                {dayLabel.map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-2">
                {calendarCells.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="aspect-[1.05/1] rounded-xl bg-transparent" />
                  }

                  const date = new Date(year, monthIndex, day)
                  const dateKey = toDateKey(date)
                  const dayActivity = activityByDate.get(dateKey)
                  const dayPages = dayActivity?.pages ?? 0
                  const daySessions = dayActivity?.sessions ?? []
                  const sessionCount = daySessions.length
                  const hasSessions = sessionCount > 0
                  const isMultiSession = sessionCount > 1
                  const isSelected = selectedDateKey === dateKey
                  const previewSessions = daySessions.slice(0, 3)
                  const dayStateClass = hasSessions
                    ? 'bg-amber-300/20 border-amber-300/55'
                    : 'bg-slate-100/60 border-slate-200/70 dark:bg-white/[0.04] dark:border-white/20'

                  const tooltip = hasSessions
                    ? `${monthLabel.format(date)} ${day}: ${dayPages} pages | ${daySessions.map((session) => session.title).join(', ')}`
                    : `${monthLabel.format(date)} ${day}: No reading sessions`

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      title={tooltip}
                      onMouseEnter={() => onHoveredDateKeyChange(dateKey)}
                      onMouseLeave={() => onHoveredDateKeyChange(null)}
                      onClick={() => onCalendarDayClick(dateKey)}
                      className={cn(
                        'group relative aspect-[1.05/1] overflow-hidden rounded-xl border p-2 text-left transition duration-300 hover:-translate-y-0.5',
                        hasSessions ? 'hover:border-amber-300/65' : 'hover:border-slate-300/70 dark:hover:border-white/20',
                        isSelected ? (hasSessions ? 'ring-2 ring-amber-300/60' : 'ring-2 ring-slate-300/80 dark:ring-white/30') : '',
                        dayStateClass,
                      )}
                    >
                      <div className="absolute inset-x-2 top-2 bottom-10">
                        {hasSessions ? (
                          isMultiSession ? (
                            previewSessions.map((session, stackIdx) => (
                              <div
                                key={`${dateKey}-${session.id}`}
                                className={cn(
                                  'absolute h-[80%] w-[62%] overflow-hidden rounded-lg border border-white/45 shadow-[0_10px_24px_rgba(15,23,42,0.24)] transition-all duration-300',
                                  stackIdx === 0 ? 'left-[3%] top-[14%] rotate-[-12deg] z-[1] group-hover:-translate-y-1.5' : '',
                                  stackIdx === 1 ? 'left-[20%] top-[8%] rotate-[-2deg] z-[2] group-hover:-translate-y-2' : '',
                                  stackIdx === 2 ? 'left-[37%] top-[12%] rotate-[9deg] z-[3] group-hover:-translate-y-2.5' : '',
                                )}
                              >
                                <BookCover src={session.coverImage} alt={session.title} className="h-full w-full" />
                              </div>
                            ))
                          ) : (
                            <div className="absolute left-1/2 top-[8%] h-[78%] w-[62%] -translate-x-1/2 overflow-hidden rounded-lg border border-white/45 shadow-[0_10px_24px_rgba(15,23,42,0.22)] transition-transform duration-300 group-hover:-translate-y-1">
                              <BookCover src={previewSessions[0]?.coverImage} alt={previewSessions[0]?.title || 'Reading session'} className="h-full w-full" />
                            </div>
                          )
                        ) : null}
                      </div>

                      {isMultiSession && (
                        <span className="absolute right-2 top-2 rounded-full bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white dark:bg-white/85 dark:text-slate-900">
                          +{sessionCount - 1}
                        </span>
                      )}

                      {dayPages > 0 && (
                        <span className="absolute bottom-2 left-2 rounded-full bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-semibold text-white dark:bg-white/80 dark:text-slate-900">
                          {dayPages}p
                        </span>
                      )}

                      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-lg font-bold tracking-tight text-slate-700 dark:text-slate-200">
                        {day}
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {viewMode === 'WEEKLY' && (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
              {weekDayCards.map((day) => {
                const isActive = selectedDateKey === day.key
                const isFuture = day.key > todayKey
                return (
                  <button
                    key={day.key}
                    type="button"
                    onMouseEnter={() => onHoveredDateKeyChange(day.key)}
                    onMouseLeave={() => onHoveredDateKeyChange(null)}
                    onClick={() => onCalendarDayClick(day.key)}
                    className={cn(
                      'rounded-2xl border p-3 text-left transition hover:-translate-y-0.5',
                      isActive
                        ? 'border-amber-300 bg-amber-50 dark:border-amber-300/40 dark:bg-amber-500/10'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-white/15 dark:bg-white/[0.04] dark:hover:border-white/35',
                      isFuture ? 'opacity-60' : '',
                    )}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">{day.label}</p>
                    <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{day.date.getDate()}</p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">
                      {day.pages > 0 ? `${day.pages} pages` : isFuture ? 'Future day' : 'No session'}
                    </p>
                    <div className="mt-2 flex -space-x-2">
                      {day.sessions.slice(0, 3).map((session) => (
                        <span key={session.id} className="h-8 w-6 overflow-hidden rounded border border-white/35">
                          <BookCover src={session.coverImage} alt={session.title} className="h-full w-full" />
                        </span>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {viewMode === 'YEARLY' && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {yearlyMonthCards.map((monthCard) => (
                <button
                  key={monthCard.key}
                  type="button"
                  onClick={() => setSelectedMonthAndView(monthCard.key)}
                  className="group rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-amber-300/65 dark:border-white/15 dark:bg-white/[0.04] dark:hover:border-amber-300/45"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{monthCard.label}</p>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">{monthCard.pages}p</span>
                  </div>
                  <div className="mt-3 h-20 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-black/20">
                    {monthCard.cover ? (
                      <BookCover src={monthCard.cover} alt={`${monthCard.label} top title`} className="h-full w-full" />
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-slate-400 dark:text-slate-300">No sessions</div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">Open month</p>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {activeDay && (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-200/20 dark:bg-amber-500/10 dark:text-amber-100">
          {activeDay.pages} pages logged across {activeDay.sessions.length} session{activeDay.sessions.length > 1 ? 's' : ''}.
        </div>
      )}
    </section>
  )
}

export default ReadingCalendarSection
