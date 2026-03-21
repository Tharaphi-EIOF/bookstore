import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import AdminPageIntro from '@/components/admin/AdminPageIntro'
import { useBlogs } from '@/features/blog/services/blogs'
import { useAuthorPerformance } from '@/features/admin/services/warehouses'
import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/store/auth.store'
import { useCommercialPerformance, useDepartments, useStaffPerformance } from '@/features/admin/services/staff'

type Tone = { primary: string; soft: string; muted: string }
type CommercialWindow = '7d' | '30d' | '90d' | 'all'
type PerformanceTab = 'staff' | 'commercial' | 'authors'
type CommercialLeaderboardRow = {
  id: string
  title: string
  subtitle: string
  right: string
  detail: string
}
type BlogAuthorRow = {
  id: string
  name: string
  posts: number
  views: number
  likes: number
}

const GOALS_KEY = 'staff-performance-goals-v1'
const DEFAULT_TONE: Tone = { primary: '#7c3aed', soft: '#ede9fe', muted: '#c4b5fd' }
const ALL_DEPARTMENTS_TONE: Tone = { primary: '#334155', soft: '#e2e8f0', muted: '#94a3b8' }
const TAB_BUTTON_CLASS_NAME = 'rounded-[18px] px-4 py-2 text-xs font-semibold transition'

const DEPARTMENT_COLOR_BY_CODE: Record<string, Tone> = {
  CS: { primary: '#2563eb', soft: '#dbeafe', muted: '#93c5fd' },
  HR: { primary: '#0f766e', soft: '#ccfbf1', muted: '#5eead4' },
  FIN: { primary: '#b45309', soft: '#ffedd5', muted: '#fdba74' },
  FINANCE: { primary: '#b45309', soft: '#ffedd5', muted: '#fdba74' },
  WH: { primary: '#4f46e5', soft: '#e0e7ff', muted: '#a5b4fc' },
  WAREHOUSE: { primary: '#4f46e5', soft: '#e0e7ff', muted: '#a5b4fc' },
  LEGAL: { primary: '#475569', soft: '#e2e8f0', muted: '#94a3b8' },
  DEFAULT: { primary: '#7c3aed', soft: '#ede9fe', muted: '#c4b5fd' },
}

const STATUS_COLOR: Record<string, string> = {
  TODO: '#64748b',
  IN_PROGRESS: '#2563eb',
  BLOCKED: '#b45309',
  COMPLETED: '#0f766e',
}

const getFromDateByCommercialWindow = (window: CommercialWindow): string | undefined => {
  if (window === 'all') return undefined
  const now = new Date()
  const days = window === '7d' ? 7 : window === '30d' ? 30 : 90
  now.setDate(now.getDate() - days)
  return now.toISOString()
}

const getGoalProgress = (completionRate: number, goal: number): number =>
  Math.min(100, Math.round((completionRate / goal) * 100))

const getPieCellFill = (
  entry: { name: string; fill?: string },
  selectedDepartmentId: string,
  selectedTone: Tone,
): string => {
  if (selectedDepartmentId) {
    return STATUS_COLOR[entry.name.toUpperCase()] ?? selectedTone.primary
  }
  return entry.fill ?? selectedTone.primary
}

const buildTopBlogAuthors = (items: Array<{
  id: string
  author: { id: string; name: string }
  viewsCount: number
  likesCount: number
}>): BlogAuthorRow[] => {
  const byAuthor = new Map<string, BlogAuthorRow>()

  for (const item of items) {
    const existing = byAuthor.get(item.author.id)
    if (existing) {
      existing.posts += 1
      existing.views += item.viewsCount
      existing.likes += item.likesCount
      continue
    }
    byAuthor.set(item.author.id, {
      id: item.author.id,
      name: item.author.name,
      posts: 1,
      views: item.viewsCount,
      likes: item.likesCount,
    })
  }

  return [...byAuthor.values()]
    .sort((a, b) => {
      if (b.posts !== a.posts) return b.posts - a.posts
      if (b.views !== a.views) return b.views - a.views
      return b.likes - a.likes
    })
    .slice(0, 5)
}

