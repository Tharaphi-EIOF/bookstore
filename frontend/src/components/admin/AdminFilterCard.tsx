import { type ReactNode } from 'react'

type AdminFilterCardProps = {
  children: ReactNode
  className?: string
}

const AdminFilterCard = ({
  children,
  className = '',
}: AdminFilterCardProps) => {
  return (
    <div
      className={`rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.28)] backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70 ${className}`.trim()}
    >
      {children}
    </div>
  )
}

export default AdminFilterCard
