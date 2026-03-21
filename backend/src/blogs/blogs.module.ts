import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { BlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [BlogsController],
  providers: [BlogsService],
})
export class BlogsModule {}
