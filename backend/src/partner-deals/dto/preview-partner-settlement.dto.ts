import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate } from 'class-validator';

export class PreviewPartnerSettlementDto {
  @ApiProperty({ example: '2026-03-01T00:00:00.000Z' })
  @Type(() => Date)
  @IsDate()
  periodStart!: Date;

  @ApiProperty({ example: '2026-03-31T23:59:59.999Z' })
  @Type(() => Date)
  @IsDate()
  periodEnd!: Date;
}
