import { ListPlus, X } from 'lucide-react'
import type { LibraryList } from '@/lib/libraryLists'
import { cn } from '@/lib/utils'
import type {
  ActiveLibraryFilter,
  LibraryCollectionFilter,
  LibraryFilterMeta,
  LibraryItem,
  LibraryStatusFilter,
} from '@/features/library/components/types'

type LibraryFilterPanelProps = {
  activeFilter: ActiveLibraryFilter
  allBooks: LibraryItem[]
  collectionCounts: Record<LibraryCollectionFilter, number>
  collectionMeta: Record<LibraryCollectionFilter, LibraryFilterMeta>
  counts: Record<LibraryStatusFilter, number>
  customLists: LibraryList[]
  isOpen: boolean
  onClose: () => void
  onSelectFilter: (filter: ActiveLibraryFilter) => void
  statusMeta: Record<LibraryStatusFilter, LibraryFilterMeta>
}

const LibraryFilterPanel = ({
  activeFilter,
  allBooks,
  collectionCounts,
  collectionMeta,
  counts,
  customLists,
  isOpen,
  onClose,
  onSelectFilter,
  statusMeta,
}: LibraryFilterPanelProps) => {
  return (
    <div
      className={cn(
        'origin-top overflow-hidden transition-[max-height,opacity,transform,margin] duration-400 ease-out will-change-[max-height,opacity,transform]',
        isOpen
          ? 'mb-6 max-h-[560px] translate-y-0 opacity-100'
          : 'pointer-events-none mb-0 max-h-0 -translate-y-1 opacity-0',
      )}
    >
      <div
        className={cn(
          'rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition-transform duration-400 ease-out dark:border-white/10 dark:bg-white/[0.03]',
          isOpen ? 'translate-y-0' : '-translate-y-2',
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Filter library</p>
          <button
            type="button"
            onClick={onClose}
            className="tone-hover-gold inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:text-slate-900 dark:border-white/15 dark:text-slate-300 dark:hover:text-white"
            aria-label="Close filters"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">By status</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(statusMeta) as LibraryStatusFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => onSelectFilter({ type: 'status', value: filter })}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition',
                  activeFilter.type === 'status' && activeFilter.value === filter
                    ? 'border-slate-300 bg-white text-slate-900 dark:border-white/35 dark:bg-white/[0.12] dark:text-white'
                    : 'border-slate-300/80 text-slate-600 hover:border-slate-400 dark:border-white/15 dark:text-slate-300 dark:hover:border-amber-300/40 dark:hover:text-amber-100',
                )}
              >
                {statusMeta[filter].icon}
                {statusMeta[filter].label}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] dark:bg-white/10">{counts[filter]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">By collection</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(collectionMeta) as LibraryCollectionFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => onSelectFilter({ type: 'collection', value: filter })}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition',
                  activeFilter.type === 'collection' && activeFilter.value === filter
                    ? 'border-slate-300 bg-white text-slate-900 dark:border-white/35 dark:bg-white/[0.12] dark:text-white'
                    : 'border-slate-300/80 text-slate-600 hover:border-slate-400 dark:border-white/15 dark:text-slate-300 dark:hover:border-amber-300/40 dark:hover:text-amber-100',
                )}
              >
                {collectionMeta[filter].icon}
                {collectionMeta[filter].label}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] dark:bg-white/10">{collectionCounts[filter]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">By your lists</p>
          <div className="flex flex-wrap gap-2">
            {customLists.map((list) => {
              const listCount = allBooks.filter((item) => list.bookIds.includes(item.bookId)).length
              return (
                <button
                  key={list.name}
                  type="button"
                  onClick={() => onSelectFilter({ type: 'list', value: list.name })}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition',
                    activeFilter.type === 'list' && activeFilter.value === list.name
                      ? 'border-slate-300 bg-white text-slate-900 dark:border-white/35 dark:bg-white/[0.12] dark:text-white'
                      : 'border-slate-300/80 text-slate-600 hover:border-slate-400 dark:border-white/15 dark:text-slate-300 dark:hover:border-amber-300/40 dark:hover:text-amber-100',
                  )}
                >
                  <ListPlus className="h-3.5 w-3.5" />
                  {list.name}
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] dark:bg-white/10">{listCount}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LibraryFilterPanel
