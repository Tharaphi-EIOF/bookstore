import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useApproveBlog,
  useBlogModerationQueue,
  useRejectBlog,
} from '@/features/blog/services/blogs'
import { getErrorMessage } from '@/lib/api'

type ModerationStatus = 'PENDING_REVIEW' | 'REJECTED' | 'PUBLISHED'

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString()
}

const moderationFilterControlClassName =
  'mt-1 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-sky-700 dark:focus:ring-sky-900/40'

const AdminBlogModerationPage = () => {
  const [status, setStatus] = useState<ModerationStatus>('PENDING_REVIEW')
  const [q, setQ] = useState('')
  const [sortKey, setSortKey] = useState<'title' | 'author' | 'status' | 'submitted' | 'reason'>('submitted')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [reasonByBlog, setReasonByBlog] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')

  const queueQuery = useBlogModerationQueue({
    status,
    q: q.trim() || undefined,
    page: 1,
    limit: 50,
  })
  const pendingCountQuery = useBlogModerationQueue({ status: 'PENDING_REVIEW', page: 1, limit: 1 })
  const rejectedCountQuery = useBlogModerationQueue({ status: 'REJECTED', page: 1, limit: 1 })
  const publishedCountQuery = useBlogModerationQueue({ status: 'PUBLISHED', page: 1, limit: 1 })

  const approveMutation = useApproveBlog()
  const rejectMutation = useRejectBlog()

  const rows = queueQuery.data?.items ?? []
  const canModerate = status === 'PENDING_REVIEW' || status === 'REJECTED'

  const stats = useMemo(() => {
    const pending = pendingCountQuery.data?.total ?? 0
    const rejected = rejectedCountQuery.data?.total ?? 0
    const published = publishedCountQuery.data?.total ?? 0
    return { pending, rejected, published }
  }, [pendingCountQuery.data?.total, rejectedCountQuery.data?.total, publishedCountQuery.data?.total])

  const setReason = (blogId: string, value: string) => {
    setReasonByBlog((prev) => ({ ...prev, [blogId]: value }))
  }

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir(key === 'submitted' ? 'desc' : 'asc')
  }

  const sortedRows = useMemo(() => {
    const direction = sortDir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      switch (sortKey) {
        case 'title':
          return a.title.localeCompare(b.title) * direction
        case 'author':
          return a.author.name.localeCompare(b.author.name) * direction
        case 'status':
          return a.status.localeCompare(b.status) * direction
        case 'reason':
          return ((a.moderationReason ?? '').localeCompare(b.moderationReason ?? '')) * direction
        case 'submitted':
        default:
          return ((new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) || 0) * direction
      }
    })
  }, [rows, sortDir, sortKey])

  const handleApprove = async (blogId: string) => {
    setMessage('')
    try {
      await approveMutation.mutateAsync({ blogId, reason: reasonByBlog[blogId]?.trim() || undefined })
      setMessage('Post approved.')
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  const handleReject = async (blogId: string) => {
    setMessage('')
    const reason = reasonByBlog[blogId]?.trim()
    if (!reason) {
      setMessage('Rejection reason is required before rejecting.')
      return
    }
    try {
      await rejectMutation.mutateAsync({ blogId, reason })
      setMessage('Post rejected.')
    } catch (error) {
      setMessage(getErrorMessage(error))
    }
  }

  return (
    <div className="space-y-6 p-8 dark:text-slate-100">
      <div>
        <h1 className="text-2xl font-bold">Blog Moderation</h1>
      </div>

      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</p>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ModerationStatus)}
            className={moderationFilterControlClassName}
          >
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="REJECTED">Rejected</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>
        <div className="min-w-0 md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Search</p>
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search by post title or author"
            className={moderationFilterControlClassName}
          />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Queue</p>
          <div className={`${moderationFilterControlClassName} flex items-center`}>
            Pending {stats.pending} • Rejected {stats.rejected} • Published {stats.published}
          </div>
        </div>
      </div>

      {message ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {message}
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800">
                <th className="px-3 py-2">
                  <button type="button" onClick={() => toggleSort('title')} className="inline-flex items-center gap-2">
                    Post
                    {sortKey === 'title' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className="px-3 py-2">
                  <button type="button" onClick={() => toggleSort('author')} className="inline-flex items-center gap-2">
                    Author
                    {sortKey === 'author' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className="px-3 py-2">
                  <button type="button" onClick={() => toggleSort('status')} className="inline-flex items-center gap-2">
                    Status
                    {sortKey === 'status' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className="px-3 py-2">
                  <button type="button" onClick={() => toggleSort('submitted')} className="inline-flex items-center gap-2">
                    Submitted
                    {sortKey === 'submitted' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className="px-3 py-2">
                  <button type="button" onClick={() => toggleSort('reason')} className="inline-flex items-center gap-2">
                    Review Reason
                    {sortKey === 'reason' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.id} className="border-b align-top dark:border-slate-800">
                  <td className="px-3 py-3">
                    <p className="font-medium">{row.title}</p>
                    <Link to={`/blogs/${row.id}`} className="text-xs text-sky-600 hover:underline dark:text-sky-400">
                      Open post
                    </Link>
                  </td>
                  <td className="px-3 py-3">{row.author.name}</td>
                  <td className="px-3 py-3">{row.status}</td>
                  <td className="px-3 py-3">{formatDate(row.updatedAt)}</td>
                  <td className="px-3 py-3">
                    <textarea
                      value={reasonByBlog[row.id] ?? row.moderationReason ?? ''}
                      onChange={(event) => setReason(row.id, event.target.value)}
                      placeholder="Reason shown in moderation history"
                      className="h-20 w-72 rounded-lg border px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950"
                      disabled={!canModerate}
                    />
                  </td>
                  <td className="px-3 py-3">
                    {canModerate ? (
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => void handleApprove(row.id)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          className="rounded-lg border border-emerald-300 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleReject(row.id)}
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          className="rounded-lg border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-900/20"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">No action in this status view.</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {queueQuery.isLoading ? <p className="px-3 py-6 text-sm text-slate-500">Loading moderation queue...</p> : null}
        {!queueQuery.isLoading && sortedRows.length === 0 ? (
          <p className="px-3 py-6 text-sm text-slate-500">No posts found for this filter.</p>
        ) : null}
      </section>
    </div>
  )
}

export default AdminBlogModerationPage
