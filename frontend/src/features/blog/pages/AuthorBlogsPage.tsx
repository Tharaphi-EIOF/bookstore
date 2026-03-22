import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import { Heart, MessageCircle, Eye, FileText, PenLine, ChevronDown } from 'lucide-react'
import { getStoredContentPresentation, getStoredContentText, renderStoredContentHtml } from '@/lib/editor'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import BlogBreadcrumbs from '@/features/blog/components/BlogBreadcrumbs'
import FollowStateBadge from '@/features/blog/components/FollowStateBadge'
import {
  type Blog,
  type BlogFeedTab,
  useBlogs,
  useBlogPageSettings,
  useFollowAuthor,
  useFollowedAuthors,
  useLikeBlog,
  useMyLikedBlogPosts,
  useStaffPicks,
  useTrendingBlogTags,
  useUnfollowAuthor,
  useUnlikeBlog,
} from '@/features/blog/services/blogs'

const FEED_TABS: Array<{ key: BlogFeedTab; label: string }> = [
  { key: 'for_you', label: 'For You' },
  { key: 'trending', label: 'Trending' },
  { key: 'latest', label: 'Blogs' },
  { key: 'poems', label: 'Poems' },
  { key: 'following', label: 'Following' },
]

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

const readTagsFromParams = (params: URLSearchParams) => {
  const legacyTags = params
    .getAll('tag')
    .map((name) => name.trim())
    .filter(Boolean)
  const commaTags = (params.get('tags') || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)

  return Array.from(new Set([...legacyTags, ...commaTags]))
}

const blogVisualStyle = (blog: Blog, variant: 'hero' | 'tile' = 'hero') => {
  if (blog.coverImage) {
    const overlay = variant === 'hero'
      ? 'linear-gradient(180deg,rgba(2,6,23,0.24),rgba(2,6,23,0.78))'
      : 'linear-gradient(180deg,rgba(2,6,23,0.2),rgba(2,6,23,0.72))'
    return { backgroundImage: `${overlay},url(${blog.coverImage})` }
  }

  return {
    backgroundImage:
      variant === 'hero'
        ? 'linear-gradient(145deg,#172033,#243f5a 48%,#2f5f68 100%)'
        : 'linear-gradient(145deg,#1f2937,#334155 55%,#475569 100%)',
  }
}

const getBlogKindMeta = (blog: Blog) => {
  const presentation = getStoredContentPresentation(blog.content)

  if (presentation?.mode === 'POEM') {
    return {
      isPoem: true,
      eyebrowClassName: 'text-amber-100/90',
    }
  }

  return {
    isPoem: false,
    eyebrowClassName: 'text-white/80',
  }
}

const isPoemPost = (blog: Blog) => getStoredContentPresentation(blog.content)?.mode === 'POEM'

const getPoemPreviewLines = (blog: Blog, maxLines = 4) => {
  if (typeof window === 'undefined') return []

  const html = renderStoredContentHtml(blog.content)
  const normalizedHtml = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n</p>')
    .replace(/<\/div>/gi, '\n</div>')
  
  const doc = new DOMParser().parseFromString(`<div>${normalizedHtml}</div>`, 'text/html')
  
  const lines = (doc.body.textContent || '')
    .split(/\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  if (lines.length > 0) return lines.slice(0, maxLines)

  return getStoredContentText(blog.content)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxLines)
}

const getBlogPreviewText = (blog: Blog, maxLength = 180) => {
  const source = (blog.subtitle || getStoredContentText(blog.content)).trim()
  if (source.length <= maxLength) return source
  return `${source.slice(0, maxLength).trimEnd()}...`
}

