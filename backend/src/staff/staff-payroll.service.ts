import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PayrollStatus } from '@prisma/client';

@Injectable()
export class StaffPayrollService {
  constructor(private readonly prisma: PrismaService) {}

  async generateMonthlyPayroll(staffId: string, month: number, year: number) {
    const staff = await this.prisma.staffProfile.findUnique({
      where: { id: staffId },
      include: { user: true },
    });

    if (!staff) {
      throw new NotFoundException('Staff profile not found');
    }

    if (!staff.salary) {
      throw new BadRequestException('Staff member has no salary defined');
    }

    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59);

    const existing = await this.prisma.staffPayroll.findFirst({
      where: {
        staffProfileId: staffId,
        periodStart,
        periodEnd,
      },
    });

    if (existing) {
      throw new BadRequestException('Payroll already exists for this period');
    }

    // Simple calculation: base salary / 12 (assuming annual salary)
    const monthlyAmount = Number(staff.salary) / 12;

    return this.prisma.staffPayroll.create({
      data: {
        staffProfileId: staffId,
        amount: monthlyAmount,
        netAmount: monthlyAmount, // simplified
        periodStart,
        periodEnd,
        status: PayrollStatus.PENDING,
      },
      include: {
        staffProfile: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });
  }

  async listPayrolls(filters: { staffId?: string; status?: PayrollStatus; departmentId?: string }) {
    return this.prisma.staffPayroll.findMany({
      where: {
        ...(filters.staffId ? { staffProfileId: filters.staffId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.departmentId ? { staffProfile: { departmentId: filters.departmentId } } : {}),
      },
      include: {
        staffProfile: {
          include: {
            user: {
              select: { name: true, email: true }
            },
            department: true
          }
        }
      },
      orderBy: { periodStart: 'desc' },
    });
  }

  async getPayroll(id: string) {
    const row = await this.prisma.staffPayroll.findUnique({
      where: { id },
      include: {
        staffProfile: {
          include: {
            user: {
              select: { name: true, email: true }
            },
            department: true
          }
        }
      },
    });
    if (!row) throw new NotFoundException('Payroll not found');
    return row;
  }

  async updatePayroll(id: string, data: { status?: PayrollStatus; bonus?: number; deductions?: number; note?: string }) {
    const existing = await this.getPayroll(id);
    
    const bonus = data.bonus ?? Number(existing.bonus);
    const deductions = data.deductions ?? Number(existing.deductions);
    const amount = Number(existing.amount);
    
    const netAmount = amount + bonus - deductions;

    return this.prisma.staffPayroll.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.status === PayrollStatus.PAID ? { paymentDate: new Date() } : {}),
        bonus,
        deductions,
        netAmount,
        ...(data.note !== undefined ? { note: data.note } : {}),
      },
    });
  }
}
