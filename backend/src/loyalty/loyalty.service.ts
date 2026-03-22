import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LoyaltyRewardType,
  PromotionDiscountType,
  ReadingStatus,
  type Prisma,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { assertUserPermission } from '../auth/permission-resolution';
import { CreateLoyaltyRewardDto } from './dto/create-loyalty-reward.dto';
import { UpdateLoyaltyRewardDto } from './dto/update-loyalty-reward.dto';
import { GrantStickersDto } from './dto/grant-stickers.dto';
import { GrantPromotionDto } from './dto/grant-promotion.dto';

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizePromoCode(codePrefix: string, suffix: string) {
    return `${codePrefix
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '')}-${suffix}`;
  }

  private async buildUniquePromoCode(prefix: string) {
    while (true) {
      const suffix = randomBytes(3).toString('hex').toUpperCase();
      const code = this.normalizePromoCode(prefix, suffix);
      const existing = await this.prisma.promotionCode.findUnique({
        where: { code },
        select: { id: true },
      });
      if (!existing) {
        return code;
      }
    }
  }

  private async ensureRewardPayload(
    dto: CreateLoyaltyRewardDto | UpdateLoyaltyRewardDto,
  ) {
    if (
      (dto.rewardType === LoyaltyRewardType.PERCENT_COUPON ||
        dto.rewardType === LoyaltyRewardType.FIXED_COUPON) &&
      (dto.discountValue === undefined || dto.discountValue <= 0)
    ) {
      throw new BadRequestException(
        'Coupon rewards require a positive discount value.',
      );
    }

    if (
      dto.rewardType === LoyaltyRewardType.PERCENT_COUPON &&
      dto.discountValue !== undefined &&
      dto.discountValue > 100
    ) {
      throw new BadRequestException(
        'Percent coupon rewards cannot exceed 100%.',
      );
    }

    if (dto.rewardType === LoyaltyRewardType.FREE_EBOOK) {
      if (!dto.rewardBookId) {
        throw new BadRequestException(
          'Free eBook rewards require a rewardBookId.',
        );
      }
      const book = await this.prisma.book.findUnique({
        where: { id: dto.rewardBookId },
        select: { id: true, isDigital: true, totalPages: true },
      });
      if (!book || !book.isDigital) {
        throw new BadRequestException(
          'Free eBook rewards must target a valid digital book.',
        );
      }
    }
  }

  async getMyDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        stickerBalance: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [history, rewards, redemptions, promotions] = await Promise.all([
      this.prisma.stickerLedger.findMany({
        where: { userId },
        include: {
          actorUser: {
            select: {
              id: true,
              name: true,
            },
          },
          order: {
            select: {
              id: true,
              totalPrice: true,
            },
          },
          redemption: {
            select: {
              id: true,
              reward: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.loyaltyReward.findMany({
        where: { isActive: true },
        include: {
          rewardBook: {
            select: {
              id: true,
              title: true,
              author: true,
              coverImage: true,
            },
          },
        },
        orderBy: [{ stickerCost: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.loyaltyRedemption.findMany({
        where: { userId },
        include: {
          reward: true,
          generatedPromo: true,
          grantedBook: {
            select: {
              id: true,
              title: true,
              author: true,
              coverImage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
      this.prisma.promotionCode.findMany({
        where: {
          assignedUserId: userId,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      user,
      history,
      rewards,
      redemptions,
      activePromotions: promotions,
      program: {
        earnRate: '1 point for every $10 in confirmed purchases',
      },
    };
  }

  async redeemReward(userId: string, rewardId: string) {
    const reward = await this.prisma.loyaltyReward.findUnique({
      where: { id: rewardId },
      include: {
        rewardBook: {
          select: {
            id: true,
            totalPages: true,
          },
        },
      },
    });

    if (!reward || !reward.isActive) {
      throw new NotFoundException('Reward not found');
    }

    if (
      reward.redemptionLimit !== null &&
      reward.redemptionLimit !== undefined &&
      reward.redeemedCount >= reward.redemptionLimit
    ) {
      throw new BadRequestException(
        'This reward has reached its redemption limit.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stickerBalance: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.stickerBalance < reward.stickerCost) {
      throw new BadRequestException('Not enough points to redeem this reward.');
    }

    return this.prisma.$transaction(async (tx) => {
      const redemption = await tx.loyaltyRedemption.create({
        data: {
          userId,
          rewardId,
          stickerCost: reward.stickerCost,
          ...(reward.rewardType === LoyaltyRewardType.FREE_EBOOK
            ? { grantedBookId: reward.rewardBookId ?? null }
            : {}),
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          stickerBalance: {
            decrement: reward.stickerCost,
          },
        },
      });

      await tx.stickerLedger.create({
        data: {
          userId,
          type: 'REWARD_REDEEM',
          delta: -reward.stickerCost,
          note: `Redeemed reward: ${reward.name}`,
          redemptionId: redemption.id,
        },
      });

      let promoId: string | null = null;

      if (
        reward.rewardType === LoyaltyRewardType.FREE_EBOOK &&
        reward.rewardBookId
      ) {
        await tx.userBookAccess.upsert({
          where: {
            userId_bookId: {
              userId,
              bookId: reward.rewardBookId,
            },
          },
          update: {},
          create: {
            userId,
            bookId: reward.rewardBookId,
          },
        });

        await tx.readingItem.upsert({
          where: {
            userId_bookId: {
              userId,
              bookId: reward.rewardBookId,
            },
          },
          update: {},
          create: {
            userId,
            bookId: reward.rewardBookId,
            status: ReadingStatus.TO_READ,
            currentPage: 0,
            totalPages: reward.rewardBook?.totalPages ?? null,
          },
        });
      } else {
        const code = await this.buildUniquePromoCode('STICKER');
        const promo = await tx.promotionCode.create({
          data: {
            code,
            assignedUserId: userId,
            name: reward.name,
            description:
              reward.description ??
              'Single-use reward created from point redemption.',
            discountType:
              reward.rewardType === LoyaltyRewardType.PERCENT_COUPON
                ? PromotionDiscountType.PERCENT
                : PromotionDiscountType.FIXED,
            discountValue: reward.discountValue ?? 0,
            minSubtotal: 0,
            maxDiscountAmount: reward.maxDiscountAmount ?? null,
            maxRedemptions: 1,
            isActive: true,
          },
        });
        promoId = promo.id;
        await tx.loyaltyRedemption.update({
          where: { id: redemption.id },
          data: {
            generatedPromoId: promo.id,
          },
        });
      }

      await tx.loyaltyReward.update({
        where: { id: rewardId },
        data: {
          redeemedCount: {
            increment: 1,
          },
        },
      });

      return tx.loyaltyRedemption.findUnique({
        where: { id: redemption.id },
        include: {
          reward: true,
          generatedPromo: true,
          grantedBook: {
            select: {
              id: true,
              title: true,
              author: true,
              coverImage: true,
            },
          },
        },
      });
    });
  }

  async listRewards(actorUserId: string) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.payout.manage',
    );
    return this.prisma.loyaltyReward.findMany({
      include: {
        rewardBook: {
          select: {
            id: true,
            title: true,
            author: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { stickerCost: 'asc' }],
    });
  }

  async createReward(actorUserId: string, dto: CreateLoyaltyRewardDto) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.payout.manage',
    );
    await this.ensureRewardPayload(dto);
    return this.prisma.loyaltyReward.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        stickerCost: dto.stickerCost,
        rewardType: dto.rewardType,
        discountValue: dto.discountValue ?? null,
        maxDiscountAmount: dto.maxDiscountAmount ?? null,
        rewardBookId: dto.rewardBookId ?? null,
        isActive: dto.isActive ?? true,
        redemptionLimit: dto.redemptionLimit ?? null,
      },
      include: {
        rewardBook: {
          select: {
            id: true,
            title: true,
            author: true,
          },
        },
      },
    });
  }

  async updateReward(
    actorUserId: string,
    rewardId: string,
    dto: UpdateLoyaltyRewardDto,
  ) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.payout.manage',
    );
    const existing = await this.prisma.loyaltyReward.findUnique({
      where: { id: rewardId },
    });
    if (!existing) {
      throw new NotFoundException('Reward not found');
    }

    await this.ensureRewardPayload({
      name: dto.name ?? existing.name,
      description:
        dto.description !== undefined
          ? dto.description
          : (existing.description ?? undefined),
      stickerCost: dto.stickerCost ?? existing.stickerCost,
      rewardType: dto.rewardType ?? existing.rewardType,
      discountValue:
        dto.discountValue !== undefined
          ? dto.discountValue
          : existing.discountValue !== null
            ? Number(existing.discountValue)
            : undefined,
      maxDiscountAmount:
        dto.maxDiscountAmount !== undefined
          ? dto.maxDiscountAmount
          : existing.maxDiscountAmount !== null
            ? Number(existing.maxDiscountAmount)
            : undefined,
      rewardBookId:
        dto.rewardBookId !== undefined
          ? dto.rewardBookId || undefined
          : (existing.rewardBookId ?? undefined),
      redemptionLimit:
        dto.redemptionLimit !== undefined
          ? dto.redemptionLimit
          : (existing.redemptionLimit ?? undefined),
      isActive: dto.isActive ?? existing.isActive,
    });

    return this.prisma.loyaltyReward.update({
      where: { id: rewardId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() || null }
          : {}),
        ...(dto.stickerCost !== undefined
          ? { stickerCost: dto.stickerCost }
          : {}),
        ...(dto.rewardType !== undefined ? { rewardType: dto.rewardType } : {}),
        ...(dto.discountValue !== undefined
          ? { discountValue: dto.discountValue }
          : {}),
        ...(dto.maxDiscountAmount !== undefined
          ? { maxDiscountAmount: dto.maxDiscountAmount }
          : {}),
        ...(dto.rewardBookId !== undefined
          ? { rewardBookId: dto.rewardBookId || null }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.redemptionLimit !== undefined
          ? { redemptionLimit: dto.redemptionLimit }
          : {}),
      },
      include: {
        rewardBook: {
          select: {
            id: true,
            title: true,
            author: true,
          },
        },
      },
    });
  }

  async grantStickers(actorUserId: string, dto: GrantStickersDto) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.payout.manage',
    );
    const uniqueUserIds = Array.from(
      new Set(dto.userIds.map((id) => id.trim()).filter(Boolean)),
    );
    if (uniqueUserIds.length === 0) {
      throw new BadRequestException('Select at least one user.');
    }
    await this.prisma.$transaction(async (tx) => {
      for (const userId of uniqueUserIds) {
        await tx.user.update({
          where: { id: userId },
          data: {
            stickerBalance: {
              increment: dto.amount,
            },
          },
        });
        await tx.stickerLedger.create({
          data: {
            userId,
            actorUserId,
            type: 'ADMIN_GRANT',
            delta: dto.amount,
            note: dto.note?.trim() || 'Admin points grant',
          },
        });
      }
    });
    return { grantedUsers: uniqueUserIds.length, amount: dto.amount };
  }

  async grantPromotions(actorUserId: string, dto: GrantPromotionDto) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.payout.manage',
    );
    const uniqueUserIds = Array.from(
      new Set(dto.userIds.map((id) => id.trim()).filter(Boolean)),
    );
    if (uniqueUserIds.length === 0) {
      throw new BadRequestException('Select at least one user.');
    }

    const template = await this.prisma.promotionCode.findUnique({
      where: { id: dto.promotionId },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        discountType: true,
        discountValue: true,
        minSubtotal: true,
        maxDiscountAmount: true,
        startsAt: true,
        endsAt: true,
        isActive: true,
      },
    });

    if (!template) {
      throw new NotFoundException('Promotion template not found.');
    }

    const created: Array<{ userId: string; code: string }> = [];
    for (const userId of uniqueUserIds) {
      const code = await this.buildUniquePromoCode(template.code.slice(0, 12));
      await this.prisma.promotionCode.create({
        data: {
          code,
          assignedUserId: userId,
          name: template.name,
          description: template.description?.trim() || null,
          discountType: template.discountType,
          discountValue: template.discountValue,
          minSubtotal: template.minSubtotal ?? 0,
          maxDiscountAmount: template.maxDiscountAmount ?? null,
          startsAt: template.startsAt ?? null,
          maxRedemptions: 1,
          endsAt: template.endsAt ?? null,
          isActive: template.isActive,
        },
      });
      created.push({ userId, code });
    }

    return { created };
  }
}
