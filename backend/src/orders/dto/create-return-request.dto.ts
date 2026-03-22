import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateReturnRequestDto {
  @ApiProperty({ example: 'book-uuid', required: false })
  @IsOptional()
  @IsString()
  bookId?: string;

  @ApiProperty({ example: 'Damaged item on arrival' })
  @IsString()
  @MaxLength(120)
  reason!: string;

  @ApiProperty({
    example: 'Cover was torn and two pages were missing.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  requestedQty?: number;
}
