import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UploadController } from './upload.controller';

@Module({
  imports: [AuthModule],
  providers: [UsersService],
  controllers: [UsersController, UploadController],
})
export class UsersModule {}
