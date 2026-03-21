import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '@/lib/api'

const BLOG_VISITOR_ID_KEY = 'blog:visitor-id:v1'

const getOrCreateBlogVisitorId = () => {
  if (typeof window === 'undefined') return ''
  const existing = window.localStorage.getItem(BLOG_VISITOR_ID_KEY)
  if (existing && existing.trim().length >= 12) return existing

  const generated =
    typeof window.crypto !== 'undefined' && typeof window.crypto.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
  window.localStorage.setItem(BLOG_VISITOR_ID_KEY, generated)
  return generated
}

// Blog schemas are intentionally colocated with hooks because the API surface is broad
// and many pages consume slightly different blog payload shapes.
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  createdAt: z.string().optional(),
  avatarType: z.string().nullable().optional(),
  avatarValue: z.string().nullable().optional(),
  backgroundColor: z.string().nullable().optional(),
  pronouns: z.string().nullable().optional(),
  shortBio: z.string().nullable().optional(),
  about: z.string().nullable().optional(),
  coverImage: z.string().nullable().optional(),
  showEmail: z.boolean().optional(),
  showFollowers: z.boolean().optional(),
  showFollowing: z.boolean().optional(),
  showFavorites: z.boolean().optional(),
  showLikedPosts: z.boolean().optional(),
  supportEnabled: z.boolean().optional(),
  supportUrl: z.string().nullable().optional(),
  supportQrImage: z.string().nullable().optional(),
  role: z.string().optional(),
})

const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string().optional(),
})

const bookRefSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  coverImage: z.string().nullable().optional(),
})

const commentSchema = z.object({
  id: z.string(),
  blogId: z.string(),
  userId: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: userSchema.pick({
    id: true,
    name: true,
    avatarType: true,
    avatarValue: true,
    backgroundColor: true,
  }),
})

const normalizeContent = (value: unknown) => {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const blogSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  content: z.preprocess(normalizeContent, z.string()),
  coverImage: z.string().nullable().optional(),
  readingTime: z.number(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'REJECTED', 'PUBLISHED']),
  moderationReason: z.string().nullable().optional(),
  reviewedByUserId: z.string().nullable().optional(),
  reviewedAt: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
  viewsCount: z.number(),
  likesCount: z.number(),
  commentsCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  author: userSchema.pick({
    id: true,
    name: true,
    email: true,
    avatarType: true,
    avatarValue: true,
    backgroundColor: true,
    supportEnabled: true,
    supportUrl: true,
    supportQrImage: true,
  }),
  tags: z.array(tagSchema),
  bookReferences: z.array(bookRefSchema),
  isLikedByMe: z.boolean(),
  _count: z
    .object({
      comments: z.number().optional().default(0),
      likes: z.number().optional().default(0),
    })
    .optional(),
  comments: z.array(commentSchema).optional(),
})

const pagedBlogsSchema = z.object({
  items: z.array(blogSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

const followSchema = z.object({
  id: z.string(),
  followerId: z.string(),
  authorId: z.string(),
  createdAt: z.string(),
  author: userSchema.optional(),
})

const trendingTagSchema = z.object({
  id: z.string(),
  name: z.string(),
  usageCount: z.number(),
})

const profileSchema = z.object({
  user: userSchema,
  visibility: z.object({
    showEmail: z.boolean(),
    showFollowers: z.boolean(),
    showFollowing: z.boolean(),
    showFavorites: z.boolean(),
    showLikedPosts: z.boolean(),
    supportEnabled: z.boolean(),
  }),
  stats: z.object({
    followers: z.number().nullable(),
    following: z.number().nullable(),
    posts: z.number(),
  }),
  isFollowing: z.boolean(),
  posts: z.array(blogSchema),
  favorites: z.array(
    z.object({
      id: z.string(),
      userId: z.string(),
      bookId: z.string(),
      createdAt: z.string(),
      book: bookRefSchema.optional(),
    }),
  ),
  likedPosts: z.array(blogSchema),
})

const myBlogAnalyticsSchema = z.object({
  summary: z.object({
    totalPosts: z.number(),
    totalViews: z.number(),
    totalLikes: z.number(),
    totalComments: z.number(),
    byStatus: z.record(z.number()),
  }),
  topPosts: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      status: z.string(),
      viewsCount: z.number(),
      likesCount: z.number(),
      commentsCount: z.number(),
      createdAt: z.string(),
      updatedAt: z.string(),
      scheduledAt: z.string().nullable().optional(),
    }),
  ),
  recentActivity: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      status: z.string(),
      viewsCount: z.number(),
      likesCount: z.number(),
      commentsCount: z.number(),
      createdAt: z.string(),
      updatedAt: z.string(),
      scheduledAt: z.string().nullable().optional(),
    }),
  ),
})

