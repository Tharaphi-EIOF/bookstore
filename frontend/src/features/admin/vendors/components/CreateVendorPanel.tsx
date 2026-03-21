import type { Dispatch, FormEventHandler, SetStateAction } from 'react'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'

type VendorCreateFormState = {
  code: string
  name: string
  contactName: string
  email: string
  phone: string
  address: string
  isActive: boolean
}

interface CreateVendorPanelProps {
  open: boolean
  onClose: () => void
  canManageVendors: boolean
  isPending: boolean
  showAddressInput: boolean
  setShowAddressInput: Dispatch<SetStateAction<boolean>>
  form: VendorCreateFormState
  setForm: Dispatch<SetStateAction<VendorCreateFormState>>
  onSubmit: FormEventHandler<HTMLFormElement>
}

const CreateVendorPanel = ({
  open,
  onClose,
  canManageVendors,
  isPending,
  showAddressInput,
  setShowAddressInput,
  form,
  setForm,
  onSubmit,
}: CreateVendorPanelProps) => {
  return (
    <AdminSlideOverPanel
      open={open}
      onClose={onClose}
      kicker="Vendors"
      title="Create Vendor"
      description="Add a new approved supplier source."
      footer={(
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-widest transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-vendor-form"
            disabled={isPending || !canManageVendors}
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
          >
            {isPending ? 'Creating...' : 'Create Vendor'}
          </button>
        </div>
      )}
    >
      <form
        id="create-vendor-form"
        onSubmit={onSubmit}
        className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/45"
      >
        <input
          value={form.code}
          onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
          placeholder="Code"
          className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
        />
        <input
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Vendor name"
          className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
        />
        <input
          value={form.contactName}
          onChange={(e) => setForm((prev) => ({ ...prev, contactName: e.target.value }))}
          placeholder="Contact name"
          className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
        />
        <input
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="Email"
          className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
        />
        <input
          value={form.phone}
          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          placeholder="Phone"
          className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900"
        />
        <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
          />
          Active vendor
        </label>
        <button
          type="button"
          onClick={() => setShowAddressInput((prev) => !prev)}
          className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {showAddressInput ? 'Hide Address' : 'Add Address'}
        </button>
        {showAddressInput && (
          <textarea
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
            placeholder="Address"
            rows={3}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900"
          />
        )}
      </form>
    </AdminSlideOverPanel>
  )
}

export default CreateVendorPanel
