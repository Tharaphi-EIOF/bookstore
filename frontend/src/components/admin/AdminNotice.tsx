type AdminNoticeProps = {
  children: string
  tone?: 'default' | 'error'
  className?: string
}

const toneClasses: Record<NonNullable<AdminNoticeProps['tone']>, string> = {
  default:
    'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200',
  error:
    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200',
}

const AdminNotice = ({
  children,
  tone = 'default',
  className = '',
}: AdminNoticeProps) => {
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm font-medium ${toneClasses[tone]} ${className}`.trim()}
    >
      {children}
    </div>
  )
}

export default AdminNotice
