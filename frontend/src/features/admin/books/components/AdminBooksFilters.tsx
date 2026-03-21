import { ChevronDown, Download, Search } from 'lucide-react'
import ColumnVisibilityMenu from '@/components/admin/ColumnVisibilityMenu'

type VisibleColumns = {
  title: boolean
  author: boolean
  categories: boolean
  isbn: boolean
  price: boolean
  stock: boolean
  actions: boolean
}

type ColumnOption = { key: keyof VisibleColumns; label: string }

interface AdminBooksFiltersProps {
  searchTerm: string
  stockFilter: 'ALL' | 'IN' | 'LOW' | 'OUT'
  categoryFilter: string
  genreFilter: string
  allCategories: string[]
  allGenres: string[]
  visibleColumns: VisibleColumns
  setVisibleColumns: React.Dispatch<React.SetStateAction<VisibleColumns>>
  columnOptions: ColumnOption[]
  csvCount: number
  onSearchChange: (value: string) => void
  onStockChange: (value: 'ALL' | 'IN' | 'LOW' | 'OUT') => void
  onCategoryChange: (value: string) => void
  onGenreChange: (value: string) => void
  onExportCsv: () => void
}

const AdminBooksFilters = ({
  searchTerm,
  stockFilter,
  categoryFilter,
  genreFilter,
  allCategories,
  allGenres,
  visibleColumns,
  setVisibleColumns,
  columnOptions,
  csvCount,
  onSearchChange,
  onStockChange,
  onCategoryChange,
  onGenreChange,
  onExportCsv,
}: AdminBooksFiltersProps) => {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))]">
      <div className="relative md:col-span-2 xl:col-span-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-12 w-full rounded-[20px] border border-slate-200/80 bg-slate-50/80 pl-11 pr-4 text-base text-slate-800 transition focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-slate-700 dark:focus:ring-slate-800"
              placeholder="Search title, author, ISBN"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
        </div>

      <div className="relative">
        <select
          value={stockFilter}
          onChange={(e) => onStockChange(e.target.value as 'ALL' | 'IN' | 'LOW' | 'OUT')}
          className="h-12 w-full appearance-none rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 pr-10 text-sm font-medium text-slate-700 transition focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-700 dark:focus:ring-slate-800"
        >
          <option value="ALL">Status</option>
          <option value="IN">In Stock</option>
          <option value="LOW">Low Stock</option>
          <option value="OUT">Out of Stock</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>

      <div className="relative">
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="h-12 w-full appearance-none rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 pr-10 text-sm font-medium text-slate-700 transition focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-700 dark:focus:ring-slate-800"
        >
          <option value="ALL">Category</option>
          {allCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>

      <div className="relative">
        <select
          value={genreFilter}
          onChange={(e) => onGenreChange(e.target.value)}
          className="h-12 w-full appearance-none rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 pr-10 text-sm font-medium text-slate-700 transition focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-700 dark:focus:ring-slate-800"
        >
          <option value="ALL">Genre</option>
          {allGenres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 md:col-span-2 xl:col-span-2">
        <ColumnVisibilityMenu
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          options={columnOptions}
          className="z-20"
        />

        <button
          type="button"
          onClick={onExportCsv}
          disabled={csvCount === 0}
          className="inline-flex h-12 items-center gap-2 rounded-[20px] border border-slate-200/80 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>
    </div>
  )
}

export default AdminBooksFilters
