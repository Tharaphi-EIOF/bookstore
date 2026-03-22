import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PricingSetting, PromotionDiscountType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { assertUserPermission } from '../auth/permission-resolution';
import { UpdatePricingSettingsDto } from './dto/update-pricing-settings.dto';

const SETTINGS_ROW_ID = 'global';

@Injectable()
export class PricingSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureSettingsRow(): Promise<PricingSetting> {
    const existing = await this.prisma.pricingSetting.findUnique({
      where: { id: SETTINGS_ROW_ID },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.pricingSetting.create({
      data: {
        id: SETTINGS_ROW_ID,
      },
    });
  }

  async getSettings(): Promise<PricingSetting> {
    return this.ensureSettingsRow();
  }

  async getCheckoutConfig() {
    const settings = await this.ensureSettingsRow();
    return {
      taxRate: Number(settings.taxRate),
      taxRateFraction: Number(settings.taxRate) / 100,
    };
  }

  computeTaxAmount(taxRatePercent: number, taxableAmount: number): number {
    return Number(
      (
        Math.max(0, taxableAmount) *
        (Math.max(0, taxRatePercent) / 100)
      ).toFixed(2),
    );
  }

  computeRetailPriceFromVendorCost(
    unitCost: number,
    settings: Pick<PricingSetting, 'vendorMarkupType' | 'vendorMarkupValue'>,
  ): number {
    const safeCost = Math.max(0, Number(unitCost));
    const markupValue = Number(settings.vendorMarkupValue);

    const rawPrice =
      settings.vendorMarkupType === PromotionDiscountType.PERCENT
        ? safeCost * (1 + markupValue / 100)
        : safeCost + markupValue;

    return Number(Math.max(0, rawPrice).toFixed(2));
  }

  private async ensureSuperAdmin(actorUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: actorUserId },
      select: { role: true },
    });

    if (!user || String(user.role) !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Only super admin can update global pricing settings.',
      );
    }
  }

  async getAdminSettings(actorUserId: string) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.payout.manage',
    );
    return this.ensureSettingsRow();
  }

  async updateAdminSettings(
    actorUserId: string,
    dto: UpdatePricingSettingsDto,
  ) {
    await assertUserPermission(
      this.prisma,
      actorUserId,
      'finance.payout.manage',
    );
    await this.ensureSuperAdmin(actorUserId);

    const current = await this.ensureSettingsRow();
    const markupType = dto.vendorMarkupType ?? current.vendorMarkupType;
    const markupValue =
      dto.vendorMarkupValue ?? Number(current.vendorMarkupValue);

    if (markupType === PromotionDiscountType.PERCENT && markupValue > 1000) {
      throw new BadRequestException('Percent markup cannot exceed 1000%.');
    }

    return this.prisma.pricingSetting.update({
      where: { id: SETTINGS_ROW_ID },
      data: {
        ...(dto.taxRate !== undefined ? { taxRate: dto.taxRate } : {}),
        ...(dto.vendorMarkupType !== undefined
          ? { vendorMarkupType: dto.vendorMarkupType }
          : {}),
        ...(dto.vendorMarkupValue !== undefined
          ? { vendorMarkupValue: dto.vendorMarkupValue }
          : {}),
        ...(dto.applyPricingOnReceive !== undefined
          ? { applyPricingOnReceive: dto.applyPricingOnReceive }
          : {}),
      },
    });
  }
}
