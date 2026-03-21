import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../database/prisma.service';
import { WarehousesController } from './warehouses.controller';
import { WarehousesInternalService } from './warehouses-internal.service';
import { WarehousesProcurementService } from './warehouses-procurement.service';
import { WarehousesService } from './warehouses.service';
import { PricingSettingsModule } from '../pricing-settings/pricing-settings.module';
import { WarehousesStockService } from './warehouses-stock.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuthModule, PricingSettingsModule, NotificationsModule],
  controllers: [WarehousesController],
  providers: [
    WarehousesInternalService,
    WarehousesStockService,
    WarehousesProcurementService,
    WarehousesService,
    PrismaService,
  ],
})
export class WarehousesModule {}
