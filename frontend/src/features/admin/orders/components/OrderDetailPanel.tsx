import { CheckCircle2, Clock3, ExternalLink, MapPin, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'
import { resolveMediaUrl } from '@/lib/media'
import type { Order } from '@/services/orders'
import {
  orderLocationLabel,
  paymentProviderLabel,
  returnStatusTone,
  statusChipTone,
} from '@/features/admin/orders/lib/orderDisplay'

type OrderDetailPanelProps = {
  selectedOrder: Order | null
  selectedDetailStatus: 'PENDING' | 'CONFIRMED'
  setSelectedDetailStatus: (status: 'PENDING' | 'CONFIRMED') => void
  canManagePayouts: boolean
  customerOrderCount: Map<string, number>
  updateOrderStatusPending: boolean
  onClose: () => void
  onUpdateStatus: (status: 'PENDING' | 'CONFIRMED') => Promise<void>
}

const OrderDetailPanel = ({
  selectedOrder,
  selectedDetailStatus,
  setSelectedDetailStatus,
  canManagePayouts,
  customerOrderCount,
  updateOrderStatusPending,
  onClose,
  onUpdateStatus,
}: OrderDetailPanelProps) => (
  <AdminSlideOverPanel
    open={!!selectedOrder}
    onClose={onClose}
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
                onClick={() => void onUpdateStatus(selectedDetailStatus)}
                disabled={updateOrderStatusPending || selectedDetailStatus === selectedOrder.status}
                className="rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-400 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
              >
                {updateOrderStatusPending ? 'Updating...' : 'Update Status'}
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
)

export default OrderDetailPanel
