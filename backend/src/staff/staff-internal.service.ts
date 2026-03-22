import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, type StaffStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { isElevatedRole } from './staff.access';

export type StaffActorContext = {
  role: Role | undefined;
  staffProfileId: string | undefined;
  departmentId: string | undefined;
  departmentCode: string | undefined;
};

type AuditRecord = Record<string, unknown>;
type AuditFieldChange = {
  field: string;
  before: string;
  after: string;
};

@Injectable()
export class StaffInternalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  toRoleCodePart(value: string) {
    return value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_{2,}/g, '_');
  }

  normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  generateEmployeeCode() {
    const random = randomBytes(3).toString('hex').toUpperCase();
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    return `EMP-${date}-${random}`;
  }

  generateTemporaryPassword() {
    return `Tmp!${randomBytes(6).toString('base64url')}`;
  }

  async hashPassword(password: string) {
    const bcryptRounds = this.configService.get<number>('BCRYPT_ROUNDS', 10);
    return bcrypt.hash(password, bcryptRounds);
  }

  ensureElevatedAccess(role: Role | undefined, message: string) {
    if (!isElevatedRole(role)) {
      throw new ForbiddenException(message);
    }
  }

  async ensureUniqueRoleCode(baseCode: string, excludeRoleId?: string) {
    let candidate = baseCode;
    let suffix = 2;

    while (true) {
      const existing = await this.prisma.staffRole.findFirst({
        where: {
          code: candidate,
          ...(excludeRoleId ? { id: { not: excludeRoleId } } : {}),
        },
        select: { id: true },
      });

      if (!existing) {
        return candidate;
      }

      candidate = `${baseCode}_${suffix}`;
      suffix += 1;
    }
  }

  async getActorContext(actorUserId?: string): Promise<StaffActorContext> {
    if (!actorUserId) {
      return {
        role: undefined,
        staffProfileId: undefined,
        departmentId: undefined,
        departmentCode: undefined,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: actorUserId },
      select: { role: true },
    });

    if (!user) {
      return {
        role: undefined,
        staffProfileId: undefined,
        departmentId: undefined,
        departmentCode: undefined,
      };
    }

    if (isElevatedRole(user.role)) {
      return {
        role: user.role,
        staffProfileId: undefined,
        departmentId: undefined,
        departmentCode: undefined,
      };
    }

    const profile = await this.prisma.staffProfile.findFirst({
      where: {
        userId: actorUserId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        departmentId: true,
        department: {
          select: {
            code: true,
          },
        },
      },
    });

    return {
      role: user.role,
      staffProfileId: profile?.id,
      departmentId: profile?.departmentId,
      departmentCode: profile?.department?.code,
    };
  }

  async resolveScopedDepartmentId(
    actorUserId: string | undefined,
    requestedDepartmentId?: string,
    options?: { allowHrGlobalView?: boolean },
  ) {
    const actor = await this.getActorContext(actorUserId);

    if (isElevatedRole(actor.role)) {
      return requestedDepartmentId;
    }

    if (options?.allowHrGlobalView && actor.departmentCode === 'HR') {
      return requestedDepartmentId;
    }

    if (!actor.departmentId) {
      throw new ForbiddenException(
        'Department-scoped access requires an active staff profile.',
      );
    }

    if (requestedDepartmentId && requestedDepartmentId !== actor.departmentId) {
      throw new ForbiddenException(
        'You can only access resources in your own department.',
      );
    }

    return actor.departmentId;
  }

  async createAuditLog(
    actorUserId: string | undefined,
    action: string,
    resource: string,
    resourceId: string | undefined,
    changes?: Prisma.InputJsonValue,
  ) {
    return this.prisma.staffAuditLog.create({
      data: {
        actorUserId,
        action,
        resource,
        resourceId,
        changes,
      },
    });
  }

  private stringifyAuditValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return 'Not set';
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'number') {
      return Number.isInteger(value) ? `${value}` : value.toFixed(2);
    }
    if (typeof value === 'string') {
      return value.trim() || 'Not set';
    }
    if (Array.isArray(value)) {
      return value.length
        ? `${value.length} item${value.length > 1 ? 's' : ''}`
        : 'None';
    }
    return 'Updated';
  }

  private getAuditPathValue(record: AuditRecord | undefined, path: string) {
    if (!record) return undefined;

    return path.split('.').reduce<unknown>((current, segment) => {
      if (
        current &&
        typeof current === 'object' &&
        !Array.isArray(current) &&
        segment in (current as Record<string, unknown>)
      ) {
        return (current as Record<string, unknown>)[segment];
      }
      return undefined;
    }, record);
  }

  private buildAuditFieldChanges(
    before: AuditRecord | undefined,
    after: AuditRecord | undefined,
    fields: string[],
  ): AuditFieldChange[] {
    return fields
      .map((field) => {
        const beforeValue = this.getAuditPathValue(before, field);
        const afterValue = this.getAuditPathValue(after, field);
        if (JSON.stringify(beforeValue) === JSON.stringify(afterValue)) {
          return null;
        }
        return {
          field,
          before: this.stringifyAuditValue(beforeValue),
          after: this.stringifyAuditValue(afterValue),
        };
      })
      .filter((item): item is AuditFieldChange => Boolean(item));
  }

  private extractAuditSubject(
    resource: string,
    record: AuditRecord | undefined,
  ): string | undefined {
    const candidates = [
      this.getAuditPathValue(record, 'title'),
      this.getAuditPathValue(record, 'name'),
      this.getAuditPathValue(record, 'code'),
      this.getAuditPathValue(record, 'user.name'),
      this.getAuditPathValue(record, 'department.name'),
    ];
    const found = candidates.find(
      (value) => typeof value === 'string' && value.trim().length > 0,
    );
    if (typeof found === 'string') {
      return found.trim();
    }
    return resource;
  }

  private buildAuditHighlights(record: AuditRecord | undefined) {
    if (!record) return [];

    const candidates = [
      { label: 'Name', value: this.getAuditPathValue(record, 'name') },
      { label: 'Title', value: this.getAuditPathValue(record, 'title') },
      { label: 'Status', value: this.getAuditPathValue(record, 'status') },
      {
        label: 'Department',
        value: this.getAuditPathValue(record, 'department.name'),
      },
      { label: 'User', value: this.getAuditPathValue(record, 'user.name') },
      { label: 'Email', value: this.getAuditPathValue(record, 'user.email') },
      {
        label: 'Order ID',
        value:
          this.getAuditPathValue(record, 'linkedOrderId') ??
          this.getAuditPathValue(record, 'metadata.orderId'),
      },
      {
        label: 'Refund',
        value: this.getAuditPathValue(record, 'refundAmount'),
      },
    ];

    return candidates
      .filter(
        (item) =>
          item.value !== undefined && item.value !== null && item.value !== '',
      )
      .slice(0, 4)
      .map((item) => ({
        label: item.label,
        value: this.stringifyAuditValue(item.value),
      }));
  }

  buildCreateAuditChanges(
    resource: string,
    record: AuditRecord,
    summary?: string,
  ) {
    const subject = this.extractAuditSubject(resource, record);
    return {
      mode: 'create',
      subject,
      summary:
        summary ??
        `Created ${resource}${subject && subject !== resource ? ` ${subject}` : ''}.`,
      highlights: this.buildAuditHighlights(record),
      current: record as unknown as Prisma.InputJsonValue,
    } as Prisma.InputJsonObject;
  }

  buildDeleteAuditChanges(
    resource: string,
    record: AuditRecord,
    summary?: string,
  ) {
    const subject = this.extractAuditSubject(resource, record);
    return {
      mode: 'delete',
      subject,
      summary:
        summary ??
        `Removed ${resource}${subject && subject !== resource ? ` ${subject}` : ''}.`,
      highlights: this.buildAuditHighlights(record),
      previous: record as unknown as Prisma.InputJsonValue,
    } as Prisma.InputJsonObject;
  }

  buildUpdateAuditChanges(
    resource: string,
    before: AuditRecord,
    after: AuditRecord,
    trackedFields: string[],
    summary?: string,
  ) {
    const subject =
      this.extractAuditSubject(resource, after) ??
      this.extractAuditSubject(resource, before);
    const fields = this.buildAuditFieldChanges(before, after, trackedFields);
    return {
      mode: 'update',
      subject,
      summary:
        summary ??
        `Updated ${resource}${subject && subject !== resource ? ` ${subject}` : ''}.`,
      highlights: this.buildAuditHighlights(after),
      fields,
      before: before as unknown as Prisma.InputJsonValue,
      after: after as unknown as Prisma.InputJsonValue,
    } as Prisma.InputJsonObject;
  }

  buildEventAuditChanges(
    resource: string,
    record: AuditRecord,
    summary: string,
    extra?: AuditRecord,
  ) {
    const subject = this.extractAuditSubject(resource, record);
    return {
      mode: 'event',
      subject,
      summary,
      highlights: this.buildAuditHighlights(record),
      ...(extra ? { meta: extra as unknown as Prisma.InputJsonValue } : {}),
      current: record as unknown as Prisma.InputJsonValue,
    } as Prisma.InputJsonObject;
  }

  async ensureDepartmentAndManager(
    tx: Prisma.TransactionClient,
    departmentId: string,
    managerId?: string,
  ) {
    const department = await tx.department.findUnique({
      where: { id: departmentId },
      select: { id: true },
    });
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    if (managerId) {
      const manager = await tx.staffProfile.findUnique({
        where: { id: managerId },
        select: { id: true },
      });
      if (!manager) {
        throw new NotFoundException('Manager profile not found');
      }
    }
  }

  async ensureRoleIdsExist(tx: Prisma.TransactionClient, roleIds?: string[]) {
    if (!roleIds || roleIds.length === 0) {
      return;
    }

    const existingRoles = await tx.staffRole.findMany({
      where: { id: { in: roleIds } },
      select: { id: true },
    });

    if (existingRoles.length !== roleIds.length) {
      throw new NotFoundException('One or more roles were not found');
    }
  }

  async createStaffProfileWithRoles(
    tx: Prisma.TransactionClient,
    payload: {
      userId: string;
      departmentId: string;
      employeeCode?: string;
      title: string;
      managerId?: string;
      status?: StaffStatus;
      roleIds?: string[];
      dateJoined?: string | Date;
      birthDate?: string | Date;
      phoneNumber?: string;
      personalEmail?: string;
      homeAddress?: string;
      emergencyContact?: string;
      avatarValue?: string;
      avatarType?: string;
      salary?: number | Prisma.Decimal;
    },
    actorUserId?: string,
  ) {
    const existingStaff = await tx.staffProfile.findUnique({
      where: { userId: payload.userId },
      select: { id: true },
    });
    if (existingStaff) {
      throw new BadRequestException('User already has a staff profile');
    }

    if (payload.avatarValue || payload.avatarType) {
      await tx.user.update({
        where: { id: payload.userId },
        data: {
          avatarValue: payload.avatarValue,
          avatarType: payload.avatarType,
        },
      });
    }

    const profile = await tx.staffProfile.create({
      data: {
        userId: payload.userId,
        departmentId: payload.departmentId,
        employeeCode:
          payload.employeeCode?.trim() || this.generateEmployeeCode(),
        title: payload.title,
        managerId: payload.managerId,
        status: payload.status ?? 'ACTIVE',
        dateJoined: payload.dateJoined
          ? new Date(payload.dateJoined)
          : undefined,
        birthDate: payload.birthDate ? new Date(payload.birthDate) : undefined,
        phoneNumber: payload.phoneNumber,
        personalEmail: payload.personalEmail,
        homeAddress: payload.homeAddress,
        emergencyContact: payload.emergencyContact,
        salary: payload.salary,
      },
      include: {
        user: true,
        department: true,
      },
    });

    if (payload.roleIds?.length) {
      await tx.staffAssignment.createMany({
        data: payload.roleIds.map((roleId) => ({
          staffId: profile.id,
          roleId,
        })),
      });
    }

    await this.createAuditLog(
      actorUserId,
      'staffProfile.create',
      'staffProfile',
      profile.id,
      {
        userId: payload.userId,
        departmentId: payload.departmentId,
        title: payload.title,
        roleIds: payload.roleIds ?? [],
      } as unknown as Prisma.InputJsonValue,
    );

    return profile;
  }
}
