import { type ReactNode } from 'react'

type AdminPageIntroProps = {
  eyebrow?: string
  title: string
  actions?: ReactNode
  className?: string
}

const AdminPageIntro = ({
  eyebrow,
  title,
  actions,
  className = '',
}: AdminPageIntroProps) => {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`.trim()}>
      <div>
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            {eyebrow}
          </p>
        ) : null}
        <h1 className={`${eyebrow ? 'mt-2' : ''} text-2xl font-bold text-slate-900 dark:text-slate-100`.trim()}>
          {title}
        </h1>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </div>
  )
}

export default AdminPageIntro
