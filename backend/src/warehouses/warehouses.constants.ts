export const WH_USER_SELECT = {
  id: true,
  name: true,
  email: true,
} as const;

export const WH_BOOK_SELECT = {
  id: true,
  title: true,
  author: true,
} as const;

export const WH_WAREHOUSE_SELECT = {
  id: true,
  name: true,
  code: true,
} as const;

export const PURCHASE_REQUEST_INCLUDE = {
  book: { select: WH_BOOK_SELECT },
  warehouse: { select: WH_WAREHOUSE_SELECT },
  requestedByUser: { select: WH_USER_SELECT },
  approvedByUser: { select: WH_USER_SELECT },
} as const;

export const PURCHASE_ORDER_INCLUDE = {
  vendor: { select: { id: true, code: true, name: true, isActive: true } },
  warehouse: { select: WH_WAREHOUSE_SELECT },
  createdByUser: { select: WH_USER_SELECT },
  approvedByUser: { select: WH_USER_SELECT },
  items: {
    include: {
      book: { select: { id: true, title: true, author: true, price: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  request: {
    select: {
      id: true,
      status: true,
      quantity: true,
      approvedQuantity: true,
    },
  },
} as const;
