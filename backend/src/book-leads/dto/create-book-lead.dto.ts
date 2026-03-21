import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookLeadSource } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateBookLeadDto {
  @ApiProperty({ example: 'The Name of the Wind' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'Patrick Rothfuss' })
  @IsString()
  @IsNotEmpty()
  author!: string;

  @ApiPropertyOptional({
    enum: BookLeadSource,
    default: BookLeadSource.USER_REQUEST,
  })
  @IsOptional()
  @IsEnum(BookLeadSource)
  source?: BookLeadSource;

  @ApiPropertyOptional({
    example: 'Requested by multiple customers this month.',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 2, minimum: 1, maximum: 5 })
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
}
