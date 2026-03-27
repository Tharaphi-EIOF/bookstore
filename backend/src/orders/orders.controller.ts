import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Permissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { ValidatePromoDto } from './dto/validate-promo.dto';
import { ReturnRequestStatus, StaffTaskStatus } from '@prisma/client';
import { CreateSavedAddressDto } from './dto/create-saved-address.dto';
import { UpdateSavedAddressDto } from './dto/update-saved-address.dto';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { ReviewReturnRequestDto } from './dto/review-return-request.dto';

type AuthenticatedRequest = {
  user: {
    sub: string;
  };
};

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // =========================
  // USER: CREATE ORDER
  // =========================
  @Post()
  @ApiOperation({ summary: 'Create order from cart (checkout)' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Cart empty or insufficient stock' })
  create(@Request() req: AuthenticatedRequest, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.sub, dto);
  }

  @Post('promotions/validate')
  @ApiOperation({ summary: 'Validate promo code against current cart' })
  @ApiResponse({ status: 200, description: 'Promo validation completed' })
  validatePromo(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ValidatePromoDto,
  ) {
    return this.ordersService.validatePromo(req.user.sub, dto.code);
  }

  @Get('checkout-config')
  @ApiOperation({
    summary: 'Get checkout pricing configuration for current user session',
  })
  @ApiResponse({ status: 200, description: 'Checkout configuration loaded' })
  getCheckoutConfig() {
    return this.ordersService.getCheckoutConfig();
  }

  // =========================
  // USER: GET OWN ORDERS
  // =========================
  @Get()
  @ApiOperation({ summary: 'Get user order history' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  findAll(@Request() req: AuthenticatedRequest) {
    return this.ordersService.findAll(req.user.sub);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'List saved checkout addresses for current user' })
  listSavedAddresses(@Request() req: AuthenticatedRequest) {
    return this.ordersService.listSavedAddresses(req.user.sub);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Create a saved checkout address' })
  createSavedAddress(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateSavedAddressDto,
  ) {
    return this.ordersService.createSavedAddress(req.user.sub, dto);
  }

  @Patch('addresses/:id')
  @ApiOperation({ summary: 'Update a saved checkout address' })
  updateSavedAddress(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateSavedAddressDto,
  ) {
    return this.ordersService.updateSavedAddress(req.user.sub, id, dto);
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Delete a saved checkout address' })
  deleteSavedAddress(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.ordersService.deleteSavedAddress(req.user.sub, id);
  }

  // =========================
  // ADMIN: GET ALL ORDERS
  // =========================
  @Get('admin/all')
  @UseGuards(PermissionsGuard)
  @Permissions('finance.reports.view')
  @ApiOperation({ summary: 'Get all orders (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'All orders retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  findAllForAdmin(@Request() req: { user: { sub: string } }) {
    return this.ordersService.findAllForAdmin(req.user.sub);
  }

  @Get('admin/returns')
  @UseGuards(PermissionsGuard)
  @Permissions('finance.reports.view')
  @ApiOperation({ summary: 'List return requests for admin review' })
  listReturnRequestsForAdmin(
    @Request() req: { user: { sub: string } },
    @Query('status') status?: ReturnRequestStatus,
  ) {
    return this.ordersService.listReturnRequestsForAdmin(req.user.sub, status);
  }

  @Patch('admin/returns/:id')
  @UseGuards(PermissionsGuard)
  @Permissions('finance.reports.view')
  @ApiOperation({ summary: 'Review or update a return request' })
  reviewReturnRequest(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: ReviewReturnRequestDto,
  ) {
    return this.ordersService.reviewReturnRequest(id, dto, req.user.sub);
  }

  @Get('warehouse/delivery-tasks')
  @UseGuards(PermissionsGuard)
  @Permissions('warehouse.purchase_order.view')
  @ApiOperation({ summary: 'List warehouse delivery tasks' })
  listWarehouseDeliveryTasks(
    @Request() req: { user: { sub: string } },
    @Query('status') status?: StaffTaskStatus,
  ) {
    return this.ordersService.listWarehouseDeliveryTasks(req.user.sub, status);
  }

  @Post('warehouse/delivery-tasks/:taskId/complete')
  @UseGuards(PermissionsGuard)
  @Permissions('warehouse.purchase_order.receive')
  @ApiOperation({ summary: 'Complete warehouse delivery task' })
  completeWarehouseDeliveryTask(
    @Request() req: { user: { sub: string } },
    @Param('taskId') taskId: string,
  ) {
    return this.ordersService.completeWarehouseDeliveryTask(
      taskId,
      req.user.sub,
    );
  }

  // =========================
  // USER: GET ONE ORDER
  // =========================
  @Get(':id')
  @ApiOperation({ summary: 'Get specific order by ID' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.ordersService.findOne(req.user.sub, id);
  }

  @Post(':id/returns')
  @ApiOperation({ summary: 'Create a return or refund request for an order' })
  createReturnRequest(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CreateReturnRequestDto,
  ) {
    return this.ordersService.createReturnRequest(req.user.sub, id, dto);
  }

  // =========================
  // ADMIN: UPDATE ORDER STATUS
  // =========================
  @Patch(':id/status')
  @UseGuards(PermissionsGuard)
  @Permissions('finance.payout.manage')
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['PENDING', 'CONFIRMED', 'COMPLETED'],
        },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateStatus(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body('status') status: 'PENDING' | 'CONFIRMED' | 'COMPLETED',
  ) {
    return this.ordersService.updateStatus(id, status, req.user.sub);
  }

  // =========================
  // USER: CANCEL OWN ORDER
  // =========================
  @Delete(':id')
  @ApiOperation({ summary: 'Cancel own pending order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({
    status: 400,
    description: 'Only pending orders can be cancelled',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  cancelOrder(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.ordersService.cancelOrder(req.user.sub, id);
  }
}
