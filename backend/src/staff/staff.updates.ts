import { UpdateStaffProfileDto } from './dto/update-staff-profile.dto';
import { UpdateStaffTaskDto } from './dto/update-staff-task.dto';
import { Prisma } from '@prisma/client';

export function buildStaffProfileUpdateData(dto: UpdateStaffProfileDto) {
  return {
    ...(dto.departmentId !== undefined
      ? { departmentId: dto.departmentId }
      : {}),
    ...(dto.employeeCode !== undefined
      ? { employeeCode: dto.employeeCode }
      : {}),
    ...(dto.title !== undefined ? { title: dto.title } : {}),
    ...(dto.managerId !== undefined ? { managerId: dto.managerId } : {}),
    ...(dto.status !== undefined ? { status: dto.status } : {}),
    ...(dto.dateJoined !== undefined
      ? { dateJoined: new Date(dto.dateJoined) }
      : {}),
    ...(dto.birthDate !== undefined
      ? { birthDate: dto.birthDate ? new Date(dto.birthDate) : null }
      : {}),
    ...(dto.phoneNumber !== undefined ? { phoneNumber: dto.phoneNumber } : {}),
    ...(dto.personalEmail !== undefined
      ? { personalEmail: dto.personalEmail }
      : {}),
    ...(dto.homeAddress !== undefined ? { homeAddress: dto.homeAddress } : {}),
    ...(dto.emergencyContact !== undefined
      ? { emergencyContact: dto.emergencyContact }
      : {}),
    ...(dto.salary !== undefined ? { salary: dto.salary } : {}),
  };
}

export function buildStaffTaskUpdateData(dto: UpdateStaffTaskDto) {
  return {
    ...(dto.staffId !== undefined ? { staffId: dto.staffId } : {}),
    ...(dto.type !== undefined ? { type: dto.type } : {}),
    ...(dto.status !== undefined ? { status: dto.status } : {}),
    ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
    ...(dto.metadata !== undefined
      ? { metadata: dto.metadata as Prisma.InputJsonValue }
      : {}),
    ...(dto.completedAt !== undefined ? { completedAt: dto.completedAt } : {}),
  };
}
