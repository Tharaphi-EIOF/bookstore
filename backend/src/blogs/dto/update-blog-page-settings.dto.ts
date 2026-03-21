import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateBlogPageSettingsDto {
  @ApiPropertyOptional({ example: 'Treasure House' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  eyebrow?: string;

  @ApiPropertyOptional({ example: 'Writing & Poems' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;

  @ApiPropertyOptional({
    type: [String],
    example: [
      'A home for essays, reflections, and poems.',
      'Writing that moves between thought and lyric.',
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(180, { each: true })
  introLines?: string[];
}
