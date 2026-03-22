const RouteFallback = () => (
  <div className="luxe-shell grid min-h-screen place-items-center px-6 text-slate-700 dark:text-slate-200">
    <div className="flex flex-col items-center gap-6">
      {/* Cartoon book loader for slow route-level page transitions. */}
      <div className="book-loader" aria-hidden="true">
        <div className="book-loader__spark book-loader__spark--one" />
        <div className="book-loader__spark book-loader__spark--two" />
        <div className="book-loader__book">
          <div className="book-loader__cover" />
          <div className="book-loader__pages" />
          <div className="book-loader__page-flip" />
          <div className="book-loader__face">
            <span className="book-loader__eye" />
            <span className="book-loader__eye" />
          </div>
        </div>
        <div className="book-loader__shadow" />
      </div>
      <div className="space-y-1 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
          Loading
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Turning the next page...
        </p>
      </div>
    </div>
  </div>
)

export default RouteFallback
