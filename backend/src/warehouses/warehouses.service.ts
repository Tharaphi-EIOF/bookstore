import { Injectable } from '@nestjs/common';
import {
  PurchaseOrderStatus,
  PurchaseRequestStatus,
  WarehouseAlertStatus,
} from '@prisma/client';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CreatePurchaseOrdersBatchDto } from './dto/create-purchase-orders-batch.dto';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { ReviewPurchaseRequestDto } from './dto/review-purchase-request.dto';
import { SetWarehouseStockDto } from './dto/set-warehouse-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { CreateReorderSuggestionRequestsDto } from './dto/create-reorder-suggestion-requests.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { WarehousesProcurementService } from './warehouses-procurement.service';
import { WarehousesStockService } from './warehouses-stock.service';

@Injectable()
export class WarehousesService {
  constructor(
    private readonly stockService: WarehousesStockService,
    private readonly procurementService: WarehousesProcurementService,
  ) {}

  listWarehouses() {
    return this.stockService.listWarehouses();
  }

  getBookStockPresence() {
    return this.stockService.getBookStockPresence();
  }

  createWarehouse(dto: CreateWarehouseDto) {
    return this.stockService.createWarehouse(dto);
  }

  updateWarehouse(warehouseId: string, dto: UpdateWarehouseDto) {
    return this.stockService.updateWarehouse(warehouseId, dto);
  }

  deleteWarehouse(warehouseId: string) {
    return this.stockService.deleteWarehouse(warehouseId);
  }

  getWarehouseStocks(warehouseId: string) {
    return this.stockService.getWarehouseStocks(warehouseId);
  }

  listInventoryLots(filters?: {
    bookId?: string;
    warehouseId?: string;
    storeId?: string;
    ownershipType?: 'OWNED' | 'CONSIGNMENT';
    limit?: number;
  }) {
    return this.stockService.listInventoryLots(filters);
  }

  setWarehouseStock(
    warehouseId: string,
    bookId: string,
    dto: SetWarehouseStockDto,
    actorUserId?: string,
  ) {
    return this.stockService.setWarehouseStock(
      warehouseId,
      bookId,
      dto,
      actorUserId,
    );
  }

  transferStock(dto: TransferStockDto, actorUserId?: string) {
    return this.stockService.transferStock(dto, actorUserId);
  }

  listLowStockAlerts(status: WarehouseAlertStatus = WarehouseAlertStatus.OPEN) {
    return this.stockService.listLowStockAlerts(status);
  }

  listTransfers(limit = 50) {
    return this.stockService.listTransfers(limit);
  }

  getPurchasePricingPreview(actorUserId: string) {
    return this.procurementService.getPurchasePricingPreview(actorUserId);
  }

  listPurchaseRequests(
    actorUserId: string,
    filters?: { status?: PurchaseRequestStatus; warehouseId?: string },
  ) {
    return this.procurementService.listPurchaseRequests(actorUserId, filters);
  }

  listVendors(
    activeOnly?: boolean,
    status: 'active' | 'trashed' | 'all' = 'active',
  ) {
    return this.procurementService.listVendors(activeOnly, status);
  }

  createVendor(dto: CreateVendorDto) {
    return this.procurementService.createVendor(dto);
  }

  updateVendor(vendorId: string, dto: UpdateVendorDto) {
    return this.procurementService.updateVendor(vendorId, dto);
  }

  deleteVendor(vendorId: string) {
    return this.procurementService.deleteVendor(vendorId);
  }

  restoreVendor(vendorId: string) {
    return this.procurementService.restoreVendor(vendorId);
  }

  permanentDeleteVendor(vendorId: string) {
    return this.procurementService.permanentDeleteVendor(vendorId);
  }

  listPurchaseOrders(
    actorUserId: string,
    filters?: {
      status?: PurchaseOrderStatus;
      warehouseId?: string;
      vendorId?: string;
    },
  ) {
    return this.procurementService.listPurchaseOrders(actorUserId, filters);
  }

