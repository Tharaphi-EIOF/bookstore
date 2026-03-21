import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface InventoryTrendPoint {
  key: string
  label: string
  incoming: number
  outgoing: number
}

interface WarehouseInventoryTrendCardProps {
  trendRange: 7 | 30 | 90
  setTrendRange: (range: 7 | 30 | 90) => void
  incomingTotal: number
  outgoingTotal: number
  inventoryTrend: InventoryTrendPoint[]
}

const WarehouseInventoryTrendCard = ({
  trendRange,
  setTrendRange,
  incomingTotal,
  outgoingTotal,
  inventoryTrend,
}: WarehouseInventoryTrendCardProps) => {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Inventory Trend</h2>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
            {[7, 30, 90].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTrendRange(range as 7 | 30 | 90)}
                className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-all duration-150 ${
                  trendRange === range
                    ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {range}d
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-500">
            <span className="mr-4 inline-flex items-center gap-1"><ArrowDownToLine className="h-3.5 w-3.5" /> Incoming: {incomingTotal}</span>
            <span className="inline-flex items-center gap-1"><ArrowUpFromLine className="h-3.5 w-3.5" /> Outgoing: {outgoingTotal}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Incoming</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Outgoing</span>
        <span>{trendRange}-day window</span>
      </div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={inventoryTrend}>
            <defs>
              <linearGradient id="incomingFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="outgoingFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area type="monotone" dataKey="incoming" stroke="#22c55e" fill="url(#incomingFill)" strokeWidth={2} />
            <Area type="monotone" dataKey="outgoing" stroke="#f59e0b" fill="url(#outgoingFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default WarehouseInventoryTrendCard
