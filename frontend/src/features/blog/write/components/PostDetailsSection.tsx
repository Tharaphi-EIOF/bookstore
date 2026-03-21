import type { Ref } from 'react'

type Props = {
  coverImage: string
  tagsInput: string
  tags: string[]
  scheduledAt: string
  scheduleInputRef?: Ref<HTMLInputElement>
  onCoverImageChange: (value: string) => void
  onTagsInputChange: (value: string) => void
  onScheduledAtChange: (value: string) => void
}

const PostDetailsSection = ({
  coverImage,
  tagsInput,
  tags,
  scheduledAt,
  scheduleInputRef,
  onCoverImageChange,
  onTagsInputChange,
  onScheduledAtChange,
}: Props) => {
  return (
    <section className="rounded-2xl border border-white/60 bg-white/45 p-4 shadow-[0_18px_50px_-45px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-700/55 dark:bg-slate-900/45">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Post Details</h2>
      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div>
          <input
            value={coverImage}
            onChange={(event) => onCoverImageChange(event.target.value)}
            placeholder="Cover image URL (optional)"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
          {coverImage.trim() && (
            <img
              src={coverImage}
              alt="Cover preview"
              className="mt-3 aspect-[16/10] w-full rounded-xl border border-slate-200 object-cover dark:border-slate-700"
            />
          )}
        </div>
        <div>
          <input
            value={tagsInput}
            onChange={(event) => onTagsInputChange(event.target.value)}
            placeholder="Tags (comma separated)"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.slice(0, 10).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {tag}
              </span>
            ))}
            {tags.length === 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">No tags yet.</span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-slate-200/80 bg-white/80 p-3 dark:border-slate-700/80 dark:bg-slate-900/70">
        <label className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Schedule publish</span>
          <input
            ref={scheduleInputRef}
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => onScheduledAtChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-slate-600"
          />
        </label>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Scheduling saves as draft with your target time. Auto-publish is not enabled yet.
        </p>
      </div>
    </section>
  )
}

export default PostDetailsSection
