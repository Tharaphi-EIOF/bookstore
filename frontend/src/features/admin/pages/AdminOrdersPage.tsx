import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, ChevronDown, Clock3, ExternalLink, MapPin, Phone, Search } from 'lucide-react'
import {
  useAdminOrders,
  useAdminReturnRequests,
  useReviewReturnRequest,
  useUpdateOrderStatus,
  type Order,
} from '@/services/orders'
import Skeleton from '@/components/ui/Skeleton'
import ColumnVisibilityMenu from '@/components/admin/ColumnVisibilityMenu'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'
import AdminFilterCard from '@/components/admin/AdminFilterCard'
import AdminNotice from '@/components/admin/AdminNotice'
import AdminPageIntro from '@/components/admin/AdminPageIntro'
import AdminTableCard from '@/components/admin/AdminTableCard'
import AdminPaginationFooter from '@/components/admin/AdminPaginationFooter'
import { getErrorMessage } from '@/lib/api'
import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/store/auth.store'
import { Link, useSearchParams } from 'react-router-dom'
import { resolveMediaUrl } from '@/lib/media'

const isOrderStatusFilter = (value: string | null) =>
  value === 'all' ||
  value === 'PENDING' ||
  value === 'CONFIRMED' ||
  value === 'COMPLETED' ||
  value === 'CANCELLED'