const MosaicPostCard = ({
  blog,
  className,
  priority = false,
}: {
  blog: Blog
  className?: string
  priority?: boolean
}) => {
  const kindMeta = getBlogKindMeta(blog)
  const poemLines = kindMeta.isPoem ? getPoemPreviewLines(blog, priority ? 4 : 3) : []
  const blogPreview = kindMeta.isPoem ? '' : getBlogPreviewText(blog, priority ? 160 : 110)

  return (
    <Link
      to={`/blogs/${blog.id}`}
      className={cn(
        'tone-hover-gold group relative overflow-hidden rounded-2xl border border-slate-200/70 shadow-[0_14px_28px_-18px_rgba(15,23,42,0.55)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_32px_-18px_rgba(15,23,42,0.62)] dark:border-white/15',
        className,
      )}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.04]"
        style={blogVisualStyle(blog, priority ? 'hero' : 'tile')}
      />
      <div className="relative z-10 flex h-full min-h-[170px] flex-col justify-between p-4 text-white">
        <div />
        <div className={cn(kindMeta.isPoem && 'max-w-[32rem]')}>
          <p className={cn('text-[11px] font-semibold uppercase tracking-[0.16em]', kindMeta.eyebrowClassName)}>
            {blog.author.name} · {blog.readingTime} min
          </p>
          <h3 className={cn('mt-1 font-semibold leading-tight', priority ? 'text-3xl' : 'line-clamp-2 text-xl')}>
            {blog.title}
          </h3>
          {kindMeta.isPoem ? (
            <div className="mt-3 space-y-1.5 text-[15px] italic leading-7 text-white/88">
              {poemLines.map((line, index) => (
                <p key={`${blog.id}-poem-line-${index}`} className="line-clamp-1">
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-2 max-w-md line-clamp-2 text-sm leading-6 text-white/78">
              {blogPreview}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

const BlogCard = ({
  blog,
  isAuthed,
  isLiked,
  isFollowingAuthor,
  canFollow,
  onToggleLike,
  onToggleFollow,
  onToggleTag,
  activeTags,
}: {
  blog: Blog
  isAuthed: boolean
  isLiked: boolean
  isFollowingAuthor: boolean
  canFollow: boolean
  onToggleLike: (blog: Blog, liked: boolean) => void
  onToggleFollow: (blog: Blog, following: boolean) => void
  onToggleTag: (tagName: string) => void
  activeTags: Set<string>
}) => {
  const kindMeta = getBlogKindMeta(blog)
  const poemLines = kindMeta.isPoem ? getPoemPreviewLines(blog, 4) : []
  const blogPreview = kindMeta.isPoem ? '' : getBlogPreviewText(blog)

  return (
    <article className="border-b border-slate-200/85 pb-5 last:border-b-0 dark:border-white/10">
      <div className="mb-2.5 flex items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
        <div className="inline-flex min-w-0 items-center gap-2">
          <Link to={`/user/${blog.author.id}`} className="inline-flex items-center gap-2 hover:text-slate-900 dark:hover:text-slate-100">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {blog.author.name.slice(0, 1)}
            </span>
            <span className="font-medium">{blog.author.name}</span>
          </Link>
          <span className="truncate">{formatDate(blog.createdAt)} · {blog.readingTime} min read</span>
        </div>
        {canFollow && (
          <button
            type="button"
            onClick={() => onToggleFollow(blog, isFollowingAuthor)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition',
              isFollowingAuthor
                ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                : 'border-slate-300 text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300',
            )}
          >
            <FollowStateBadge followed={isFollowingAuthor} className="h-4.5 w-4.5" />
            {isFollowingAuthor ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      <Link to={`/blogs/${blog.id}`} className="block space-y-1.5">
        <h2 className="max-w-4xl text-[1.9rem] font-semibold tracking-tight leading-[1.1] text-slate-950 transition-colors hover:text-primary-700 dark:text-slate-50 dark:hover:text-amber-200 sm:text-[2rem]">
          {blog.title}
        </h2>
        {kindMeta.isPoem ? (
          <div className="max-w-2xl space-y-1.5 pt-1 text-[17px] italic leading-8 text-slate-700 dark:text-slate-300">
            {poemLines.map((line, index) => (
              <p key={`${blog.id}-feed-poem-line-${index}`} className="line-clamp-1">
                {line}
              </p>
            ))}
          </div>
        ) : (
          <p className="max-w-3xl line-clamp-3 text-[15px] leading-6 text-slate-600 dark:text-slate-400">{blogPreview}</p>
        )}
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {blog.tags.slice(0, 4).map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => onToggleTag(tag.name)}
            className={cn(
              'tone-hover-gold rounded-full px-2.5 py-1 text-xs font-medium transition duration-200 hover:scale-[1.03] active:scale-[0.98]',
              activeTags.has(tag.name)
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
            )}
          >
            #{tag.name}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <button
          type="button"
          disabled={!isAuthed}
          onClick={() => onToggleLike(blog, isLiked)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition-all',
            isLiked ? 'text-rose-500' : 'hover:text-slate-900 dark:hover:text-slate-200',
            isLiked ? 'hover:bg-rose-50 dark:hover:bg-rose-950/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800',
            !isAuthed && 'cursor-not-allowed opacity-60',
          )}
          title={isAuthed ? 'Like this post' : 'Login to like posts'}
        >
          <Heart className={cn('h-4 w-4 transition-transform duration-200 active:scale-90', isLiked && 'fill-current')} />
          <span>{blog.likesCount}</span>
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"><MessageCircle className="h-4 w-4" />{blog.commentsCount}</span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800"><Eye className="h-4 w-4" />{blog.viewsCount}</span>
      </div>
    </article>
  )
}

const PoemFeedCard = ({
  blog,
  isAuthed,
  isLiked,
  onToggleLike,
}: {
  blog: Blog
  isAuthed: boolean
  isLiked: boolean
  onToggleLike: (blog: Blog, liked: boolean) => void
}) => {
  const poemLines = getPoemPreviewLines(blog, 4)

  return (
    <article className="mx-auto max-w-3xl border-b border-slate-200/80 pb-8 text-center last:border-b-0 dark:border-white/10">
      <div className="px-4 sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          {blog.author.name} · {formatDate(blog.createdAt)}
        </p>
        <Link to={`/blogs/${blog.id}`} className="mt-4 block">
          <h2 className="font-serif text-4xl font-semibold tracking-tight text-slate-950 transition-colors hover:text-amber-800 dark:text-slate-50 dark:hover:text-amber-200 sm:text-5xl">
            {blog.title}
          </h2>
          {blog.subtitle && (
            <p className="mt-3 text-base italic text-slate-500 dark:text-slate-400">{blog.subtitle}</p>
          )}
          <div className="mx-auto mt-8 max-w-2xl space-y-2 text-left text-[20px] leading-[1.6] text-slate-700 dark:text-slate-300">
            {poemLines.map((line, index) => (
              <p key={`${blog.id}-poem-shelf-line-${index}`}>{line}</p>
            ))}
            <p className="pt-2 text-[16px] font-semibold text-slate-500 transition-colors hover:text-amber-600 dark:hover:text-amber-400">
              See more...
            </p>
          </div>
        </Link>
        <div className="mt-6 flex items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <button
            type="button"
            disabled={!isAuthed}
            onClick={() => onToggleLike(blog, isLiked)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition-all',
              isLiked ? 'text-rose-500' : 'hover:text-slate-900 dark:hover:text-slate-200',
              !isAuthed && 'cursor-not-allowed opacity-60',
            )}
            title={isAuthed ? 'Like this poem' : 'Login to like poems'}
          >
            <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} />
            <span>{blog.likesCount}</span>
          </button>
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4" />
            {blog.commentsCount}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            {blog.viewsCount}
          </span>
        </div>
      </div>
    </article>
  )
}

const SidebarSection = ({
  title,
  countLabel,
  defaultOpen = false,
  children,
}: {
  title: string
  countLabel?: string
  defaultOpen?: boolean
  children: ReactNode
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="border-t border-slate-200/80 pt-5 dark:border-white/10">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={isOpen}
      >
        <div className="min-w-0">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">{title}</h2>
          {countLabel && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{countLabel}</p>}
        </div>
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 transition dark:text-slate-400">
          <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')} />
        </span>
      </button>

      {isOpen && <div className="mt-4">{children}</div>}
    </section>
  )
}

const AuthorBlogsPage = () => {
  // Feed selection and tag filters live in the URL so the page is linkable/shareable.
  const { isAuthenticated, user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab') as BlogFeedTab | null
  const tab = rawTab || 'for_you'
  const [page, setPage] = useState(1)
  const selectedTags = useMemo(() => readTagsFromParams(searchParams), [searchParams])
  const selectedTagSet = useMemo(() => new Set(selectedTags), [selectedTags])

  // Reset pagination when filter chips change.
  useEffect(() => {
    setPage(1)
  }, [selectedTags.join('|')])

  // URL-driven tag filter helpers.
  const toggleTagFilter = (tagName: string) => {
    const normalized = tagName.trim()
    if (!normalized) return

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      const currentTags = readTagsFromParams(next)
      const hasTag = currentTags.includes(normalized)
      const nextTags = hasTag
        ? currentTags.filter((item) => item !== normalized)
        : [...currentTags, normalized]
      next.delete('tag')
      if (nextTags.length > 0) {
        next.set('tags', nextTags.join(','))
      } else {
        next.delete('tags')
      }
      return next
    })
  }

  const clearTagFilters = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('tag')
      next.delete('tags')
      return next
    })
  }

  // Feed data, profile chrome, and social actions.
  const { data: feed, isLoading, error: feedError } = useBlogs({ tab, tags: selectedTags, page, limit: 10 })
  const { data: pageSettings } = useBlogPageSettings()
  const { data: tags = [] } = useTrendingBlogTags()
  const { data: staffPicks = [] } = useStaffPicks()
  const { data: follows = [] } = useFollowedAuthors(isAuthenticated)
  const { data: liked = { postIds: [] } } = useMyLikedBlogPosts(isAuthenticated)

  const likeMutation = useLikeBlog()
  const unlikeMutation = useUnlikeBlog()
  const followMutation = useFollowAuthor()
  const unfollowMutation = useUnfollowAuthor()

  const likedSet = useMemo(() => new Set(liked.postIds), [liked.postIds])
  const followedSet = useMemo(() => new Set(follows.map((f) => f.authorId)), [follows])

  // Page composition for hero mosaic, editorial picks, and feed list.
  const items = feed?.items ?? []
  const isPoemsTab = tab === 'poems'
  const isBlogsTab = tab === 'latest'
  const visibleItems = useMemo(() => {
    if (isPoemsTab) return items.filter((blog) => isPoemPost(blog))
    if (isBlogsTab) return items.filter((blog) => !isPoemPost(blog))
    return items
  }, [isBlogsTab, isPoemsTab, items])
  const heroPosts = visibleItems.slice(0, 5)
  const leadHeroPost = heroPosts[0]
  const secondaryHeroPosts = heroPosts.slice(1, 3)
  const tertiaryHeroPosts = heroPosts.slice(3, 5)
  const total = visibleItems.length
  const feedOffset = visibleItems.length > 6 ? 5 : 1
  const feedPosts = visibleItems.slice(feedOffset)
  const mainFeedPosts = isPoemsTab
    ? visibleItems
    : feedPosts.length > 0
      ? feedPosts
      : visibleItems.slice(1)
  const editorialSource = useMemo(() => {
    if (staffPicks.length === 0) return visibleItems
    if (isPoemsTab) return staffPicks.filter((blog) => isPoemPost(blog))
    if (isBlogsTab) return staffPicks.filter((blog) => !isPoemPost(blog))
    return staffPicks
  }, [isBlogsTab, isPoemsTab, staffPicks, visibleItems])
  const editorialPicks = editorialSource.slice(0, 4)
  const editorialLead = editorialPicks[0]
  const editorialList = editorialPicks.slice(1)
  const totalPages = Math.max(1, Math.ceil((feed?.total ?? total) / (feed?.limit ?? 10)))

  // Social interactions from the feed cards.
  const handleToggleLike = (blog: Blog, currentlyLiked: boolean) => {
    if (!isAuthenticated) return
    if (currentlyLiked) {
      void unlikeMutation.mutateAsync(blog.id)
      return
    }
    void likeMutation.mutateAsync(blog.id)
  }

  const handleToggleFollow = (blog: Blog, currentlyFollowing: boolean) => {
    if (!isAuthenticated) return
    if (currentlyFollowing) {
      void unfollowMutation.mutateAsync(blog.authorId)
      return
    }
    void followMutation.mutateAsync(blog.authorId)
  }

  const popularAuthors = useMemo(() => {
    const map = new Map<string, { id: string; name: string; posts: number }>()
    for (const post of visibleItems) {
      const prev = map.get(post.author.id)
      map.set(post.author.id, {
        id: post.author.id,
        name: post.author.name,
        posts: (prev?.posts ?? 0) + 1,
      })
    }
    return Array.from(map.values()).sort((a, b) => b.posts - a.posts).slice(0, 5)
  }, [visibleItems])

  const hasActiveTagFilters = selectedTags.length > 0

  return (
    <div className="relative mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Page heading and primary author-writing actions. */}
      <BlogBreadcrumbs
        className="mb-6"
        items={[
          { label: 'Home', to: '/' },
          { label: 'Blogs' },
        ]}
      />
      <header className="mb-8 border-b border-slate-200/80 pb-6 dark:border-white/10">
        <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{pageSettings?.eyebrow || 'Treasure House'}</p>
          <h1 className="mt-2 text-5xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">Stories</h1>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-2">
            <Link
              to="/blogs/mine"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <FileText className="h-4 w-4" /> My Writing
            </Link>
            <Link
              to="/blogs/write"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-amber-300 dark:text-slate-900 dark:hover:bg-amber-200"
            >
              <PenLine className="h-4 w-4" /> Write
            </Link>
          </div>
        )}
        </div>
      </header>

      {/* Feed tab switcher and active tag chips. */}
      <div className="mb-6 border-b border-slate-200/80 dark:border-white/10">
        <div className="inline-flex flex-wrap items-center gap-6">
        {FEED_TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setSearchParams(prev => {
                const next = new URLSearchParams(prev)
                if (item.key === 'for_you') {
                  next.delete('tab')
                } else {
                  next.set('tab', item.key)
                }
                return next
              })
              setPage(1)
            }}
            className={cn(
              'border-b-2 pb-3 text-sm font-semibold transition-colors duration-200',
              tab === item.key
                ? 'border-slate-900 text-slate-950 dark:border-slate-100 dark:text-slate-100'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
            )}
          >
            {item.label}
          </button>
        ))}
        </div>
      </div>
      {selectedTags.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Active tags</span>
          {selectedTags.map((tagName) => (
            <button
              key={tagName}
              type="button"
              onClick={() => toggleTagFilter(tagName)}
              className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              #{tagName} ×
            </button>
          ))}
          <button
            type="button"
            onClick={clearTagFilters}
            className="rounded-full px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr),280px] xl:grid-cols-[minmax(0,1fr),300px]">
        <section className="space-y-7">
          {/* Top-of-feed mosaic spotlight. */}
          {!isPoemsTab && leadHeroPost && (
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-4"
            >
              <div className="border-b border-slate-200/80 pb-3 dark:border-white/10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Featured</p>
              </div>
              <div className="grid gap-3 md:grid-cols-[1.25fr_0.75fr]">
                <MosaicPostCard blog={leadHeroPost} priority className="min-h-[330px]" />
                <div className="grid gap-3">
                  {secondaryHeroPosts.map((blog) => (
                    <MosaicPostCard key={blog.id} blog={blog} className="min-h-[158px]" />
                  ))}
                </div>
              </div>
              {tertiaryHeroPosts.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {tertiaryHeroPosts.map((blog) => (
                    <MosaicPostCard key={blog.id} blog={blog} className="min-h-[158px]" />
                  ))}
                </div>
              )}
            </motion.section>
          )}

          {/* Curated editorial picks section. */}
          {!isPoemsTab && editorialLead && (
            <section className="border-b border-slate-200/80 pb-8 dark:border-white/10">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Editor&apos;s Picks</p>
                <Link to={`/blogs/${editorialLead.id}`} className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                  Open Story
                </Link>
              </div>
              <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                <MosaicPostCard blog={editorialLead} className="min-h-[280px]" />
                <div className="space-y-3">
                  {editorialList.map((pick) => (
                    <Link
                      key={pick.id}
                      to={`/blogs/${pick.id}`}
                      className="tone-hover-gold block border-b border-slate-200/80 pb-3 transition hover:text-slate-950 dark:border-white/10 dark:hover:text-white"
                    >
                      <p className="line-clamp-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">{pick.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{pick.author.name} · {pick.readingTime} min</p>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Main chronological/tag-filtered feed states. */}
          {!isAuthenticated && tab === 'following' && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
              <Link to="/login" className="font-semibold text-primary-600 dark:text-amber-300">Login</Link> to view posts from authors you follow.
            </div>
          )}

          {feedError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
              Failed to load blog posts.
            </div>
          ) : isLoading ? (
            <div className="text-sm text-slate-500">Loading posts...</div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500 dark:border-slate-700">
              No posts available in this feed.
            </div>
          ) : (
            <div>
              <div className="mb-5 border-b border-slate-200/80 pb-3 dark:border-white/10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  {isPoemsTab ? 'Poem Shelf' : isBlogsTab ? 'Latest Blogs' : 'Latest Reads'}
                </p>
              </div>
              <div className={isPoemsTab ? 'space-y-10' : 'space-y-7'}>
              {mainFeedPosts.map((blog, idx) => (
                <motion.div
                  key={blog.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut', delay: idx * 0.04 }}
                >
                  {isPoemsTab ? (
                    <PoemFeedCard
                      blog={blog}
                      isAuthed={isAuthenticated}
                      isLiked={likedSet.has(blog.id)}
                      onToggleLike={handleToggleLike}
                    />
                  ) : (
                    <BlogCard
                      blog={blog}
                      isAuthed={isAuthenticated}
                      isLiked={likedSet.has(blog.id)}
                      isFollowingAuthor={followedSet.has(blog.authorId)}
                      canFollow={isAuthenticated && blog.authorId !== user?.id}
                      onToggleLike={handleToggleLike}
                      onToggleFollow={handleToggleFollow}
                      onToggleTag={toggleTagFilter}
                      activeTags={selectedTagSet}
                    />
                  )}
                </motion.div>
              ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40 dark:border-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        {/* Right rail for discovery filters and supporting collections. */}
        <aside className="space-y-6 border-l border-slate-200/80 pl-6 lg:sticky lg:top-24 lg:self-start dark:border-white/10">
          <SidebarSection
            title="Trending Tags"
            countLabel={tags.length > 0 ? `${tags.length} tags` : undefined}
            defaultOpen={hasActiveTagFilters || tags.length > 0}
          >
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 && <p className="text-sm text-slate-500">No tags yet.</p>}
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    toggleTagFilter(tag.name)
                    setPage(1)
                  }}
                  className={cn(
                    'tone-hover-gold rounded-full px-2.5 py-1 text-xs font-medium',
                    selectedTagSet.has(tag.name)
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                  )}
                >
                  #{tag.name} ({tag.usageCount})
                </button>
              ))}
            </div>
          </SidebarSection>

          <SidebarSection
            title="Popular Authors"
            countLabel={popularAuthors.length > 0 ? `${popularAuthors.length} authors` : undefined}
          >
            <div className="space-y-3 text-sm">
              {popularAuthors.length === 0 && <p className="text-slate-500">No data yet.</p>}
              {popularAuthors.map((author) => (
                <Link
                  key={author.id}
                  to={`/user/${author.id}`}
                  className="flex items-center justify-between text-slate-700 hover:text-primary-700 dark:text-slate-300 dark:hover:text-amber-200"
                >
                  <span>{author.name}</span>
                  <span className="text-xs text-slate-500">{author.posts} posts</span>
                </Link>
              ))}
            </div>
          </SidebarSection>

          <SidebarSection
            title="Staff Picks"
            countLabel={staffPicks.length > 0 ? `${staffPicks.length} picks` : undefined}
          >
            <div className="space-y-3">
              {staffPicks.map((pick) => (
                <Link key={pick.id} to={`/blogs/${pick.id}`} className="block">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-800 hover:text-primary-700 dark:text-slate-100 dark:hover:text-amber-200">
                    {pick.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{pick.author.name}</p>
                </Link>
              ))}
              {staffPicks.length === 0 && <p className="text-sm text-slate-500">No staff picks yet.</p>}
            </div>
          </SidebarSection>
        </aside>
      </div>

      {/* Mobile quick actions for writing routes. */}
      {isAuthenticated && (
        <div className="fixed bottom-6 right-6 z-20 flex items-center gap-2 lg:hidden">
          <Link
            to="/blogs/mine"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <FileText className="h-4 w-4" /> Mine
          </Link>
          <Link
            to="/blogs/write"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg dark:bg-amber-300 dark:text-slate-900"
          >
            <PenLine className="h-4 w-4" /> Write
          </Link>
        </div>
      )}
    </div>
  )
}

export default AuthorBlogsPage
