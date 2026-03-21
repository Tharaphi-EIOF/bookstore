import type { Dispatch, SetStateAction } from 'react'
import ColumnVisibilityMenu from '@/components/admin/ColumnVisibilityMenu'
import { Eye } from 'lucide-react'
import AdminSurfacePanel from '@/components/admin/AdminSurfacePanel'
import AdminIconActionButton from '@/components/admin/AdminIconActionButton'
import type { Vendor } from '@/features/admin/services/warehouses'

type VendorStatusFilter = 'all' | 'active' | 'inactive'

type VendorVisibleColumns = {
  code: boolean
  name: boolean
  contact: boolean
  status: boolean
  actions: boolean
}

interface VendorDirectorySectionProps {
  searchTerm: string
  setSearchTerm: Dispatch<SetStateAction<string>>
  statusFilter: VendorStatusFilter
  setStatusFilter: Dispatch<SetStateAction<VendorStatusFilter>>
  visibleColumns: VendorVisibleColumns
  setVisibleColumns: Dispatch<SetStateAction<VendorVisibleColumns>>
  filteredVendors: Vendor[]
  visibleColumnCount: number
  onSelectVendor: (vendor: Vendor) => void
}

const columnOptions: Array<{ key: keyof VendorVisibleColumns; label: string }> = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'contact', label: 'Contact' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
]

const getVendorStatusClassName = (vendor: Vendor) => {
  if (vendor.deletedAt) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
  if (vendor.isActive) return 'bg-emerald-100 text-emerald-700'
  return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
}

const getVendorStatusLabel = (vendor: Vendor) => {
  if (vendor.deletedAt) return 'IN BIN'
  return vendor.isActive ? 'ACTIVE' : 'INACTIVE'
}

const VendorDirectorySection = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  visibleColumns,
  setVisibleColumns,
  filteredVendors,
  visibleColumnCount,
  onSelectVendor,
}: VendorDirectorySectionProps) => {
  return (
    <AdminSurfacePanel className="surface-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Vendor Directory</h2>
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Active Vendors
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by code, name, email, phone"
          className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as VendorStatusFilter)}
          className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
        <ColumnVisibilityMenu
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          options={columnOptions}
        />
      </div>
      <div className="admin-table-wrapper mt-4 overflow-auto">
        <table className="admin-table min-w-[940px] table-fixed text-sm">
          <colgroup>
            {visibleColumns.code && <col className="w-[20%]" />}
            {visibleColumns.name && <col className="w-[34%]" />}
            {visibleColumns.contact && <col className="w-[24%]" />}
            {visibleColumns.status && <col className="w-[12%]" />}
            {visibleColumns.actions && <col className="w-[10%]" />}
          </colgroup>
          <thead className="admin-table-head">
            <tr>
              {visibleColumns.code && <th className="px-3 py-2 text-left">Code</th>}
              {visibleColumns.name && <th className="px-3 py-2 text-left">Name</th>}
              {visibleColumns.contact && <th className="px-3 py-2 text-left">Contact</th>}
              {visibleColumns.status && <th className="px-3 py-2 text-left">Status</th>}
              {visibleColumns.actions && <th className="px-3 py-2 text-left">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredVendors.map((vendor) => (
              <tr
                key={vendor.id}
                className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                onClick={() => onSelectVendor(vendor)}
              >
                {visibleColumns.code && <td className="px-3 py-2 font-semibold">{vendor.code}</td>}
                {visibleColumns.name && (
                  <td className="px-3 py-2">
                    <p className="truncate">{vendor.name}</p>
                    <p className="truncate text-xs text-slate-500">{vendor.email || 'No email'}</p>
                  </td>
                )}
                {visibleColumns.contact && (
                  <td className="px-3 py-2">
                    <p className="truncate">{vendor.contactName || 'N/A'}</p>
                    <p className="text-xs text-slate-500">{vendor.phone || 'N/A'}</p>
                  </td>
                )}
                {visibleColumns.status && (
                  <td className="px-3 py-2 align-middle">
                    <span className={`rounded px-2 py-1 text-xs font-semibold ${getVendorStatusClassName(vendor)}`}>
                      {getVendorStatusLabel(vendor)}
                    </span>
                  </td>
                )}
                {visibleColumns.actions && (
                  <td className="px-3 py-2 align-middle">
                    <AdminIconActionButton
                      label="View vendor"
                      icon={<Eye className="h-4 w-4" />}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectVendor(vendor)
                      }}
                    />
                  </td>
                )}
              </tr>
            ))}
            {filteredVendors.length === 0 && (
              <tr>
                <td colSpan={visibleColumnCount} className="px-3 py-4 text-slate-500">No vendors found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminSurfacePanel>
  )
}

export default VendorDirectorySection
