import { BadRequestException, Injectable } from '@nestjs/common';
import {
  InventoryLotSourceType,
  InventoryOwnershipType,
  WarehouseAlertStatus,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { assertUserPermission } from '../auth/permission-resolution';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { SetWarehouseStockDto } from './dto/set-warehouse-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { WarehousesInternalService } from './warehouses-internal.service';
import {
  allocateInventoryLots,
  receiveInventoryLot,
  transferInventoryLots,
} from '../inventory/inventory-lot.helpers';

@Injectable()
export class WarehousesStockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly internal: WarehousesInternalService,
  ) {}

  async listWarehouses() {
    await this.internal.reconcileAllBookStocks();

    return this.prisma.warehouse.findMany({
      include: {
        _count: {
          select: {
            stocks: true,
            alerts: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  async getBookStockPresence() {
    const [totalWarehouses, grouped] = await Promise.all([
      this.prisma.warehouse.count({ where: { isActive: true } }),
      this.prisma.warehouseStock.groupBy({
        by: ['bookId'],
        _count: { warehouseId: true },
      }),
    ]);

    return {
      totalWarehouses,
      byBook: grouped.map((row) => ({
        bookId: row.bookId,
        warehouseCount: row._count.warehouseId ?? 0,
      })),
    };
  }

  async createWarehouse(dto: CreateWarehouseDto) {
    return this.prisma.warehouse.create({
      data: {
        name: dto.name,
        code: dto.code,
        city: dto.city,
        state: dto.state,
        address: dto.address,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateWarehouse(warehouseId: string, dto: UpdateWarehouseDto) {
    await this.internal.ensureWarehouse(warehouseId);

    return this.prisma.warehouse.update({
      where: { id: warehouseId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.city !== undefined ? { city: dto.city } : {}),
        ...(dto.state !== undefined ? { state: dto.state } : {}),
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async deleteWarehouse(warehouseId: string) {
    await this.internal.ensureWarehouse(warehouseId);

    const stockSummary = await this.prisma.warehouseStock.aggregate({
      where: { warehouseId },
      _sum: { stock: true },
    });

    if ((stockSummary._sum.stock ?? 0) > 0) {
      throw new BadRequestException(
        'Warehouse still has stock. Transfer or clear stock before deleting.',
      );
    }

    return this.prisma.warehouse.delete({ where: { id: warehouseId } });
  }

  async getWarehouseStocks(warehouseId: string) {
    await this.internal.ensureWarehouse(warehouseId);

    return this.prisma.warehouseStock.findMany({
      where: { warehouseId },
      include: { book: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async listInventoryLots(filters?: {
    bookId?: string;
    warehouseId?: string;
    storeId?: string;
    ownershipType?: 'OWNED' | 'CONSIGNMENT';
    limit?: number;
  }) {
    const take = Number.isFinite(filters?.limit)
      ? Math.min(Math.max(Number(filters?.limit), 1), 200)
      : 100;

    return this.prisma.inventoryLot.findMany({
      where: {
        ...(filters?.bookId ? { bookId: filters.bookId } : {}),
        ...(filters?.warehouseId ? { warehouseId: filters.warehouseId } : {}),
        ...(filters?.storeId ? { storeId: filters.storeId } : {}),
        ...(filters?.ownershipType
          ? { ownershipType: filters.ownershipType }
          : {}),
      },
      include: {
        book: {
          select: { id: true, title: true, author: true, isbn: true },
        },
        warehouse: {
          select: { id: true, code: true, name: true },
        },
        store: {
          select: { id: true, code: true, name: true },
        },
        vendor: {
          select: { id: true, code: true, name: true },
        },
        partnerDeal: {
          select: { id: true, partnerName: true, status: true },
        },
        sourceLot: {
          select: {
            id: true,
            locationType: true,
            warehouseId: true,
            storeId: true,
          },
        },
      },
      orderBy: [{ receivedAt: 'desc' }, { createdAt: 'desc' }],
      take,
    });
  }

  async setWarehouseStock(
    warehouseId: string,
    bookId: string,
    dto: SetWarehouseStockDto,
    actorUserId?: string,
  ) {
    if (actorUserId) {
      await assertUserPermission(
        this.prisma,
        actorUserId,
        'warehouse.stock.update',
      );
    }

    await this.internal.ensureWarehouse(warehouseId);
    await this.internal.ensureBook(bookId);

    const row = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.warehouseStock.findUnique({
        where: { warehouseId_bookId: { warehouseId, bookId } },
      });
      const currentStock = existing?.stock ?? 0;
      const delta = dto.stock - currentStock;

      const updatedRow = await tx.warehouseStock.upsert({
        where: { warehouseId_bookId: { warehouseId, bookId } },
        update: {
          stock: dto.stock,
          ...(dto.lowStockThreshold !== undefined
            ? { lowStockThreshold: dto.lowStockThreshold }
            : {}),
        },
        create: {
          warehouseId,
          bookId,
          stock: dto.stock,
          lowStockThreshold: dto.lowStockThreshold ?? 5,
        },
        include: { book: true, warehouse: true },
      });

      if (delta > 0) {
        await receiveInventoryLot(tx, {
          warehouseId,
          bookId,
          quantity: delta,
          ownershipType: InventoryOwnershipType.OWNED,
          sourceType: InventoryLotSourceType.STOCK_ADJUSTMENT,
          note: 'Manual warehouse stock adjustment.',
        });
      } else if (delta < 0) {
        await allocateInventoryLots(tx, {
          warehouseId,
          bookId,
          quantity: Math.abs(delta),
        });
      }

      return updatedRow;
    });

    const totalBookStock = await this.internal.syncBookTotalStock(bookId);
    await this.internal.refreshLowStockAlert(warehouseId, bookId);

    return {
      ...row,
      totalBookStock,
    };
  }

  async transferStock(dto: TransferStockDto, actorUserId?: string) {
    if (actorUserId) {
      await assertUserPermission(
        this.prisma,
        actorUserId,
        'warehouse.transfer',
      );
    }

    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException(
        'Source and destination warehouse must be different',
      );
    }

    await this.internal.ensureWarehouse(dto.fromWarehouseId);
    await this.internal.ensureWarehouse(dto.toWarehouseId);
    await this.internal.ensureBook(dto.bookId);

    const transfer = await this.prisma.$transaction(async (tx) => {
      const source = await tx.warehouseStock.findUnique({
        where: {
          warehouseId_bookId: {
            warehouseId: dto.fromWarehouseId,
            bookId: dto.bookId,
          },
        },
      });

      if (!source || source.stock < dto.quantity) {
        throw new BadRequestException('Insufficient stock in source warehouse');
      }

      const target = await tx.warehouseStock.findUnique({
        where: {
          warehouseId_bookId: {
            warehouseId: dto.toWarehouseId,
            bookId: dto.bookId,
          },
        },
      });

      await tx.warehouseStock.update({
        where: {
          warehouseId_bookId: {
            warehouseId: dto.fromWarehouseId,
            bookId: dto.bookId,
          },
        },
        data: {
          stock: source.stock - dto.quantity,
        },
      });

      if (target) {
        await tx.warehouseStock.update({
          where: {
            warehouseId_bookId: {
              warehouseId: dto.toWarehouseId,
              bookId: dto.bookId,
            },
          },
          data: {
            stock: target.stock + dto.quantity,
          },
        });
      } else {
        await tx.warehouseStock.create({
          data: {
            warehouseId: dto.toWarehouseId,
            bookId: dto.bookId,
            stock: dto.quantity,
            lowStockThreshold: 5,
          },
        });
      }

      await transferInventoryLots(tx, {
        bookId: dto.bookId,
        quantity: dto.quantity,
        from: { warehouseId: dto.fromWarehouseId },
        to: { warehouseId: dto.toWarehouseId },
        note: dto.note,
        transferSourceType: InventoryLotSourceType.WAREHOUSE_TRANSFER,
      });

      return tx.warehouseTransfer.create({
        data: {
          bookId: dto.bookId,
          fromWarehouseId: dto.fromWarehouseId,
          toWarehouseId: dto.toWarehouseId,
          quantity: dto.quantity,
          note: dto.note,
          createdByUserId: actorUserId,
        },
        include: {
          book: true,
          fromWarehouse: true,
          toWarehouse: true,
        },
      });
    });

    await this.internal.syncBookTotalStock(dto.bookId);
    await this.internal.refreshLowStockAlert(dto.fromWarehouseId, dto.bookId);
    await this.internal.refreshLowStockAlert(dto.toWarehouseId, dto.bookId);

    return transfer;
  }

  async listLowStockAlerts(
    status: WarehouseAlertStatus = WarehouseAlertStatus.OPEN,
  ) {
    return this.prisma.warehouseAlert.findMany({
      where: { status },
      include: {
        warehouse: true,
        book: true,
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 100,
    });
  }

  async listTransfers(limit = 50) {
    return this.prisma.warehouseTransfer.findMany({
      include: {
        book: true,
        fromWarehouse: true,
        toWarehouse: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
