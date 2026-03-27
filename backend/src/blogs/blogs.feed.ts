import { Prisma } from '@prisma/client';
import { ListBlogsDto } from './dto/list-blogs.dto';
import { BLOG_STATUS } from './blogs.constants';

type BlogListWhere = Prisma.AuthorBlogWhereInput;

function normalizeWhereClauses(
  clauses:
    | Prisma.AuthorBlogWhereInput
    | Prisma.AuthorBlogWhereInput[]
    | undefined,
): Prisma.AuthorBlogWhereInput[] {
  if (!clauses) {
    return [];
  }

  return Array.isArray(clauses) ? clauses : [clauses];
}

export function parseTagFilters(dto: ListBlogsDto): string[] {
  return Array.from(
    new Set(
      [
        dto.tag?.trim(),
        ...(dto.tags ?? '').split(',').map((name) => name.trim()),
      ].filter((name): name is string => !!name),
    ),
  ).slice(0, 8);
}

export function buildBlogListWhere(
  dto: ListBlogsDto,
  tagFilters: string[],
  followedAuthorIds: string[],
): BlogListWhere {
  const where: BlogListWhere = {
    ...(dto.authorId ? { authorId: dto.authorId } : {}),
    ...(dto.status
      ? { status: dto.status }
      : { status: BLOG_STATUS.PUBLISHED }),
  };

  const isFeedQuery = !dto.authorId && !dto.status;

  if (tagFilters.length > 0) {
    where.AND = [
      ...normalizeWhereClauses(where.AND),
      {
        OR: tagFilters.map((name) => ({
          tags: {
            some: {
              tag: {
                name: {
                  equals: name,
                  mode: 'insensitive',
                },
              },
            },
          },
        })),
      },
    ];
  }

  const tab = dto.tab ?? 'for_you';
  if (tab === 'following' && isFeedQuery) {
    where.authorId = followedAuthorIds.length
      ? { in: followedAuthorIds }
      : '__none__';
  }

  if (tab === 'for_you' && isFeedQuery && followedAuthorIds.length > 0) {
    where.OR = [
      { authorId: { in: followedAuthorIds } },
      { likesCount: { gte: 8 } },
      { commentsCount: { gte: 4 } },
    ];
  }

  if (tab === 'poems') {
    where.AND = [
      ...normalizeWhereClauses(where.AND),
      {
        content: {
          contains: '"mode":"POEM"',
        },
      },
    ];
  }

  return where;
}

export function getBlogListOrderBy(
  tab?: ListBlogsDto['tab'],
): Array<Record<string, 'desc'>> {
  if (tab === 'trending') {
    return [
      { likesCount: 'desc' },
      { commentsCount: 'desc' },
      { viewsCount: 'desc' },
      { createdAt: 'desc' },
    ];
  }

  if (tab === 'for_you') {
    return [{ createdAt: 'desc' }, { likesCount: 'desc' }];
  }

  return [{ createdAt: 'desc' }];
}
