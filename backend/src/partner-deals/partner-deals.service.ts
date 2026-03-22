import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryLotSourceType,
  InventoryOwnershipType,
  OrderStatus,
  PartnerDealStatus,
  PartnerSettlementStatus,
} from '@prisma/client';
import { assertUserPermission } from '../auth/permission-resolution';
import { PrismaService } from '../database/prisma.service';
import { CreatePartnerDealDto } from './dto/create-partner-deal.dto';
import { CreatePartnerConsignmentReceiptDto } from './dto/create-partner-consignment-receipt.dto';
import { CreatePartnerSettlementDto } from './dto/create-partner-settlement.dto';
import { PreviewPartnerSettlementDto } from './dto/preview-partner-settlement.dto';
import { UpdatePartnerDealDto } from './dto/update-partner-deal.dto';
import { receiveInventoryLot } from '../inventory/inventory-lot.helpers';

@Injectable()
export class PartnerDealsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureAccess(actorUserId: string) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.reports.view',
    );
  }

  async list(
    actorUserId: string,
    query?: { status?: PartnerDealStatus; q?: string },
  ) {
    await this.ensureAccess(actorUserId);

    const where = {
      ...(query?.status ? { status: query.status } : {}),
      ...(query?.q
        ? {
            OR: [
              {
                partnerName: {
                  contains: query.q,
                  mode: 'insensitive' as const,
                },
              },
              {
                partnerCompany: {
                  contains: query.q,
                  mode: 'insensitive' as const,
                },
              },
              {
                termsNote: { contains: query.q, mode: 'insensitive' as const },
              },
            ],
          }
        : {}),
    };

    const deals = await this.prisma.partnerConsignmentDeal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        book: { select: { id: true, title: true, author: true, isbn: true } },
        lead: { select: { id: true, title: true, author: true, status: true } },
        settlements: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    return {
      total: deals.length,
      items: deals,
    };
  }

  async create(actorUserId: string, dto: CreatePartnerDealDto) {
    await this.ensureAccess(actorUserId);

    if (
      dto.effectiveTo &&
      dto.effectiveFrom &&
      dto.effectiveTo < dto.effectiveFrom
    ) {
      throw new BadRequestException(
        'effectiveTo cannot be earlier than effectiveFrom',
      );
    }

    if (dto.leadId) {
      const lead = await this.prisma.bookLead.findUnique({
        where: { id: dto.leadId },
        select: { id: true },
      });
      if (!lead) throw new NotFoundException('Linked lead not found');
    }
    if (dto.bookId) {
      const book = await this.prisma.book.findUnique({
        where: { id: dto.bookId },
        select: { id: true },
      });
      if (!book) throw new NotFoundException('Linked book not found');
    }

    return this.prisma.partnerConsignmentDeal.create({
      data: {
        partnerName: dto.partnerName.trim(),
        partnerCompany: dto.partnerCompany?.trim() || null,
        partnerEmail: dto.partnerEmail?.trim() || null,
        leadId: dto.leadId,
        bookId: dto.bookId,
        status: dto.status ?? PartnerDealStatus.DRAFT,
        revenueSharePct: dto.revenueSharePct,
        effectiveFrom: dto.effectiveFrom ?? new Date(),
        effectiveTo: dto.effectiveTo ?? null,
        termsNote: dto.termsNote?.trim() || null,
        createdByUserId: actorUserId,
      },
      include: {
        book: { select: { id: true, title: true, author: true, isbn: true } },
        lead: { select: { id: true, title: true, author: true, status: true } },
      },
    });
  }

  async receiveConsignmentStock(
    actorUserId: string,
    dealId: string,
    dto: CreatePartnerConsignmentReceiptDto,
  ) {
    await this.ensureAccess(actorUserId);

    const deal = await this.prisma.partnerConsignmentDeal.findUnique({
      where: { id: dealId },
      select: {
        id: true,
        status: true,
        bookId: true,
        revenueSharePct: true,
      },
    });
    if (!deal) throw new NotFoundException('Partner deal not found');
    if (!deal.bookId) {
      throw new BadRequestException(
        'Partner deal must be linked to a book before receiving stock.',
      );
    }
    if (deal.status !== PartnerDealStatus.ACTIVE) {
      throw new BadRequestException(
        'Only active partner deals can receive consignment stock.',
      );
    }

    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: dto.warehouseId },
      select: { id: true, isActive: true },
    });
    if (!warehouse || !warehouse.isActive) {
      throw new BadRequestException('Active warehouse not found.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.warehouseStock.upsert({
        where: {
          warehouseId_bookId: {
            warehouseId: dto.warehouseId,
            bookId: deal.bookId!,
          },
        },
        update: {
          stock: {
            increment: dto.quantity,
          },
        },
        create: {
          warehouseId: dto.warehouseId,
          bookId: deal.bookId!,
          stock: dto.quantity,
          lowStockThreshold: 5,
        },
      });

      await receiveInventoryLot(tx, {
        warehouseId: dto.warehouseId,
        bookId: deal.bookId!,
        quantity: dto.quantity,
        ownershipType: InventoryOwnershipType.CONSIGNMENT,
        sourceType: InventoryLotSourceType.PARTNER_CONSIGNMENT,
        partnerDealId: deal.id,
        revenueSharePct: Number(deal.revenueSharePct),
        note: dto.note ?? 'Partner consignment receipt.',
      });
    });

    const aggregate = await this.prisma.warehouseStock.aggregate({
      where: { bookId: deal.bookId },
      _sum: { stock: true },
    });
    await this.prisma.book.update({
      where: { id: deal.bookId },
      data: {
        stock: aggregate._sum.stock ?? 0,
      },
    });

    return {
      dealId: deal.id,
      bookId: deal.bookId,
      warehouseId: dto.warehouseId,
      quantityReceived: dto.quantity,
      ownershipType: InventoryOwnershipType.CONSIGNMENT,
    };
  }

  async update(actorUserId: string, id: string, dto: UpdatePartnerDealDto) {
    await this.ensureAccess(actorUserId);

    const existing = await this.prisma.partnerConsignmentDeal.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Partner deal not found');

    const effectiveFrom = dto.effectiveFrom ?? existing.effectiveFrom;
    const effectiveTo = dto.effectiveTo ?? existing.effectiveTo;
    if (effectiveTo && effectiveTo < effectiveFrom) {
      throw new BadRequestException(
        'effectiveTo cannot be earlier than effectiveFrom',
      );
    }

    return this.prisma.partnerConsignmentDeal.update({
      where: { id },
      data: {
        ...(dto.partnerName !== undefined
          ? { partnerName: dto.partnerName.trim() }
          : {}),
        ...(dto.partnerCompany !== undefined
          ? { partnerCompany: dto.partnerCompany?.trim() || null }
          : {}),
        ...(dto.partnerEmail !== undefined
          ? { partnerEmail: dto.partnerEmail?.trim() || null }
          : {}),
        ...(dto.leadId !== undefined ? { leadId: dto.leadId || null } : {}),
        ...(dto.bookId !== undefined ? { bookId: dto.bookId || null } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.revenueSharePct !== undefined
          ? { revenueSharePct: dto.revenueSharePct }
          : {}),
        ...(dto.effectiveFrom !== undefined
          ? { effectiveFrom: dto.effectiveFrom }
          : {}),
        ...(dto.effectiveTo !== undefined
          ? { effectiveTo: dto.effectiveTo || null }
          : {}),
        ...(dto.termsNote !== undefined
          ? { termsNote: dto.termsNote?.trim() || null }
          : {}),
      },
      include: {
        book: { select: { id: true, title: true, author: true, isbn: true } },
        lead: { select: { id: true, title: true, author: true, status: true } },
      },
    });
  }

  async listSettlements(actorUserId: string, dealId: string) {
    await this.ensureAccess(actorUserId);

    const deal = await this.prisma.partnerConsignmentDeal.findUnique({
      where: { id: dealId },
      select: { id: true },
    });
    if (!deal) throw new NotFoundException('Partner deal not found');

    return this.prisma.partnerSettlement.findMany({
      where: { dealId },
      orderBy: [{ periodStart: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async previewSettlement(
    actorUserId: string,
    dealId: string,
    query: PreviewPartnerSettlementDto,
  ) {
    await this.ensureAccess(actorUserId);

    const deal = await this.prisma.partnerConsignmentDeal.findUnique({
      where: { id: dealId },
      select: {
        id: true,
        bookId: true,
        revenueSharePct: true,
      },
    });
    if (!deal) throw new NotFoundException('Partner deal not found');
    if (!deal.bookId) {
      throw new BadRequestException(
        'Partner deal must be linked to a book before sales preview.',
      );
    }

    const periodStart = query.periodStart;
    const periodEnd = query.periodEnd;
    if (periodEnd < periodStart) {
      throw new BadRequestException(
        'periodEnd cannot be earlier than periodStart',
      );
    }

    const rows = await this.prisma.orderItem.findMany({
      where: {
        bookId: deal.bookId,
        order: {
          status: {
            in: [OrderStatus.CONFIRMED, OrderStatus.COMPLETED],
          },
          createdAt: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      },
      select: {
        orderId: true,
        quantity: true,
        price: true,
      },
    });

    const gross = rows.reduce(
      (sum, row) => sum + Number(row.price) * Number(row.quantity),
      0,
    );
    const quantitySold = rows.reduce(
      (sum, row) => sum + Number(row.quantity),
      0,
    );
    const orderCount = new Set(rows.map((row) => row.orderId)).size;
    const revenueSharePct = Number(deal.revenueSharePct);
    const partnerShareAmount = Number(
      ((gross * revenueSharePct) / 100).toFixed(2),
    );

    return {
      dealId,
      bookId: deal.bookId,
      periodStart,
      periodEnd,
      orderCount,
      quantitySold,
      grossSalesAmount: Number(gross.toFixed(2)),
      revenueSharePct,
      partnerShareAmount,
      calculationBasis: 'Order items with CONFIRMED or COMPLETED orders',
    };
  }

  async createSettlement(
    actorUserId: string,
    dealId: string,
    dto: CreatePartnerSettlementDto,
  ) {
    await this.ensureAccess(actorUserId);

    const deal = await this.prisma.partnerConsignmentDeal.findUnique({
      where: { id: dealId },
    });
    if (!deal) throw new NotFoundException('Partner deal not found');
    if (dto.periodEnd < dto.periodStart) {
      throw new BadRequestException(
        'periodEnd cannot be earlier than periodStart',
      );
    }

    const gross = Math.max(0, Number(dto.grossSalesAmount));
    const share = Number(
      ((gross * Number(deal.revenueSharePct)) / 100).toFixed(2),
    );

    return this.prisma.partnerSettlement.create({
      data: {
        dealId,
        periodStart: dto.periodStart,
        periodEnd: dto.periodEnd,
        grossSalesAmount: gross,
        partnerShareAmount: share,
        status: PartnerSettlementStatus.PENDING,
        note: dto.note?.trim() || null,
      },
    });
  }

  async markSettlementPaid(
    actorUserId: string,
    dealId: string,
    settlementId: string,
  ) {
    await this.ensureAccess(actorUserId);

    const settlement = await this.prisma.partnerSettlement.findFirst({
      where: {
        id: settlementId,
        dealId,
      },
    });
    if (!settlement) throw new NotFoundException('Settlement not found');

    if (settlement.status === PartnerSettlementStatus.PAID) {
      return settlement;
    }

    return this.prisma.partnerSettlement.update({
      where: { id: settlement.id },
      data: {
        status: PartnerSettlementStatus.PAID,
        paidAt: new Date(),
      },
    });
  }
}
