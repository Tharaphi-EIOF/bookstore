import type { Dispatch, SetStateAction } from 'react'

interface AuditLogFiltersProps {
  resource: string
  setResource: Dispatch<SetStateAction<string>>
  action: string
  setAction: Dispatch<SetStateAction<string>>
  limit: number
  setLimit: Dispatch<SetStateAction<number>>
  resourceOptions: string[]
  formatLabel: (value: string) => string
}

const AuditLogFilters = ({
  resource,
  setResource,
  action,
  setAction,
  limit,
  setLimit,
  resourceOptions,
  formatLabel,
}: AuditLogFiltersProps) => {
  return (
    <div className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white/85 p-4 dark:border-slate-800 dark:bg-slate-900/70 md:grid-cols-4">
      <label className="text-sm">
        <span className="mb-2 block font-medium">Resource</span>
        <select
          value={resource}
          onChange={(event) => setResource(event.target.value)}
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="">All resources</option>
          {resourceOptions.map((item) => (
            <option key={item} value={item}>
              {formatLabel(item)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm md:col-span-2">
        <span className="mb-2 block font-medium">Action contains</span>
        <input
          value={action}
          onChange={(event) => setAction(event.target.value)}
          placeholder="department.update, returnRequest.review, staffRole.create"
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
      </label>
      <label className="text-sm">
        <span className="mb-2 block font-medium">Rows</span>
        <input
          type="number"
          min={20}
          max={200}
          value={limit}
          onChange={(event) => setLimit(Number(event.target.value || 100))}
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
        />
      </label>
    </div>
  )
}

export default AuditLogFilters
