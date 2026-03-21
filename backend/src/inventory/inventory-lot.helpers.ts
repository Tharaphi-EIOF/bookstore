import {
  BadRequestException,
} from '@nestjs/common';
import {
  InventoryLocationType,
  InventoryLotSourceType,
  InventoryOwnershipType,
  Prisma,
} from '@prisma/client';

type TxClient = Prisma.TransactionClient;

type LocationRef =
  | { warehouseId: string; storeId?: never }
  | { storeId: string; warehouseId?: never };

type ReceiveLotInput = LocationRef & {
  bookId: string;
  quantity: number;
  ownershipType: InventoryOwnershipType;
  sourceType: InventoryLotSourceType;
  purchaseOrderItemId?: string;
  vendorId?: string;
  partnerDealId?: string;
  sourceLotId?: string;
  unitCost?: number | null;
  revenueSharePct?: number | null;
  note?: string | null;
};

type AllocateLotsInput = LocationRef & {
  bookId: string;
  quantity: number;
};

type TransferLotsInput = {
  bookId: string;
  quantity: number;
  from: LocationRef;
  to: LocationRef;
  note?: string | null;
  transferSourceType: InventoryLotSourceType;
};

type AllocationSnapshot = {
  inventoryLotId: string;
  quantity: number;
  ownershipType: InventoryOwnershipType;
  unitCost: Prisma.Decimal | null;
  revenueSharePct: Prisma.Decimal | null;
};

const buildLocationData = (location: LocationRef) => {
  if ('warehouseId' in location) {
    return {
      locationType: InventoryLocationType.WAREHOUSE,
      warehouseId: location.warehouseId,
      storeId: null,
    };
  }

  return {
    locationType: InventoryLocationType.STORE,
    warehouseId: null,
    storeId: location.storeId,
  };
};

const buildLocationWhere = (location: LocationRef) =>
  'warehouseId' in location
    ? {
        locationType: InventoryLocationType.WAREHOUSE,
        warehouseId: location.warehouseId,
      }
    : {
        locationType: InventoryLocationType.STORE,
        storeId: location.storeId,
      };

export const receiveInventoryLot = async (
  tx: TxClient,
  input: ReceiveLotInput,
) => {
  if (input.quantity <= 0) {
    throw new BadRequestException('Inventory lot quantity must be positive.');
  }

  return tx.inventoryLot.create({
    data: {
      bookId: input.bookId,
      ownershipType: input.ownershipType,
      sourceType: input.sourceType,
      purchaseOrderItemId: input.purchaseOrderItemId,
      vendorId: input.vendorId,
      partnerDealId: input.partnerDealId,
      sourceLotId: input.sourceLotId,
      unitCost:
        input.unitCost !== undefined && input.unitCost !== null
          ? input.unitCost
          : null,
      revenueSharePct:
        input.revenueSharePct !== undefined && input.revenueSharePct !== null
          ? input.revenueSharePct
          : null,
      receivedQuantity: input.quantity,
      availableQuantity: input.quantity,
      note: input.note ?? null,
      ...buildLocationData(input),
    },
  });
};

export const allocateInventoryLots = async (
  tx: TxClient,
  input: AllocateLotsInput,
): Promise<AllocationSnapshot[]> => {
  if (input.quantity <= 0) {
    throw new BadRequestException('Allocation quantity must be positive.');
  }

  const availableLots = await tx.inventoryLot.findMany({
    where: {
      bookId: input.bookId,
      availableQuantity: { gt: 0 },
      ...buildLocationWhere(input),
    },
    orderBy: [{ receivedAt: 'asc' }, { createdAt: 'asc' }],
  });

  let remaining = input.quantity;
  const allocations: AllocationSnapshot[] = [];

  for (const lot of availableLots) {
    if (remaining <= 0) break;

    const consumed = Math.min(remaining, lot.availableQuantity);
    if (consumed <= 0) continue;

    await tx.inventoryLot.update({
      where: { id: lot.id },
      data: {
        availableQuantity: {
          decrement: consumed,
        },
      },
    });

    allocations.push({
      inventoryLotId: lot.id,
      quantity: consumed,
      ownershipType: lot.ownershipType,
      unitCost: lot.unitCost,
      revenueSharePct: lot.revenueSharePct,
    });
    remaining -= consumed;
  }

  if (remaining > 0) {
    throw new BadRequestException('Insufficient lot-level inventory available.');
  }

  return allocations;
};

export const transferInventoryLots = async (
  tx: TxClient,
  input: TransferLotsInput,
) => {
  const allocations = await allocateInventoryLots(tx, {
    ...input.from,
    bookId: input.bookId,
    quantity: input.quantity,
  });

  for (const allocation of allocations) {
    const sourceLot = await tx.inventoryLot.findUnique({
      where: { id: allocation.inventoryLotId },
      select: {
        purchaseOrderItemId: true,
        vendorId: true,
        partnerDealId: true,
      },
    });

    await receiveInventoryLot(tx, {
      ...input.to,
      bookId: input.bookId,
      quantity: allocation.quantity,
      ownershipType: allocation.ownershipType,
      sourceType: input.transferSourceType,
      sourceLotId: allocation.inventoryLotId,
      purchaseOrderItemId: sourceLot?.purchaseOrderItemId ?? undefined,
      vendorId: sourceLot?.vendorId ?? undefined,
      partnerDealId: sourceLot?.partnerDealId ?? undefined,
      unitCost:
        allocation.unitCost !== null ? Number(allocation.unitCost) : null,
      revenueSharePct:
        allocation.revenueSharePct !== null
          ? Number(allocation.revenueSharePct)
          : null,
      note: input.note ?? null,
    });
  }

  return allocations;
};
