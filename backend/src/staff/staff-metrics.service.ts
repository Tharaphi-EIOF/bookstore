import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  STAFF_TASK_WITH_STAFF_INCLUDE,
  STAFF_USER_BASIC_SELECT,
} from './staff.constants';
import { assertStaffFilterScoped, isElevatedRole } from './staff.access';
import {
  buildCommercialOrderWhere,
  buildTaskWhere,
  clampCommercialMetricsLimit,
} from './staff.filters';
import {
  buildCommercialMetrics,
  buildTaskPerformanceMetrics,
  mapTopBuyers,
  rollupBookSales,
} from './staff.metrics';
import { StaffInternalService } from './staff-internal.service';

@Injectable()
export class StaffMetricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly internal: StaffInternalService,
  ) {}

  async getPerformanceMetrics(
    filters: {
      departmentId?: string;
      staffId?: string;
      fromDate?: Date;
      toDate?: Date;
    },
    actorUserId?: string,
  ) {
    const scopedDepartmentId = await this.internal.resolveScopedDepartmentId(
      actorUserId,
      filters.departmentId,
    );
    const actor = await this.internal.getActorContext(actorUserId);

    if (filters.staffId && !isElevatedRole(actor.role)) {
      const targetStaff = await this.prisma.staffProfile.findUnique({
        where: { id: filters.staffId },
        select: { id: true, departmentId: true },
      });
      assertStaffFilterScoped(
        actor.role,
        !!targetStaff && targetStaff.departmentId === scopedDepartmentId,
        'You can only access performance data in your own department.',
      );
    }

    const tasks = await this.prisma.staffTask.findMany({
      where: buildTaskWhere(filters, scopedDepartmentId),
      include: {
        ...STAFF_TASK_WITH_STAFF_INCLUDE,
      },
    });
    return buildTaskPerformanceMetrics(tasks);
  }

  async getCommercialPerformanceMetrics(
    filters: {
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
    },
    actorUserId?: string,
  ) {
    await this.internal.getActorContext(actorUserId);

    const limit = clampCommercialMetricsLimit(filters.limit);
    const orderWhere = buildCommercialOrderWhere(filters);

    const [buyerGroups, filteredItems] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['userId'],
        where: orderWhere,
        _sum: { totalPrice: true },
        _count: { id: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: limit,
      }),
      this.prisma.orderItem.findMany({
        where: {
          order: orderWhere,
        },
        select: {
          bookId: true,
          quantity: true,
          price: true,
        },
      }),
    ]);

    const userIds = buyerGroups.map((row) => row.userId);
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: STAFF_USER_BASIC_SELECT,
        })
      : [];
    const usersById = new Map(users.map((user) => [user.id, user]));
    const topBuyers = mapTopBuyers(buyerGroups, usersById);

    const bookIds = Array.from(
      new Set(filteredItems.map((item) => item.bookId)),
    );
    const books = bookIds.length
      ? await this.prisma.book.findMany({
          where: { id: { in: bookIds } },
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
          },
        })
      : [];
    const booksById = new Map(books.map((book) => [book.id, book]));
    const mergedBooks = rollupBookSales(filteredItems, booksById);

    return buildCommercialMetrics({
      limit,
      buyers: topBuyers,
      books: mergedBooks,
      fromDate: filters.fromDate,
      toDate: filters.toDate,
    });
  }
}
