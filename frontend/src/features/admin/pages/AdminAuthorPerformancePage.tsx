import { useMemo, useState } from 'react'
import { useAuthorPerformance } from '@/features/admin/services/warehouses'

const AdminAuthorPerformancePage = () => {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [limit, setLimit] = useState(20)

  const query = useAuthorPerformance({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    limit,
  })

  const rows = query.data?.items || []
  const totals = useMemo(() => {
    const revenue = rows.reduce((sum, row) => sum + row.revenue, 0)
    const soldQty = rows.reduce((sum, row) => sum + row.soldQty, 0)
    const titles = rows.reduce((sum, row) => sum + row.totalTitles, 0)
    return {
      revenue,
      soldQty,
      titles,
      authors: rows.length,
    }
  }, [rows])

  return (
    <div className="space-y-6 p-8 dark:text-slate-100">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Analytics</p>
        <h1 className="text-2xl font-bold">Author Performance</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track titles per author, sold quantity, revenue contribution, and stock risk.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            type="datetime-local"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
          <input
            type="datetime-local"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
          <input
            type="number"
            min={1}
            max={100}
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value || 20))}
            className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
          <button
            type="button"
            onClick={() => {
              setFromDate('')
              setToDate('')
              setLimit(20)
            }}
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Reset filters
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Authors" value={totals.authors} />
        <Metric title="Titles Tracked" value={totals.titles} />
        <Metric title="Units Sold" value={totals.soldQty} />
        <Metric title="Revenue" value={`$${totals.revenue.toFixed(2)}`} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800">
                <th className="px-3 py-2">Author</th>
                <th className="px-3 py-2">Titles</th>
                <th className="px-3 py-2">Titles Sold</th>
                <th className="px-3 py-2">Sold Qty</th>
                <th className="px-3 py-2">Revenue</th>
                <th className="px-3 py-2">Out of Stock</th>
                <th className="px-3 py-2">Top Books</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.author} className="border-b align-top dark:border-slate-800">
                  <td className="px-3 py-3 font-medium">{row.author}</td>
                  <td className="px-3 py-3">{row.totalTitles}</td>
                  <td className="px-3 py-3">{row.titlesSold}</td>
                  <td className="px-3 py-3">{row.soldQty}</td>
                  <td className="px-3 py-3">${row.revenue.toFixed(2)}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        row.outOfStockTitles > 0
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      }`}
                    >
                      {row.outOfStockTitles}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {row.topBooks.length ? (
                      <ul className="space-y-1 text-xs text-slate-500">
                        {row.topBooks.map((book) => (
                          <li key={book.bookId}>
                            {book.title} <span className="font-semibold text-slate-700 dark:text-slate-300">({book.quantity})</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-slate-500">No sales in range</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {query.isLoading && <p className="px-3 py-6 text-sm text-slate-500">Loading author metrics...</p>}
          {!query.isLoading && rows.length === 0 && (
            <p className="px-3 py-6 text-sm text-slate-500">No author performance data found for this filter.</p>
          )}
        </div>
      </div>
    </div>
  )
}

const Metric = ({ title, value }: { title: string; value: string | number }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <p className="text-xs uppercase tracking-wider text-slate-500">{title}</p>
    <p className="mt-2 text-2xl font-bold">{value}</p>
  </div>
)

export default AdminAuthorPerformancePage
