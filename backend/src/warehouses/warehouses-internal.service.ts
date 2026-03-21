import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PurchaseRequestStatus,
  Role,
  WarehouseAlertStatus,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { resolveUserPermissionKeys } from '../auth/permission-resolution';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class WarehousesInternalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async notifyBackInStock(bookId: string, bookTitle: string) {
    const subscriptions = await this.prisma.stockAlertSubscription.findMany({
      where: {
        bookId,
        isActive: true,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (subscriptions.length === 0) {
      return;
    }

    await Promise.all(
      subscriptions.map((subscription) =>
        this.notificationsService.createUserNotification({
          userId: subscription.userId,
          type: 'stock_alert',
          title: 'Back in stock',
          message: `${bookTitle} is available again.`,
          link: `/books/${bookId}`,
        }),
      ),
    );

    await this.prisma.stockAlertSubscription.updateMany({
      where: {
        id: { in: subscriptions.map((subscription) => subscription.id) },
      },
      data: {
        isActive: false,
        notifiedAt: new Date(),
      },
    });
  }

  async isFinanceReviewer(userId?: string) {
    if (!userId) return false;
    const keys = await resolveUserPermissionKeys(this.prisma, userId);
    return (
      keys.has('*') ||
      keys.has('finance.purchase_request.review') ||
      keys.has('finance.purchase_request.approve') ||
      keys.has('finance.purchase_request.reject')
    );
  }

  async ensureWarehouse(warehouseId: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId },
    });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    return warehouse;
  }

  async ensureBook(bookId: string) {
    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    return book;
  }

  async ensureExistingUser(actorUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: actorUserId },
      select: { role: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async canViewAllFinanceResources(actorUserId: string) {
    const user = await this.ensureExistingUser(actorUserId);
    return (
      user.role === Role.ADMIN ||
      String(user.role) === 'SUPER_ADMIN' ||
      (await this.isFinanceReviewer(actorUserId))
    );
  }

  async syncBookTotalStock(bookId: string) {
    const currentBook = await this.prisma.book.findUnique({
      where: { id: bookId },
      select: { stock: true, title: true },
    });
    const result = await this.prisma.warehouseStock.aggregate({
      where: { bookId },
      _sum: { stock: true },
    });

    const totalStock = result._sum.stock ?? 0;
    await this.prisma.book.update({
      where: { id: bookId },
      data: { stock: totalStock },
    });

    if ((currentBook?.stock ?? 0) <= 0 && totalStock > 0 && currentBook?.title) {
      await this.notifyBackInStock(bookId, currentBook.title);
    }

    return totalStock;
  }

  async reconcileAllBookStocks() {
    const grouped = await this.prisma.warehouseStock.groupBy({
      by: ['bookId'],
      _sum: { stock: true },
    });

    const bookIdsWithWarehouseStock = grouped.map((row) => row.bookId);

    await this.prisma.$transaction([
      ...grouped.map((row) =>
        this.prisma.book.update({
          where: { id: row.bookId },
          data: { stock: row._sum.stock ?? 0 },
        }),
      ),
      this.prisma.book.updateMany({
        where: {
          ...(bookIdsWithWarehouseStock.length > 0
            ? { id: { notIn: bookIdsWithWarehouseStock } }
            : {}),
          stock: { not: 0 },
        },
        data: { stock: 0 },
      }),
    ]);
  }

  async refreshLowStockAlert(warehouseId: string, bookId: string) {
    const stockRow = await this.prisma.warehouseStock.findUnique({
      where: { warehouseId_bookId: { warehouseId, bookId } },
    });

    if (!stockRow) {
      return;
    }

    const isLow = stockRow.stock <= stockRow.lowStockThreshold;

    if (isLow) {
      const existingOpen = await this.prisma.warehouseAlert.findFirst({
        where: {
          warehouseId,
          bookId,
          status: WarehouseAlertStatus.OPEN,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingOpen) {
        await this.prisma.warehouseAlert.update({
          where: { id: existingOpen.id },
          data: {
            stock: stockRow.stock,
            threshold: stockRow.lowStockThreshold,
          },
        });
      } else {
        await this.prisma.warehouseAlert.create({
          data: {
            warehouseId,
            bookId,
            stock: stockRow.stock,
            threshold: stockRow.lowStockThreshold,
            status: WarehouseAlertStatus.OPEN,
          },
        });
      }
    } else {
      await this.prisma.warehouseAlert.updateMany({
        where: {
          warehouseId,
          bookId,
          status: WarehouseAlertStatus.OPEN,
        },
        data: {
          status: WarehouseAlertStatus.RESOLVED,
          resolvedAt: new Date(),
          stock: stockRow.stock,
          threshold: stockRow.lowStockThreshold,
        },
      });
    }
  }

  ensureApprovedRequestStatus(status: PurchaseRequestStatus) {
    return status === PurchaseRequestStatus.APPROVED;
  }
}
