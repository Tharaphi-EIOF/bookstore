import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../database/prisma.service';
import { BookLeadsController } from './book-leads.controller';
import { BookLeadsService } from './book-leads.service';

@Module({
  imports: [AuthModule],
  controllers: [BookLeadsController],
  providers: [BookLeadsService, PrismaService],
})
export class BookLeadsModule {}
