import type {
  DistributionBook,
  LocationCell,
  OwnershipFilter,
  ViewMode,
} from '@/features/admin/book-distribution/lib/bookDistributionDisplay'

type DistributionMatrixSectionProps = {
  search: string
  onSearchChange: (value: string) => void
  selectedLocationKey: string
  onSelectedLocationKeyChange: (value: string) => void
  ownershipFilter: OwnershipFilter
  onOwnershipFilterChange: (value: OwnershipFilter) => void
  sortBy: 'title' | 'author' | 'isbn' | 'stock'
  onSortByChange: (value: 'title' | 'author' | 'isbn' | 'stock') => void
  sortDir: 'asc' | 'desc'
  onSortDirChange: (value: 'asc' | 'desc') => void
  pageSize: number
  onPageSizeChange: (value: number) => void
  page: number
  totalPages: number
  pageNumbers: number[]
  startRow: number
  endRow: number
  totalResults: number
  viewMode: ViewMode
  onViewModeChange: (value: ViewMode) => void
  locations: LocationCell[]
  visibleLocations: LocationCell[]
  pagedBooks: DistributionBook[]
  allLocations: LocationCell[]
  stockDistributionMap: Record<string, Record<string, number>>
  maxVisibleStock: number
  isBooksLoading: boolean
  isDistributionLoading: boolean
  onPageChange: (page: number) => void
  onPrevPage: () => void
  onNextPage: () => void
}

