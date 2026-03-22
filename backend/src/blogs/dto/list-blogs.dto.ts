import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export type BlogFeedTab =
  | 'for_you'
  | 'trending'
  | 'latest'
  | 'following'
  | 'poems';
export type BlogStatus = 'DRAFT' | 'PENDING_REVIEW' | 'REJECTED' | 'PUBLISHED';

export class ListBlogsDto {
  @ApiPropertyOptional({
    enum: ['for_you', 'trending', 'latest', 'following', 'poems'],
  })
  @IsOptional()
  @IsIn(['for_you', 'trending', 'latest', 'following', 'poems'])
  tab?: BlogFeedTab;

  @ApiPropertyOptional({ description: 'Filter by author id' })
  @IsOptional()
  @IsString()
  authorId?: string;

  @ApiPropertyOptional({ description: 'Filter by tag name' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({
    description: 'Filter by multiple tag names (comma-separated)',
    example: 'reading,productivity,technology',
  })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({
    enum: ['DRAFT', 'PENDING_REVIEW', 'REJECTED', 'PUBLISHED'],
  })
  @IsOptional()
  @IsIn(['DRAFT', 'PENDING_REVIEW', 'REJECTED', 'PUBLISHED'])
  status?: BlogStatus;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 30, default: 10 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(30)
  limit?: number;
}
