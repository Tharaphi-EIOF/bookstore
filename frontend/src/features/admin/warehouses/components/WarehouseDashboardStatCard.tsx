import type { ReactNode } from 'react'

interface WarehouseDashboardStatCardProps {
  title: string
  value: string | number
  subtitle: string
  icon: ReactNode
  valueClassName?: string
}

const WarehouseDashboardStatCard = ({
  title,
  value,
  subtitle,
  icon,
  valueClassName = '',
}: WarehouseDashboardStatCardProps) => (
  <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-slate-700">
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{title}</p>
      <span className="text-slate-400 dark:text-slate-500">{icon}</span>
    </div>
    <p className={`mt-2 text-3xl font-bold ${valueClassName}`}>{value}</p>
    <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
  </div>
)

export default WarehouseDashboardStatCard
