import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePartnerConsignmentReceiptDto {
  @ApiProperty({ example: 'warehouse-id' })
  @IsUUID()
  warehouseId!: string;

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ example: 'Initial partner consignment drop.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
