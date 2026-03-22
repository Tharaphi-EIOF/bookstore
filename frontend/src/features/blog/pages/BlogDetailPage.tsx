import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, Copy, Eye, Facebook, Heart, Linkedin, MessageCircle, PanelRightClose, PanelRightOpen, Send, Share2, Trash2, Twitter, X } from 'lucide-react'
import { getErrorMessage } from '@/lib/api'
import { getGeneratedCoverBackground } from '@/features/blog/lib/blogCover'
import { getStoredContentDisplayLines, getStoredContentPresentation, renderStoredContentHtml } from '@/lib/editor'
import { WRITER_FONTS } from '@/features/blog/write/constants'
import { useAuthStore } from '@/store/auth.store'
import BlogBreadcrumbs from '@/features/blog/components/BlogBreadcrumbs'
import FollowStateBadge from '@/features/blog/components/FollowStateBadge'
import BookCover from '@/components/ui/BookCover'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'
import {
  useAddBlogComment,
  useApproveBlog,
  useBlogDetails,
  useBlogs,
  useDeleteBlog,
  useDeleteBlogComment,
  useFollowAuthor,
  useFollowedAuthors,
  useRejectBlog,
  useLikeBlog,
  useMyLikedBlogPosts,
  useStaffPicks,
  useUnfollowAuthor,
  useUnlikeBlog,
} from '@/features/blog/services/blogs'

