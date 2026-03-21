import { type ContentMode } from '../types'

type Props = {
  contentMode: ContentMode
  title: string
  subtitle: string
  onContentModeChange: (mode: ContentMode) => void
  onTitleChange: (value: string) => void
  onSubtitleChange: (value: string) => void
}

const WriteIdentitySection = ({
  contentMode,
  title,
  subtitle,
  onContentModeChange,
  onTitleChange,
  onSubtitleChange,
}: Props) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/88 p-4 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.18)] dark:border-slate-800 dark:bg-slate-950/88">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Write type</span>
        <div className="inline-flex rounded-full border border-slate-300 bg-white/80 p-1 dark:border-slate-700 dark:bg-slate-900/80">
          {(['BLOG', 'POEM'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onContentModeChange(mode)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                contentMode === mode
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {mode === 'BLOG' ? 'Blog' : 'Poem'}
            </button>
          ))}
        </div>
      </div>
      {contentMode === 'BLOG' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Post title
            </span>
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Enter title"
              className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-2xl font-bold tracking-tight text-slate-900 outline-none transition focus:border-slate-400 placeholder:text-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-600"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Subtitle
            </span>
            <input
              value={subtitle}
              onChange={(event) => onSubtitleChange(event.target.value)}
              placeholder="Optional one-line subtitle"
              className="w-full rounded-xl border border-slate-200 bg-white/90 px-4 py-3 text-base text-slate-700 outline-none transition focus:border-slate-400 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:focus:border-slate-600"
            />
          </label>
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Poem title and author placement are handled inside the poem sheet below.
        </p>
      )}
    </section>
  )
}

export default WriteIdentitySection
