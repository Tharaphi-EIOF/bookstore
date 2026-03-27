import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { BooksModule } from './books/books.module';
import { UsersModule } from './users/users.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { LibraryModule } from './library/library.module';
import { ContactModule } from './contact/contact.module';
import { ReadingModule } from './reading/reading.module';
import { BlogsModule } from './blogs/blogs.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { StaffModule } from './staff/staff.module';
import { NotificationsModule } from './notifications/notifications.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { PromotionsModule } from './promotions/promotions.module';
import { StoresModule } from './stores/stores.module';
import { PricingSettingsModule } from './pricing-settings/pricing-settings.module';
import { BookLeadsModule } from './book-leads/book-leads.module';
import { PartnerDealsModule } from './partner-deals/partner-deals.module';
import { LoyaltyModule } from './loyalty/loyalty.module';

import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    // Uploaded media is served directly by Nest while API routes continue to live under `/api`.
    ServeStaticModule.forRoot({
      rootPath: join(
        process.cwd(),
        process.cwd().endsWith('backend') ? 'uploads' : 'backend/uploads',
      ),
      serveRoot: '/uploads',
      exclude: ['/api', '/api/*path'],
    }),
    // Core platform modules first.
    ConfigModule,
    DatabaseModule,
    // Auth and customer-facing commerce flows.
    AuthModule,
    BooksModule,
    UsersModule,
    CartModule,
    OrdersModule,
    ReviewsModule,
    LibraryModule,
    ContactModule,
    ReadingModule,
    BlogsModule,
    // Internal operations and staff tooling.
    WarehousesModule,
    StaffModule,
    NotificationsModule,
    InquiriesModule,
    PromotionsModule,
    StoresModule,
    PricingSettingsModule,
    BookLeadsModule,
    PartnerDealsModule,
    LoyaltyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
