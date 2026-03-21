import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoyaltyRewardType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateLoyaltyRewardDto {
  @ApiProperty({ example: '5% Off Next Order' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 'Redeem points for a single-use coupon.' })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  stickerCost!: number;

  @ApiProperty({ enum: LoyaltyRewardType })
  @IsEnum(LoyaltyRewardType)
  rewardType!: LoyaltyRewardType;

  @ApiPropertyOptional({ example: 5 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  discountValue?: number;

  @ApiPropertyOptional({ example: 20 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  maxDiscountAmount?: number;

  @ApiPropertyOptional({ example: 'book-uuid-for-free-ebook' })
  @IsOptional()
  @IsString()
  rewardBookId?: string;

  @ApiPropertyOptional({ example: 100 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  redemptionLimit?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
