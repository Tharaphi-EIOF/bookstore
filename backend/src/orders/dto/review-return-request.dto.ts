import { ApiProperty } from '@nestjs/swagger';
import { ReturnRequestStatus } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class ReviewReturnRequestDto {
  @ApiProperty({
    example: 'APPROVED',
    enum: ['APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED', 'CLOSED'],
  })
  @IsEnum(ReturnRequestStatus)
  status!: ReturnRequestStatus;

  @ApiProperty({ example: 'Approved after warehouse review.', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolutionNote?: string;

  @ApiProperty({ example: 24.99, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;
}
