import {
  Body,
  Controller,
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
import { PartnerDealStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CreatePartnerDealDto } from './dto/create-partner-deal.dto';
import { CreatePartnerConsignmentReceiptDto } from './dto/create-partner-consignment-receipt.dto';
import { CreatePartnerSettlementDto } from './dto/create-partner-settlement.dto';
import { PreviewPartnerSettlementDto } from './dto/preview-partner-settlement.dto';
import { UpdatePartnerDealDto } from './dto/update-partner-deal.dto';
import { PartnerDealsService } from './partner-deals.service';

@ApiTags('partner-deals')
@Controller('partner-deals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class PartnerDealsController {
  constructor(private readonly partnerDealsService: PartnerDealsService) {}

  @Get()
  @Permissions('finance.reports.view')
  @ApiOperation({ summary: 'List partner consignment deals' })
  @ApiQuery({ name: 'status', required: false, enum: PartnerDealStatus })
  @ApiQuery({ name: 'q', required: false, type: String })
  list(
    @Request() req: { user: { sub: string } },
    @Query('status') status?: PartnerDealStatus,
    @Query('q') q?: string,
  ) {
    return this.partnerDealsService.list(req.user.sub, { status, q });
  }

  @Post()
  @Permissions('finance.reports.view')
  @ApiOperation({ summary: 'Create partner consignment deal' })
  create(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreatePartnerDealDto,
  ) {
    return this.partnerDealsService.create(req.user.sub, dto);
  }

  @Post(':id/receipts')
  @Permissions('finance.reports.view')
  @ApiOperation({ summary: 'Receive consignment stock for a partner deal' })
  receiveConsignmentStock(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: CreatePartnerConsignmentReceiptDto,
  ) {
    return this.partnerDealsService.receiveConsignmentStock(
      req.user.sub,
      id,
      dto,
    );
  }

  @Patch(':id')
  @Permissions('finance.reports.view')
  @ApiOperation({ summary: 'Update partner consignment deal' })
  update(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: UpdatePartnerDealDto,
  ) {
    return this.partnerDealsService.update(req.user.sub, id, dto);
  }

  @Get(':id/settlements')
  @Permissions('finance.reports.view')
  @ApiOperation({ summary: 'List settlements for partner deal' })
  listSettlements(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.partnerDealsService.listSettlements(req.user.sub, id);
  }

  @Post(':id/settlements')
  @Permissions('finance.reports.view')
  @ApiOperation({ summary: 'Create settlement record for a partner deal' })
  createSettlement(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: CreatePartnerSettlementDto,
  ) {
    return this.partnerDealsService.createSettlement(req.user.sub, id, dto);
  }

  @Get(':id/settlements/preview')
  @Permissions('finance.reports.view')
  @ApiOperation({
    summary:
      'Preview settlement amounts from actual order-item sales in a period',
  })
  previewSettlement(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Query() query: PreviewPartnerSettlementDto,
  ) {
    return this.partnerDealsService.previewSettlement(req.user.sub, id, query);
  }

  @Post(':id/settlements/:settlementId/mark-paid')
  @Permissions('finance.reports.view')
  @ApiOperation({ summary: 'Mark settlement as paid' })
  markSettlementPaid(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Param('settlementId') settlementId: string,
  ) {
    return this.partnerDealsService.markSettlementPaid(
      req.user.sub,
      id,
      settlementId,
    );
  }
}