const blogPageSettingsSchema = z.object({
  id: z.string(),
  eyebrow: z.string(),
  title: z.string(),
  introLines: z.array(z.string()),
  updatedAt: z.string(),
})

export type Blog = z.infer<typeof blogSchema>
export type BlogComment = z.infer<typeof commentSchema>
export type AuthorFollow = z.infer<typeof followSchema>
export type BlogFeedResponse = z.infer<typeof pagedBlogsSchema>
export type BlogProfileResponse = z.infer<typeof profileSchema>
export type BlogFeedTab = 'for_you' | 'trending' | 'latest' | 'following' | 'poems'
export type MyBlogAnalytics = z.infer<typeof myBlogAnalyticsSchema>
export type BlogPageSettings = z.infer<typeof blogPageSettingsSchema>

export interface BlogFeedQuery {
  tab?: BlogFeedTab
  tag?: string
  tags?: string[]
  page?: number
  limit?: number
  authorId?: string
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'REJECTED' | 'PUBLISHED'
}

export interface BlogModerationQuery {
  status?: 'PENDING_REVIEW' | 'REJECTED' | 'PUBLISHED' | 'DRAFT'
  q?: string
  page?: number
  limit?: number
}

export interface UpdateBlogPageSettingsPayload {
  eyebrow?: string
  title?: string
  introLines?: string[]
}

export const useBlogs = (query: BlogFeedQuery = {}) =>
  useQuery({
    // Feed filters are part of the cache key so each tab/search combination stays isolated.
    queryKey: ['blogs', 'feed', query],
    queryFn: async () => {
      const { tags, ...rest } = query
      const params: Record<string, unknown> = { ...rest }
      if (typeof rest.limit === 'number') {
        params.limit = Math.min(Math.max(rest.limit, 1), 30)
      }
      if (typeof rest.page === 'number') {
        params.page = Math.max(rest.page, 1)
      }
      if (tags && tags.length > 0) {
        params.tags = tags.join(',')
      }
      const response = await api.get('/blogs', { params })
      return pagedBlogsSchema.parse(response.data)
    },
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60,
  })

export const useBlogPageSettings = () =>
  useQuery({
    queryKey: ['blogs', 'page-settings'],
    queryFn: async () => {
      const response = await api.get('/blogs/page-settings')
      return blogPageSettingsSchema.parse(response.data)
    },
    staleTime: 1000 * 60,
  })

