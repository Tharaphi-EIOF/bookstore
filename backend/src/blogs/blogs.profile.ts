import { mapBlog } from './blogs.mapper';

export function toProfileResponse(
  user: any,
  isOwner: boolean,
  posts: any[],
  favorites: any[],
  likedPosts: any[],
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
    posts: posts.map((item: any) => mapBlog(item, currentUserId)),
    favorites,
    likedPosts: likedPosts.map((item: any) =>
      mapBlog(item.post, currentUserId),
    ),
  };
}
