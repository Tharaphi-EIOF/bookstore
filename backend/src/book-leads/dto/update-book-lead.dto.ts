import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookLeadSource, BookLeadStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateBookLeadDto {
  @ApiPropertyOptional({ example: 'The Name of the Wind' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Patrick Rothfuss' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ enum: BookLeadSource })
  @IsOptional()
  @IsEnum(BookLeadSource)
  source?: BookLeadSource;

  @ApiPropertyOptional({ enum: BookLeadStatus })
  @IsOptional()
  @IsEnum(BookLeadStatus)
  status?: BookLeadStatus;

  @ApiPropertyOptional({ example: 'Assign to procurement next sprint.' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  priority?: number;

  @ApiPropertyOptional({ example: 'c3d8b49f-7e4c-4ca8-8eb8-df5f95c4ef0d' })
  @IsOptional()
  @IsString()
  requestedByUserId?: string;

  @ApiPropertyOptional({ example: 'f6f9b06e-c2ca-49f4-b9dc-6df155099c88' })
  @IsOptional()
  @IsString()
  assignedToUserId?: string;

  @ApiPropertyOptional({ example: '9780547928227' })
  @IsOptional()
  @IsString()
  procurementIsbn?: string;

  @ApiPropertyOptional({ example: 19.99 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  procurementPrice?: number;

  @ApiPropertyOptional({ type: [String], example: ['Fiction', 'Poetry'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  procurementCategories?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Modern Poetry'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  procurementGenres?: string[];

  @ApiPropertyOptional({ example: 'Back-catalog demand from blog readers.' })
  @IsOptional()
  @IsString()
  procurementDescription?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  @IsOptional()
  @IsString()
  procurementCoverImage?: string;

  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  procurementStock?: number;

  @ApiPropertyOptional({ example: 'warehouse-id' })
  @IsOptional()
  @IsString()
  procurementWarehouseId?: string;

  @ApiPropertyOptional({ example: 20, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  procurementQuantity?: number;

  @ApiPropertyOptional({ example: 250.0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  procurementEstimatedCost?: number;

  @ApiPropertyOptional({ example: 'Buy for Yangon flagship first.' })
  @IsOptional()
  @IsString()
  procurementReviewNote?: string;
}
