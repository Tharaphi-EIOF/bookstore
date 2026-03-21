type Props = {
  isFocusMode: boolean
  onToggleFocusMode: () => void
}

const StudioTopBar = ({
  isFocusMode,
  onToggleFocusMode,
}: Props) => {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onToggleFocusMode}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold backdrop-blur-xl transition ${
          isFocusMode
            ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
            : 'border-white/65 bg-white/65 text-slate-700 hover:border-white dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200'
        }`}
      >
        {isFocusMode ? 'Exit Focus Mode' : 'Focus Mode'}
      </button>
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Shortcut: Ctrl/Cmd + Shift + F</span>
    </div>
  )
}

export default StudioTopBar
