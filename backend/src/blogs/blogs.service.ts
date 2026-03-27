import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { assertUserPermission } from '../auth/permission-resolution';
import { NotificationsService } from '../notifications/notifications.service';
import {
  BLOG_PROFILE_SELECT,
  BLOG_REFERENCE_BOOK_SELECT,
  BLOG_STATUS,
  BLOG_USER_PROFILE_SELECT,
} from './blogs.constants';
import {
  buildBlogListWhere,
  getBlogListOrderBy,
  parseTagFilters,
} from './blogs.feed';
import {
  canManageAsAdmin,
  estimateReadingTime,
  normalizeTags,
  uniqueIds,
} from './blogs.helpers';
import {
  deleteBlogUploadFile,
  extractBlogUploadUrls,
  getBlogUploadOwnerId,
  hasInlineImageData,
} from './blog-assets';
import { mapBlog } from './blogs.mapper';
import { toProfileResponse } from './blogs.profile';
import { blogInclude, commentInclude } from './blogs.selectors';
import {
  buildCreateBlogData,
  buildUpdateBlogData,
  resolveScheduledAt,
} from './blogs.write-data';
import { CreateBlogCommentDto } from './dto/create-blog-comment.dto';
import { CreateBlogDto } from './dto/create-blog.dto';
import { ListBlogsDto } from './dto/list-blogs.dto';
import { ListBlogModerationDto } from './dto/list-blog-moderation.dto';
import { ReviewBlogDto } from './dto/review-blog.dto';
import { UpdateBlogPageSettingsDto } from './dto/update-blog-page-settings.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

const BLOG_PAGE_SETTINGS_ROW_ID = 'global';