const AdminOrdersPage = () => {
  const user = useAuthStore((state) => state.user)
  const canManagePayouts =
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    hasPermission(user?.permissions, 'finance.payout.manage')
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('q') ?? searchParams.get('orderId') ?? '',
  )
  const [customerTerm, setCustomerTerm] = useState(searchParams.get('customer') ?? '')
  const [locationTerm, setLocationTerm] = useState(searchParams.get('location') ?? '')
  const [statusFilter, setStatusFilter] = useState(
    isOrderStatusFilter(searchParams.get('status')) ? (searchParams.get('status') as string) : 'all',
  )
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') ?? '')
  const [dateTo, setDateTo] = useState(searchParams.get('to') ?? '')
  const [minValue, setMinValue] = useState(searchParams.get('min') ?? '')
  const [maxValue, setMaxValue] = useState(searchParams.get('max') ?? '')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(
    searchParams.get('advanced') === '1',
  )
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [selectedDetailStatus, setSelectedDetailStatus] = useState<'PENDING' | 'CONFIRMED'>('PENDING')
  const [error, setError] = useState('')
  const [sortKey, setSortKey] = useState<
    'createdAt' | 'orderId' | 'customer' | 'location' | 'payment' | 'totalPrice' | 'items' | 'status'
  >(
    (() => {
      const raw = searchParams.get('sort')
      if (
        raw === 'orderId' ||
        raw === 'customer' ||
        raw === 'location' ||
        raw === 'payment' ||
        raw === 'totalPrice' ||
        raw === 'items' ||
        raw === 'status'
      ) {
        return raw
      }
      return 'createdAt'
    })(),
  )
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(
    searchParams.get('dir') === 'asc' ? 'asc' : 'desc',
  )
  const [page, setPage] = useState(() => {
    const raw = Number(searchParams.get('page') ?? '1')
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1
  })
  const [visibleColumns, setVisibleColumns] = useState({
    rank: true,
    orderId: true,
    customer: true,
    location: true,
    payment: true,
    date: true,
    items: true,
    total: true,
    status: true,
  })
  const [recentOrderId, setRecentOrderId] = useState<string | null>(null)

  const { data: orders, isLoading } = useAdminOrders()
  const { data: returnRequests = [] } = useAdminReturnRequests('REQUESTED')
  const updateOrderStatus = useUpdateOrderStatus()
  const reviewReturnRequest = useReviewReturnRequest()

  const allOrders = orders || []

  const customerOrderCount = useMemo(() => {
    const map = new Map<string, number>()
    allOrders.forEach((order) => {
      map.set(order.userId, (map.get(order.userId) || 0) + 1)
    })
    return map
  }, [allOrders])

  const selectedOrder = useMemo(
    () => allOrders.find((order) => order.id === selectedOrderId) ?? null,
    [allOrders, selectedOrderId],
  )

  const filteredOrders = allOrders.filter((order) => {
    const orderDate = new Date(order.createdAt)
    const total = Number(order.totalPrice)

    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase())
    const customerText = `${order.user?.name || ''} ${order.user?.email || ''}`.toLowerCase()
    const matchesCustomer = customerText.includes(customerTerm.toLowerCase())
    const pickupStoreText = order.pickupStore
      ? `${order.pickupStore.name} ${order.pickupStore.city} ${order.pickupStore.state} ${order.pickupStore.code}`
      : ''
    const orderLocationText =
      `${pickupStoreText} ${order.shippingAddress || ''} ${order.shippingCity || ''} ${order.shippingState || ''} ${order.shippingZipCode || ''} ${order.shippingCountry || ''}`.toLowerCase()
    const matchesLocation = orderLocationText.includes(locationTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    const matchesFromDate = !dateFrom || orderDate >= new Date(`${dateFrom}T00:00:00`)
    const matchesToDate = !dateTo || orderDate <= new Date(`${dateTo}T23:59:59`)
    const matchesMinValue = !minValue || total >= Number(minValue)
    const matchesMaxValue = !maxValue || total <= Number(maxValue)

    return (
      matchesSearch &&
      matchesCustomer &&
      matchesLocation &&
      matchesStatus &&
      matchesFromDate &&
      matchesToDate &&
      matchesMinValue &&
      matchesMaxValue
    )
  })

  const getCustomerSortValue = (order: Order) =>
    `${order.user?.name || ''} ${order.user?.email || ''}`.trim().toLowerCase()

  const getVisibleOrderCode = (order: Order) => order.id.slice(-8).toUpperCase()

  const getLocationSortValue = (order: Order) => {
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

  const getPaymentSortValue = (order: Order) => (order.paymentProvider || '').toLowerCase()

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    switch (sortKey) {
      case 'orderId':
        return getVisibleOrderCode(a).localeCompare(getVisibleOrderCode(b)) * dir
      case 'customer':
        return getCustomerSortValue(a).localeCompare(getCustomerSortValue(b)) * dir
      case 'location':
        return getLocationSortValue(a).localeCompare(getLocationSortValue(b)) * dir
      case 'payment':
        return getPaymentSortValue(a).localeCompare(getPaymentSortValue(b)) * dir
      case 'totalPrice':
        return (Number(a.totalPrice) - Number(b.totalPrice)) * dir
      case 'items':
        return (a.orderItems.length - b.orderItems.length) * dir
      case 'status':
        return a.status.localeCompare(b.status) * dir
      default:
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
    }
  })

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedOrders = sortedOrders.slice((safePage - 1) * pageSize, safePage * pageSize)

  const totalRevenue = allOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0)
  const pendingOrders = allOrders.filter((o) => o.status === 'PENDING').length
  const confirmedOrders = allOrders.filter((o) => o.status === 'CONFIRMED').length
  const completedOrders = allOrders.filter((o) => o.status === 'COMPLETED').length
  const avgOrderValue = allOrders.length ? totalRevenue / allOrders.length : 0
  const pendingReturnRequests = returnRequests.length

  const handleUpdateStatus = async (status: 'PENDING' | 'CONFIRMED') => {
    if (!canManagePayouts) {
      setError('Missing permission: finance.payout.manage')
      return
    }
    if (!selectedOrder) return
    try {
      setError('')
      await updateOrderStatus.mutateAsync({ orderId: selectedOrder.id, status })
      setRecentOrderId(selectedOrder.id)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  useEffect(() => {
    if (!recentOrderId) return
    const timeout = setTimeout(() => setRecentOrderId(null), 2000)
    return () => clearTimeout(timeout)
  }, [recentOrderId])

  useEffect(() => {
    if (selectedOrderId && !selectedOrder) {
      setSelectedOrderId(null)
    }
  }, [selectedOrder, selectedOrderId])

  useEffect(() => {
    if (!selectedOrder) return
    setSelectedDetailStatus(selectedOrder.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING')
  }, [selectedOrder])

  useEffect(() => {
    const orderId = searchParams.get('orderId')
    if (!orderId) return
    if (orderId !== searchTerm) {
      setSearchTerm(orderId)
    }
    setRecentOrderId(orderId)
    setSelectedOrderId(orderId)
  }, [searchParams, searchTerm])

  useEffect(() => {
    const next = new URLSearchParams()
    if (searchTerm) next.set('q', searchTerm)
    if (statusFilter !== 'all') next.set('status', statusFilter)
    if (dateFrom) next.set('from', dateFrom)
    if (dateTo) next.set('to', dateTo)
    if (sortKey !== 'createdAt') next.set('sort', sortKey)
    if (sortDir !== 'desc') next.set('dir', sortDir)
    if (showAdvancedFilters) next.set('advanced', '1')

    if (customerTerm) next.set('customer', customerTerm)
    if (locationTerm) next.set('location', locationTerm)
    if (minValue) next.set('min', minValue)
    if (maxValue) next.set('max', maxValue)
    if (page > 1) next.set('page', String(page))

    setSearchParams(next, { replace: true })
  }, [
    customerTerm,
    dateFrom,
    dateTo,
    locationTerm,
    maxValue,
    minValue,
    searchTerm,
    setSearchParams,
    showAdvancedFilters,
    sortDir,
    sortKey,
    statusFilter,
    page,
  ])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, customerTerm, locationTerm, statusFilter, dateFrom, dateTo, minValue, maxValue])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  if (isLoading) {
    return (
      <div className="p-8 dark:text-slate-100 space-y-6">
        <Skeleton variant="logo" className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
    )
  }

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const rowPad = 'py-3'
  const columnOptions: Array<{ key: keyof typeof visibleColumns; label: string }> = [
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
  const statusChipTone = (status: Order['status']) => {
    if (status === 'COMPLETED') return 'bg-green-100 text-green-800 dark:bg-emerald-900/40 dark:text-emerald-200'
    if (status === 'CONFIRMED') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
    if (status === 'PENDING') return 'bg-yellow-100 text-yellow-800 dark:bg-amber-900/40 dark:text-amber-200'
    return 'bg-red-100 text-red-800 dark:bg-rose-900/40 dark:text-rose-200'
  }

  const paymentProviderLabel = (order: Order) => order.paymentProvider || 'Not provided'

  const orderLocationLabel = (order: Order) => {
    if (order.deliveryType === 'STORE_PICKUP' && order.pickupStore) {
      return [order.pickupStore.name, order.pickupStore.city, order.pickupStore.state].filter(Boolean).join(', ')
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

  const returnStatusTone = (status: NonNullable<Order['returnRequests']>[number]['status']) => {
    if (status === 'APPROVED' || status === 'REFUNDED' || status === 'CLOSED') {
      return 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'
    }
    if (status === 'REJECTED') {
      return 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200'
    }
    return 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200'
  }

  return (
    <div className="luxe-shell min-h-screen p-8 dark:text-slate-100">
      <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <AdminPageIntro title="Orders Management" className="mb-5" />
        <div className="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2 xl:grid-cols-6">
        <Stat label="Total Orders" value={allOrders.length} active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
        <Stat label="Pending" value={pendingOrders} valueClassName="text-yellow-600 dark:text-amber-300" active={statusFilter === 'PENDING'} onClick={() => setStatusFilter('PENDING')} />
        <Stat label="Confirmed" value={confirmedOrders} valueClassName="text-blue-600 dark:text-blue-300" active={statusFilter === 'CONFIRMED'} onClick={() => setStatusFilter('CONFIRMED')} />
        <Stat label="Completed" value={completedOrders} valueClassName="text-green-600 dark:text-emerald-300" active={statusFilter === 'COMPLETED'} onClick={() => setStatusFilter('COMPLETED')} />
        <Stat label="Revenue" value={`$${totalRevenue.toFixed(2)}`} valueClassName="text-primary-600 dark:text-amber-300" />
        <Stat label="Avg Order Value" value={`$${avgOrderValue.toFixed(2)}`} />
      </div>
        {pendingReturnRequests > 0 && (
          <div className="mb-6 rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.24)] backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Returns</p>
                <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">Pending Return Requests</p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                {pendingReturnRequests} waiting
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              {returnRequests.slice(0, 4).map((request) => (
                <div key={request.id} className="rounded-[22px] border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {request.book?.title ?? 'Order-level request'} for order #{request.order?.id?.slice(-8) ?? 'N/A'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {request.user?.name} • {request.reason}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => reviewReturnRequest.mutate({ id: request.id, payload: { status: 'APPROVED' } })}
                        className="rounded-xl border border-emerald-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/50 dark:text-emerald-300 dark:hover:bg-emerald-900/20"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => reviewReturnRequest.mutate({ id: request.id, payload: { status: 'REJECTED' } })}
                        className="rounded-xl border border-rose-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-rose-700 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-900/20"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {error && (
          <AdminNotice tone="error" className="mb-4">
            {error}
          </AdminNotice>
        )}

        <AdminFilterCard className="relative z-30 mb-6 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search order ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 w-full rounded-[20px] border border-slate-200/80 bg-slate-50/80 pl-11 pr-4 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-12 w-full appearance-none rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 pr-10 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            >
              <option value="all">Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-12 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-12 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          />
          <button
            type="button"
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            className="h-12 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 text-left text-sm font-semibold transition-colors hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {showAdvancedFilters ? 'Hide' : 'More'} filters
          </button>
          <ColumnVisibilityMenu
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            options={columnOptions}
          />
        </div>

        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
          >
            <input
              type="text"
              placeholder="Customer"
              value={customerTerm}
              onChange={(e) => setCustomerTerm(e.target.value)}
              className="h-12 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            />
            <input
              type="text"
              placeholder="Location"
              value={locationTerm}
              onChange={(e) => setLocationTerm(e.target.value)}
              className="h-12 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            />
            <input
              type="number"
              min="0"
              placeholder="Min value"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              className="h-12 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            />
            <input
              type="number"
              min="0"
              placeholder="Max value"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              className="h-12 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
            />
          </motion.div>
        )}
        </AdminFilterCard>
      </div>

      

      <AdminTableCard className="relative z-0">
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[1400px]">
            <thead className="admin-table-head sticky top-0 z-0">
              <tr>
                {visibleColumns.rank && <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-[0.22em] text-slate-400`}>#</th>}
                {visibleColumns.orderId && (
                  <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-[0.22em] text-slate-400`}>
                    <button type="button" onClick={() => toggleSort('orderId')} className="inline-flex items-center gap-2">
                      Order ID {sortKey === 'orderId' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  </th>
                )}
                {visibleColumns.customer && (
                  <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-[0.22em] text-slate-400`}>
                    <button type="button" onClick={() => toggleSort('customer')} className="inline-flex items-center gap-2">
                      Customer {sortKey === 'customer' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  </th>
                )}
                {visibleColumns.location && (
                  <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-[0.22em] text-slate-400`}>
                    <button type="button" onClick={() => toggleSort('location')} className="inline-flex items-center gap-2">
                      Delivery Location {sortKey === 'location' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  </th>
                )}
                {visibleColumns.payment && (
                  <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-[0.22em] text-slate-400`}>
                    <button type="button" onClick={() => toggleSort('payment')} className="inline-flex items-center gap-2">
                      Payment {sortKey === 'payment' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  </th>
                )}
                {visibleColumns.date && (
                  <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-[0.22em] text-slate-400`}>
                    <button type="button" onClick={() => toggleSort('createdAt')} className="inline-flex items-center gap-2">Date {sortKey === 'createdAt' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}</button>
                  </th>
                )}
                {visibleColumns.items && (
                  <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-[0.22em] text-slate-400`}>
                    <button type="button" onClick={() => toggleSort('items')} className="inline-flex items-center gap-2">Items {sortKey === 'items' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}</button>
                  </th>
                )}
                {visibleColumns.total && (
                  <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-[0.22em] text-slate-400`}>
                    <button type="button" onClick={() => toggleSort('totalPrice')} className="inline-flex items-center gap-2">Total {sortKey === 'totalPrice' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}</button>
                  </th>
                )}
                {visibleColumns.status && (
                  <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-[0.22em] text-slate-400`}>
                    <button type="button" onClick={() => toggleSort('status')} className="inline-flex items-center gap-2">Status {sortKey === 'status' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}</button>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={`cursor-pointer transition-colors hover:bg-gray-50/80 dark:hover:bg-slate-800/60 ${index % 2 === 1 ? 'bg-slate-50/25 dark:bg-slate-950/20' : ''} ${recentOrderId === order.id ? 'ring-2 ring-amber-300/60' : ''}`}
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  {visibleColumns.rank && <td className={`px-6 ${rowPad} whitespace-nowrap text-sm text-gray-500 dark:text-slate-500`}>#{(safePage - 1) * pageSize + index + 1}</td>}
                  {visibleColumns.orderId && <td className={`px-6 ${rowPad} whitespace-nowrap`}><span className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-100">{order.id.slice(-8).toUpperCase()}</span></td>}
                  {visibleColumns.customer && (
                    <td className={`px-6 ${rowPad}`}>
                      <p className="text-sm font-medium">{order.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{order.user?.email || 'No email'} • {customerOrderCount.get(order.userId) || 0} total orders</p>
                    </td>
                  )}
                  {visibleColumns.location && (
                    <td className={`px-6 ${rowPad}`}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {order.deliveryType === 'STORE_PICKUP' ? 'Store Pickup' : 'Home Delivery'}
                      </p>
                      {order.deliveryType === 'STORE_PICKUP' && order.pickupStore ? (
                        <>
                          <p className="text-sm">{order.pickupStore.name}</p>
                          <p className="text-xs text-slate-400">
                            {[order.pickupStore.city, order.pickupStore.state].filter(Boolean).join(', ')}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm">
                            {[order.shippingCity, order.shippingState].filter(Boolean).join(', ') || order.shippingCountry || '-'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {[order.shippingAddress, order.shippingZipCode, order.shippingCountry].filter(Boolean).join(' • ') || 'No shipping address captured'}
                          </p>
                        </>
                      )}
                    </td>
                  )}
                  {visibleColumns.payment && (
                    <td className={`px-6 ${rowPad}`}>
                      <p className="text-sm">{order.paymentProvider || '-'}</p>
                      <p className="text-xs text-slate-400">
                        {order.paymentReceiptUrl ? 'Receipt uploaded' : 'No receipt'}
                      </p>
                    </td>
                  )}
                  {visibleColumns.date && <td className={`px-6 ${rowPad} whitespace-nowrap text-sm`}>{new Date(order.createdAt).toLocaleDateString()}</td>}
                  {visibleColumns.items && <td className={`px-6 ${rowPad} whitespace-nowrap text-sm`}>{order.orderItems.length} items</td>}
                  {visibleColumns.total && <td className={`px-6 ${rowPad} whitespace-nowrap text-sm font-semibold`}>${Number(order.totalPrice).toFixed(2)}</td>}
                  {visibleColumns.status && (
                    <td className={`px-6 ${rowPad} whitespace-nowrap`}>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusChipTone(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <AdminPaginationFooter
          page={safePage}
          totalPages={totalPages}
          onPrev={() => setPage((current) => Math.max(1, current - 1))}
          onNext={() => setPage((current) => Math.min(totalPages, current + 1))}
          className="border-t border-slate-200/70 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-950"
        />
        <div className="border-t border-slate-200/70 bg-slate-50/80 px-6 py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between dark:bg-slate-950 dark:border-slate-800">
          <div className="text-sm text-gray-600 dark:text-slate-400">
            Showing {paginatedOrders.length} of {filteredOrders.length} filtered orders
          </div>
          <div className="text-xs text-slate-500">Location filter matches shipping address and pickup store metadata.</div>
        </div>
      </AdminTableCard>

      <AdminSlideOverPanel
        open={!!selectedOrder}
        onClose={() => setSelectedOrderId(null)}
        kicker="Order Detail"
        title={selectedOrder ? selectedOrder.id.slice(-8).toUpperCase() : ''}
        description={selectedOrder ? `${selectedOrder.status} · ${new Date(selectedOrder.createdAt).toLocaleString()}` : undefined}
        widthClassName="max-w-[56rem]"
      >
        {selectedOrder ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusChipTone(selectedOrder.status)}`}>
                {selectedOrder.status}
              </span>
              <span className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                {selectedOrder.deliveryType === 'STORE_PICKUP' ? 'Store Pickup' : 'Home Delivery'}
              </span>
              <span className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                {selectedOrder.orderItems.length} item{selectedOrder.orderItems.length === 1 ? '' : 's'}
              </span>
            </div>

            {canManagePayouts && (selectedOrder.status === 'PENDING' || selectedOrder.status === 'CONFIRMED') ? (
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status controls</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Update the order state directly from this detail panel.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleUpdateStatus(selectedDetailStatus)}
                    disabled={updateOrderStatus.isPending || selectedDetailStatus === selectedOrder.status}
                    className="rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-400 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
                  >
                    {updateOrderStatus.isPending ? 'Updating...' : 'Update Status'}
                  </button>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setSelectedDetailStatus('PENDING')}
                    className={`block w-full rounded-2xl border p-4 text-left transition ${
                      selectedDetailStatus === 'PENDING'
                        ? 'border-amber-300 bg-amber-50/50 dark:border-amber-500/50 dark:bg-amber-900/10'
                        : 'border-slate-200 hover:border-amber-200 dark:border-slate-700 dark:hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 rounded-lg bg-amber-100 p-1.5 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                          <Clock3 className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">Pending</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Order is being processed.</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                        PENDING
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedDetailStatus('CONFIRMED')}
                    className={`block w-full rounded-2xl border p-4 text-left transition ${
                      selectedDetailStatus === 'CONFIRMED'
                        ? 'border-blue-300 bg-blue-50/50 dark:border-blue-500/50 dark:bg-blue-900/10'
                        : 'border-slate-200 hover:border-blue-200 dark:border-slate-700 dark:hover:border-blue-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 rounded-lg bg-blue-100 p-1.5 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200">
                          <CheckCircle2 className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">Confirmed</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Finance has verified payment and sent it to warehouse delivery tasks.
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                        CONFIRMED
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Customer</p>
                {selectedOrder.user ? (
                  <>
                    <Link
                      to={`/admin/users?q=${encodeURIComponent(selectedOrder.user.email || selectedOrder.user.name || '')}`}
                      className="mt-2 inline-flex text-xl font-semibold text-slate-900 transition hover:text-indigo-600 hover:underline dark:text-slate-100 dark:hover:text-indigo-300"
                    >
                      {selectedOrder.user.name || selectedOrder.shippingFullName || 'Unknown customer'}
                    </Link>
                    <Link
                      to={`/admin/users?q=${encodeURIComponent(selectedOrder.user.email || selectedOrder.user.name || '')}`}
                      className="mt-1 inline-flex text-sm text-slate-500 transition hover:text-indigo-600 hover:underline dark:text-slate-400 dark:hover:text-indigo-300"
                    >
                      {selectedOrder.shippingEmail || selectedOrder.user.email || 'No email provided'}
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {selectedOrder.shippingFullName || 'Unknown customer'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {selectedOrder.shippingEmail || 'No email provided'}
                    </p>
                  </>
                )}
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  {customerOrderCount.get(selectedOrder.userId) || 0} total orders
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Payment</p>
                <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {paymentProviderLabel(selectedOrder)}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {selectedOrder.paymentReceiptUrl ? 'Receipt uploaded' : 'No receipt uploaded'}
                </p>
                {selectedOrder.paymentReceiptUrl ? (
                  <a
                    href={selectedOrder.paymentReceiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View receipt
                  </a>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Delivery location</p>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {orderLocationLabel(selectedOrder)}
                </p>
                {selectedOrder.deliveryType === 'STORE_PICKUP' && selectedOrder.pickupStore ? (
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    Store code: {selectedOrder.pickupStore.code}
                  </p>
                ) : null}
                {selectedOrder.deliveryType !== 'STORE_PICKUP' && selectedOrder.shippingPhone ? (
                  <a
                    href={`tel:${selectedOrder.shippingPhone}`}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                  >
                    <Phone className="h-4 w-4" />
                    {selectedOrder.shippingPhone}
                  </a>
                ) : null}
                {selectedOrder.deliveryType !== 'STORE_PICKUP' && selectedOrder.shippingAddress ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(orderLocationLabel(selectedOrder))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                  >
                    <MapPin className="h-4 w-4" />
                    Open in maps
                  </a>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Order totals</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">${Number(selectedOrder.subtotalPrice ?? selectedOrder.totalPrice).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Discount</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">${Number(selectedOrder.discountAmount ?? 0).toFixed(2)}</span>
                  </div>
                  {selectedOrder.promoCode ? (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Promo code</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{selectedOrder.promoCode}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base dark:border-slate-700">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Total</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">${Number(selectedOrder.totalPrice).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Books in this order</p>
                <span className="text-xs text-slate-500 dark:text-slate-400">{selectedOrder.orderItems.length} line item(s)</span>
              </div>
              <div className="mt-4 space-y-3">
                {selectedOrder.orderItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/60">
                    <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                      {item.book.coverImage ? (
                        <img
                          src={resolveMediaUrl(item.book.coverImage)}
                          alt={item.book.title}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/admin/books?book=${encodeURIComponent(item.book.title)}`}
                        className="truncate font-semibold text-slate-900 transition hover:text-indigo-600 hover:underline dark:text-slate-100 dark:hover:text-indigo-300"
                      >
                        {item.book.title}
                      </Link>
                      <div className="mt-1">
                        <Link
                          to={`/admin/books?author=${encodeURIComponent(item.book.author)}`}
                          className="text-sm text-slate-500 transition hover:text-indigo-600 hover:underline dark:text-slate-400 dark:hover:text-indigo-300"
                        >
                          {item.book.author}
                        </Link>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>{item.format || 'PHYSICAL'}</span>
                        <span>qty {item.quantity}</span>
                        <span>${Number(item.price).toFixed(2)} each</span>
                      </div>
                    </div>
                    <Link
                      to={`/admin/books?book=${encodeURIComponent(item.book.title)}`}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {selectedOrder.returnRequests?.length ? (
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Return requests</p>
                <div className="mt-4 space-y-3">
                  {selectedOrder.returnRequests.map((request) => (
                    <div key={request.id} className="rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/60">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {request.book?.title ?? 'Order-level return'}
                        </p>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${returnStatusTone(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{request.reason}</p>
                      {request.details ? (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{request.details}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </AdminSlideOverPanel>
      </div>
    </div>
  )
}

const Stat = ({
  label,
  value,
  valueClassName = '',
  active = false,
  onClick,
}: {
  label: string
  value: string | number
  valueClassName?: string
  active?: boolean
  onClick?: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-[26px] border border-white/70 bg-white/80 p-5 text-left shadow-[0_20px_50px_-38px_rgba(15,23,42,0.28)] backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70 ${
      active ? 'ring-2 ring-slate-300 dark:ring-slate-600' : ''
    } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
  >
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{label}</p>
    <p className={`mt-4 text-[2.2rem] font-black leading-none tracking-tight text-gray-900 dark:text-slate-100 ${valueClassName}`}>{value}</p>
  </button>
)

export default AdminOrdersPage
