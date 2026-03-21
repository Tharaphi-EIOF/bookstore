import { motion } from 'framer-motion'
import { BookOpen, ChevronRight, Shuffle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReadingItem } from '@/services/reading'
import BookCover from '@/components/ui/BookCover'

type QueueBook = NonNullable<ReadingItem['book']>

type HomeReadingDashboardProps = {
  completionRate: number
  currentBook?: ReadingItem
  finishedCount: number
  handleQueueShuffle: () => void
  isReadingLoading: boolean
  onQueueDeckHoverChange: (hovered: boolean) => void
  queueDeckHovered: boolean
  queueShuffleFxTick: number
  queueShuffleSeed: number
  queuedDeckBooks: QueueBook[]
  queuedOverflowCount: number
  readingStreakDays: number
  shelfTotal: number
  statCells: boolean[]
  toReadCount: number
}

const HomeReadingDashboard = ({
  completionRate,
  currentBook,
  finishedCount,
  handleQueueShuffle,
  isReadingLoading,
  onQueueDeckHoverChange,
  queueDeckHovered,
  queueShuffleFxTick,
  queueShuffleSeed,
  queuedDeckBooks,
  queuedOverflowCount,
  readingStreakDays,
  shelfTotal,
  statCells,
  toReadCount,
}: HomeReadingDashboardProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="surface-panel mt-10 rounded-[30px] p-5 text-slate-900 sm:p-7 dark:text-slate-100"
    >
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-display text-xl font-semibold tracking-tight">Your Reading Dashboard</h3>
        <Link to="/reading-insights" className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
          Reading Insights <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/75 p-4 sm:p-5 dark:border-white/12 dark:bg-white/[0.03]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-lg font-semibold">Currently Reading</p>
          <Link to="/reading-insights" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>

        {isReadingLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading your shelf...</p>
        ) : currentBook ? (
          <div className="flex items-center gap-4">
            <div className="h-24 w-16 overflow-hidden rounded-lg border border-slate-300 dark:border-white/20">
              <BookCover
                src={currentBook.book?.coverImage ?? null}
                alt={currentBook.book?.title || 'Current book'}
                className="h-full w-full"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold">{currentBook.book?.title || 'Untitled'}</p>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">{currentBook.book?.author || 'Unknown author'}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{currentBook.progressPercent}% completed</p>
              <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700/70">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all dark:bg-amber-300"
                  style={{ width: `${Math.min(100, Math.max(0, currentBook.progressPercent))}%` }}
                />
              </div>
            </div>
            <Link
              to={`/books/${currentBook.bookId}`}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white dark:bg-white dark:text-slate-900"
            >
              {currentBook.progressPercent > 0 ? 'Continue' : 'Start Reading'}
            </Link>
          </div>
        ) : (
          <div className="py-4 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-slate-500 dark:text-slate-400" />
            <p className="mt-3 text-base font-medium">What are you reading right now?</p>
            <Link
              to="/books"
              className="mt-3 inline-flex rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white dark:bg-white dark:text-slate-900"
            >
              Select book(s)
            </Link>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <motion.div
          className="tech-card rounded-2xl p-4"
          whileHover={{ y: -3 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-lg font-semibold">Want to Read</p>
            <Link to="/reading-insights" className="text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {toReadCount > 0 ? `${toReadCount} books waiting` : 'No books waiting'}
            </p>
            <button
              type="button"
              onClick={handleQueueShuffle}
              disabled={queuedDeckBooks.length < 2}
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-slate-600 transition enabled:hover:border-slate-400 enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:text-slate-300 dark:enabled:hover:bg-white/10"
            >
              <Shuffle className="h-3.5 w-3.5" />
              Shuffle
            </button>
          </div>
          {queuedDeckBooks.length > 0 ? (
            <div className="mt-3">
              <div
                onMouseEnter={() => onQueueDeckHoverChange(true)}
                onMouseLeave={() => onQueueDeckHoverChange(false)}
                className="relative mx-auto h-28 w-[220px]"
              >
                {queueShuffleFxTick > 0 && (
                  <motion.div
                    key={`queue-shuffle-fx-${queueShuffleFxTick}`}
                    initial={{ opacity: 0.55, scale: 0.82 }}
                    animate={{ opacity: 0, scale: 1.18 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="pointer-events-none absolute inset-x-6 top-2 h-20 rounded-full bg-gradient-to-r from-cyan-300/55 via-sky-300/45 to-indigo-300/55 blur-xl dark:from-cyan-400/30 dark:via-sky-400/25 dark:to-indigo-400/30"
                  />
                )}
                {queuedDeckBooks.map((book, idx) => {
                  const centerOffset = idx - ((queuedDeckBooks.length - 1) / 2)
                  return (
                    <motion.div
                      key={`${book.id}-${queueShuffleSeed}`}
                      initial={{ opacity: 0, y: 18, rotate: -8 }}
                      animate={{
                        opacity: 1,
                        x: centerOffset * (queueDeckHovered ? 34 : 20),
                        y: queueDeckHovered ? Math.abs(centerOffset) * 2 : Math.abs(centerOffset) * 1.4,
                        rotate: centerOffset * (queueDeckHovered ? 10 : 6),
                        rotateY: centerOffset * (queueDeckHovered ? -7 : -3),
                        scale: queueDeckHovered && idx === queuedDeckBooks.length - 1 ? 1.04 : 1,
                      }}
                      whileHover={{ y: -8, scale: 1.07, rotateY: centerOffset * -9 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 22, mass: 0.75, delay: idx * 0.03 }}
                      className="absolute left-1/2 top-0 h-24 w-16 -translate-x-1/2 overflow-hidden rounded-md border border-slate-300 bg-white shadow-[0_8px_18px_-12px_rgba(15,23,42,0.45)] [transform-style:preserve-3d] dark:border-white/15 dark:bg-slate-900"
                      style={{ zIndex: idx + 1 }}
                    >
                      <Link
                        to={`/library?filter=TO_READ&selectedBookId=${encodeURIComponent(book.id)}`}
                        title={book.title}
                        className="block h-full w-full"
                      >
                        <BookCover src={book.coverImage} alt={book.title} className="h-full w-full" />
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span />
                <Link to="/library?filter=TO_READ" className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                  Open queue{queuedOverflowCount > 0 ? ` (+${queuedOverflowCount})` : ''}
                </Link>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Add titles to your queue to organize upcoming reads.
            </p>
          )}
        </motion.div>

        <Link
          to="/reading-insights"
          className="tech-card rounded-2xl p-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-lg font-semibold">Stats</p>
            <ChevronRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
            <p>Finished {finishedCount} books</p>
            <p className="text-right">{completionRate}% completion</p>
            <p>{readingStreakDays}-day streak</p>
            <p className="text-right">{shelfTotal} tracked</p>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1.5">
            {statCells.map((active, idx) => (
              <div
                key={`home-stat-${idx}`}
                style={active ? { animationDelay: `${idx * 0.08}s` } : undefined}
                className={
                  active
                    ? 'stat-cell-active h-5 rounded bg-teal-500/80 dark:bg-teal-300'
                    : 'h-5 rounded bg-slate-300 dark:bg-slate-600/50'
                }
              />
            ))}
          </div>
        </Link>
      </div>
    </motion.section>
  )
}

export default HomeReadingDashboard
