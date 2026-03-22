import { useState, useEffect, useMemo } from 'react'
import {
  useAdminOrders,
  useAdminReturnRequests,
  useReviewReturnRequest,
  useUpdateOrderStatus,
} from '@/services/orders'
import Skeleton from '@/components/ui/Skeleton'
import AdminNotice from '@/components/admin/AdminNotice'
import AdminPageIntro from '@/components/admin/AdminPageIntro'
import { getErrorMessage } from '@/lib/api'
import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/store/auth.store'
import { useSearchParams } from 'react-router-dom'
import AdminOrdersFilters from '@/features/admin/orders/components/AdminOrdersFilters'
import AdminOrdersTable from '@/features/admin/orders/components/AdminOrdersTable'
import OrderDetailPanel from '@/features/admin/orders/components/OrderDetailPanel'
import {
  getCustomerSortValue,
  getLocationSortValue,
  getPaymentSortValue,
  getVisibleOrderCode,
  ORDER_COLUMN_OPTIONS,
  type AdminOrderSortKey,
  type VisibleOrderColumns,
  isOrderStatusFilter,
} from '@/features/admin/orders/lib/orderDisplay'

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
  const [sortKey, setSortKey] = useState<AdminOrderSortKey>(
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
  const [visibleColumns, setVisibleColumns] = useState<VisibleOrderColumns>({
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

        <AdminOrdersFilters
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={() => setShowAdvancedFilters((prev) => !prev)}
          customerTerm={customerTerm}
          onCustomerTermChange={setCustomerTerm}
          locationTerm={locationTerm}
          onLocationTermChange={setLocationTerm}
          minValue={minValue}
          onMinValueChange={setMinValue}
          maxValue={maxValue}
          onMaxValueChange={setMaxValue}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          columnOptions={ORDER_COLUMN_OPTIONS}
        />
      </div>

      <AdminOrdersTable
        orders={paginatedOrders}
        safePage={safePage}
        pageSize={pageSize}
        filteredCount={filteredOrders.length}
        totalPages={totalPages}
        page={safePage}
        onPrevPage={() => setPage((current) => Math.max(1, current - 1))}
        onNextPage={() => setPage((current) => Math.min(totalPages, current + 1))}
        visibleColumns={visibleColumns}
        sortKey={sortKey}
        sortDir={sortDir}
        onToggleSort={toggleSort}
        customerOrderCount={customerOrderCount}
        selectedOrderId={selectedOrderId}
        recentOrderId={recentOrderId}
        onSelectOrder={setSelectedOrderId}
      />

      <OrderDetailPanel
        selectedOrder={selectedOrder}
        selectedDetailStatus={selectedDetailStatus}
        setSelectedDetailStatus={setSelectedDetailStatus}
        canManagePayouts={canManagePayouts}
        customerOrderCount={customerOrderCount}
        updateOrderStatusPending={updateOrderStatus.isPending}
        onClose={() => setSelectedOrderId(null)}
        onUpdateStatus={handleUpdateStatus}
      />
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
