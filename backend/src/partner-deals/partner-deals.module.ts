import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../database/prisma.service';
import { PartnerDealsController } from './partner-deals.controller';
import { PartnerDealsService } from './partner-deals.service';

@Module({
  imports: [AuthModule],
  controllers: [PartnerDealsController],
  providers: [PartnerDealsService, PrismaService],
})
export class PartnerDealsModule {}