const DistributionMatrixSection = ({
  search,
  onSearchChange,
  selectedLocationKey,
  onSelectedLocationKeyChange,
  ownershipFilter,
  onOwnershipFilterChange,
  sortBy,
  onSortByChange,
  sortDir,
  onSortDirChange,
  pageSize,
  onPageSizeChange,
  page,
  totalPages,
  pageNumbers,
  startRow,
  endRow,
  totalResults,
  viewMode,
  onViewModeChange,
  locations,
  visibleLocations,
  pagedBooks,
  allLocations,
  stockDistributionMap,
  maxVisibleStock,
  isBooksLoading,
  isDistributionLoading,
  onPageChange,
  onPrevPage,
  onNextPage,
}: DistributionMatrixSectionProps) => (
  <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 dark:border-slate-800 dark:bg-slate-900/90">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Distribution Matrix</h2>
      <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
        <button
          type="button"
          onClick={() => onViewModeChange('table')}
          className={`rounded-md px-2 py-1 text-xs font-semibold transition-all duration-150 ${
            viewMode === 'table'
              ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900'
              : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          Table
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('heatmap')}
          className={`rounded-md px-2 py-1 text-xs font-semibold transition-all duration-150 ${
            viewMode === 'heatmap'
              ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900'
              : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          Heatmap
        </button>
      </div>
    </div>

    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      <input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by title, author, or ISBN"
        className="h-11 w-full rounded-lg border px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
      <select
        value={selectedLocationKey}
        onChange={(event) => onSelectedLocationKeyChange(event.target.value)}
        className="h-11 rounded-lg border px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <option value="">All locations</option>
        {locations.map((location) => (
          <option key={location.mapKey} value={location.mapKey}>
            {location.type === 'warehouse' ? 'WH' : 'Store'} • {location.name} ({location.code})
          </option>
        ))}
      </select>
    </div>

    <div className="mt-2 grid gap-2 sm:grid-cols-5">
      <select
        value={ownershipFilter}
        onChange={(event) => onOwnershipFilterChange(event.target.value as OwnershipFilter)}
        className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <option value="all">Ownership: All</option>
        <option value="owned">Ownership: Store Owned</option>
        <option value="consignment">Ownership: Consignment</option>
        <option value="mixed">Ownership: Mixed</option>
      </select>
      <select
        value={sortBy}
        onChange={(event) => onSortByChange(event.target.value as 'title' | 'author' | 'isbn' | 'stock')}
        className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <option value="title">Sort: Title</option>
        <option value="author">Sort: Author</option>
        <option value="isbn">Sort: ISBN</option>
        <option value="stock">Sort: Network Stock</option>
      </select>
      <select
        value={sortDir}
        onChange={(event) => onSortDirChange(event.target.value as 'asc' | 'desc')}
        className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <option value="asc">Order: Ascending</option>
        <option value="desc">Order: Descending</option>
      </select>
      <select
        value={String(pageSize)}
        onChange={(event) => onPageSizeChange(Number(event.target.value))}
        className="rounded-lg border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <option value="10">10 / page</option>
        <option value="25">25 / page</option>
        <option value="50">50 / page</option>
      </select>
      <div className="rounded-lg border px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
        {totalResults} result(s)
      </div>
    </div>

    <div className="admin-table-wrapper relative mt-4 max-h-[560px] overflow-auto">
      <table className="admin-table min-w-full border-separate border-spacing-0 text-sm">
        <thead className="admin-table-head">
          <tr>
            <th className="sticky left-0 top-0 z-30 min-w-[260px] border-b border-slate-200 bg-slate-50 px-3 py-2 text-left dark:border-slate-700 dark:bg-slate-900">Book</th>
            <th className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 px-3 py-2 text-left dark:border-slate-700 dark:bg-slate-900">Network Total</th>
            {visibleLocations.map((location) => (
              <th key={location.mapKey} className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50 px-3 py-2 text-left dark:border-slate-700 dark:bg-slate-900">
                {location.code}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pagedBooks.map((book) => {
            const networkTotal = allLocations.reduce(
              (sum, location) => sum + (stockDistributionMap[book.id]?.[location.mapKey] ?? 0),
              0,
            )

            return (
              <tr key={book.id} className="border-b border-slate-100 dark:border-slate-800">
                <td className="sticky left-0 z-10 border-r border-slate-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                  <p className="font-medium">{book.title}</p>
                  <p className="text-xs text-slate-500">{book.author}</p>
                  <p className="text-xs text-slate-400">{book.isbn}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                        book.ownershipLabel === 'owned'
                          ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                          : book.ownershipLabel === 'consignment'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200'
                            : book.ownershipLabel === 'mixed'
                              ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {book.ownershipLabel ?? 'owned'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Owned {book.ownedQuantity ?? 0} • Consignment {book.consignmentQuantity ?? 0}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 font-semibold">{networkTotal}</td>
                {visibleLocations.map((location) => {
                  const value = stockDistributionMap[book.id]?.[location.mapKey] ?? 0
                  const intensity = Math.max(0.08, value / maxVisibleStock)
                  return (
                    <td
                      key={`${book.id}:${location.mapKey}`}
                      className={`px-3 py-2 ${viewMode === 'heatmap' ? 'font-semibold' : ''}`}
                      style={viewMode === 'heatmap'
                        ? {
                            background: `linear-gradient(90deg, rgba(59,130,246,${Math.min(intensity, 0.7)}) 0%, rgba(59,130,246,${Math.min(intensity, 0.28)}) 100%)`,
                          }
                        : undefined}
                    >
                      {value}
                    </td>
                  )
                })}
              </tr>
            )
          })}
          {!isBooksLoading && !isDistributionLoading && totalResults === 0 && (
            <tr>
              <td colSpan={2 + visibleLocations.length} className="px-3 py-4 text-slate-500">
                No distribution data found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500">
        Showing {startRow}-{endRow} of {totalResults} • Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className="rounded border px-3 py-1 text-sm transition-all duration-150 disabled:opacity-50 dark:border-slate-700"
        >
          First
        </button>
        <button
          type="button"
          onClick={onPrevPage}
          disabled={page <= 1}
          className="rounded border px-3 py-1 text-sm transition-all duration-150 disabled:opacity-50 dark:border-slate-700"
        >
          Previous
        </button>
        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={`rounded border px-3 py-1 text-sm transition-all duration-150 dark:border-slate-700 ${
              pageNumber === page ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : ''
            }`}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          onClick={onNextPage}
          disabled={page >= totalPages}
          className="rounded border px-3 py-1 text-sm transition-all duration-150 disabled:opacity-50 dark:border-slate-700"
        >
          Next
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="rounded border px-3 py-1 text-sm transition-all duration-150 disabled:opacity-50 dark:border-slate-700"
        >
          Last
        </button>
      </div>
    </div>
  </div>
)

export default DistributionMatrixSection
