import { ApiProperty } from '@nestjs/swagger';
import { StaffStatus } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateStaffProfileDto {
  @ApiProperty({ example: 'user-uuid' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ example: 'department-uuid' })
  @IsUUID()
  departmentId!: string;

  @ApiProperty({ example: 'EMP-0001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  employeeCode!: string;

  @ApiProperty({ example: 'Support Specialist' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  title!: string;

  @ApiProperty({ required: false, example: 'manager-staff-profile-uuid' })
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiProperty({
    required: false,
    enum: StaffStatus,
    example: StaffStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(StaffStatus)
  status?: StaffStatus;

  @ApiProperty({ required: false, example: '2024-03-22T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  dateJoined?: string;

  @ApiProperty({ required: false, example: '1990-05-15T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({ required: false, example: '+1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phoneNumber?: string;

  @ApiProperty({ required: false, example: 'personal@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(140)
  personalEmail?: string;

  @ApiProperty({ required: false, example: '123 Main St, Springfield' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  homeAddress?: string;

  @ApiProperty({ required: false, example: 'Jane Doe (+1987654321)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  emergencyContact?: string;

  @ApiProperty({ required: false, example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salary?: number;

  @ApiProperty({ required: false, example: 'avatar-1' })
  @IsOptional()
  @IsString()
  avatarValue?: string;

  @ApiProperty({ required: false, enum: ['emoji', 'upload'], example: 'emoji' })
  @IsOptional()
  @IsString()
  avatarType?: string;
}
