import { Link } from 'react-router-dom'
import { Palette } from 'lucide-react'

type ProfileSettingsActionsProps = {
  canSave: boolean
  isSaving: boolean
  profilePath: string
}

const ProfileSettingsActions = ({
  canSave,
  isSaving,
  profilePath,
}: ProfileSettingsActionsProps) => {
  return (
    <div className="sticky bottom-4 z-10 rounded-[1.5rem] border border-slate-200/85 bg-white/92 p-3 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.32)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/92">
      <div className="flex items-center justify-between gap-3">
        <Link
          to={profilePath}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Back to profile
        </Link>
        <button
          type="submit"
          disabled={isSaving || !canSave}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          <Palette className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

export default ProfileSettingsActions
