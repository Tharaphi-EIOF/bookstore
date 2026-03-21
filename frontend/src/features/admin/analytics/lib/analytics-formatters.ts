export const currency = (value: number) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)

export const toUtc = (dateText: string, mode: 'start' | 'end') =>
  mode === 'start' ? `${dateText}T00:00:00.000Z` : `${dateText}T23:59:59.999Z`

const escapeCsv = (value: unknown) => {
  const text = String(value ?? '')
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export const downloadCsv = (fileName: string, headers: string[], rows: Array<Array<unknown>>) => {
  const csvText = [headers, ...rows].map((line) => line.map(escapeCsv).join(',')).join('\n')
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

export const analyticsFilterControlClassName =
  'mt-1 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-700 dark:focus:ring-sky-900/40'
