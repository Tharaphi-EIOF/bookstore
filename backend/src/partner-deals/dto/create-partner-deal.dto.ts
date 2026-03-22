import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartnerDealStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreatePartnerDealDto {
  @ApiProperty({ example: 'Delta Publishing' })
  @IsString()
  partnerName!: string;

  @ApiPropertyOptional({ example: 'Delta Publishing Co., Ltd.' })
  @IsOptional()
  @IsString()
  partnerCompany?: string;

  @ApiPropertyOptional({ example: 'partnerships@delta-pub.com' })
  @IsOptional()
  @IsEmail()
  partnerEmail?: string;

  @ApiPropertyOptional({ example: 'book-lead-id' })
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional({ example: 'book-id' })
  @IsOptional()
  @IsUUID()
  bookId?: string;

  @ApiProperty({ example: 25, description: 'Revenue share percentage' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  revenueSharePct!: number;

  @ApiPropertyOptional({
    enum: PartnerDealStatus,
    default: PartnerDealStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(PartnerDealStatus)
  status?: PartnerDealStatus;

  @ApiPropertyOptional({ example: '2026-03-01T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  effectiveFrom?: Date;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @Type(() => Date)
  effectiveTo?: Date;

  @ApiPropertyOptional({
    example: 'Consignment; we stock and remit monthly settlement.',
  })
  @IsOptional()
  @IsString()
  termsNote?: string;
}