const AdminPerformancePage = () => {
  const user = useAuthStore((state) => state.user)
  const canViewDepartments =
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    hasPermission(user?.permissions, 'staff.view')
  const canViewCommercial =
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    hasPermission(user?.permissions, 'finance.reports.view')
  const [departmentId, setDepartmentId] = useState('')
  const [goals, setGoals] = useState<Record<string, number>>({})
  const [commercialWindow, setCommercialWindow] = useState<CommercialWindow>('30d')
  const [activeTab, setActiveTab] = useState<PerformanceTab>('staff')

  const { data: departments = [] } = useDepartments({ enabled: canViewDepartments })
  const { data: performance } = useStaffPerformance({
    departmentId: departmentId || undefined,
  })
  const commercialFromDate = useMemo(
    () => getFromDateByCommercialWindow(commercialWindow),
    [commercialWindow],
  )
  const { data: commercialPerformance } = useCommercialPerformance(
    {
      fromDate: commercialFromDate,
      limit: 5,
    },
    {
      enabled: canViewCommercial,
    },
  )
  const { data: bookAuthorPerformance, isLoading: isBookAuthorsLoading } = useAuthorPerformance(
    {
      limit: 8,
    },
    {
      enabled: activeTab === 'authors',
    },
  )
  const { data: latestBlogFeed, isLoading: isLatestAuthorsLoading } = useBlogs({
    tab: 'latest',
    status: 'PUBLISHED',
    page: 1,
    limit: 30,
  })
  const { data: poemsBlogFeed, isLoading: isPoemAuthorsLoading } = useBlogs({
    tab: 'poems',
    status: 'PUBLISHED',
    page: 1,
    limit: 30,
  })

  useEffect(() => {
    if (activeTab === 'commercial' && !canViewCommercial) {
      setActiveTab('staff')
    }
  }, [activeTab, canViewCommercial])

  const departmentIdByName = useMemo(() => {
    const map = new Map<string, string>()
    for (const department of departments) {
      map.set(department.name, department.id)
    }
    return map
  }, [departments])

  const toneByDepartmentId = useMemo(() => {
    const map = new Map<string, Tone>()
    for (const department of departments) {
      const code = (department.code || '').toUpperCase()
      map.set(department.id, DEPARTMENT_COLOR_BY_CODE[code] ?? DEFAULT_TONE)
    }
    return map
  }, [departments])

  const selectedTone = departmentId
    ? toneByDepartmentId.get(departmentId) ?? DEFAULT_TONE
    : ALL_DEPARTMENTS_TONE

  useEffect(() => {
    const raw = localStorage.getItem(GOALS_KEY)
    if (!raw) return
    try {
      setGoals(JSON.parse(raw) as Record<string, number>)
    } catch {
      setGoals({})
    }
  }, [])

  const updateGoal = (deptId: string, target: number) => {
    const next = { ...goals, [deptId]: target }
    setGoals(next)
    localStorage.setItem(GOALS_KEY, JSON.stringify(next))
  }

  const statusData = useMemo(() => {
    const counts = performance?.summary.statusCounts || {}
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [performance?.summary.statusCounts])

  const staffChartData = useMemo(() => {
    return (performance?.byStaff || []).slice(0, 10).map((item) => ({
      name: item.name.length > 12 ? `${item.name.slice(0, 12)}...` : item.name,
      completed: item.completed,
      total: item.total,
      departmentId: departmentIdByName.get(item.departmentName) ?? '',
    }))
  }, [departmentIdByName, performance?.byStaff])

  const departmentPieData = useMemo(() => {
    return (performance?.byDepartment || []).map((entry) => {
      const tone = toneByDepartmentId.get(entry.departmentId) ?? DEFAULT_TONE
      return {
        name: entry.departmentName,
        value: entry.total,
        fill: tone.primary,
      }
    })
  }, [performance?.byDepartment, toneByDepartmentId])

  const avgCompletionByDepartment = useMemo(() => {
    const list = performance?.byDepartment || []
    if (list.length === 0) return 0
    return Math.round(list.reduce((sum, row) => sum + row.completionRate, 0) / list.length)
  }, [performance?.byDepartment])

  const selectedPieData = departmentId ? statusData : departmentPieData

  const latestAuthors = useMemo(
    () => buildTopBlogAuthors(latestBlogFeed?.items ?? []),
    [latestBlogFeed?.items],
  )

  const poemAuthors = useMemo(
    () => buildTopBlogAuthors(poemsBlogFeed?.items ?? []),
    [poemsBlogFeed?.items],
  )

  return (
    <div className="space-y-6 p-8 dark:text-slate-100">
      <AdminPageIntro
        title="Performance Dashboard"
        actions={(
          <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => setActiveTab('staff')}
              className={`${TAB_BUTTON_CLASS_NAME} ${
                activeTab === 'staff'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900'
              }`}
            >
              Staff
            </button>
            {canViewCommercial ? (
              <button
                type="button"
                onClick={() => setActiveTab('commercial')}
                className={`${TAB_BUTTON_CLASS_NAME} ${
                  activeTab === 'commercial'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900'
                }`}
              >
                Commercial
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setActiveTab('authors')}
              className={`${TAB_BUTTON_CLASS_NAME} ${
                activeTab === 'authors'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900'
              }`}
            >
              Authors
            </button>
          </div>
        )}
      />

      {activeTab === 'staff' ? (
        <>
          <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Filters</h2>
            {canViewDepartments ? (
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="mt-3 rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">All departments</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-3 text-xs text-slate-500">Department filter unavailable for your permission scope.</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <Metric title="Total Tasks" value={performance?.summary.totalTasks ?? 0} tone={selectedTone} />
            <Metric title="Completed" value={performance?.summary.completedTasks ?? 0} tone={selectedTone} />
            <Metric title="Completion Rate" value={`${performance?.summary.completionRate ?? 0}%`} tone={selectedTone} />
            <Metric title="Avg Dept Rate" value={`${avgCompletionByDepartment}%`} tone={selectedTone} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Top Staff Throughput</h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={staffChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="completed" radius={[6, 6, 0, 0]}>
                      {staffChartData.map((entry) => {
                        const tone = toneByDepartmentId.get(entry.departmentId) ?? DEFAULT_TONE
                        return <Cell key={`completed-${entry.name}`} fill={tone.primary} />
                      })}
                    </Bar>
                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                      {staffChartData.map((entry) => {
                        const tone = toneByDepartmentId.get(entry.departmentId) ?? DEFAULT_TONE
                        return <Cell key={`total-${entry.name}`} fill={tone.muted} />
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
                {departmentId ? 'Task Status Mix' : 'Department Workload Mix'}
              </h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={selectedPieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={95}
                      fill={selectedTone.primary}
                      label
                    >
                      {selectedPieData.map((entry, index) => {
                        const fillFromEntry =
                          typeof (entry as { fill?: unknown }).fill === 'string'
                            ? (entry as { fill?: string }).fill
                            : undefined
                        const fill = getPieCellFill(
                          { name: String(entry.name), fill: fillFromEntry },
                          departmentId,
                          selectedTone,
                        )
                        return <Cell key={`pie-cell-${index}`} fill={fill} />
                      })}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Department Goals</h2>
            <p className="mt-1 text-xs text-slate-500">Set target completion % for each department and track progress.</p>
            <div className="mt-4 space-y-4">
              {(performance?.byDepartment || []).map((entry) => {
                const goal = goals[entry.departmentId] ?? 85
                const progress = getGoalProgress(entry.completionRate, goal)
                const tone = toneByDepartmentId.get(entry.departmentId) ?? DEFAULT_TONE
                return (
                  <div key={entry.departmentId} className="rounded-lg border p-3 dark:border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">{entry.departmentName}</p>
                        <p className="text-xs text-slate-500">Current: {entry.completionRate}% • Goal: {goal}%</p>
                      </div>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={goal}
                        onChange={(e) => updateGoal(entry.departmentId, Number(e.target.value) || 1)}
                        className="w-24 rounded border px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-2 rounded-full" style={{ width: `${progress}%`, backgroundColor: tone.primary }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : null}

      {activeTab === 'commercial' && canViewCommercial ? (
        <>
          <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Commercial Window</h2>
                <p className="mt-1 text-xs text-slate-500">Top buyers and best-performing books for the selected sales period.</p>
              </div>
              <select
                value={commercialWindow}
                onChange={(event) => setCommercialWindow(event.target.value as CommercialWindow)}
                className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <Metric title="Revenue" value={`$${(commercialPerformance?.summary.totalRevenue ?? 0).toFixed(2)}`} tone={ALL_DEPARTMENTS_TONE} />
            <Metric title="Orders" value={commercialPerformance?.summary.totalOrders ?? 0} tone={ALL_DEPARTMENTS_TONE} />
            <Metric title="Buyers" value={commercialPerformance?.summary.buyersCount ?? 0} tone={ALL_DEPARTMENTS_TONE} />
            <Metric title="Books Tracked" value={commercialPerformance?.summary.booksTracked ?? 0} tone={ALL_DEPARTMENTS_TONE} />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <CommercialLeaderboard
              title="Top Buyers"
              rows={(commercialPerformance?.topBuyers ?? []).map((row) => ({
                id: row.userId,
                title: row.name,
                subtitle: row.email,
                right: `$${row.totalSpend.toFixed(2)}`,
                detail: `${row.orderCount} order(s)`,
              }))}
            />
            <CommercialLeaderboard
              title="Top Books by Units"
              rows={(commercialPerformance?.topBooksByUnits ?? []).map((row) => ({
                id: row.bookId,
                title: row.title,
                subtitle: row.author || row.isbn,
                right: `${row.units} units`,
                detail: `$${row.revenue.toFixed(2)}`,
              }))}
            />
            <CommercialLeaderboard
              title="Top Books by Revenue"
              rows={(commercialPerformance?.topBooksByRevenue ?? []).map((row) => ({
                id: row.bookId,
                title: row.title,
                subtitle: row.author || row.isbn,
                right: `$${row.revenue.toFixed(2)}`,
                detail: `${row.units} units`,
              }))}
            />
          </div>
        </>
      ) : null}

      {activeTab === 'authors' ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric title="Book Authors" value={bookAuthorPerformance?.items.length ?? 0} tone={ALL_DEPARTMENTS_TONE} />
            <Metric title="Blog Authors" value={latestAuthors.length} tone={ALL_DEPARTMENTS_TONE} />
            <Metric title="Poem Authors" value={poemAuthors.length} tone={ALL_DEPARTMENTS_TONE} />
            <Metric
              title="Tracked Posts"
              value={(latestBlogFeed?.items.length ?? 0) + (poemsBlogFeed?.items.length ?? 0)}
              tone={ALL_DEPARTMENTS_TONE}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <AuthorLeaderboard
              title="Top Book Authors"
              helper="Based on sold quantity and revenue from bookstore orders."
              rows={(bookAuthorPerformance?.items ?? []).map((row) => ({
                id: row.author,
                title: row.author,
                subtitle: `${row.totalTitles} titles • ${row.outOfStockTitles} out of stock`,
                right: `${row.soldQty} sold`,
                detail: `$${row.revenue.toFixed(2)}`,
              }))}
              isLoading={isBookAuthorsLoading}
              emptyText="No book author sales data found."
            />
            <AuthorLeaderboard
              title="Top Blog Authors"
              helper="Published blog writers ranked by post count, then views and likes."
              rows={latestAuthors.map((row) => ({
                id: row.id,
                title: row.name,
                subtitle: `${row.views.toLocaleString()} views`,
                right: `${row.posts} posts`,
                detail: `${row.likes.toLocaleString()} likes`,
              }))}
              isLoading={isLatestAuthorsLoading}
              emptyText="No published blog author data found."
            />
            <AuthorLeaderboard
              title="Top Poem Authors"
              helper="Published poem writers ranked by post count, then views and likes."
              rows={poemAuthors.map((row) => ({
                id: row.id,
                title: row.name,
                subtitle: `${row.views.toLocaleString()} views`,
                right: `${row.posts} poems`,
                detail: `${row.likes.toLocaleString()} likes`,
              }))}
              isLoading={isPoemAuthorsLoading}
              emptyText="No poem author data found."
            />
          </div>
        </>
      ) : null}
    </div>
  )
}

const Metric = ({
  title,
  value,
  tone,
}: {
  title: string
  value: string | number
  tone: Pick<Tone, 'primary' | 'soft'>
}) => (
  <div
    className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
    style={{ borderColor: tone.soft }}
  >
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{title}</p>
    <p className="mt-2 text-3xl font-bold" style={{ color: tone.primary }}>
      {value}
    </p>
  </div>
)

const CommercialLeaderboard = ({
  title,
  rows,
}: {
  title: string
  rows: CommercialLeaderboardRow[]
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">{title}</p>
    <div className="mt-4 space-y-2">
      {rows.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">No data for selected period.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className={`rounded-xl border px-3 py-3 ${
                index === 0
                  ? 'border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-950'
                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      index === 0
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{row.title}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{row.subtitle}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{row.right}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{row.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)

const AuthorLeaderboard = ({
  title,
  helper,
  rows,
  isLoading,
  emptyText,
}: {
  title: string
  helper: string
  rows: CommercialLeaderboardRow[]
  isLoading: boolean
  emptyText: string
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">{title}</p>
    <p className="mt-1 text-xs text-slate-500">{helper}</p>
    <div className="mt-4 space-y-2">
      {isLoading ? (
        <p className="text-xs text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-slate-500">{emptyText}</p>
      ) : (
        rows.map((row, index) => (
          <div key={row.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 px-3 py-3 dark:border-slate-800">
            <div className="flex min-w-0 items-start gap-3">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                #{index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{row.title}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{row.subtitle}</p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{row.right}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{row.detail}</p>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)

export default AdminPerformancePage
