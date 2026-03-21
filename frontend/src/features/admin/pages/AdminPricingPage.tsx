import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { getErrorMessage } from '@/lib/api'
import {
  useAdminPricingSettings,
  useUpdateAdminPricingSettings,
} from '@/features/admin/services/pricing-settings'
import { useTimedMessage } from '@/hooks/useTimedMessage'
import { useAuthStore } from '@/store/auth.store'
import Button from '@/components/ui/Button'
import AdminNotice from '@/components/admin/AdminNotice'
import AdminPageIntro from '@/components/admin/AdminPageIntro'

const AdminPricingPage = () => {
  const user = useAuthStore((state) => state.user)
  const canEditPricingSettings = user?.role === 'SUPER_ADMIN'
  const { message, showMessage } = useTimedMessage(2600)
  const {
    data: pricingSettings,
    isLoading,
    error,
  } = useAdminPricingSettings()
  const updatePricingSettings = useUpdateAdminPricingSettings()
  const [form, setForm] = useState({
    taxRate: '10',
    vendorMarkupType: 'PERCENT' as 'PERCENT' | 'FIXED',
    vendorMarkupValue: '0',
    applyPricingOnReceive: true,
  })

  useEffect(() => {
    if (!pricingSettings) return
    setForm({
      taxRate: String(Number(pricingSettings.taxRate)),
      vendorMarkupType: pricingSettings.vendorMarkupType,
      vendorMarkupValue: String(Number(pricingSettings.vendorMarkupValue)),
      applyPricingOnReceive: pricingSettings.applyPricingOnReceive,
    })
  }, [pricingSettings])

  const savePricingSettings = async () => {
    try {
      const taxRate = Number(form.taxRate)
      const vendorMarkupValue = Number(form.vendorMarkupValue)

      if (Number.isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
        throw new Error('Tax rate must be between 0 and 100.')
      }
      if (Number.isNaN(vendorMarkupValue) || vendorMarkupValue < 0) {
        throw new Error('Markup value must be 0 or greater.')
      }

      await updatePricingSettings.mutateAsync({
        taxRate,
        vendorMarkupType: form.vendorMarkupType,
        vendorMarkupValue,
        applyPricingOnReceive: form.applyPricingOnReceive,
      })
      showMessage('Pricing rules updated.')
    } catch (err) {
      showMessage(getErrorMessage(err))
    }
  }

  return (
    <div className="surface-canvas min-h-screen p-8 dark:text-slate-100">
      <div className="mx-auto max-w-4xl space-y-4">
        <AdminPageIntro
          eyebrow="Commerce"
          title="Pricing"
          actions={(
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              {canEditPricingSettings ? 'Super Admin only' : 'Read-only'}
            </span>
          )}
        />

        {message && (
          <AdminNotice>{message}</AdminNotice>
        )}
        {error && (
          <AdminNotice className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-200">
            {getErrorMessage(error)}
          </AdminNotice>
        )}

        <section className="surface-panel space-y-4 p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Checkout Tax</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Applies a tax percentage to customer checkout totals.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Vendor Price Suggestion</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Suggests a retail price from vendor cost when purchase orders are received.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Tax Rate %</span>
              <input
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={form.taxRate}
                onChange={(e) => setForm((prev) => ({ ...prev, taxRate: e.target.value }))}
                disabled={!canEditPricingSettings || isLoading}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Markup Type</span>
              <select
                value={form.vendorMarkupType}
                onChange={(e) => setForm((prev) => ({ ...prev, vendorMarkupType: e.target.value as 'PERCENT' | 'FIXED' }))}
                disabled={!canEditPricingSettings || isLoading}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="PERCENT">Percent</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Markup Value</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.vendorMarkupValue}
                onChange={(e) => setForm((prev) => ({ ...prev, vendorMarkupValue: e.target.value }))}
                disabled={!canEditPricingSettings || isLoading}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={form.applyPricingOnReceive}
                onChange={(e) => setForm((prev) => ({ ...prev, applyPricingOnReceive: e.target.checked }))}
                disabled={!canEditPricingSettings || isLoading}
                className="mt-1"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Suggest Price On Receive</p>
                <p className="mt-1 text-sm text-slate-500">
                  Pre-fills received items with a markup-based retail price. Staff can still review each item before saving.
                </p>
              </div>
            </label>
            <Button
              type="button"
              onClick={() => void savePricingSettings()}
              disabled={!canEditPricingSettings || updatePricingSettings.isPending || isLoading}
              variant="secondary"
              size="md"
              className="inline-flex items-center gap-2 self-end disabled:opacity-60 md:self-auto"
            >
              <Save className="h-3.5 w-3.5" />
              {updatePricingSettings.isPending ? 'Saving...' : 'Save Pricing'}
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AdminPricingPage
