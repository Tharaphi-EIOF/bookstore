import { motion } from 'framer-motion'
import AdminPaginationFooter from '@/components/admin/AdminPaginationFooter'
import AdminTableCard from '@/components/admin/AdminTableCard'
import type { Order } from '@/services/orders'
import {
  getVisibleOrderCode,
  statusChipTone,
  type AdminOrderSortKey,
  type VisibleOrderColumns,
} from '@/features/admin/orders/lib/orderDisplay'

type AdminOrdersTableProps = {
  orders: Order[]
  safePage: number
  pageSize: number
  filteredCount: number
  totalPages: number
  page: number
  onPrevPage: () => void
  onNextPage: () => void
  visibleColumns: VisibleOrderColumns
  sortKey: AdminOrderSortKey
  sortDir: 'asc' | 'desc'
  onToggleSort: (key: AdminOrderSortKey) => void
  customerOrderCount: Map<string, number>
  selectedOrderId: string | null
  recentOrderId: string | null
  onSelectOrder: (orderId: string) => void
}

const rowPad = 'py-3'

const SortHeader = ({
  label,
  active,
  direction,
  onClick,
}: {
  label: string
  active: boolean
  direction: 'asc' | 'desc'
  onClick: () => void
}) => (
  <button type="button" onClick={onClick} className="inline-flex items-center gap-2">
    {label} {active && <span>{direction === 'asc' ? '↑' : '↓'}</span>}
  </button>
)

const AdminOrdersTable = ({
  orders,
  safePage,
  pageSize,
  filteredCount,
  totalPages,
  page,
  onPrevPage,
  onNextPage,
  visibleColumns,
  sortKey,
  sortDir,
  onToggleSort,
  customerOrderCount,
  selectedOrderId,
  recentOrderId,
  onSelectOrder,
}: AdminOrdersTableProps) => (
  <AdminTableCard className="relative z-0">
    <div className="overflow-x-auto">
      <table className="admin-table min-w-[1400px]">
        <thead className="admin-table-head sticky top-0 z-0">
          <tr>
            {visibleColumns.rank && <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-[0.22em] text-slate-400`}>#</th>}
            {visibleColumns.orderId && (
              <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-[0.22em] text-slate-400`}>
                <SortHeader label="Order ID" active={sortKey === 'orderId'} direction={sortDir} onClick={() => onToggleSort('orderId')} />
              </th>
            )}
            {visibleColumns.customer && (
              <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-[0.22em] text-slate-400`}>
                <SortHeader label="Customer" active={sortKey === 'customer'} direction={sortDir} onClick={() => onToggleSort('customer')} />
              </th>
            )}
            {visibleColumns.location && (
              <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-[0.22em] text-slate-400`}>
                <SortHeader label="Delivery Location" active={sortKey === 'location'} direction={sortDir} onClick={() => onToggleSort('location')} />
              </th>
            )}
            {visibleColumns.payment && (
              <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-[0.22em] text-slate-400`}>
                <SortHeader label="Payment" active={sortKey === 'payment'} direction={sortDir} onClick={() => onToggleSort('payment')} />
              </th>
            )}
            {visibleColumns.date && (
              <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-[0.22em] text-slate-400`}>
                <SortHeader label="Date" active={sortKey === 'createdAt'} direction={sortDir} onClick={() => onToggleSort('createdAt')} />
              </th>
            )}
            {visibleColumns.items && (
              <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-[0.22em] text-slate-400`}>
                <SortHeader label="Items" active={sortKey === 'items'} direction={sortDir} onClick={() => onToggleSort('items')} />
              </th>
            )}
            {visibleColumns.total && (
              <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-[0.22em] text-slate-400`}>
                <SortHeader label="Total" active={sortKey === 'totalPrice'} direction={sortDir} onClick={() => onToggleSort('totalPrice')} />
              </th>
            )}
            {visibleColumns.status && (
              <th className={`px-6 ${rowPad} text-left text-xs font-bold uppercase tracking-[0.22em] text-slate-400`}>
                <SortHeader label="Status" active={sortKey === 'status'} direction={sortDir} onClick={() => onToggleSort('status')} />
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => (
            <motion.tr
              key={order.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.02 }}
              className={`cursor-pointer transition-colors hover:bg-gray-50/80 dark:hover:bg-slate-800/60 ${index % 2 === 1 ? 'bg-slate-50/25 dark:bg-slate-950/20' : ''} ${selectedOrderId === order.id ? 'bg-slate-50/70 dark:bg-slate-800/50' : ''} ${recentOrderId === order.id ? 'ring-2 ring-amber-300/60' : ''}`}
              onClick={() => onSelectOrder(order.id)}
            >
              {visibleColumns.rank && <td className={`px-6 ${rowPad} whitespace-nowrap text-sm text-gray-500 dark:text-slate-500`}>#{(safePage - 1) * pageSize + index + 1}</td>}
              {visibleColumns.orderId && <td className={`px-6 ${rowPad} whitespace-nowrap`}><span className="text-sm font-mono font-semibold text-slate-900 dark:text-slate-100">{getVisibleOrderCode(order)}</span></td>}
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
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusChipTone(order.status)}`}>
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
      page={page}
      totalPages={totalPages}
      onPrev={onPrevPage}
      onNext={onNextPage}
      className="border-t border-slate-200/70 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-950"
    />
    <div className="flex flex-col gap-2 border-t border-slate-200/70 bg-slate-50/80 px-6 py-4 dark:border-slate-800 dark:bg-slate-950 md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-gray-600 dark:text-slate-400">
        Showing {orders.length} of {filteredCount} filtered orders
      </div>
      <div className="text-xs text-slate-500">Location filter matches shipping address and pickup store metadata.</div>
    </div>
  </AdminTableCard>
)

export default AdminOrdersTable
