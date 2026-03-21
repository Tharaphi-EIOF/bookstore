import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsString,
  MinLength,
} from 'class-validator';

export class MergeBookLeadsDto {
  @ApiProperty({
    type: [String],
    example: [
      '26b85bf8-4d53-4300-b66e-b74671b96344',
      'ee144a74-cdb5-4484-9246-d57191e1abdc',
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  duplicateLeadIds!: string[];
}

