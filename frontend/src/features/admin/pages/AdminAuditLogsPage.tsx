import { useEffect, useMemo, useState } from 'react'
import AdminPageIntro from '@/components/admin/AdminPageIntro'
import AdminPaginationFooter from '@/components/admin/AdminPaginationFooter'
import AuditLogDetailPanel from '@/features/admin/audit/components/AuditLogDetailPanel'
import AuditLogFilters from '@/features/admin/audit/components/AuditLogFilters'
import AuditLogTable from '@/features/admin/audit/components/AuditLogTable'
import { useAuditLogs, type AuditLogEntry } from '@/features/admin/services/staff'

const AUDIT_LOGS_PAGE_SIZE = 10

const formatLabel = (value: string) =>
  value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return 'Not set'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return Number.isInteger(value) ? `${value}` : value.toFixed(2)
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return 'Not set'
    if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
      const date = new Date(trimmed)
      if (!Number.isNaN(date.getTime())) return date.toLocaleString()
    }
    return trimmed
  }
  if (Array.isArray(value)) return value.length ? `${value.length} item${value.length > 1 ? 's' : ''}` : 'None'
  return 'Updated'
}

const getActionTone = (action: string) => {
  const lower = action.toLowerCase()
  if (/(delete|remove|revoke|reject|cancel|disable)/.test(lower)) {
    return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/30'
  }
  if (/(create|grant|approve|complete|publish|assign)/.test(lower)) {
    return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30'
  }
  return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700'
}

const buildSummary = (entry: AuditLogEntry) => {
  const actor = entry.actor?.name ?? 'System'
  const actionLabel = formatLabel(entry.action)
  const resourceLabel = formatLabel(entry.resource)
  const changes = entry.changes && typeof entry.changes === 'object' ? entry.changes : null

  if (!changes) {
    return `${actor} recorded ${actionLabel.toLowerCase()} on ${resourceLabel.toLowerCase()}.`
  }

  const record = changes as Record<string, unknown>
  if (typeof record.summary === 'string' && record.summary.trim()) {
    return record.summary
  }
  const title =
    formatValue(record.title) !== 'Not set'
      ? formatValue(record.title)
      : formatValue(record.name) !== 'Not set'
        ? formatValue(record.name)
        : formatValue(record.code) !== 'Not set'
          ? formatValue(record.code)
          : null

  const status = formatValue(record.status)
  if (/(complete|completed)/i.test(entry.action) && title) {
    return `${actor} marked ${title} as completed.`
  }

  if (/(approve|approved)/i.test(entry.action) && title) {
    return `${actor} approved ${title}.`
  }

  if (/(create|created)/i.test(entry.action)) {
    return title
      ? `${actor} created ${resourceLabel.toLowerCase()} ${title}.`
      : `${actor} created a new ${resourceLabel.toLowerCase()}.`
  }

  if (/(update|updated|edit)/i.test(entry.action)) {
    return title
      ? `${actor} updated ${title}.`
      : `${actor} updated this ${resourceLabel.toLowerCase()}.`
  }

  if (/(delete|deleted|remove|removed)/i.test(entry.action)) {
    return title
      ? `${actor} removed ${title}.`
      : `${actor} removed this ${resourceLabel.toLowerCase()}.`
  }

  if (status !== 'Not set') {
    return `${actor} ran ${actionLabel.toLowerCase()} and set status to ${status}.`
  }

  return `${actor} ran ${actionLabel.toLowerCase()} for ${resourceLabel.toLowerCase()}.`
}

const buildHighlights = (entry: AuditLogEntry) => {
  const changes = entry.changes && typeof entry.changes === 'object' ? entry.changes : null
  if (!changes) return []

  const record = changes as Record<string, unknown>
  if (Array.isArray(record.highlights)) {
    return record.highlights
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const highlight = item as Record<string, unknown>
        if (typeof highlight.label !== 'string' || typeof highlight.value !== 'string') return null
        return { label: highlight.label, value: highlight.value }
      })
      .filter((item): item is { label: string; value: string } => Boolean(item))
  }

  const candidates: Array<{ label: string; value: unknown }> = [
    { label: 'Name', value: record.name },
    { label: 'Title', value: record.title },
    { label: 'Status', value: record.status },
    { label: 'Department', value: (record.department as Record<string, unknown> | undefined)?.name },
    { label: 'Customer', value: (record.user as Record<string, unknown> | undefined)?.name },
    { label: 'Email', value: (record.user as Record<string, unknown> | undefined)?.email },
    { label: 'Order ID', value: (record.metadata as Record<string, unknown> | undefined)?.orderId },
    { label: 'Refund', value: record.refundAmount },
  ]

  return candidates
    .filter((item) => item.value !== undefined && item.value !== null && item.value !== '')
    .slice(0, 3)
    .map((item) => ({ label: item.label, value: formatValue(item.value) }))
}

