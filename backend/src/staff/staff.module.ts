import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  DepartmentsAdminController,
  StaffAdminController,
} from './staff.controller';
import { StaffInternalService } from './staff-internal.service';
import { StaffMetricsService } from './staff-metrics.service';
import { StaffProfilesService } from './staff-profiles.service';
import { StaffRolesService } from './staff-roles.service';
import { StaffService } from './staff.service';
import { StaffTasksService } from './staff-tasks.service';

@Module({
  imports: [AuthModule],
  controllers: [DepartmentsAdminController, StaffAdminController],
  providers: [
    StaffInternalService,
    StaffRolesService,
    StaffProfilesService,
    StaffTasksService,
    StaffMetricsService,
    StaffService,
  ],
  exports: [StaffService],
})
export class StaffModule {}
