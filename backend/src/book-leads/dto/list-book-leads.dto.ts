import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookLeadSource, BookLeadStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum BookLeadView {
  ACTIVE = 'active',
  TRASHED = 'trashed',
  ALL = 'all',
}

export enum BookLeadWorkflowStage {
  NEW = 'NEW',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
}

export class ListBookLeadsDto {
  @ApiPropertyOptional({ enum: BookLeadStatus })
  @IsOptional()
  @IsEnum(BookLeadStatus)
  status?: BookLeadStatus;

  @ApiPropertyOptional({ enum: BookLeadWorkflowStage })
  @IsOptional()
  @IsEnum(BookLeadWorkflowStage)
  stage?: BookLeadWorkflowStage;

  @ApiPropertyOptional({ enum: BookLeadSource })
  @IsOptional()
  @IsEnum(BookLeadSource)
  source?: BookLeadSource;

  @ApiPropertyOptional({ example: 'harry potter' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 'Sarah J. Maas' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ example: 'user001' })
  @IsOptional()
  @IsString()
  requestedBy?: string;

  @ApiPropertyOptional({ example: 'staff.admin' })
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional({ example: '2026-03-01' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ example: '2026-03-31' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({ enum: BookLeadView, default: BookLeadView.ACTIVE })
  @IsOptional()
  @IsEnum(BookLeadView)
  view?: BookLeadView;

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