export const useBlogDetails = (blogId: string, enabled = true) =>
  useQuery({
    queryKey: ['blogs', 'detail', blogId],
    queryFn: async () => {
      const visitorId = getOrCreateBlogVisitorId()
      const response = await api.get(`/blogs/${blogId}`, {
        headers: visitorId
          ? { 'x-visitor-id': visitorId }
          : undefined,
      })
      return blogSchema.parse(response.data)
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  })

export const useMyBlogAnalytics = (enabled = true) =>
  useQuery({
    queryKey: ['blogs', 'analytics', 'me'],
    queryFn: async () => {
      const response = await api.get('/blogs/analytics/me')
      return myBlogAnalyticsSchema.parse(response.data)
    },
    enabled,
    staleTime: 1000 * 60,
  })

export const useTrendingBlogTags = () =>
  useQuery({
    queryKey: ['blogs', 'trending-tags'],
    queryFn: async () => {
      const response = await api.get('/blogs/trending-tags')
      return z.array(trendingTagSchema).parse(response.data)
    },
    staleTime: 1000 * 60 * 10,
  })

export const useStaffPicks = () =>
  useQuery({
    queryKey: ['blogs', 'staff-picks'],
    queryFn: async () => {
      const response = await api.get('/blogs/staff-picks')
      return z.array(blogSchema).parse(response.data)
    },
    staleTime: 1000 * 60 * 10,
  })

export const useMyLikedBlogPosts = (enabled = true) =>
  useQuery({
    queryKey: ['blogs', 'likes', 'me'],
    queryFn: async () => {
      const response = await api.get('/blogs/likes/me')
      return z.object({ postIds: z.array(z.string()) }).parse(response.data)
    },
    enabled,
    retry: false,
  })

export const useCreateBlog = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      title: string
      subtitle?: string
      content: string
      coverImage?: string
      tags?: string[]
      bookIds?: string[]
      status?: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED'
      scheduledAt?: string | null
    }) => {
      const response = await api.post('/blogs', payload)
      return blogSchema.parse(response.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

export const useUpdateBlog = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ blogId, ...payload }: {
      blogId: string
      title?: string
      subtitle?: string
      content?: string
      coverImage?: string
      tags?: string[]
      bookIds?: string[]
      status?: 'DRAFT' | 'PENDING_REVIEW' | 'REJECTED' | 'PUBLISHED'
      scheduledAt?: string | null
    }) => {
      const response = await api.patch(`/blogs/${blogId}`, payload)
      return blogSchema.parse(response.data)
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] })
      queryClient.invalidateQueries({ queryKey: ['blogs', 'detail', vars.blogId] })
    },
  })
}

export const usePublishBlog = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (blogId: string) => {
      const response = await api.post(`/blogs/${blogId}/publish`)
      return blogSchema.parse(response.data)
    },
    onSuccess: (_, blogId) => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] })
      queryClient.invalidateQueries({ queryKey: ['blogs', 'detail', blogId] })
    },
  })
}

export const useDeleteBlog = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (blogId: string) => {
      const response = await api.delete(`/blogs/${blogId}`)
      return z.object({ id: z.string() }).parse(response.data)
    },
    onSuccess: (_, blogId) => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] })
      queryClient.invalidateQueries({ queryKey: ['blogs', 'detail', blogId] })
    },
  })
}

export const useLikeBlog = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (blogId: string) => {
      const response = await api.post(`/blogs/${blogId}/like`)
      return z.object({ liked: z.boolean() }).parse(response.data)
    },
    onSuccess: (_, blogId) => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] })
      queryClient.invalidateQueries({ queryKey: ['blogs', 'detail', blogId] })
      queryClient.invalidateQueries({ queryKey: ['blogs', 'likes', 'me'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

export const useUnlikeBlog = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (blogId: string) => {
      const response = await api.delete(`/blogs/${blogId}/like`)
      return z.object({ liked: z.boolean() }).parse(response.data)
    },
    onSuccess: (_, blogId) => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] })
      queryClient.invalidateQueries({ queryKey: ['blogs', 'detail', blogId] })
      queryClient.invalidateQueries({ queryKey: ['blogs', 'likes', 'me'] })
    },
  })
}

export const useUserBlogProfile = (userId: string, enabled = true) =>
  useQuery({
    queryKey: ['blogs', 'user-profile', userId],
    queryFn: async () => {
      const response = await api.get(`/blogs/users/${userId}`)
      return profileSchema.parse(response.data)
    },
    enabled,
  })

