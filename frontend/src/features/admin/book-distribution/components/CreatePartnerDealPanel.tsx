import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'
import type {
  DealFormState,
  DistributionBook,
} from '@/features/admin/book-distribution/lib/bookDistributionDisplay'

type CreatePartnerDealPanelProps = {
  open: boolean
  onClose: () => void
  dealForm: DealFormState
  onDealFormChange: (value: DealFormState) => void
  books: DistributionBook[]
  eligibleBooks: DistributionBook[]
  isCreatingDeal: boolean
  onCreateDeal: () => void
}

const inputClassName = 'h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-900'

const CreatePartnerDealPanel = ({
  open,
  onClose,
  dealForm,
  onDealFormChange,
  books,
  eligibleBooks,
  isCreatingDeal,
  onCreateDeal,
}: CreatePartnerDealPanelProps) => (
  <AdminSlideOverPanel
    open={open}
    onClose={onClose}
    kicker="Deals"
    title="Create Deal"
    description="Add a new partner consignment agreement. Ownership is automatic: deal receipts become consignment, normal catalog stock stays store-owned."
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
          type="button"
          onClick={onCreateDeal}
          disabled={isCreatingDeal}
          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300"
        >
          {isCreatingDeal ? 'Creating...' : 'Create Deal'}
        </button>
      </div>
    )}
  >
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/45">
      <input
        value={dealForm.partnerName}
        onChange={(event) => onDealFormChange({ ...dealForm, partnerName: event.target.value })}
        placeholder="Partner name"
        className={inputClassName}
      />
      <input
        value={dealForm.partnerCompany}
        onChange={(event) => onDealFormChange({ ...dealForm, partnerCompany: event.target.value })}
        placeholder="Company"
        className={inputClassName}
      />
      <input
        value={dealForm.partnerEmail}
        onChange={(event) => onDealFormChange({ ...dealForm, partnerEmail: event.target.value })}
        placeholder="Partner email"
        className={inputClassName}
      />
      <input
        type="number"
        min={0}
        max={100}
        value={dealForm.revenueSharePct}
        onChange={(event) => onDealFormChange({ ...dealForm, revenueSharePct: event.target.value })}
        placeholder="Share %"
        className={inputClassName}
      />
      <select
        value={dealForm.bookId}
        onChange={(event) => onDealFormChange({ ...dealForm, bookId: event.target.value })}
        className={inputClassName}
      >
        <option value="">No linked book yet</option>
        {eligibleBooks.slice(0, 400).map((book) => (
          <option key={book.id} value={book.id}>
            {book.title} - {book.author}
          </option>
        ))}
      </select>
      <p className="text-xs text-slate-500">
        Eligible titles: {eligibleBooks.length} of {books.length}. There is no separate ownership picker in the form.
      </p>
      <textarea
        value={dealForm.termsNote}
        onChange={(event) => onDealFormChange({ ...dealForm, termsNote: event.target.value })}
        placeholder="Terms note (cycle, payout method, shelf duration, return rules...)"
        rows={6}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900"
      />
    </div>
  </AdminSlideOverPanel>
)

export default CreatePartnerDealPanel
