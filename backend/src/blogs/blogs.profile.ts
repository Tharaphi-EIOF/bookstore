import { mapBlog } from './blogs.mapper';

type ProfileUser = {
  email: string | null;
  showEmail: boolean;
  showFollowers: boolean;
  showFollowing: boolean;
  showFavorites: boolean;
  showLikedPosts: boolean;
  supportEnabled: boolean;
} & Record<string, unknown>;

type BlogLikeRecord = {
  post: Record<string, unknown>;
};

type ProfileBlogRecord = Record<string, unknown>;

export function toProfileResponse(
  user: ProfileUser,
  isOwner: boolean,
  posts: ProfileBlogRecord[],
  favorites: Array<Record<string, unknown>>,
  likedPosts: BlogLikeRecord[],
  followers: number,
  following: number,
  canViewFollowers: boolean,
  canViewFollowing: boolean,
  isFollowing: unknown,
  currentUserId?: string,
) {
  return {
    user: {
      ...user,
      email: isOwner || user.showEmail ? user.email : null,
    },
    visibility: {
      showEmail: user.showEmail,
      showFollowers: user.showFollowers,
      showFollowing: user.showFollowing,
      showFavorites: user.showFavorites,
      showLikedPosts: user.showLikedPosts,
      supportEnabled: user.supportEnabled,
    },
    stats: {
      followers: canViewFollowers ? followers : null,
      following: canViewFollowing ? following : null,
      posts: posts.length,
    },
    isFollowing: !!isFollowing,
    posts: posts.map((item) => mapBlog(item, currentUserId)),
    favorites,
    likedPosts: likedPosts.map((item) => mapBlog(item.post, currentUserId)),
  };
}