const BlogDetailPage = () => {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const { data: blog, isLoading, error } = useBlogDetails(id, !!id)
  const { data: relatedFeed } = useBlogs({
    tab: 'trending',
    tags: blog?.tags.slice(0, 3).map((tag) => tag.name),
    page: 1,
    limit: 8,
  })
  const { data: staffPicks = [] } = useStaffPicks()
  const { data: follows = [] } = useFollowedAuthors(isAuthenticated)
  const { data: liked = { postIds: [] } } = useMyLikedBlogPosts(isAuthenticated)

  const followMutation = useFollowAuthor()
  const unfollowMutation = useUnfollowAuthor()
  const likeMutation = useLikeBlog()
  const unlikeMutation = useUnlikeBlog()
  const addComment = useAddBlogComment()
  const deleteComment = useDeleteBlogComment()
  const deleteBlog = useDeleteBlog()
  const approveBlog = useApproveBlog()
  const rejectBlog = useRejectBlog()

  const [comment, setComment] = useState('')
  const [feedback, setFeedback] = useState('')
  const [moderationReason, setModerationReason] = useState('')
  const [moderationPanelOpen, setModerationPanelOpen] = useState(true)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [paperViewEnabled, setPaperViewEnabled] = useState(false)
  const [pendingDeleteComment, setPendingDeleteComment] = useState<{
    id: string
    authorName: string
  } | null>(null)

  const isFollowingAuthor = useMemo(
    () => follows.some((f) => f.authorId === blog?.authorId),
    [follows, blog?.authorId],
  )
  const isLiked = useMemo(
    () => (blog ? liked.postIds.includes(blog.id) : false),
    [liked.postIds, blog],
  )
  const isOwner = user?.id === blog?.authorId
  const canEditOrDelete = user?.id === blog?.authorId || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  const canSupportAuthor = !!blog?.author.supportEnabled && !!blog?.author.supportUrl && user?.id !== blog?.authorId
  const isAdminModerationReview = (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && blog?.status !== 'PUBLISHED'
  const statusNotice = useMemo(() => {
    if (!blog) return null
    if (!isOwner && user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') return null
    if (blog.status === 'PUBLISHED') return null

    if (blog.status === 'PENDING_REVIEW') {
      return {
        tone: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200',
        title: 'Waiting for approval',
        description: 'This post is submitted and pending moderation review. It is not public yet.',
      }
    }

    if (blog.status === 'REJECTED') {
      return {
        tone: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200',
        title: 'Post rejected',
        description: blog.moderationReason
          ? `Reason: ${blog.moderationReason}`
          : 'Your post was rejected by moderation. Please update and resubmit.',
      }
    }

    return {
      tone: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200',
      title: 'Draft',
      description: 'This post is still a draft and not public.',
    }
  }, [blog, isOwner, user?.role])
  const relatedByTags = useMemo(() => {
    if (!blog) return []
    const currentTagNames = new Set(blog.tags.map((tag) => tag.name))
    return (relatedFeed?.items ?? [])
      .filter((item) => item.id !== blog.id)
      .filter((item) => item.tags.some((tag) => currentTagNames.has(tag.name)))
      .slice(0, 5)
  }, [blog, relatedFeed?.items])
  const fallbackRelated = useMemo(() => {
    if (!blog) return []
    return staffPicks
      .filter((item) => item.id !== blog.id)
      .slice(0, 5)
  }, [blog, staffPicks])
  const relatedPosts = relatedByTags.length > 0 ? relatedByTags : fallbackRelated
  const paperPresentation = useMemo(
    () => getStoredContentPresentation(blog?.content ?? ''),
    [blog?.content],
  )
  const poemSignature = paperPresentation?.authorSignature?.trim() || blog?.author.name || ''
  const poemDisplayLines = useMemo(
    () => getStoredContentDisplayLines(blog?.content ?? ''),
    [blog?.content],
  )
  const hasPaperPresentation = paperPresentation?.mode === 'POEM'
  const paperTemplateClass =
    paperPresentation?.paperTemplate === 'aged'
      ? 'bg-[#f4e6c7]'
      : paperPresentation?.paperTemplate === 'linen'
        ? 'bg-[#f8f6ef]'
        : paperPresentation?.paperTemplate === 'charcoal'
          ? 'bg-[#17171b]'
          : 'bg-[#fbf4e2]'
  const inkToneClass =
    paperPresentation?.inkTone === 'midnight'
      ? 'text-[#1f2b45]'
      : paperPresentation?.inkTone === 'moss'
        ? 'text-[#1f3c2f]'
        : paperPresentation?.inkTone === 'wine'
          ? 'text-[#4b2332]'
          : paperPresentation?.paperTemplate === 'charcoal'
            ? 'text-slate-100'
            : 'text-[#4c3322]'
  const moderationBusy = approveBlog.isPending || rejectBlog.isPending
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareText = blog ? `${blog.title}` : 'Check this blog post'
  const poemReadingFont = useMemo(
    () =>
      WRITER_FONTS.find((font) => font.key === paperPresentation?.writerFont) ??
      WRITER_FONTS.find((font) => font.key === 'serif') ??
      WRITER_FONTS[0],
    [paperPresentation?.writerFont],
  )
  const blogFallbackCover = getGeneratedCoverBackground(
    `${blog?.id ?? id}:${blog?.title ?? 'post'}:${blog?.authorId ?? 'author'}`,
  )
  const breadcrumbSection = hasPaperPresentation
    ? { label: 'Poems', to: '/blogs?tab=poems' }
    : { label: 'Blogs', to: '/blogs' }

  useEffect(() => {
    setModerationReason(blog?.moderationReason ?? '')
  }, [blog?.id, blog?.moderationReason])

  useEffect(() => {
    setPaperViewEnabled(hasPaperPresentation)
  }, [hasPaperPresentation, blog?.id])

  const handleComment = async () => {
    if (!blog || !comment.trim()) return
    try {
      await addComment.mutateAsync({ blogId: blog.id, content: comment.trim() })
      setComment('')
      setFeedback('Comment posted.')
    } catch (error) {
      setFeedback(getErrorMessage(error))
    }
  }

  const handleDelete = async () => {
    if (!blog) return
    try {
      await deleteBlog.mutateAsync(blog.id)
      navigate('/blogs')
    } catch (error) {
      setFeedback(getErrorMessage(error))
    }
  }

  const confirmDeleteComment = async () => {
    if (!blog || !pendingDeleteComment) return
    try {
      await deleteComment.mutateAsync({
        commentId: pendingDeleteComment.id,
        blogId: blog.id,
      })
      setPendingDeleteComment(null)
      setFeedback('Comment deleted.')
    } catch (error) {
      setFeedback(getErrorMessage(error))
    }
  }

  const handleApproveFromReview = async () => {
    if (!blog) return
    setFeedback('')
    try {
      await approveBlog.mutateAsync({
        blogId: blog.id,
        reason: moderationReason.trim() || undefined,
      })
      setModerationReason('')
      setFeedback('Post approved and published.')
    } catch (error) {
      setFeedback(getErrorMessage(error))
    }
  }

  const handleRejectFromReview = async () => {
    if (!blog) return
    setFeedback('')
    const reason = moderationReason.trim()
    if (!reason) {
      setFeedback('Please add a rejection reason before rejecting.')
      return
    }
    try {
      await rejectBlog.mutateAsync({
        blogId: blog.id,
        reason,
      })
      setFeedback('Post rejected.')
    } catch (error) {
      setFeedback(getErrorMessage(error))
    }
  }

  const copyShareLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareCopied(true)
      window.setTimeout(() => setShareCopied(false), 1400)
    } catch {
      setFeedback('Unable to copy link on this browser.')
    }
  }

  const openShareTarget = (target: 'facebook' | 'x' | 'telegram' | 'linkedin') => {
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedText = encodeURIComponent(shareText)
    const link =
      target === 'facebook'
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        : target === 'x'
          ? `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`
          : target === 'telegram'
            ? `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
            : `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    window.open(link, '_blank', 'noopener,noreferrer')
  }

  const openShare = async () => {
    if (!shareUrl) return
    // Use a consistent in-app modal so share controls are always clearly visible.
    setShareOpen(true)
  }

  if (error) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-rose-600">Failed to load this post.</div>
  }

  if (isLoading || !blog) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-slate-500">Loading post...</div>
  }

  return (
    <article className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <BlogBreadcrumbs
        className="mb-4"
        items={[
          { label: 'Home', to: '/' },
          breadcrumbSection,
          { label: blog.title },
        ]}
      />
      {isAdminModerationReview && (
        <>
          <button
            type="button"
            onClick={() => setModerationPanelOpen((prev) => !prev)}
            className="fixed right-4 top-1/2 z-40 -translate-y-1/2 rounded-l-xl rounded-r-md border border-slate-300 bg-white px-2 py-3 text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label={moderationPanelOpen ? 'Collapse moderation panel' : 'Expand moderation panel'}
            title={moderationPanelOpen ? 'Collapse moderation panel' : 'Expand moderation panel'}
          >
            {moderationPanelOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
          </button>

          <aside
            className={`fixed right-0 top-0 z-30 h-full w-[min(92vw,380px)] border-l border-slate-200 bg-white p-4 shadow-xl transition-transform duration-300 dark:border-slate-700 dark:bg-slate-950 ${
              moderationPanelOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="mt-20">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Moderation Action</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Review this post and take action without leaving this page.</p>
              <textarea
                value={moderationReason}
                onChange={(event) => setModerationReason(event.target.value)}
                placeholder="Optional for approval, required for rejection."
                className="mt-3 min-h-[160px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleApproveFromReview}
                  disabled={moderationBusy}
                  className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-300"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={handleRejectFromReview}
                  disabled={moderationBusy}
                  className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900/60 dark:bg-rose-900/20 dark:text-rose-300"
                >
                  Reject
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
      <div className={`grid gap-8 ${isAdminModerationReview ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,1fr),320px]'}`}>
        <div>
          {hasPaperPresentation ? (
            <header className="px-1 py-2 sm:px-2">
              {statusNotice && (
                <div className={`mb-4 rounded-xl border px-3 py-2 text-sm ${statusNotice.tone}`}>
                  <p className="font-semibold">{statusNotice.title}</p>
                  <p className="mt-0.5">{statusNotice.description}</p>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{blog.readingTime} min read</span>
                <span>·</span>
                <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                {blog.status === 'PUBLISHED' && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1"><Eye className="h-4 w-4" />{blog.viewsCount}</span>
                  </>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!isAuthenticated}
                  onClick={() => (isLiked ? unlikeMutation.mutate(blog.id) : likeMutation.mutate(blog.id))}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-300/80 bg-white/70 px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900/45 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current text-rose-500' : ''}`} /> {blog.likesCount}
                </button>
                {isAuthenticated && user?.id !== blog.authorId && (
                  <button
                    type="button"
                    onClick={() => (isFollowingAuthor ? unfollowMutation.mutate(blog.authorId) : followMutation.mutate(blog.authorId))}
                    className={`inline-flex items-center gap-1.5 rounded-full border bg-white/70 px-3 py-1.5 text-sm font-medium transition dark:bg-slate-900/45 ${
                      isFollowingAuthor
                        ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                        : 'border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100'
                    }`}
                  >
                    <FollowStateBadge followed={isFollowingAuthor} />
                    {isFollowingAuthor ? 'Following' : 'Follow'}
                  </button>
                )}
                {canSupportAuthor && (
                  <button
                    type="button"
                    onClick={() => navigate(`/blogs/${blog.id}/support`)}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:border-emerald-600"
                  >
                    Support this author
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void openShare()}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-300/80 bg-white/70 px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/45 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
                >
                  <Share2 className="h-4 w-4" /> Share
                </button>
                <button
                  type="button"
                  onClick={() => setPaperViewEnabled((prev) => !prev)}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800 transition hover:border-amber-400 hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-200"
                >
                  {paperViewEnabled ? 'Plain view' : 'Paper view'}
                </button>
                {canEditOrDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="ml-auto inline-flex items-center gap-1 rounded-full border border-rose-300 bg-white/70 px-3 py-1.5 text-sm text-rose-600 dark:bg-slate-900/45"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                )}
              </div>
            </header>
          ) : (
            <header className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/45">
              <div
                className="relative h-56 w-full bg-cover bg-center"
                style={{
                  backgroundImage: blog.coverImage
                    ? `linear-gradient(180deg,rgba(2,6,23,0.2),rgba(2,6,23,0.74)),url(${blog.coverImage})`
                    : blogFallbackCover,
                }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),rgba(255,255,255,0)_52%)]" />
              </div>
              <div className="border-t border-slate-200/80 px-5 pb-6 pt-5 dark:border-white/10 sm:px-6">
                {statusNotice && (
                  <div className={`mb-4 rounded-xl border px-3 py-2 text-sm ${statusNotice.tone}`}>
                    <p className="font-semibold">{statusNotice.title}</p>
                    <p className="mt-0.5">{statusNotice.description}</p>
                  </div>
                )}
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{blog.readingTime} min read</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{blog.title}</h1>
                {blog.subtitle && <p className="mt-3 text-xl text-slate-600 dark:text-slate-400">{blog.subtitle}</p>}

                <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <Link to={`/user/${blog.author.id}`} className="font-semibold hover:text-slate-900 dark:hover:text-slate-200">{blog.author.name}</Link>
                  <span>·</span>
                  <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                  {blog.status === 'PUBLISHED' && (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1"><Eye className="h-4 w-4" />{blog.viewsCount}</span>
                    </>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {blog.tags.map((tag) => (
                    <Link key={tag.id} to={`/blogs?tag=${encodeURIComponent(tag.name)}`} className="tone-hover-gold rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                      #{tag.name}
                    </Link>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!isAuthenticated}
                    onClick={() => (isLiked ? unlikeMutation.mutate(blog.id) : likeMutation.mutate(blog.id))}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? 'fill-current text-rose-500' : ''}`} /> {blog.likesCount}
                  </button>
                  {isAuthenticated && user?.id !== blog.authorId && (
                    <button
                      type="button"
                      onClick={() => (isFollowingAuthor ? unfollowMutation.mutate(blog.authorId) : followMutation.mutate(blog.authorId))}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        isFollowingAuthor
                          ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200'
                          : 'border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100'
                      }`}
                    >
                      <FollowStateBadge followed={isFollowingAuthor} />
                      {isFollowingAuthor ? 'Following' : 'Follow'}
                    </button>
                  )}
                  {canSupportAuthor && (
                    <button
                      type="button"
                      onClick={() => navigate(`/blogs/${blog.id}/support`)}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:border-emerald-600"
                    >
                      Support this author
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void openShare()}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-slate-100"
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </button>
                  {hasPaperPresentation && (
                    <button
                      type="button"
                      onClick={() => setPaperViewEnabled((prev) => !prev)}
                      className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800 transition hover:border-amber-400 hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-200"
                    >
                      {paperViewEnabled ? 'Plain view' : 'Paper view'}
                    </button>
                  )}
                  {canEditOrDelete && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="ml-auto inline-flex items-center gap-1 rounded-full border border-rose-300 px-3 py-1.5 text-sm text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </header>
          )}

          {paperViewEnabled && hasPaperPresentation ? (
            <section className="mt-8">
              <div className={`relative overflow-hidden rounded-[2rem] shadow-[0_30px_80px_-45px_rgba(15,23,42,0.7)] ${paperTemplateClass}`}>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(120,53,15,0.14),transparent_24%),radial-gradient(circle_at_88%_90%,rgba(120,53,15,0.16),transparent_26%),radial-gradient(circle_at_50%_50%,rgba(120,53,15,0.06),transparent_62%)] opacity-70" />
                <div
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(100,116,139,0.15)_1px,transparent_1px)] bg-[size:100%_2.15rem]"
                  style={{ opacity: paperPresentation?.ruledLines ? 0.45 : 0 }}
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_10%,rgba(120,53,15,0.18),transparent_26%),radial-gradient(circle_at_92%_12%,rgba(161,98,7,0.14),transparent_28%),radial-gradient(circle_at_84%_88%,rgba(120,53,15,0.12),transparent_24%)]"
                  style={{ opacity: (paperPresentation?.grainIntensity ?? 42) / 100 }}
                />
                <div
                  className={`relative z-10 mx-auto max-w-3xl ${inkToneClass}`}
                  style={{ fontFamily: poemReadingFont.cssValue }}
                >
                  <div className="px-7 py-10 sm:px-10 sm:py-12">
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.22em] opacity-50">
                      <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                      <span>{blog.readingTime} min read</span>
                    </div>
                    <header className="mx-auto max-w-2xl pb-10 pt-10 text-center sm:pt-14">
                      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{blog.title}</h1>
                      {blog.subtitle && <p className="mt-4 text-sm opacity-75 sm:text-base">{blog.subtitle}</p>}
                    </header>
                    <div className="mx-auto max-w-3xl">
                      <div className="space-y-1 text-[18px] leading-9 tracking-[0.01em]">
                        {poemDisplayLines.map((line, index) => (
                          <p key={`${blog.id}-detail-poem-line-${index}`} className={line.trim() ? '' : 'h-8'}>
                            {line || '\u00A0'}
                          </p>
                        ))}
                      </div>
                      <footer className="mt-14 flex justify-end border-t border-current/10 pt-6 text-right">
                        <div>
                          <Link
                            to={`/user/${blog.author.id}`}
                            className="block text-lg font-semibold opacity-85 transition hover:opacity-100"
                          >
                            {poemSignature}
                          </Link>
                        </div>
                      </footer>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section
              className={hasPaperPresentation
                ? 'mt-8'
                : 'prose prose-slate mt-8 max-w-none text-[17px] leading-8 dark:prose-invert'}
              style={hasPaperPresentation ? { fontFamily: poemReadingFont.cssValue } : undefined}
            >
              {hasPaperPresentation ? (
                <div className="mx-auto max-w-2xl">
                  {/* Plain poem view keeps the poem title and signature visible. */}
                  <div className="text-slate-700 dark:text-slate-300">
                    <header className="pb-10 text-center">
                      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
                        {blog.title}
                      </h1>
                      {blog.subtitle && <p className="mt-3 text-sm opacity-75 sm:text-base">{blog.subtitle}</p>}
                    </header>
                    <div className="border-l border-slate-200 pl-6 text-[18px] leading-9 tracking-[0.01em] dark:border-slate-700">
                      <div
                        className="[&_blockquote]:!my-5 [&_h1]:!my-6 [&_h2]:!my-5 [&_p]:!my-0"
                        dangerouslySetInnerHTML={{ __html: renderStoredContentHtml(blog.content) }}
                      />
                    </div>
                    <footer className="mt-12 flex justify-end text-right">
                      <Link
                        to={`/user/${blog.author.id}`}
                        className="text-base font-semibold opacity-85 transition hover:opacity-100"
                      >
                        {poemSignature}
                      </Link>
                    </footer>
                  </div>
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: renderStoredContentHtml(blog.content) }} />
              )}
            </section>
          )}

          {blog.bookReferences.length > 0 && (
            <section className="mt-10 rounded-2xl border border-slate-200 bg-white/65 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/35">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Referenced Books</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {blog.bookReferences.map((book, idx) => (
                  <Link
                    key={book.id}
                    to={`/books/${book.id}`}
                    className="tone-hover-gold group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-3 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_28px_-20px_rgba(15,23,42,0.55)] dark:border-white/10 dark:bg-slate-900/45 dark:hover:border-white/25"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md border border-slate-200 shadow-sm dark:border-white/10">
                        <BookCover src={book.coverImage ?? null} alt={book.title} className="h-full w-full" variant="physical" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{book.title}</p>
                        <p className="truncate text-sm text-slate-500 dark:text-slate-400">{book.author}</p>
                        <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                          Reference {String(idx + 1).padStart(2, '0')}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mt-10">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Comments ({blog.comments?.length ?? blog.commentsCount})</h3>

        {isAuthenticated ? (
          <div className="mt-4 space-y-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add your comment"
              className="min-h-[100px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            <button
              type="button"
              onClick={handleComment}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
            >
              <span className="inline-flex items-center gap-1"><MessageCircle className="h-4 w-4" /> Post Comment</span>
            </button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500"><Link to="/login" className="font-semibold text-primary-600 dark:text-amber-300">Login</Link> to comment.</p>
        )}

        <div className="mt-6 space-y-3">
          {(blog.comments ?? []).map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.user.name}</p>
                {(user?.id === item.userId || canEditOrDelete) && (
                  <button
                    type="button"
                    onClick={() =>
                      setPendingDeleteComment({
                        id: item.id,
                        authorName: item.user.name,
                      })
                    }
                    className="text-xs font-semibold text-rose-600"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.content}</p>
            </div>
          ))}
          {(blog.comments ?? []).length === 0 && (
            <p className="text-sm text-slate-500">No comments yet.</p>
          )}
        </div>
          </section>

          {feedback && <p className="mt-4 text-sm text-rose-600">{feedback}</p>}
        </div>

        {!isAdminModerationReview && (
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white/72 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/35">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">More Like This</h3>
            <div className="mt-3 space-y-3">
              {relatedPosts.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">No related posts yet.</p>
              )}
              {relatedPosts.map((post) => (
                <Link key={post.id} to={`/blogs/${post.id}`} className="tone-hover-gold group block overflow-hidden rounded-xl border border-slate-200 bg-white/75 transition hover:-translate-y-0.5 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/45 dark:hover:border-white/20">
                  <div
                    className="h-24 w-full bg-cover bg-center"
                    style={{
                      backgroundImage: post.coverImage
                        ? `linear-gradient(180deg,rgba(2,6,23,0.15),rgba(2,6,23,0.62)),url(${post.coverImage})`
                        : getGeneratedCoverBackground(`${post.id}:${post.title}:${post.authorId}`),
                    }}
                  />
                  <div className="p-3">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-900 transition group-hover:text-primary-700 dark:text-slate-100 dark:group-hover:text-amber-200">
                      {post.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {post.author.name} · {post.readingTime} min
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/72 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/35">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">From This Author</h3>
            <Link to={`/user/${blog.author.id}`} className="tone-hover-gold mt-3 block rounded-xl border border-slate-200 bg-white/80 p-3 transition hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/45 dark:hover:border-white/20">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{blog.author.name}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">See profile and published posts</p>
            </Link>
          </div>
          </aside>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={Boolean(pendingDeleteComment)}
        onClose={() => setPendingDeleteComment(null)}
        onConfirm={confirmDeleteComment}
        title="Delete Comment"
        message={
          pendingDeleteComment
            ? `Delete ${pendingDeleteComment.authorName}'s comment? This cannot be undone.`
            : 'Delete this comment?'
        }
        confirmLabel="Delete"
        confirmClassName="bg-red-600 hover:bg-red-700"
        isLoading={deleteComment.isPending}
      />
      {shareOpen && (
        <div
          className="fixed inset-0 z-[90] bg-slate-950/45"
          onClick={() => setShareOpen(false)}
        >
          <div
            className="absolute left-1/2 top-1/2 w-[min(94vw,460px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Share This Post</p>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="rounded-md border border-slate-300 p-1 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Choose where to share:</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button type="button" onClick={() => openShareTarget('facebook')} className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 p-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><Facebook className="h-4 w-4" /> Facebook</button>
              <button type="button" onClick={() => openShareTarget('x')} className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 p-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><Twitter className="h-4 w-4" /> X</button>
              <button type="button" onClick={() => openShareTarget('telegram')} className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 p-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><Send className="h-4 w-4" /> Telegram</button>
              <button type="button" onClick={() => openShareTarget('linkedin')} className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300 p-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><Linkedin className="h-4 w-4" /> LinkedIn</button>
            </div>
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <p className="break-all">{shareUrl}</p>
            </div>
            <button
              type="button"
              onClick={() => void copyShareLink()}
              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {shareCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {shareCopied ? 'Copied' : 'Copy Link'}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

export default BlogDetailPage
