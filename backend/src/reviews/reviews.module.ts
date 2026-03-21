import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import {
  ReviewsController,
  ReviewsManagementController,
} from './reviews.controller';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [ReviewsController, ReviewsManagementController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
