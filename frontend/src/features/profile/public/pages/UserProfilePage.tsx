import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Bookmark, BookOpen, Heart, Star, TrendingUp, UserCheck, UserPlus } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import {
  useFollowAuthor,
  useUnfollowAuthor,
  useUserBlogProfile,
} from '@/features/blog/services/blogs'
import BlogBreadcrumbs from '@/features/blog/components/BlogBreadcrumbs'
import Avatar from '@/features/profile/shared/components/Avatar'
import { cn } from '@/lib/utils'
import { resolveMediaUrl } from '@/lib/media'

const UserProfilePage = () => {
  const { id = '' } = useParams()
  const { user, isAuthenticated } = useAuthStore()
  const [activeSection, setActiveSection] = useState<'overview' | 'favorites' | 'liked' | 'posts' | 'about'>('overview')
  const [overviewShelf, setOverviewShelf] = useState<'favorites' | 'liked' | 'posts'>('posts')
  const [overviewSort, setOverviewSort] = useState<'latest' | 'popular' | 'oldest'>('latest')
  const { data, isLoading, isError } = useUserBlogProfile(id, !!id)
  const followMutation = useFollowAuthor()
  const unfollowMutation = useUnfollowAuthor()
  const posts = data?.posts ?? []
  const favoriteItems = data?.favorites ?? []
  const likedItems = data?.likedPosts ?? []
  const profileUser = data?.user
  const visibility = data?.visibility

  const favoriteBooks = useMemo(
    () => favoriteItems.filter((item) => item.book),
    [favoriteItems],
  )
  const likedPosts = useMemo(() => likedItems, [likedItems])
  const totalReadingMinutes = useMemo(
    () => posts.reduce((sum, post) => sum + (post.readingTime || 0), 0),
    [posts],
  )
  const avgReadTime = useMemo(
    () => (posts.length ? Math.round(totalReadingMinutes / posts.length) : 0),
    [posts.length, totalReadingMinutes],
  )
  const isMe = !!profileUser && user?.id === profileUser.id
  const canViewFavorites = isMe || !!visibility?.showFavorites
  const canViewLikedPosts = isMe || !!visibility?.showLikedPosts
  const memberSince = profileUser?.createdAt
    ? new Date(profileUser.createdAt).toLocaleDateString()
    : 'Not available'

  const overviewTabs = useMemo(() => {
    const tabs: Array<{ key: 'favorites' | 'liked' | 'posts'; label: string; icon: typeof BookOpen }> = []
    if (canViewFavorites) tabs.push({ key: 'favorites', label: 'Favorites', icon: Star })
    if (canViewLikedPosts) tabs.push({ key: 'liked', label: 'Liked', icon: Heart })
    tabs.push({ key: 'posts', label: 'Posts', icon: Bookmark })
    return tabs
  }, [canViewFavorites, canViewLikedPosts])

  useEffect(() => {
    if (!overviewTabs.some((item) => item.key === overviewShelf)) {
      setOverviewShelf(overviewTabs[0]?.key ?? 'posts')
    }
  }, [overviewShelf, overviewTabs])

  const sortedFavoriteBooks = useMemo(() => {
    const items = [...favoriteBooks]
    if (overviewSort === 'oldest') {
      return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [favoriteBooks, overviewSort])

  const sortedLikedPosts = useMemo(() => {
    const items = [...likedPosts]
    if (overviewSort === 'oldest') {
      return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }
    if (overviewSort === 'popular') {
      return items.sort((a, b) => (b.likesCount + b.viewsCount) - (a.likesCount + a.viewsCount))
    }
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [likedPosts, overviewSort])

  const sortedRecentPosts = useMemo(() => {
    const items = [...posts]
    if (overviewSort === 'oldest') {
      return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }
    if (overviewSort === 'popular') {
      return items.sort((a, b) => (b.likesCount + b.viewsCount) - (a.likesCount + a.viewsCount))
    }
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [posts, overviewSort])

  if (!id) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-slate-500">Profile not found.</div>
  }

  if (isLoading) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-slate-500">Loading profile...</div>
  }

  if (isError || !data || !profileUser || !visibility) {
    return <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-rose-600">Unable to load this profile.</div>
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
      <BlogBreadcrumbs
        className="mb-4"
        items={[
          { label: 'Home', to: '/' },
          { label: 'Blogs', to: '/blogs' },
          { label: data.user.name },
        ]}
      />
      <div className="mt-8">
        <main className="w-full">
          <header className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_34px_90px_-62px_rgba(15,23,42,0.55)] dark:border-slate-800 dark:bg-slate-900">
            <div
              className="h-56 w-full bg-gradient-to-r from-sky-100 via-cyan-100 to-indigo-100 bg-cover bg-center sm:h-64 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800"
              style={
                data.user.coverImage
                  ? { backgroundImage: `linear-gradient(rgba(15,23,42,0.15), rgba(15,23,42,0.35)), url(${resolveMediaUrl(data.user.coverImage)})` }
                  : undefined
              }
            />
            <div className="bg-gradient-to-b from-white via-white to-slate-50/60 px-6 pb-7 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/80">
              <div className="-mt-16 flex flex-wrap items-end justify-between gap-5">
                <div className="flex items-end gap-4">
                  <Avatar
                    avatarType={data.user.avatarType === 'upload' ? 'upload' : 'emoji'}
                    avatarValue={data.user.avatarValue || 'avatar-1'}
                    backgroundColor={data.user.backgroundColor || 'bg-slate-100'}
                    size="xl"
                    className="border-4 border-white shadow-lg dark:border-slate-900"
                  />
                  <div className="pb-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Profile</p>
                    <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{data.user.name}</h1>
                    {(data.user.pronouns || data.user.email) && (
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {data.user.pronouns || ''}
                        {data.user.pronouns && data.user.email ? ' · ' : ''}
                        {data.user.email || ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isAuthenticated && !isMe && (
                    <button
                      type="button"
                      onClick={() => (data.isFollowing ? unfollowMutation.mutate(data.user.id) : followMutation.mutate(data.user.id))}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                    >
                      {data.isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                      {data.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                  {isMe && (
                    <Link
                      to="/settings/profile"
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:text-slate-200"
                    >
                      Edit Profile
                    </Link>
                  )}
                </div>
              </div>
              <div className="mt-6 grid gap-3 lg:grid-cols-3">
                {[
                  { label: 'Followers', value: data.stats.followers ?? 'Private' },
                  { label: 'Following', value: data.stats.following ?? 'Private' },
                  { label: 'Posts', value: data.stats.posts },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white px-5 py-4 text-sm shadow-[0_10px_30px_-24px_rgba(15,23,42,0.7)] dark:border-slate-800 dark:bg-slate-900/70">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveSection('overview')}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    activeSection === 'overview'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  Overview
                </button>
                {canViewFavorites && (
                  <button
                    type="button"
                    onClick={() => setActiveSection('favorites')}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      activeSection === 'favorites'
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    Favorites
                  </button>
                )}
                {canViewLikedPosts && (
                  <button
                    type="button"
                    onClick={() => setActiveSection('liked')}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      activeSection === 'liked'
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    Liked
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveSection('posts')}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    activeSection === 'posts'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  Posts
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('about')}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    activeSection === 'about'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  About
                </button>
              </div>
            </div>
          </header>

          {activeSection === 'overview' && (
            <section className="mt-8 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Engagement</h2>
                    <TrendingUp className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-slate-200/70 px-3 py-3 dark:border-slate-700">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Avg read</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{avgReadTime} min</p>
                    </div>
                    <div className="rounded-xl border border-slate-200/70 px-3 py-3 dark:border-slate-700">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total mins</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{totalReadingMinutes}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">About</h2>
                    <BookOpen className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                    {data.user.shortBio || data.user.about || 'Add a short bio to introduce yourself.'}
                  </p>
                  <p className="mt-4 text-xs text-slate-500">Member since {memberSince}</p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-48px_rgba(15,23,42,0.25)] dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-6">
                    {overviewTabs.map((item) => {
                      const Icon = item.icon
                      const isActive = overviewShelf === item.key
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setOverviewShelf(item.key)}
                          className={cn(
                            'inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition',
                            isActive
                              ? 'border-slate-950 text-slate-950 dark:border-slate-100 dark:text-slate-100'
                              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </button>
                      )
                    })}
                  </div>

                  <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/60">
                    {(['latest', 'popular', 'oldest'] as const).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setOverviewSort(item)}
                        className={cn(
                          'rounded-xl px-3 py-1.5 text-sm font-medium capitalize transition',
                          overviewSort === item
                            ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-900 dark:text-slate-100'
                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200',
                        )}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  {overviewShelf === 'favorites' && canViewFavorites ? (
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Saved Books</p>
                        {isMe ? (
                          <Link to="/library" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300">
                            Manage
                          </Link>
                        ) : null}
                      </div>
                      {sortedFavoriteBooks.length === 0 ? (
                        <p className="text-sm text-slate-500">No favorites yet.</p>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          {sortedFavoriteBooks.slice(0, 8).map((item) => (
                            <article key={item.id} className="overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] transition hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-900">
                              <div
                                className="h-44 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 bg-cover bg-center dark:from-slate-800 dark:via-slate-700 dark:to-slate-800"
                                style={item.book?.coverImage ? { backgroundImage: `url(${resolveMediaUrl(item.book.coverImage)})` } : undefined}
                              />
                              <div className="p-4">
                                <p className="line-clamp-2 text-base font-semibold text-slate-900 dark:text-slate-100">
                                  {item.book?.title || 'Untitled'}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">{item.book?.author}</p>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {overviewShelf === 'liked' && canViewLikedPosts ? (
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Liked posts</p>
                        <button
                          type="button"
                          onClick={() => setActiveSection('liked')}
                          className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300"
                        >
                          View all
                        </button>
                      </div>
                      {sortedLikedPosts.length === 0 ? (
                        <p className="text-sm text-slate-500">No liked posts yet.</p>
                      ) : (
                        <div className="grid gap-4 lg:grid-cols-2">
                          {sortedLikedPosts.slice(0, 4).map((post) => (
                            <article key={post.id} className="rounded-[1.6rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] transition hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-900">
                              <Link to={`/blogs/${post.id}`}>
                                <h3 className="text-xl font-semibold tracking-tight text-slate-900 hover:text-primary-700 dark:text-slate-100 dark:hover:text-amber-200">
                                  {post.title}
                                </h3>
                              </Link>
                              {post.subtitle ? <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{post.subtitle}</p> : null}
                              <p className="mt-4 text-xs text-slate-500">
                                {new Date(post.createdAt).toLocaleDateString()} · {post.readingTime} min read
                              </p>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {overviewShelf === 'posts' ? (
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recent posts</p>
                        <button
                          type="button"
                          onClick={() => setActiveSection('posts')}
                          className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300"
                        >
                          View all
                        </button>
                      </div>
                      {sortedRecentPosts.length === 0 ? (
                        <p className="text-sm text-slate-500">No published posts yet.</p>
                      ) : (
                        <div className="grid gap-4 lg:grid-cols-2">
                          {sortedRecentPosts.slice(0, 4).map((post) => (
                            <article key={post.id} className="rounded-[1.6rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] transition hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-900">
                              <Link to={`/blogs/${post.id}`}>
                                <h3 className="text-xl font-semibold tracking-tight text-slate-900 hover:text-primary-700 dark:text-slate-100 dark:hover:text-amber-200">
                                  {post.title}
                                </h3>
                              </Link>
                              {post.subtitle ? <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{post.subtitle}</p> : null}
                              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                <span>{post.readingTime} min read</span>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          )}

          {activeSection === 'favorites' && canViewFavorites && (
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Favorites</h2>
                {isMe && (
                  <Link to="/library" className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300">
                    Manage
                  </Link>
                )}
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {favoriteBooks.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="h-32 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700" />
                    <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {item.book?.title || 'Untitled'}
                    </p>
                    <p className="text-xs text-slate-500">{item.book?.author}</p>
                  </div>
                ))}
                {favoriteBooks.length === 0 && (
                  <p className="text-sm text-slate-500">No favorites yet.</p>
                )}
              </div>
            </section>
          )}

          {activeSection === 'liked' && canViewLikedPosts && (
            <section className="mt-8 space-y-5">
              {likedPosts.map((post) => (
                <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <Link to={`/blogs/${post.id}`}>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 hover:text-primary-700 dark:text-slate-100 dark:hover:text-amber-200">
                      {post.title}
                    </h2>
                  </Link>
                  {post.subtitle && <p className="mt-2 text-slate-600 dark:text-slate-400">{post.subtitle}</p>}
                  <p className="mt-3 text-sm text-slate-500">
                    {new Date(post.createdAt).toLocaleDateString()} · {post.readingTime} min read
                  </p>
                </article>
              ))}
              {likedPosts.length === 0 && <p className="text-sm text-slate-500">No liked posts yet.</p>}
            </section>
          )}

          {activeSection === 'posts' && (
            <section className="mt-8 space-y-5">
              {data.posts.map((post) => (
                <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <Link to={`/blogs/${post.id}`}>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 hover:text-primary-700 dark:text-slate-100 dark:hover:text-amber-200">
                      {post.title}
                    </h2>
                  </Link>
                  {post.subtitle && <p className="mt-2 text-slate-600 dark:text-slate-400">{post.subtitle}</p>}
                  {post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {post.tags.slice(0, 4).map((tag) => (
                        <Link
                          key={tag.id}
                          to={`/blogs?tag=${encodeURIComponent(tag.name)}`}
                          className="tone-hover-gold rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                          #{tag.name}
                        </Link>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 text-sm text-slate-500">
                    {new Date(post.createdAt).toLocaleDateString()} · {post.readingTime} min read
                  </p>
                </article>
              ))}

              {data.posts.length === 0 && <p className="text-sm text-slate-500">No published posts yet.</p>}
            </section>
          )}

          {activeSection === 'about' && (
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">About</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-700 dark:text-slate-300">
                {data.user.about || data.user.shortBio || 'No about information shared yet.'}
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default UserProfilePage
