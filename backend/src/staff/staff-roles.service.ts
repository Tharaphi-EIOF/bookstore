import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  STAFF_ROLE_WITH_PERMISSIONS_INCLUDE,
  STAFF_ROLE_WITH_PERMISSIONS_SORTED_INCLUDE,
} from './staff.constants';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpsertRolePermissionsDto } from './dto/upsert-role-permissions.dto';
import { StaffInternalService } from './staff-internal.service';

@Injectable()
export class StaffRolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly internal: StaffInternalService,
  ) {}

  async listDepartments() {
    return this.prisma.department.findMany({
      include: {
        _count: {
          select: {
            staffProfiles: true,
            staffRoles: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  async createDepartment(dto: CreateDepartmentDto, actorUserId?: string) {
    const department = await this.prisma.department.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });

    await this.internal.createAuditLog(
      actorUserId,
      'department.create',
      'department',
      department.id,
      this.internal.buildCreateAuditChanges(
        'department',
        department,
        `Created department ${department.name}.`,
      ),
    );

    return department;
  }

  async updateDepartment(
    id: string,
    dto: UpdateDepartmentDto,
    actorUserId?: string,
  ) {
    const existing = await this.prisma.department.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Department not found');
    }

    const department = await this.prisma.department.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    await this.internal.createAuditLog(
      actorUserId,
      'department.update',
      'department',
      id,
      this.internal.buildUpdateAuditChanges(
        'department',
        existing,
        department,
        ['name', 'code', 'description', 'isActive'],
        `Updated department ${department.name}.`,
      ),
    );

    return department;
  }

  async deleteDepartment(id: string, actorUserId?: string) {
    const linkedStaffCount = await this.prisma.staffProfile.count({
      where: { departmentId: id },
    });
    if (linkedStaffCount > 0) {
      throw new BadRequestException(
        'Cannot delete a department with linked staff profiles',
      );
    }

    const department = await this.prisma.department.delete({ where: { id } });
    await this.internal.createAuditLog(
      actorUserId,
      'department.delete',
      'department',
      id,
      this.internal.buildDeleteAuditChanges(
        'department',
        department,
        `Deleted department ${department.name}.`,
      ),
    );
    return department;
  }

  async listRoles(departmentId?: string) {
    return this.prisma.staffRole.findMany({
      where: {
        ...(departmentId ? { departmentId } : {}),
      },
      include: {
        department: true,
        ...STAFF_ROLE_WITH_PERMISSIONS_SORTED_INCLUDE,
        _count: {
          select: {
            assignments: true,
          },
        },
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
  }

  async listElevatedAccounts() {
    return this.prisma.user.findMany({
      where: {
        role: {
          in: [Role.ADMIN, Role.SUPER_ADMIN],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        staffProfile: {
          select: {
            id: true,
            title: true,
            status: true,
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: [{ role: 'desc' }, { name: 'asc' }],
    });
  }

  async createRole(dto: CreateRoleDto, actorUserId?: string) {
    let departmentCode = 'GLOBAL';
    if (dto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!department) {
        throw new NotFoundException('Department not found');
      }
      departmentCode = this.internal.toRoleCodePart(department.code);
    }

    const roleNameCode = this.internal.toRoleCodePart(dto.name);
    const requestedCode = dto.code
      ? this.internal.toRoleCodePart(dto.code)
      : `${departmentCode}_${roleNameCode}`;
    const uniqueCode = await this.internal.ensureUniqueRoleCode(requestedCode);

    const role = await this.prisma.staffRole.create({
      data: {
        code: uniqueCode,
        name: dto.name,
        departmentId: dto.departmentId,
        isSystem: dto.isSystem ?? false,
      },
      include: {
        ...STAFF_ROLE_WITH_PERMISSIONS_INCLUDE,
      },
    });

    await this.internal.createAuditLog(
      actorUserId,
      'staffRole.create',
      'staffRole',
      role.id,
      this.internal.buildCreateAuditChanges(
        'staff role',
        role,
        `Created staff role ${role.name}.`,
      ),
    );

    return role;
  }

  async updateRole(id: string, dto: UpdateRoleDto, actorUserId?: string) {
    const existing = await this.prisma.staffRole.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Role not found');
    }

    if (dto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!department) {
        throw new NotFoundException('Department not found');
      }
    }

    const nextCode = dto.code
      ? await this.internal.ensureUniqueRoleCode(
          this.internal.toRoleCodePart(dto.code),
          id,
        )
      : undefined;

    const role = await this.prisma.staffRole.update({
      where: { id },
      data: {
        ...(nextCode !== undefined ? { code: nextCode } : {}),
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.departmentId !== undefined
          ? { departmentId: dto.departmentId }
          : {}),
        ...(dto.isSystem !== undefined ? { isSystem: dto.isSystem } : {}),
      },
      include: {
        ...STAFF_ROLE_WITH_PERMISSIONS_INCLUDE,
      },
    });

    await this.internal.createAuditLog(
      actorUserId,
      'staffRole.update',
      'staffRole',
      id,
      this.internal.buildUpdateAuditChanges(
        'staff role',
        existing,
        role,
        ['name', 'code', 'departmentId', 'isSystem'],
        `Updated staff role ${role.name}.`,
      ),
    );

    return role;
  }

  async deleteRole(id: string, actorUserId?: string) {
    const existing = await this.prisma.staffRole.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Role not found');
    }

    const activeAssignments = await this.prisma.staffAssignment.count({
      where: {
        roleId: id,
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: new Date() } }],
      },
    });

    if (activeAssignments > 0) {
      throw new BadRequestException(
        'Cannot delete a role with active staff assignments',
      );
    }

    const role = await this.prisma.staffRole.delete({ where: { id } });

    await this.internal.createAuditLog(
      actorUserId,
      'staffRole.delete',
      'staffRole',
      id,
      this.internal.buildDeleteAuditChanges(
        'staff role',
        role,
        `Deleted staff role ${role.name}.`,
      ),
    );

    return role;
  }

  async listPermissions() {
    return this.prisma.staffPermission.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async upsertRolePermissions(
    roleId: string,
    dto: UpsertRolePermissionsDto,
    actorUserId?: string,
  ) {
    const role = await this.prisma.staffRole.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const uniqueKeys = Array.from(
      new Set(dto.permissionKeys.map((key) => key.trim())),
    ).filter((key) => key.length > 0);

    const permissions = await Promise.all(
      uniqueKeys.map((key) =>
        this.prisma.staffPermission.upsert({
          where: { key },
          update: {},
          create: { key },
        }),
      ),
    );

    await this.prisma.$transaction([
      this.prisma.staffRolePermission.deleteMany({ where: { roleId } }),
      ...permissions.map((permission) =>
        this.prisma.staffRolePermission.create({
          data: {
            roleId,
            permissionId: permission.id,
          },
        }),
      ),
    ]);

    const updatedRole = await this.prisma.staffRole.findUnique({
      where: { id: roleId },
      include: {
        ...STAFF_ROLE_WITH_PERMISSIONS_SORTED_INCLUDE,
      },
    });

    await this.internal.createAuditLog(
      actorUserId,
      'staffRole.permissions.replace',
      'staffRole',
      roleId,
      this.internal.buildEventAuditChanges(
        'staff role',
        updatedRole ?? role,
        `Replaced permissions for staff role ${role.name}.`,
        {
          permissionKeys: uniqueKeys,
          totalPermissions: uniqueKeys.length,
        },
      ),
    );

    return updatedRole;
  }
}
