import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'
import type { AuditLogEntry } from '@/features/admin/services/staff'

interface AuditLogDetailPanelProps {
  selectedEntry: AuditLogEntry | null
  selectedFields: Array<{ label: string; value: string }>
  onClose: () => void
  formatLabel: (value: string) => string
  buildSummary: (entry: AuditLogEntry) => string
}

const AuditLogDetailPanel = ({
  selectedEntry,
  selectedFields,
  onClose,
  formatLabel,
  buildSummary,
}: AuditLogDetailPanelProps) => {
  return (
    <AdminSlideOverPanel
      open={Boolean(selectedEntry)}
      onClose={onClose}
      kicker="Audit Details"
      title={selectedEntry ? buildSummary(selectedEntry) : 'Audit entry'}
      description={
        selectedEntry
          ? `${formatLabel(selectedEntry.action)} on ${formatLabel(selectedEntry.resource)}`
          : undefined
      }
      widthClassName="max-w-[44rem]"
    >
      {selectedEntry ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Actor</p>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedEntry.actor?.name ?? 'System'}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {selectedEntry.actor?.email ?? selectedEntry.actorUserId ?? 'Automated action'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/70">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">When</p>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {new Date(selectedEntry.createdAt).toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Resource ID: <span className="font-mono">{selectedEntry.resourceId ?? '-'}</span>
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Action</p>
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{formatLabel(selectedEntry.action)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Resource</p>
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">{formatLabel(selectedEntry.resource)}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Readable changes</h3>
            {selectedFields.length > 0 ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {selectedFields.map((field) => (
                  <div
                    key={`${field.label}-${field.value}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/50"
                  >
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{field.label}</p>
                    <p className="mt-2 break-words text-sm font-medium text-slate-900 dark:text-slate-100">{field.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-400">
                No structured change details were recorded for this action.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </AdminSlideOverPanel>
  )
}

export default AuditLogDetailPanel
