import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSavedAddressDto {
  @ApiProperty({ example: 'Home' })
  @IsString()
  @MaxLength(60)
  label!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '+1 (555) 123-4567' })
  @IsString()
  @MaxLength(50)
  phone!: string;

  @ApiProperty({ example: '123 Main St, Apt 4B' })
  @IsString()
  @MaxLength(220)
  address!: string;

  @ApiProperty({ example: 'Seattle' })
  @IsString()
  @MaxLength(120)
  city!: string;

  @ApiProperty({ example: 'WA' })
  @IsString()
  @MaxLength(120)
  state!: string;

  @ApiProperty({ example: '98101' })
  @IsString()
  @MaxLength(20)
  zipCode!: string;

  @ApiProperty({ example: 'United States' })
  @IsString()
  @MaxLength(120)
  country!: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
