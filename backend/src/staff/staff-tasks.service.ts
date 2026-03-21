import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  StaffTaskStatus,
  type StaffTaskPriority,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { STAFF_TASK_WITH_STAFF_INCLUDE } from './staff.constants';
import {
  assertSameDepartmentAccess,
  assertStaffFilterScoped,
  isElevatedRole,
} from './staff.access';
import { buildTaskWhere } from './staff.filters';
import { StaffInternalService } from './staff-internal.service';
import { extractLinkedOrderId } from './staff.tasks';
import { buildStaffTaskUpdateData } from './staff.updates';
import { CreateStaffTaskDto } from './dto/create-staff-task.dto';
import { UpdateStaffTaskDto } from './dto/update-staff-task.dto';

@Injectable()
export class StaffTasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly internal: StaffInternalService,
  ) {}

  async createTask(dto: CreateStaffTaskDto, actorUserId?: string) {
    const staff = await this.prisma.staffProfile.findUnique({
      where: { id: dto.staffId },
    });
    if (!staff) {
      throw new NotFoundException('Staff profile not found');
    }

    const actor = await this.internal.getActorContext(actorUserId);
    if (!isElevatedRole(actor.role)) {
      assertSameDepartmentAccess(
        actor.departmentId,
        staff.departmentId,
        'You can only create tasks for staff in your own department.',
      );
    }

    const task = await this.prisma.staffTask.create({
      data: {
        staffId: dto.staffId,
        type: dto.type,
        status: dto.status,
        priority: dto.priority,
        metadata: dto.metadata as Prisma.InputJsonValue | undefined,
        completedAt: dto.completedAt,
      },
      include: {
        ...STAFF_TASK_WITH_STAFF_INCLUDE,
      },
    });

    await this.internal.createAuditLog(
      actorUserId,
      'staffTask.create',
      'staffTask',
      task.id,
      this.internal.buildCreateAuditChanges(
        'staff task',
        task,
        `Created staff task ${task.type}.`,
      ),
    );

    return task;
  }

  async updateTask(id: string, dto: UpdateStaffTaskDto, actorUserId?: string) {
    const existing = await this.prisma.staffTask.findUnique({
      where: { id },
      include: {
        staff: {
          select: { departmentId: true },
        },
      },
    });
    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    const actor = await this.internal.getActorContext(actorUserId);
    if (!isElevatedRole(actor.role)) {
      assertSameDepartmentAccess(
        actor.departmentId,
        existing.staff.departmentId,
        'You can only update tasks in your own department.',
      );
    }

    if (dto.staffId) {
      const staff = await this.prisma.staffProfile.findUnique({
        where: { id: dto.staffId },
      });
      if (!staff) {
        throw new NotFoundException('Staff profile not found');
      }
      if (!isElevatedRole(actor.role)) {
        assertSameDepartmentAccess(
          actor.departmentId,
          staff.departmentId,
          'You can only reassign tasks within your own department.',
        );
      }
    }

    const task = await this.prisma.staffTask.update({
      where: { id },
      data: buildStaffTaskUpdateData(dto),
      include: {
        ...STAFF_TASK_WITH_STAFF_INCLUDE,
      },
    });

    await this.internal.createAuditLog(
      actorUserId,
      'staffTask.update',
      'staffTask',
      id,
      this.internal.buildUpdateAuditChanges(
        'staff task',
        existing as unknown as Record<string, unknown>,
        task,
        ['type', 'status', 'priority', 'staffId', 'completedAt'],
        `Updated staff task ${task.type}.`,
      ),
    );

    return task;
  }

  async completeTask(id: string, actorUserId?: string) {
    const task = await this.prisma.staffTask.findUnique({
      where: { id },
      include: {
        staff: {
          select: {
            departmentId: true,
          },
        },
      },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const actor = await this.internal.getActorContext(actorUserId);
    if (!isElevatedRole(actor.role)) {
      assertSameDepartmentAccess(
        actor.departmentId,
        task.staff.departmentId,
        'You can only complete tasks in your own department.',
      );
    }

    const linkedOrderId = extractLinkedOrderId(task.metadata);

    const completed = await this.prisma.$transaction(async (tx) => {
      const updatedTask = await tx.staffTask.update({
        where: { id },
        data: {
          status: StaffTaskStatus.COMPLETED,
          completedAt: new Date(),
        },
        include: {
          ...STAFF_TASK_WITH_STAFF_INCLUDE,
        },
      });

      if (linkedOrderId) {
        const order = await tx.order.findUnique({
          where: { id: linkedOrderId },
          select: { id: true, status: true },
        });

        if (!order) {
          throw new NotFoundException(
            'Linked order for this delivery task was not found.',
          );
        }
        if (String(order.status) !== 'CONFIRMED') {
          throw new BadRequestException(
            'Linked order must be CONFIRMED before delivery can be completed.',
          );
        }

        await tx.order.update({
          where: { id: linkedOrderId },
          data: { status: 'COMPLETED' },
        });
      }

      return updatedTask;
    });

    await this.internal.createAuditLog(
      actorUserId,
      'staffTask.complete',
      'staffTask',
      id,
      this.internal.buildEventAuditChanges(
        'staff task',
        {
          ...completed,
          linkedOrderId,
        },
        `Completed staff task ${completed.type}.`,
      ),
    );

    return completed;
  }

  async listTasks(
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
    const scopedDepartmentId = await this.internal.resolveScopedDepartmentId(
      actorUserId,
      filters.departmentId,
    );
    const actor = await this.internal.getActorContext(actorUserId);

    if (filters.staffId && !isElevatedRole(actor.role)) {
      const targetStaff = await this.prisma.staffProfile.findUnique({
        where: { id: filters.staffId },
        select: { id: true, departmentId: true },
      });
      assertStaffFilterScoped(
        actor.role,
        !!targetStaff && targetStaff.departmentId === scopedDepartmentId,
        'You can only access tasks in your own department.',
      );
    }

    return this.prisma.staffTask.findMany({
      where: buildTaskWhere(filters, scopedDepartmentId),
      include: {
        ...STAFF_TASK_WITH_STAFF_INCLUDE,
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }
}
