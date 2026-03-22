import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import {
  LoyaltyController,
  AdminLoyaltyController,
} from './loyalty.controller';
import { LoyaltyService } from './loyalty.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [LoyaltyController, AdminLoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
