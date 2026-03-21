import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, BarChart3, Clock3, Edit3, Eye, FileText, Heart, MessageCircle, PenLine } from 'lucide-react'
import { useBlogs, useMyBlogAnalytics, type Blog } from '@/features/blog/services/blogs'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'
import { getStoredContentText } from '@/lib/editor'

type WritingTab = 'ALL' | 'PUBLISHED' | 'DRAFT' | 'SCHEDULED' | 'PENDING_REVIEW' | 'REJECTED'

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Not set'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString()
}

const classifyDrafts = (drafts: Blog[]) => {
  const scheduled: Array<Blog & { scheduledAt: string }> = []
  const plainDrafts: Blog[] = []

  drafts.forEach((draft) => {
    const scheduledAt = draft.scheduledAt
    if (scheduledAt) {
      scheduled.push({ ...draft, scheduledAt })
      return
    }
    plainDrafts.push(draft)
  })

  scheduled.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  plainDrafts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return { scheduled, plainDrafts }
}

const getPostTone = (post: Blog, scheduledAt?: string) => {
  if (scheduledAt) {
    return 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-400/30 dark:bg-indigo-500/12 dark:text-indigo-200'
  }
  if (post.status === 'PUBLISHED') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/12 dark:text-emerald-200'
  }
  if (post.status === 'PENDING_REVIEW') {
    return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/12 dark:text-sky-200'
  }
  if (post.status === 'REJECTED') {
    return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/12 dark:text-rose-200'
  }
  return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/12 dark:text-amber-200'
}

const getPostPreview = (post: Blog) => {
  const source = (post.subtitle || getStoredContentText(post.content)).trim()
  if (!source) return 'No preview available yet.'
  if (source.length <= 150) return source
  return `${source.slice(0, 150).trimEnd()}...`
}

