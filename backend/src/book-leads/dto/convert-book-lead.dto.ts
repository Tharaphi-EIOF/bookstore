import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { BOOK_CATEGORIES } from '../../books/constants/book-taxonomy';

export class ConvertBookLeadDto {
  @ApiProperty({ example: '9780547928227' })
  @IsString()
  @IsNotEmpty()
  isbn!: string;

  @ApiProperty({ example: 19.99 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price!: number;

  @ApiProperty({
    type: [String],
    example: ['Fiction', 'Fantasy'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsIn(BOOK_CATEGORIES, { each: true })
  @IsString({ each: true })
  categories!: string[];

  @ApiPropertyOptional({ example: 0, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({
    example: 'Strong audience demand. Convert lead to sale-ready title.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/covers/name-of-the-wind.jpg',
  })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ type: [String], example: ['Epic Fantasy'] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  genres?: string[];

  @ApiPropertyOptional({ example: 'The Name of the Wind' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Patrick Rothfuss' })
  @IsOptional()
  @IsString()
  author?: string;
}
