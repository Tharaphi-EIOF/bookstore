import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [AuthModule],
  controllers: [LibraryController],
  providers: [LibraryService, PrismaService],
})
export class LibraryModule {}
