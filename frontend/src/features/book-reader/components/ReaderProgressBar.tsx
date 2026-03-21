type ReaderProgressBarProps = {
  currentLabel: string
  valueLabel: string
  progressWidth: number
}

const ReaderProgressBar = ({
  currentLabel,
  valueLabel,
  progressWidth,
}: ReaderProgressBarProps) => {
  return (
    <section className="sticky top-2 z-40 mt-3 rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur-md dark:border-white/15 dark:bg-black/60">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
        <span>{currentLabel}</span>
        <span>{valueLabel}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-slate-800 transition-[width] duration-300 dark:bg-slate-200"
          style={{ width: `${progressWidth}%` }}
        />
      </div>
    </section>
  )
}

export default ReaderProgressBar
