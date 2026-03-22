import { Fragment } from 'react'
import { CircleCheck, Pencil } from 'lucide-react'
import AdminIconActionButton from '@/components/admin/AdminIconActionButton'
import type {
  PurchaseOrder,
  PurchaseOrderStatus,
  Vendor,
  Warehouse,
} from '@/features/admin/services/warehouses'
import { getStatusTone } from '@/features/admin/purchase-orders/lib/purchaseOrderDisplay'

type PurchaseOrdersQueueSectionProps = {
  status: PurchaseOrderStatus | ''
  onStatusChange: (value: PurchaseOrderStatus | '') => void
  warehouseId: string
  onWarehouseIdChange: (value: string) => void
  vendorId: string
  onVendorIdChange: (value: string) => void
  warehouses: Warehouse[]
  vendors: Vendor[]
  orders: PurchaseOrder[]
  canCreate: boolean
  canReceive: boolean
  expandedOrderId: string | null
  onToggleExpandedOrder: (orderId: string) => void
  onEditDraft: (orderId: string) => void
  onReceiveOrder: (orderId: string) => void
  projectRetailPrice: (unitCost: number | null | undefined) => number | null
  statusOptions: PurchaseOrderStatus[]
}

const PurchaseOrdersQueueSection = ({
  status,
  onStatusChange,
  warehouseId,
  onWarehouseIdChange,
  vendorId,
  onVendorIdChange,
  warehouses,
  vendors,
  orders,
  canCreate,
  canReceive,
  expandedOrderId,
  onToggleExpandedOrder,
  onEditDraft,
  onReceiveOrder,
  projectRetailPrice,
  statusOptions,
}: PurchaseOrdersQueueSectionProps) => (
  <div className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
    <div className="mt-0 grid gap-3 sm:grid-cols-3">
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as PurchaseOrderStatus | '')}
        className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <option value="">All statuses</option>
        {statusOptions.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
      <select
        value={warehouseId}
        onChange={(e) => onWarehouseIdChange(e.target.value)}
        className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <option value="">All warehouses</option>
        {warehouses.map((warehouse) => (
          <option key={warehouse.id} value={warehouse.id}>{warehouse.code}</option>
        ))}
      </select>
      <select
        value={vendorId}
        onChange={(e) => onVendorIdChange(e.target.value)}
        className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <option value="">All vendors</option>
        {vendors.map((vendor) => (
          <option key={vendor.id} value={vendor.id}>{vendor.code}</option>
        ))}
      </select>
    </div>

    <div className="admin-table-wrapper mt-4 overflow-auto">
      <table className="admin-table min-w-full text-sm">
        <thead className="admin-table-head">
          <tr>
            <th className="px-3 py-2 text-left">Order</th>
            <th className="px-3 py-2 text-left">Vendor</th>
            <th className="px-3 py-2 text-left">Warehouse</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Items</th>
            <th className="px-3 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const canReceiveThis = canReceive && ['SENT', 'PARTIALLY_RECEIVED', 'RECEIVED'].includes(order.status)
            const isExpanded = expandedOrderId === order.id
            return (
              <Fragment key={order.id}>
                <tr>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onToggleExpandedOrder(order.id)}
                      className="font-medium text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300"
                    >
                      {order.id.slice(0, 8)}
                    </button>
                    <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
                  </td>
                  <td className="px-3 py-2">{order.vendor.code}</td>
                  <td className="px-3 py-2">{order.warehouse.code}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusTone(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <p className="text-xs text-slate-600 dark:text-slate-300">{order.items.length} item(s)</p>
                  </td>
                  <td className="px-3 py-2">
                    {order.status === 'DRAFT' && canCreate ? (
                      <AdminIconActionButton
                        label="Edit draft purchase order"
                        icon={<Pencil className="h-4 w-4" />}
                        onClick={() => onEditDraft(order.id)}
                      />
                    ) : canReceiveThis ? (
                      <AdminIconActionButton
                        label="Receive purchase order"
                        icon={<CircleCheck className="h-4 w-4" />}
                        variant="accent"
                        onClick={() => onReceiveOrder(order.id)}
                      />
                    ) : (
                      <span className="text-xs text-slate-400">No action</span>
                    )}
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={6} className="bg-slate-50/70 px-3 py-2 dark:bg-slate-950/40">
                      <div className="space-y-1">
                        {order.items.map((item) => (
                          <div key={item.id} className="rounded-md border border-slate-200/70 bg-white/70 px-2 py-1.5 dark:border-slate-700/70 dark:bg-slate-900/60">
                            <p className="text-xs text-slate-700 dark:text-slate-200">
                              {item.book.title} by {item.book.author} • received {item.receivedQuantity}/{item.orderedQuantity}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Unit cost: {item.unitCost ? `$${Number(item.unitCost).toFixed(2)}` : 'Not set'}
                              {' • '}
                              Current retail: ${Number(item.book.price).toFixed(2)}
                              {(() => {
                                const projected = projectRetailPrice(item.unitCost ?? null)
                                if (projected === null) return ' • Retail preview: N/A'
                                return ` • Retail preview after receive: $${projected.toFixed(2)}`
                              })()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
          {orders.length === 0 && (
            <tr>
              <td className="px-3 py-4 text-sm text-slate-500" colSpan={6}>No purchase orders found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)

export default PurchaseOrdersQueueSection
