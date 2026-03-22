import type { Order } from '@/services/orders'

export type AdminOrderSortKey =
  | 'createdAt'
  | 'orderId'
  | 'customer'
  | 'location'
  | 'payment'
  | 'totalPrice'
  | 'items'
  | 'status'

export type VisibleOrderColumns = {
  rank: boolean
  orderId: boolean
  customer: boolean
  location: boolean
  payment: boolean
  date: boolean
  items: boolean
  total: boolean
  status: boolean
}

export const ORDER_COLUMN_OPTIONS: Array<{ key: keyof VisibleOrderColumns; label: string }> = [
  { key: 'rank', label: '#' },
  { key: 'orderId', label: 'Order ID' },
  { key: 'customer', label: 'Customer' },
  { key: 'location', label: 'Delivery Location' },
  { key: 'payment', label: 'Payment' },
  { key: 'date', label: 'Date' },
  { key: 'items', label: 'Items' },
  { key: 'total', label: 'Total' },
  { key: 'status', label: 'Status' },
]

export const isOrderStatusFilter = (value: string | null) =>
  value === 'all'
  || value === 'PENDING'
  || value === 'CONFIRMED'
  || value === 'COMPLETED'
  || value === 'CANCELLED'

export const getCustomerSortValue = (order: Order) =>
  `${order.user?.name || ''} ${order.user?.email || ''}`.trim().toLowerCase()

export const getVisibleOrderCode = (order: Order) => order.id.slice(-8).toUpperCase()

export const getLocationSortValue = (order: Order) => {
  if (order.deliveryType === 'STORE_PICKUP' && order.pickupStore) {
    return [order.pickupStore.name, order.pickupStore.city, order.pickupStore.state]
      .filter(Boolean)
      .join(', ')
      .toLowerCase()
  }

  return [
    order.shippingAddress,
    order.shippingCity,
    order.shippingState,
    order.shippingZipCode,
    order.shippingCountry,
  ]
    .filter(Boolean)
    .join(', ')
    .toLowerCase()
}

export const getPaymentSortValue = (order: Order) => (order.paymentProvider || '').toLowerCase()

export const statusChipTone = (status: Order['status']) => {
  if (status === 'COMPLETED') return 'bg-green-100 text-green-800 dark:bg-emerald-900/40 dark:text-emerald-200'
  if (status === 'CONFIRMED') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
  if (status === 'PENDING') return 'bg-yellow-100 text-yellow-800 dark:bg-amber-900/40 dark:text-amber-200'
  return 'bg-red-100 text-red-800 dark:bg-rose-900/40 dark:text-rose-200'
}

export const paymentProviderLabel = (order: Order) => order.paymentProvider || 'Not provided'

export const orderLocationLabel = (order: Order) => {
  if (order.deliveryType === 'STORE_PICKUP' && order.pickupStore) {
    return [order.pickupStore.name, order.pickupStore.city, order.pickupStore.state]
      .filter(Boolean)
      .join(', ')
  }
  return [
    order.shippingAddress,
    order.shippingCity,
    order.shippingState,
    order.shippingZipCode,
    order.shippingCountry,
  ]
    .filter(Boolean)
    .join(', ') || 'No shipping address captured'
}

export const returnStatusTone = (status: NonNullable<Order['returnRequests']>[number]['status']) => {
  if (status === 'APPROVED' || status === 'REFUNDED' || status === 'CLOSED') {
    return 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'
  }
  if (status === 'REJECTED') {
    return 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200'
  }
  return 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200'
}
