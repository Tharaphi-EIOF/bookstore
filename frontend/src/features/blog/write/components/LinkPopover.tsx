import { Link2, Pilcrow } from 'lucide-react'

type Props = {
  linkTextInput: string
  linkUrlInput: string
  onLinkTextInputChange: (value: string) => void
  onLinkUrlInputChange: (value: string) => void
  onApply: () => void
  onClose: () => void
}

const LinkPopover = ({
  linkTextInput,
  linkUrlInput,
  onLinkTextInputChange,
  onLinkUrlInputChange,
  onApply,
  onClose,
}: Props) => {
  return (
    <div className="border-b border-slate-200/80 bg-white/90 px-4 py-3 dark:border-slate-800/80 dark:bg-slate-900/85">
      <div className="rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.14)] dark:border-slate-700 dark:bg-slate-900">
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center">
          <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 focus-within:border-blue-500 dark:border-slate-700 dark:focus-within:border-blue-400">
            <Pilcrow className="h-4 w-4 text-slate-400" />
            <input
              value={linkTextInput}
              onChange={(event) => onLinkTextInputChange(event.target.value)}
              placeholder="Text"
              className="w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 focus-within:border-blue-500 dark:border-slate-700 dark:focus-within:border-blue-400">
            <Link2 className="h-4 w-4 text-slate-400" />
            <input
              value={linkUrlInput}
              onChange={(event) => onLinkUrlInputChange(event.target.value)}
              placeholder="Type or paste a link"
              className="w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
          </label>
          <button
            type="button"
            onClick={onApply}
            disabled={!linkUrlInput.trim()}
            className="h-11 rounded-xl px-4 text-lg font-semibold text-slate-900 transition hover:bg-slate-100 disabled:text-slate-400 dark:text-slate-100 dark:hover:bg-slate-800 dark:disabled:text-slate-500"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl px-4 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default LinkPopover
