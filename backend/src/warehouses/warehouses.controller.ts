import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  InventoryOwnershipType,
  PurchaseOrderStatus,
  PurchaseRequestStatus,
  WarehouseAlertStatus,
} from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { SetWarehouseStockDto } from './dto/set-warehouse-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { ReviewPurchaseRequestDto } from './dto/review-purchase-request.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { CreatePurchaseOrdersBatchDto } from './dto/create-purchase-orders-batch.dto';
import { CreateReorderSuggestionRequestsDto } from './dto/create-reorder-suggestion-requests.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

@ApiTags('warehouses')
@Controller('warehouses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  @Permissions('warehouse.view')
  @ApiOperation({ summary: 'List warehouses' })
  @ApiResponse({
    status: 200,
    description: 'Warehouses retrieved successfully',
  })
  listWarehouses() {
    return this.warehousesService.listWarehouses();
  }

  @Get('book-stock-presence')
  @Permissions('warehouse.view')
  @ApiOperation({
    summary:
      'Get per-book warehouse stock presence count (how many active warehouses have a stock row)',
  })
  getBookStockPresence() {
    return this.warehousesService.getBookStockPresence();
  }

  @Get('admin/book-ownership-summary')
  @Permissions('warehouse.view')
  @ApiOperation({
    summary:
      'Get per-book owned vs consignment availability summary for admin inventory decisions',
  })
  getBookOwnershipSummary() {
    return this.warehousesService.getBookOwnershipSummary();
  }

  @Get('admin/inventory-lots')
  @Permissions('warehouse.view')
  @ApiOperation({
    summary:
      'List lot-level inventory with ownership source tracking for audit and operations',
  })
  @ApiQuery({ name: 'bookId', required: false, type: String })
  @ApiQuery({ name: 'warehouseId', required: false, type: String })
  @ApiQuery({ name: 'storeId', required: false, type: String })
  @ApiQuery({
    name: 'ownershipType',
    required: false,
    enum: InventoryOwnershipType,
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listInventoryLots(
    @Query('bookId') bookId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('storeId') storeId?: string,
    @Query('ownershipType') ownershipType?: InventoryOwnershipType,
    @Query('limit') limit?: string,
  ) {
    return this.warehousesService.listInventoryLots({
      bookId,
      warehouseId,
      storeId,
      ownershipType,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('admin/catalog-breakdown')
  @Permissions('finance.reports.view')
  @ApiOperation({
    summary:
      'Get catalog breakdown by author, category, or publisher/vendor for admin dashboards',
  })
  @ApiQuery({
    name: 'groupBy',
    required: false,
    enum: ['author', 'category', 'genre', 'vendor'],
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getCatalogBreakdown(
    @Request() req: { user: { sub: string } },
    @Query('groupBy') groupBy?: 'author' | 'category' | 'genre' | 'vendor',
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : 20;
    return this.warehousesService.getCatalogBreakdown(
      req.user.sub,
      groupBy ?? 'author',
      parsedLimit,
    );
  }

  @Get('admin/author-performance')
  @Permissions('finance.reports.view')
  @ApiOperation({
    summary:
      'Get author-level sales and catalog performance metrics for admin dashboard',
  })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAuthorPerformance(
    @Request() req: { user: { sub: string } },
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('limit') limit?: string,
  ) {
    return this.warehousesService.getAuthorPerformance(req.user.sub, {
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('admin/reorder-suggestions')
  @Permissions('finance.reports.view')
  @ApiOperation({
    summary:
      'Get auto reorder suggestions based on sales velocity and current/pending stock',
  })
  @ApiQuery({ name: 'warehouseId', required: false, type: String })
  @ApiQuery({ name: 'leadTimeDays', required: false, type: Number })
  @ApiQuery({ name: 'coverageDays', required: false, type: Number })
  @ApiQuery({ name: 'minDailySales', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getReorderSuggestions(
    @Request() req: { user: { sub: string } },
    @Query('warehouseId') warehouseId?: string,
    @Query('leadTimeDays') leadTimeDays?: string,
    @Query('coverageDays') coverageDays?: string,
    @Query('minDailySales') minDailySales?: string,
    @Query('limit') limit?: string,
  ) {
    return this.warehousesService.getReorderSuggestions(req.user.sub, {
      warehouseId,
      leadTimeDays: leadTimeDays ? Number(leadTimeDays) : undefined,
      coverageDays: coverageDays ? Number(coverageDays) : undefined,
      minDailySales: minDailySales ? Number(minDailySales) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('admin/reorder-suggestions/create-purchase-requests')
  @Permissions('warehouse.purchase_request.create')
  @ApiOperation({
    summary:
      'Create purchase requests from reorder suggestions for selected warehouse',
  })
  createPurchaseRequestsFromReorderSuggestions(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateReorderSuggestionRequestsDto,
  ) {
    return this.warehousesService.createPurchaseRequestsFromReorderSuggestions(
      req.user.sub,
      dto,
    );
  }

  @Get('admin/restock-improvement')
  @Permissions('finance.reports.view')
  @ApiOperation({
    summary:
      'List out-of-stock and low-stock books with demand signals for restock planning',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getRestockImprovementList(
    @Request() req: { user: { sub: string } },
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : 50;
    return this.warehousesService.getRestockImprovementList(
      req.user.sub,
      parsedLimit,
    );
  }

  @Get('admin/missing-book-demand')
  @Permissions('finance.reports.view')
  @ApiOperation({
    summary:
      'List customer stock inquiries for titles not currently available in the catalog',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMissingBookDemand(
    @Request() req: { user: { sub: string } },
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : 50;
    return this.warehousesService.getMissingBookDemand(
      req.user.sub,
      parsedLimit,
    );
  }

  @Get('admin/purchase-history-summary')
  @Permissions('finance.reports.view')
  @ApiOperation({
    summary:
      'Get purchase and procurement summary within an optional date range',
  })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  getPurchaseHistorySummary(
    @Request() req: { user: { sub: string } },
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.warehousesService.getPurchaseHistorySummary(req.user.sub, {
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });
  }

  @Get('admin/revenue-share-simulation')
  @Permissions('finance.reports.view')
  @ApiOperation({
    summary:
      'Simulate publisher/vendor revenue share for sold books sourced from a vendor',
  })
  @ApiQuery({ name: 'vendorId', required: true, type: String })
  @ApiQuery({ name: 'sharePercent', required: true, type: Number })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  getRevenueShareSimulation(
    @Request() req: { user: { sub: string } },
    @Query('vendorId') vendorId: string,
    @Query('sharePercent') sharePercent: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    if (!vendorId?.trim()) {
      throw new BadRequestException('vendorId is required.');
    }
    const parsedSharePercent = Number(sharePercent);
    return this.warehousesService.getRevenueShareSimulation(req.user.sub, {
      vendorId,
      sharePercent: parsedSharePercent,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
    });
  }

  @Post()
  @Permissions('warehouse.stock.update')
  @ApiOperation({ summary: 'Create warehouse' })
  createWarehouse(@Body() dto: CreateWarehouseDto) {
    return this.warehousesService.createWarehouse(dto);
  }

  @Patch(':id')
  @Permissions('warehouse.stock.update')
  @ApiOperation({ summary: 'Update warehouse' })
  updateWarehouse(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehousesService.updateWarehouse(id, dto);
  }

  @Delete(':id')
  @Permissions('warehouse.stock.update')
  @ApiOperation({ summary: 'Delete warehouse (must be empty)' })
  deleteWarehouse(@Param('id') id: string) {
    return this.warehousesService.deleteWarehouse(id);
  }

  @Get('alerts/low-stock')
  @Permissions('warehouse.view')
  @ApiOperation({ summary: 'List low-stock alerts' })
  @ApiQuery({ name: 'status', required: false, enum: WarehouseAlertStatus })
  listLowStockAlerts(@Query('status') status?: WarehouseAlertStatus) {
    return this.warehousesService.listLowStockAlerts(status);
  }

  @Get('transfers')
  @Permissions('warehouse.view')
  @ApiOperation({ summary: 'List stock transfers' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listTransfers(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : 50;
    return this.warehousesService.listTransfers(parsed);
  }

  @Get('purchase-requests')
  @Permissions('warehouse.purchase_request.view')
  @ApiOperation({ summary: 'List purchase requests' })
  @ApiQuery({ name: 'status', required: false, enum: PurchaseRequestStatus })
  @ApiQuery({ name: 'warehouseId', required: false, type: String })
  listPurchaseRequests(
    @Request() req: { user: { sub: string } },
    @Query('status') status?: PurchaseRequestStatus,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.warehousesService.listPurchaseRequests(req.user.sub, {
      status,
      warehouseId,
    });
  }

  @Get('vendors')
  @Permissions('warehouse.view')
  @ApiOperation({ summary: 'List vendors' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'trashed', 'all'],
  })
  listVendors(
    @Query('activeOnly') activeOnly?: string,
    @Query('status') status?: 'active' | 'trashed' | 'all',
  ) {
    const parsed = activeOnly === undefined ? undefined : activeOnly === 'true';
    return this.warehousesService.listVendors(parsed, status);
  }

  @Post('vendors')
  @Permissions('warehouse.vendor.manage')
  @ApiOperation({ summary: 'Create vendor' })
  createVendor(@Body() dto: CreateVendorDto) {
    return this.warehousesService.createVendor(dto);
  }

  @Patch('vendors/:id')
  @Permissions('warehouse.vendor.manage')
  @ApiOperation({ summary: 'Update vendor' })
  updateVendor(@Param('id') id: string, @Body() dto: UpdateVendorDto) {
    return this.warehousesService.updateVendor(id, dto);
  }

  @Delete('vendors/:id')
  @Permissions('warehouse.vendor.manage')
  @ApiOperation({ summary: 'Delete vendor' })
  deleteVendor(@Param('id') id: string) {
    return this.warehousesService.deleteVendor(id);
  }

  @Patch('vendors/:id/restore')
  @Permissions('warehouse.vendor.manage')
  @ApiOperation({ summary: 'Restore soft-deleted vendor from bin' })
  restoreVendor(@Param('id') id: string) {
    return this.warehousesService.restoreVendor(id);
  }

  @Delete('vendors/:id/permanent')
  @Permissions('warehouse.vendor.manage')
  @ApiOperation({ summary: 'Permanently delete vendor from bin' })
  permanentDeleteVendor(@Param('id') id: string) {
    return this.warehousesService.permanentDeleteVendor(id);
  }

  @Get('purchase-orders')
  @Permissions('warehouse.purchase_order.view')
  @ApiOperation({ summary: 'List purchase orders' })
  @ApiQuery({ name: 'status', required: false, enum: PurchaseOrderStatus })
  @ApiQuery({ name: 'warehouseId', required: false, type: String })
  @ApiQuery({ name: 'vendorId', required: false, type: String })
  listPurchaseOrders(
    @Request() req: { user: { sub: string } },
    @Query('status') status?: PurchaseOrderStatus,
    @Query('warehouseId') warehouseId?: string,
    @Query('vendorId') vendorId?: string,
  ) {
    return this.warehousesService.listPurchaseOrders(req.user.sub, {
      status,
      warehouseId,
      vendorId,
    });
  }

  @Get('purchase-pricing-preview')
  @Permissions('warehouse.purchase_order.view')
  @ApiOperation({
    summary:
      'Get pricing rule used to project retail price from vendor unit cost',
  })
  getPurchasePricingPreview(@Request() req: { user: { sub: string } }) {
    return this.warehousesService.getPurchasePricingPreview(req.user.sub);
  }

  @Post('purchase-orders')
  @Permissions('warehouse.purchase_order.create')
  @ApiOperation({
    summary: 'Create purchase order from approved purchase request',
  })
  createPurchaseOrder(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreatePurchaseOrderDto,
  ) {
    return this.warehousesService.createPurchaseOrder(dto, req.user.sub);
  }

  @Post('purchase-orders/batch')
  @Permissions('warehouse.purchase_order.create')
  @ApiOperation({
    summary: 'Batch create purchase orders from approved purchase requests',
  })
  createPurchaseOrdersBatch(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreatePurchaseOrdersBatchDto,
  ) {
    return this.warehousesService.createPurchaseOrdersBatch(dto, req.user.sub);
  }

  @Patch('purchase-orders/:id')
  @Permissions('warehouse.purchase_order.create')
  @ApiOperation({
    summary: 'Update a draft purchase order before sending or receiving',
  })
  updatePurchaseOrder(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.warehousesService.updatePurchaseOrder(id, dto, req.user.sub);
  }

  @Post('purchase-orders/:id/reorder')
  @Permissions('warehouse.purchase_order.create')
  @ApiOperation({
    summary:
      'Create a new draft purchase order by copying a previous vendor order',
  })
  reorderPurchaseOrder(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.warehousesService.reorderPurchaseOrder(id, req.user.sub);
  }

  @Patch('purchase-orders/:id/receive')
  @Permissions('warehouse.purchase_order.receive')
  @ApiOperation({
    summary: 'Receive stock for purchase order and update inventory',
  })
  receivePurchaseOrder(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseOrderDto,
  ) {
    return this.warehousesService.receivePurchaseOrder(id, dto, req.user.sub);
  }

  @Post('purchase-requests')
  @Permissions('warehouse.purchase_request.create')
  @ApiOperation({ summary: 'Create purchase request' })
  createPurchaseRequest(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreatePurchaseRequestDto,
  ) {
    return this.warehousesService.createPurchaseRequest(dto, req.user.sub);
  }

  @Patch('purchase-requests/:id/submit')
  @Permissions('warehouse.purchase_request.create')
  @ApiOperation({ summary: 'Submit draft purchase request for approval' })
  submitPurchaseRequest(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.warehousesService.submitPurchaseRequest(id, req.user.sub);
  }

  @Patch('purchase-requests/:id/review')
  @Permissions('finance.purchase_request.review')
  @ApiOperation({ summary: 'Finance review purchase request (approve/reject)' })
  reviewPurchaseRequest(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: ReviewPurchaseRequestDto,
  ) {
    return this.warehousesService.reviewPurchaseRequest(id, dto, req.user.sub);
  }

  @Patch('purchase-requests/:id/complete')
  @Permissions('warehouse.purchase_request.complete')
  @ApiOperation({ summary: 'Mark approved purchase request as completed' })
  completePurchaseRequest(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.warehousesService.completePurchaseRequest(id, req.user.sub);
  }

  @Get(':id/stocks')
  @Permissions('warehouse.view')
  @ApiOperation({ summary: 'List stock rows for a warehouse' })
  getWarehouseStocks(@Param('id') id: string) {
    return this.warehousesService.getWarehouseStocks(id);
  }

  @Put(':id/stocks/:bookId')
  @Permissions('warehouse.stock.update')
  @ApiOperation({ summary: 'Set stock for a book in a warehouse' })
  setWarehouseStock(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Param('bookId') bookId: string,
    @Body() dto: SetWarehouseStockDto,
  ) {
    return this.warehousesService.setWarehouseStock(
      id,
      bookId,
      dto,
      req.user.sub,
    );
  }

  @Post('transfer')
  @Permissions('warehouse.transfer')
  @ApiOperation({ summary: 'Transfer stock between warehouses' })
  transferStock(
    @Request() req: { user: { sub: string } },
    @Body() dto: TransferStockDto,
  ) {
    return this.warehousesService.transferStock(dto, req.user.sub);
  }
}
