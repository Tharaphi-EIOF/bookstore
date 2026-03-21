export const BLOG_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  REJECTED: 'REJECTED',
  PUBLISHED: 'PUBLISHED',
} as const;

export const BLOG_USER_PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  avatarType: true,
  avatarValue: true,
  backgroundColor: true,
  pronouns: true,
  shortBio: true,
  about: true,
  coverImage: true,
  supportEnabled: true,
  supportUrl: true,
  supportQrImage: true,
} as const;

export const BLOG_COMMENT_USER_SELECT = {
  id: true,
  name: true,
  avatarType: true,
  avatarValue: true,
  backgroundColor: true,
} as const;

export const BLOG_PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  avatarType: true,
  avatarValue: true,
  backgroundColor: true,
  pronouns: true,
  shortBio: true,
  about: true,
  coverImage: true,
  showEmail: true,
  showFollowers: true,
  showFollowing: true,
  showFavorites: true,
  showLikedPosts: true,
  supportEnabled: true,
  supportUrl: true,
  supportQrImage: true,
  role: true,
} as const;

export const BLOG_REFERENCE_BOOK_SELECT = {
  id: true,
  title: true,
  author: true,
  coverImage: true,
} as const;
