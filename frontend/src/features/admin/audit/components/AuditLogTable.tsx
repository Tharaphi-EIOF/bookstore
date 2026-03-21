import { Eye, ShieldCheck } from 'lucide-react'
import type { AuditLogEntry } from '@/features/admin/services/staff'

interface AuditLogTableProps {
  logs: AuditLogEntry[]
  isLoading: boolean
  onSelectEntry: (entry: AuditLogEntry) => void
  formatLabel: (value: string) => string
  getActionTone: (action: string) => string
  buildSummary: (entry: AuditLogEntry) => string
  buildHighlights: (entry: AuditLogEntry) => Array<{ label: string; value: string }>
}

const AuditLogTable = ({
  logs,
  isLoading,
  onSelectEntry,
  formatLabel,
  getActionTone,
  buildSummary,
  buildHighlights,
}: AuditLogTableProps) => {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">Summary</th>
              <th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((entry) => {
              const highlights = buildHighlights(entry)

              return (
                <tr key={entry.id} className="border-t border-slate-200 align-top dark:border-slate-800">
                  <td className="px-4 py-4">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      ID: <span className="font-mono">{entry.resourceId ?? entry.id}</span>
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{entry.actor?.name ?? 'System'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {entry.actor?.email ?? entry.actorUserId ?? 'Automated action'}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getActionTone(entry.action)}`}>
                      {formatLabel(entry.action)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {formatLabel(entry.resource)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="max-w-md font-medium text-slate-900 dark:text-slate-100">
                      {buildSummary(entry)}
                    </p>
                    {highlights.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {highlights.map((item) => (
                          <span
                            key={`${entry.id}-${item.label}`}
                            className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          >
                            <span className="font-semibold">{item.label}:</span>&nbsp;{item.value}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => onSelectEntry(entry)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View details
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {isLoading && <p className="px-4 py-6 text-sm text-slate-500">Loading audit logs...</p>}
        {!isLoading && logs.length === 0 && (
          <p className="px-4 py-6 text-sm text-slate-500">No audit entries match this filter.</p>
        )}
      </div>
    </div>
  )
}

export default AuditLogTable
