import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateReorderSuggestionRequestsDto {
  @ApiProperty({ example: '4f6be819-d44f-4b1a-a0f5-950b4fdaf994' })
  @IsString()
  warehouseId!: string;

  @ApiPropertyOptional({ example: 14, minimum: 1, maximum: 90, default: 14 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  leadTimeDays?: number;

  @ApiPropertyOptional({ example: 30, minimum: 7, maximum: 120, default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(7)
  @Max(120)
  coverageDays?: number;

  @ApiPropertyOptional({ example: 0.2, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minDailySales?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  submitForApproval?: boolean;
}
