import {
  Prisma,
  StaffTaskStatus,
  type StaffStatus,
  type StaffTaskPriority,
} from '@prisma/client';

export function buildStaffProfilesWhere(
  filters: {
    status?: StaffStatus;
    roleId?: string;
  },
  scopedDepartmentId?: string,
) {
  return {
    ...(scopedDepartmentId ? { departmentId: scopedDepartmentId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.roleId
      ? {
          assignments: {
            some: {
              roleId: filters.roleId,
              effectiveFrom: { lte: new Date() },
              OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
            },
          },
        }
      : {}),
  };
}

export function buildTaskWhere(
  filters: {
    staffId?: string;
    status?: StaffTaskStatus;
    fromDate?: Date;
    toDate?: Date;
    priority?: StaffTaskPriority;
  },
  scopedDepartmentId?: string,
) {
  return {
    ...(filters.staffId ? { staffId: filters.staffId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(scopedDepartmentId
      ? {
          staff: {
            departmentId: scopedDepartmentId,
          },
        }
      : {}),
    ...(filters.fromDate || filters.toDate
      ? {
          createdAt: {
            ...(filters.fromDate ? { gte: filters.fromDate } : {}),
            ...(filters.toDate ? { lte: filters.toDate } : {}),
          },
        }
      : {}),
  };
}

export function clampCommercialMetricsLimit(limit?: number): number {
  return Math.max(3, Math.min(20, Math.floor(limit ?? 5)));
}

export function buildCommercialOrderWhere(filters: {
  fromDate?: Date;
  toDate?: Date;
}): Prisma.OrderWhereInput {
  return {
    status: { in: ['CONFIRMED', 'COMPLETED'] },
    ...(filters.fromDate || filters.toDate
      ? {
          createdAt: {
            ...(filters.fromDate ? { gte: filters.fromDate } : {}),
            ...(filters.toDate ? { lte: filters.toDate } : {}),
          },
        }
      : {}),
  };
}
