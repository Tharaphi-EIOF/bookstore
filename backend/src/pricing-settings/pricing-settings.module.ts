import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PricingSettingsController } from './pricing-settings.controller';
import { PricingSettingsService } from './pricing-settings.service';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [AuthModule],
  controllers: [PricingSettingsController],
  providers: [PricingSettingsService, PrismaService],
  exports: [PricingSettingsService],
})
export class PricingSettingsModule {}
