import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewBlogDto {
  @ApiPropertyOptional({
    example: 'Contains external promotional links that violate content policy.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(800)
  reason?: string;
}