  createPurchaseOrder(dto: CreatePurchaseOrderDto, actorUserId: string) {
    return this.procurementService.createPurchaseOrder(dto, actorUserId);
  }

  createPurchaseOrdersBatch(
    dto: CreatePurchaseOrdersBatchDto,
    actorUserId: string,
  ) {
    return this.procurementService.createPurchaseOrdersBatch(dto, actorUserId);
  }

  updatePurchaseOrder(
    purchaseOrderId: string,
    dto: UpdatePurchaseOrderDto,
    actorUserId: string,
  ) {
    return this.procurementService.updatePurchaseOrder(
      purchaseOrderId,
      dto,
      actorUserId,
    );
  }

  receivePurchaseOrder(
    purchaseOrderId: string,
    dto: ReceivePurchaseOrderDto,
    actorUserId: string,
  ) {
    return this.procurementService.receivePurchaseOrder(
      purchaseOrderId,
      dto,
      actorUserId,
    );
  }

  createPurchaseRequest(dto: CreatePurchaseRequestDto, actorUserId: string) {
    return this.procurementService.createPurchaseRequest(dto, actorUserId);
  }

  submitPurchaseRequest(requestId: string, actorUserId: string) {
    return this.procurementService.submitPurchaseRequest(
      requestId,
      actorUserId,
    );
  }

  reviewPurchaseRequest(
    requestId: string,
    dto: ReviewPurchaseRequestDto,
    actorUserId: string,
  ) {
    return this.procurementService.reviewPurchaseRequest(
      requestId,
      dto,
      actorUserId,
    );
  }

  completePurchaseRequest(requestId: string, actorUserId: string) {
    return this.procurementService.completePurchaseRequest(
      requestId,
      actorUserId,
    );
  }

  getCatalogBreakdown(
    actorUserId: string,
    groupBy: 'author' | 'category' | 'genre' | 'vendor' = 'author',
    limit = 20,
  ) {
    return this.procurementService.getCatalogBreakdown(
      actorUserId,
      groupBy,
      limit,
    );
  }

  getAuthorPerformance(
    actorUserId: string,
    filters?: { fromDate?: Date; toDate?: Date; limit?: number },
  ) {
    return this.procurementService.getAuthorPerformance(actorUserId, filters);
  }

  getReorderSuggestions(
    actorUserId: string,
    params?: {
      warehouseId?: string;
      leadTimeDays?: number;
      coverageDays?: number;
      minDailySales?: number;
      limit?: number;
    },
  ) {
    return this.procurementService.getReorderSuggestions(actorUserId, params);
  }

  createPurchaseRequestsFromReorderSuggestions(
    actorUserId: string,
    dto: CreateReorderSuggestionRequestsDto,
  ) {
    return this.procurementService.createPurchaseRequestsFromReorderSuggestions(
      actorUserId,
      dto,
    );
  }

  reorderPurchaseOrder(purchaseOrderId: string, actorUserId: string) {
    return this.procurementService.reorderPurchaseOrder(
      purchaseOrderId,
      actorUserId,
    );
  }

  getRestockImprovementList(actorUserId: string, limit = 50) {
    return this.procurementService.getRestockImprovementList(
      actorUserId,
      limit,
    );
  }

  getMissingBookDemand(actorUserId: string, limit = 50) {
    return this.procurementService.getMissingBookDemand(actorUserId, limit);
  }

  getPurchaseHistorySummary(
    actorUserId: string,
    filters?: { fromDate?: Date; toDate?: Date },
  ) {
    return this.procurementService.getPurchaseHistorySummary(
      actorUserId,
      filters,
    );
  }

  getRevenueShareSimulation(
    actorUserId: string,
    params: {
      vendorId: string;
      sharePercent: number;
      fromDate?: Date;
      toDate?: Date;
    },
  ) {
    return this.procurementService.getRevenueShareSimulation(
      actorUserId,
      params,
    );
  }
}
