import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getErrorMessage } from '@/lib/api'
import AdminNotice from '@/components/admin/AdminNotice'
import AdminPageIntro from '@/components/admin/AdminPageIntro'
import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/store/auth.store'
import {
  useCreateVendor,
  useDeleteVendor,
  usePermanentDeleteVendor,
  useRestoreVendor,
  useUpdateVendor,
  useVendors,
  type Vendor,
} from '@/features/admin/services/warehouses'
import CreateVendorPanel from '@/features/admin/vendors/components/CreateVendorPanel'
import VendorDetailPanel from '@/features/admin/vendors/components/VendorDetailPanel'
import VendorDirectorySection from '@/features/admin/vendors/components/VendorDirectorySection'
import { useTimedMessage } from '@/hooks/useTimedMessage'

const AdminVendorsPage = () => {
  // Page-level filters, selection state, and create/edit form state.
  const user = useAuthStore((state) => state.user)
  const canManageVendors =
    user?.role === 'ADMIN'
    || user?.role === 'SUPER_ADMIN'
    || hasPermission(user?.permissions, 'warehouse.vendor.manage')

  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddressInput, setShowAddressInput] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    name: true,
    contact: true,
    status: true,
    actions: true,
  })
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [isEditingVendor, setIsEditingVendor] = useState(false)
  const [vendorForm, setVendorForm] = useState({
    code: '',
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    isActive: true,
  })
  const { message, showMessage } = useTimedMessage(2600)
  const [form, setForm] = useState({
    code: '',
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    isActive: true,
  })

  const { data: vendors = [], error } = useVendors(undefined, 'active')
  const createVendor = useCreateVendor()
  const updateVendor = useUpdateVendor()
  const deleteVendor = useDeleteVendor()
  const restoreVendor = useRestoreVendor()
  const permanentDeleteVendor = usePermanentDeleteVendor()

  // Filtered directory rows and table column visibility options.
  const filteredVendors = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    return vendors.filter((vendor) => {
      const statusMatch =
        statusFilter === 'all'
        || (statusFilter === 'active' && vendor.isActive)
        || (statusFilter === 'inactive' && !vendor.isActive)
      const text = `${vendor.code} ${vendor.name} ${vendor.contactName || ''} ${vendor.email || ''} ${vendor.phone || ''}`.toLowerCase()
      const searchMatch = !keyword || text.includes(keyword)
      return statusMatch && searchMatch
    })
  }, [searchTerm, statusFilter, vendors])
  const visibleColumnCount = Object.values(visibleColumns).filter(Boolean).length

  useEffect(() => {
    if (!selectedVendor) return
    setVendorForm({
      code: selectedVendor.code,
      name: selectedVendor.name,
      contactName: selectedVendor.contactName || '',
      email: selectedVendor.email || '',
      phone: selectedVendor.phone || '',
      address: selectedVendor.address || '',
      isActive: selectedVendor.isActive,
    })
    setIsEditingVendor(false)
  }, [selectedVendor])

  // Vendor lifecycle handlers for create, edit, activate, bin, and delete.
  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageVendors) {
      showMessage('Missing permission: warehouse.vendor.manage')
      return
    }
    if (!form.code || !form.name) {
      showMessage('Code and name are required.')
      return
    }

    try {
      await createVendor.mutateAsync({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        contactName: form.contactName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        isActive: form.isActive,
      })
      setForm({
        code: '',
        name: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        isActive: true,
      })
      setIsCreatePanelOpen(false)
      showMessage('Vendor created.')
    } catch (err) {
      showMessage(getErrorMessage(err))
    }
  }

  const handleSaveVendor = async () => {
    if (!selectedVendor) return
    if (!canManageVendors) {
      showMessage('Missing permission: warehouse.vendor.manage')
      return
    }
    if (!vendorForm.code.trim() || !vendorForm.name.trim()) {
      showMessage('Code and name are required.')
      return
    }

    try {
      const updated = await updateVendor.mutateAsync({
        id: selectedVendor.id,
        data: {
          code: vendorForm.code.trim().toUpperCase(),
          name: vendorForm.name.trim(),
          contactName: vendorForm.contactName || undefined,
          email: vendorForm.email || undefined,
          phone: vendorForm.phone || undefined,
          address: vendorForm.address || undefined,
          isActive: vendorForm.isActive,
        },
      })
      setSelectedVendor(updated)
      setIsEditingVendor(false)
      showMessage('Vendor updated.')
    } catch (err) {
      showMessage(getErrorMessage(err))
    }
  }

  const handleToggleVendorStatus = async () => {
    if (!selectedVendor) return
    if (!canManageVendors) {
      showMessage('Missing permission: warehouse.vendor.manage')
      return
    }
    try {
      const updated = await updateVendor.mutateAsync({
        id: selectedVendor.id,
        data: { isActive: !selectedVendor.isActive },
      })
      setSelectedVendor(updated)
      showMessage(updated.isActive ? 'Vendor activated.' : 'Vendor set to inactive.')
    } catch (err) {
      showMessage(getErrorMessage(err))
    }
  }

  const handleDeleteVendor = async () => {
    if (!selectedVendor) return
    if (!canManageVendors) {
      showMessage('Missing permission: warehouse.vendor.manage')
      return
    }
    const confirmed = window.confirm(
      `Move vendor "${selectedVendor.name}" to bin? You can restore it later.`,
    )
    if (!confirmed) return

    try {
      await deleteVendor.mutateAsync(selectedVendor.id)
      setSelectedVendor(null)
      setIsEditingVendor(false)
      showMessage('Vendor moved to bin.')
    } catch (err) {
      showMessage(getErrorMessage(err))
    }
  }

  const handleRestoreVendor = async () => {
    if (!selectedVendor) return
    try {
      const restored = await restoreVendor.mutateAsync(selectedVendor.id)
      setSelectedVendor(restored)
      showMessage('Vendor restored from bin.')
    } catch (err) {
      showMessage(getErrorMessage(err))
    }
  }

  const handlePermanentDeleteVendor = async () => {
    if (!selectedVendor) return
    const confirmed = window.confirm(
      `Permanently delete vendor "${selectedVendor.name}"? This cannot be undone.`,
    )
    if (!confirmed) return

    try {
      await permanentDeleteVendor.mutateAsync(selectedVendor.id)
      setSelectedVendor(null)
      setIsEditingVendor(false)
      showMessage('Vendor permanently deleted.')
    } catch (err) {
      showMessage(getErrorMessage(err))
    }
  }

  return (
    <div className="surface-canvas min-h-screen space-y-6 p-8 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
      {/* Intro, messages, directory table, and vendor detail side panel. */}
      <AdminPageIntro
        eyebrow="Procurement"
        title="Vendors"
        actions={(
          <>
            <button
              type="button"
              onClick={() => setIsCreatePanelOpen(true)}
              disabled={!canManageVendors}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
            >
              <Plus className="h-4 w-4" />
              Create Vendor
            </button>
            <Link
              to="/admin/bin"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Open bin"
            >
              <Trash2 className="h-4 w-4" />
            </Link>
          </>
        )}
      />

      {message && (
        <AdminNotice className="surface-subtle border-transparent bg-transparent dark:bg-transparent">
          {message}
        </AdminNotice>
      )}
      {error && (
        <AdminNotice tone="error" className="surface-subtle">
          {getErrorMessage(error)}
        </AdminNotice>
      )}

      <VendorDirectorySection
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        filteredVendors={filteredVendors}
        visibleColumnCount={visibleColumnCount}
        onSelectVendor={setSelectedVendor}
      />
      <CreateVendorPanel
        open={isCreatePanelOpen}
        onClose={() => setIsCreatePanelOpen(false)}
        canManageVendors={canManageVendors}
        isPending={createVendor.isPending}
        showAddressInput={showAddressInput}
        setShowAddressInput={setShowAddressInput}
        form={form}
        setForm={setForm}
        onSubmit={submitCreate}
      />
      <VendorDetailPanel
        selectedVendor={selectedVendor}
        isEditingVendor={isEditingVendor}
        setIsEditingVendor={setIsEditingVendor}
        vendorForm={vendorForm}
        setVendorForm={setVendorForm}
        canManageVendors={canManageVendors}
        isUpdatePending={updateVendor.isPending}
        isDeletePending={deleteVendor.isPending}
        isRestorePending={restoreVendor.isPending}
        isPermanentDeletePending={permanentDeleteVendor.isPending}
        onClose={() => setSelectedVendor(null)}
        onSaveVendor={handleSaveVendor}
        onToggleVendorStatus={handleToggleVendorStatus}
        onDeleteVendor={handleDeleteVendor}
        onRestoreVendor={handleRestoreVendor}
        onPermanentDeleteVendor={handlePermanentDeleteVendor}
      />
      </div>
    </div>
  )
}

export default AdminVendorsPage
