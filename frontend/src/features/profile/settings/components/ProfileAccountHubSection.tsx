import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const accountHubLinks = [
  { to: '/notifications', label: 'Notifications' },
  { to: '/library', label: 'Library & saved items' },
  { to: '/reading-insights', label: 'Reading insights' },
]

const ProfileAccountHubSection = () => (
  <div className="grid gap-3 md:grid-cols-3">
    {accountHubLinks.map((link) => (
      <Link
        key={link.to}
        to={link.to}
        className="rounded-2xl border border-slate-200 bg-slate-50/85 px-4 py-4 text-sm font-medium text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900"
      >
        <div className="flex items-center justify-between gap-3">
          <span>{link.label}</span>
          <ArrowRight className="h-4 w-4 text-slate-400" />
        </div>
      </Link>
    ))}
  </div>
)

export default ProfileAccountHubSection
