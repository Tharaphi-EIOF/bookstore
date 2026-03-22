import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, type StaffStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  STAFF_ASSIGNMENT_WITH_ROLE_INCLUDE,
  STAFF_PROFILE_DETAIL_INCLUDE,
  STAFF_PROFILE_FULL_INCLUDE,
  STAFF_USER_BASIC_SELECT,
  STAFF_USER_WITH_ROLE_SELECT,
} from './staff.constants';
import {
  buildConvertedExistingUserResult,
  buildCreatedNewUserResult,
  throwExistingUserFoundError,
  toStaffProfilePayloadFromCreateDto,
  toStaffProfilePayloadFromHireDto,
} from './staff.accounts';
import { assertDepartmentVisibility } from './staff.access';
import { buildStaffProfilesWhere } from './staff.filters';
import { StaffInternalService } from './staff-internal.service';
import { buildStaffProfileUpdateData } from './staff.updates';
import { CreateStaffProfileDto } from './dto/create-staff-profile.dto';
import { UpdateStaffProfileDto } from './dto/update-staff-profile.dto';
import { HireExistingUserDto } from './dto/hire-existing-user.dto';
import { CreateStaffAccountDto } from './dto/create-staff-account.dto';
import { UpdateStaffAccountAccessDto } from './dto/update-staff-account-access.dto';
import { AssignStaffRoleDto } from './dto/assign-staff-role.dto';

