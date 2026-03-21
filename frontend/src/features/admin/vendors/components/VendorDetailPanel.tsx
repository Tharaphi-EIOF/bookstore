import type { Dispatch, SetStateAction } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Pencil, Power, Trash2, X } from 'lucide-react'
import type { Vendor } from '@/features/admin/services/warehouses'

type VendorFormState = {
  code: string
  name: string
  contactName: string
  email: string
  phone: string
  address: string
  isActive: boolean
}

interface VendorDetailPanelProps {
  selectedVendor: Vendor | null
  isEditingVendor: boolean
  setIsEditingVendor: Dispatch<SetStateAction<boolean>>
  vendorForm: VendorFormState
  setVendorForm: Dispatch<SetStateAction<VendorFormState>>
  canManageVendors: boolean
  isUpdatePending: boolean
  isDeletePending: boolean
  isRestorePending: boolean
  isPermanentDeletePending: boolean
  onClose: () => void
  onSaveVendor: () => void
  onToggleVendorStatus: () => void
  onDeleteVendor: () => void
  onRestoreVendor: () => void
  onPermanentDeleteVendor: () => void
}

const getVendorStatusLabel = (vendor: Vendor) => {
  if (vendor.deletedAt) return 'IN BIN'
  return vendor.isActive ? 'ACTIVE' : 'INACTIVE'
}

const VendorDetailPanel = ({
  selectedVendor,
  isEditingVendor,
  setIsEditingVendor,
  vendorForm,
  setVendorForm,
  canManageVendors,
  isUpdatePending,
  isDeletePending,
  isRestorePending,
  isPermanentDeletePending,
  onClose,
  onSaveVendor,
  onToggleVendorStatus,
  onDeleteVendor,
  onRestoreVendor,
  onPermanentDeleteVendor,
}: VendorDetailPanelProps) => {
  return (
    <AnimatePresence>
      {selectedVendor && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/25"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="fixed right-4 top-16 z-50 w-[min(560px,calc(100vw-2rem))] max-h-[82vh] overflow-y-auto rounded-2xl border border-slate-200/70 bg-white/85 p-5 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:right-6"
            initial={{ opacity: 0, x: 36, scale: 0.99 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.99 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Vendor Detail</p>
                <h3 className="mt-1 text-xl font-bold">{selectedVendor.name}</h3>
                <p className="text-xs text-slate-500">{selectedVendor.code}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-300 p-2 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!isEditingVendor ? (
              <dl className="mt-4 space-y-3 text-sm">
                <div className="surface-subtle p-3">
                  <dt className="text-xs uppercase tracking-widest text-slate-500">Contact</dt>
                  <dd className="mt-1 font-medium">{selectedVendor.contactName || 'N/A'}</dd>
                </div>
                <div className="surface-subtle p-3">
                  <dt className="text-xs uppercase tracking-widest text-slate-500">Email</dt>
                  <dd className="mt-1">{selectedVendor.email || 'N/A'}</dd>
                </div>
                <div className="surface-subtle p-3">
                  <dt className="text-xs uppercase tracking-widest text-slate-500">Phone</dt>
                  <dd className="mt-1">{selectedVendor.phone || 'N/A'}</dd>
                </div>
                <div className="surface-subtle p-3">
                  <dt className="text-xs uppercase tracking-widest text-slate-500">Address</dt>
                  <dd className="mt-1">{selectedVendor.address || 'No address provided'}</dd>
                </div>
                <div className="surface-subtle p-3">
                  <dt className="text-xs uppercase tracking-widest text-slate-500">Status</dt>
                  <dd className="mt-1 font-semibold">{getVendorStatusLabel(selectedVendor)}</dd>
                </div>
              </dl>
            ) : (
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <label className="space-y-1 sm:col-span-1">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Code</span>
                  <input
                    value={vendorForm.code}
                    onChange={(e) => setVendorForm((prev) => ({ ...prev, code: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70"
                  />
                </label>
                <label className="space-y-1 sm:col-span-1">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Name</span>
                  <input
                    value={vendorForm.name}
                    onChange={(e) => setVendorForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70"
                  />
                </label>
                <label className="space-y-1 sm:col-span-1">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Contact</span>
                  <input
                    value={vendorForm.contactName}
                    onChange={(e) => setVendorForm((prev) => ({ ...prev, contactName: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70"
                  />
                </label>
                <label className="space-y-1 sm:col-span-1">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Email</span>
                  <input
                    value={vendorForm.email}
                    onChange={(e) => setVendorForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70"
                  />
                </label>
                <label className="space-y-1 sm:col-span-1">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Phone</span>
                  <input
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70"
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Address</span>
                  <textarea
                    rows={2}
                    value={vendorForm.address}
                    onChange={(e) => setVendorForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70"
                  />
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-300 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={vendorForm.isActive}
                    onChange={(e) => setVendorForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  />
                  Active vendor
                </label>
              </div>
            )}

            {canManageVendors && (
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-200/70 pt-4 dark:border-slate-800">
                {!isEditingVendor ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditingVendor(true)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    {!selectedVendor.deletedAt ? (
                      <>
                        <button
                          type="button"
                          onClick={onToggleVendorStatus}
                          disabled={isUpdatePending}
                          className="inline-flex items-center gap-2 rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
                        >
                          <Power className="h-3.5 w-3.5" />
                          {selectedVendor.isActive ? 'Set Inactive' : 'Set Active'}
                        </button>
                        <button
                          type="button"
                          onClick={onDeleteVendor}
                          disabled={isDeletePending}
                          className="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Move To Bin
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={onRestoreVendor}
                          disabled={isRestorePending}
                          className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={onPermanentDeleteVendor}
                          disabled={isPermanentDeletePending}
                          className="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-900/30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete Permanently
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={onSaveVendor}
                      disabled={isUpdatePending}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-50 dark:bg-amber-400 dark:text-slate-900"
                    >
                      {isUpdatePending ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingVendor(false)}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export default VendorDetailPanel
