type AdminBooksSummaryStripProps = {
  totalBooks: number
  inStockBooks: number
  lowStockBooks: number
  outOfStockBooks: number
}

type SummaryCardProps = {
  label: string
  value: number
  tone?: 'default' | 'success' | 'warning' | 'danger'
}

const toneClassName: Record<NonNullable<SummaryCardProps['tone']>, string> = {
  default: 'text-slate-400 dark:text-slate-500',
  success: 'text-emerald-500 dark:text-emerald-300',
  warning: 'text-amber-500 dark:text-amber-300',
  danger: 'text-rose-500 dark:text-rose-300',
}

const SummaryCard = ({ label, value, tone = 'default' }: SummaryCardProps) => (
  <div className="rounded-[24px] border border-white/70 bg-white/80 px-5 py-4 shadow-[0_18px_44px_-36px_rgba(15,23,42,0.28)] backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70">
    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${toneClassName[tone]}`}>{label}</p>
    <p className="mt-3 text-3xl font-black leading-none tracking-tight text-slate-900 dark:text-slate-100">
      {value}
    </p>
  </div>
)

const AdminBooksSummaryStrip = ({
  totalBooks,
  inStockBooks,
  lowStockBooks,
  outOfStockBooks,
}: AdminBooksSummaryStripProps) => {
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
      <SummaryCard label="Total Books" value={totalBooks} />
      <SummaryCard label="In Stock" value={inStockBooks} tone="success" />
      <SummaryCard label="Low Stock" value={lowStockBooks} tone="warning" />
      <SummaryCard label="Out Of Stock" value={outOfStockBooks} tone="danger" />
    </div>
  )
}

export default AdminBooksSummaryStrip
