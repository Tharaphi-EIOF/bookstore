import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePartnerSettlementDto {
  @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  periodStart!: Date;

  @ApiProperty({ example: '2026-03-31T23:59:59.000Z' })
  @Type(() => Date)
  @IsDate()
  periodEnd!: Date;

  @ApiProperty({ example: 1200.5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  grossSalesAmount!: number;

  @ApiPropertyOptional({ example: 'March settlement batch #1' })
  @IsOptional()
  @IsString()
  note?: string;
}
