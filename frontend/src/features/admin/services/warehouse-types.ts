export type WarehouseAlertStatus = 'OPEN' | 'RESOLVED'
export type PurchaseRequestStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
export type PurchaseOrderStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CLOSED' | 'CANCELLED'

export interface Warehouse {
  id: string
  name: string
  code: string
  city: string
  state: string
  address?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    stocks: number
    alerts: number
  }
}

export interface WarehouseStockRow {
  id: string
  warehouseId: string
  bookId: string
  stock: number
  lowStockThreshold: number
  createdAt: string
  updatedAt: string
  book: {
    id: string
    title: string
    author: string
    isbn: string
    stock: number
  }
}

export interface WarehouseTransfer {
  id: string
  bookId: string
  fromWarehouseId: string
  toWarehouseId: string
  quantity: number
  note?: string | null
  createdByUserId?: string | null
  createdAt: string
  book: {
    id: string
    title: string
  }
  fromWarehouse: Warehouse
  toWarehouse: Warehouse
}

export interface WarehouseAlert {
  id: string
  warehouseId: string
  bookId: string
  stock: number
  threshold: number
  status: WarehouseAlertStatus
  createdAt: string
  resolvedAt?: string | null
  warehouse: Warehouse
  book: {
    id: string
    title: string
  }
}

export interface PurchaseRequest {
  id: string
  bookId: string
  warehouseId: string
  requestedByUserId: string
  quantity: number
  estimatedCost?: number | null
  approvedQuantity?: number | null
  approvedCost?: number | null
  reviewNote?: string | null
  status: PurchaseRequestStatus
  approvedByUserId?: string | null
  purchaseOrderId?: string | null
  approvedAt?: string | null
  completedAt?: string | null
  createdAt: string
  updatedAt: string
  book: {
    id: string
    title: string
    author: string
  }
  warehouse: {
    id: string
    name: string
    code: string
  }
  requestedByUser: {
    id: string
    name: string
    email: string
  }
  approvedByUser?: {
    id: string
    name: string
    email: string
  } | null
}

export interface Vendor {
  id: string
  code: string
  name: string
  contactName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  isActive: boolean
  deletedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrderItem {
  id: string
  purchaseOrderId: string
  bookId: string
  orderedQuantity: number
  receivedQuantity: number
  unitCost?: number | null
  book: {
    id: string
    title: string
    author: string
    price: number | string
  }
}

export interface PurchasePricingPreviewConfig {
  applyPricingOnReceive: boolean
  vendorMarkupType: 'PERCENT' | 'FIXED'
  vendorMarkupValue: number
}

export interface PurchaseOrder {
  id: string
  vendorId: string
  warehouseId: string
  status: PurchaseOrderStatus
  createdByUserId: string
  approvedByUserId?: string | null
  expectedAt?: string | null
  sentAt?: string | null
  receivedAt?: string | null
  notes?: string | null
  totalCost?: number | null
  createdAt: string
  updatedAt: string
  vendor: Pick<Vendor, 'id' | 'code' | 'name' | 'isActive'>
  warehouse: Pick<Warehouse, 'id' | 'code' | 'name'>
  createdByUser: { id: string; name: string; email: string }
  approvedByUser?: { id: string; name: string; email: string } | null
  items: PurchaseOrderItem[]
  request?: {
    id: string
    status: PurchaseRequestStatus
    quantity: number
    approvedQuantity?: number | null
  } | null
}

export interface BookStockPresenceItem {
  bookId: string
  warehouseCount: number
}

export interface BookStockPresenceResponse {
  totalWarehouses: number
  byBook: BookStockPresenceItem[]
}

export interface AuthorPerformanceBook {
  bookId: string
  title: string
  author: string
  quantity: number
}

export interface AuthorPerformanceItem {
  author: string
  totalTitles: number
  titlesSold: number
  soldQty: number
  revenue: number
  outOfStockTitles: number
  topBooks: AuthorPerformanceBook[]
}

export interface AuthorPerformanceResponse {
  filters: {
    fromDate?: string | null
    toDate?: string | null
    limit: number
  }
  items: AuthorPerformanceItem[]
}

export interface CatalogBreakdownItem {
  key: string
  totalBooks: number
  totalStock: number
  outOfStockBooks: number
  books: Array<{
    id: string
    title: string
    author?: string
    stock: number
    categories?: string[]
    genres?: string[]
    vendorName?: string
  }>
}

export interface CatalogBreakdownResponse {
  groupBy: 'author' | 'category' | 'genre' | 'vendor'
  items: CatalogBreakdownItem[]
}

export interface RestockImprovementItem {
  bookId: string
  title: string
  author: string
  categories: string[]
  stock: number
  stockStatus: 'OUT_OF_STOCK' | 'LOW_STOCK'
  wishlistCount: number
  cartDemand: number
  soldLast30Days: number
  pendingPurchaseQty: number
  shortageSignal: number
}

export interface RestockImprovementResponse {
  items: RestockImprovementItem[]
}

export interface MissingBookDemandItem {
  inquiryId: string
  subject: string
  latestMessage: string
  status: string
  priority: string
  requestedBy: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  possibleMatches: Array<{
    id: string
    title: string
    author: string
    stock: number
  }>
  isLikelyMissingFromCatalog: boolean
}

export interface MissingBookDemandResponse {
  totalOpenStockInquiries: number
  likelyMissingCount: number
  items: MissingBookDemandItem[]
}

export interface PurchaseHistorySummaryResponse {
  filters: {
    fromDate?: string | null
    toDate?: string | null
  }
  sales: {
    orderCount: number
    subtotal: number
    discount: number
    revenue: number
    byStatus: Array<{
      status: string
      count: number
    }>
    topBooks: Array<{
      bookId: string
      title: string
      author: string
      soldQty: number
      grossSales: number
    }>
  }
  procurement: {
    purchaseOrderCount: number
    totalCost: number
    topVendors: Array<{
      vendorId: string
      vendorName: string
      vendorCode: string
      orderCount: number
      totalCost: number
    }>
  }
}

export interface ReorderSuggestionItem {
  bookId: string
  title: string
  author: string
  stock: number
  sold30Days: number
  dailySales: number
  pendingPurchaseQty: number
  targetStock: number
  suggestedQuantity: number
  shortage: number
}

export interface ReorderSuggestionResponse {
  filters: {
    warehouseId?: string | null
    leadTimeDays: number
    coverageDays: number
    minDailySales: number
    limit: number
  }
  items: ReorderSuggestionItem[]
}
