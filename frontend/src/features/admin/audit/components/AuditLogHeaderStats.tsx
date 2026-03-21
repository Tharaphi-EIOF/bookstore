interface AuditLogHeaderStatsProps {
  totalEntries: number
  totalResources: number
  uniqueActors: number
}

const AuditLogHeaderStats = ({
  totalEntries,
  totalResources,
  uniqueActors,
}: AuditLogHeaderStatsProps) => {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="section-kicker">People</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-gray-900 dark:text-slate-100">Admin Audit Log</h1>
        <p className="mt-1 max-w-3xl text-gray-600 dark:text-slate-400">
          Review who changed what, when it happened, and the most important details without digging through raw payloads.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Entries</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{totalEntries}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Resources</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{totalResources}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Actors</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{uniqueActors}</p>
        </div>
      </div>
    </div>
  )
}

export default AuditLogHeaderStats
