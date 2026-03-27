import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InquiryType,
  InquiryStatus,
  InventoryLotSourceType,
  InventoryOwnershipType,
  OrderStatus,
  Prisma,
  PurchaseOrderStatus,
  PurchaseRequestStatus,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { assertUserPermission } from '../auth/permission-resolution';
import { PricingSettingsService } from '../pricing-settings/pricing-settings.service';
import {
  PURCHASE_ORDER_INCLUDE,
  PURCHASE_REQUEST_INCLUDE,
} from './warehouses.constants';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CreatePurchaseOrdersBatchDto } from './dto/create-purchase-orders-batch.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import {
  ReviewPurchaseRequestDto,
  PurchaseReviewAction,
} from './dto/review-purchase-request.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { WarehousesInternalService } from './warehouses-internal.service';
import { receiveInventoryLot } from '../inventory/inventory-lot.helpers';

@Injectable()
export class WarehousesProcurementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingSettingsService: PricingSettingsService,
    private readonly internal: WarehousesInternalService,
  ) {}

  private clampLimit(limit: number | undefined, fallback = 20, max = 200) {
    if (!Number.isFinite(limit)) {
      return fallback;
    }
    return Math.max(1, Math.min(max, Math.floor(limit as number)));
  }

  private buildRangeWhere(fromDate?: Date, toDate?: Date) {
    const where: { gte?: Date; lte?: Date } = {};

    if (fromDate && Number.isNaN(fromDate.getTime())) {
      throw new BadRequestException('Invalid fromDate.');
    }
    if (toDate && Number.isNaN(toDate.getTime())) {
      throw new BadRequestException('Invalid toDate.');
    }
    if (fromDate && toDate && fromDate > toDate) {
      throw new BadRequestException('fromDate must be earlier than toDate.');
    }

    if (fromDate) {
      where.gte = fromDate;
    }
    if (toDate) {
      where.lte = toDate;
    }
    return Object.keys(where).length ? where : undefined;
  }

  async getPurchasePricingPreview(actorUserId: string) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_order.view',
    );

    const settings = await this.pricingSettingsService.getSettings();
    return {
      applyPricingOnReceive: settings.applyPricingOnReceive,
      vendorMarkupType: settings.vendorMarkupType,
      vendorMarkupValue: Number(settings.vendorMarkupValue),
    };
  }

  async listPurchaseRequests(
    actorUserId: string,
    filters?: { status?: PurchaseRequestStatus; warehouseId?: string },
  ) {
    const canViewAll =
      await this.internal.canViewAllFinanceResources(actorUserId);

    return this.prisma.purchaseRequest.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.warehouseId ? { warehouseId: filters.warehouseId } : {}),
        ...(canViewAll ? {} : { requestedByUserId: actorUserId }),
      },
      include: PURCHASE_REQUEST_INCLUDE,
      orderBy: [{ createdAt: 'desc' }],
      take: 200,
    });
  }

  async listVendors(
    activeOnly?: boolean,
    status: 'active' | 'trashed' | 'all' = 'active',
  ) {
    return this.prisma.vendor.findMany({
      where: {
        ...(status === 'all'
          ? {}
          : status === 'trashed'
            ? { deletedAt: { not: null } }
            : { deletedAt: null }),
        ...(activeOnly === undefined ? {} : { isActive: activeOnly }),
      },
      orderBy: [{ deletedAt: 'asc' }, { isActive: 'desc' }, { name: 'asc' }],
      take: 200,
    });
  }

  async createVendor(dto: CreateVendorDto) {
    return this.prisma.vendor.create({
      data: {
        code: dto.code.toUpperCase(),
        name: dto.name,
        contactName: dto.contactName,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateVendor(vendorId: string, dto: UpdateVendorDto) {
    const existing = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, deletedAt: true },
    });
    if (!existing) {
      throw new NotFoundException('Vendor not found');
    }
    if (existing.deletedAt) {
      throw new BadRequestException(
        'Cannot update a vendor in bin. Restore it first.',
      );
    }

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        ...(dto.code !== undefined ? { code: dto.code.toUpperCase() } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.contactName !== undefined
          ? { contactName: dto.contactName }
          : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async deleteVendor(vendorId: string) {
    const existing = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, deletedAt: true },
    });
    if (!existing) {
      throw new NotFoundException('Vendor not found');
    }
    if (existing.deletedAt) {
      throw new BadRequestException('Vendor is already in bin.');
    }

    const linkedOrders = await this.prisma.purchaseOrder.count({
      where: { vendorId },
    });

    if (linkedOrders > 0) {
      throw new BadRequestException(
        'Vendor cannot be deleted because it is linked to purchase orders. Set vendor to inactive instead.',
      );
    }

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  async restoreVendor(vendorId: string) {
    const existing = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, deletedAt: true },
    });
    if (!existing) {
      throw new NotFoundException('Vendor not found');
    }
    if (!existing.deletedAt) {
      throw new BadRequestException('Vendor is not in bin.');
    }

    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: { deletedAt: null },
    });
  }

  async permanentDeleteVendor(vendorId: string) {
    const existing = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, deletedAt: true },
    });
    if (!existing) {
      throw new NotFoundException('Vendor not found');
    }
    if (!existing.deletedAt) {
      throw new BadRequestException(
        'Vendor must be moved to bin before permanent delete.',
      );
    }

    const linkedOrders = await this.prisma.purchaseOrder.count({
      where: { vendorId },
    });
    if (linkedOrders > 0) {
      throw new BadRequestException(
        'Vendor cannot be permanently deleted because it is linked to purchase orders.',
      );
    }

    return this.prisma.vendor.delete({ where: { id: vendorId } });
  }

  async listPurchaseOrders(
    actorUserId: string,
    filters?: {
      status?: PurchaseOrderStatus;
      warehouseId?: string;
      vendorId?: string;
    },
  ) {
    const canViewAll =
      await this.internal.canViewAllFinanceResources(actorUserId);

    return this.prisma.purchaseOrder.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.warehouseId ? { warehouseId: filters.warehouseId } : {}),
        ...(filters?.vendorId ? { vendorId: filters.vendorId } : {}),
        ...(canViewAll ? {} : { createdByUserId: actorUserId }),
      },
      include: PURCHASE_ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getCatalogBreakdown(
    actorUserId: string,
    groupBy: 'author' | 'category' | 'genre' | 'vendor' = 'author',
    limit = 20,
  ) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.reports.view',
    );
    const safeLimit = this.clampLimit(limit, 20, 100);

    if (groupBy === 'author') {
      const groups = await this.prisma.book.groupBy({
        by: ['author'],
        where: { deletedAt: null },
        _count: { id: true },
        _sum: { stock: true },
        orderBy: { _count: { id: 'desc' } },
        take: safeLimit,
      });

      const authors = groups.map((group) => group.author);
      const books = authors.length
        ? await this.prisma.book.findMany({
            where: { deletedAt: null, author: { in: authors } },
            select: {
              id: true,
              title: true,
              author: true,
              stock: true,
              categories: true,
              genres: true,
            },
            orderBy: { updatedAt: 'desc' },
          })
        : [];

      const byAuthor = new Map(
        authors.map((author) => [author, [] as typeof books]),
      );
      for (const book of books) {
        byAuthor.get(book.author)?.push(book);
      }

      return {
        groupBy,
        items: groups.map((group) => {
          const groupedBooks = byAuthor.get(group.author) ?? [];
          return {
            key: group.author,
            totalBooks: group._count.id,
            totalStock: group._sum.stock ?? 0,
            outOfStockBooks: groupedBooks.filter((book) => book.stock <= 0)
              .length,
            books: groupedBooks.slice(0, 8).map((book) => ({
              id: book.id,
              title: book.title,
              author: book.author,
              stock: book.stock,
              categories: book.categories,
              genres: book.genres,
            })),
          };
        }),
      };
    }

    if (groupBy === 'category' || groupBy === 'genre') {
      const books = await this.prisma.book.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          title: true,
          author: true,
          stock: true,
          categories: true,
          genres: true,
        },
      });

      const bucket = new Map<
        string,
        {
          totalBooks: number;
          totalStock: number;
          outOfStockBooks: number;
          books: Array<{
            id: string;
            title: string;
            author: string;
            stock: number;
            categories: string[];
            genres: string[];
          }>;
        }
      >();

      for (const book of books) {
        const labels =
          groupBy === 'genre' ? (book.genres ?? []) : (book.categories ?? []);

        for (const label of labels) {
          const row = bucket.get(label) ?? {
            totalBooks: 0,
            totalStock: 0,
            outOfStockBooks: 0,
            books: [],
          };
          row.totalBooks += 1;
          row.totalStock += book.stock;
          if (book.stock <= 0) {
            row.outOfStockBooks += 1;
          }
          row.books.push({
            id: book.id,
            title: book.title,
            author: book.author,
            stock: book.stock,
            categories: book.categories ?? [],
            genres: book.genres ?? [],
          });
          bucket.set(label, row);
        }
      }

      const items = Array.from(bucket.entries())
        .map(([key, value]) => ({
          key,
          ...value,
          books: value.books.slice(0, 8),
        }))
        .sort((a, b) => b.totalBooks - a.totalBooks)
        .slice(0, safeLimit);

      return { groupBy, items };
    }

    const purchaseItems = await this.prisma.purchaseOrderItem.findMany({
      where: {
        purchaseOrder: {
          vendor: {
            deletedAt: null,
          },
        },
      },
      select: {
        bookId: true,
        purchaseOrder: {
          select: {
            vendorId: true,
            vendor: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        book: {
          select: {
            id: true,
            title: true,
            stock: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3000,
    });

    const vendorMap = new Map<
      string,
      {
        key: string;
        vendorCode: string;
        totalBooks: number;
        totalStock: number;
        outOfStockBooks: number;
        books: Array<{ id: string; title: string; stock: number }>;
        bookSet: Set<string>;
      }
    >();

    for (const row of purchaseItems) {
      const vendor = row.purchaseOrder.vendor;
      const current = vendorMap.get(vendor.id) ?? {
        key: vendor.name,
        vendorCode: vendor.code,
        totalBooks: 0,
        totalStock: 0,
        outOfStockBooks: 0,
        books: [],
        bookSet: new Set<string>(),
      };

      if (!current.bookSet.has(row.bookId)) {
        current.bookSet.add(row.bookId);
        current.totalBooks += 1;
        current.totalStock += row.book.stock;
        if (row.book.stock <= 0) {
          current.outOfStockBooks += 1;
        }
        current.books.push({
          id: row.book.id,
          title: row.book.title,
          stock: row.book.stock,
        });
      }

      vendorMap.set(vendor.id, current);
    }

    const items = Array.from(vendorMap.values())
      .map((vendor) => ({
        key: vendor.key,
        vendorCode: vendor.vendorCode,
        totalBooks: vendor.totalBooks,
        totalStock: vendor.totalStock,
        outOfStockBooks: vendor.outOfStockBooks,
        books: vendor.books.slice(0, 8),
      }))
      .sort((a, b) => b.totalBooks - a.totalBooks)
      .slice(0, safeLimit);

    return { groupBy, items };
  }

  async getAuthorPerformance(
    actorUserId: string,
    filters?: { fromDate?: Date; toDate?: Date; limit?: number },
  ) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.reports.view',
    );

    const safeLimit = this.clampLimit(filters?.limit, 20, 100);
    const createdAt = this.buildRangeWhere(filters?.fromDate, filters?.toDate);

    const [authorCounts, outOfStockCounts, soldItems] = await Promise.all([
      this.prisma.book.groupBy({
        by: ['author'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.book.groupBy({
        by: ['author'],
        where: {
          deletedAt: null,
          stock: { lte: 0 },
        },
        _count: { id: true },
      }),
      this.prisma.orderItem.findMany({
        where: {
          order: {
            status: {
              not: OrderStatus.CANCELLED,
            },
            ...(createdAt ? { createdAt } : {}),
          },
        },
        select: {
          quantity: true,
          price: true,
          book: {
            select: {
              id: true,
              title: true,
              author: true,
            },
          },
        },
      }),
    ]);

    const titleCountMap = new Map(
      authorCounts.map((row) => [row.author, row._count.id ?? 0]),
    );
    const outOfStockMap = new Map(
      outOfStockCounts.map((row) => [row.author, row._count.id ?? 0]),
    );

    const salesMap = new Map<
      string,
      {
        soldQty: number;
        revenue: number;
        titlesSold: Set<string>;
        topBooks: Map<
          string,
          {
            bookId: string;
            title: string;
            author: string;
            quantity: number;
          }
        >;
      }
    >();

    for (const item of soldItems) {
      const authorKey = item.book.author;
      const current = salesMap.get(authorKey) ?? {
        soldQty: 0,
        revenue: 0,
        titlesSold: new Set<string>(),
        topBooks: new Map<
          string,
          { bookId: string; title: string; author: string; quantity: number }
        >(),
      };

      current.soldQty += item.quantity;
      current.revenue += Number(item.price) * item.quantity;
      current.titlesSold.add(item.book.id);

      const currentBook = current.topBooks.get(item.book.id) ?? {
        bookId: item.book.id,
        title: item.book.title,
        author: item.book.author,
        quantity: 0,
      };
      currentBook.quantity += item.quantity;
      current.topBooks.set(item.book.id, currentBook);

      salesMap.set(authorKey, current);
    }

    const authorKeys = Array.from(
      new Set([
        ...titleCountMap.keys(),
        ...salesMap.keys(),
        ...outOfStockMap.keys(),
      ]),
    );

    const items = authorKeys
      .map((author) => {
        const sales = salesMap.get(author);
        const topBooks = sales
          ? Array.from(sales.topBooks.values())
              .sort((a, b) => b.quantity - a.quantity)
              .slice(0, 3)
          : [];

        return {
          author,
          totalTitles: titleCountMap.get(author) ?? 0,
          titlesSold: sales?.titlesSold.size ?? 0,
          soldQty: sales?.soldQty ?? 0,
          revenue: Number((sales?.revenue ?? 0).toFixed(2)),
          outOfStockTitles: outOfStockMap.get(author) ?? 0,
          topBooks,
        };
      })
      .sort((a, b) => b.revenue - a.revenue || b.soldQty - a.soldQty)
      .slice(0, safeLimit);

    return {
      filters: {
        fromDate: filters?.fromDate ?? null,
        toDate: filters?.toDate ?? null,
        limit: safeLimit,
      },
      items,
    };
  }

  async getReorderSuggestions(
    actorUserId: string,
    params?: {
      warehouseId?: string;
      leadTimeDays?: number;
      coverageDays?: number;
      minDailySales?: number;
      limit?: number;
    },
  ) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.reports.view',
    );

    const leadTimeDays = this.clampLimit(params?.leadTimeDays, 14, 90);
    const coverageDays = this.clampLimit(params?.coverageDays, 30, 120);
    const minDailySales = Number(params?.minDailySales ?? 0);
    const limit = this.clampLimit(params?.limit, 20, 100);
    const salesWindowDays = 30;
    const salesFromDate = new Date(
      Date.now() - salesWindowDays * 24 * 60 * 60 * 1000,
    );

    const [salesRows, pendingRows] = await Promise.all([
      this.prisma.orderItem.groupBy({
        by: ['bookId'],
        where: {
          order: {
            status: { not: OrderStatus.CANCELLED },
            createdAt: { gte: salesFromDate },
          },
        },
        _sum: { quantity: true },
      }),
      this.prisma.purchaseRequest.groupBy({
        by: ['bookId'],
        where: {
          ...(params?.warehouseId ? { warehouseId: params.warehouseId } : {}),
          status: {
            in: [
              PurchaseRequestStatus.DRAFT,
              PurchaseRequestStatus.PENDING_APPROVAL,
              PurchaseRequestStatus.APPROVED,
            ],
          },
        },
        _sum: { quantity: true },
      }),
    ]);

    const soldMap = new Map(
      salesRows.map((row) => [row.bookId, row._sum.quantity ?? 0]),
    );
    const pendingMap = new Map(
      pendingRows.map((row) => [row.bookId, row._sum.quantity ?? 0]),
    );
    const bookIds = Array.from(soldMap.keys());

    if (bookIds.length === 0) {
      return {
        filters: {
          warehouseId: params?.warehouseId ?? null,
          leadTimeDays,
          coverageDays,
          minDailySales,
          limit,
        },
        items: [],
      };
    }

    const books = await this.prisma.book.findMany({
      where: {
        id: { in: bookIds },
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        author: true,
        stock: true,
      },
    });

    const items = books
      .map((book) => {
        const sold30Days = soldMap.get(book.id) ?? 0;
        const dailySales = sold30Days / salesWindowDays;
        const pendingQty = pendingMap.get(book.id) ?? 0;
        const targetStock = Math.ceil(
          dailySales * (leadTimeDays + coverageDays),
        );
        const availableSoon = book.stock + pendingQty;
        const suggestedQuantity = Math.max(0, targetStock - availableSoon);

        return {
          bookId: book.id,
          title: book.title,
          author: book.author,
          stock: book.stock,
          sold30Days,
          dailySales: Number(dailySales.toFixed(2)),
          pendingPurchaseQty: pendingQty,
          targetStock,
          suggestedQuantity,
          shortage: Math.max(0, targetStock - book.stock),
        };
      })
      .filter(
        (item) =>
          item.suggestedQuantity > 0 && item.dailySales >= minDailySales,
      )
      .sort(
        (a, b) =>
          b.suggestedQuantity - a.suggestedQuantity ||
          b.dailySales - a.dailySales,
      )
      .slice(0, limit);

    return {
      filters: {
        warehouseId: params?.warehouseId ?? null,
        leadTimeDays,
        coverageDays,
        minDailySales,
        limit,
      },
      items,
    };
  }

  async createPurchaseRequestsFromReorderSuggestions(
    actorUserId: string,
    params: {
      warehouseId: string;
      leadTimeDays?: number;
      coverageDays?: number;
      minDailySales?: number;
      limit?: number;
      submitForApproval?: boolean;
    },
  ) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_request.create',
    );
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_request.view',
    );

    await this.internal.ensureWarehouse(params.warehouseId);

    const suggestions = await this.getReorderSuggestions(actorUserId, {
      warehouseId: params.warehouseId,
      leadTimeDays: params.leadTimeDays,
      coverageDays: params.coverageDays,
      minDailySales: params.minDailySales,
      limit: params.limit,
    });

    const created: Array<{
      requestId: string;
      bookId: string;
      quantity: number;
    }> = [];
    const skipped: Array<{ bookId: string; reason: string }> = [];

    for (const item of suggestions.items) {
      const existingOpen = await this.prisma.purchaseRequest.findFirst({
        where: {
          warehouseId: params.warehouseId,
          bookId: item.bookId,
          status: {
            in: [
              PurchaseRequestStatus.DRAFT,
              PurchaseRequestStatus.PENDING_APPROVAL,
              PurchaseRequestStatus.APPROVED,
            ],
          },
        },
        select: { id: true },
      });

      if (existingOpen) {
        skipped.push({
          bookId: item.bookId,
          reason: `Open purchase request already exists (${existingOpen.id}).`,
        });
        continue;
      }

      const request = await this.prisma.purchaseRequest.create({
        data: {
          bookId: item.bookId,
          warehouseId: params.warehouseId,
          requestedByUserId: actorUserId,
          quantity: item.suggestedQuantity,
          reviewNote: `Auto-generated from reorder suggestions (leadTime=${suggestions.filters.leadTimeDays}, coverage=${suggestions.filters.coverageDays}, dailySales=${item.dailySales}).`,
          status:
            params.submitForApproval === true
              ? PurchaseRequestStatus.PENDING_APPROVAL
              : PurchaseRequestStatus.DRAFT,
        },
        select: {
          id: true,
          bookId: true,
          quantity: true,
        },
      });

      created.push({
        requestId: request.id,
        bookId: request.bookId,
        quantity: request.quantity,
      });
    }

    return {
      createdCount: created.length,
      skippedCount: skipped.length,
      created,
      skipped,
    };
  }

  async getRestockImprovementList(actorUserId: string, limit = 50) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.reports.view',
    );
    const safeLimit = this.clampLimit(limit, 50, 200);
    const salesFromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const books = await this.prisma.book.findMany({
      where: {
        deletedAt: null,
        stock: {
          lte: 5,
        },
      },
      select: {
        id: true,
        title: true,
        author: true,
        categories: true,
        stock: true,
        updatedAt: true,
      },
      orderBy: [{ stock: 'asc' }, { updatedAt: 'desc' }],
      take: safeLimit * 3,
    });

    const bookIds = books.map((book) => book.id);
    if (bookIds.length === 0) {
      return { items: [] };
    }

    const [wishlistRows, cartRows, salesRows, pendingRequestRows] =
      await Promise.all([
        this.prisma.wishlistItem.groupBy({
          by: ['bookId'],
          where: { bookId: { in: bookIds } },
          _count: { _all: true },
        }),
        this.prisma.cartItem.groupBy({
          by: ['bookId'],
          where: { bookId: { in: bookIds } },
          _sum: { quantity: true },
        }),
        this.prisma.orderItem.groupBy({
          by: ['bookId'],
          where: {
            bookId: { in: bookIds },
            order: {
              status: {
                not: OrderStatus.CANCELLED,
              },
              createdAt: {
                gte: salesFromDate,
              },
            },
          },
          _sum: { quantity: true },
        }),
        this.prisma.purchaseRequest.groupBy({
          by: ['bookId'],
          where: {
            bookId: { in: bookIds },
            status: {
              in: [
                PurchaseRequestStatus.PENDING_APPROVAL,
                PurchaseRequestStatus.APPROVED,
                PurchaseRequestStatus.DRAFT,
              ],
            },
          },
          _sum: { quantity: true },
        }),
      ]);

    const wishlistMap = new Map(
      wishlistRows.map((row) => [row.bookId, row._count._all]),
    );
    const cartMap = new Map(
      cartRows.map((row) => [row.bookId, row._sum.quantity ?? 0]),
    );
    const salesMap = new Map(
      salesRows.map((row) => [row.bookId, row._sum.quantity ?? 0]),
    );
    const pendingMap = new Map(
      pendingRequestRows.map((row) => [row.bookId, row._sum.quantity ?? 0]),
    );

    const items = books
      .map((book) => {
        const wishlistCount = wishlistMap.get(book.id) ?? 0;
        const cartDemand = cartMap.get(book.id) ?? 0;
        const soldLast30Days = salesMap.get(book.id) ?? 0;
        const pendingPurchaseQty = pendingMap.get(book.id) ?? 0;
        const shortageSignal =
          soldLast30Days + cartDemand + wishlistCount - pendingPurchaseQty;

        return {
          bookId: book.id,
          title: book.title,
          author: book.author,
          categories: book.categories,
          stock: book.stock,
          stockStatus: book.stock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
          wishlistCount,
          cartDemand,
          soldLast30Days,
          pendingPurchaseQty,
          shortageSignal,
        };
      })
      .sort((a, b) => b.shortageSignal - a.shortageSignal)
      .slice(0, safeLimit);

    return { items };
  }

  async getMissingBookDemand(actorUserId: string, limit = 50) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.reports.view',
    );
    const safeLimit = this.clampLimit(limit, 50, 200);

    const inquiries = await this.prisma.inquiry.findMany({
      where: {
        type: InquiryType.STOCK,
        status: {
          in: [
            InquiryStatus.OPEN,
            InquiryStatus.ASSIGNED,
            InquiryStatus.IN_PROGRESS,
            InquiryStatus.ESCALATED,
          ],
        },
      },
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          select: {
            message: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    });

    const items = await Promise.all(
      inquiries.map(async (inquiry) => {
        const latestMessage = inquiry.messages[0]?.message ?? '';
        const searchText = inquiry.subject.trim();

        const possibleMatches = searchText
          ? await this.prisma.book.findMany({
              where: {
                deletedAt: null,
                OR: [
                  { title: { contains: searchText, mode: 'insensitive' } },
                  { author: { contains: searchText, mode: 'insensitive' } },
                  { isbn: { contains: searchText, mode: 'insensitive' } },
                ],
              },
              select: {
                id: true,
                title: true,
                author: true,
                stock: true,
              },
              take: 3,
            })
          : [];

        return {
          inquiryId: inquiry.id,
          subject: inquiry.subject,
          latestMessage,
          status: inquiry.status,
          priority: inquiry.priority,
          requestedBy: inquiry.createdBy,
          createdAt: inquiry.createdAt,
          possibleMatches,
          isLikelyMissingFromCatalog: possibleMatches.length === 0,
        };
      }),
    );

    return {
      totalOpenStockInquiries: inquiries.length,
      likelyMissingCount: items.filter(
        (item) => item.isLikelyMissingFromCatalog,
      ).length,
      items,
    };
  }

  async getPurchaseHistorySummary(
    actorUserId: string,
    filters?: { fromDate?: Date; toDate?: Date },
  ) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.reports.view',
    );
    const createdAt = this.buildRangeWhere(filters?.fromDate, filters?.toDate);

    const orderWhere = {
      status: { not: OrderStatus.CANCELLED },
      ...(createdAt ? { createdAt } : {}),
    } as const;

    const purchaseOrderWhere: Prisma.PurchaseOrderWhereInput = {
      status: {
        notIn: [PurchaseOrderStatus.CANCELLED],
      },
      ...(createdAt ? { createdAt } : {}),
    };

    const [
      orderAggregate,
      orderStatusRows,
      orderBookRows,
      purchaseOrderCount,
      purchaseOrderAggregate,
      purchaseOrderVendorRows,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: orderWhere,
        _count: { id: true },
        _sum: {
          subtotalPrice: true,
          discountAmount: true,
          totalPrice: true,
        },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: orderWhere,
        _count: { id: true },
      }),
      this.prisma.orderItem.groupBy({
        by: ['bookId'],
        where: {
          order: orderWhere,
        },
        _sum: { quantity: true, price: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
      }),
      this.prisma.purchaseOrder.count({
        where: purchaseOrderWhere,
      }),
      this.prisma.purchaseOrder.aggregate({
        where: purchaseOrderWhere,
        _sum: { totalCost: true },
      }),
      this.prisma.purchaseOrder.groupBy({
        by: ['vendorId'],
        where: purchaseOrderWhere,
        _count: { _all: true },
        _sum: { totalCost: true },
        orderBy: { _sum: { totalCost: 'desc' } },
        take: 10,
      }),
    ]);

    const topBookIds = orderBookRows.map((row) => row.bookId);
    const topBooks = topBookIds.length
      ? await this.prisma.book.findMany({
          where: { id: { in: topBookIds } },
          select: { id: true, title: true, author: true },
        })
      : [];
    const bookMap = new Map(topBooks.map((book) => [book.id, book]));

    const topVendorIds = purchaseOrderVendorRows.map((row) => row.vendorId);
    const vendors = topVendorIds.length
      ? await this.prisma.vendor.findMany({
          where: { id: { in: topVendorIds } },
          select: { id: true, name: true, code: true },
        })
      : [];
    const vendorMap = new Map(vendors.map((vendor) => [vendor.id, vendor]));

    return {
      filters: {
        fromDate: filters?.fromDate ?? null,
        toDate: filters?.toDate ?? null,
      },
      sales: {
        orderCount: orderAggregate._count.id ?? 0,
        subtotal: Number(orderAggregate._sum.subtotalPrice ?? 0),
        discount: Number(orderAggregate._sum.discountAmount ?? 0),
        revenue: Number(orderAggregate._sum.totalPrice ?? 0),
        byStatus: orderStatusRows.map((row) => ({
          status: row.status,
          count: row._count.id ?? 0,
        })),
        topBooks: orderBookRows.map((row) => ({
          bookId: row.bookId,
          title: bookMap.get(row.bookId)?.title ?? 'Unknown book',
          author: bookMap.get(row.bookId)?.author ?? '',
          soldQty: row._sum.quantity ?? 0,
          grossSales: Number(row._sum.price ?? 0),
        })),
      },
      procurement: {
        purchaseOrderCount,
        totalCost: Number(purchaseOrderAggregate._sum.totalCost ?? 0),
        topVendors: purchaseOrderVendorRows.map((row) => ({
          vendorId: row.vendorId,
          vendorName: vendorMap.get(row.vendorId)?.name ?? 'Unknown vendor',
          vendorCode: vendorMap.get(row.vendorId)?.code ?? '',
          orderCount: row._count._all ?? 0,
          totalCost: Number(row._sum.totalCost ?? 0),
        })),
      },
    };
  }

  async getRevenueShareSimulation(
    actorUserId: string,
    params: {
      vendorId: string;
      sharePercent: number;
      fromDate?: Date;
      toDate?: Date;
    },
  ) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.reports.view',
    );

    const sharePercent = Number(params.sharePercent);
    if (
      !Number.isFinite(sharePercent) ||
      sharePercent <= 0 ||
      sharePercent >= 100
    ) {
      throw new BadRequestException('sharePercent must be between 0 and 100.');
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: params.vendorId },
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
        deletedAt: true,
      },
    });
    if (!vendor || vendor.deletedAt) {
      throw new NotFoundException('Vendor not found.');
    }

    const orderCreatedAt = this.buildRangeWhere(params.fromDate, params.toDate);

    const sourcedBooks = await this.prisma.purchaseOrderItem.findMany({
      where: {
        purchaseOrder: {
          vendorId: params.vendorId,
        },
      },
      select: { bookId: true },
      distinct: ['bookId'],
    });
    const sourcedBookIds = sourcedBooks.map((row) => row.bookId);

    if (sourcedBookIds.length === 0) {
      return {
        vendor,
        sharePercent,
        dateRange: {
          fromDate: params.fromDate ?? null,
          toDate: params.toDate ?? null,
        },
        totals: {
          grossSales: 0,
          vendorShareAmount: 0,
          storeShareAmount: 0,
          soldUnits: 0,
          soldTitles: 0,
        },
        byBook: [],
      };
    }

    const soldItems = await this.prisma.orderItem.findMany({
      where: {
        bookId: { in: sourcedBookIds },
        order: {
          status: {
            not: OrderStatus.CANCELLED,
          },
          ...(orderCreatedAt ? { createdAt: orderCreatedAt } : {}),
        },
      },
      select: {
        bookId: true,
        quantity: true,
        price: true,
        book: {
          select: {
            id: true,
            title: true,
            author: true,
          },
        },
      },
    });

    const byBookMap = new Map<
      string,
      {
        bookId: string;
        title: string;
        author: string;
        soldUnits: number;
        grossSales: number;
      }
    >();

    let grossSales = 0;
    let soldUnits = 0;
    for (const item of soldItems) {
      const lineGross = Number(item.price) * item.quantity;
      grossSales += lineGross;
      soldUnits += item.quantity;

      const current = byBookMap.get(item.bookId) ?? {
        bookId: item.bookId,
        title: item.book.title,
        author: item.book.author,
        soldUnits: 0,
        grossSales: 0,
      };
      current.soldUnits += item.quantity;
      current.grossSales += lineGross;
      byBookMap.set(item.bookId, current);
    }

    const vendorShareAmount = Number(
      ((grossSales * sharePercent) / 100).toFixed(2),
    );
    const storeShareAmount = Number(
      (grossSales - vendorShareAmount).toFixed(2),
    );

    return {
      vendor,
      sharePercent,
      dateRange: {
        fromDate: params.fromDate ?? null,
        toDate: params.toDate ?? null,
      },
      totals: {
        grossSales: Number(grossSales.toFixed(2)),
        vendorShareAmount,
        storeShareAmount,
        soldUnits,
        soldTitles: byBookMap.size,
      },
      byBook: Array.from(byBookMap.values())
        .map((item) => ({
          ...item,
          grossSales: Number(item.grossSales.toFixed(2)),
          vendorShareAmount: Number(
            ((item.grossSales * sharePercent) / 100).toFixed(2),
          ),
          storeShareAmount: Number(
            (item.grossSales - (item.grossSales * sharePercent) / 100).toFixed(
              2,
            ),
          ),
        }))
        .sort((a, b) => b.grossSales - a.grossSales),
    };
  }

  async createPurchaseOrder(dto: CreatePurchaseOrderDto, actorUserId: string) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_order.create',
    );
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_order.view',
    );

    const request = await this.prisma.purchaseRequest.findUnique({
      where: { id: dto.purchaseRequestId },
      select: {
        id: true,
        status: true,
        purchaseOrderId: true,
        warehouseId: true,
        bookId: true,
        quantity: true,
        approvedQuantity: true,
        approvedCost: true,
        estimatedCost: true,
      },
    });
    if (!request) {
      throw new NotFoundException('Purchase request not found');
    }
    if (!this.internal.ensureApprovedRequestStatus(request.status)) {
      throw new BadRequestException(
        'Purchase order can only be created from approved request.',
      );
    }
    if (request.purchaseOrderId) {
      throw new BadRequestException(
        'Purchase request already has a linked purchase order.',
      );
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: dto.vendorId },
      select: { id: true, isActive: true, deletedAt: true },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    if (vendor.deletedAt) {
      throw new BadRequestException('Vendor is in bin. Restore it first.');
    }
    if (!vendor.isActive) {
      throw new BadRequestException('Vendor is inactive.');
    }

    const orderedQuantity = request.approvedQuantity ?? request.quantity;
    const unitCost =
      dto.unitCost ??
      Number(request.approvedCost ?? request.estimatedCost ?? 0);
    const totalCost = unitCost > 0 ? unitCost * orderedQuantity : undefined;

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.create({
        data: {
          vendorId: dto.vendorId,
          warehouseId: request.warehouseId,
          status: PurchaseOrderStatus.SENT,
          createdByUserId: actorUserId,
          approvedByUserId: actorUserId,
          expectedAt: dto.expectedAt ? new Date(dto.expectedAt) : undefined,
          sentAt: new Date(),
          notes: dto.notes,
          totalCost,
          items: {
            create: {
              bookId: request.bookId,
              orderedQuantity,
              unitCost: unitCost > 0 ? unitCost : null,
            },
          },
        },
        include: PURCHASE_ORDER_INCLUDE,
      });

      await tx.purchaseRequest.update({
        where: { id: request.id },
        data: { purchaseOrderId: order.id },
      });

      return order;
    });
  }

  async createPurchaseOrdersBatch(
    dto: CreatePurchaseOrdersBatchDto,
    actorUserId: string,
  ) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_order.create',
    );
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_order.view',
    );

    const uniqueIds = Array.from(new Set(dto.purchaseRequestIds));
    if (uniqueIds.length === 0) {
      throw new BadRequestException(
        'At least one purchase request is required.',
      );
    }

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: dto.vendorId },
      select: { id: true, isActive: true, deletedAt: true },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    if (vendor.deletedAt) {
      throw new BadRequestException('Vendor is in bin. Restore it first.');
    }
    if (!vendor.isActive) {
      throw new BadRequestException('Vendor is inactive.');
    }

    const requests = await this.prisma.purchaseRequest.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        status: true,
        purchaseOrderId: true,
        warehouseId: true,
        bookId: true,
        quantity: true,
        approvedQuantity: true,
        approvedCost: true,
        estimatedCost: true,
      },
    });

    if (requests.length !== uniqueIds.length) {
      throw new NotFoundException(
        'One or more purchase requests were not found.',
      );
    }

    const invalid = requests.filter(
      (request) =>
        !this.internal.ensureApprovedRequestStatus(request.status) ||
        !!request.purchaseOrderId,
    );
    if (invalid.length > 0) {
      throw new BadRequestException(
        'All requests must be APPROVED and not already linked to a purchase order.',
      );
    }

    const createdOrders = await this.prisma.$transaction(async (tx) => {
      const orders = [];

      for (const request of requests) {
        const orderedQuantity = request.approvedQuantity ?? request.quantity;
        const unitCost =
          dto.unitCost ??
          Number(request.approvedCost ?? request.estimatedCost ?? 0);
        const totalCost = unitCost > 0 ? unitCost * orderedQuantity : undefined;

        const order = await tx.purchaseOrder.create({
          data: {
            vendorId: dto.vendorId,
            warehouseId: request.warehouseId,
            status: PurchaseOrderStatus.SENT,
            createdByUserId: actorUserId,
            approvedByUserId: actorUserId,
            expectedAt: dto.expectedAt ? new Date(dto.expectedAt) : undefined,
            sentAt: new Date(),
            notes: dto.notes,
            totalCost,
            items: {
              create: {
                bookId: request.bookId,
                orderedQuantity,
                unitCost: unitCost > 0 ? unitCost : null,
              },
            },
          },
          include: PURCHASE_ORDER_INCLUDE,
        });

        await tx.purchaseRequest.update({
          where: { id: request.id },
          data: { purchaseOrderId: order.id },
        });

        orders.push(order);
      }

      return orders;
    });

    return {
      createdCount: createdOrders.length,
      orders: createdOrders,
    };
  }

  async updatePurchaseOrder(
    purchaseOrderId: string,
    dto: UpdatePurchaseOrderDto,
    actorUserId: string,
  ) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_order.create',
    );
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_order.view',
    );

    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        items: {
          select: {
            id: true,
            orderedQuantity: true,
            unitCost: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Purchase order not found');
    }
    if (order.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft purchase orders can be edited.',
      );
    }

    const existingItemIds = new Set(order.items.map((item) => item.id));
    if (dto.items?.some((item) => !existingItemIds.has(item.id))) {
      throw new BadRequestException(
        'All updated items must belong to the target purchase order.',
      );
    }

    const nextItems =
      dto.items?.map((item) => ({
        orderedQuantity: item.orderedQuantity,
        unitCost: item.unitCost ?? null,
      })) ??
      order.items.map((item) => ({
        orderedQuantity: item.orderedQuantity,
        unitCost: item.unitCost,
      }));

    const totalCost = nextItems.reduce((sum, item) => {
      if (!item.unitCost) return sum;
      return sum + Number(item.unitCost) * item.orderedQuantity;
    }, 0);

    return this.prisma.$transaction(async (tx) => {
      if (dto.items?.length) {
        await Promise.all(
          dto.items.map((item) =>
            tx.purchaseOrderItem.update({
              where: { id: item.id },
              data: {
                orderedQuantity: item.orderedQuantity,
                unitCost: item.unitCost ?? null,
              },
            }),
          ),
        );
      }

      return tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: {
          expectedAt: dto.expectedAt ? new Date(dto.expectedAt) : undefined,
          notes: dto.notes,
          totalCost: totalCost > 0 ? totalCost : null,
        },
        include: PURCHASE_ORDER_INCLUDE,
      });
    });
  }

  async reorderPurchaseOrder(purchaseOrderId: string, actorUserId: string) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_order.create',
    );
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_order.view',
    );

    const sourceOrder = await this.prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        vendor: {
          select: {
            id: true,
            code: true,
            isActive: true,
            deletedAt: true,
          },
        },
        items: {
          select: {
            bookId: true,
            orderedQuantity: true,
            unitCost: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!sourceOrder) {
      throw new NotFoundException('Purchase order not found');
    }
    if (sourceOrder.vendor.deletedAt) {
      throw new BadRequestException('Vendor is in bin. Restore it first.');
    }
    if (!sourceOrder.vendor.isActive) {
      throw new BadRequestException('Vendor is inactive.');
    }
    if (sourceOrder.items.length === 0) {
      throw new BadRequestException('Purchase order has no items to reorder.');
    }

    const totalCost = sourceOrder.items.reduce((sum, item) => {
      if (!item.unitCost) return sum;
      return sum + Number(item.unitCost) * item.orderedQuantity;
    }, 0);

    return this.prisma.purchaseOrder.create({
      data: {
        vendorId: sourceOrder.vendorId,
        warehouseId: sourceOrder.warehouseId,
        status: PurchaseOrderStatus.DRAFT,
        createdByUserId: actorUserId,
        notes: `Reordered from previous purchase order ${sourceOrder.id} (${sourceOrder.vendor.code}).`,
        totalCost: totalCost > 0 ? totalCost : null,
        items: {
          create: sourceOrder.items.map((item) => ({
            bookId: item.bookId,
            orderedQuantity: item.orderedQuantity,
            unitCost: item.unitCost,
          })),
        },
      },
      include: PURCHASE_ORDER_INCLUDE,
    });
  }

  async receivePurchaseOrder(
    purchaseOrderId: string,
    dto: ReceivePurchaseOrderDto,
    actorUserId: string,
  ) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_order.receive',
    );

    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        items: true,
        request: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });
    if (!order) {
      throw new NotFoundException('Purchase order not found');
    }
    if (
      order.status === PurchaseOrderStatus.CLOSED ||
      order.status === PurchaseOrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Purchase order is closed and cannot receive stock.',
      );
    }
    if (order.items.length === 0) {
      throw new BadRequestException('Purchase order has no items.');
    }

    const receiveMap = new Map<string, number>();
    const manualRetailPriceMap = new Map<string, number>();
    if (dto.items && dto.items.length > 0) {
      for (const item of dto.items) {
        receiveMap.set(item.itemId, item.receivedQuantity);
        if (item.finalRetailPrice !== undefined) {
          manualRetailPriceMap.set(item.itemId, Number(item.finalRetailPrice));
        }
      }
    }

    const pricingSettings = await this.pricingSettingsService.getSettings();
    const autoPricingUpdates = new Map<string, number>();

    await this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const remaining = item.orderedQuantity - item.receivedQuantity;
        if (remaining <= 0) {
          continue;
        }

        const incoming =
          receiveMap.size > 0 ? (receiveMap.get(item.id) ?? 0) : remaining;

        if (incoming <= 0) {
          continue;
        }
        if (incoming > remaining) {
          throw new BadRequestException(
            'Received quantity exceeds ordered quantity.',
          );
        }

        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: {
            receivedQuantity: item.receivedQuantity + incoming,
          },
        });

        const existingStock = await tx.warehouseStock.findUnique({
          where: {
            warehouseId_bookId: {
              warehouseId: order.warehouseId,
              bookId: item.bookId,
            },
          },
        });

        if (existingStock) {
          await tx.warehouseStock.update({
            where: {
              warehouseId_bookId: {
                warehouseId: order.warehouseId,
                bookId: item.bookId,
              },
            },
            data: {
              stock: existingStock.stock + incoming,
            },
          });
        } else {
          await tx.warehouseStock.create({
            data: {
              warehouseId: order.warehouseId,
              bookId: item.bookId,
              stock: incoming,
              lowStockThreshold: 5,
            },
          });
        }

        await receiveInventoryLot(tx, {
          warehouseId: order.warehouseId,
          bookId: item.bookId,
          quantity: incoming,
          ownershipType: InventoryOwnershipType.OWNED,
          sourceType: InventoryLotSourceType.PURCHASE_ORDER,
          purchaseOrderItemId: item.id,
          vendorId: order.vendorId,
          unitCost: item.unitCost !== null ? Number(item.unitCost) : null,
          note: `Received against purchase order ${order.id}.`,
        });

        const manualRetailPrice = manualRetailPriceMap.get(item.id);
        if (manualRetailPrice !== undefined) {
          autoPricingUpdates.set(
            item.bookId,
            Number(Math.max(0, manualRetailPrice).toFixed(2)),
          );
        } else if (
          pricingSettings.applyPricingOnReceive &&
          item.unitCost !== null &&
          Number(item.unitCost) > 0
        ) {
          const computedPrice =
            this.pricingSettingsService.computeRetailPriceFromVendorCost(
              Number(item.unitCost),
              pricingSettings,
            );
          autoPricingUpdates.set(item.bookId, computedPrice);
        }
      }

      const freshItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: order.id },
      });
      const fullyReceived = freshItems.every(
        (item) => item.receivedQuantity >= item.orderedQuantity,
      );

      const nextStatus = fullyReceived
        ? (dto.closeWhenFullyReceived ?? true)
          ? PurchaseOrderStatus.CLOSED
          : PurchaseOrderStatus.RECEIVED
        : PurchaseOrderStatus.PARTIALLY_RECEIVED;

      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: {
          status: nextStatus,
          receivedAt: fullyReceived ? new Date() : null,
          notes: dto.note
            ? `${order.notes ? `${order.notes}\n` : ''}${dto.note}`
            : order.notes,
        },
      });

      if (
        fullyReceived &&
        order.request &&
        order.request.status === PurchaseRequestStatus.APPROVED
      ) {
        await tx.purchaseRequest.update({
          where: { id: order.request.id },
          data: {
            status: PurchaseRequestStatus.COMPLETED,
            completedAt: new Date(),
          },
        });
      }

      if (autoPricingUpdates.size > 0) {
        for (const [bookId, newPrice] of autoPricingUpdates.entries()) {
          await tx.book.update({
            where: { id: bookId },
            data: { price: newPrice },
          });
        }
      }
    });

    for (const item of order.items) {
      await this.internal.syncBookTotalStock(item.bookId);
      await this.internal.refreshLowStockAlert(order.warehouseId, item.bookId);
    }

    return this.prisma.purchaseOrder.findUnique({
      where: { id: order.id },
      include: PURCHASE_ORDER_INCLUDE,
    });
  }

  async createPurchaseRequest(
    dto: CreatePurchaseRequestDto,
    actorUserId: string,
  ) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_request.create',
    );
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_request.view',
    );
    await this.internal.ensureWarehouse(dto.warehouseId);
    await this.internal.ensureBook(dto.bookId);

    return this.prisma.purchaseRequest.create({
      data: {
        bookId: dto.bookId,
        warehouseId: dto.warehouseId,
        requestedByUserId: actorUserId,
        quantity: dto.quantity,
        estimatedCost: dto.estimatedCost,
        reviewNote: dto.reviewNote,
        status:
          dto.submitForApproval === false
            ? PurchaseRequestStatus.DRAFT
            : PurchaseRequestStatus.PENDING_APPROVAL,
      },
      include: PURCHASE_REQUEST_INCLUDE,
    });
  }

  async submitPurchaseRequest(requestId: string, actorUserId: string) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_request.create',
    );

    const request = await this.prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      select: { id: true, requestedByUserId: true, status: true },
    });
    if (!request) {
      throw new NotFoundException('Purchase request not found');
    }
    if (request.requestedByUserId !== actorUserId) {
      throw new ForbiddenException(
        'You can only submit your own purchase requests.',
      );
    }
    if (request.status !== PurchaseRequestStatus.DRAFT) {
      throw new BadRequestException('Only draft requests can be submitted.');
    }

    return this.prisma.purchaseRequest.update({
      where: { id: requestId },
      data: { status: PurchaseRequestStatus.PENDING_APPROVAL },
    });
  }

  async reviewPurchaseRequest(
    requestId: string,
    dto: ReviewPurchaseRequestDto,
    actorUserId: string,
  ) {
    if (dto.action === PurchaseReviewAction.APPROVE) {
      await assertUserPermission(
        this.prisma,
        actorUserId,
        'finance.purchase_request.approve',
      );
    } else {
      await assertUserPermission(
        this.prisma,
        actorUserId,
        'finance.purchase_request.reject',
      );
    }

    const request = await this.prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      select: { id: true, status: true, quantity: true, estimatedCost: true },
    });
    if (!request) {
      throw new NotFoundException('Purchase request not found');
    }
    if (request.status !== PurchaseRequestStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only pending requests can be reviewed.');
    }

    return this.prisma.purchaseRequest.update({
      where: { id: requestId },
      data: {
        status:
          dto.action === PurchaseReviewAction.APPROVE
            ? PurchaseRequestStatus.APPROVED
            : PurchaseRequestStatus.REJECTED,
        approvedQuantity:
          dto.action === PurchaseReviewAction.APPROVE
            ? (dto.approvedQuantity ?? request.quantity)
            : null,
        approvedCost:
          dto.action === PurchaseReviewAction.APPROVE
            ? (dto.approvedCost ?? request.estimatedCost ?? null)
            : null,
        reviewNote: dto.reviewNote,
        approvedByUserId: actorUserId,
        approvedAt: new Date(),
      },
      include: PURCHASE_REQUEST_INCLUDE,
    });
  }

  async completePurchaseRequest(requestId: string, actorUserId: string) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'warehouse.purchase_request.complete',
    );

    const request = await this.prisma.purchaseRequest.findUnique({
      where: { id: requestId },
      select: { id: true, status: true, requestedByUserId: true },
    });
    if (!request) {
      throw new NotFoundException('Purchase request not found');
    }
    if (request.status !== PurchaseRequestStatus.APPROVED) {
      throw new BadRequestException('Only approved requests can be completed.');
    }

    return this.prisma.purchaseRequest.update({
      where: { id: requestId },
      data: {
        status: PurchaseRequestStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: PURCHASE_REQUEST_INCLUDE,
    });
  }
}
