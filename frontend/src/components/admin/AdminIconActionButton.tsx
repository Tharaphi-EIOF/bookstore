import type { ButtonHTMLAttributes, ReactNode } from 'react'

type AdminIconActionVariant = 'neutral' | 'success' | 'danger' | 'accent'
type AdminIconMotion = 'none' | 'spin'

type AdminIconActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  icon: ReactNode
  variant?: AdminIconActionVariant
  iconMotion?: AdminIconMotion
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

const ICON_MOTION_CLASS_NAME: Record<AdminIconMotion, string> = {
  none: 'transition-transform duration-300 ease-out motion-reduce:transform-none motion-reduce:transition-none',
  spin:
    'transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-active:rotate-180 motion-reduce:transform-none motion-reduce:transition-none',
}

const AdminIconActionButton = ({
  label,
  icon,
  variant = 'neutral',
  iconMotion = 'none',
  className = '',
  type = 'button',
  ...props
}: AdminIconActionButtonProps) => (
  <button
    type={type}
    aria-label={label}
    title={label}
    className={`group inline-flex h-10 w-10 items-center justify-center rounded-xl border shadow-[0_8px_18px_-14px_rgba(15,23,42,0.28)] transition-[transform,box-shadow,border-color,background-color,color] duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-18px_rgba(15,23,42,0.28)] focus-visible:-translate-y-0.5 focus-visible:shadow-[0_16px_32px_-18px_rgba(15,23,42,0.28)] active:translate-y-0 active:scale-[0.985] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:opacity-50 ${VARIANT_CLASS_NAME[variant]} ${className}`.trim()}
    {...props}
  >
    <span aria-hidden="true" className={ICON_MOTION_CLASS_NAME[iconMotion]}>
      {icon}
    </span>
  </button>
)

export default AdminIconActionButton