export const useFollowedAuthors = (enabled = true) =>
  useQuery({
    queryKey: ['blogs', 'follows'],
    queryFn: async () => {
      const response = await api.get('/blogs/follows/me')
      return z.array(followSchema).parse(response.data)
    },
    enabled,
    retry: false,
  })

export const useFollowAuthor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (authorId: string) => {
      const response = await api.post(`/blogs/authors/${authorId}/follow`)
      return followSchema.parse(response.data)
    },
    onSuccess: (_, authorId) => {
      queryClient.invalidateQueries({ queryKey: ['blogs', 'follows'] })
      queryClient.invalidateQueries({ queryKey: ['blogs', 'user-profile', authorId] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

export const useUnfollowAuthor = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (authorId: string) => {
      const response = await api.delete(`/blogs/authors/${authorId}/follow`)
      return followSchema.parse(response.data)
    },
    onSuccess: (_, authorId) => {
      queryClient.invalidateQueries({ queryKey: ['blogs', 'follows'] })
      queryClient.invalidateQueries({ queryKey: ['blogs', 'user-profile', authorId] })
    },
  })
}

export const useBlogComments = (blogId: string, enabled = true) =>
  useQuery({
    queryKey: ['blogs', 'comments', blogId],
    queryFn: async () => {
      const response = await api.get(`/blogs/${blogId}/comments`)
      return z.array(commentSchema).parse(response.data)
    },
    enabled,
  })

export const useAddBlogComment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ blogId, content }: { blogId: string; content: string }) => {
      const response = await api.post(`/blogs/${blogId}/comments`, { content })
      return commentSchema.parse(response.data)
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['blogs', 'comments', vars.blogId] })
      queryClient.invalidateQueries({ queryKey: ['blogs'] })
      queryClient.invalidateQueries({ queryKey: ['blogs', 'detail', vars.blogId] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

export const useDeleteBlogComment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ commentId, blogId: _blogId }: { commentId: string; blogId: string }) => {
      const response = await api.delete(`/blogs/comments/${commentId}`)
      return z.object({ success: z.boolean() }).parse(response.data)
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['blogs', 'comments', vars.blogId] })
      queryClient.invalidateQueries({ queryKey: ['blogs'] })
      queryClient.invalidateQueries({ queryKey: ['blogs', 'detail', vars.blogId] })
    },
  })
}

export const useBlogModerationQueue = (query: BlogModerationQuery = {}) =>
  useQuery({
    queryKey: ['blogs', 'moderation', query],
    queryFn: async () => {
      const response = await api.get('/blogs/moderation/queue', { params: query })
      return pagedBlogsSchema.parse(response.data)
    },
    placeholderData: (previousData) => previousData,
  })

export const useApproveBlog = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ blogId, reason }: { blogId: string; reason?: string }) => {
      const response = await api.post(`/blogs/${blogId}/moderation/approve`, { reason })
      return blogSchema.parse(response.data)
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['blogs', 'moderation'] })
      queryClient.invalidateQueries({ queryKey: ['blogs'] })
      queryClient.invalidateQueries({ queryKey: ['blogs', 'detail', vars.blogId] })
    },
  })
}

export const useUpdateBlogPageSettings = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: UpdateBlogPageSettingsPayload) => {
      const response = await api.patch('/blogs/page-settings', payload)
      return blogPageSettingsSchema.parse(response.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs', 'page-settings'] })
    },
  })
}

export const useRejectBlog = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ blogId, reason }: { blogId: string; reason: string }) => {
      const response = await api.post(`/blogs/${blogId}/moderation/reject`, { reason })
      return blogSchema.parse(response.data)
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['blogs', 'moderation'] })
      queryClient.invalidateQueries({ queryKey: ['blogs'] })
      queryClient.invalidateQueries({ queryKey: ['blogs', 'detail', vars.blogId] })
    },
  })
}
