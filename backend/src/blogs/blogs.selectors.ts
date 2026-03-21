import {
  BLOG_COMMENT_USER_SELECT,
  BLOG_REFERENCE_BOOK_SELECT,
  BLOG_USER_PROFILE_SELECT,
} from './blogs.constants';

export function blogInclude(currentUserId?: string) {
  return {
    author: {
      select: BLOG_USER_PROFILE_SELECT,
    },
    tags: {
      include: { tag: true },
    },
    bookReferences: {
      include: {
        book: {
          select: BLOG_REFERENCE_BOOK_SELECT,
        },
      },
    },
    likes: currentUserId
      ? {
          where: { userId: currentUserId },
          select: { id: true },
          take: 1,
        }
      : false,
    _count: {
      select: {
        comments: true,
      },
    },
  };
}

export function commentInclude() {
  return {
    user: {
      select: BLOG_COMMENT_USER_SELECT,
    },
  };
}
