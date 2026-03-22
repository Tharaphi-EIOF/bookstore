import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class GrantPromotionDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  userIds!: string[];

  @ApiProperty({ example: 'promotion-template-uuid' })
  @IsString()
  promotionId!: string;
}