@Injectable()
export class StaffProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly internal: StaffInternalService,
  ) {}

  async createStaffProfile(dto: CreateStaffProfileDto, actorUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await this.internal.ensureDepartmentAndManager(
        tx,
        dto.departmentId,
        dto.managerId,
      );
      return this.internal.createStaffProfileWithRoles(tx, dto, actorUserId);
    });
  }

  async listStaffCandidates(query?: string) {
    const search = query?.trim();
    return this.prisma.user.findMany({
      where: {
        role: Role.USER,
        staffProfile: null,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        ...STAFF_USER_WITH_ROLE_SELECT,
      },
      take: 50,
      orderBy: [{ name: 'asc' }],
    });
  }

  async hireExistingUser(dto: HireExistingUserDto, actorUserId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: dto.userId },
        select: { id: true, role: true },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      await this.internal.ensureDepartmentAndManager(
        tx,
        dto.departmentId,
        dto.managerId,
      );
      await this.internal.ensureRoleIdsExist(tx, dto.roleIds);

      const profile = await this.internal.createStaffProfileWithRoles(
        tx,
        toStaffProfilePayloadFromHireDto(dto),
        actorUserId,
      );
      return {
        mode: 'HIRED_EXISTING_USER',
        userId: dto.userId,
        profile,
      };
    });
  }

  async createStaffAccount(dto: CreateStaffAccountDto, actorUserId?: string) {
    return this.prisma.$transaction(async (tx) => {
      await this.internal.ensureDepartmentAndManager(
        tx,
        dto.departmentId,
        dto.managerId,
      );
      await this.internal.ensureRoleIdsExist(tx, dto.roleIds);

      const normalizedEmail = this.internal.normalizeEmail(dto.email);
      const existingByEmail = await tx.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, email: true, name: true },
      });

      if (existingByEmail) {
        const existingStaff = await tx.staffProfile.findUnique({
          where: { userId: existingByEmail.id },
          select: { id: true },
        });

        if (existingStaff) {
          throw new BadRequestException(
            'This user already has a staff profile.',
          );
        }

        if (!dto.convertExisting) {
          throwExistingUserFoundError(existingByEmail);
        }

        const profile = await this.internal.createStaffProfileWithRoles(
          tx,
          toStaffProfilePayloadFromCreateDto(dto, existingByEmail.id),
          actorUserId,
        );

        return buildConvertedExistingUserResult(existingByEmail, profile);
      }

      const tempPassword = this.internal.generateTemporaryPassword();
      const hashedPassword = await this.internal.hashPassword(tempPassword);

      const user = await tx.user.create({
        data: {
          name: dto.name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role: Role.USER,
        },
        select: STAFF_USER_BASIC_SELECT,
      });

      const profile = await this.internal.createStaffProfileWithRoles(
        tx,
        toStaffProfilePayloadFromCreateDto(dto, user.id),
        actorUserId,
      );

      return buildCreatedNewUserResult(
        user,
        profile,
        dto.sendActivationEmail ?? false,
        tempPassword,
      );
    });
  }

  async listStaffProfiles(
    filters: {
      departmentId?: string;
      status?: StaffStatus;
      roleId?: string;
    },
    actorUserId?: string,
  ) {
    const scopedDepartmentId = await this.internal.resolveScopedDepartmentId(
      actorUserId,
      filters.departmentId,
      { allowHrGlobalView: true },
    );

    return this.prisma.staffProfile.findMany({
      where: buildStaffProfilesWhere(filters, scopedDepartmentId),
      include: {
        ...STAFF_PROFILE_FULL_INCLUDE,
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getStaffProfile(id: string, actorUserId?: string) {
    const profile = await this.prisma.staffProfile.findUnique({
      where: { id },
      include: {
        ...STAFF_PROFILE_DETAIL_INCLUDE,
      },
    });

    if (!profile) {
      throw new NotFoundException('Staff profile not found');
    }

    const actor = await this.internal.getActorContext(actorUserId);
    assertDepartmentVisibility(
      actor,
      profile.departmentId,
      'You can only view staff profiles in your own department.',
    );

    return profile;
  }

  async updateStaffProfile(
    id: string,
    dto: UpdateStaffProfileDto,
    actorUserId?: string,
  ) {
    const existing = await this.prisma.staffProfile.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Staff profile not found');
    }

    if (dto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!department) {
        throw new NotFoundException('Department not found');
      }
    }

    if (dto.managerId) {
      const manager = await this.prisma.staffProfile.findUnique({
        where: { id: dto.managerId },
      });
      if (!manager) {
        throw new NotFoundException('Manager profile not found');
      }
    }

    if (dto.avatarValue || dto.avatarType) {
      await this.prisma.user.update({
        where: { id: existing.userId },
        data: {
          avatarValue: dto.avatarValue,
          avatarType: dto.avatarType,
        },
      });
    }

    const profile = await this.prisma.staffProfile.update({
      where: { id },
      data: buildStaffProfileUpdateData(dto),
      include: {
        user: true,
        department: true,
      },
    });

    await this.internal.createAuditLog(
      actorUserId,
      'staffProfile.update',
      'staffProfile',
      id,
      this.internal.buildUpdateAuditChanges(
        'staff profile',
        existing,
        profile,
        [
          'title',
          'departmentId',
          'managerId',
          'status',
          'employeeCode',
          'dateJoined',
          'birthDate',
          'phoneNumber',
          'personalEmail',
          'homeAddress',
          'emergencyContact',
        ],
        `Updated staff profile ${profile.title}.`,
      ),
    );

    return profile;
  }

  async updateStaffAccountAccess(
    id: string,
    dto: UpdateStaffAccountAccessDto,
    actorUserId?: string,
  ) {
    const actor = await this.prisma.user.findUnique({
      where: { id: actorUserId },
      select: { id: true, role: true },
    });

    this.internal.ensureElevatedAccess(
      actor?.role,
      'Only SUPER_ADMIN can change staff account access.',
    );
    if (actor?.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only SUPER_ADMIN can change staff account access.',
      );
    }

    const profile = await this.prisma.staffProfile.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        user: {
          select: STAFF_USER_WITH_ROLE_SELECT,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Staff profile not found');
    }

    if (profile.user.id === actor.id && dto.role !== profile.user.role) {
      throw new BadRequestException('You cannot change your own account role.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: profile.userId },
      data: { role: dto.role },
      select: STAFF_USER_WITH_ROLE_SELECT,
    });

    await this.internal.createAuditLog(
      actorUserId,
      'staffProfile.accountAccess.update',
      'staffProfile',
      id,
      this.internal.buildEventAuditChanges(
        'staff profile',
        {
          userId: profile.userId,
          user: profile.user,
        },
        `Changed account role for ${profile.user.name} from ${profile.user.role} to ${dto.role}.`,
        {
          fields: [
            {
              field: 'role',
              before: profile.user.role,
              after: dto.role,
            },
          ],
        },
      ),
    );

    return {
      staffProfileId: id,
      user: updatedUser,
    };
  }

  async assignRoleToStaff(
    staffId: string,
    dto: AssignStaffRoleDto,
    actorUserId?: string,
  ) {
    const staff = await this.prisma.staffProfile.findUnique({
      where: { id: staffId },
    });
    if (!staff) {
      throw new NotFoundException('Staff profile not found');
    }

    const role = await this.prisma.staffRole.findUnique({
      where: { id: dto.roleId },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (
      dto.effectiveTo &&
      dto.effectiveFrom &&
      dto.effectiveTo < dto.effectiveFrom
    ) {
      throw new BadRequestException(
        'effectiveTo cannot be before effectiveFrom',
      );
    }

    const assignment = await this.prisma.staffAssignment.create({
      data: {
        staffId,
        roleId: dto.roleId,
        effectiveFrom: dto.effectiveFrom ?? new Date(),
        effectiveTo: dto.effectiveTo,
      },
      include: {
        ...STAFF_ASSIGNMENT_WITH_ROLE_INCLUDE,
      },
    });

    await this.internal.createAuditLog(
      actorUserId,
      'staffAssignment.create',
      'staffAssignment',
      assignment.id,
      this.internal.buildCreateAuditChanges(
        'staff assignment',
        assignment,
        `Assigned role ${assignment.role.name} to staff member ${assignment.staffId}.`,
      ),
    );

    return assignment;
  }

  async removeStaffAssignment(
    staffId: string,
    assignmentId: string,
    actorUserId?: string,
  ) {
    const assignment = await this.prisma.staffAssignment.findFirst({
      where: { id: assignmentId, staffId },
    });

    if (!assignment) {
      throw new NotFoundException('Staff assignment not found');
    }

    const removed = await this.prisma.staffAssignment.delete({
      where: { id: assignmentId },
    });

    await this.internal.createAuditLog(
      actorUserId,
      'staffAssignment.delete',
      'staffAssignment',
      assignmentId,
      this.internal.buildDeleteAuditChanges(
        'staff assignment',
        removed,
        'Removed a staff role assignment.',
      ),
    );

    return removed;
  }

  async listStaffAuditLogs(staffId: string, limit = 50, actorUserId?: string) {
    const profile = await this.prisma.staffProfile.findUnique({
      where: { id: staffId },
    });
    if (!profile) {
      throw new NotFoundException('Staff profile not found');
    }

    const actor = await this.internal.getActorContext(actorUserId);
    assertDepartmentVisibility(
      actor,
      profile.departmentId,
      'You can only view audit logs for staff in your own department.',
    );

    return this.prisma.staffAuditLog.findMany({
      where: {
        OR: [
          { resourceId: staffId },
          {
            resource: 'staffAssignment',
            changes: { path: ['staffId'], equals: staffId },
          },
          {
            resource: 'staffTask',
            changes: { path: ['staffId'], equals: staffId },
          },
        ],
      },
      include: {
        actor: {
          select: STAFF_USER_BASIC_SELECT,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.max(1, Math.min(limit, 200)),
    });
  }
}
