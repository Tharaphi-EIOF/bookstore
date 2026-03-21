import { Link } from 'react-router-dom'

type ReaderHeaderProps = {
  currentPage: number
  lastSavedAt: string | null
  progressPercent: number
  saveState: 'idle' | 'saving' | 'error'
  title: string
  totalPages: number | null
  formatSavedTime: (iso: string | null) => string
}

const ReaderHeader = ({
  currentPage,
  lastSavedAt,
  progressPercent,
  saveState,
  title,
  totalPages,
  formatSavedTime,
}: ReaderHeaderProps) => {
  return (
    <header className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-[0_8px_30px_rgba(53,38,16,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-black/30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">{title}</h1>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Page {currentPage}{totalPages ? ` / ${totalPages}` : ''} · {progressPercent.toFixed(1)}%
          </p>
          <p className={`mt-1 text-[11px] uppercase tracking-[0.12em] ${saveState === 'error' ? 'text-rose-600' : 'text-slate-500 dark:text-slate-400'}`}>
            {saveState === 'saving' ? 'Saving...' : saveState === 'error' ? 'Save failed' : formatSavedTime(lastSavedAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/library"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition hover:bg-slate-100 dark:border-white/20 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
          >
            Back to Library
          </Link>
        </div>
      </div>
    </header>
  )
}

export default ReaderHeader
