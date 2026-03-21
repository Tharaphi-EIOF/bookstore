import { BadRequestException } from '@nestjs/common';
import { type StaffStatus } from '@prisma/client';
import { CreateStaffAccountDto } from './dto/create-staff-account.dto';
import { HireExistingUserDto } from './dto/hire-existing-user.dto';

type StaffProfilePayload = {
  userId: string;
  departmentId: string;
  employeeCode?: string;
  title: string;
  managerId?: string;
  status?: StaffStatus;
  roleIds?: string[];
};

export function toStaffProfilePayloadFromHireDto(
  dto: HireExistingUserDto,
): StaffProfilePayload {
  return {
    userId: dto.userId,
    departmentId: dto.departmentId,
    employeeCode: dto.employeeCode,
    title: dto.title,
    managerId: dto.managerId,
    status: dto.status,
    roleIds: dto.roleIds,
  };
}

export function toStaffProfilePayloadFromCreateDto(
  dto: CreateStaffAccountDto,
  userId: string,
): StaffProfilePayload {
  return {
    userId,
    departmentId: dto.departmentId,
    employeeCode: dto.employeeCode,
    title: dto.title,
    managerId: dto.managerId,
    status: dto.status,
    roleIds: dto.roleIds,
  };
}

export function throwExistingUserFoundError(existingUser: {
  id: string;
  email: string;
  name: string;
}): never {
  throw new BadRequestException({
    code: 'EXISTING_USER_FOUND',
    message:
      'A user with this email already exists. Set convertExisting=true to hire this existing user.',
    existingUser,
  });
}

export function buildConvertedExistingUserResult(
  user: { id: string; email: string; name: string },
  profile: unknown,
) {
  return {
    mode: 'CONVERTED_EXISTING_USER' as const,
    user,
    profile,
  };
}

export function buildCreatedNewUserResult(
  user: { id: string; email: string; name: string },
  profile: unknown,
  sendActivationEmail: boolean,
  temporaryPassword?: string,
) {
  return {
    mode: 'CREATED_NEW_USER' as const,
    user,
    profile,
    sendActivationEmail,
    temporaryPassword: sendActivationEmail ? undefined : temporaryPassword,
  };
}
