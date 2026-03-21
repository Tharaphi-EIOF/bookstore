import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

export function isElevatedRole(role: Role | undefined): boolean {
  return role === Role.ADMIN || String(role) === 'SUPER_ADMIN';
}

export function assertSameDepartmentAccess(
  actorDepartmentId: string | undefined,
  targetDepartmentId: string,
  message: string,
): void {
  if (!actorDepartmentId || actorDepartmentId !== targetDepartmentId) {
    throw new ForbiddenException(message);
  }
}

export function assertStaffFilterScoped(
  actorRole: Role | undefined,
  isSameDepartment: boolean,
  message: string,
): void {
  if (isElevatedRole(actorRole)) {
    return;
  }

  if (!isSameDepartment) {
    throw new ForbiddenException(message);
  }
}

export function assertDepartmentVisibility(
  actor: {
    role: Role | undefined;
    departmentCode?: string;
    departmentId?: string;
  },
  targetDepartmentId: string,
  message: string,
): void {
  if (isElevatedRole(actor.role)) {
    return;
  }

  const canHrViewAllStaff = actor.departmentCode === 'HR';
  if (!canHrViewAllStaff && actor.departmentId !== targetDepartmentId) {
    throw new ForbiddenException(message);
  }
}