@Injectable()
export class BlogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private normalizeIntroLines(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
      .slice(0, 12);
  }

  private async ensureBlogPageSettingsRow() {
    const existing = await this.prisma.blogPageSetting.findUnique({
      where: { id: BLOG_PAGE_SETTINGS_ROW_ID },
    });

    if (existing) return existing;

    return this.prisma.blogPageSetting.create({
      data: {
        id: BLOG_PAGE_SETTINGS_ROW_ID,
        introLines: [
          'A living shelf for essays, reflections, and poems.',
          'Writing that moves between thought and lyric.',
          'Reviews, reading notes, poems, and pieces worth lingering in.',
        ],
      },
    });
  }

  private mapBlogPageSettings(record: {
    id: string;
    eyebrow: string;
    title: string;
    introLines: unknown;
    updatedAt: Date;
  }) {
    return {
      id: record.id,
      eyebrow: record.eyebrow,
      title: record.title,
      introLines: this.normalizeIntroLines(record.introLines),
      updatedAt: record.updatedAt,
    };
  }

  private async ensureUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(
        'Invalid user session. Please login again.',
      );
    }
    return user;
  }

  private async assertBooksExist(bookIds: string[]) {
    if (bookIds.length === 0) return;

    const existingCount = await this.prisma.book.count({
      where: { id: { in: bookIds } },
    });

    if (existingCount !== bookIds.length) {
      throw new NotFoundException(
        'One or more referenced books were not found',
      );
    }
  }

  // Block inline image payloads so posts only persist lightweight asset URLs.
  private assertNoInlineImages(content: string | undefined) {
    if (content !== undefined && hasInlineImageData(content)) {
      throw new BadRequestException(
        'Inline image data is not supported. Please upload the image first.',
      );
    }
  }

  // Removed blog-upload assets should be deleted after the post update succeeds.
  private async cleanupRemovedBlogImages(
    previousContent: string | null | undefined,
    nextContent: string | null | undefined,
  ) {
    const previousUrls = new Set(extractBlogUploadUrls(previousContent));
    const nextUrls = new Set(extractBlogUploadUrls(nextContent));
    const removedUrls = [...previousUrls].filter((url) => !nextUrls.has(url));

    await Promise.all(removedUrls.map((url) => deleteBlogUploadFile(url)));
  }

  async getMyAnalytics(userId: string) {
    await this.ensureUser(userId);
    const db = this.prisma;

    const posts = await db.authorBlog.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        title: true,
        status: true,
        viewsCount: true,
        likesCount: true,
        commentsCount: true,
        createdAt: true,
        updatedAt: true,
        scheduledAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    type AnalyticsPost = (typeof posts)[number];
    const summary = posts.reduce(
      (
        acc: {
          totalPosts: number;
          totalViews: number;
          totalLikes: number;
          totalComments: number;
          byStatus: Record<string, number>;
        },
        post: AnalyticsPost,
      ) => {
        acc.totalPosts += 1;
        acc.totalViews += post.viewsCount ?? 0;
        acc.totalLikes += post.likesCount ?? 0;
        acc.totalComments += post.commentsCount ?? 0;
        acc.byStatus[post.status] = (acc.byStatus[post.status] ?? 0) + 1;
        return acc;
      },
      {
        totalPosts: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        byStatus: {
          DRAFT: 0,
          PENDING_REVIEW: 0,
          REJECTED: 0,
          PUBLISHED: 0,
        } as Record<string, number>,
      },
    );

    const topPosts = [...posts]
      .sort(
        (a, b) =>
          b.viewsCount +
          b.likesCount * 3 +
          b.commentsCount * 4 -
          (a.viewsCount + a.likesCount * 3 + a.commentsCount * 4),
      )
      .slice(0, 5);

    const recentActivity = posts.slice(0, 6);

    return {
      summary,
      topPosts,
      recentActivity,
    };
  }

  async getPublicPageSettings() {
    const settings = await this.ensureBlogPageSettingsRow();
    return this.mapBlogPageSettings(settings);
  }

  async updatePageSettings(
    actorUserId: string,
    dto: UpdateBlogPageSettingsDto,
  ) {
    await assertUserPermission(this.prisma, actorUserId, 'blogs.moderate');
    const current = await this.ensureBlogPageSettingsRow();

    const nextIntroLines =
      dto.introLines !== undefined
        ? dto.introLines
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(0, 12)
        : this.normalizeIntroLines(current.introLines);

    const updated = await this.prisma.blogPageSetting.update({
      where: { id: BLOG_PAGE_SETTINGS_ROW_ID },
      data: {
        ...(dto.eyebrow !== undefined
          ? { eyebrow: dto.eyebrow.trim() || current.eyebrow }
          : {}),
        ...(dto.title !== undefined
          ? { title: dto.title.trim() || current.title }
          : {}),
        ...(dto.introLines !== undefined ? { introLines: nextIntroLines } : {}),
      },
    });

    return this.mapBlogPageSettings(updated);
  }

  private canManageBlogOrComment(
    actorRole: string,
    ownerId: string,
    actorId: string,
  ): boolean {
    return ownerId === actorId || canManageAsAdmin(actorRole);
  }

  private resolveRequestedStatus(
    requested:
      | 'DRAFT'
      | 'PENDING_REVIEW'
      | 'REJECTED'
      | 'PUBLISHED'
      | undefined,
    isAdmin: boolean,
  ): 'DRAFT' | 'PENDING_REVIEW' | 'REJECTED' | 'PUBLISHED' {
    if (!requested) return BLOG_STATUS.DRAFT;
    if (requested === BLOG_STATUS.PUBLISHED && !isAdmin) {
      return BLOG_STATUS.PENDING_REVIEW;
    }
    if (requested === BLOG_STATUS.REJECTED && !isAdmin) {
      throw new ForbiddenException('You cannot mark a post as rejected.');
    }
    return requested;
  }

  async listBlogs(dto: ListBlogsDto, currentUserId?: string) {
    const db = this.prisma;
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const skip = (page - 1) * limit;
    const tab = dto.tab;
    const tagFilters = parseTagFilters(dto);

    let followedAuthorIds: string[] = [];
    if (currentUserId) {
      const follows = await db.authorFollow.findMany({
        where: { followerId: currentUserId },
        select: { authorId: true },
      });
      followedAuthorIds = follows.map((f) => f.authorId);
    }

    const where = buildBlogListWhere(dto, tagFilters, followedAuthorIds);
    const orderBy = getBlogListOrderBy(tab);

    const [items, total] = await Promise.all([
      db.authorBlog.findMany({
        where,
        include: blogInclude(currentUserId),
        orderBy,
        skip,
        take: limit,
      }),
      db.authorBlog.count({ where }),
    ]);

    return {
      items: items.map((item) => mapBlog(item, currentUserId)),
      total,
      page,
      limit,
    };
  }

  async getBlog(blogId: string, currentUserId?: string, visitorId?: string) {
    const db = this.prisma;
    const existing = await db.authorBlog.findUnique({ where: { id: blogId } });
    if (!existing) {
      throw new NotFoundException('Blog post not found');
    }

    let canAccessUnpublished = false;
    if (currentUserId) {
      if (existing.authorId === currentUserId) {
        canAccessUnpublished = true;
      } else {
        const viewer = await this.prisma.user.findUnique({
          where: { id: currentUserId },
          select: { role: true },
        });
        canAccessUnpublished = !!viewer && canManageAsAdmin(viewer.role);
      }
    }

    if (existing.status !== BLOG_STATUS.PUBLISHED && !canAccessUnpublished) {
      throw new NotFoundException('Blog post not found');
    }

    let shouldIncrementView = false;
    if (existing.status === BLOG_STATUS.PUBLISHED) {
      if (currentUserId) {
        try {
          await db.blogPostView.create({
            data: {
              postId: blogId,
              userId: currentUserId,
            },
          });
          shouldIncrementView = true;
        } catch (error) {
          // Same account already viewed this post before.
          if (
            !(
              error instanceof Prisma.PrismaClientKnownRequestError &&
              error.code === 'P2002'
            )
          ) {
            throw error;
          }
        }
      } else if (
        typeof visitorId === 'string' &&
        visitorId.trim().length >= 12
      ) {
        const normalizedVisitorId = visitorId.trim().slice(0, 128);
        try {
          await db.blogPostAnonymousView.create({
            data: {
              postId: blogId,
              visitorId: normalizedVisitorId,
            },
          });
          shouldIncrementView = true;
        } catch (error) {
          // Same anonymous visitor already viewed this post before.
          if (
            !(
              error instanceof Prisma.PrismaClientKnownRequestError &&
              error.code === 'P2002'
            )
          ) {
            throw error;
          }
        }
      }
    }

    const blog = shouldIncrementView
      ? await db.authorBlog.update({
          where: { id: blogId },
          data: { viewsCount: { increment: 1 } },
          include: {
            ...blogInclude(currentUserId),
            comments: {
              include: commentInclude(),
              orderBy: { createdAt: 'desc' },
            },
          },
        })
      : await db.authorBlog.findUnique({
          where: { id: blogId },
          include: {
            ...blogInclude(currentUserId),
            comments: {
              include: commentInclude(),
              orderBy: { createdAt: 'desc' },
            },
          },
        });

    if (!blog) {
      throw new NotFoundException('Blog post not found');
    }

    return mapBlog(blog, currentUserId);
  }

  async createBlog(userId: string, dto: CreateBlogDto) {
    const db = this.prisma;
    const user = await this.ensureUser(userId);
    this.assertNoInlineImages(dto.content);
    const tags = normalizeTags(dto.tags);
    const bookIds = uniqueIds(dto.bookIds);
    await this.assertBooksExist(bookIds);

    const readingTime = dto.readingTime ?? estimateReadingTime(dto.content);
    const status = this.resolveRequestedStatus(
      dto.status,
      canManageAsAdmin(user.role),
    );
    const scheduledAt = resolveScheduledAt(status, dto.scheduledAt);

    const blog = await db.authorBlog.create({
      data: buildCreateBlogData(
        userId,
        dto,
        tags,
        bookIds,
        readingTime,
        status,
        scheduledAt,
      ),
      include: blogInclude(userId),
    });

    if (status === BLOG_STATUS.PUBLISHED) {
      await this.notifyFollowersOnPublish(user, blog.id, blog.title);
    }

    return mapBlog(blog, userId);
  }

  async updateBlog(userId: string, blogId: string, dto: UpdateBlogDto) {
    const db = this.prisma;
    const user = await this.ensureUser(userId);
    this.assertNoInlineImages(dto.content);

    const existing = await db.authorBlog.findUnique({ where: { id: blogId } });
    if (!existing) {
      throw new NotFoundException('Blog post not found');
    }

    if (!this.canManageBlogOrComment(user.role, existing.authorId, userId)) {
      throw new ForbiddenException('You can only edit your own blog posts');
    }

    const nextTags = dto.tags ? normalizeTags(dto.tags) : undefined;
    const nextBookIds = dto.bookIds ? uniqueIds(dto.bookIds) : undefined;
    if (nextBookIds) {
      await this.assertBooksExist(nextBookIds);
    }

    const statusBefore = existing.status;
    const nextStatus =
      dto.status === undefined
        ? undefined
        : this.resolveRequestedStatus(dto.status, canManageAsAdmin(user.role));

    const updated = await db.$transaction(
      async (tx: Prisma.TransactionClient) => {
        if (nextTags) {
          await tx.blogPostTag.deleteMany({ where: { postId: blogId } });
        }

        if (nextBookIds) {
          await tx.blogPostBookReference.deleteMany({
            where: { postId: blogId },
          });
        }

        return tx.authorBlog.update({
          where: { id: blogId },
          data: {
            ...buildUpdateBlogData(
              { ...dto, status: nextStatus },
              nextTags,
              nextBookIds,
            ),
            ...(nextStatus === BLOG_STATUS.DRAFT ||
            nextStatus === BLOG_STATUS.PENDING_REVIEW
              ? {
                  moderationReason: null,
                  reviewedByUserId: null,
                  reviewedAt: null,
                }
              : {}),
            ...(dto.readingTime === undefined && dto.content !== undefined
              ? { readingTime: estimateReadingTime(dto.content) }
              : {}),
          },
          include: blogInclude(userId),
        });
      },
    );

    if (
      statusBefore !== BLOG_STATUS.PUBLISHED &&
      updated.status === BLOG_STATUS.PUBLISHED
    ) {
      await this.notifyFollowersOnPublish(user, updated.id, updated.title);
    }

    await this.cleanupRemovedBlogImages(
      existing.content,
      dto.content ?? existing.content,
    );

    return mapBlog(updated, userId);
  }

  async publishBlog(userId: string, blogId: string) {
    const user = await this.ensureUser(userId);
    const status = canManageAsAdmin(user.role)
      ? BLOG_STATUS.PUBLISHED
      : BLOG_STATUS.PENDING_REVIEW;
    return this.updateBlog(userId, blogId, { status });
  }

  async listModerationQueue(dto: ListBlogModerationDto) {
    const db = this.prisma;
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.AuthorBlogWhereInput = {
      status: dto.status ?? BLOG_STATUS.PENDING_REVIEW,
    };

    if (dto.q?.trim()) {
      const keyword = dto.q.trim();
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { author: { name: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      db.authorBlog.findMany({
        where,
        include: blogInclude(),
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      db.authorBlog.count({ where }),
    ]);

    return {
      items: items.map((item) => mapBlog(item)),
      total,
      page,
      limit,
    };
  }

  async reviewBlog(
    reviewerUserId: string,
    blogId: string,
    action: 'APPROVE' | 'REJECT',
    dto: ReviewBlogDto,
  ) {
    const db = this.prisma;
    await this.ensureUser(reviewerUserId);

    const existing = await db.authorBlog.findUnique({
      where: { id: blogId },
      include: { author: true },
    });
    if (!existing) {
      throw new NotFoundException('Blog post not found');
    }

    const reason = dto.reason?.trim() || null;
    if (action === 'REJECT' && !reason) {
      throw new BadRequestException('Rejection reason is required.');
    }

    const status =
      action === 'APPROVE' ? BLOG_STATUS.PUBLISHED : BLOG_STATUS.REJECTED;
    const updated = await db.authorBlog.update({
      where: { id: blogId },
      data: {
        status,
        moderationReason: reason,
        reviewedByUserId: reviewerUserId,
        reviewedAt: new Date(),
        ...(status === BLOG_STATUS.PUBLISHED ? { scheduledAt: null } : {}),
      },
      include: blogInclude(),
    });

    if (status === BLOG_STATUS.PUBLISHED) {
      await this.notifyFollowersOnPublish(
        { id: existing.author.id, name: existing.author.name },
        updated.id,
        updated.title,
      );
    }

    return mapBlog(updated);
  }

  async deleteBlog(userId: string, blogId: string) {
    const user = await this.ensureUser(userId);
    const existing = await this.prisma.authorBlog.findUnique({
      where: { id: blogId },
    });

    if (!existing) {
      throw new NotFoundException('Blog post not found');
    }

    if (!this.canManageBlogOrComment(user.role, existing.authorId, userId)) {
      throw new ForbiddenException('You can only delete your own blog posts');
    }

    const deleted = await this.prisma.authorBlog.delete({
      where: { id: blogId },
    });
    await Promise.all(
      extractBlogUploadUrls(existing.content).map((url) =>
        deleteBlogUploadFile(url),
      ),
    );
    return deleted;
  }

  async deleteUploadedImage(userId: string, url: string) {
    await this.ensureUser(userId);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      throw new BadRequestException('Image URL is required.');
    }

    const ownerId = getBlogUploadOwnerId(trimmedUrl);
    if (!ownerId || ownerId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own uploaded images.',
      );
    }

    const usageCount = await this.prisma.authorBlog.count({
      where: {
        content: {
          contains: trimmedUrl,
        },
      },
    });

    if (usageCount > 0) {
      throw new BadRequestException(
        'This image is still attached to a saved blog post.',
      );
    }

    await deleteBlogUploadFile(trimmedUrl);
    return { deleted: true };
  }

  async likeBlog(userId: string, blogId: string) {
    const db = this.prisma;
    const user = await this.ensureUser(userId);
    const blog = await db.authorBlog.findUnique({ where: { id: blogId } });

    if (!blog || blog.status !== BLOG_STATUS.PUBLISHED) {
      throw new NotFoundException('Blog post not found');
    }

    const existing = await db.blogLike.findUnique({
      where: { postId_userId: { postId: blogId, userId } },
    });

    if (existing) {
      return { liked: true };
    }

    await db.$transaction([
      db.blogLike.create({ data: { postId: blogId, userId } }),
      db.authorBlog.update({
        where: { id: blogId },
        data: { likesCount: { increment: 1 } },
      }),
    ]);

    if (blog.authorId !== userId) {
      await this.notificationsService.createUserNotification({
        userId: blog.authorId,
        type: NotificationType.BLOG_LIKE,
        title: 'New like on your post',
        message: `${user.name} liked "${blog.title}".`,
        link: `/blogs/${blog.id}`,
      });
    }

    return { liked: true };
  }

  async unlikeBlog(userId: string, blogId: string) {
    const db = this.prisma;
    await this.ensureUser(userId);

    const existing = await db.blogLike.findUnique({
      where: { postId_userId: { postId: blogId, userId } },
    });

    if (!existing) {
      return { liked: false };
    }

    await db.$transaction([
      db.blogLike.delete({ where: { id: existing.id } }),
      db.authorBlog.update({
        where: { id: blogId },
        data: { likesCount: { decrement: 1 } },
      }),
    ]);

    return { liked: false };
  }

  async listLikedPostIds(userId: string) {
    const db = this.prisma;
    await this.ensureUser(userId);

    const likes = await db.blogLike.findMany({
      where: { userId },
      select: { postId: true },
    });

    return { postIds: likes.map((like) => like.postId) };
  }

  async followAuthor(userId: string, authorId: string) {
    const db = this.prisma;
    const user = await this.ensureUser(userId);
    await this.ensureUser(authorId);

    if (userId === authorId) {
      throw new ForbiddenException('You cannot follow yourself');
    }

    const existing = await db.authorFollow.findUnique({
      where: { followerId_authorId: { followerId: userId, authorId } },
    });

    if (existing) {
      return existing;
    }

    const follow = await db.authorFollow.create({
      data: {
        followerId: userId,
        authorId,
      },
      include: {
        author: {
          select: BLOG_USER_PROFILE_SELECT,
        },
      },
    });

    await this.notificationsService.createUserNotification({
      userId: authorId,
      type: NotificationType.BLOG_FOLLOW,
      title: 'New follower',
      message: `${user.name} started following you.`,
      link: `/user/${user.id}`,
    });

    return follow;
  }

  async unfollowAuthor(userId: string, authorId: string) {
    const db = this.prisma;
    await this.ensureUser(userId);

    const follow = await db.authorFollow.findUnique({
      where: { followerId_authorId: { followerId: userId, authorId } },
    });

    if (!follow) {
      throw new NotFoundException('Follow relationship not found');
    }

    return db.authorFollow.delete({ where: { id: follow.id } });
  }

  async listFollowedAuthors(userId: string) {
    const db = this.prisma;
    await this.ensureUser(userId);

    return db.authorFollow.findMany({
      where: { followerId: userId },
      include: {
        author: {
          select: BLOG_USER_PROFILE_SELECT,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserProfile(userId: string, currentUserId?: string) {
    const db = this.prisma;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: BLOG_PROFILE_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isOwner = !!currentUserId && currentUserId === userId;
    const canViewFavorites = isOwner || user.showFavorites;
    const canViewLikedPosts = isOwner || user.showLikedPosts;
    const canViewFollowers = isOwner || user.showFollowers;
    const canViewFollowing = isOwner || user.showFollowing;

    const [posts, followers, following, isFollowing, favorites, likedPosts] =
      await Promise.all([
        db.authorBlog.findMany({
          where: { authorId: userId, status: BLOG_STATUS.PUBLISHED },
          include: blogInclude(currentUserId),
          orderBy: { createdAt: 'desc' },
        }),
        db.authorFollow.count({ where: { authorId: userId } }),
        db.authorFollow.count({ where: { followerId: userId } }),
        currentUserId
          ? db.authorFollow.findUnique({
              where: {
                followerId_authorId: {
                  followerId: currentUserId,
                  authorId: userId,
                },
              },
            })
          : null,
        canViewFavorites
          ? this.prisma.favoriteItem.findMany({
              where: { userId },
              include: {
                book: {
                  select: BLOG_REFERENCE_BOOK_SELECT,
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 24,
            })
          : [],
        canViewLikedPosts
          ? db.blogLike.findMany({
              where: {
                userId,
                post: { status: BLOG_STATUS.PUBLISHED },
              },
              include: {
                post: {
                  include: blogInclude(currentUserId),
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 24,
            })
          : [],
      ]);

    return toProfileResponse(
      user,
      isOwner,
      posts,
      favorites,
      likedPosts,
      followers,
      following,
      canViewFollowers,
      canViewFollowing,
      isFollowing,
      currentUserId,
    );
  }

  async listComments(blogId: string) {
    const db = this.prisma;
    const blog = await db.authorBlog.findUnique({ where: { id: blogId } });
    if (!blog || blog.status !== BLOG_STATUS.PUBLISHED) {
      throw new NotFoundException('Blog post not found');
    }

    return db.blogComment.findMany({
      where: { blogId },
      include: commentInclude(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async addComment(userId: string, blogId: string, dto: CreateBlogCommentDto) {
    const db = this.prisma;
    const commenter = await this.ensureUser(userId);

    const blog = await db.authorBlog.findUnique({ where: { id: blogId } });
    if (!blog || blog.status !== BLOG_STATUS.PUBLISHED) {
      throw new NotFoundException('Blog post not found');
    }

    const comment = await db.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const created = await tx.blogComment.create({
          data: {
            blogId,
            userId,
            content: dto.content,
          },
          include: commentInclude(),
        });

        await tx.authorBlog.update({
          where: { id: blogId },
          data: { commentsCount: { increment: 1 } },
        });

        return created;
      },
    );

    if (blog.authorId !== userId) {
      await this.notificationsService.createUserNotification({
        userId: blog.authorId,
        type: NotificationType.BLOG_COMMENT,
        title: 'New comment on your post',
        message: `${commenter.name} commented on "${blog.title}".`,
        link: `/blogs/${blog.id}`,
      });
    }

    return comment;
  }

  async deleteComment(userId: string, commentId: string) {
    const db = this.prisma;
    const user = await this.ensureUser(userId);

    const comment = await db.blogComment.findUnique({
      where: { id: commentId },
      include: { blog: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (
      comment.userId !== userId &&
      !this.canManageBlogOrComment(user.role, comment.blog.authorId, userId)
    ) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await db.$transaction([
      db.blogComment.delete({ where: { id: commentId } }),
      db.authorBlog.update({
        where: { id: comment.blogId },
        data: { commentsCount: { decrement: 1 } },
      }),
    ]);

    return { success: true };
  }

  async getTrendingTags() {
    const db = this.prisma;
    const grouped = await db.blogPostTag.groupBy({
      by: ['tagId'],
      _count: { tagId: true },
      orderBy: { _count: { tagId: 'desc' } },
      take: 12,
    });

    if (!grouped.length) return [];

    const tags = await db.blogTag.findMany({
      where: { id: { in: grouped.map((g) => g.tagId) } },
    });
    const byId = new Map(tags.map((tag) => [tag.id, tag]));

    return grouped
      .map((group) => {
        const tag = byId.get(group.tagId);
        if (!tag) return null;
        return {
          id: tag.id,
          name: tag.name,
          usageCount: group._count.tagId,
        };
      })
      .filter(
        (item): item is { id: string; name: string; usageCount: number } =>
          item !== null,
      );
  }

  async getStaffPicks() {
    const db = this.prisma;
    const picks = await db.authorBlog.findMany({
      where: { status: BLOG_STATUS.PUBLISHED },
      include: blogInclude(),
      orderBy: [
        { likesCount: 'desc' },
        { commentsCount: 'desc' },
        { viewsCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 4,
    });

    return picks.map((item) => mapBlog(item));
  }

  private async notifyFollowersOnPublish(
    author: { id: string; name: string },
    blogId: string,
    title: string,
  ) {
    const followers = await this.prisma.authorFollow.findMany({
      where: { authorId: author.id },
      select: { followerId: true },
    });

    if (followers.length === 0) return;

    await Promise.all(
      followers.map((follower) =>
        this.notificationsService.createUserNotification({
          userId: follower.followerId,
          type: NotificationType.ANNOUNCEMENT,
          title: 'New post from an author you follow',
          message: `${author.name} published "${title}".`,
          link: `/blogs/${blogId}`,
        }),
      ),
    );
  }
}