const PostCard = ({ post, scheduledAt }: { post: Blog; scheduledAt?: string }) => (
  <article className="border-b border-slate-200/80 pb-8 dark:border-white/10">
      <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]', getPostTone(post, scheduledAt))}>
          {scheduledAt ? 'Scheduled' : post.status.replace('_', ' ')}
        </span>
      </div>
      <h3 className="mt-3 text-[1.7rem] font-semibold tracking-tight text-slate-950 dark:text-white">{post.title}</h3>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">{getPostPreview(post)}</p>
    </div>

    <div className="mt-4 grid gap-3 text-sm text-slate-500 dark:text-slate-400 sm:grid-cols-3">
      <p>Updated {formatDateTime(post.updatedAt)}</p>
      {scheduledAt ? <p>Scheduled {formatDateTime(scheduledAt)}</p> : <p>Created {formatDateTime(post.createdAt)}</p>}
      <p className="inline-flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> {post.viewsCount}</span>
        <span className="inline-flex items-center gap-1.5"><Heart className="h-3.5 w-3.5" /> {post.likesCount}</span>
        <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" /> {post.commentsCount}</span>
      </p>
    </div>
    {post.status === 'REJECTED' && post.moderationReason ? (
      <p className="mt-3 text-sm text-rose-700 dark:text-rose-200">
        Rejection reason: {post.moderationReason}
      </p>
    ) : null}

    <div className="mt-5 flex flex-wrap items-center gap-2">
      <Link
        to={`/blogs/write?blogId=${post.id}`}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Edit3 className="h-3.5 w-3.5" /> Edit
      </Link>
      {post.status === 'PUBLISHED' && (
        <Link
          to={`/blogs/${post.id}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Eye className="h-3.5 w-3.5" /> View
        </Link>
      )}
    </div>
  </article>
)

const MyWritingPage = () => {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<WritingTab>('ALL')
  const analyticsQuery = useMyBlogAnalytics(Boolean(user?.id))

  const { data: publishedFeed, isLoading: loadingPublished } = useBlogs({
    authorId: user?.id,
    status: 'PUBLISHED',
    page: 1,
    limit: 30,
  })
  const { data: draftFeed, isLoading: loadingDrafts } = useBlogs({
    authorId: user?.id,
    status: 'DRAFT',
    page: 1,
    limit: 30,
  })
  const { data: pendingFeed, isLoading: loadingPending } = useBlogs({
    authorId: user?.id,
    status: 'PENDING_REVIEW',
    page: 1,
    limit: 30,
  })
  const { data: rejectedFeed, isLoading: loadingRejected } = useBlogs({
    authorId: user?.id,
    status: 'REJECTED',
    page: 1,
    limit: 30,
  })

  const published = publishedFeed?.items ?? []
  const drafts = draftFeed?.items ?? []
  const pending = pendingFeed?.items ?? []
  const rejected = rejectedFeed?.items ?? []
  const { scheduled, plainDrafts } = useMemo(() => classifyDrafts(drafts), [drafts])

  const visibleItems = useMemo(() => {
    if (tab === 'PUBLISHED') return published
    if (tab === 'DRAFT') return plainDrafts
    if (tab === 'SCHEDULED') return scheduled
    if (tab === 'PENDING_REVIEW') return pending
    if (tab === 'REJECTED') return rejected
    return [...scheduled, ...plainDrafts, ...pending, ...rejected, ...published]
  }, [pending, plainDrafts, published, rejected, scheduled, tab])

  const loading = loadingPublished || loadingDrafts || loadingPending || loadingRejected

  const counts = {
    ALL: scheduled.length + plainDrafts.length + pending.length + rejected.length + published.length,
    PUBLISHED: published.length,
    DRAFT: plainDrafts.length,
    SCHEDULED: scheduled.length,
    PENDING_REVIEW: pending.length,
    REJECTED: rejected.length,
  }
  const analytics = analyticsQuery.data
  const latestUpdatedPost = useMemo(
    () => [...published, ...scheduled, ...plainDrafts, ...pending, ...rejected]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0],
    [pending, plainDrafts, published, rejected, scheduled],
  )
  const topPost = analytics?.topPosts[0]
  const metrics = [
    { label: 'Posts', value: analytics?.summary.totalPosts ?? counts.ALL, icon: FileText },
    { label: 'Views', value: analytics?.summary.totalViews ?? 0, icon: Eye },
    { label: 'Likes', value: analytics?.summary.totalLikes ?? 0, icon: Heart },
    { label: 'Comments', value: analytics?.summary.totalComments ?? 0, icon: MessageCircle },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 pt-2 sm:px-6 sm:pb-8 sm:pt-3 lg:px-8 lg:pb-8 lg:pt-4">
      <header className="relative left-1/2 mb-12 w-screen -translate-x-1/2 overflow-hidden border-y border-slate-200/80 bg-[linear-gradient(135deg,rgba(248,250,252,0.98)_0%,rgba(255,255,255,0.98)_38%,rgba(239,246,255,0.95)_100%)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(15,23,42,0.92)_48%,rgba(30,41,59,0.92)_100%)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_26%,rgba(148,163,184,0.18),rgba(255,255,255,0)_32%),radial-gradient(circle_at_84%_18%,rgba(56,189,248,0.14),rgba(255,255,255,0)_26%),linear-gradient(to_bottom,rgba(255,255,255,0),rgba(255,255,255,0.55))] dark:bg-[radial-gradient(circle_at_14%_26%,rgba(148,163,184,0.14),rgba(15,23,42,0)_32%),radial-gradient(circle_at_84%_18%,rgba(56,189,248,0.12),rgba(15,23,42,0)_26%),linear-gradient(to_bottom,rgba(15,23,42,0),rgba(15,23,42,0.45))]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/70 to-transparent dark:via-sky-400/40" />
        <div className="relative mx-auto max-w-[1440px] px-4 py-14 sm:px-6 lg:px-10 xl:px-14">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1.2fr)_380px] xl:items-end">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Writer Studio</p>
              <h1 className="mt-3 max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-6xl dark:text-white">
                My Writing
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Draft essays, shape poems, and track what is resonating without the page feeling like admin software.
              </p>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/80 bg-white/78 px-5 py-5 backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Published</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{counts.PUBLISHED}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/78 px-5 py-5 backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Total Views</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{analytics?.summary.totalViews ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/78 px-5 py-5 backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Latest activity</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    {latestUpdatedPost ? formatDateTime(latestUpdatedPost.updatedAt) : 'No writing updates yet'}
                  </p>
                </div>
              </div>
            </div>

            <div className="justify-self-start xl:justify-self-end">
              <div className="w-full max-w-[380px] rounded-[2rem] border border-white/75 bg-white/82 p-6 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.22)] backdrop-blur dark:border-white/10 dark:bg-slate-950/35">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Studio Pulse</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {topPost
                        ? 'Your most-read piece is leading the room right now.'
                        : 'Start a new piece and build the first signal for your studio.'}
                    </p>
                  </div>
                  <div className="rounded-full border border-sky-200/80 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                    Live
                  </div>
                </div>

                {topPost ? (
                  <div className="mt-6 rounded-2xl border border-sky-100 bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(239,246,255,0.96)_100%)] px-5 py-5 text-slate-950 shadow-[0_18px_40px_-30px_rgba(14,116,144,0.35)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.9)_0%,rgba(14,116,144,0.16)_100%)] dark:text-white dark:shadow-[0_18px_40px_-30px_rgba(2,6,23,0.8)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-white/60">Best performing</p>
                    <p className="mt-2 text-xl font-semibold leading-7">{topPost.title}</p>
                    <div className="mt-4 flex items-center gap-4 text-sm text-slate-600 dark:text-white/75">
                      <span className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4" /> {topPost.viewsCount}</span>
                      <span className="inline-flex items-center gap-1.5"><Heart className="h-4 w-4" /> {topPost.likesCount}</span>
                      <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> {topPost.commentsCount}</span>
                    </div>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    to="/blogs/write"
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_-24px_rgba(15,23,42,0.7)] transition hover:bg-slate-800 dark:bg-amber-300 dark:text-slate-900 dark:hover:bg-amber-200"
                  >
                    <PenLine className="h-4 w-4" /> Write New
                  </Link>
                  {topPost ? (
                    <Link
                      to={`/blogs/${topPost.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      View top post <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="mb-7 grid gap-8 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="border-t border-slate-200/80 pt-5 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <BarChart3 className="h-4 w-4" />
              Writer analytics
            </div>
            <p className="text-xs text-slate-400">Performance snapshot</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1.05fr_repeat(3,minmax(0,1fr))]">
            {metrics.map((metric, index) => {
              const Icon = metric.icon
              return (
                <div
                  key={metric.label}
                  className={cn(
                    'rounded-[1.25rem] border p-4 dark:border-white/10',
                    index === 0
                      ? 'border-sky-100 bg-sky-50/80 text-slate-950 shadow-[0_18px_40px_-34px_rgba(14,116,144,0.25)] dark:bg-white/10 dark:text-white'
                      : 'border-slate-200/80 bg-transparent dark:bg-transparent',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className={cn('text-xs font-semibold uppercase tracking-[0.14em]', index === 0 ? 'text-slate-500 dark:text-white/70' : 'text-slate-500')}>{metric.label}</p>
                    <Icon className={cn('h-4 w-4', index === 0 ? 'text-slate-400 dark:text-white/70' : 'text-slate-400')} />
                  </div>
                  <p className={cn('mt-4 text-3xl font-semibold', index === 0 ? 'text-slate-950 dark:text-white' : 'text-slate-950 dark:text-white')}>{metric.value}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-t border-slate-200/80 pt-5 dark:border-white/10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Top posts</p>
            <p className="text-xs text-slate-400">What is pulling readers in</p>
          </div>
          <div className="mt-4 space-y-3">
            {(analytics?.topPosts ?? []).slice(0, 3).map((post, index) => (
              <Link
                key={post.id}
                to={`/blogs/${post.id}`}
                className="block border-b border-slate-200/80 pb-4 transition hover:text-slate-950 dark:border-white/10 dark:hover:text-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Rank {index + 1}</p>
                    <p className="mt-1 line-clamp-2 font-semibold text-slate-900 dark:text-white">{post.title}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                    {post.status.toLowerCase()}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{post.viewsCount}</span>
                  <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" />{post.likesCount}</span>
                  <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{post.commentsCount}</span>
                </div>
              </Link>
            ))}
            {!analyticsQuery.isLoading && (analytics?.topPosts.length ?? 0) === 0 ? (
              <div className="border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                Publish a few posts and this panel will highlight the ones readers return to most.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mb-7 overflow-x-auto border-b border-slate-200/80 dark:border-white/10">
        <div className="inline-flex min-w-max gap-1">
          {(['ALL', 'PUBLISHED', 'DRAFT', 'SCHEDULED', 'PENDING_REVIEW', 'REJECTED'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                'inline-flex items-center gap-2 border-b-2 px-4 pb-3 text-xs font-semibold uppercase tracking-[0.14em] transition',
                tab === item
                  ? 'border-slate-950 text-slate-950 dark:border-slate-100 dark:text-slate-100'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
              )}
            >
              {item === 'SCHEDULED' ? <Clock3 className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
              <span>{item.replace('_', ' ')}</span>
              <span className={cn(
                'text-[10px]',
                tab === item ? 'text-slate-950 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500',
              )}>
                {counts[item]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900/35 dark:text-slate-400">
          Loading your posts...
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/80 p-10 text-center text-sm text-slate-500 dark:border-white/15 dark:bg-slate-900/35 dark:text-slate-400">
          No posts in this section yet.
        </div>
      ) : (
        <div className="space-y-8">
          {visibleItems.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              scheduledAt={'scheduledAt' in post ? String((post as { scheduledAt?: string }).scheduledAt ?? '') : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default MyWritingPage
