import { Injectable } from '@nestjs/common';
import {
  StaffTaskStatus,
  type StaffStatus,
  type StaffTaskPriority,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { assertUserPermission } from '../auth/permission-resolution';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpsertRolePermissionsDto } from './dto/upsert-role-permissions.dto';
import { CreateStaffProfileDto } from './dto/create-staff-profile.dto';
import { UpdateStaffProfileDto } from './dto/update-staff-profile.dto';
import { AssignStaffRoleDto } from './dto/assign-staff-role.dto';
import { CreateStaffTaskDto } from './dto/create-staff-task.dto';
import { UpdateStaffTaskDto } from './dto/update-staff-task.dto';
import { HireExistingUserDto } from './dto/hire-existing-user.dto';
import { CreateStaffAccountDto } from './dto/create-staff-account.dto';
import { UpdateStaffAccountAccessDto } from './dto/update-staff-account-access.dto';
import { StaffRolesService } from './staff-roles.service';
import { StaffProfilesService } from './staff-profiles.service';
import { StaffTasksService } from './staff-tasks.service';
import { StaffMetricsService } from './staff-metrics.service';

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rolesService: StaffRolesService,
    private readonly profilesService: StaffProfilesService,
    private readonly tasksService: StaffTasksService,
    private readonly metricsService: StaffMetricsService,
  ) {}

  listDepartments() {
    return this.rolesService.listDepartments();
  }

  createDepartment(dto: CreateDepartmentDto, actorUserId?: string) {
    return this.rolesService.createDepartment(dto, actorUserId);
  }

  updateDepartment(id: string, dto: UpdateDepartmentDto, actorUserId?: string) {
    return this.rolesService.updateDepartment(id, dto, actorUserId);
  }

  deleteDepartment(id: string, actorUserId?: string) {
    return this.rolesService.deleteDepartment(id, actorUserId);
  }

  listRoles(departmentId?: string) {
    return this.rolesService.listRoles(departmentId);
  }

  listElevatedAccounts() {
    return this.rolesService.listElevatedAccounts();
  }

  createRole(dto: CreateRoleDto, actorUserId?: string) {
    return this.rolesService.createRole(dto, actorUserId);
  }

  updateRole(id: string, dto: UpdateRoleDto, actorUserId?: string) {
    return this.rolesService.updateRole(id, dto, actorUserId);
  }

  deleteRole(id: string, actorUserId?: string) {
    return this.rolesService.deleteRole(id, actorUserId);
  }

  listPermissions() {
    return this.rolesService.listPermissions();
  }

  upsertRolePermissions(
    roleId: string,
    dto: UpsertRolePermissionsDto,
    actorUserId?: string,
  ) {
    return this.rolesService.upsertRolePermissions(roleId, dto, actorUserId);
  }

  createStaffProfile(dto: CreateStaffProfileDto, actorUserId?: string) {
    return this.profilesService.createStaffProfile(dto, actorUserId);
  }

  listStaffCandidates(query?: string) {
    return this.profilesService.listStaffCandidates(query);
  }

  hireExistingUser(dto: HireExistingUserDto, actorUserId?: string) {
    return this.profilesService.hireExistingUser(dto, actorUserId);
  }

  createStaffAccount(dto: CreateStaffAccountDto, actorUserId?: string) {
    return this.profilesService.createStaffAccount(dto, actorUserId);
  }

  listStaffProfiles(
    filters: {
      departmentId?: string;
      status?: StaffStatus;
      roleId?: string;
    },
    actorUserId?: string,
  ) {
    return this.profilesService.listStaffProfiles(filters, actorUserId);
  }

  getStaffProfile(id: string, actorUserId?: string) {
    return this.profilesService.getStaffProfile(id, actorUserId);
  }

  updateStaffProfile(
    id: string,
    dto: UpdateStaffProfileDto,
    actorUserId?: string,
  ) {
    return this.profilesService.updateStaffProfile(id, dto, actorUserId);
  }

  updateStaffAccountAccess(
    id: string,
    dto: UpdateStaffAccountAccessDto,
    actorUserId?: string,
  ) {
    return this.profilesService.updateStaffAccountAccess(id, dto, actorUserId);
  }

  assignRoleToStaff(
    staffId: string,
    dto: AssignStaffRoleDto,
    actorUserId?: string,
  ) {
    return this.profilesService.assignRoleToStaff(staffId, dto, actorUserId);
  }

  removeStaffAssignment(
    staffId: string,
    assignmentId: string,
    actorUserId?: string,
  ) {
    return this.profilesService.removeStaffAssignment(
      staffId,
      assignmentId,
      actorUserId,
    );
  }

  createTask(dto: CreateStaffTaskDto, actorUserId?: string) {
    return this.tasksService.createTask(dto, actorUserId);
  }

  updateTask(id: string, dto: UpdateStaffTaskDto, actorUserId?: string) {
    return this.tasksService.updateTask(id, dto, actorUserId);
  }

  completeTask(id: string, actorUserId?: string) {
    return this.tasksService.completeTask(id, actorUserId);
  }

  listTasks(
    filters: {
      departmentId?: string;
      staffId?: string;
      status?: StaffTaskStatus;
      fromDate?: Date;
      toDate?: Date;
      priority?: StaffTaskPriority;
    },
    actorUserId?: string,
  ) {
    return this.tasksService.listTasks(filters, actorUserId);
  }

  getPerformanceMetrics(
    filters: {
      departmentId?: string;
      staffId?: string;
      fromDate?: Date;
      toDate?: Date;
    },
    actorUserId?: string,
  ) {
    return this.metricsService.getPerformanceMetrics(filters, actorUserId);
  }

  getCommercialPerformanceMetrics(
    filters: {
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
    },
    actorUserId?: string,
  ) {
    return this.metricsService.getCommercialPerformanceMetrics(
      filters,
      actorUserId,
    );
  }

  listStaffAuditLogs(staffId: string, limit = 50, actorUserId?: string) {
    return this.profilesService.listStaffAuditLogs(staffId, limit, actorUserId);
  }

  async listAuditLogs(
    filters: {
      actorUserId?: string;
      resource?: string;
      action?: string;
      limit?: number;
    },
    actorUserId?: string,
  ) {
    if (actorUserId) {
      await assertUserPermission(
        this.prisma,
        actorUserId,
        'admin.permission.manage',
      );
    }

    const limit = Math.max(1, Math.min(filters.limit ?? 100, 200));

    return this.prisma.staffAuditLog.findMany({
      where: {
        ...(filters.actorUserId ? { actorUserId: filters.actorUserId } : {}),
        ...(filters.resource ? { resource: filters.resource } : {}),
        ...(filters.action ? { action: filters.action } : {}),
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
