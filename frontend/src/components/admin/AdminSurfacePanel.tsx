import { type ReactNode } from 'react'

type AdminSurfacePanelProps = {
  children: ReactNode
  className?: string
}

const AdminSurfacePanel = ({
  children,
  className = '',
}: AdminSurfacePanelProps) => {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900 ${className}`.trim()}
    >
      {children}
    </div>
  )
}

export default AdminSurfacePanel
