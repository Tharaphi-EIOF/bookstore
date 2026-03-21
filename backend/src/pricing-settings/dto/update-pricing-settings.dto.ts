import { ApiPropertyOptional } from '@nestjs/swagger';
import { PromotionDiscountType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class UpdatePricingSettingsDto {
  @ApiPropertyOptional({
    description: 'Checkout tax rate percentage',
    example: 10,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  taxRate?: number;

  @ApiPropertyOptional({
    enum: PromotionDiscountType,
    description: 'How retail price is calculated from vendor unit cost',
    example: PromotionDiscountType.PERCENT,
  })
  @IsOptional()
  @IsEnum(PromotionDiscountType)
  vendorMarkupType?: PromotionDiscountType;

  @ApiPropertyOptional({
    description: 'Markup value (percent or fixed amount depending on vendorMarkupType)',
    example: 20,
    minimum: 0,
    maximum: 100000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100000)
  vendorMarkupValue?: number;

  @ApiPropertyOptional({
    description:
      'When receiving purchase orders, auto-calculate and override book price from vendor cost.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  applyPricingOnReceive?: boolean;
}
