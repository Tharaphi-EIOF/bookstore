import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  DepartmentsAdminController,
  StaffAdminController,
  StaffPayrollAdminController,
} from './staff.controller';
import { StaffPayrollService } from './staff-payroll.service';
import { StaffInternalService } from './staff-internal.service';
import { StaffMetricsService } from './staff-metrics.service';
import { StaffProfilesService } from './staff-profiles.service';
import { StaffRolesService } from './staff-roles.service';
import { StaffService } from './staff.service';
import { StaffTasksService } from './staff-tasks.service';

@Module({
  imports: [AuthModule],
  controllers: [
    DepartmentsAdminController,
    StaffAdminController,
    StaffPayrollAdminController,
  ],
  providers: [
    StaffInternalService,
    StaffRolesService,
    StaffProfilesService,
    StaffTasksService,
    StaffMetricsService,
    StaffPayrollService,
    StaffService,
  ],
  exports: [StaffService],
})
export class StaffModule {}
