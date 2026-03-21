import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateEbookProgressDto {
  @ApiPropertyOptional({ example: 12, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 'epubcfi(/6/14[xchapter]!/4/2/2)' })
  @IsOptional()
  @IsString()
  locationCfi?: string;

  @ApiPropertyOptional({ example: 22.5, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percent?: number;

  @ApiPropertyOptional({
    example: '2026-03-01T09:32:14.120Z',
    description: 'Reader-open timestamp used to group autosaves into one session',
  })
  @IsOptional()
  @IsDateString()
  sessionStartAt?: string;
}
