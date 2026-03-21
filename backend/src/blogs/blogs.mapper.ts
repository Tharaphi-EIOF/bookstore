type BlogRecord = {
  [key: string]: unknown;
  tags?: Array<{ tag: unknown }>;
  bookReferences?: Array<{ book: unknown }>;
  likes?: Array<{ id: string }>;
};

export function mapBlog<T extends BlogRecord>(item: T, currentUserId?: string) {
  return {
    ...item,
    tags: (item.tags ?? []).map((tagLink) => tagLink.tag),
    bookReferences: (item.bookReferences ?? []).map(
      (bookLink) => bookLink.book,
    ),
    isLikedByMe: currentUserId ? (item.likes ?? []).length > 0 : false,
  };
}
