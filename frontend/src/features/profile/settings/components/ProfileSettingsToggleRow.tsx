import { cn } from '@/lib/utils'

type ProfileSettingsToggleRowProps = {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

const ProfileSettingsToggleRow = ({
  label,
  description,
  checked,
  onChange,
}: ProfileSettingsToggleRowProps) => (
  <label className="flex items-start justify-between gap-4 rounded-[1.4rem] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.96)_100%)] px-4 py-4 shadow-[0_18px_40px_-36px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-700 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.94)_0%,rgba(17,24,39,0.96)_100%)] dark:shadow-[0_18px_40px_-36px_rgba(2,6,23,0.8)] dark:hover:border-slate-600">
    <div>
      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
      {description ? <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p> : null}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition',
        checked
          ? 'border-sky-500 bg-sky-500 dark:border-sky-400 dark:bg-sky-400'
          : 'border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-slate-700',
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-white transition dark:bg-slate-900',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  </label>
)

export default ProfileSettingsToggleRow
