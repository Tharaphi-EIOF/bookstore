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
