import { type ReactNode } from 'react'

type AdminTableCardProps = {
  children: ReactNode
  className?: string
}

const AdminTableCard = ({
  children,
  className = '',
}: AdminTableCardProps) => {
  return (
    <div
      className={`admin-table-wrapper overflow-hidden rounded-[30px] border border-white/70 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.26)] dark:border-slate-800/80 ${className}`.trim()}
    >
      {children}
    </div>
  )
}

export default AdminTableCard
