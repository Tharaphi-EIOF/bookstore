import type { WarehouseDeliveryTask } from '@/services/orders'

interface DeliverySla {
  label: string
  tone: string
}

interface WarehouseDeliveryTasksPanelProps {
  openDeliveryTasks: WarehouseDeliveryTask[]
  completedDeliveryTasks: WarehouseDeliveryTask[]
  taskMessage: string
  isPending: boolean
  onCompleteDeliveryTask: (taskId: string) => void
  getDeliverySla: (createdAt: string, completedAt?: string | null) => DeliverySla
}

const WarehouseDeliveryTasksPanel = ({
  openDeliveryTasks,
  completedDeliveryTasks,
  taskMessage,
  isPending,
  onCompleteDeliveryTask,
  getDeliverySla,
}: WarehouseDeliveryTasksPanelProps) => {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90 lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Delivery Tasks</h2>
        <span className="text-xs text-slate-500">{openDeliveryTasks.length} open</span>
      </div>

      {taskMessage && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
          {taskMessage}
        </div>
      )}

      <div className="admin-table-wrapper mt-4 overflow-auto">
        <table className="admin-table min-w-full text-sm">
          <thead className="admin-table-head">
            <tr>
              <th className="px-3 py-2 text-left">Task</th>
              <th className="px-3 py-2 text-left">Order</th>
              <th className="px-3 py-2 text-left">Books</th>
              <th className="px-3 py-2 text-left">Assigned To</th>
              <th className="px-3 py-2 text-left">Priority</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">SLA</th>
              <th className="px-3 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {openDeliveryTasks.map((task) => {
              const meta = (task.metadata || {}) as { orderId?: string }
              const sla = getDeliverySla(task.createdAt)
              return (
                <tr key={task.id}>
                  <td className="px-3 py-2">Order Delivery</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {meta.orderId ? meta.orderId.slice(0, 8).toUpperCase() : '-'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="space-y-1">
                      {(task.order?.orderItems ?? []).slice(0, 3).map((item) => (
                        <p key={item.id} className="text-xs">
                          {item.book.title} <span className="text-slate-500">x{item.quantity}</span>
                        </p>
                      ))}
                      {(task.order?.orderItems?.length ?? 0) > 3 && (
                        <p className="text-xs text-slate-500">+{(task.order?.orderItems?.length ?? 0) - 3} more</p>
                      )}
                      {(task.order?.orderItems?.length ?? 0) === 0 && (
                        <p className="text-xs text-slate-500">No item details</p>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">{task.staff.user.name}</td>
                  <td className="px-3 py-2">{task.priority}</td>
                  <td className="px-3 py-2">{task.status}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${sla.tone}`}>
                      {sla.label}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => void onCompleteDeliveryTask(task.id)}
                      disabled={isPending}
                      className="rounded border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700 transition-all duration-150 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-700/40 dark:text-emerald-200 dark:hover:bg-emerald-900/20"
                    >
                      Complete
                    </button>
                  </td>
                </tr>
              )
            })}
            {openDeliveryTasks.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-sm text-slate-500">
                  No open delivery tasks.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Recently Completed</h3>
        <div className="mt-2 space-y-2">
          {completedDeliveryTasks.map((task) => {
            const meta = (task.metadata || {}) as { orderId?: string }
            const sla = getDeliverySla(task.createdAt, task.completedAt)
            return (
              <div key={task.id} className="rounded-lg border border-slate-200/70 px-3 py-2 text-sm transition-all duration-150 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700">
                <p className="font-medium">Order {meta.orderId ? meta.orderId.slice(0, 8).toUpperCase() : '-'}</p>
                <p className="text-xs text-slate-500">
                  Completed by {task.staff.user.name} • {task.completedAt ? new Date(task.completedAt).toLocaleString() : '-'}
                </p>
                <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${sla.tone}`}>
                  {sla.label}
                </span>
              </div>
            )
          })}
          {completedDeliveryTasks.length === 0 && <p className="text-sm text-slate-500">No completed delivery tasks yet.</p>}
        </div>
      </div>
    </div>
  )
}

export default WarehouseDeliveryTasksPanel
