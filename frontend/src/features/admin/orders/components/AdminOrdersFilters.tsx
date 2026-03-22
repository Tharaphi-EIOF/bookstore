import { motion } from 'framer-motion'
import { ChevronDown, Search } from 'lucide-react'
import ColumnVisibilityMenu from '@/components/admin/ColumnVisibilityMenu'
import AdminFilterCard from '@/components/admin/AdminFilterCard'
import type { VisibleOrderColumns } from '@/features/admin/orders/lib/orderDisplay'

type AdminOrdersFiltersProps = {
  searchTerm: string
  onSearchTermChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  dateFrom: string
  onDateFromChange: (value: string) => void
  dateTo: string
  onDateToChange: (value: string) => void
  showAdvancedFilters: boolean
  onToggleAdvancedFilters: () => void
  customerTerm: string
  onCustomerTermChange: (value: string) => void
  locationTerm: string
  onLocationTermChange: (value: string) => void
  minValue: string
  onMinValueChange: (value: string) => void
  maxValue: string
  onMaxValueChange: (value: string) => void
  visibleColumns: VisibleOrderColumns
  setVisibleColumns: React.Dispatch<React.SetStateAction<VisibleOrderColumns>>
  columnOptions: Array<{ key: keyof VisibleOrderColumns; label: string }>
}

const AdminOrdersFilters = ({
  searchTerm,
  onSearchTermChange,
  statusFilter,
  onStatusFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  customerTerm,
  onCustomerTermChange,
  locationTerm,
  onLocationTermChange,
  minValue,
  onMinValueChange,
  maxValue,
  onMaxValueChange,
  visibleColumns,
  setVisibleColumns,
  columnOptions,
}: AdminOrdersFiltersProps) => (
  <AdminFilterCard className="relative z-30 mb-6 p-4">
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search order ID"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="h-12 w-full rounded-[20px] border border-slate-200/80 bg-slate-50/80 pl-11 pr-4 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
        />
      </div>
      <div className="relative">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="h-12 w-full appearance-none rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 pr-10 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
        >
          <option value="all">Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      </div>
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => onDateFromChange(e.target.value)}
        className="h-12 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
      />
      <input
        type="date"
        value={dateTo}
        onChange={(e) => onDateToChange(e.target.value)}
        className="h-12 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
      />
      <button
        type="button"
        onClick={onToggleAdvancedFilters}
        className="h-12 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 text-left text-sm font-semibold transition-colors hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        {showAdvancedFilters ? 'Hide' : 'More'} filters
      </button>
      <ColumnVisibilityMenu
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        options={columnOptions}
      />
    </div>

    {showAdvancedFilters && (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
      >
        <input
          type="text"
          placeholder="Customer"
          value={customerTerm}
          onChange={(e) => onCustomerTermChange(e.target.value)}
          className="h-12 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
        />
        <input
          type="text"
          placeholder="Location"
          value={locationTerm}
          onChange={(e) => onLocationTermChange(e.target.value)}
          className="h-12 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
        />
        <input
          type="number"
          min="0"
          placeholder="Min value"
          value={minValue}
          onChange={(e) => onMinValueChange(e.target.value)}
          className="h-12 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
        />
        <input
          type="number"
          min="0"
          placeholder="Max value"
          value={maxValue}
          onChange={(e) => onMaxValueChange(e.target.value)}
          className="h-12 rounded-[20px] border border-slate-200/80 bg-slate-50/80 px-4 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
        />
      </motion.div>
    )}
  </AdminFilterCard>
)

export default AdminOrdersFilters
