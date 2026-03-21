import type { ButtonHTMLAttributes, ReactNode } from 'react'

type AdminIconActionVariant = 'neutral' | 'success' | 'danger' | 'accent'

type AdminIconActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  icon: ReactNode
  variant?: AdminIconActionVariant
}

const VARIANT_CLASS_NAME: Record<AdminIconActionVariant, string> = {
  neutral:
    'border-slate-200 bg-white/80 text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200',
  success:
    'border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300',
  danger:
    'border-rose-200 bg-rose-50/70 text-rose-700 hover:border-rose-300 hover:bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300',
  accent:
    'border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-300',
}

const AdminIconActionButton = ({
  label,
  icon,
  variant = 'neutral',
  className = '',
  type = 'button',
  ...props
}: AdminIconActionButtonProps) => (
  <button
    type={type}
    aria-label={label}
    title={label}
    className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASS_NAME[variant]} ${className}`.trim()}
    {...props}
  >
    {icon}
  </button>
)

export default AdminIconActionButton
