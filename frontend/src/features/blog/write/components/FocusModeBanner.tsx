const FocusModeBanner = () => {
  return (
    <section className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200">
      Focus mode is active. Press <span className="font-semibold">Esc</span> or <span className="font-semibold">Ctrl/Cmd + Shift + F</span> to exit.
    </section>
  )
}

export default FocusModeBanner
