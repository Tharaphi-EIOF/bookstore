import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DeliveryType } from '@prisma/client';

export class CreateOrderDto {
  @ApiProperty({
    example: 'HOME_DELIVERY',
    enum: ['HOME_DELIVERY', 'STORE_PICKUP'],
    required: false,
  })
  @IsOptional()
  @IsEnum(DeliveryType)
  deliveryType?: DeliveryType;

  @ApiProperty({ example: 'store-uuid', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  storeId?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+1 (555) 123-4567' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiProperty({ example: '123 Main St, Apt 4B' })
  @IsOptional()
  @IsString()
  @MaxLength(220)
  address?: string;

  @ApiProperty({ example: 'Seattle' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiProperty({ example: 'WA' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @ApiProperty({ example: '98101' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;

  @ApiProperty({ example: 'United States' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @ApiProperty({ example: 'KPAY', enum: ['KPAY', 'WAVEPAY', 'MPU', 'VISA'] })
  @IsString()
  @IsIn(['KPAY', 'WAVEPAY', 'MPU', 'VISA'])
  paymentProvider!: 'KPAY' | 'WAVEPAY' | 'MPU' | 'VISA';

  @ApiProperty({ example: '/uploads/payment-receipts/abc123.png' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  paymentReceiptUrl!: string;

  @ApiProperty({ example: 'BOOKLOVER10', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  promoCode?: string;
}
