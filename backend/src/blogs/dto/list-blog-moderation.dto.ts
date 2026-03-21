import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListBlogModerationDto {
  @ApiPropertyOptional({ enum: ['PENDING_REVIEW', 'REJECTED', 'PUBLISHED', 'DRAFT'] })
  @IsOptional()
  @IsIn(['PENDING_REVIEW', 'REJECTED', 'PUBLISHED', 'DRAFT'])
  status?: 'PENDING_REVIEW' | 'REJECTED' | 'PUBLISHED' | 'DRAFT';

  @ApiPropertyOptional({ description: 'Search by title or author name' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 20 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
