import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { BookLeadSource, BookLeadStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { BookLeadsService } from './book-leads.service';
import { CreateBookLeadDto } from './dto/create-book-lead.dto';
import {
  BookLeadView,
  BookLeadWorkflowStage,
  ListBookLeadsDto,
} from './dto/list-book-leads.dto';
import { UpdateBookLeadDto } from './dto/update-book-lead.dto';
import { ConvertBookLeadDto } from './dto/convert-book-lead.dto';
import { ImportBookLeadsFromInquiriesDto } from './dto/import-book-leads-from-inquiries.dto';
import { MergeBookLeadsDto } from './dto/merge-book-leads.dto';

@ApiTags('book-leads')
@Controller('book-leads')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class BookLeadsController {
  constructor(private readonly bookLeadsService: BookLeadsService) {}

  @Get()
  @Permissions('finance.reports.view')
  @ApiOperation({
    summary:
      'List non-catalog book leads requested for sourcing or future stocking',
  })
  @ApiQuery({ name: 'status', required: false, enum: BookLeadStatus })
  @ApiQuery({ name: 'stage', required: false, enum: BookLeadWorkflowStage })
  @ApiQuery({ name: 'source', required: false, enum: BookLeadSource })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiQuery({ name: 'author', required: false, type: String })
  @ApiQuery({ name: 'requestedBy', required: false, type: String })
  @ApiQuery({ name: 'assignedTo', required: false, type: String })
  @ApiQuery({ name: 'createdFrom', required: false, type: String })
  @ApiQuery({ name: 'createdTo', required: false, type: String })
  @ApiQuery({ name: 'view', required: false, enum: BookLeadView })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  list(
    @Request() req: { user: { sub: string } },
    @Query() query: ListBookLeadsDto,
  ) {
    return this.bookLeadsService.list(req.user.sub, query);
  }

  @Post()
  @Permissions('finance.reports.view')
  @ApiOperation({ summary: 'Create a new book lead (not yet in sale catalog)' })
  create(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateBookLeadDto,
  ) {
    return this.bookLeadsService.create(req.user.sub, dto);
  }

  @Post('automation/from-inquiries')
  @Permissions('finance.reports.view')
  @ApiOperation({
    summary:
      'Auto-create or update book leads from stock inquiries that are not found in current catalog',
  })
  importFromStockInquiries(
    @Request() req: { user: { sub: string } },
    @Body() dto: ImportBookLeadsFromInquiriesDto,
  ) {
    return this.bookLeadsService.importFromStockInquiries(req.user.sub, dto);
  }

  @Get('duplicates')
  @Permissions('finance.reports.view')
  @ApiOperation({ summary: 'Get duplicate lead groups for merge suggestions' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getDuplicateSuggestions(
    @Request() req: { user: { sub: string } },
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : 100;
    return this.bookLeadsService.getDuplicateSuggestions(
      req.user.sub,
      parsedLimit,
    );
  }

  @Get('demand-summary')
  @Permissions('finance.reports.view')
  @ApiOperation({
    summary:
      'Get demand aggregation, KPI cards, and top requested books/authors for admin dashboard',
  })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getDemandSummary(
    @Request() req: { user: { sub: string } },
    @Query('days') days?: string,
  ) {
    const parsedDays = days ? Number(days) : 90;
    return this.bookLeadsService.getDemandSummary(req.user.sub, parsedDays);
  }

  @Get('restock-candidates')
  @Permissions('finance.reports.view')
  @ApiOperation({
    summary:
      'Suggest catalog restock candidates based on sales + low stock + missing-book demand',
  })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRestockCandidates(
    @Request() req: { user: { sub: string } },
    @Query('days') days?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedDays = days ? Number(days) : 90;
    const parsedLimit = limit ? Number(limit) : 20;
    return this.bookLeadsService.getRestockCandidates(
      req.user.sub,
      parsedDays,
      parsedLimit,
    );
  }

  @Get('partner-pipeline')
  @Permissions('finance.reports.view')
  @ApiOperation({
    summary:
      'Partner/consignment pipeline view from partner pitch leads with projected revenue share',
  })
  getPartnerPipeline(@Request() req: { user: { sub: string } }) {
    return this.bookLeadsService.getPartnerPipeline(req.user.sub);
  }

  @Post('automation/apply-workflow')
  @Permissions('finance.reports.view')
  @ApiOperation({
    summary:
      'Auto-progress lead statuses by configurable demand and confidence rules',
  })
  @ApiQuery({ name: 'promoteThreshold', required: false, type: Number })
  @ApiQuery({ name: 'sourceThreshold', required: false, type: Number })
  applyWorkflowAutomation(
    @Request() req: { user: { sub: string } },
    @Query('promoteThreshold') promoteThreshold?: string,
    @Query('sourceThreshold') sourceThreshold?: string,
  ) {
    return this.bookLeadsService.applyWorkflowAutomation(req.user.sub, {
      promoteThreshold: promoteThreshold ? Number(promoteThreshold) : undefined,
      sourceThreshold: sourceThreshold ? Number(sourceThreshold) : undefined,
    });
  }

  @Patch(':id')
  @Permissions('finance.reports.view')
  @ApiOperation({
    summary: 'Update lead status, assignment, note, and priority',
  })
  update(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: UpdateBookLeadDto,
  ) {
    return this.bookLeadsService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  @Permissions('finance.reports.view')
  @ApiOperation({ summary: 'Move a book lead to bin' })
  remove(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.bookLeadsService.remove(req.user.sub, id);
  }

  @Patch(':id/restore')
  @Permissions('finance.reports.view')
  @ApiOperation({ summary: 'Restore a soft-deleted book lead from bin' })
  restore(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.bookLeadsService.restore(req.user.sub, id);
  }

  @Post(':id/merge')
  @Permissions('finance.reports.view')
  @ApiOperation({ summary: 'Merge duplicate leads into selected target lead' })
  merge(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: MergeBookLeadsDto,
  ) {
    return this.bookLeadsService.mergeLeads(
      req.user.sub,
      id,
      dto.duplicateLeadIds,
    );
  }

  @Post(':id/convert-to-book')
  @Permissions('finance.reports.view')
  @ApiOperation({
    summary: 'Convert book lead into a real catalog book record',
  })
  convertToBook(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: ConvertBookLeadDto,
  ) {
    return this.bookLeadsService.convertToBook(req.user.sub, id, dto);
  }
}