const flattenChanges = (value: unknown, prefix = ''): Array<{ label: string; value: string }> => {
  if (value === null || value === undefined) return []

  if (
    value
    && typeof value === 'object'
    && !Array.isArray(value)
    && Array.isArray((value as Record<string, unknown>).fields)
  ) {
    return ((value as Record<string, unknown>).fields as Array<unknown>)
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const field = item as Record<string, unknown>
        if (
          typeof field.field !== 'string'
          || typeof field.before !== 'string'
          || typeof field.after !== 'string'
        ) {
          return null
        }
        return {
          label: formatLabel(field.field),
          value: `${field.before} -> ${field.after}`,
        }
      })
      .filter((item): item is { label: string; value: string } => Boolean(item))
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return [{ label: formatLabel(prefix || 'Value'), value: formatValue(value) }]
  }

  if (Array.isArray(value)) {
    return [
      {
        label: formatLabel(prefix || 'Items'),
        value: value.length ? `${value.length} item${value.length > 1 ? 's' : ''}` : 'None',
      },
    ]
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
      flattenChanges(nested, prefix ? `${prefix} ${key}` : key),
    )
  }

  return []
}

const AdminAuditLogsPage = () => {
  // Filter state and selected-entry state for the audit review workspace.
  const [resource, setResource] = useState('')
  const [action, setAction] = useState('')
  const [limit, setLimit] = useState(100)
  const [page, setPage] = useState(1)
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null)
  const query = useAuditLogs({
    resource: resource.trim() || undefined,
    action: action.trim() || undefined,
    limit,
  })

  // Derived filter options, KPI summaries, and flattened detail fields.
  const logs = query.data ?? []
  const totalPages = Math.max(1, Math.ceil(logs.length / AUDIT_LOGS_PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const resourceOptions = useMemo(
    () => Array.from(new Set(logs.map((item) => item.resource))).sort(),
    [logs],
  )
  const paginatedLogs = useMemo(() => {
    const startIndex = (safePage - 1) * AUDIT_LOGS_PAGE_SIZE
    return logs.slice(startIndex, startIndex + AUDIT_LOGS_PAGE_SIZE)
  }, [logs, safePage])

  const selectedFields = useMemo(
    () => flattenChanges(selectedEntry?.changes).slice(0, 20),
    [selectedEntry],
  )

  useEffect(() => {
    setPage(1)
  }, [resource, action, limit])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  return (
    <div className="luxe-shell min-h-screen p-8 dark:text-slate-100">
      <div className="mx-auto max-w-7xl">
        {/* Overview stats, filter controls, results table, and detail drawer. */}
        <AdminPageIntro title="Admin Audit Log" className="mb-6" />
        <AuditLogFilters
          resource={resource}
          setResource={setResource}
          action={action}
          setAction={setAction}
          limit={limit}
          setLimit={setLimit}
          resourceOptions={resourceOptions}
          formatLabel={formatLabel}
        />
        <AuditLogTable
          logs={paginatedLogs}
          isLoading={query.isLoading}
          onSelectEntry={setSelectedEntry}
          formatLabel={formatLabel}
          getActionTone={getActionTone}
          buildSummary={buildSummary}
          buildHighlights={buildHighlights}
        />
        <AdminPaginationFooter
          page={safePage}
          totalPages={totalPages}
          onPrev={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
          className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
        />
      </div>

      <AuditLogDetailPanel
        selectedEntry={selectedEntry}
        selectedFields={selectedFields}
        onClose={() => setSelectedEntry(null)}
        formatLabel={formatLabel}
        buildSummary={buildSummary}
      />
    </div>
  )
}

export default AdminAuditLogsPage
