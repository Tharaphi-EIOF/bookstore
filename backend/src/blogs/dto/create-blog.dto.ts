import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsDateString,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBlogDto {
  @ApiProperty({ example: 'How to Build Resilient APIs with NestJS' })
  @IsString()
  @MaxLength(180)
  title!: string;

  @ApiPropertyOptional({
    example: 'A practical architecture guide for real production constraints.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  subtitle?: string;

  @ApiProperty({ example: '# Intro\\nContent...' })
  @IsString()
  @MaxLength(50000)
  content!: string;

  @ApiPropertyOptional({ example: 'https://images.example.com/cover.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  coverImage?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED'], default: 'DRAFT' })
  @IsOptional()
  @IsIn(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED'])
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED';

  @ApiPropertyOptional({
    description: 'Scheduled publish date/time (kept as draft until manual publish)',
    example: '2026-03-15T09:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['backend', 'nestjs', 'architecture'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Book ids linked in this post',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  bookIds?: string[];

  @ApiPropertyOptional({ minimum: 1, maximum: 180 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(180)
  readingTime?: number;
}
