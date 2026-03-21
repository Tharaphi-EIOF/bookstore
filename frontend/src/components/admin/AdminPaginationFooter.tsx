type AdminPaginationFooterProps = {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
  className?: string
}

const AdminPaginationFooter = ({
  page,
  totalPages,
  onPrev,
  onNext,
  className = '',
}: AdminPaginationFooterProps) => {
  return (
    <div
      className={`flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm dark:border-slate-800 dark:bg-slate-950 ${className}`.trim()}
    >
      <p className="text-slate-500">Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={onPrev}
          className="inline-flex items-center justify-center rounded-[18px] border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Prev
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={onNext}
          className="inline-flex items-center justify-center rounded-[18px] border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default AdminPaginationFooter
