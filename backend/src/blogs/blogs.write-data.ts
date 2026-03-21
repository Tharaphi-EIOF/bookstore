import { BLOG_STATUS } from './blogs.constants';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

export function resolveScheduledAt(
  status: 'DRAFT' | 'PENDING_REVIEW' | 'REJECTED' | 'PUBLISHED',
  scheduledAt?: string,
): Date | null {
  if (status === BLOG_STATUS.PUBLISHED) {
    return null;
  }

  return scheduledAt ? new Date(scheduledAt) : null;
}

export function buildCreateBlogData(
  userId: string,
  dto: CreateBlogDto,
  tags: string[],
  bookIds: string[],
  readingTime: number,
  status: 'DRAFT' | 'PENDING_REVIEW' | 'REJECTED' | 'PUBLISHED',
  scheduledAt: Date | null,
) {
  return {
    authorId: userId,
    title: dto.title.trim(),
    subtitle: dto.subtitle?.trim() || null,
    content: dto.content,
    coverImage: dto.coverImage?.trim() || null,
    readingTime,
    status,
    scheduledAt,
    tags: tags.length
      ? {
          create: tags.map((name) => ({
            tag: {
              connectOrCreate: {
                where: { name },
                create: { name },
              },
            },
          })),
        }
      : undefined,
    bookReferences: bookIds.length
      ? {
          create: bookIds.map((bookId) => ({
            book: {
              connect: { id: bookId },
            },
          })),
        }
      : undefined,
  };
}

export function buildUpdateBlogData(
  dto: UpdateBlogDto,
  nextTags?: string[],
  nextBookIds?: string[],
) {
  return {
    ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
    ...(dto.subtitle !== undefined
      ? { subtitle: dto.subtitle?.trim() || null }
      : {}),
    ...(dto.content !== undefined ? { content: dto.content } : {}),
    ...(dto.coverImage !== undefined
      ? { coverImage: dto.coverImage?.trim() || null }
      : {}),
    ...(dto.status !== undefined ? { status: dto.status } : {}),
    ...(dto.status === BLOG_STATUS.PUBLISHED
      ? { scheduledAt: null }
      : dto.scheduledAt !== undefined
        ? { scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null }
        : {}),
    ...(dto.readingTime !== undefined ? { readingTime: dto.readingTime } : {}),
    ...(nextTags
      ? {
          tags: {
            create: nextTags.map((name) => ({
              tag: {
                connectOrCreate: {
                  where: { name },
                  create: { name },
                },
              },
            })),
          },
        }
      : {}),
    ...(nextBookIds
      ? {
          bookReferences: {
            create: nextBookIds.map((bookId) => ({
              book: {
                connect: { id: bookId },
              },
            })),
          },
        }
      : {}),
  };
}
